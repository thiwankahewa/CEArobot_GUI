import * as React from "react";
import { Fab } from "@mui/material";

import TopStatusBar from "./components/TopStatusBar";
import BottomNav from "./components/BottomNav";
import PageContainer from "./components/PageContainer";

import RunPage from "./pages/RunPage";
import PhenoPage from "./pages/PhenoPage";
import SettingsPage from "./pages/SettingsPage";
import LogsPage from "./pages/LogsPage";
import TestPage from "./pages/TestPage";
import { LogsProvider } from "./ui/LogsCatcher.jsx";

import { useAppDialog } from "./ui/AppDialogProvider.jsx";
import { useAppSnackbar } from "./ui/AppSnackbarProvider.jsx";
import { useRos } from "./ros/useRos";
import { useRosTopics } from "./ros/useRosTopics";
import { getRos2ParamsBatch } from "./ros/getRos2ParamsBatch";
import { buildConfigFromSchema, schemaToDefaultConfig } from "./utils/configUtils";
import { SETTINGS_SCHEMA } from "./utils/schema";

const DEFAULT_CONFIG = schemaToDefaultConfig(SETTINGS_SCHEMA);

export default function App() {
  const [tab, setTab] = React.useState(1);
  const [estopActive, setEstopActive] = React.useState(false);
  const [initialConfig, setInitialConfig] = React.useState(() => DEFAULT_CONFIG);
  const [config, setConfig] = React.useState(() => DEFAULT_CONFIG);
  const [settingsLoaded, setSettingsLoaded] = React.useState(false);

  const [mode, setMode] = React.useState("manual");
  const [autoState, setAutoState] = React.useState(null);

  /*const [runUi, setRunUi] = React.useState({
    mode: "manual",
    autoState: null,
  });*/

  const { ros, connected, lastError, connect, disconnect } = useRos("ws://localhost:9090");

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

  const { publish, topicsReady, subscribe } = useRosTopics(ros, connected, topicSpecs);

  const pages = [
    <RunPage
      ros={ros}
      connected={connected}
      mode={mode}
      setMode={setMode}
      autoState={autoState}
      setAutoState={setAutoState}
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

  function handleEstopClick() {
    if (!estopActive) {
      sendEstop(true);
      return;
    }
    sendEstop(false);
  }

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

  React.useEffect(() => {
    if (connected) {
      setEstopActive(true);
      publish("estop", { data: true });
      return;
    }
    setEstopActive(false);
  }, [connected]);

  const prevConnectedRef = React.useRef(false);
  React.useEffect(() => {
    const prev = prevConnectedRef.current;
    prevConnectedRef.current = connected;

    if (!prev && connected) {
      // UI safety defaults (ONLY on connect/reconnect)
      setMode("manual");
      setAutoState("idle");
    }

    if (!connected) {
      // Optional: reflect disconnected state in UI
      setAutoState("disconnected");
    }
  }, [connected, setMode, setAutoState]);

  const prevTopicsReadyRef = React.useRef(false);
  React.useEffect(() => {
    const prev = prevTopicsReadyRef.current;
    prevTopicsReadyRef.current = topicsReady;

    if (!prev && topicsReady) {
      // Force robot into safe states once topics are usable
      publish("mode", { data: "manual" });
      publish("autoState", { data: "idle" });
    }
  }, [topicsReady, publish]);

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

  return (
    <div>
      <TopStatusBar ros={ros} connected={connected} lastError={lastError} connect={connect} disconnect={disconnect} mode={mode} />
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
