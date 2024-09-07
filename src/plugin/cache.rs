// Copyright 2024 Tree xie.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

use super::{
    get_hash_key, get_step_conf, get_str_conf, get_str_slice_conf, Error,
    Plugin, Result,
};
use crate::cache::{new_file_cache, new_tiny_ufo_cache, HttpCache};
use crate::config::{
    get_current_config, PluginCategory, PluginConf, PluginStep,
};
use crate::http_extra::HttpResponse;
use crate::state::State;
use crate::util;
use async_trait::async_trait;
use bytes::{BufMut, Bytes, BytesMut};
use bytesize::ByteSize;
use http::{Method, StatusCode};
use humantime::parse_duration;
use once_cell::sync::{Lazy, OnceCell};
use pingora::cache::eviction::simple_lru::Manager;
use pingora::cache::eviction::EvictionManager;
use pingora::cache::key::CacheHashKey;
use pingora::cache::lock::CacheLock;
use pingora::cache::predictor::{CacheablePredictor, Predictor};
use pingora::proxy::Session;
use std::str::FromStr;
use std::time::Duration;
use tracing::debug;

// meomory limit size
const MAX_MEMORY_SIZE: usize = 100 * 1024 * 1024;
static CACHE_BACKEND: OnceCell<HttpCache> = OnceCell::new();
static PREDICTOR: OnceCell<Predictor<32>> = OnceCell::new();
static EVICTION_MANAGER: OnceCell<Manager> = OnceCell::new();
static CACHE_LOCK_ONE_SECOND: OnceCell<CacheLock> = OnceCell::new();

pub struct Cache {
    plugin_step: PluginStep,
    eviction: Option<&'static (dyn EvictionManager + Sync)>,
    predictor: Option<&'static (dyn CacheablePredictor + Sync)>,
    lock: Option<&'static CacheLock>,
    http_cache: &'static HttpCache,
    max_file_size: usize,
    max_ttl: Option<Duration>,
    namespace: Option<String>,
    headers: Option<Vec<String>>,
    purge_ip_rules: util::IpRules,
    hash_value: String,
}

fn get_cache_backend() -> Result<&'static HttpCache> {
    // get global cache backend
    CACHE_BACKEND.get_or_try_init(|| {
        let basic_conf = &get_current_config().basic;
        let size = if let Some(cache_max_size) = basic_conf.cache_max_size {
            cache_max_size.as_u64() as usize
        } else {
            MAX_MEMORY_SIZE
        };
        // file cache
        let cache = if let Some(dir) = &basic_conf.cache_directory {
            new_file_cache(dir.as_str()).map_err(|e| Error::Invalid {
                category: "cache_backend".to_string(),
                message: e.to_string(),
            })?
        } else {
            // tiny ufo cache
            new_tiny_ufo_cache(size.min(ByteSize::gb(1).as_u64() as usize))
        };
        Ok(cache)
    })
}

fn get_eviction_manager() -> &'static Manager {
    EVICTION_MANAGER.get_or_init(|| {
        let size = if let Some(cache_max_size) =
            get_current_config().basic.cache_max_size
        {
            cache_max_size.as_u64() as usize
        } else {
            MAX_MEMORY_SIZE
        };
        Manager::new(size)
    })
}

fn get_cache_lock(lock: Duration) -> Option<&'static CacheLock> {
    match lock.as_secs() {
        1 => Some(
            CACHE_LOCK_ONE_SECOND
                .get_or_init(|| CacheLock::new(Duration::from_secs(1))),
        ),
        2 => Some(
            CACHE_LOCK_ONE_SECOND
                .get_or_init(|| CacheLock::new(Duration::from_secs(2))),
        ),
        3 => Some(
            CACHE_LOCK_ONE_SECOND
                .get_or_init(|| CacheLock::new(Duration::from_secs(3))),
        ),
        _ => None,
    }
}

