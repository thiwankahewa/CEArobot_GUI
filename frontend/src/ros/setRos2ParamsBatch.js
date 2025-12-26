import * as ROSLIB from "roslib";

// ROS 2 parameter type enum (rcl_interfaces/msg/ParameterType)
const PARAMETER_TYPE = {
  BOOL: 1,
  INTEGER: 2,
  DOUBLE: 3,
  STRING: 4,
};

function buildParamValue(type, value) {
  const v = {
    type,
    bool_value: false,
    integer_value: 0,
    double_value: 0.0,
    string_value: "",
  };

  if (type === PARAMETER_TYPE.BOOL) v.bool_value = Boolean(value);
  else if (type === PARAMETER_TYPE.INTEGER) v.integer_value = Number(value);
  else if (type === PARAMETER_TYPE.DOUBLE) v.double_value = Number(value);
  else if (type === PARAMETER_TYPE.STRING) v.string_value = String(value);
  else throw new Error(`Unsupported param type enum: ${type}`);

  return v;
}

function toTypeEnum(typeStr) {
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

export function setRos2ParamsBatch({
  ros,
  nodeName,
  updates,
  paramNameToType,
  strict = true,
}) {
  const service = new ROSLIB.Service({
    ros,
    name: `${nodeName}/set_parameters`,
    serviceType: "rcl_interfaces/srv/SetParameters",
  });

  const arr = Object.entries(updates).map(([name, value]) => ({ name, value }));

  const parameters = arr.map(({ name, value }) => {
    const typeStr = paramNameToType?.[name];
    if (!typeStr) throw new Error(`Missing type in schema for '${name}'`);

    const typeEnum = toTypeEnum(typeStr);

    return {
      name,
      value: buildParamValue(typeEnum, value),
    };
  });

  const request = { parameters };

  return new Promise((resolve, reject) => {
    service.callService(
      request,
      (res) => {
        const results = res?.results || [];
        if (results.length !== parameters.length) {
          reject(new Error("Invalid SetParameters response"));
          return;
        }

        const report = parameters.map((p, i) => ({
          name: p.name,
          ok: Boolean(results[i]?.successful),
          reason: results[i]?.reason || "",
        }));

        const failed = report.filter((r) => !r.ok);

        if (strict && failed.length > 0) {
          reject(
            new Error(
              "Some parameters rejected: " +
                failed.map((f) => `${f.name}: ${f.reason}`).join("; ")
            )
          );
          return;
        }

        resolve(report);
      },
      (err) => reject(new Error(err?.message))
    );
  });
}
