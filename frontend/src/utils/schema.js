export const SETTINGS_SCHEMA = [
  { paramName: "Kp_offset", node: "/bench_tracker_v3", type: "double", default: 0.2 },
  { paramName: "Kd_offset", node: "/bench_tracker_v3", type: "double", default: 0.02 },
  { paramName: "d_filter_t", node: "/bench_tracker_v3", type: "double", default: 0.2 },
  { paramName: "corr_rpm", node: "/bench_tracker_v3", type: "double", default: 2.0 },
  { paramName: "base_rpm", node: "/bench_tracker_v3", type: "double", default: 12.0 },
  { paramName: "max_rpm", node: "/bench_tracker_v3", type: "double", default: 25.0 },
  { paramName: "offset_enter_m", node: "/bench_tracker_v3", type: "double", default: 0.1 },
  { paramName: "offset_exit_m", node: "/bench_tracker_v3", type: "double", default: 0.01 },
  { paramName: "yaw_enter_m", node: "/bench_tracker_v3", type: "double", default: 0.05 },
  { paramName: "yaw_exit_m", node: "/bench_tracker_v3", type: "double", default: 0.02 },

  { paramName: "manual_rpm", node: "/motor_control_mux", type: "double", default: 10.0 },

  { paramName: "decel_ms", node: "/hub_motor_driver_v2", type: "int", default: 1200 },
  { paramName: "acel_ms", node: "/hub_motor_driver_v2", type: "int", default: 1200 },
  { paramName: "decel_ms_corr", node: "/hub_motor_driver_v2", type: "int", default: 1200 },
  { paramName: "acel_ms_corr", node: "/hub_motor_driver_v2", type: "int", default: 1200 },
];
