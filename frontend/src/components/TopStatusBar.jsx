import * as React from "react";
import { AppBar, Toolbar, Stack, Button } from "@mui/material";
import PowerSettingsNewIcon from "@mui/icons-material/PowerSettingsNew";
import ExitToAppIcon from "@mui/icons-material/ExitToApp";
import StatusChip from "./StatusChip";
import { useAppDialog } from "../ui/AppDialogProvider";
import { useAppSnackbar } from "../ui/AppSnackbarProvider";

export default function TopStatusBar({
  connected,
  lastError,
  connect,
  disconnect,
  mode,
}) {
  const dialog = useAppDialog();
  const notify = useAppSnackbar();

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

  async function exitKioskNow() {
    try {
      const r = await fetch("http://127.0.0.1:7777/exit-kiosk", {
        method: "POST",
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
    } catch (e) {
      notify.error("Failed to exit kiosk");
    }
  }

  function showExitKioskConfirm() {
    dialog.showDialog({
      title: "Exit kiosk mode",
      content: "This will close the kiosk interface. Continue?",
      actions: [
        { label: "Cancel" },
        {
          label: "Exit",
          color: "warning",
          variant: "contained",
          onClick: exitKioskNow,
        },
      ],
    });
  }

  return (
    <>
      <AppBar position="fixed" elevation={1}>
        <Toolbar sx={{ backgroundColor: "#dce2e8ff" }}>
          <Stack direction="row" alignItems="center" sx={{ flex: 1 }}>
            <StatusChip
              label={`Mode: ${mode === "manual" ? "Manual" : "Auto"}`}
              color="primary"
              variant="outlined"
            />

            <Stack
              direction="row"
              spacing={1.5}
              sx={{
                marginLeft: "auto",
              }}
            >
              <Button
                startIcon={<ExitToAppIcon />}
                onClick={showExitKioskConfirm}
                sx={{
                  color: "#000",
                  backgroundColor: "#f0b429",
                  borderRadius: 10,
                  px: 3,
                }}
              >
                Exit
              </Button>

              <Button
                startIcon={<PowerSettingsNewIcon />}
                onClick={handleConnectionClick}
                sx={{
                  color: "#000",
                  backgroundColor: connected ? "#51b756ff" : "#e13434ff",
                  borderRadius: 10,
                  px: 3,
                }}
              >
                {connected ? "Disconnect" : "Connect"}
              </Button>
            </Stack>
          </Stack>
        </Toolbar>
      </AppBar>
    </>
  );
}
