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
];
