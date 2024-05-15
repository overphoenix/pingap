import * as React from "react";
import CardContent from "@mui/material/CardContent";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import FormControl from "@mui/material/FormControl";
import Grid from "@mui/material/Grid";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import RadioGroup from "@mui/material/RadioGroup";
import Radio from "@mui/material/Radio";
import Snackbar from "@mui/material/Snackbar";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import OutlinedInput from "@mui/material/OutlinedInput";
import PlaylistRemoveIcon from "@mui/icons-material/PlaylistRemove";
import IconButton from "@mui/material/IconButton";
import AddRoadIcon from "@mui/icons-material/AddRoad";
import Alert from "@mui/material/Alert";
import CheckIcon from "@mui/icons-material/Check";
import FormGroup from "@mui/material/FormGroup";
import FormLabel from "@mui/material/FormLabel";
import Stack from "@mui/material/Stack";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import Box from "@mui/material/Box";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import { useTranslation } from "react-i18next";
import Paper from "@mui/material/Paper";
import SubtitlesIcon from "@mui/icons-material/Subtitles";
import { useParams } from "react-router-dom";
import { Theme, useTheme } from "@mui/material/styles";
import { formatError } from "../helpers/util";

export enum FormItemCategory {
  TEXT = "text",
  NUMBER = "number",
  TEXTAREA = "textarea",
  LOCATION = "location",
  UPSTREAM = "upstream",
  ADDRS = "addrs",
  CHECKBOX = "checkbox",
  HEADERS = "headers",
  PROXY_ADD_HEADERS = "proxyAddHeaders",
  PROXY_SET_HEADERS = "proxySetHeaders",
  WEBHOOK_TYPE = "webhookType",
  WEBHOOK_NOTIFICATIONS = "webhookNotifications",
  PLUGIN = "plugin",
  PLUGIN_STEP = "pluginStep",
  PLUGIN_SELECT = "pluginSelect",
}

export enum PluginCategory {
  STATS = "stats",
  LIMIT = "limit",
  COMPRESSION = "compression",
  ADMIN = "admin",
  DIRECTORY = "directory",
  MOCK = "mock",
  REQUEST_ID = "request_id",
  IP_LIMIT = "ip_limit",
  KEY_AUTH = "key_auth",
  BASIC_AUTH = "basic_auth",
  CACHE = "cache",
  REDIRECT_HTTPS = "redirect_https",
  PING = "ping",
  RESPONSE_HEADERS = "response_headers",
}

export function formatPluginCategory(value: string) {
  switch (value) {
    case PluginCategory.STATS: {
      return "stats";
    }
    case PluginCategory.LIMIT: {
      return "limit";
    }
    case PluginCategory.COMPRESSION: {
      return "compression";
    }
    case PluginCategory.ADMIN: {
      return "admin";
    }
    case PluginCategory.DIRECTORY: {
      return "directory";
    }
    case PluginCategory.MOCK: {
      return "mock";
    }
    case PluginCategory.REQUEST_ID: {
      return "requestId";
    }
    case PluginCategory.IP_LIMIT: {
      return "ipLimit";
    }
    case PluginCategory.KEY_AUTH: {
      return "keyAuth";
    }
    case PluginCategory.BASIC_AUTH: {
      return "basicAuth";
    }
    case PluginCategory.CACHE: {
      return "cache";
    }
    case PluginCategory.REDIRECT_HTTPS: {
      return "redirectHttps";
    }
    case PluginCategory.PING: {
      return "ping";
    }
    case PluginCategory.RESPONSE_HEADERS: {
      return "responseHeaders";
    }
  }
  return "";
}

export interface CheckBoxItem {
  label: string;
  option: number;
  value: string | number | boolean | null;
}

export interface FormItem {
  id: string;
  label: string;
  defaultValue: unknown;
  span: number;
  category: FormItemCategory;
  minRows?: number;
  options?: string[] | CheckBoxItem[];
}

function getDefaultValues(items: FormItem[]) {
  const data: Record<string, unknown> = {};
  items.forEach((item) => {
    data[item.id] = item.defaultValue;
  });
  return data;
}

function getStyles(name: string, selectItems: string[], theme: Theme) {
  return {
    fontWeight:
      selectItems.indexOf(name) === -1
        ? theme.typography.fontWeightRegular
        : theme.typography.fontWeightMedium,
  };
}

