import * as React from "react";
import { Box, Paper, Stack, Typography, Button, Divider } from "@mui/material";
import CircularProgress from "@mui/material/CircularProgress";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import SaveIcon from "@mui/icons-material/Save";
import UndoIcon from "@mui/icons-material/Undo";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import SettingToggle from "../ui/SettingToggle";
import SettingNumber from "../ui/SettingNumber";
import SettingSlider from "../ui/SettingSlider";
import SettingButton from "../ui/SettingButton";

import { deepEqual, getByPath, setByPath, schemaToMap, configDiffToRosUpdates, groupUpdatesByNode } from "../utils/configUtils";
import { useAppSnackbar } from "../ui/AppSnackbarProvider";
import { setRos2Param } from "../ros/setRos2Param";
import { setRos2ParamsBatch } from "../ros/setRos2ParamsBatch";
import { callTrigger } from "../ros/callTrigger";
import { SETTINGS_SCHEMA } from "../utils/schema";
import { SETTING_GROUPS } from "../utils/settingsGroups";

const { paramNameToType, paramNameToNodes } = schemaToMap(SETTINGS_SCHEMA);

function roundByStep(value, step) {
  if (!step) return value;

  const stepStr = step.toString();
  const decimals = stepStr.includes(".") ? stepStr.split(".")[1].length : 0;

  return Number(value.toFixed(decimals));
}

function formatSettingValue(value, unit) {
  if (value === undefined) return "Not loaded";
  if (value === null) return "None";
  if (typeof value === "boolean") return value ? "On" : "Off";
  return `${value}${unit ? ` ${unit}` : ""}`;
}

