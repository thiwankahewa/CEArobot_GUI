// src/ros/rosConnection.js

// ROSLIB is loaded globally via index.html from CDN
// so we grab it off window:
const ROSLIB = window.ROSLIB;

if (!ROSLIB) {
  console.error(
    "[ROS] ROSLIB is not available. Make sure the CDN script is loaded in index.html."
  );
}

let ros = null;

export function getRosInstance(url = "ws://localhost:9090") {
  if (!ROSLIB) {
    console.error("[ROS] Cannot create ROS instance: ROSLIB missing.");
    return null;
  }

  if (ros) return ros;

  ros = new ROSLIB.Ros({ url });

  ros.on("connection", () => {
    console.log("[ROS] Connected to", url);
  });

  ros.on("error", (error) => {
    console.error("[ROS] Error connecting:", error);
  });

  ros.on("close", () => {
    console.warn("[ROS] Connection closed");
  });

  return ros;
}

export function getModeCmdTopic() {
  const ros = getRosInstance();
  if (!ros || !ROSLIB) return null;

  return new ROSLIB.Topic({
    ros: ros,
    name: "/mode_cmd",
    messageType: "std_msgs/String",
  });
}
