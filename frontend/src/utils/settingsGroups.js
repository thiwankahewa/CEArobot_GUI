export const SETTING_GROUPS = [
  {
    key: "basic",
    title: "Basic Settings",
    children: [
      {
        type: "toggle",
        title: "Drive Mode",
        description: "Manual vs Auto mode",
        path: "drive.mode",
        options: [
          { value: "manual", label: "Manual" },
          { value: "auto", label: "Auto" },
        ],
      },
      {
        type: "number",
        title: "Max RPM",
        description: "Speed limit for manual control",
        path: "limits.max_rpm",
        min: 0,
        max: 60,
        step: 1,
        unit: "rpm",
      },
      {
        type: "slider",
        title: "PID Kp",
        description: "Proportional gain",
        path: "pid.kp",
        min: 0,
        max: 10,
        step: 0.1,
        debounceMs: 200,
      },
    ],
  },
];
