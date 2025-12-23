import * as ROSLIB from "roslib";

/*
ROS 2 parameter type enum (from rcl_interfaces/msg/ParameterType)
*/
const PARAMETER_TYPE = {
  BOOL: 1,
  INTEGER: 2,
  DOUBLE: 3,
  STRING: 4,
};

/*
Infer ROS 2 parameter type from JS value
*/
function inferType(value) {
  if (typeof value === "boolean") return PARAMETER_TYPE.BOOL;
  if (typeof value === "number") {
    return Number.isInteger(value)
      ? PARAMETER_TYPE.INTEGER
      : PARAMETER_TYPE.DOUBLE;
  }
  if (typeof value === "string") return PARAMETER_TYPE.STRING;

  throw new Error(`Unsupported parameter type: ${typeof value}`);
}

/*
Set ONE ROS 2 parameter
*/
export function setRos2Param({
  ros,
  nodeName, // e.g. "/settings_server"
  paramName, // e.g. "pid.kp"
  value,
}) {
  if (!ros) {
    return Promise.reject(new Error("ROS not connected"));
  }

  const service = new ROSLIB.Service({
    ros,
    name: `${nodeName}/set_parameters`,
    serviceType: "rcl_interfaces/srv/SetParameters",
  });

  const type = inferType(value);

  const parameterValue = {
    type,
    bool_value: type === PARAMETER_TYPE.BOOL ? value : false,
    integer_value: type === PARAMETER_TYPE.INTEGER ? value : 0,
    double_value: type === PARAMETER_TYPE.DOUBLE ? value : 0.0,
    string_value: type === PARAMETER_TYPE.STRING ? value : "",
  };

  const request = new ROSLIB.ServiceRequest({
    parameters: [
      {
        name: paramName,
        value: parameterValue,
      },
    ],
  });

  return new Promise((resolve, reject) => {
    service.callService(
      request,
      (response) => {
        const result = response?.results?.[0];
        if (!result) {
          reject(new Error("Invalid parameter service response"));
          return;
        }

        if (result.successful) {
          resolve(true);
        } else {
          reject(new Error(result.reason || "Parameter rejected"));
        }
      },
      (error) => {
        reject(new Error(error?.message || "Service call failed"));
      }
    );
  });
}
