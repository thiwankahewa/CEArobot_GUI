import * as React from "react";
import {
  Stack,
  Paper,
  TextField,
  Button,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
} from "@mui/material";
import type { SelectChangeEvent } from "@mui/material/Select";

import { useLogs } from "../ui/LogsCatcher";

type LogLevel = "DEBUG" | "INFO" | "WARN" | "ERROR" | "FATAL" | string;

type LogItem = {
  ts_ns: number;
  level: LogLevel;
  name: string;
  msg: string;
  file?: string;
  function?: string;
  line?: number;
};

function formatTime(ts_ns: number) {
  const ms = Math.floor(ts_ns / 1_000_000); // ns → ms
  const d = new Date(ms);

  const hh = d.getHours().toString().padStart(2, "0");
  const mm = d.getMinutes().toString().padStart(2, "0");
  const ss = d.getSeconds().toString().padStart(2, "0");
  const mmm = (ms % 1000).toString().padStart(3, "0");

  return `${hh}:${mm}:${ss}.${mmm}`;
}

function getLevelStyles(level: LogLevel) {
  switch (String(level).toUpperCase()) {
    case "DEBUG":
      return {
        color: "#93c5fd",
        bg: "rgba(59, 130, 246, 0.1)",
        border: "rgba(147, 197, 253, 0.3)",
      };
    case "INFO":
      return {
        color: "#86efac",
        bg: "rgba(34, 197, 94, 0.1)",
        border: "rgba(134, 239, 172, 0.28)",
      };
    case "WARN":
      return {
        color: "#fde68a",
        bg: "rgba(245, 158, 11, 0.13)",
        border: "rgba(253, 230, 138, 0.35)",
      };
    case "ERROR":
      return {
        color: "#fca5a5",
        bg: "rgba(239, 68, 68, 0.15)",
        border: "rgba(252, 165, 165, 0.4)",
      };
    case "FATAL":
      return {
        color: "#f0abfc",
        bg: "rgba(192, 38, 211, 0.18)",
        border: "rgba(240, 171, 252, 0.45)",
      };
    default:
      return {
        color: "#d1d5db",
        bg: "rgba(148, 163, 184, 0.08)",
        border: "rgba(209, 213, 219, 0.22)",
      };
  }
}

