import * as React from "react";
import { Chip } from "@mui/material";

export default function StatusChip({ label, color = "default", variant = "filled" }) {
  return <Chip size="small" label={label} color={color} variant={variant} />;
}
