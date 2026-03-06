import * as React from "react";
import {
  Paper,
  Stack,
  Button,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
} from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import StopIcon from "@mui/icons-material/Stop";

import { useRosTopics } from "../ros/useRosTopics";
import { useAppSnackbar } from "../ui/AppSnackbarProvider";
import { useAppDialog } from "../ui/AppDialogProvider";

const STEER_WAIT_MS = 700; // wait time after steering change
const STEER_STEP_DEG = 5; // left/right step in steering mode
const STEER_MIN = 45;
const STEER_MAX = 135;

export default function RunPage({ ros, connected, mode, setMode, autoState, setAutoState, estopActive }) {
  const [steerMode, setSteerMode] = React.useState("diff");
  const [steerDeg, setSteerDeg] = React.useState(0);
  const [steerBusy, setSteerBusy] = React.useState(false);
  const steerTimerRef = React.useRef(null);
  const publishTimerRef = React.useRef(null);

  const [selectedBench, setSelectedBench] = React.useState("");
  const [selectedRow, setSelectedRow] = React.useState("");
  const [autoRunning, setAutoRunning] = React.useState(false);
  const [marker, setMarker] = React.useState("-");
  const [currentBench, setCurrentBench] = React.useState("-");
  const [currentRow, setCurrentRow] = React.useState("-");

  const benches = React.useMemo(() => Array.from({ length: 10 }, (_, i) => i + 1), []);
  const rows = React.useMemo(() => Array.from({ length: 50 }, (_, i) => i + 11), []);

  const topicSpecs = React.useMemo(
    () => [
      {
        key: "cmdVel",
        name: "/wheel_rpm_manual",
        type: "std_msgs/msg/String",
        queue_size: 10,
      },
      {
        key: "steer",
        name: "/steer_manual",
        type: "std_msgs/msg/Float32",
        queue_size: 1,
      },
      {
        key: "mode",
        name: "/mode",
        type: "std_msgs/msg/String",
        queue_size: 1,
      },
      {
        key: "autoState",
        name: "/auto_state_cmd",
        type: "std_msgs/msg/String",
        queue_size: 1,
      },
      {
        key: "aruco_stop_request",
        name: "/aruco_stop_request",
        type: "std_msgs/msg/Bool",
        queue_size: 1,
      },
      {
        key: "aruco_debug",
        name: "/aruco_debug",
        type: "std_msgs/msg/String",
        queue_size: 1,
      },
      {
        key: "goalBench",
        name: "/goal_bench",
        type: "std_msgs/msg/Int16",
        queue_size: 1,
      },
      {
        key: "goalRow",
        name: "/goal_row",
        type: "std_msgs/msg/Int16",
        queue_size: 1,
      },
    ],
    [],
  );

  const { subscribe, publish, topicsReady } = useRosTopics(ros, connected, topicSpecs);

  const notify = useAppSnackbar();
  const { showDialog } = useAppDialog();

  const isManual = !estopActive && mode === "manual";
  const joystickEnabled = isManual && !steerBusy;

  function ensureRosReady() {
    if (!topicsReady) {
      notify.error("ROS not connected. Please connect from the top bar.");
      return false;
    }
    return true;
  }

  function stopContinuousCmd() {
    if (publishTimerRef.current) {
      clearInterval(publishTimerRef.current);
      publishTimerRef.current = null;
    }
    publishRPM("stop");
  }

  function publishRPM(command) {
    if (!ensureRosReady()) return;
    return publish("cmdVel", { data: command });
  }

  function publishSteer(deg) {
    if (!ensureRosReady()) return;
    return publish("steer", { data: deg });
  }

  function publishMode(nextMode) {
    if (!ensureRosReady()) return;
    publishSteer(0);
    return publish("mode", { data: nextMode });
  }

  function publishAutoState(nextState) {
    if (!ensureRosReady()) return;
    return publish("autoState", { data: nextState });
  }

  // Start continuous publish (10 Hz) while button is held
  function startContinuousCmd(command) {
    if (!isManual) return;
    stopContinuousCmd();
    publishRPM(command);
    publishTimerRef.current = setInterval(() => {
      publishRPM(command);
    }, 100);
  }

  function handleLeftPress() {
    if (!joystickEnabled) return;
    if (steerMode === "diff") {
      startContinuousCmd("left");
    } else {
      changeAckAngle(-STEER_STEP_DEG);
    }
  }

  function handleRightPress() {
    if (!joystickEnabled) return;
    if (steerMode === "diff") {
      startContinuousCmd("right");
    } else {
      changeAckAngle(+STEER_STEP_DEG);
    }
  }

  function changeAckAngle(delta) {
    const next = steerDeg + delta;
    if (next < STEER_MIN) {
      notify.warning(`Max steering reached +45°`);
      return;
    }
    if (next > STEER_MAX) {
      notify.warning(`Max steering reached -45°`);
      return;
    }
    beginSteerTransition(next);
  }

  function beginSteerTransition(nextDeg) {
    stopContinuousCmd();
    setSteerBusy(true);
    setSteerDeg(nextDeg);
    publishSteer(nextDeg);

    if (steerTimerRef.current) clearTimeout(steerTimerRef.current);
    steerTimerRef.current = setTimeout(() => {
      setSteerBusy(false);
    }, STEER_WAIT_MS);
  }

  function setSteeringMode(nextMode) {
    if (!isManual) return;
    setSteerMode(nextMode);

    if (nextMode === "diff") {
      beginSteerTransition(0);
    } else {
      beginSteerTransition(90);
    }
  }

  const requestModeChange = (nextMode) => {
    if (nextMode === "manual") {
      stopContinuousCmd();
      setMode("manual");
      publishMode("manual");
      return;
    }

    showDialog({
      title: "Switch to Auto mode?",
      content: "Make sure the robot is correctly positioned between the row/bench before enabling Auto mode. Continue?",
      actions: [
        { label: "Cancel", variant: "text", color: "inherit" },
        {
          label: "Yes, enable Auto",
          variant: "contained",
          color: "primary",
          onClick: () => {
            stopContinuousCmd();
            setMode("auto");
            setAutoState(null);
            publishMode("auto");
            publishAutoState("idle");
          },
        },
      ],
    });
  };

  const requestAutoStateChange = (nextState) => {
    if (!ensureRosReady()) return;
    if (mode !== "auto") return;
    stopContinuousCmd(); // safety
    setAutoState(nextState);
    publishAutoState(nextState);
  };

  function handleAutoStart() {
    if (!ensureRosReady()) return;
    if (!selectedBench || !selectedRow) {
      notify.warning("Please select bench and row");
      return;
    }
    publish("goalBench", { data: Number(selectedBench) });
    publish("goalRow", { data: Number(selectedRow) });
    const nextState = "bench_tracking_f";
    setAutoState(nextState);
    publishAutoState(nextState);
    setAutoRunning(true);
  }

  function handleAutoStop() {
    if (!ensureRosReady()) return;
    setAutoRunning(false);
    setAutoState("idle");
    publishAutoState("idle");
  }

  React.useEffect(() => {
    if (!ros || !connected) return;

    const unsubDebug = subscribe(
      "aruco_debug",
      (msg) => {
        const d = msg?.data ?? [];

        const marker = Number(d[0]);
        const currentBench = Number(d[1]);
        const currentRow = Number(d[2]);

        if (Number.isFinite(marker)) setMarker(marker);
        if (Number.isFinite(currentBench)) setCurrentBench(currentBench);
        if (Number.isFinite(currentRow)) setCurrentRow(currentRow);
      },
      { throttleMs: 200 },
    );

    const unsubStop = subscribe(
      "aruco_stop_request",
      (msg) => {
        if (msg?.data === true) {
          setAutoRunning(false);
          setAutoState("idle");
          notify.warning("Goal reached");
        }
      },
      { throttleMs: 100 },
    );

    return () => {
      unsubDebug();
      unsubStop();
    };
  }, [subscribe, connected]);

  React.useEffect(() => {
    return () => {
      if (steerTimerRef.current) clearTimeout(steerTimerRef.current);
      if (publishTimerRef.current) clearInterval(publishTimerRef.current);
    };
  }, []);

  return (
    <Stack spacing={2} direction="row">
      <Paper variant="outlined" sx={{ p: 1.5, width: "33%" }}>
        <Stack spacing={3}>
          <Typography variant="body1"> Drive mode </Typography>
          <ToggleButtonGroup
            value={mode}
            exclusive
            onChange={(_, v) => {
              if (!v) return;
              requestModeChange(v);
            }}
            fullWidth
            sx={{
              "& .MuiToggleButton-root": { textTransform: "none" },
              height: 60,
              "& .MuiToggleButton-root:first-of-type": {
                borderTopLeftRadius: 50,
                borderBottomLeftRadius: 50,
              },

              // Last button
              "& .MuiToggleButton-root:last-of-type": {
                borderTopRightRadius: 50,
                borderBottomRightRadius: 50,
              },
            }}
          >
            <ToggleButton value="manual" sx={{ fontSize: 20 }}>
              Manual
            </ToggleButton>
            <ToggleButton value="auto" sx={{ fontSize: 20 }}>
              Auto
            </ToggleButton>
          </ToggleButtonGroup>

          <Typography variant="body1">Steering mode</Typography>

          <ToggleButtonGroup
            value={steerMode}
            exclusive
            onChange={(_, v) => {
              if (!v) return;
              setSteeringMode(v);
            }}
            disabled={!isManual || steerBusy}
            fullWidth
            sx={{
              "& .MuiToggleButton-root": { textTransform: "none" },
              height: 60,
              "& .MuiToggleButton-root:first-of-type": {
                borderTopLeftRadius: 50,
                borderBottomLeftRadius: 50,
              },

              // Last button
              "& .MuiToggleButton-root:last-of-type": {
                borderTopRightRadius: 50,
                borderBottomRightRadius: 50,
              },
            }}
          >
            <ToggleButton value="diff" sx={{ fontSize: 20 }}>
              Diff
            </ToggleButton>
            <ToggleButton value="ackermann" sx={{ fontSize: 20 }}>
              Ackermann
            </ToggleButton>
          </ToggleButtonGroup>

          <Divider />

          <Stack spacing={1} alignItems="stretch" direction="row" sx={{ height: 150 }}>
            {/* Forward */}
            <Button
              variant="contained"
              fullWidth
              disabled={!joystickEnabled}
              sx={{
                textTransform: "none",
                width: "25%",
                fontSize: 20,
                borderTopLeftRadius: 100,
                borderBottomLeftRadius: 100,
              }}
              onMouseDown={handleLeftPress}
              onMouseUp={stopContinuousCmd}
              onMouseLeave={stopContinuousCmd}
              onTouchStart={handleLeftPress}
              onTouchEnd={stopContinuousCmd}
            >
              {steerMode === "ackermann" ? `-${STEER_STEP_DEG}°` : "Left"}
            </Button>
            <Stack spacing={1} width="100%" sx={{ flex: 1, height: "100%" }}>
              {/* Left */}
              <Button
                variant="contained"
                fullWidth
                disabled={!joystickEnabled}
                onMouseDown={() => startContinuousCmd("forward")}
                onMouseUp={stopContinuousCmd}
                onMouseLeave={stopContinuousCmd}
                onTouchStart={() => startContinuousCmd("forward")}
                onTouchEnd={stopContinuousCmd}
                sx={{ flex: 1, fontSize: 20 }}
              >
                Forward
              </Button>
              {/* Backward */}
              <Button
                variant="contained"
                fullWidth
                disabled={!joystickEnabled}
                onMouseDown={() => startContinuousCmd("backward")}
                onMouseUp={stopContinuousCmd}
                onMouseLeave={stopContinuousCmd}
                onTouchStart={() => startContinuousCmd("backward")}
                onTouchEnd={stopContinuousCmd}
                sx={{ flex: 1, fontSize: 20 }}
              >
                Backward
              </Button>
            </Stack>
            {/* Right */}
            <Button
              variant="contained"
              fullWidth
              disabled={!joystickEnabled}
              sx={{
                textTransform: "none",
                width: "25%",
                fontSize: 20,
                borderTopRightRadius: 100,
                borderBottomRightRadius: 100,
              }}
              onMouseDown={handleRightPress}
              onMouseUp={stopContinuousCmd}
              onMouseLeave={stopContinuousCmd}
              onTouchStart={handleRightPress}
              onTouchEnd={stopContinuousCmd}
            >
              {steerMode === "ackermann" ? `+${STEER_STEP_DEG}°` : "Right"}
            </Button>
          </Stack>

          <Typography variant="body1" sx={{ pt: 1.5 }}>
            Current steering angle: {steerMode === "ackermann" ? <b>{steerDeg - 90}°</b> : <b>0°</b>}
          </Typography>

          <Typography variant="caption" color="text.secondary">
            Tip: hold teleop buttons to keep moving CEAbot.
          </Typography>
        </Stack>
      </Paper>
      <Paper variant="outlined" sx={{ p: 1.5, width: "67%" }}>
        <Stack spacing={3}>
          <Stack direction="row">
            <Typography variant="body1"> Auto mode </Typography>
          </Stack>
          <ToggleButtonGroup
            value={autoState ?? null}
            disabled={mode !== "auto"}
            exclusive
            onChange={(_, v) => {
              if (v == null) return;
              requestAutoStateChange(v);
            }}
            fullWidth
            sx={{
              "& .MuiToggleButton-root": { textTransform: "none" },
              height: 60,
              "& .MuiToggleButton-root:first-of-type": {
                borderTopLeftRadius: 50,
                borderBottomLeftRadius: 50,
              },
              "& .MuiToggleButton-root:last-of-type": {
                borderTopRightRadius: 50,
                borderBottomRightRadius: 50,
              },
            }}
          >
            <ToggleButton value="bench_tracking_f" sx={{ fontSize: 20 }}>
              Mode 1
            </ToggleButton>
            <ToggleButton value="bench_tracking_b" sx={{ fontSize: 20 }}>
              Mode 2
            </ToggleButton>
          </ToggleButtonGroup>
        </Stack>

        <Stack spacing={3} sx={{ marginTop: 2 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography variant="body1">
              Auto mode
              {selectedBench && selectedRow ? `  |  Target: Bench ${selectedBench}, Row ${selectedRow}` : ""}
            </Typography>
          </Stack>

          <Stack direction="row" spacing={5}>
            <FormControl fullWidth size="small" disabled={mode !== "auto" || autoRunning}>
              <InputLabel>Bench No</InputLabel>
              <Select value={selectedBench} label="Bench No" onChange={(e) => setSelectedBench(e.target.value)}>
                {benches.map((bench) => (
                  <MenuItem key={bench} value={bench}>
                    {bench}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth size="small" disabled={mode !== "auto" || autoRunning}>
              <InputLabel>Row No</InputLabel>
              <Select value={selectedRow} label="Row No" onChange={(e) => setSelectedRow(e.target.value)}>
                {rows.map((row) => (
                  <MenuItem key={row} value={row}>
                    {row}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>

          <Stack direction="row" spacing={2}>
            <Button
              variant="contained"
              fullWidth
              disabled={mode !== "auto" || autoRunning}
              onClick={handleAutoStart}
              sx={{ height: 56, fontSize: 18, textTransform: "none", borderRadius: 10 }}
              startIcon={autoRunning ? <CircularProgress size={18} color="inherit" /> : <PlayArrowIcon />}
            >
              {autoRunning ? "Running..." : "Start"}
            </Button>

            <Button
              variant="outlined"
              color="error"
              fullWidth
              disabled={mode !== "auto" || !autoRunning}
              onClick={handleAutoStop}
              sx={{ height: 56, fontSize: 18, textTransform: "none", borderRadius: 10 }}
              startIcon={<StopIcon />}
            >
              Stop
            </Button>
          </Stack>

          <Paper variant="outlined" sx={{ p: 2, bgcolor: "background.default" }}>
            <Stack spacing={1}>
              <Typography variant="body2">
                Current: Bench {currentBench}, Row {currentRow}
              </Typography>
              <Typography variant="body2">Marker: {marker}</Typography>
              <Typography variant="body2">
                <b>Current state:</b> {autoRunning ? "running" : autoState || "idle"}
              </Typography>
            </Stack>
          </Paper>
        </Stack>
      </Paper>
    </Stack>
  );
}
