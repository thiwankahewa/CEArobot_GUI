import * as React from "react";
import { logsSocket, LogItem } from "../utils/logsSocket";

type Status = "connected" | "disconnected" | "connecting";

type LogsContextValue = {
  status: Status;
  logs: LogItem[];
  clear: () => void;
};

const LogsContext = React.createContext<LogsContextValue | null>(null);

export function LogsProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = React.useState<Status>("disconnected");
  const [logs, setLogs] = React.useState<LogItem[]>([]);
  const MAX_LOGS = 2000;

  React.useEffect(() => {
    const unsubStatus = logsSocket.onStatus(setStatus);
    const unsubLog = logsSocket.onLog((item) => {
      setLogs((prev) => {
        const next = [...prev, item];
        if (next.length > MAX_LOGS) next.splice(0, next.length - MAX_LOGS);
        return next;
      });
    });

    // IMPORTANT: connect ONCE here (provider stays mounted)
    const url = "ws://127.0.0.1:8080/ws/logs";
    logsSocket.connect(url);

    return () => {
      unsubStatus();
      unsubLog();
      // optional: keep socket alive even if provider unmounts (usually app never unmounts)
      // logsSocket.disconnect();
    };
  }, []);

  const value: LogsContextValue = React.useMemo(
    () => ({
      status,
      logs,
      clear: () => setLogs([]),
    }),
    [status, logs]
  );

  return <LogsContext.Provider value={value}>{children}</LogsContext.Provider>;
}

export function useLogs() {
  const ctx = React.useContext(LogsContext);
  if (!ctx) throw new Error("useLogs must be used inside <LogsProvider>");
  return ctx;
}
