import * as React from "react";
import { AppBar, Toolbar, Stack, Button } from "@mui/material";
import PowerSettingsNewIcon from "@mui/icons-material/PowerSettingsNew";
import StatusChip from "./StatusChip";
import { useAppDialog } from "../utils/AppDialogProvider.jsx";

export default function TopStatusBar({
  status,
  connected,
  lastError,
  connect,
  disconnect,
  mode,
}) {
  const dialog = useAppDialog();

  const handleConnectionClick = () => {
    if (!connected) {
      connect();
      return;
    }
    showDisconnectConfirm();
  };

  React.useEffect(() => {
    if (lastError) {
      alert(`ROS connection failed: ${lastError}`);
    }
  }, [lastError]);

  const handleConfirmDisconnect = () => {
    disconnect();
  };

  function showDisconnectConfirm() {
    dialog.showDialog({
      title: "Disconnect from CEAbot",
      content:
        "This will close the connection with CEAbot and change to IDLE state. Continue?",
      actions: [
        {
          label: "Cancel",
        },
        {
          label: "Disconnect",
          color: "error",
          variant: "contained",
          onClick: handleConfirmDisconnect,
        },
      ],
    });
  }

  return (
    <>
      <AppBar position="fixed" elevation={1}>
        <Toolbar sx={{ backgroundColor: "#dce2e8ff" }}>
          <Stack direction="row" spacing={1} sx={{ flex: 1, overflow: "auto" }}>
            <StatusChip
              label={`Mode: ${mode === "manual" ? "Manual" : "Auto"}`}
              color="primary"
              variant="outlined"
            />
            <StatusChip
              label={`Battery: ${status.batteryPct}%`}
              color={status.batteryPct <= 20 ? "warning" : "default"}
              variant="outlined"
            />
            <StatusChip
              label={`Latency: ${status.latencyMs}ms`}
              variant="outlined"
            />
            <StatusChip
              label={`CPU: ${status.cpuTempC}°C`}
              variant="outlined"
            />
          </Stack>

          <Button
            startIcon={<PowerSettingsNewIcon />}
            onClick={handleConnectionClick}
            sx={{
              color: "#000000",
              backgroundColor: connected ? "#51b756ff" : "#e13434ff",
              borderRadius: 10,
              px: 3,
            }}
          >
            {connected ? "Disconnect" : "Connect"}
          </Button>
        </Toolbar>
      </AppBar>
    </>
  );
}
