import * as React from "react";
import { AppBar, Toolbar, Stack, Paper,  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions} from "@mui/material";
import PowerSettingsNewIcon from "@mui/icons-material/PowerSettingsNew";
import StatusChip from "./StatusChip";

export default function TopStatusBar({ status,connected,lastError,connect,disconnect, }) {
  const [confirmOpen, setConfirmOpen] = React.useState(false);

    const handleConnectionClick = () => {
    if (!connected) {
      connect();
      console.log("Connecting to ROS...");
      return;
    }
    setConfirmOpen(true);
  };

  React.useEffect(() => {
    if (lastError) {
      alert(`ROS connection failed: ${lastError}`);
    }
  }, [lastError]);

  const handleConfirmDisconnect = () => {
    disconnect();
    setConfirmOpen(false);
  };

  return (
    <>
    <AppBar position="fixed" elevation={1} >
      
      <Toolbar sx={{ gap: 1, minHeight: 56 }}>
        <Stack direction="row" spacing={1} sx={{ flex: 1, overflow: "auto" }}>
          <StatusChip label={`Mode: ${status.mode}`} color="primary" variant="outlined" />
          <StatusChip
            label={status.estop ? "E-STOP: ACTIVE" : "E-STOP: OK"}
            color={status.estop ? "error" : "success"}
          />
          <StatusChip
            label={`Battery: ${status.batteryPct}%`}
            color={status.batteryPct <= 20 ? "warning" : "default"}
            variant="outlined"
          />
          <StatusChip label={`Latency: ${status.latencyMs}ms`} variant="outlined" />
          <StatusChip label={`CPU: ${status.cpuTempC}°C`} variant="outlined" />
        </Stack>

        <Stack direction="row" spacing={1}>
          <Button
              variant="outlined"
              color="inherit"
              startIcon={<PowerSettingsNewIcon 
              sx={{
              color: connected ? "#2e7d32" : "#d32f2f",
              }}/>}
              onClick={handleConnectionClick}
              sx={{
    textTransform: "none",
    outline: "none",
    "&:focus": { outline: "none" },
    "&.Mui-focusVisible": { outline: "none" },
  }}
            >
              {connected ? "Disconnect" : "Connect"}
            </Button>
        </Stack>
      </Toolbar>
      
    </AppBar>
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>Disconnect from CEAbot</DialogTitle>
        <DialogContent>
          This will close the connection with CEAbot and change to IDLE state. Continue?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={handleConfirmDisconnect}>
            Disconnect
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
