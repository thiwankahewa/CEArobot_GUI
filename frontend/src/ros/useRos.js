import { useEffect, useMemo, useRef, useState } from "react";
import { createRosClient, closeRosClient } from "./rosClient";

export function useRos(url) {
  const rosRef = useRef(null); // mutable ref to hold ROS client instance across renders
  const [connected, setConnected] = useState(false);
  const [lastError, setLastError] = useState(null);

  const connect = () => {
    if (rosRef.current && connected) return; // already connected

    // if there's an existing client but not connected, clean it up before creating a new one
    if (rosRef.current && !connected) {
      closeRosClient(rosRef.current);
      rosRef.current = null;
    }

    // create a new ROS client
    const ros = createRosClient(url, {
      onConnection: () => {
        setConnected(true);
        setLastError(null);
      },
      onClose: (err) => {
        setLastError((prev) => prev || "ROS bridge node connection failed");
        setConnected(false);
        rosRef.current = null;
      },
      onError: (err) => {
        setLastError((prev) => prev || "ROS bridge node connection failed");
        setConnected(false);
        rosRef.current = null;
      },
    });
    rosRef.current = ros;
  };

  // disconnect and clean up ROS client
  const disconnect = () => {
    closeRosClient(rosRef.current);
    rosRef.current = null;
    setConnected(false);
  };

  // cleanup on unmount
  useEffect(() => {
    return () => {
      closeRosClient(rosRef.current);
      rosRef.current = null;
    };
  }, []);

  const ros = useMemo(() => rosRef.current, [connected]); // updates when connected toggles

  return { ros, connected, lastError, connect, disconnect };
}
