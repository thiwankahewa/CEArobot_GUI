import * as React from "react";
import { AppBar, Toolbar, Stack, Button, Box, ClickAwayListener, IconButton, Paper, Popper, Tooltip } from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
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

function parsePerformanceStats(line) {
  if (!line) return null;

  const ramMatch = line.match(/RAM\s+(\d+)\/(\d+)MB/i);
  const cpuMatch = line.match(/CPU\s+\[([^\]]+)\]/i);
  const gpuMatch = line.match(/GR3D_FREQ\s+(\d+)%/i);
  const tempMatch = line.match(/(?:tj|cpu)@([\d.]+)C/i);
  const powerMatch = line.match(/VDD_IN\s+(\d+)mW/i);

  const stats = {};

  if (ramMatch) {
    const usedMb = Number(ramMatch[1]);
    const totalMb = Number(ramMatch[2]);
    stats.ram = {
      usedGb: usedMb / 1024,
      totalGb: totalMb / 1024,
      percent: totalMb > 0 ? Math.round((usedMb / totalMb) * 100) : 0,
    };
  }

  if (cpuMatch) {
    const loads = cpuMatch[1]
      .split(",")
      .map((part) => Number(part.match(/(\d+)%/)?.[1]))
      .filter(Number.isFinite);

    if (loads.length > 0) {
      stats.cpu = Math.round(loads.reduce((sum, load) => sum + load, 0) / loads.length);
    }
  }

  if (gpuMatch) stats.gpu = Number(gpuMatch[1]);
  if (tempMatch) stats.temp = Number(tempMatch[1]);
  if (powerMatch) stats.powerW = Number(powerMatch[1]) / 1000;

  return Object.keys(stats).length ? stats : null;
}

function statColor(value, warning, error) {
  if (!Number.isFinite(value)) return "default";
  if (value >= error) return "error";
  if (value >= warning) return "warning";
  return "success";
}

export default function TopStatusBar({ connected, lastError, connect, disconnect, autoState, performanceLine }) {
  const dialog = useAppDialog();
  const notify = useAppSnackbar();
  const [statsOpen, setStatsOpen] = React.useState(false);
  const statsButtonRef = React.useRef(null);
  const performanceStats = React.useMemo(() => parsePerformanceStats(performanceLine), [performanceLine]);

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

  const statsChips = (
    <>
      <StatusChip label={`Robot State: ${formatRobotState(autoState)}`} color={connected ? "info" : "default"} variant="outlined" />
      {performanceStats?.ram && (
        <StatusChip
          label={`RAM ${performanceStats.ram.usedGb.toFixed(1)}/${performanceStats.ram.totalGb.toFixed(1)}GB`}
          color={statColor(performanceStats.ram.percent, 75, 90)}
          variant="outlined"
        />
      )}
      {Number.isFinite(performanceStats?.cpu) && (
        <StatusChip label={`CPU ${performanceStats.cpu}%`} color={statColor(performanceStats.cpu, 75, 90)} variant="outlined" />
      )}
      {Number.isFinite(performanceStats?.gpu) && (
        <StatusChip label={`GPU ${performanceStats.gpu}%`} color={statColor(performanceStats.gpu, 75, 90)} variant="outlined" />
      )}
      {Number.isFinite(performanceStats?.temp) && (
        <StatusChip label={`Temp ${Math.round(performanceStats.temp)}C`} color={statColor(performanceStats.temp, 70, 85)} variant="outlined" />
      )}
      {Number.isFinite(performanceStats?.powerW) && (
        <StatusChip label={`Power ${performanceStats.powerW.toFixed(1)}W`} color="default" variant="outlined" />
      )}
    </>
  );

  return (
    <>
      <AppBar position="fixed" elevation={1}>
        <Toolbar sx={{ backgroundColor: "#dce2e8ff" }}>
          <Stack direction="row" alignItems="center" sx={{ flex: 1 }}>
            <Tooltip title={statsOpen ? "Hide stats" : "Show stats"}>
              <IconButton
                ref={statsButtonRef}
                aria-label={statsOpen ? "Hide stats" : "Show stats"}
                aria-expanded={statsOpen ? "true" : undefined}
                onClick={() => setStatsOpen((open) => !open)}
                sx={{
                  color: "#000",
                  mr: 1,
                }}
              >
                <MenuIcon />
              </IconButton>
            </Tooltip>
            <Stack
              direction="row"
              spacing={1}
              sx={{
                alignItems: "center",
                overflow: "hidden",
                maxWidth: { xs: "calc(100vw - 270px)", md: "calc(50vw - 140px)" },
              }}
            >
              <StatusChip label={`Robot State: ${formatRobotState(autoState)}`} color={connected ? "info" : "default"} variant="outlined" />
            </Stack>
            <Popper
              open={statsOpen}
              anchorEl={statsButtonRef.current}
              placement="bottom-start"
              sx={{ zIndex: (theme) => theme.zIndex.appBar + 1 }}
            >
              <ClickAwayListener onClickAway={() => setStatsOpen(false)}>
                <Paper
                  elevation={4}
                  sx={{
                    mt: 1,
                    p: 1,
                    maxWidth: { xs: "calc(100vw - 24px)", sm: 520 },
                    backgroundColor: "#f7f9fb",
                  }}
                >
                  <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ alignItems: "center" }}>
                    {statsChips}
                  </Stack>
                </Paper>
              </ClickAwayListener>
            </Popper>
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
