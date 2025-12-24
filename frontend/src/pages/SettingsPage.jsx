import * as React from "react";
import { Box, Paper, Stack, Typography, Button, Divider } from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import UndoIcon from "@mui/icons-material/Undo";

import SettingToggle from "../ui/SettingToggle";
import SettingNumber from "../ui/SettingNumber";
import SettingSlider from "../ui/SettingSlider";

import { deepEqual, setByPath } from "../utils/configUtils";
import { useAppSnackbar } from "../ui/AppSnackbarProvider";

import { setRos2Param } from "../ros/setRos2Param";
import { callTrigger } from "../ros/callTrigger";

// Minimal config with 1 setting of each type
const DEFAULT_CONFIG = {
  drive: { mode: "manual" }, // Toggle
  limits: { maxRpm: 20 }, // Number stepper
  pid: { kp: 1.2 }, // Slider
};

// ✅ For now send all settings to ONE node (easy backend)
// Later you can route each param to different nodes.
const SETTINGS_NODE = "/settings_server";

// Map UI "rosParamName" -> node (later expand this)
function routeNodeForParam(_rosParamName) {
  return SETTINGS_NODE;
}

export default function SettingsPage({ ros, connected, estopActive }) {
  const notify = useAppSnackbar();
  const disabled = !connected || estopActive;

  const [initialConfig, setInitialConfig] = React.useState(DEFAULT_CONFIG);
  const [config, setConfig] = React.useState(DEFAULT_CONFIG);

  const dirty = !deepEqual(config, initialConfig);

  // ✅ Real setParam using ROS2 parameter service
  async function setParam(rosParamName, value) {
    if (!ros || !connected) throw new Error("ROS not connected");

    const nodeName = routeNodeForParam(rosParamName);

    await setRos2Param({
      ros,
      nodeName,
      paramName: rosParamName,
      value,
    });
  }

  // ✅ Save to YAML using Trigger service (backend saver node)
  async function saveToYaml() {
    if (!ros || !connected) throw new Error("ROS not connected");

    // If you used /settings/save_all in the saver node:
    const res = await callTrigger({ ros, serviceName: "/settings/save_all" });
    return res;
  }

  // ---- Load initial settings from robot (placeholder) ----
  React.useEffect(() => {
    // Later: read parameters from robot and fill initialConfig + config
    setInitialConfig(DEFAULT_CONFIG);
    setConfig(DEFAULT_CONFIG);
  }, []);

  // ---- Update UI + send realtime param update ----
  async function updateSetting(path, value, rosParamName) {
    setConfig((prev) => setByPath(prev, path, value));

    try {
      await setParam(rosParamName, value);
      // optional small toast:
      // notify.success(`${rosParamName} updated`, { duration: 600 });
    } catch (e) {
      notify.error(e?.message || `Failed to set ${rosParamName}`);
    }
  }

  async function handleSave() {
    try {
      const res = await saveToYaml();
      if (!res.success) throw new Error(res.message);

      setInitialConfig(config); // mark as saved baseline
      notify.success(res.message || "Settings saved");
    } catch (e) {
      notify.error(e?.message || "Save failed");
    }
  }

  async function handleRevert() {
    setConfig(initialConfig);
    notify.info("Reverted changes");

    // Optional: push reverted values back to robot (simple version)
    try {
      await setParam("drive.mode", initialConfig.drive.mode);
      await setParam("limits.max_rpm", initialConfig.limits.maxRpm);
      await setParam("pid.kp", initialConfig.pid.kp);
    } catch (e) {
      notify.error(e?.message || "Failed to revert on robot");
    }
  }

  return (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Sticky Save Row */}
      <Paper
        variant="outlined"
        sx={{
          position: "sticky",
          top: 0,
          zIndex: 2,
          p: 1.5,
          borderRadius: 2,
          mb: 2,
          backdropFilter: "blur(6px)",
        }}
      >
        <Stack
          direction="row"
          spacing={1.5}
          alignItems="center"
          justifyContent="space-between"
        >
          <Stack spacing={0.2}>
            <Typography sx={{ fontWeight: 900, fontSize: 16 }}>
              Settings
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {dirty ? "Unsaved changes" : "All changes saved"}
              {estopActive ? " • E-STOP active" : ""}
              {!connected ? " • Not connected" : ""}
            </Typography>
          </Stack>

          <Stack direction="row" spacing={1}>
            <Button
              startIcon={<UndoIcon />}
              variant="outlined"
              disabled={!dirty || disabled}
              onClick={handleRevert}
              sx={{ textTransform: "none", borderRadius: 2 }}
            >
              Revert
            </Button>

            <Button
              startIcon={<SaveIcon />}
              variant="contained"
              disabled={!dirty || disabled}
              onClick={handleSave}
              sx={{ textTransform: "none", borderRadius: 2, fontWeight: 900 }}
            >
              Save
            </Button>
          </Stack>
        </Stack>
      </Paper>

      {/* Scroll area for settings */}
      <Paper
        variant="outlined"
        sx={{ p: 2, borderRadius: 2, flex: 1, overflow: "auto" }}
      >
        <Typography sx={{ fontWeight: 900, mb: 1 }}>Basic</Typography>
        <Divider sx={{ mb: 2 }} />

        <Stack spacing={2}>
          {/* Toggle */}
          <SettingToggle
            title="Drive Mode"
            description="Manual vs Auto mode"
            value={config.drive.mode}
            disabled={disabled}
            options={[
              { value: "manual", label: "Manual" },
              { value: "auto", label: "Auto" },
            ]}
            onChange={(v) => updateSetting("drive.mode", v, "drive.mode")}
          />

          {/* Number */}
          <SettingNumber
            title="Max RPM"
            description="Speed limit for manual control"
            value={config.limits.maxRpm}
            disabled={disabled}
            min={0}
            max={60}
            step={1}
            unit="rpm"
            onChange={(v) =>
              updateSetting("limits.maxRpm", v, "limits.max_rpm")
            }
          />

          {/* Slider */}
          <SettingSlider
            title="PID Kp"
            description="Proportional gain"
            value={config.pid.kp}
            disabled={disabled}
            min={0}
            max={10}
            step={0.1}
            debounceMs={1000}
            onChangeCommitted={(v) => updateSetting("pid.kp", v, "pid.kp")}
          />
        </Stack>
      </Paper>
    </Box>
  );
}
