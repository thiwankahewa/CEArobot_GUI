import * as React from "react";
import { Box } from "@mui/material";

export default function PageContainer({ children }) {
  return (
    <Box
      sx={{
        pt: "56px",
        pb: "76px",
        height: "100vh",
        overflow: "hidden",
        bgcolor: "background.default",
        width: "100vw",
      }}
    >
      <Box sx={{ height: "100%", overflow: "auto", p: 3, width: "100%" }}>
        {children}
      </Box>
    </Box>
  );
}
