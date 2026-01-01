export type LogLevel = "DEBUG" | "INFO" | "WARN" | "ERROR" | "FATAL" | string;

export type LogItem = {
  ts_ns: number;
  level: LogLevel;
  name: string;
  msg: string;
  file?: string;
  function?: string;
  line?: number;
};

type LogListener = (item: LogItem) => void;
type Status = "connected" | "disconnected" | "connecting";
type StatusListener = (s: Status) => void;

class LogsSocket {
  private ws: WebSocket | null = null;
  private logListeners = new Set<LogListener>();
  private statusListeners = new Set<StatusListener>();
  private reconnectTimer: number | null = null;

  connect(url: string) {
    // prevent duplicate connects
    if (
      this.ws &&
      (this.ws.readyState === WebSocket.OPEN ||
        this.ws.readyState === WebSocket.CONNECTING)
    )
      return;

    this.emitStatus("connecting");
    const ws = new WebSocket(url);
    this.ws = ws;

    ws.onopen = () => this.emitStatus("connected");

    ws.onmessage = (ev) => {
      try {
        const parsed = JSON.parse(ev.data);
        if (parsed?.type === "rosout" && parsed?.data) {
          this.emitLog(parsed.data as LogItem);
        }
      } catch {
        // ignore
      }
    };

    ws.onclose = () => {
      this.emitStatus("disconnected");
      this.ws = null;

      // auto-reconnect
      if (this.reconnectTimer) window.clearTimeout(this.reconnectTimer);
      this.reconnectTimer = window.setTimeout(() => {
        this.connect(url);
      }, 800);
    };

    ws.onerror = () => {
      // onclose will run after error in most cases
    };
  }

  disconnect() {
    if (this.reconnectTimer) window.clearTimeout(this.reconnectTimer);
    this.reconnectTimer = null;
    this.ws?.close();
    this.ws = null;
    this.emitStatus("disconnected");
  }

  onLog(fn: LogListener) {
    this.logListeners.add(fn);
    return () => this.logListeners.delete(fn);
  }

  onStatus(fn: StatusListener) {
    this.statusListeners.add(fn);
    return () => this.statusListeners.delete(fn);
  }

  private emitLog(item: LogItem) {
    for (const fn of this.logListeners) fn(item);
  }

  private emitStatus(s: Status) {
    for (const fn of this.statusListeners) fn(s);
  }
}

export const logsSocket = new LogsSocket();
