import * as React from "react";
import { AppBar, Toolbar, Stack, Button } from "@mui/material";
import PowerSettingsNewIcon from "@mui/icons-material/PowerSettingsNew";
import StatusChip from "./StatusChip";
import { useAppDialog } from "../ui/AppDialogProvider";
import { useAppSnackbar } from "../ui/AppSnackbarProvider";
import { useLogs } from "../ui/LogsProvider";

export default function TopStatusBar({
  status,
  connected,
  lastError,
  connect,
  disconnect,
  mode,
}) {
  const dialog = useAppDialog();
  const notify = useAppSnackbar();
  const { status: logsStatus } = useLogs();

  const handleConnectionClick = () => {
    if (!connected) {
      connect();
      return;
    }
    showDisconnectConfirm();
  };

  React.useEffect(() => {
    if (lastError) {
      notify.error(`${lastError}`);
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

  const logsChipColor =
    logsStatus === "connected"
      ? "success"
      : logsStatus === "connecting"
      ? "warning"
      : "default";

  return (
    <>
      <AppBar position="fixed" elevation={1}>
        <Toolbar sx={{ backgroundColor: "#dce2e8ff" }}>
          <Stack direction="row" spacing={1} sx={{ flex: 1, overflow: "auto" }}>
            <StatusChip
              label={`Logs: ${logsStatus}`}
              color={logsChipColor}
              variant="outlined"
            />
            <StatusChip
              label={`Mode: ${mode === "manual" ? "Manual" : "Auto"}`}
              color="primary"
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
