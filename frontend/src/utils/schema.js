export const SETTINGS_SCHEMA = [
  /*motor_controller*/
  /*{
    paramName: "drive.mode",
    node: "/motor_controller",
    type: "string",
    default: "manual",
  },
  /*bench_tracker*/
  {
    paramName: "Kp_error",
    node: "/bench_tracker",
    type: "double",
    default: 0.01,
  },
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
    paramName: "w_small",
    node: "/bench_tracker",
    type: "double",
    default: 0.01,
  },
  {
    paramName: "max_steer_deg",
    node: "/bench_tracker",
    type: "double",
    default: 25.0,
  },
  /*motor_control_mux*/
  {
    paramName: "manual_rpm",
    node: "/motor_control_mux",
    type: "int",
    default: 12,
  },
  /*hub_motor_driver*/
  {
    paramName: "decel_ms",
    node: "/hub_motor_driver",
    type: "int",
    default: 500,
  },
  {
    paramName: "acel_ms",
    node: "/hub_motor_driver",
    type: "int",
    default: 500,
  },
];
