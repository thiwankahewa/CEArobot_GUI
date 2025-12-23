import * as React from "react";
import { Slider, Stack, Typography, Chip } from "@mui/material";
import SettingRow from "./SettingRow";
import { useDebouncedCallback } from "./useDebouncedCallback";

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
  debounceMs = 150,
}) {
  const [local, setLocal] = React.useState(value ?? min ?? 0);

  React.useEffect(() => {
    setLocal(value ?? min ?? 0);
  }, [value, min]);

  const debouncedCommit = useDebouncedCallback((v) => {
    onChangeCommitted(v);
  }, debounceMs);

  return (
    <SettingRow
      title={title}
      description={description}
      disabled={disabled}
      right={
        <Chip
          label={`${local}${unit ?? ""}`}
          sx={{ fontWeight: 900, fontSize: 16, px: 1.2, borderRadius: 2 }}
        />
      }
    >
      <Stack spacing={1}>
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
        />
        <Typography variant="caption" color="text.secondary">
          {min}
          {unit ?? ""} — {max}
          {unit ?? ""} (step {step}
          {unit ?? ""})
        </Typography>
      </Stack>
    </SettingRow>
  );
}
