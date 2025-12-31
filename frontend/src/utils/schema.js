export const SETTINGS_SCHEMA = [
  /*motor_controller*/
  {
    paramName: "drive.mode",
    node: "/motor_controller",
    type: "string",
    default: "manual",
  },
  {
    paramName: "limits.max_rpm",
    node: "/motor_controller",
    type: "int",
    default: 10,
  },
  {
    paramName: "pid.kp",
    node: "/motor_controller",
    type: "double",
    default: 1.5,
  },
  /*bench_tracker*/
  {
    paramName: "Kp_offset",
    node: "/bench_tracker",
    type: "double",
    default: 0.005,
  },
  {
    paramName: "Kp_yaw",
    node: "/bench_tracker",
    type: "double",
    default: 0.005,
  },
  {
    paramName: "base_rpm",
    node: "/bench_tracker",
    type: "int",
    default: 12,
  },
  {
    paramName: "max_rpm",
    node: "/bench_tracker",
    type: "int",
    default: 25,
  },
  {
    paramName: "k_steer",
    node: "/bench_tracker",
    type: "double",
    default: 100.0,
  },
  {
    paramName: "max_steer_deg",
    node: "/bench_tracker",
    type: "double",
    default: 25.0,
  },
];
