import * as React from "react";
import {
  Grid,
  Paper,
  Stack,
  Button,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  Divider,
} from "@mui/material";

import StopIcon from "@mui/icons-material/Stop";
import DirectionsIcon from "@mui/icons-material/Directions";
import * as ROSLIB from "roslib";

const MODE_TOPIC = "/mode";
const MODE_TYPE = "std_msgs/msg/String";

const CMD_VEL_TOPIC = "/wheel_rpm_manual";
const CMD_VEL_TYPE = "std_msgs/msg/Int16MultiArray";

const STEER_TOPIC = "/steer_manual";
const STEER_TYPE = "std_msgs/msg/Float32";

const STEER_WAIT_MS = 700;     // wait time after steering change
const STEER_STEP_DEG = 5;     // left/right step in steering mode
const STEER_MIN = -45;
const STEER_MAX = 45;

export default function RunPage({ ros, connected }) {
  const [isIdle, setIsIdle] = React.useState(true);
  const [mode, setMode] = React.useState("manual"); // "manual" | "auto"
  const [steerDeg, setSteerDeg] = React.useState(0);
  const [steerBusy, setSteerBusy] = React.useState(false);
  const steerTimerRef = React.useRef(null);

  const steerMode = steerDeg === 0 ? "Diff drive" : "Ackermann";

  // Continuous publish interval ref
  const publishTimerRef = React.useRef(null);

  // Topics (create once when ros exists/changes)
  const cmdVelTopicRef = React.useRef(null);
  const steerTopicRef = React.useRef(null);
  const modeTopicRef = React.useRef(null);

  React.useEffect(() => {
    if (!ros || !connected) {
      cmdVelTopicRef.current = null;
      steerTopicRef.current = null;
      modeTopicRef.current = null;
      return;
    }

    cmdVelTopicRef.current = new ROSLIB.Topic({
      ros,
      name: CMD_VEL_TOPIC,
      messageType: CMD_VEL_TYPE,
      queue_size: 10,
    });

    steerTopicRef.current = new ROSLIB.Topic({
      ros,
      name: STEER_TOPIC,
      messageType: STEER_TYPE,
      queue_size: 10,
    });

    modeTopicRef.current = new ROSLIB.Topic({
    ros,
    name: MODE_TOPIC,
    messageType: MODE_TYPE,
    queue_size: 1, // mode is low-rate
  });

    return () => {
      // stop publishing when leaving page or disconnecting
      stopContinuousCmd();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ros, connected]);

  const canOperate = connected && !isIdle;
  const isManual = canOperate && mode === "manual";
  const joystickEnabled = isManual && !steerBusy;

  function alertIfNoRos() {
    if (!connected || !ros) {
      alert("ROS not connected. Please connect from the top bar.");
      return true;
    }
    return false;
  }

  function publishRPM(LRPM, RRPM) {
    if (alertIfNoRos()) return;
    const topic = cmdVelTopicRef.current;
    if (!topic) return;

    topic.publish({
        data: [LRPM, RRPM],
      });
  }

  function publishSteer(deg) {
    if (alertIfNoRos()) return;
    const topic = steerTopicRef.current;
    if (!topic) return;

    topic.publish({ data: deg });
  }

  function publishMode(nextMode) {
  if (!connected || !ros) return;
  if (!modeTopicRef.current) return;

  // roslib accepts plain JS object
  modeTopicRef.current.publish({
    data: nextMode,
  });
}

  function stopContinuousCmd() {
    if (publishTimerRef.current) {
      clearInterval(publishTimerRef.current);
      publishTimerRef.current = null;
    }
    publishRPM(0, 0);
  }

  // Start continuous publish (10 Hz) while button is held
  function startContinuousCmd(LRPM, RRPM) {
    if (!isManual) return;
    if (alertIfNoRos()) return;

    // clear any previous loop first
    stopContinuousCmd();

    // publish immediately + then keep publishing
    publishRPM(LRPM, RRPM);
    publishTimerRef.current = setInterval(() => {
      publishRPM(LRPM, RRPM);
    }, 100); // 10 Hz
  }

  function handleLeftPress() {
  if (!joystickEnabled) return;

  if (steerDeg === 0) {
    // Diff turn mode: publish cmd_vel angular
    startContinuousCmd(-10, 10);
  } else {
    // Steering mode: adjust steering angle (no cmd_vel)
    const next = Math.min(STEER_MIN, steerDeg - STEER_STEP_DEG);
    beginSteerTransition(next);
  }
}

function handleRightPress() {
  if (!joystickEnabled) return;

  if (steerDeg === 0) {
    startContinuousCmd(10, -10);
  } else {
    const next = Math.max(STEER_MAX, steerDeg + STEER_STEP_DEG);
    beginSteerTransition(next);
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

  // When IDLE turns ON, force stop + lock everything
  React.useEffect(() => {
    if (isIdle) {
      stopContinuousCmd();
      setSteerDeg(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isIdle]);

  React.useEffect(() => {
  return () => {
    if (steerTimerRef.current) clearTimeout(steerTimerRef.current);
  };
}, []);

  return (
    <Grid container spacing={2} direction="row" >
      {/* LEFT COLUMN (50%) */}
      <Grid item xs={12} sm={6}>
        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
          <Stack spacing={2}>
            {/* 1) IDLE toggle button */}
            <Button
              variant={isIdle ? "contained" : "outlined"}
              color={isIdle ? "secondary" : "primary"}
              onClick={() => setIsIdle((v) => !v)}
              sx={{ textTransform: "none" }}
              startIcon={<DirectionsIcon />}
            >
              {isIdle ? "IDLE" : "Active"}
            </Button>

            <Divider />
            <Typography variant="h6" sx={{ fontWeight: 800, textAlign: "center" }}>
              Mode
            </Typography>

            {/* 2) Manual / Auto toggle (only when not IDLE) */}
            <ToggleButtonGroup
              value={mode}
              exclusive
              onChange={(_, v) => {
                if (!v) return;
                setMode(v);
                stopContinuousCmd();     
                publishMode(v);
              }}
              disabled={!canOperate}
              fullWidth
              sx={{ "& .MuiToggleButton-root": { textTransform: "none" } }}
            >
              <ToggleButton value="manual">Manual</ToggleButton>
              <ToggleButton value="auto">Auto</ToggleButton>
            </ToggleButtonGroup>

            {/* 3) Joystick buttons (only when not IDLE and Manual) */}
            <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
              <Typography variant="body2" color="text.secondary" paddingBottom={1}>
                Drive mode: <b>{steerMode}</b> {steerBusy ? "(changing...)" : ""}
              </Typography>
              <Stack spacing={1} alignItems="center">
                {/* Forward */}
                <Button
                  variant="contained"
                  fullWidth
                  disabled={!joystickEnabled}
                  onMouseDown={() => startContinuousCmd(10, 10)}
                  onMouseUp={stopContinuousCmd}
                  onMouseLeave={stopContinuousCmd}
                  onTouchStart={() => startContinuousCmd(10, 10)}
                  onTouchEnd={stopContinuousCmd}
                >
                  Forward
                </Button>

                <Stack direction="row" spacing={1} width="100%">
                  {/* Left */}
                  <Button
                    variant="outlined"
                    fullWidth
                    disabled={!joystickEnabled}
                    sx={{ textTransform: "none" }}
                    onMouseDown={handleLeftPress}
                    onMouseUp={stopContinuousCmd}
                    onMouseLeave={stopContinuousCmd}
                    onTouchStart={handleLeftPress}
                    onTouchEnd={stopContinuousCmd}
                  >
                    Left
                  </Button>

                  {/* Right */}
                  <Button
                    variant="outlined"
                    fullWidth
                    disabled={!joystickEnabled}
                    sx={{ textTransform: "none" }}
                    onMouseDown={handleRightPress}
                    onMouseUp={stopContinuousCmd}
                    onMouseLeave={stopContinuousCmd}
                    onTouchStart={handleRightPress}
                    onTouchEnd={stopContinuousCmd}
                  >
                    Right
                  </Button>
                </Stack>

                {/* Backward */}
                <Button
                  variant="contained"
                  fullWidth
                  disabled={!joystickEnabled}
                  sx={{ textTransform: "none" }}
                  onMouseDown={() => startContinuousCmd(-10, -10)}
                  onMouseUp={stopContinuousCmd}
                  onMouseLeave={stopContinuousCmd}
                  onTouchStart={() => startContinuousCmd(-10, -10)}
                  onTouchEnd={stopContinuousCmd}
                >
                  Backward
                </Button>
              </Stack>
            </Paper>

            {/* 4) Steering buttons row (-90, 0, 90) with your enable rule */}
            <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
              <Typography sx={{ fontWeight: 700, mb: 1 }}>Steering</Typography>

              <Stack direction="row" spacing={1}>
                <Button
                  variant={steerDeg === -90 ? "contained" : "outlined"}
                  fullWidth
                  disabled={!isManual || steerDeg !== 0 || steerBusy}
                  sx={{ textTransform: "none" }}
                  onClick={() => beginSteerTransition(-90)}
                >
                  -90
                </Button>

                <Button
                  variant={steerDeg === 0 ? "contained" : "outlined"}
                  fullWidth
                  disabled={!isManual}
                  sx={{ textTransform: "none" }}
                  onClick={() => beginSteerTransition(0)}
                >
                  0
                </Button>

                <Button
                  variant={steerDeg === 90 ? "contained" : "outlined"}
                  fullWidth
                  disabled={!isManual || steerDeg !== 0 || steerBusy}
                  sx={{ textTransform: "none" }}
                  onClick={() => beginSteerTransition(90)}
                >
                  90
                </Button>
              </Stack>
            </Paper>

            {/* 5) STOP button (manual mode only) */}
            <Button
              variant="contained"
              color="error"
              startIcon={<StopIcon />}
              disabled={!isManual}
              onClick={stopContinuousCmd}
              sx={{ textTransform: "none" }}
            >
              Stop
            </Button>

            <Typography variant="caption" color="text.secondary">
              Tip: hold teleop buttons to keep moving CEAbot.
            </Typography>
          </Stack>
        </Paper>
      </Grid>

      {/* RIGHT COLUMN (50%) */}
      <Grid item xs={12} sm={6}>
        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, minHeight: 300 }}>
          <Typography sx={{ fontWeight: 800 }}>Feedback / Auto Controls</Typography>
          <Typography variant="body2" color="text.secondary">
           
          </Typography>
        </Paper>
      </Grid>
    </Grid>
  );
}
