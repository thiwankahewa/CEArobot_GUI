import * as ROSLIB from "roslib";


export function createRosClient(url, { onConnection, onClose, onError } = {}) {
  const ros = new ROSLIB.Ros({ url });

  ros.on("connection", () => onConnection?.());
  ros.on("close", () => onClose?.());
  ros.on("error", (err) => onError?.(err));

  return ros;
}

export function closeRosClient(ros) {
  try {
    ros?.close();
  } catch (e) {
    // ignore
  }
}
