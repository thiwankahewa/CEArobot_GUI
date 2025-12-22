import * as React from "react";
import * as ROSLIB from "roslib";

/**
 * Topic spec:
 * { key: string, name: string, type: string, queue_size?: number }
 */

/**
 * useRosTopics
 * - Creates ROSLIB.Topic objects once per connection
 * - Provides publish() and subscribe() helpers
 * - Cleans up subscriptions on disconnect/unmount
 */
export function useRosTopics(ros, connected, specs) {
  const topicsRef = React.useRef({});
  const subsRef = React.useRef({}); // key -> Map(subscriptionId -> {cb, wrapper})

  const [topicsReady, setTopicsReady] = React.useState(false);

  // ---- internal: clear all subscriptions cleanly ----
  const clearAllSubscriptions = React.useCallback(() => {
    const topics = topicsRef.current;
    const subs = subsRef.current;

    for (const key of Object.keys(subs)) {
      const topic = topics[key];
      if (!topic) continue;

      // unsubscribe all wrappers we attached
      for (const { wrapper } of subs[key].values()) {
        try {
          topic.unsubscribe(wrapper);
        } catch {
          // ignore
        }
      }
    }
    subsRef.current = {};
  }, []);

  // ---- create topics when connected ----
  React.useEffect(() => {
    if (!ros || !connected) {
      // disconnect path
      clearAllSubscriptions();
      topicsRef.current = {};
      setTopicsReady(false);
      return;
    }

    // build topics
    const created = {};
    for (const s of specs) {
      created[s.key] = new ROSLIB.Topic({
        ros,
        name: s.name,
        messageType: s.type,
        queue_size: s.queue_size ?? 10,
      });
    }

    topicsRef.current = created;
    setTopicsReady(true);

    // cleanup when ros/connected/specs change or unmount
    return () => {
      clearAllSubscriptions();
      topicsRef.current = {};
      setTopicsReady(false);
    };
    // IMPORTANT: specs must be stable (useMemo in caller)
  }, [ros, connected, specs, clearAllSubscriptions]);

  const getTopic = React.useCallback((key) => {
    return topicsRef.current[key] ?? null;
  }, []);

  const publish = React.useCallback(
    (key, msg) => {
      if (!ros || !connected) return false;
      const t = topicsRef.current[key];
      if (!t) return false;

      t.publish(msg); // roslib accepts plain object
      return true;
    },
    [ros, connected]
  );

  /**
   * subscribe(key, cb, options)
   *
   * - returns an unsubscribe() function
   * - options.throttleMs: if set, calls cb at most once per throttleMs
   */
  const subscribe = React.useCallback(
    (key, cb, options = {}) => {
      const { throttleMs = 0 } = options;

      if (!ros || !connected) {
        // return a no-op unsubscribe
        return () => {};
      }

      const topic = topicsRef.current[key];
      if (!topic) {
        return () => {};
      }

      // unique id per subscription call
      const subscriptionId = `${Date.now()}_${Math.random()
        .toString(16)
        .slice(2)}`;

      // wrapper to optionally throttle
      let lastTs = 0;
      const wrapper = (msg) => {
        if (throttleMs > 0) {
          const now = performance.now();
          if (now - lastTs < throttleMs) return;
          lastTs = now;
        }
        cb(msg);
      };

      // store subscription so we can clean up globally later
      if (!subsRef.current[key]) subsRef.current[key] = new Map();
      subsRef.current[key].set(subscriptionId, { cb, wrapper });

      // attach to roslib
      topic.subscribe(wrapper);

      // return unsubscribe for this specific subscription
      return () => {
        const map = subsRef.current[key];
        if (!map) return;

        const entry = map.get(subscriptionId);
        if (!entry) return;

        try {
          topic.unsubscribe(entry.wrapper);
        } catch {
          // ignore
        }

        map.delete(subscriptionId);
        if (map.size === 0) delete subsRef.current[key];
      };
    },
    [ros, connected]
  );

  return {
    topics: topicsRef.current,
    topicsReady,
    getTopic,
    publish,
    subscribe,
  };
}