function FormProxyPluginField({
  category,
  value,
  id,
  onUpdate,
}: {
  value: string;
  category: string;
  id: string;
  onUpdate: (data: string) => void;
}) {
  const { t } = useTranslation();
  const key = `${id}-${category}`;
  const arr: string[] = [];
  const fields: {
    label: string;
    options?: string[] | CheckBoxItem[];
  }[] = [];
  const padding = " ";

  const defaultMockInfo: {
    status: null | number;
    headers: string[];
    data: string;
    path: string;
  } = {
    status: null,
    path: "",
    headers: [],
    data: "",
  };

  const defaultResponseHeaders: {
    add_headers: string[];
    remove_headers: string[];
    set_headers: string[];
  } = {
    add_headers: [],
    remove_headers: [],
    set_headers: [],
  };

  switch (category) {
    case PluginCategory.COMPRESSION: {
      arr.push(...value.split(padding));
      fields.push(
        {
          label: t("form.gzip"),
        },
        {
          label: t("form.br"),
        },
        {
          label: t("form.zstd"),
        },
      );
      break;
    }
    case PluginCategory.ADMIN: {
      arr.push(...value.split(padding));
      fields.push(
        {
          label: t("form.adminPath"),
        },
        {
          label: t("form.basicAuth"),
        },
      );
      break;
    }
    case PluginCategory.LIMIT: {
      arr.push(...value.split(padding));
      fields.push(
        {
          label: t("form.limitCategory"),
          options: ["rate", "inflight"],
        },
        {
          label: t("form.limitValue"),
        },
      );
      break;
    }
    case PluginCategory.DIRECTORY: {
      arr.push(value);
      fields.push({
        label: t("form.staticDirectory"),
      });
      break;
    }
    case PluginCategory.REQUEST_ID: {
      arr.push(...value.split(padding));
      fields.push(
        {
          label: t("form.algoForId"),
          options: ["uuid", "nanoid"],
        },
        {
          label: t("form.lengthForId"),
        },
      );
      break;
    }
    case PluginCategory.IP_LIMIT: {
      arr.push(...value.split(padding));
      fields.push(
        {
          label: t("form.ipList"),
        },
        {
          label: t("form.limitMode"),
          options: [
            {
              label: t("form.allow"),
              value: "0",
              option: 0,
            },
            {
              label: t("form.deny"),
              value: "1",
              option: 1,
            },
          ],
        },
      );
      break;
    }
    case PluginCategory.KEY_AUTH: {
      arr.push(...value.split(padding));
      fields.push(
        {
          label: t("form.keyName"),
        },
        {
          label: t("form.keyValues"),
        },
      );
      break;
    }
    case PluginCategory.BASIC_AUTH: {
      arr.push(value);
      fields.push({
        label: t("form.basicAuthList"),
      });
      break;
    }
    case PluginCategory.MOCK: {
      if (value) {
        try {
          Object.assign(defaultMockInfo, JSON.parse(value));
        } catch (err) {
          console.error(err);
        }
      }
      break;
    }
    case PluginCategory.CACHE: {
      arr.push(value);
      fields.push({
        label: t("form.cacheStorage"),
      });
      break;
    }
    case PluginCategory.REDIRECT_HTTPS: {
      arr.push(value);
      fields.push({
        label: t("form.redirectPrefix"),
      });
      break;
    }
    case PluginCategory.PING: {
      arr.push(value);
      fields.push({
        label: t("form.pingPath"),
      });
      break;
    }
    case PluginCategory.RESPONSE_HEADERS: {
      value.split(" ").forEach((item) => {
        const value = item.trim();
        if (!value) {
          return;
        }
        let last = value.substring(1);
        if (item.startsWith("+")) {
          defaultResponseHeaders.add_headers.push(last);
        } else if (item.startsWith("-")) {
          defaultResponseHeaders.remove_headers.push(last);
        } else {
          defaultResponseHeaders.set_headers.push(value);
        }
      });
      break;
    }
    default: {
      arr.push(value);
      fields.push({
        label: t("form.statsPath"),
      });
      break;
    }
  }
  const [newValues, setNewValues] = React.useState(arr);
  const [mockInfo, setMockInfo] = React.useState(defaultMockInfo);
  const [responseHeaders, setResponseHeaders] = React.useState(
    defaultResponseHeaders,
  );

  const updateResponseHeaders = (headers: {
    add_headers: string[];
    remove_headers: string[];
    set_headers: string[];
  }) => {
    setResponseHeaders(headers);
    const arr = headers.set_headers.slice(0);
    headers.add_headers.forEach((item) => {
      arr.push(`+${item}`);
    });
    headers.remove_headers.forEach((item) => {
      arr.push(`-${item}`);
    });
    onUpdate(arr.join(" "));
  };

  if (category == PluginCategory.MOCK) {
    return (
      <Stack direction="column" spacing={2}>
        <TextField
          key={`${key}-path`}
          id={`${key}-path`}
          label={t("form.mockPath")}
          variant="outlined"
          defaultValue={mockInfo.path}
          sx={{ ml: 1, flex: 1 }}
          onChange={(e) => {
            const data = Object.assign({}, mockInfo);
            data.path = e.target.value.trim();
            setMockInfo(data);
            onUpdate(JSON.stringify(data));
          }}
        />
        <TextField
          key={`${key}-status`}
          id={`${key}-status`}
          label={t("form.mockStats")}
          variant="outlined"
          defaultValue={mockInfo.status}
          sx={{ ml: 1, flex: 1 }}
          onChange={(e) => {
            const value = Number(e.target.value.trim());
            const data = Object.assign({}, mockInfo);
            if (value) {
              data.status = value;
            } else {
              data.status = null;
            }
            setMockInfo(data);
            onUpdate(JSON.stringify(data));
          }}
        />
        <FormTwoInputFields
          id={id}
          divide={":"}
          values={mockInfo.headers}
          label={t("form.headerName")}
          valueLabel={t("form.headerValue")}
          onUpdate={(headers) => {
            const data = Object.assign({}, mockInfo);
            data.headers = headers;
            setMockInfo(data);
            onUpdate(JSON.stringify(data));
          }}
          addLabel={t("form.mockHeader")}
        />
        <TextField
          id={`${key}-data`}
          label={t("form.mockData")}
          multiline
          minRows={3}
          variant="outlined"
          defaultValue={mockInfo.data}
          onChange={(e) => {
            const data = Object.assign({}, mockInfo);
            data.data = e.target.value;
            setMockInfo(data);
            onUpdate(JSON.stringify(data));
          }}
        />
      </Stack>
    );
  }
  if (category == PluginCategory.RESPONSE_HEADERS) {
    return (
      <Stack direction="column" spacing={2}>
        <FormTwoInputFields
          id={`${id}-set-headers`}
          divide={":"}
          values={responseHeaders.set_headers as string[]}
          label={t("form.headerName")}
          valueLabel={t("form.headerValue")}
          onUpdate={(data) => {
            const headers = Object.assign({}, responseHeaders);
            headers.set_headers = data;
            updateResponseHeaders(headers);
          }}
          addLabel={t("form.setHeader")}
        />
        <FormTwoInputFields
          id={`${id}-add-headers`}
          divide={":"}
          values={responseHeaders.add_headers as string[]}
          label={t("form.headerName")}
          valueLabel={t("form.headerValue")}
          onUpdate={(data) => {
            const headers = Object.assign({}, responseHeaders);
            headers.add_headers = data;
            updateResponseHeaders(headers);
          }}
          addLabel={t("form.header")}
        />
        <TextField
          id={`${id}-remove-headers`}
          label={t("form.removeHeader")}
          variant="outlined"
          defaultValue={responseHeaders.remove_headers.join(" ") || ""}
          sx={{ ml: 1, flex: 1 }}
          style={{
            marginLeft: "0px",
          }}
          onChange={(e) => {
            const value = e.target.value.trim();
            const headers = Object.assign({}, responseHeaders);
            headers.remove_headers = value.split(" ");
            updateResponseHeaders(headers);
          }}
        />
      </Stack>
    );
  }
  const items = fields.map((item, index) => {
    if (item.options) {
      return (
        <Box
          key={`${key}-${index}`}
          id={`${key}-${index}`}
          sx={{ ml: 1, flex: 1 }}
          style={{
            marginLeft: `${index * 15}px`,
          }}
        >
          <FormControl fullWidth={true}>
            <FormSelectField
              label={item.label}
              options={item.options as string[]}
              value={newValues[index] || ""}
              onUpdate={(value) => {
                const arr = newValues.slice(0);
                arr[index] = value;
                onUpdate(arr.join(padding));
                setNewValues(arr);
              }}
            />
          </FormControl>
        </Box>
      );
    }
    return (
      <TextField
        key={`${key}-${index}`}
        id={`${key}-${index}`}
        label={item.label}
        variant="outlined"
        defaultValue={newValues[index] || ""}
        sx={{ ml: 1, flex: 1 }}
        style={{
          marginLeft: `${index * 15}px`,
        }}
        onChange={(e) => {
          const value = e.target.value.trim();
          const arr = newValues.slice(0);
          arr[index] = value;
          onUpdate(arr.join(padding));
          setNewValues(arr);
        }}
      />
    );
  });

  const list = (
    <Paper
      sx={{
        display: "flex",
        marginBottom: "15px",
        alignItems: "center",
        width: "100%",
      }}
    >
      {items}
    </Paper>
  );

  return <React.Fragment>{list}</React.Fragment>;
}

