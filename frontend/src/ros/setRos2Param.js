import * as ROSLIB from "roslib";

//ROS 2 parameter type enum (from rcl_interfaces/msg/ParameterType)
const PARAMETER_TYPE = {
  BOOL: 1,
  INTEGER: 2,
  DOUBLE: 3,
  STRING: 4,
};

//Infer ROS 2 parameter type from JS value
function toTypeEnum(typeStr, value) {
  switch (typeStr) {
    case "bool":
      return PARAMETER_TYPE.BOOL;
    case "int":
      return PARAMETER_TYPE.INTEGER;
    case "double":
      return PARAMETER_TYPE.DOUBLE;
    case "string":
      return PARAMETER_TYPE.STRING;
    default:
      throw new Error(`Unsupported schema type: ${typeStr}`);
  }
}

function buildParamValue(typeEnum, value) {
  return {
    type: typeEnum,
    bool_value: typeEnum === PARAMETER_TYPE.BOOL ? Boolean(value) : false,
    integer_value: typeEnum === PARAMETER_TYPE.INTEGER ? Number(value) : 0,
    double_value: typeEnum === PARAMETER_TYPE.DOUBLE ? Number(value) : 0.0,
    string_value: typeEnum === PARAMETER_TYPE.STRING ? String(value) : "",
  };
}

export function setRos2Param({ ros, nodeName, paramName, value, type }) {
  const service = new ROSLIB.Service({
    ros,
    name: `${nodeName}/set_parameters`,
    serviceType: "rcl_interfaces/srv/SetParameters",
  });

  const typeEnum = toTypeEnum(type, value);

  const request = {
    parameters: [
      {
        name: paramName,
        value: buildParamValue(typeEnum, value),
      },
    ],
  };

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
          reject(new Error(result.reason));
          console.log(result.reason);
        }
      },
      (error) => {
        reject(new Error(error?.message));
      }
    );
  });
}
