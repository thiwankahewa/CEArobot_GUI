// src/components/ModeSwitch.jsx
import React, { useState, useEffect } from "react";
import { getModeCmdTopic } from "../ros/rosConnection";

export default function ModeToggle() {
  const [mode, setMode] = useState("manual");
  const [connected, setConnected] = useState(false);
  const [topic, setTopic] = useState(null);

  useEffect(() => {
    const t = getModeCmdTopic();
    setTopic(t);

    if (!t || !t.ros) {
      console.warn("[GUI] Mode topic or ROS instance not ready");
      return;
    }

    const ros = t.ros;

    const onConnection = () => setConnected(true);
    const onClose = () => setConnected(false);
    const onError = () => setConnected(false);

    ros.on("connection", onConnection);
    ros.on("close", onClose);
    ros.on("error", onError);

    // we can skip cleanup for now
    // return () => {
    //   ros.off("connection", onConnection);
    //   ros.off("close", onClose);
    //   ros.off("error", onError);
    // };
  }, []);

  const publishMode = (newMode) => {
    if (!topic) {
      console.warn("[GUI] Mode topic not ready yet");
      return;
    }

    const msg = new window.ROSLIB.Message({ data: newMode });
    topic.publish(msg);
    setMode(newMode);
    console.log("[GUI] Published mode:", newMode);
  };

  return (
    <div
      style={{
        border: "1px solid #ddd",
        borderRadius: "8px",
        padding: "16px",
        maxWidth: "320px",
        marginTop: "16px",
      }}
    >
      <h2>Mode Switch</h2>
      <p>
        Connection:{" "}
        <span
          style={{
            fontWeight: "bold",
            color: connected ? "green" : "red",
          }}
        >
          {connected ? "Connected" : "Disconnected"}
        </span>
      </p>

      <p>
        Current GUI mode: <strong>{mode.toUpperCase()}</strong>
      </p>

      <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
        <button
          onClick={() => publishMode("manual")}
          style={{
            flex: 1,
            padding: "8px",
            backgroundColor: mode === "manual" ? "#ccc" : "#f5f5f5",
          }}
        >
          Manual
        </button>
        <button
          onClick={() => publishMode("auto")}
          style={{
            flex: 1,
            padding: "8px",
            backgroundColor: mode === "auto" ? "#ccc" : "#f5f5f5",
          }}
        >
          Auto
        </button>
      </div>
    </div>
  );
}
