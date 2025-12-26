export function schemaToDefaultConfig(schema) {
  let cfg = {};
  for (const s of schema) {
    if (!s.paramName) continue;
    cfg = setByPath(cfg, s.paramName, s.default);
  }
  return cfg;
}

export function schemaToMap(schema) {
  const paramNameToType = {};
  const paramNameToDefault = {};
  const paramNameToNode = {};

  for (const s of schema) {
    paramNameToType[s.paramName] = s.type;
    paramNameToDefault[s.paramName] = s.default;
    paramNameToNode[s.paramName] = s.node;
  }

  return { paramNameToType, paramNameToDefault, paramNameToNode };
}

export function deepEqual(a, b) {
  if (a === b) return true;
  if (typeof a !== typeof b) return false;
  if (a == null || b == null) return false;

  if (Array.isArray(a)) {
    if (!Array.isArray(b) || a.length !== b.length) return false;
    return a.every((v, i) => deepEqual(v, b[i]));
  }

  if (typeof a === "object") {
    const ak = Object.keys(a);
    const bk = Object.keys(b);
    if (ak.length !== bk.length) return false;
    return ak.every((k) => deepEqual(a[k], b[k]));
  }

  return false;
}

export function setByPath(obj, path, value) {
  const keys = path.split(".");
  const out = structuredClone(obj);
  let cur = out;
  for (let i = 0; i < keys.length - 1; i++) {
    const k = keys[i];
    cur[k] = cur[k] ?? {};
    cur = cur[k];
  }
  cur[keys.at(-1)] = value;
  return out;
}

export function getByPath(obj, path) {
  const keys = path.split(".");
  let cur = obj;
  for (const k of keys) {
    if (cur == null) return undefined;
    cur = cur[k];
  }
  return cur;
}

export function configDiffToRosUpdates(config, initialConfig, schema) {
  const updates = {};

  for (const s of schema) {
    const cur = getByPath(config, s.paramName);
    const base = getByPath(initialConfig, s.paramName);

    if (cur !== base) {
      updates[s.paramName] = base;
    }
  }

  return updates;
}

export function groupUpdatesByNode(updates, paramNameToNode) {
  const byNode = {};
  for (const [paramName, value] of Object.entries(updates)) {
    const node = paramNameToNode[paramName];
    if (!node) {
      throw new Error(`No node mapping for param '${paramName}'`);
    }
    if (!byNode[node]) byNode[node] = {};
    byNode[node][paramName] = value;
  }
  return byNode;
}

export function buildConfigFromSchema(schema, rosMapByNode) {
  let cfg = {};
  for (const item of schema) {
    const v = rosMapByNode?.[item.node]?.[item.paramName];
    const value = v === null || v === undefined ? item.default : v;
    cfg = setByPath(cfg, item.paramName, value);
  }
  return cfg;
}
