import fs from "fs";
import path from "path";
import os from "os";

export const PHENO_ROOTS = [
  { id: "zed", label: "ZED scans", dir: path.join(os.homedir(), "scan_data_zed") },
  { id: "scan", label: "Scan data", dir: path.join(os.homedir(), "scan_data") },
];

function exists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch {
    return false;
  }
}

function isDirectory(filePath) {
  try {
    return fs.statSync(filePath).isDirectory();
  } catch {
    return false;
  }
}

function fileUrl(rootId, relativePath) {
  return `/pheno-data/${encodeURIComponent(rootId)}/${relativePath.split(path.sep).map(encodeURIComponent).join("/")}`;
}

function getFile(root, runDir, relativePath) {
  const fullPath = path.join(runDir, relativePath);
  if (!exists(fullPath)) return null;
  return fileUrl(root.id, path.relative(root.dir, fullPath));
}

function listDirs(dir) {
  try {
    return fs
      .readdirSync(dir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort();
  } catch {
    return [];
  }
}

function readRun(root, runName, match) {
  const runDir = path.join(root.dir, runName);
  const plantNames = listDirs(runDir).filter((name) => /^plant_\d+$/i.test(name));

  const plants = plantNames.map((plantName) => {
    const plantDir = path.join(runDir, plantName);
    const viewNames = listDirs(plantDir);
    const views = viewNames
      .map((viewName) => {
        const viewRelative = path.join(plantName, viewName);
        return {
          id: viewName,
          label: viewName.replaceAll("_", " "),
          colorUrl: getFile(root, runDir, path.join(viewRelative, "color.png")),
          plyUrl: getFile(root, runDir, path.join(viewRelative, "cloud.ply")),
        };
      })
      .filter((view) => view.colorUrl || view.plyUrl);

    return {
      id: plantName,
      label: plantName.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      mergedPlyUrl: getFile(root, runDir, path.join("reconstruction", `${plantName}_merged.ply`)),
      views,
    };
  });

  return {
    id: `${root.id}:${runName}`,
    source: root.label,
    rootId: root.id,
    name: runName,
    bench: Number(match[1]),
    row: Number(match[2]),
    date: `${match[3].slice(0, 4)}-${match[3].slice(4, 6)}-${match[3].slice(6, 8)}`,
    time: `${match[4].slice(0, 2)}:${match[4].slice(2, 4)}:${match[4].slice(4, 6)}`,
    plantCount: plants.length,
    rowImages: [
      { id: "color", label: "Row color", url: getFile(root, runDir, "color.png") },
      { id: "detection", label: "Detection", url: getFile(root, runDir, "detection.png") },
      { id: "segmented", label: "Segmented", url: getFile(root, runDir, "segmented_result.png") },
    ].filter((image) => image.url),
    rowPlyUrl: getFile(root, runDir, "cloud.ply"),
    plants,
  };
}

export function searchPhenoRuns({ date, bench, row }) {
  const normalizedDate = String(date || "").replaceAll("-", "");
  const normalizedBench = Number(bench);
  const normalizedRow = Number(row);
  const runs = [];

  for (const root of PHENO_ROOTS) {
    if (!isDirectory(root.dir)) continue;

    for (const runName of listDirs(root.dir)) {
      const match = runName.match(/^b(\d+)_r(\d+)_(\d{8})_(\d{6})$/);
      if (!match) continue;
      if (normalizedDate && match[3] !== normalizedDate) continue;
      if (Number.isFinite(normalizedBench) && Number(match[1]) !== normalizedBench) continue;
      if (Number.isFinite(normalizedRow) && Number(match[2]) !== normalizedRow) continue;
      runs.push(readRun(root, runName, match));
    }
  }

  return runs.sort((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`));
}

export function resolvePhenoFile(rootId, relativeParts) {
  const root = PHENO_ROOTS.find((item) => item.id === rootId);
  if (!root) return null;

  const requested = path.resolve(root.dir, ...relativeParts);
  const rootPath = path.resolve(root.dir);
  if (!requested.startsWith(rootPath + path.sep) && requested !== rootPath) return null;
  if (!exists(requested)) return null;
  return requested;
}