export default function LogsPage() {
  const { status, logs, clear } = useLogs() as {
    status: "connected" | "connecting" | "disconnected";
    logs: LogItem[];
    clear: () => void;
  };

  const [text, setText] = React.useState("");
  const [node, setNode] = React.useState<string>("");
  const [level, setLevel] = React.useState<string>("");
  const [autoScroll, setAutoScroll] = React.useState(true);

  const logRef = React.useRef<HTMLDivElement | null>(null);

  const nodeOptions = React.useMemo(() => {
    const set = new Set<string>();
    for (const l of logs) set.add(l.name);
    return Array.from(set).sort();
  }, [logs]);

  const nodeCounts = React.useMemo(() => {
    const m = new Map<string, number>();
    for (const l of logs) m.set(l.name, (m.get(l.name) ?? 0) + 1);
    return m;
  }, [logs]);

  const handleNodeChange = (e: SelectChangeEvent<string>) =>
    setNode(e.target.value);
  const handleLevelChange = (e: SelectChangeEvent<string>) =>
    setLevel(e.target.value);

  const filtered = React.useMemo(() => {
    const t = text.trim().toLowerCase();
    const lvl = level.trim().toUpperCase();

    return logs.filter((l) => {
      if (node && l.name !== node) return false;
      if (lvl && String(l.level).toUpperCase() !== lvl) return false;
      if (t) {
        const hay = `${l.level} ${l.name} ${l.msg}`.toLowerCase();
        if (!hay.includes(t)) return false;
      }
      return true;
    });
  }, [logs, text, node, level]);

  React.useEffect(() => {
    if (!autoScroll) return;
    const el = logRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [filtered, autoScroll]);

  const resetFilters = () => {
    setText("");
    setNode("");
    setLevel("");
  };

  return (
    <Stack spacing={2}>
      <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
        <Stack direction="row" spacing={1}>
          <TextField
            size="small"
            label="Search text"
            fullWidth
            value={text}
            onChange={(e) => setText(e.target.value)}
          />

          <FormControl
            size="small"
            sx={{ minWidth: 240 }}
            disabled={!nodeOptions.length}
          >
            <InputLabel id="node-select-label">Node</InputLabel>
            <Select
              labelId="node-select-label"
              id="node-select"
              value={node}
              label="Node"
              onChange={handleNodeChange}
            >
              <MenuItem value="">
                <em>All nodes</em>
              </MenuItem>

              {nodeOptions.map((n) => (
                <MenuItem key={n} value={n}>
                  {n} ({nodeCounts.get(n) ?? 0})
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel id="level-select-label">Level</InputLabel>
            <Select
              labelId="level-select-label"
              id="level-select"
              value={level}
              label="Level"
              onChange={handleLevelChange}
            >
              <MenuItem value="">
                <em>All</em>
              </MenuItem>
              <MenuItem value="DEBUG">DEBUG</MenuItem>
              <MenuItem value="INFO">INFO</MenuItem>
              <MenuItem value="WARN">WARN</MenuItem>
              <MenuItem value="ERROR">ERROR</MenuItem>
              <MenuItem value="FATAL">FATAL</MenuItem>
            </Select>
          </FormControl>

          <Button variant="outlined" onClick={resetFilters}>
            Reset
          </Button>
          <Button variant="contained" onClick={clear}>
            Clear
          </Button>
        </Stack>

        <FormControlLabel
          control={
            <Switch
              checked={autoScroll}
              onChange={(e) => setAutoScroll(e.target.checked)}
            />
          }
          label="Auto-scroll"
          sx={{ mb: 1 }}
        />

        <Box
          ref={logRef}
          sx={{
            m: 0,
            p: 1,
            borderRadius: 2,
            bgcolor: "grey.900",
            color: "grey.100",
            overflow: "auto",
            height: 475,
            fontSize: 12,
            userSelect: "none",
            scrollbarColor: "#3248ad #1e1e1e",
            fontFamily:
              'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
          }}
        >
          {filtered.length ? (
            <Stack spacing={0.5}>
              {filtered.map((l, index) => {
                const levelText = String(l.level).toUpperCase();
                const levelStyles = getLevelStyles(l.level);

                return (
                  <Box
                    key={`${l.ts_ns}-${index}`}
                    sx={{
                      display: "grid",
                      gridTemplateColumns: "96px 70px minmax(140px, 240px) 1fr",
                      gap: 1,
                      alignItems: "start",
                      px: 1,
                      py: 0.75,
                      borderRadius: 1,
                      bgcolor: levelStyles.bg,
                      borderLeft: `3px solid ${levelStyles.border}`,
                      lineHeight: 1.45,
                    }}
                  >
                    <Box component="span" sx={{ color: "grey.400", whiteSpace: "nowrap" }}>
                      {formatTime(l.ts_ns)}
                    </Box>
                    <Box
                      component="span"
                      sx={{
                        color: levelStyles.color,
                        fontWeight: 800,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {levelText}
                    </Box>
                    <Box component="span" sx={{ color: "grey.300", overflowWrap: "anywhere" }}>
                      {l.name}
                    </Box>
                    <Box component="span" sx={{ color: "grey.100", overflowWrap: "anywhere" }}>
                      {l.msg}
                    </Box>
                  </Box>
                );
              })}
            </Stack>
          ) : (
            <Box sx={{ p: 1, color: "grey.300" }}>No logs match the current filters.</Box>
          )}
        </Box>
      </Paper>
    </Stack>
  );
}
