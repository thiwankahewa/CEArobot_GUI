import * as React from "react";
import {
  Stack,
  IconButton,
  TextField,
  Typography,
  InputAdornment,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import SettingRow from "./SettingRow";

function clamp(v, min, max) {
  if (min !== undefined && v < min) return min;
  if (max !== undefined && v > max) return max;
  return v;
}

export default function SettingNumber({
  title,
  description,
  value,
  onChange,
  min,
  max,
  step = 1,
  unit,
  disabled = false,
  decimals = 0,
}) {
  const [local, setLocal] = React.useState(String(value ?? ""));
  React.useEffect(() => setLocal(String(value ?? "")), [value]);

  const parse = (s) => {
    const n = Number(s);
    if (Number.isNaN(n)) return null;
    const fixed = decimals > 0 ? Number(n.toFixed(decimals)) : Math.round(n);
    return clamp(fixed, min, max);
  };

  const commitLocal = () => {
    const parsed = parse(local);
    if (parsed === null) {
      setLocal(String(value ?? ""));
      return;
    }
    onChange(parsed);
  };

  const dec = () => onChange(clamp(Number(value) - step, min, max));
  const inc = () => onChange(clamp(Number(value) + step, min, max));

  const rangeText =
    min !== undefined || max !== undefined
      ? `Range: ${min ?? "–"} to ${max ?? "–"}${unit ? ` ${unit}` : ""}`
      : "";

  const fullDescription = [description?.trim(), rangeText]
    .filter(Boolean)
    .join("\n\n");

  return (
    <SettingRow title={title} description={fullDescription} disabled={disabled}>
      <Stack direction="row" spacing={2} alignItems="center">
        <IconButton disabled={disabled} onClick={dec} size="large">
          <RemoveIcon />
        </IconButton>

        <TextField
          value={local}
          disabled={disabled}
          onChange={(e) => setLocal(e.target.value)}
          onBlur={commitLocal}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.currentTarget.blur();
            }
          }}
          inputProps={{
            style: {
              textAlign: "center",
              fontWeight: 600,
              fontSize: 18,
              width: 90,
            },
            inputMode: "decimal",
          }}
          size="small"
          sx={{ "& .MuiOutlinedInput-root": { borderRadius: 25 } }}
          InputProps={{
            endAdornment: unit ? (
              <InputAdornment position="end">
                <Typography sx={{ fontWeight: 600 }}>{unit}</Typography>
              </InputAdornment>
            ) : null,
          }}
        />

        <IconButton disabled={disabled} onClick={inc} size="large">
          <AddIcon />
        </IconButton>
      </Stack>
    </SettingRow>
  );
}
