import * as React from "react";
import { Box,Dialog, DialogTitle, DialogContent, DialogActions, Button} from "@mui/material";

import TopStatusBar from "./components/TopStatusBar";
import BottomNav from "./components/BottomNav";
import PageContainer from "./components/PageContainer";

import HomePage from "./pages/HomePage";
import RunPage from "./pages/RunPage";
import PhenoPage from "./pages/PhenoPage";
import SettingsPage from "./pages/SettingsPage";
import LogsPage from "./pages/LogsPage";
import TestPage from "./pages/TestPage";

import { useRos } from "./ros/useRos";
import { ROSBRIDGE_DEFAULT_URL } from "./ros/config";


export default function App() {
  const [tab, setTab] = React.useState(0);
  const [blockedOpen, setBlockedOpen] = React.useState(false);
  const [requestedTab, setRequestedTab] = React.useState(0);

  const { ros, connected, lastError, connect, disconnect } =
    useRos(ROSBRIDGE_DEFAULT_URL);

  const PROTECTED_TABS = new Set([1, 2, 3, 4, 5]);

  const handleTabChange = (nextTab) => {
    if (!connected && PROTECTED_TABS.has(nextTab)) {
      setRequestedTab(nextTab);
      setBlockedOpen(true);
      return; 
    }
    setTab(nextTab);
  };

  const [status] = React.useState({
    rosbridgeConnected: true,
    mode: "IDLE",
    estop: false,
    batteryPct: 84,
    latencyMs: 18,
    cpuTempC: 52,
  });

  const pages = [
    <HomePage ros={ros} connected={connected}/>,
    <RunPage ros={ros} connected={connected}/>,
    <PhenoPage ros={ros} connected={connected}/>,
    <SettingsPage ros={ros} connected={connected}/>,
    <LogsPage ros={ros} connected={connected}/>,
    <TestPage ros={ros} connected={connected}/>,
  ];

  return (
    <Box sx={{ bgcolor: "background.default" }}>
      <TopStatusBar 
        status={status}
        connected={connected}
        lastError={lastError}
        connect={connect}
        disconnect={disconnect} />
      <PageContainer>{pages[tab]}</PageContainer>
      <BottomNav value={tab} onChange={handleTabChange} />
      <Dialog open={blockedOpen} onClose={() => setBlockedOpen(false)}>
        <DialogTitle>CEAbot not connected</DialogTitle>
        <DialogContent>
          Please connect to the CEAbot before opening this page.
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBlockedOpen(false)}>OK</Button>
          <Button
            variant="contained"
            onClick={() => {
              setBlockedOpen(false);
              connect();
            }}
          >
            Connect now
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
