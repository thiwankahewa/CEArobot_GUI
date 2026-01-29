import * as React from "react";
import { Fab } from "@mui/material";

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
import { useAppDialog } from "./ui/AppDialogProvider.jsx";
import { useAppSnackbar } from "./ui/AppSnackbarProvider.jsx";
import { useRosTopics } from "./ros/useRosTopics";
import { getRos2ParamsBatch } from "./ros/getRos2ParamsBatch";
import {
  buildConfigFromSchema,
  schemaToDefaultConfig,
} from "./utils/configUtils";
import { SETTINGS_SCHEMA } from "./utils/schema";
import { LogsProvider } from "./ui/LogsCatcher.jsx";

const DEFAULT_CONFIG = schemaToDefaultConfig(SETTINGS_SCHEMA);

export default function App() {
  const [tab, setTab] = React.useState(1);
  const [estopActive, setEstopActive] = React.useState(false);
  const [initialConfig, setInitialConfig] = React.useState(
    () => DEFAULT_CONFIG,
  );
  const [config, setConfig] = React.useState(() => DEFAULT_CONFIG);
  const [settingsLoaded, setSettingsLoaded] = React.useState(false);

  const [status] = React.useState({
    rosbridgeConnected: true,
    mode: "IDLE",
    estop: false,
    batteryPct: 84,
    latencyMs: 18,
    cpuTempC: 52,
  });

  const [runUi, setRunUi] = React.useState({
    mode: "manual",
    steerMode: "diff",
    steerDeg: 0,
  });

  const { ros, connected, lastError, connect, disconnect } = useRos(
    ROSBRIDGE_DEFAULT_URL,
  );

  const dialog = useAppDialog();
  const notify = useAppSnackbar();

  const PROTECTED_TABS = new Set([1, 2, 3, 4, 5]);

  const topicSpecs = React.useMemo(
    () => [
      {
        key: "estop",
        name: "/e_stop",
        type: "std_msgs/msg/Bool",
        queue_size: 1,
      },
    ],
    [],
  );

  const { publish, topicsReady, subscribe } = useRosTopics(
    ros,
    connected,
    topicSpecs,
  );

  React.useEffect(() => {
    (async () => {
      if (!connected || !ros || settingsLoaded) return;

      try {
        const rosMap = await getRos2ParamsBatch({
          ros,
          schema: SETTINGS_SCHEMA,
        });
        const loaded = buildConfigFromSchema(SETTINGS_SCHEMA, rosMap);
        setInitialConfig(loaded);
        setConfig(loaded);
        setSettingsLoaded(true);
      } catch (e) {
        notify.error(e?.message);
      }
    })();
  }, [connected, ros, settingsLoaded]);

  const handleTabChange = (nextTab) => {
    if (!connected && PROTECTED_TABS.has(nextTab)) {
      dialog.showDialog({
        title: "CEAbot not connected",
        content: "Please connect to the CEAbot before opening this page.",
        actions: [
          { label: "OK" },
          {
            label: "Connect now",
            variant: "contained",
            onClick: connect,
          },
        ],
      });
      return;
    }
    setTab(nextTab);
  };

  function sendEstop(next) {
    if (!topicsReady) {
      notify.error("ROS not connected. Cannot toggle E-Stop.");
      return;
    }
    publish("estop", { data: !!next });
    setEstopActive(!!next);
    if (next) notify.error("Emergency Stop Activated");
    else notify.success("Emergency Stop Released");
  }

  function handleEstopClick() {
    if (!estopActive) {
      sendEstop(true);
      return;
    }
    sendEstop(false);
  }

  const pages = [
    /*<HomePage ros={ros} connected={connected} estopActive={estopActive} />,*/
    <RunPage
      ros={ros}
      connected={connected}
      runUi={runUi}
      setRunUi={setRunUi}
      estopActive={estopActive}
    />,
    <PhenoPage ros={ros} connected={connected} estopActive={estopActive} />,
    <SettingsPage
      ros={ros}
      connected={connected}
      estopActive={estopActive}
      config={config}
      setConfig={setConfig}
      initialConfig={initialConfig}
      setInitialConfig={setInitialConfig}
    />,
    <LogsPage ros={ros} connected={connected} estopActive={estopActive} />,
    <TestPage ros={ros} connected={connected} estopActive={estopActive} />,
  ];

  return (
    <div>
      <TopStatusBar
        status={status}
        connected={connected}
        lastError={lastError}
        connect={connect}
        disconnect={disconnect}
        mode={runUi.mode}
      />
      <LogsProvider ros={ros} connected={connected}>
        <PageContainer>{pages[tab]}</PageContainer>
      </LogsProvider>
      <BottomNav value={tab} onChange={handleTabChange} />
      <Fab
        variant="extended"
        color={estopActive ? "error" : "default"}
        onClick={handleEstopClick}
        sx={{
          position: "fixed",
          right: 25,
          bottom: 10,
          letterSpacing: 1.2,
          borderRadius: 10,
          padding: 4.5,
          fontSize: 17,
          ...(estopActive && {
            animation: "estopPulse 1.8s ease-in-out infinite",
            "@keyframes estopPulse": {
              "0%": {
                boxShadow: "0 0 0 0 rgba(211,47,47,0.8)",
              },
              "70%": {
                boxShadow: "0 0 0 14px rgba(211,47,47,0)",
              },
              "100%": {
                boxShadow: "0 0 0 0 rgba(211,47,47,0)",
              },
            },
          }),
        }}
      >
        E STOP
      </Fab>
    </div>
  );
}
