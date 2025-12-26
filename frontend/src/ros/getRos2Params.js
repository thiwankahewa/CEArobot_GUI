import * as ROSLIB from "roslib";

export function getRos2Params({ ros, nodeName, names }) {
  if (!ros) return Promise.reject(new Error("ROS not connected"));

  const service = new ROSLIB.Service({
    ros,
    name: `${nodeName}/get_parameters`,
    serviceType: "rcl_interfaces/srv/GetParameters",
  });

  const request = new ROSLIB.ServiceRequest({ names });

  return new Promise((resolve, reject) => {
    service.callService(
      request,
      (res) => {
        const values = res?.values;
        if (!values || values.length !== names.length) {
          reject(new Error("Invalid GetParameters response"));
          return;
        }

        // Convert ParameterValue -> JS primitives
        const out = {};
        names.forEach((n, i) => {
          const v = values[i];
          switch (v.type) {
            case 1:
              out[n] = v.bool_value;
              break;
            case 2:
              out[n] = v.integer_value;
              break;
            case 3:
              out[n] = v.double_value;
              break;
            case 4:
              out[n] = v.string_value;
              break;
            default:
              out[n] = null;
          }
        });

        resolve(out);
      },
      (err) => reject(new Error(err?.message || "GetParameters failed"))
    );
  });
}