function FormSelectField({
  options,
  label,
  value,
  onUpdate,
}: {
  options?: string[] | CheckBoxItem[];
  label: string;
  value: string;
  onUpdate: (data: string) => void;
}) {
  const [newValue, setNewValue] = React.useState(value);

  const opts = options || [];

  return (
    <React.Fragment>
      <InputLabel id={`{item.id}-label`}>{label}</InputLabel>
      <Select
        labelId={`{item.id}-label`}
        id={label}
        value={newValue}
        onChange={(e) => {
          const { value } = e.target;
          setNewValue(value);
          onUpdate(value);
        }}
        input={<OutlinedInput label={label} />}
      >
        {opts.map((name) => {
          if (typeof name == "string") {
            return (
              <MenuItem key={name} value={name}>
                {name}
              </MenuItem>
            );
          }
          let opt = name as CheckBoxItem;
          return (
            <MenuItem key={opt.label} value={opt.value as string}>
              {opt.label}
            </MenuItem>
          );
        })}
      </Select>
    </React.Fragment>
  );
}

function FormTwoInputFields({
  id,
  divide,
  values,
  label,
  valueLabel,
  valueWidth,
  addLabel,
  onUpdate,
}: {
  id: string;
  divide: string;
  values: string[];
  label: string;
  valueWidth?: string;
  valueLabel: string;
  addLabel: string;
  onUpdate: (data: string[]) => void;
}) {
  const arr = values || [];
  if (arr.length === 0) {
    arr.push("");
  }
  const [newValues, setNewValues] = React.useState(arr);
  const divideToTwoValues = (value: string) => {
    let arr = value.split(divide);
    if (arr.length < 2) {
      arr.push("");
    }
    if (arr.length > 2) {
      arr = [arr[0], arr.slice(1).join(divide)];
    }
    return arr;
  };
  const updateNameAndValue = (
    index: number,
    name: string | undefined,
    value: string | undefined,
  ) => {
    const cloneValues = newValues.slice(0);
    const arr = divideToTwoValues(cloneValues[index]);
    if (name === undefined) {
      arr[1] = value || "";
    } else {
      arr[0] = name;
    }
    cloneValues[index] = arr.join(divide).trim();
    setNewValues(cloneValues);
    const updateValues: string[] = [];
    cloneValues.forEach((item) => {
      const v = item.trim();
      if (v) {
        updateValues.push(v);
      }
    });
    onUpdate(updateValues);
  };

  const list = newValues.map((item, index) => {
    const arr = divideToTwoValues(item);
    const name = arr[0];
    let value = "";
    if (arr.length === 2) {
      value = arr[1];
    }
    let flexValue: number | undefined = undefined;
    if (!valueWidth) {
      flexValue = 1;
    }
    return (
      <Paper
        key={`{id}-${index}`}
        sx={{
          display: "flex",
          marginBottom: "15px",
          alignItems: "center",
          width: "100%",
        }}
      >
        <TextField
          id={`${id}-${index}-name`}
          label={label}
          variant="outlined"
          defaultValue={name || ""}
          sx={{ ml: 1, flex: 1 }}
          style={{
            marginLeft: "0px",
          }}
          onChange={(e) => {
            const value = e.target.value.trim();
            updateNameAndValue(index, value, undefined);
          }}
        />
        <TextField
          id={`${id}-${index}value`}
          label={valueLabel}
          variant="outlined"
          defaultValue={value || ""}
          sx={{ ml: flexValue, flex: flexValue }}
          style={{
            marginLeft: "10px",
            width: valueWidth,
          }}
          onChange={(e) => {
            const value = e.target.value.trim();
            updateNameAndValue(index, undefined, value);
          }}
        />
        <IconButton
          color="primary"
          sx={{ p: "10px" }}
          aria-label="directions"
          onClick={() => {
            const values = newValues.slice(0);
            values.splice(index, 1);
            setNewValues(values);
            onUpdate(values);
          }}
        >
          <PlaylistRemoveIcon />
        </IconButton>
      </Paper>
    );
  });
  list.push(
    <Button
      key="addAddr"
      variant="contained"
      endIcon={<AddRoadIcon />}
      onClick={() => {
        const values = newValues.slice(0);
        values.push("");
        setNewValues(values);
      }}
    >
      {addLabel}
    </Button>,
  );
  return <React.Fragment>{list}</React.Fragment>;
}

