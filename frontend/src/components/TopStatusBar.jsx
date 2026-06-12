import * as React from "react";
import { AppBar, Toolbar, Stack, Button, Box } from "@mui/material";
import PowerSettingsNewIcon from "@mui/icons-material/PowerSettingsNew";
import ExitToAppIcon from "@mui/icons-material/ExitToApp";
import StatusChip from "./StatusChip";
import { useAppDialog } from "../ui/AppDialogProvider";
import { useAppSnackbar } from "../ui/AppSnackbarProvider";
import Logo from "../assets/ugaLogo.png";

function formatRobotState(robotState) {
  if (!robotState) return "Unknown";
  return String(robotState)
    .split("_")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default function TopStatusBar({ connected, lastError, connect, disconnect, autoState }) {
  const dialog = useAppDialog();
  const notify = useAppSnackbar();

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

  async function exitKioskNow() {
    try {
      const r = await fetch("http://127.0.0.1:7777/exit-kiosk", {
        method: "POST",
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
    } catch {
      notify.error("Failed to exit kiosk");
    }
  }

  const handleConnectionClick = () => {
    if (!connected) {
      connect();
      return;
    }
    showDisconnectConfirm();
  };

  function showDisconnectConfirm() {
    dialog.showDialog({
      title: "Disconnect from CEAbot",
      content: "This will close the connection with CEAbot and change to IDLE state. Continue?",
      actions: [
        {
          label: "Cancel",
        },
        {
          label: "Disconnect",
          color: "error",
          variant: "contained",
          onClick: () => {
            disconnect();
            notify.success("Disconnected from CEAbot");
          },
        },
      ],
    });
  }

  React.useEffect(() => {
    if (lastError) {
      notify.error(`${lastError}`);
    }
  }, [lastError]);

  return (
    <>
      <AppBar position="fixed" elevation={1}>
        <Toolbar sx={{ backgroundColor: "#dce2e8ff" }}>
          <Stack direction="row" alignItems="center" sx={{ flex: 1 }}>
            <Stack direction="row" spacing={1.5}>
              <StatusChip label={`Robot State: ${formatRobotState(autoState)}`} color={connected ? "info" : "default"} variant="outlined" />
            </Stack>
            <Box
              component="img"
              src={Logo}
              alt="Logo"
              sx={{
                position: "absolute",
                left: "50%",
                transform: "translateX(-50%)",
                height: 40, // adjust size
              }}
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