fn get_predictor() -> &'static (dyn CacheablePredictor + Sync) {
    PREDICTOR.get_or_init(|| Predictor::new(128, None))
}

impl TryFrom<&PluginConf> for Cache {
    type Error = Error;
    fn try_from(value: &PluginConf) -> Result<Self> {
        let hash_value = get_hash_key(value);
        let cache = get_cache_backend()?;
        let eviction = if value.contains_key("eviction") {
            let eviction = get_eviction_manager();
            Some(eviction as &'static (dyn EvictionManager + Sync))
        } else {
            None
        };

        let step = get_step_conf(value);

        let lock = get_str_conf(value, "lock");
        let lock = if !lock.is_empty() {
            parse_duration(&lock).map_err(|e| Error::Invalid {
                category: PluginCategory::Cache.to_string(),
                message: e.to_string(),
            })?
        } else {
            Duration::from_secs(1)
        };

        let max_ttl = get_str_conf(value, "max_ttl");
        let max_ttl = if !max_ttl.is_empty() {
            Some(parse_duration(&max_ttl).map_err(|e| Error::Invalid {
                category: PluginCategory::Cache.to_string(),
                message: e.to_string(),
            })?)
        } else {
            None
        };

        let max_file_size = get_str_conf(value, "max_file_size");
        let max_file_size = if !max_file_size.is_empty() {
            ByteSize::from_str(&max_file_size).map_err(|e| Error::Invalid {
                category: PluginCategory::Cache.to_string(),
                message: e.to_string(),
            })?
        } else {
            ByteSize::mb(1)
        };
        let namespace = get_str_conf(value, "namespace");
        let namespace = if namespace.is_empty() {
            None
        } else {
            Some(namespace)
        };
        let headers = get_str_slice_conf(value, "headers");
        let headers = if headers.is_empty() {
            None
        } else {
            Some(headers)
        };

        let predictor = if value.contains_key("predictor") {
            Some(get_predictor())
        } else {
            None
        };

        let purge_ip_rules =
            util::IpRules::new(&get_str_slice_conf(value, "purge_ip_list"));

        let params = Self {
            hash_value,
            http_cache: cache,
            plugin_step: step,
            eviction,
            predictor,
            lock: get_cache_lock(lock),
            max_ttl,
            max_file_size: max_file_size.as_u64() as usize,
            namespace,
            headers,
            purge_ip_rules,
        };
        if params.plugin_step != PluginStep::Request {
            return Err(Error::Invalid {
                category: PluginCategory::Cache.to_string(),
                message: "Cache plugin should be executed at request step"
                    .to_string(),
            });
        }
        Ok(params)
    }
}

impl Cache {
    pub fn new(params: &PluginConf) -> Result<Self> {
        debug!(params = params.to_string(), "new http cache plugin");
        Self::try_from(params)
    }
}

static METHOD_PURGE: Lazy<Method> =
    Lazy::new(|| Method::from_bytes(b"PURGE").unwrap());

#[async_trait]
impl Plugin for Cache {
    #[inline]
    fn hash_key(&self) -> String {
        self.hash_value.clone()
    }
    #[inline]
    async fn handle_request(
        &self,
        step: PluginStep,
        session: &mut Session,
        ctx: &mut State,
    ) -> pingora::Result<Option<HttpResponse>> {
        if step != self.plugin_step {
            return Ok(None);
        }
        // cache only support get or head
        let method = &session.req_header().method;
        if ![Method::GET, Method::HEAD, METHOD_PURGE.to_owned()]
            .contains(method)
        {
            return Ok(None);
        }

        let mut keys = BytesMut::with_capacity(64);
        if let Some(namespace) = &self.namespace {
            keys.put(namespace.as_bytes());
            keys.put(&b":"[..]);
        }
        if let Some(headers) = &self.headers {
            for key in headers.iter() {
                let buf = session.get_header_bytes(key);
                if !buf.is_empty() {
                    keys.put(buf);
                    keys.put(&b":"[..]);
                }
            }
        }
        if !keys.is_empty() {
            let prefix =
                std::str::from_utf8(&keys).unwrap_or_default().to_string();
            debug!("Cache prefix: {prefix}");
            ctx.cache_prefix = Some(prefix);
        }
        if method == METHOD_PURGE.to_owned() {
            let found = match self
                .purge_ip_rules
                .matched(&util::get_client_ip(session))
            {
                Ok(matched) => matched,
                Err(e) => {
                    return Ok(Some(HttpResponse::bad_request(
                        e.to_string().into(),
                    )));
                },
            };
            if !found {
                return Ok(Some(HttpResponse {
                    status: StatusCode::FORBIDDEN,
                    body: Bytes::from_static(b"Forbidden, ip is not allowed"),
                    ..Default::default()
                }));
            }

            let key = util::get_cache_key(
                &ctx.cache_prefix.clone().unwrap_or_default(),
                Method::GET.as_ref(),
                &session.req_header().uri,
            );
            self.http_cache.cached.remove(&key.combined()).await?;
            return Ok(Some(HttpResponse::no_content()));
        }

        // max age of cache control
        ctx.cache_max_ttl = self.max_ttl;

        session.cache.enable(
            self.http_cache,
            self.eviction,
            self.predictor,
            self.lock,
        );
        // set max size of cache response body
        if self.max_file_size > 0 {
            session.cache.set_max_file_size_bytes(self.max_file_size);
        }
        if let Some(stats) = self.http_cache.stats() {
            ctx.cache_reading = Some(stats.reading);
            ctx.cache_writing = Some(stats.writing);
        }

        Ok(None)
    }
}

#[cfg(test)]
mod tests {
    use super::Cache;
    use crate::config::{PluginConf, PluginStep};
    use crate::plugin::Plugin;
    use crate::state::State;
    use pingora::proxy::Session;
    use pretty_assertions::assert_eq;
    use tokio_test::io::Builder;