function getPluginSteps(category: string) {
  const defaultPluginSteps = [
    {
      label: "Request",
      option: 0,
      value: "request",
    },
    {
      label: "Proxy Upstream",
      option: 1,
      value: "proxy_upstream",
    },
    {
      label: "Upstream Response",
      option: 2,
      value: "upstream_response",
    },
  ];

  const pluginSupportSteps: Record<string, number[]> = {};
  pluginSupportSteps[PluginCategory.STATS] = [0, 1];
  pluginSupportSteps[PluginCategory.LIMIT] = [0, 1];
  pluginSupportSteps[PluginCategory.COMPRESSION] = [0, 1];
  pluginSupportSteps[PluginCategory.ADMIN] = [0, 1];
  pluginSupportSteps[PluginCategory.DIRECTORY] = [0, 1];
  pluginSupportSteps[PluginCategory.MOCK] = [0, 1];
  pluginSupportSteps[PluginCategory.REQUEST_ID] = [0, 1];
  pluginSupportSteps[PluginCategory.IP_LIMIT] = [0, 1];
  pluginSupportSteps[PluginCategory.KEY_AUTH] = [0, 1];
  pluginSupportSteps[PluginCategory.BASIC_AUTH] = [0, 1];
  pluginSupportSteps[PluginCategory.CACHE] = [0];
  pluginSupportSteps[PluginCategory.REDIRECT_HTTPS] = [0];
  pluginSupportSteps[PluginCategory.PING] = [0];
  pluginSupportSteps[PluginCategory.RESPONSE_HEADERS] = [2];

  const steps = pluginSupportSteps[category];
  if (steps) {
    const arr = defaultPluginSteps.filter((item) => {
      return steps.indexOf(item.option) !== -1;
    });
    return arr;
  }
  return defaultPluginSteps;
}

