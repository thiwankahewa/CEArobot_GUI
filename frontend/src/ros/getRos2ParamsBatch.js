import * as ROSLIB from "roslib";

function decodeParamValue(v) {
  switch (v.type) {
    case 1:
      return v.bool_value;
    case 2:
      return v.integer_value;
    case 3:
      return v.double_value;
    case 4:
      return v.string_value;
    default:
      return null;
  }
}

function callGetParameters({ ros, node, names }) {
  const service = new ROSLIB.Service({
    ros,
    name: `${node}/get_parameters`,
    serviceType: "rcl_interfaces/srv/GetParameters",
  });

  const request = { names };

  return new Promise((resolve, reject) => {
    service.callService(
      request,
      (res) => {
        const values = res?.values;
        if (!values || values.length !== names.length) {
          reject(new Error(`Invalid GetParameters response from ${node}`));
          return;
        }
        const out = {};
        names.forEach((name, i) => (out[name] = decodeParamValue(values[i])));
        resolve(out); // { "limits.max_rpm": 21, ... }
      },
      (err) =>
        reject(new Error(err?.message || `GetParameters failed for ${node}`))
    );
  });
}

export async function getRos2ParamsBatch({ ros, schema }) {
  // group param names by node
  const byNode = new Map();
  for (const s of schema) {
    if (!byNode.has(s.node)) byNode.set(s.node, []);
    byNode.get(s.node).push(s.paramName);
  }

  const result = {}; // { "/motor_controller": {...}, "/steering_controller": {...} }
  await Promise.all(
    [...byNode.entries()].map(async ([node, names]) => {
      result[node] = await callGetParameters({ ros, node, names });
    })
  );

  return result;
}
