import * as React from "react";
import { ToggleButtonGroup, ToggleButton } from "@mui/material";
import SettingRow from "./SettingRow";

export default function SettingToggle({
  title,
  description,
  value,
  onChange,
  options, // [{value,label}]
  disabled = false,
}) {
  return (
    <SettingRow title={title} description={description} disabled={disabled}>
      <ToggleButtonGroup
        value={value}
        exclusive
        disabled={disabled}
        onChange={(_, v) => {
          if (v === null || v === undefined) return;
          onChange(v);
        }}
        fullWidth
        sx={{
          borderRadius: 2,
          "& .MuiToggleButton-root": {
            textTransform: "none",
          },
          "& .MuiToggleButton-root:first-of-type": {
            borderTopLeftRadius: 50,
            borderBottomLeftRadius: 50,
          },
          "& .MuiToggleButton-root:last-of-type": {
            borderTopRightRadius: 50,
            borderBottomRightRadius: 50,
          },
        }}
      >
        {options.map((opt) => (
          <ToggleButton key={String(opt.value)} value={opt.value}>
            {opt.label}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </SettingRow>
  );
}