    #[test]
    fn test_cache_params() {
        let params = Cache::try_from(
            &toml::from_str::<PluginConf>(
                r###"
eviction = true
headers = ["Accept-Encoding"]
lock = "2s"
max_file_size = "100kb"
predictor = true
max_ttl = "1m"
"###,
            )
            .unwrap(),
        )
        .unwrap();
        assert_eq!(true, params.eviction.is_some());
        assert_eq!(
            r#"Some(["Accept-Encoding"])"#,
            format!("{:?}", params.headers)
        );
        assert_eq!(true, params.lock.is_some());
        assert_eq!(100 * 1000, params.max_file_size);
        assert_eq!(60, params.max_ttl.unwrap().as_secs());
        assert_eq!(true, params.predictor.is_some());
    }
    #[tokio::test]
    async fn test_cache() {
        let cache = Cache::try_from(
            &toml::from_str::<PluginConf>(
                r###"
namespace = "pingap"
eviction = true
headers = ["Accept-Encoding"]
lock = "2s"
max_file_size = "100kb"
predictor = true
max_ttl = "1m"
"###,
            )
            .unwrap(),
        )
        .unwrap();

        let headers = ["Accept-Encoding: gzip"].join("\r\n");
        let input_header =
            format!("GET /vicanso/pingap?size=1 HTTP/1.1\r\n{headers}\r\n\r\n");
        let mock_io = Builder::new().read(input_header.as_bytes()).build();
        let mut session = Session::new_h1(Box::new(mock_io));
        session.read_request().await.unwrap();
        let mut ctx = State::default();
        cache
            .handle_request(PluginStep::Request, &mut session, &mut ctx)
            .await
            .unwrap();
        assert_eq!("pingap:gzip:", ctx.cache_prefix.unwrap());
        assert_eq!(true, session.cache.enabled());
        assert_eq!(100 * 1000, cache.max_file_size);
    }
}
