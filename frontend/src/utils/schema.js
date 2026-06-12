export const SETTINGS_SCHEMA = [
  { paramName: "bench_height", nodes: ["/plant_view_scanner", "/zed_test_scan"], type: "double", default: 0.75 },
  { paramName: "pot_height", nodes: ["/plant_view_scanner", "/zed_test_scan"], type: "double", default: 0.15 },

  { paramName: "min_tof", nodes: ["/bench_tracker_v3"], type: "int", default: 25 },
  { paramName: "max_tof", nodes: ["/bench_tracker_v3"], type: "int", default: 500 },
  { paramName: "aruco_center_stable_cycles", nodes: ["/bench_tracker_v3"], type: "int", default: 3 },
  { paramName: "Kp_offset", nodes: ["/bench_tracker_v3"], type: "double", default: 0.2 },
  { paramName: "Kp_offset_b", nodes: ["/bench_tracker_v3"], type: "double", default: 0.2 },
  { paramName: "Kd_offset", nodes: ["/bench_tracker_v3"], type: "double", default: 0.02 },
  { paramName: "d_filter_t", nodes: ["/bench_tracker_v3"], type: "double", default: 0.2 },
  { paramName: "corr_rpm", nodes: ["/bench_tracker_v3"], type: "double", default: 2.0 },
  { paramName: "base_rpm", nodes: ["/bench_tracker_v3"], type: "double", default: 12.0 },
  { paramName: "max_rpm", nodes: ["/bench_tracker_v3"], type: "double", default: 25.0 },
  { paramName: "offset_enter_m", nodes: ["/bench_tracker_v3"], type: "double", default: 0.1 },
  { paramName: "offset_exit_m", nodes: ["/bench_tracker_v3"], type: "double", default: 0.01 },
  { paramName: "yaw_enter_m", nodes: ["/bench_tracker_v3"], type: "double", default: 0.05 },
  { paramName: "yaw_exit_m", nodes: ["/bench_tracker_v3"], type: "double", default: 0.02 },
  { paramName: "aruco_center_done_norm", nodes: ["/bench_tracker_v3"], type: "int", default: 5 },
  { paramName: "aruco_center_stable_cycles", nodes: ["/bench_tracker_v3"], type: "int", default: 3 },

  { paramName: "manual_rpm", nodes: ["/motor_control_mux"], type: "double", default: 10.0 },

  { paramName: "decel_ms", nodes: ["/hub_motor_driver_v2"], type: "int", default: 1200 },
  { paramName: "acel_ms", nodes: ["/hub_motor_driver_v2"], type: "int", default: 1200 },
  { paramName: "decel_ms_corr", nodes: ["/hub_motor_driver_v2"], type: "int", default: 1200 },
  { paramName: "acel_ms_corr", nodes: ["/hub_motor_driver_v2"], type: "int", default: 1200 },

  { paramName: "z_offset", nodes: ["/plant_view_scanner"], type: "double", default: 0.2 },
  { paramName: "view_count", nodes: ["/plant_view_scanner"], type: "int", default: 3 },
];
