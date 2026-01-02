import * as React from "react";
import { useRosTopics } from "../ros/useRosTopics"; // <-- adjust path

const LogsContext = React.createContext(null);

const LEVEL_MAP = {
  10: "DEBUG",
  20: "INFO",
  30: "WARN",
  40: "ERROR",
  50: "FATAL",
};

function toLogItem(m) {
  const ts_ns =
    Number(m?.stamp?.sec ?? 0) * 1e9 + Number(m?.stamp?.nanosec ?? 0);

  return {
    ts_ns,
    level: LEVEL_MAP[Number(m.level)] ?? String(m.level),
    name: m.name ?? "",
    msg: m.msg ?? "",
    file: m.file,
    function: m.function,
    line: typeof m.line === "number" ? m.line : undefined,
  };
}

export function LogsProvider({
  ros,
  connected,
  children,
  maxLogs = 2000,
  throttleMs = 20, // 20ms => max ~50 logs/sec pushed to UI
}) {
  const specs = React.useMemo(
    () => [
      {
        key: "rosout",
        name: "/rosout",
        type: "rcl_interfaces/msg/Log",
        queue_size: 200,
      },
    ],
    []
  );

  const { topicsReady, subscribe } = useRosTopics(ros, connected, specs);

  const [logs, setLogs] = React.useState([]);
  const [logsStatus, setLogsStatus] = React.useState("disconnected"); // connected/disconnected/connecting

  // status based on rosbridge connection + topics readiness
  React.useEffect(() => {
    if (!connected) setLogsStatus("disconnected");
    else if (connected && !topicsReady) setLogsStatus("connecting");
    else setLogsStatus("connected");
  }, [connected, topicsReady]);

  // subscribe to /rosout
  React.useEffect(() => {
    if (!connected || !topicsReady) return;

    const unsub = subscribe(
      "rosout",
      (msg) => {
        const item = toLogItem(msg);

        setLogs((prev) => {
          const next = [...prev, item];
          if (next.length > maxLogs) next.splice(0, next.length - maxLogs);
          return next;
        });
      },
      { throttleMs }
    );

    return () => unsub();
  }, [connected, topicsReady, subscribe, maxLogs, throttleMs]);

  const clear = React.useCallback(() => setLogs([]), []);

  const value = React.useMemo(
    () => ({
      status: logsStatus,
      logs,
      clear,
    }),
    [logsStatus, logs, clear]
  );

  return <LogsContext.Provider value={value}>{children}</LogsContext.Provider>;
}

export function useLogs() {
  const ctx = React.useContext(LogsContext);
  if (!ctx) throw new Error("useLogs must be used within LogsProvider");
  return ctx;
}