export default function SettingsPage({ ros, connected, config, setConfig, initialConfig, setInitialConfig }) {
  const [saving, setSaving] = React.useState(false);
  const [showChangedSettings, setShowChangedSettings] = React.useState(true);

  const notify = useAppSnackbar();
  const dirty = !deepEqual(config, initialConfig);
  const changedSettings = React.useMemo(
    () =>
      SETTING_GROUPS.flatMap((group) =>
        group.children
          .filter((item) => item.path)
          .map((item) => ({
            ...item,
            groupTitle: group.title,
            currentValue: getByPath(config, item.path),
            initialValue: getByPath(initialConfig, item.path),
          }))
          .filter((item) => !deepEqual(item.currentValue, item.initialValue)),
      ),
    [config, initialConfig],
  );

  async function updateSetting(paramName, value) {
    setConfig((prev) => setByPath(prev, paramName, value));
    try {
      if (!ros || !connected) throw new Error("ROS not connected");
      const nodes = paramNameToNodes[paramName];
      const type = paramNameToType[paramName];
      if (!nodes?.length) {
        throw new Error(`No node mapping for param '${paramName}'`);
      }
      await Promise.all(
        nodes.map((nodeName) =>
          setRos2Param({
            ros,
            nodeName,
            paramName,
            value,
            type,
          }),
        ),
      );
    } catch (e) {
      notify.error(e?.message);
    }
  }

  async function handleSave() {
    if (!ros || !connected) throw new Error("ROS not connected");

    try {
      setSaving(true);
      const res = await callTrigger({ ros, serviceName: "/settings/save_all" });
      if (!res.success) throw new Error(res.message);

      setInitialConfig(config);
      notify.success("Settings sucessfully saved");
    } catch (e) {
      notify.error(e?.message);
      console.log(e);
    } finally {
      setSaving(false);
    }
  }

  async function handleRevert() {
    setConfig(initialConfig);
    try {
      const updates = configDiffToRosUpdates(config, initialConfig, SETTINGS_SCHEMA);

      const updatesByNode = groupUpdatesByNode(updates, paramNameToNodes);
      for (const [nodeName, nodeUpdates] of Object.entries(updatesByNode)) {
        await setRos2ParamsBatch({
          ros,
          nodeName,
          updates: nodeUpdates,
          paramNameToType,
        });
      }
      notify.success("Reset settings on robot");
    } catch (e) {
      console.log(e);
      notify.error(e?.message);
    }
  }

  return (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <Paper
        variant="outlined"
        sx={{
          position: "sticky",
          p: 1.5,
          borderRadius: 2,
          mb: 2,
        }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center" justifyContent="space-between">
          <Stack spacing={0.2}>
            <Typography sx={{ fontWeight: 800, fontSize: 16 }}>Settings</Typography>
            <Typography variant="caption" color="text.secondary">
              {dirty ? "Unsaved changes" : "All changes saved"}
            </Typography>
          </Stack>

          <Stack direction="row" spacing={1}>
            <Button
              startIcon={<UndoIcon />}
              variant="outlined"
              disabled={!dirty || !connected}
              onClick={handleRevert}
              sx={{ textTransform: "none", borderRadius: 10 }}
            >
              Revert
            </Button>

            <Button
              startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}
              variant="contained"
              disabled={saving || !dirty || !connected}
              onClick={handleSave}
              sx={{ textTransform: "none", borderRadius: 10, px: 3 }}
            >
              Save
            </Button>
          </Stack>
        </Stack>

        <Divider sx={{ my: 1.5 }} />

        <Stack spacing={1.25}>
          <Button
            variant="text"
            disabled={!dirty}
            onClick={() => setShowChangedSettings((prev) => !prev)}
            endIcon={
              <KeyboardArrowDownIcon
                sx={{
                  transform: showChangedSettings ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 160ms ease",
                }}
              />
            }
            sx={{
              alignSelf: "flex-start",
              px: 0,
              color: dirty ? "text.primary" : "text.secondary",
              fontWeight: 700,
            }}
          >
            Changed settings · {dirty ? changedSettings.length : 0}
          </Button>

          {dirty && showChangedSettings && (
            <Stack spacing={0.75} sx={{ maxHeight: 180, overflowY: "auto", pr: 0.5 }}>
              {changedSettings.map((item) => (
                <Box
                  key={item.path}
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "minmax(180px, 1fr) auto",
                    gap: 2,
                    alignItems: "center",
                    px: 1,
                    py: 0.75,
                    borderRadius: 1.5,
                    bgcolor: "action.hover",
                  }}
                >
                  <Stack spacing={0.2}>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      {item.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {item.groupTitle}
                    </Typography>
                  </Stack>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="body2" color="text.secondary">
                      {formatSettingValue(item.initialValue, item.unit)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      →
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 800 }}>
                      {formatSettingValue(item.currentValue, item.unit)}
                    </Typography>
                  </Stack>
                </Box>
              ))}
            </Stack>
          )}
        </Stack>
      </Paper>
      <Box
        sx={{
          flex: 1,
          overflowY: "auto",
          WebkitOverflowScrolling: "touch",
          overscrollBehavior: "contain",
          touchAction: "pan-y",
          userSelect: "none",
        }}
      >
        {SETTING_GROUPS.map((group) => (
          <Accordion key={group.key} sx={{ borderRadius: 2, mb: 2 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography sx={{ fontWeight: 600 }}>{group.title}</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Stack spacing={2}>
                {group.children.map((item) => {
                  const value = item.path ? item.path.split(".").reduce((o, k) => o?.[k], config) : undefined;

                  switch (item.type) {
                    case "toggle":
                      return (
                        <SettingToggle
                          key={item.path}
                          title={item.title}
                          description={item.description}
                          value={value}
                          disabled={!connected}
                          options={item.options}
                          onChange={(v) => updateSetting(item.path, v)}
                        />
                      );

                    case "number":
                      return (
                        <SettingNumber
                          key={item.path}
                          title={item.title}
                          description={item.description}
                          value={value}
                          disabled={!connected}
                          min={item.min}
                          max={item.max}
                          step={item.step}
                          unit={item.unit}
                          onChange={(v) => updateSetting(item.path, roundByStep(v, item.step))}
                        />
                      );

                    case "slider":
                      return (
                        <SettingSlider
                          key={item.path}
                          title={item.title}
                          description={item.description}
                          value={value}
                          disabled={!connected}
                          min={item.min}
                          max={item.max}
                          step={item.step}
                          unit={item.unit}
                          debounceMs={item.debounceMs}
                          onChangeCommitted={(v) => updateSetting(item.path, v)}
                        />
                      );

                    case "button":
                      return (
                        <SettingButton
                          key={item.serviceName}
                          title={item.title}
                          description={item.description}
                          buttonText={item.buttonText}
                          loadingText={item.loadingText}
                          disabled={!connected}
                          onClick={async () => {
                            const res = await callTrigger({
                              ros,
                              serviceName: item.serviceName,
                            });

                            if (res.success) {
                              notify.success(res.message);
                            } else {
                              notify.error(res.message);
                            }

                            return res;
                          }}
                        />
                      );

                    default:
                      return null;
                  }
                })}
              </Stack>
            </AccordionDetails>
          </Accordion>
        ))}
      </Box>
    </Box>
  );
}