// TODO WEB管理界面流程后续优化，暂时仅保证可用
// 后续调整模块化
export default function FormEditor({
  title,
  description,
  items,
  onUpsert,
  onRemove,
  created,
  currentNames,
}: {
  title: string;
  description: string;
  items: FormItem[];
  onUpsert: (name: string, data: Record<string, unknown>) => Promise<void>;
  onRemove?: () => Promise<void>;
  created?: boolean;
  currentNames?: string[];
}) {
  const { name } = useParams();
  const { t } = useTranslation();
  const theme = useTheme();
  const [data, setData] = React.useState(getDefaultValues(items));
  const [openRemoveDialog, setOpenRemoveDialog] = React.useState(false);
  const [pluginCategory, setPluginCategory] = React.useState(
    (data["category"] as string) || "",
  );

  const defaultLocations: string[] = [];
  const defaultProxyPluginSelected: string[] = [];
  const defaultWebhookNotifications: string[] = [];
  items.forEach((item) => {
    switch (item.category) {
      case FormItemCategory.LOCATION: {
        const arr = (item.defaultValue as string[]) || [];
        arr.forEach((lo) => {
          defaultLocations.push(lo);
        });
        break;
      }
      case FormItemCategory.PLUGIN_SELECT: {
        const arr = (item.defaultValue as string[]) || [];
        arr.forEach((lo) => {
          defaultProxyPluginSelected.push(lo);
        });
        break;
      }
      case FormItemCategory.WEBHOOK_NOTIFICATIONS: {
        const arr = (item.defaultValue as string[]) || [];
        arr.forEach((item) => {
          defaultWebhookNotifications.push(item);
        });
        break;
      }
    }
  });

  const [locations, setLocations] = React.useState<string[]>(defaultLocations);
  const [selectedProxyPlugins, setSelectedProxyPlugins] = React.useState<
    string[]
  >(defaultProxyPluginSelected);
  const [webhookNotifications, setWebhookNotifications] = React.useState<
    string[]
  >(defaultWebhookNotifications);

  const [updated, setUpdated] = React.useState(false);
  const [processing, setProcessing] = React.useState(false);
  const [showSuccess, setShowSuccess] = React.useState(false);
  const [newName, setNewName] = React.useState("");

  const [showError, setShowError] = React.useState({
    open: false,
    message: "",
  });

  const list = items.map((item) => {
    let formItem: JSX.Element = <></>;
    switch (item.category) {
      case FormItemCategory.PLUGIN_STEP:
        item.options = getPluginSteps(pluginCategory || PluginCategory.STATS);
      case FormItemCategory.CHECKBOX: {
        let options = (item.options as CheckBoxItem[]) || [];
        let defaultValue = 0;
        let labelItems = options.map((opt, index) => {
          if (item.defaultValue === opt.value) {
            defaultValue = opt.option;
          }
          return (
            <FormControlLabel
              key={item.id + "-label-" + index}
              value={opt.option}
              control={<Radio />}
              label={opt.label}
            />
          );
        });

        formItem = (
          <React.Fragment>
            <FormLabel id={item.id}>{item.label}</FormLabel>
            <RadioGroup
              row
              aria-labelledby={item.id}
              defaultValue={defaultValue}
              name="radio-buttons-group"
              onChange={(e) => {
                let value = Number(e.target.value);
                options.forEach((opt) => {
                  if (opt.option === value) {
                    updateValue(item.id, opt.value);
                  }
                });
              }}
            >
              {labelItems}
            </RadioGroup>
          </React.Fragment>
        );
        break;
      }
      case FormItemCategory.LOCATION: {
        const options = (item.options as string[]) || [];
        formItem = (
          <React.Fragment>
            <InputLabel id={`{item.id}-label`}>{item.label}</InputLabel>
            <Select
              labelId={`{item.id}-label`}
              id={item.label}
              multiple
              value={locations}
              onChange={(e) => {
                const values = (e.target.value as string[]).sort();
                setLocations(values);
                updateValue(item.id, values);
              }}
              input={<OutlinedInput label={item.label} />}
            >
              {options.map((name) => (
                <MenuItem
                  key={name}
                  value={name}
                  style={getStyles(name, locations, theme)}
                >
                  {name}
                </MenuItem>
              ))}
            </Select>
          </React.Fragment>
        );
        break;
      }
      case FormItemCategory.WEBHOOK_NOTIFICATIONS: {
        const options = (item.options as string[]) || [];
        formItem = (
          <React.Fragment>
            <InputLabel id={`{item.id}-label`}>{item.label}</InputLabel>
            <Select
              labelId={`{item.id}-label`}
              id={item.label}
              multiple
              value={webhookNotifications}
              onChange={(e) => {
                const values = (e.target.value as string[]).sort();
                setWebhookNotifications(values);
                updateValue(item.id, values);
              }}
              input={<OutlinedInput label={item.label} />}
            >
              {options.map((name) => (
                <MenuItem
                  key={name}
                  value={name}
                  style={getStyles(name, webhookNotifications, theme)}
                >
                  {name}
                </MenuItem>
              ))}
            </Select>
          </React.Fragment>
        );
        break;
      }
      case FormItemCategory.UPSTREAM:
      case FormItemCategory.WEBHOOK_TYPE: {
        formItem = (
          <FormSelectField
            label={item.label}
            options={item.options as string[]}
            value={(item.defaultValue as string) || ""}
            onUpdate={(value) => {
              updateValue(item.id, value);
            }}
          />
        );
        break;
      }
      case FormItemCategory.ADDRS: {
        formItem = (
          <FormTwoInputFields
            id={item.id}
            divide={" "}
            values={item.defaultValue as string[]}
            label={t("form.addr")}
            valueLabel={t("form.weight")}
            valueWidth="100px"
            onUpdate={(data) => {
              updateValue(item.id, data);
            }}
            addLabel={t("form.addrs")}
          />
        );
        break;
      }
      case FormItemCategory.PROXY_SET_HEADERS: {
        formItem = (
          <FormTwoInputFields
            id={item.id}
            divide={":"}
            values={item.defaultValue as string[]}
            label={t("form.proxyHeaderName")}
            valueLabel={t("form.proxyHeaderValue")}
            onUpdate={(data) => {
              updateValue(item.id, data);
            }}
            addLabel={item.label}
          />
        );
        break;
      }
      case FormItemCategory.PROXY_ADD_HEADERS: {
        formItem = (
          <FormTwoInputFields
            id={item.id}
            divide={":"}
            values={item.defaultValue as string[]}
            label={t("form.proxyHeaderName")}
            valueLabel={t("form.proxyHeaderValue")}
            onUpdate={(data) => {
              updateValue(item.id, data);
            }}
            addLabel={item.label}
          />
        );
        break;
      }
      case FormItemCategory.PLUGIN: {
        const category = (data["category"] as string) || "";
        formItem = (
          <FormProxyPluginField
            key={`${item.id}-{category}`}
            value={(item.defaultValue as string) || ""}
            category={category}
            id={item.id}
            onUpdate={(data) => {
              updateValue(item.id, data);
            }}
          />
        );
        break;
      }
      case FormItemCategory.TEXTAREA: {
        let minRows = 4;
        if (item.minRows) {
          minRows = item.minRows;
        }
        formItem = (
          <TextField
            id={item.id}
            label={item.label}
            multiline
            minRows={minRows}
            variant="outlined"
            defaultValue={item.defaultValue}
            onChange={(e) => {
              updateValue(item.id, e.target.value.trim());
            }}
          />
        );
        break;
      }
      case FormItemCategory.PLUGIN_SELECT: {
        const options = (item.options as CheckBoxItem[]) || [];
        const labelItems = options.map((opt, index) => {
          const value = opt.value as string;
          const checked = selectedProxyPlugins.includes(value);
          return (
            <FormControlLabel
              key={`${item.id}-${index}`}
              control={<Checkbox checked={checked} />}
              onChange={() => {
                if (!checked) {
                  const arr = selectedProxyPlugins.slice(0);
                  arr.push(value);
                  updateValue(item.id, arr);
                  setSelectedProxyPlugins(arr);
                } else {
                  const arr = selectedProxyPlugins
                    .slice(0)
                    .filter((item) => item !== value);
                  updateValue(item.id, arr);
                  setSelectedProxyPlugins(arr);
                }
              }}
              label={opt.label}
            />
          );
        });
        const selectedItems = selectedProxyPlugins.map((plugin, index) => {
          const action = (
            <IconButton
              edge="end"
              aria-label="delete"
              disabled={index == 0}
              onClick={() => {
                // ignore 0
                if (index) {
                  const arr = selectedProxyPlugins.slice(0);
                  const value = arr[index];
                  arr[index] = arr[index - 1];
                  arr[index - 1] = value;
                  updateValue(item.id, arr);
                  setSelectedProxyPlugins(arr);
                }
              }}
            >
              <KeyboardArrowUpIcon />
            </IconButton>
          );
          return (
            <ListItem key={plugin} secondaryAction={action} disablePadding>
              <ListItemText
                style={{
                  paddingRight: "50px",
                }}
              >
                {plugin}
              </ListItemText>
            </ListItem>
          );
        });
        let selectedBox = <></>;
        if (selectedItems.length !== 0) {
          selectedBox = (
            <Box>
              <FormLabel component="legend">{t("form.sortPlugin")}</FormLabel>
              <FormGroup>
                <List>{selectedItems}</List>
              </FormGroup>
            </Box>
          );
        }
        formItem = (
          <React.Fragment>
            <Stack direction="row" spacing={2}>
              <Box
                style={{
                  width: "50%",
                }}
              >
                <FormLabel component="legend">
                  {t("form.selectPlugin")}
                </FormLabel>
                <FormGroup>{labelItems}</FormGroup>
              </Box>
              {selectedBox}
            </Stack>
          </React.Fragment>
        );
        break;
      }
      default: {
        let defaultValue = item.defaultValue;
        if (defaultValue == null) {
          defaultValue = "";
        } else {
          defaultValue = `${defaultValue}`;
        }
        formItem = (
          <TextField
            id={item.id}
            label={item.label}
            variant="outlined"
            defaultValue={defaultValue}
            onChange={(e) => {
              const value = e.target.value.trim();
              switch (item.category) {
                case FormItemCategory.NUMBER: {
                  if (value) {
                    updateValue(item.id, Number(value));
                  } else {
                    updateValue(item.id, null);
                  }
                  break;
                }
                default: {
                  updateValue(item.id, value);
                  break;
                }
              }
            }}
          />
        );
        break;
      }
    }
    return (
      <Grid item xs={item.span} key={item.id}>
        <FormControl fullWidth={true}>{formItem}</FormControl>
      </Grid>
    );
  });
  const updateValue = (key: string, value: unknown) => {
    setShowSuccess(false);
    const values = Object.assign({}, data);
    if (!value && typeof value == "string") {
      value = null;
    }
    values[key] = value;
    setUpdated(true);
    setData(values);
    setPluginCategory((values["category"] as string) || "");
    setTimeout(() => {
      setShowSuccess(false);
    }, 6000);
  };
  const doUpsert = async () => {
    if (processing) {
      return;
    }
    setProcessing(true);
    try {
      if (created) {
        if (!newName) {
          throw new Error(t("form.nameRequired"));
        }
        if ((currentNames || []).includes(newName)) {
          throw new Error(t("form.nameExists"));
        }
      }
      await onUpsert(newName, data);
      setShowSuccess(true);
    } catch (err) {
      setShowError({
        open: true,
        message: formatError(err),
      });
    } finally {
      setProcessing(false);
    }
  };

  const doRemove = async () => {
    if (processing) {
      return;
    }
    setProcessing(true);
    try {
      setShowSuccess(true);
      if (onRemove) {
        await onRemove();
      }
    } catch (err) {
      setShowError({
        open: true,
        message: formatError(err),
      });
    } finally {
      setProcessing(false);
    }
  };
  let showRemove = false;
  if (onRemove) {
    showRemove = true;
  }
  let createNewItem = <></>;
  if (created) {
    showRemove = false;
    createNewItem = (
      <Grid item xs={12}>
        <FormControl fullWidth={true}>
          <TextField
            id={"new-item-name"}
            label={t("form.name")}
            variant="outlined"
            onChange={(e) => {
              setNewName(e.target.value.trim());
            }}
          />
        </FormControl>
      </Grid>
    );
  }
  let removeGrip = <></>;
  let submitSpan = 12;
  if (showRemove) {
    submitSpan = 8;
    removeGrip = (
      <Grid item xs={4}>
        <Button
          disabled={created}
          fullWidth
          variant="outlined"
          size="large"
          onClick={() => {
            setOpenRemoveDialog(true);
          }}
        >
          {processing ? t("form.removing") : t("form.remove")}
        </Button>
      </Grid>
    );
  }
  const handleCloseRemoveDialog = () => {
    setOpenRemoveDialog(false);
  };

  let nameFragment = <></>;
  if (name && name != "*") {
    nameFragment = (
      <h3
        style={{
          margin: "5px 0 15px 0",
          lineHeight: "24px",
        }}
      >
        <SubtitlesIcon
          style={{
            float: "left",
            marginRight: "5px",
          }}
        />
        <span>{name}</span>
      </h3>
    );
  }

  return (
    <React.Fragment>
      <CardContent>
        {nameFragment}
        <Typography
          sx={{ fontSize: 18, fontWeight: "bold" }}
          color="text.secondary"
          gutterBottom
        >
          {title}
        </Typography>
        <Typography variant="body1" gutterBottom mb={2}>
          {description}
        </Typography>
        <form noValidate autoComplete="off">
          <Grid container spacing={2}>
            {createNewItem}
            {list}
            <Grid item xs={submitSpan}>
              <Button
                disabled={!updated}
                fullWidth
                variant="outlined"
                size="large"
                onClick={() => {
                  doUpsert();
                }}
              >
                {processing ? t("form.submitting") : t("form.submit")}
              </Button>
            </Grid>
            {removeGrip}
          </Grid>
        </form>
      </CardContent>
      {showSuccess && (
        <Alert
          style={{
            position: "fixed",
            right: "15px",
            bottom: "15px",
          }}
          icon={<CheckIcon fontSize="inherit" />}
          severity="success"
        >
          {t("form.success")}
        </Alert>
      )}
      <Snackbar
        open={showError.open}
        autoHideDuration={6000}
        onClose={() => {
          setShowError({
            open: false,
            message: "",
          });
        }}
        message={showError.message}
      />
      <Dialog
        open={openRemoveDialog}
        onClose={handleCloseRemoveDialog}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          {t("form.confirmRemove")}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            {t("form.removeDescript")}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseRemoveDialog}>Cancel</Button>
          <Button
            onClick={() => {
              doRemove();
              handleCloseRemoveDialog();
            }}
            autoFocus
          >
            {t("form.confirm")}
          </Button>
        </DialogActions>
      </Dialog>
    </React.Fragment>
  );
}
