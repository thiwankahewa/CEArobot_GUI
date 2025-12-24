import * as React from "react";
import { Slider, Stack } from "@mui/material";
import SettingRow from "./SettingRow";
import { useDebouncedCallback } from "../utils/useDebouncedCallback";

export default function SettingSlider({
  title,
  description,
  value,
  onChangeCommitted, // (v) => send to robot
  min,
  max,
  step = 1,
  unit,
  disabled = false,
  debounceMs = 300,
}) {
  const [local, setLocal] = React.useState(value ?? min ?? 0);

  React.useEffect(() => {
    setLocal(value ?? min ?? 0);
  }, [value, min]);

  const debouncedCommit = useDebouncedCallback((v) => {
    onChangeCommitted(v);
  }, debounceMs);

  const rangeText = `${min} ${unit ?? ""} — ${max} ${
    unit ?? ""
  } (step ${step} ${unit ?? ""})`;

  const fullDescription = [description?.trim(), rangeText]
    .filter(Boolean)
    .join("\n\n");

  return (
    <SettingRow title={title} description={fullDescription} disabled={disabled}>
      <Stack spacing={1} direction={"row"} sx={{ pt: 2.5 }}>
        <Slider
          value={local}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          onChange={(_, v) => {
            setLocal(v);
            debouncedCommit(v);
          }}
          sx={{ width: 500 }}
          valueLabelDisplay="on"
        />
      </Stack>
    </SettingRow>
  );
}
