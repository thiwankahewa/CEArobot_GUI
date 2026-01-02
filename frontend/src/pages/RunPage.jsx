import * as React from "react";
import {
  IconButton,
  Paper,
  Stack,
  Button,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  Divider,
} from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import StopIcon from "@mui/icons-material/Stop";

import { useRosTopics } from "../ros/useRosTopics";
import { useAppSnackbar } from "../ui/AppSnackbarProvider";

const STEER_WAIT_MS = 700; // wait time after steering change
const STEER_STEP_DEG = 5; // left/right step in steering mode
const STEER_MIN = 45;
const STEER_MAX = 135;

export default function RunPage({
  ros,
  connected,
  runUi,
  setRunUi,
  estopActive,
}) {
  const mode = runUi.mode;
  const autoMode = runUi.autoMode;
  const steerMode = runUi.steerMode;
  const steerDeg = runUi.steerAngleDeg;
  const setMode = (v) => setRunUi((s) => ({ ...s, mode: v }));
  const setAutoMode = (v) => setRunUi((s) => ({ ...s, autoMode: v }));
  const setSteerMode = (v) => setRunUi((s) => ({ ...s, steerMode: v }));
  const setSteerDeg = (v) => setRunUi((s) => ({ ...s, steerAngleDeg: v }));

  const [steerBusy, setSteerBusy] = React.useState(false);
  const steerTimerRef = React.useRef(null);
  const publishTimerRef = React.useRef(null);

  const topicSpecs = React.useMemo(
    () => [
      {
        key: "cmdVel",
        name: "/wheel_rpm_manual",
        type: "std_msgs/msg/Int16MultiArray",
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
    ],
    []
  );

  const { publish, topicsReady } = useRosTopics(ros, connected, topicSpecs);
  const notify = useAppSnackbar();

  const isManual = !estopActive && mode === "manual";
  const joystickEnabled = isManual && !steerBusy;

  function ensureRosReady() {
    if (!topicsReady) {
      notify.error("ROS not connected. Please connect from the top bar.");
      return false;
    }
    return true;
  }

  function publishRPM(LRPM, RRPM) {
    if (!ensureRosReady()) return;
    return publish("cmdVel", { data: [LRPM, RRPM] });
  }

  function publishSteer(deg) {
    if (!ensureRosReady()) return;
    return publish("steer", { data: deg });
  }

  function publishMode(nextMode) {
    if (!ensureRosReady()) return;
    if (nextMode === "auto") {
      publishSteer(0);
    }
    return publish("mode", { data: nextMode });
  }

  function publishAutoMode(nextMode) {
    if (!ensureRosReady()) return;
    return publish("autoMode", { data: nextMode });
  }

  function stopContinuousCmd() {
    if (publishTimerRef.current) {
      clearInterval(publishTimerRef.current);
      publishTimerRef.current = null;
    }
    publishRPM(0, 0);
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

  function beginSteerTransition(nextDeg) {
    stopContinuousCmd();

    // lock joystick while steering is moving
    setSteerBusy(true);
    setSteerDeg(nextDeg);
    publishSteer(nextDeg);

    if (steerTimerRef.current) clearTimeout(steerTimerRef.current);
    steerTimerRef.current = setTimeout(() => {
      setSteerBusy(false);
    }, STEER_WAIT_MS);
  }

  // Start continuous publish (10 Hz) while button is held
  function startContinuousCmd(LRPM, RRPM) {
    if (!isManual) return;
    stopContinuousCmd();
    publishRPM(LRPM, RRPM);
    publishTimerRef.current = setInterval(() => {
      publishRPM(LRPM, RRPM);
    }, 100);
  }

  function handleLeftPress() {
    if (!joystickEnabled) return;

    if (steerMode === "diff") {
      startContinuousCmd(10, -10);
    } else {
      changeAckAngle(-STEER_STEP_DEG);
    }
  }

  function handleRightPress() {
    if (!joystickEnabled) return;

    if (steerMode === "diff") {
      startContinuousCmd(-10, 10);
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

  function showSteerWarning(msg) {
    setSteerWarning(msg);
    setWarnOpen(true);
  }

  React.useEffect(() => {
    return () => {
      if (steerTimerRef.current) clearTimeout(steerTimerRef.current);
    };
  }, []);

  return (
    <Stack spacing={2} direction="row">
      <Paper variant="outlined" sx={{ p: 1.5, width: "33%" }}>
        <Stack spacing={3}>
          <Typography variant="body1"> Drive mode </Typography>
          <ToggleButtonGroup
            value={mode}
            disabled={estopActive}
            exclusive
            onChange={(_, v) => {
              if (!v) return;
              setMode(v);
              stopContinuousCmd();
              publishMode(v);
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

          <Stack
            spacing={1}
            alignItems="stretch"
            direction="row"
            sx={{ height: 150 }}
          >
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
                onMouseDown={() => startContinuousCmd(10, 10)}
                onMouseUp={stopContinuousCmd}
                onMouseLeave={stopContinuousCmd}
                onTouchStart={() => startContinuousCmd(10, 10)}
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
                onMouseDown={() => startContinuousCmd(-10, -10)}
                onMouseUp={stopContinuousCmd}
                onMouseLeave={stopContinuousCmd}
                onTouchStart={() => startContinuousCmd(-10, -10)}
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
            Current steering angle:{" "}
            {steerMode === "ackermann" ? <b>{steerDeg - 90}°</b> : <b>0°</b>}
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
            value={autoMode}
            disabled={estopActive || mode !== "auto"}
            exclusive
            onChange={(_, v) => {
              if (!v) return;
              setAutoMode(v);
              stopContinuousCmd();
              publishAutoMode(v);
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
            <ToggleButton value="mode1" sx={{ fontSize: 20 }}>
              Mode 1
            </ToggleButton>
            <ToggleButton value="mode2" sx={{ fontSize: 20 }}>
              Mode 2
            </ToggleButton>
            <ToggleButton value="mode3" sx={{ fontSize: 20 }}>
              Mode 3
            </ToggleButton>
            <ToggleButton value="mode4" sx={{ fontSize: 20 }}>
              Mode 4
            </ToggleButton>
            <ToggleButton value="mode5" sx={{ fontSize: 20 }}>
              Mode 5
            </ToggleButton>
          </ToggleButtonGroup>
          <Stack
            direction="row"
            spacing={10}
            justifyContent="center"
            sx={{ height: 70 }}
          >
            <Button
              variant="contained"
              color="success"
              endIcon={<PlayArrowIcon />}
              disabled={estopActive || mode !== "auto"}
              sx={{
                textTransform: "none",
                width: "40%",
                fontSize: 20,
                borderRadius: 25,
              }}
              onClick={() => {
                if (!ensureRosReady()) return;
                stopContinuousCmd();
                publish("autoStart", { data: true });
              }}
            >
              Start
            </Button>
            <Button
              variant="contained"
              color="error"
              endIcon={<StopIcon />}
              disabled={estopActive || mode !== "auto"}
              sx={{
                textTransform: "none",
                width: "40%",
                fontSize: 20,
                borderRadius: 25,
              }}
              onClick={() => {
                if (!ensureRosReady()) return;
                stopContinuousCmd();
                publish("autoStart", { data: false });
              }}
            >
              Stop
            </Button>
          </Stack>
        </Stack>
      </Paper>
    </Stack>
  );
}
