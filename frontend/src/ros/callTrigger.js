import * as ROSLIB from "roslib";

export function callTrigger({ ros, serviceName }) {
  const srv = new ROSLIB.Service({
    ros,
    name: serviceName,
    serviceType: "std_srvs/srv/Trigger",
  });

  const req = {};

  return new Promise((resolve, reject) => {
    srv.callService(
      req,
      (res) => resolve(res),
      (err) => reject(new Error(err?.message || "Trigger service failed"))
    );
  });
}
