import ROSLIB from "roslib";

export function makeTopic(ros, name, messageType) {
  return new ROSLIB.Topic({
    ros,
    name,
    messageType,
    queue_size: 10,
  });
}

export function publishString(topic, data) {
  topic.publish(new ROSLIB.Message({ data: String(data) }));
}
