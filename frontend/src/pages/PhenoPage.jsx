import * as React from "react";
import * as ROSLIB from "roslib";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import FitScreenIcon from "@mui/icons-material/FitScreen";
import ViewInArIcon from "@mui/icons-material/ViewInAr";
import { useAppSnackbar } from "../ui/AppSnackbarProvider";

const MAX_PLY_POINTS = 60000;
const DEFAULT_PLY_VIEW = { rotX: -0.45, rotY: 0.75, zoom: 1.4 };

const PLY_TYPE_SIZE = {
  char: 1,
  uchar: 1,
  int8: 1,
  uint8: 1,
  short: 2,
  ushort: 2,
  int16: 2,
  uint16: 2,
  int: 4,
  uint: 4,
  int32: 4,
  uint32: 4,
  float: 4,
  float32: 4,
  double: 8,
  float64: 8,
};

function findHeaderEnd(bytes) {
  const marker = "end_header\n";
  const text = new TextDecoder().decode(bytes.slice(0, Math.min(bytes.byteLength, 4096)));
  const index = text.indexOf(marker);
  if (index < 0) return -1;
  return index + marker.length;
}

function readBinaryValue(view, offset, type) {
  switch (type) {
    case "char":
    case "int8":
      return view.getInt8(offset);
    case "uchar":
    case "uint8":
      return view.getUint8(offset);
    case "short":
    case "int16":
      return view.getInt16(offset, true);
    case "ushort":
    case "uint16":
      return view.getUint16(offset, true);
    case "int":
    case "int32":
      return view.getInt32(offset, true);
    case "uint":
    case "uint32":
      return view.getUint32(offset, true);
    case "double":
    case "float64":
      return view.getFloat64(offset, true);
    case "float":
    case "float32":
    default:
      return view.getFloat32(offset, true);
  }
}

function normalizeCloud(points, colors, count) {
  let minX = Infinity;
  let minY = Infinity;
  let minZ = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  let maxZ = -Infinity;

  for (let i = 0; i < count; i += 1) {
    const x = points[i * 3];
    const y = points[i * 3 + 1];
    const z = points[i * 3 + 2];
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    minZ = Math.min(minZ, z);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
    maxZ = Math.max(maxZ, z);
  }

  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const cz = (minZ + maxZ) / 2;
  const scale = Math.max(maxX - minX, maxY - minY, maxZ - minZ) || 1;

  for (let i = 0; i < count; i += 1) {
    points[i * 3] = (points[i * 3] - cx) / scale;
    points[i * 3 + 1] = (points[i * 3 + 1] - cy) / scale;
    points[i * 3 + 2] = (points[i * 3 + 2] - cz) / scale;
  }

  return { points, colors, count };
}

function parsePly(buffer) {
  const bytes = new Uint8Array(buffer);
  const headerEnd = findHeaderEnd(bytes);
  if (headerEnd < 0) throw new Error("Invalid PLY file: missing header");

  const header = new TextDecoder().decode(bytes.slice(0, headerEnd));
  const lines = header.split(/\r?\n/);
  const format = lines.find((line) => line.startsWith("format "))?.split(/\s+/)[1];
  const vertexCount = Number(lines.find((line) => line.startsWith("element vertex "))?.split(/\s+/)[2] ?? 0);
  if (!vertexCount) throw new Error("PLY file has no vertices");

  const vertexProperties = [];
  let inVertex = false;
  for (const line of lines) {
    if (line.startsWith("element vertex ")) {
      inVertex = true;
      continue;
    }
    if (line.startsWith("element ") && !line.startsWith("element vertex ")) {
      inVertex = false;
    }
    if (inVertex && line.startsWith("property ")) {
      const [, type, name] = line.split(/\s+/);
      vertexProperties.push({ type, name, size: PLY_TYPE_SIZE[type] ?? 4 });
    }
  }

  const stride = vertexProperties.reduce((sum, prop) => sum + prop.size, 0);
  const step = Math.max(1, Math.ceil(vertexCount / MAX_PLY_POINTS));
  const count = Math.ceil(vertexCount / step);
  const points = new Float32Array(count * 3);
  const colors = new Uint8ClampedArray(count * 3);

  const propOffset = {};
  let offset = 0;
  for (const prop of vertexProperties) {
    propOffset[prop.name] = { offset, type: prop.type };
    offset += prop.size;
  }

  if (format === "binary_little_endian") {
    const view = new DataView(buffer, headerEnd);
    let outIndex = 0;
    for (let i = 0; i < vertexCount; i += step) {
      const base = i * stride;
      points[outIndex * 3] = readBinaryValue(view, base + propOffset.x.offset, propOffset.x.type);
      points[outIndex * 3 + 1] = readBinaryValue(view, base + propOffset.y.offset, propOffset.y.type);
      points[outIndex * 3 + 2] = readBinaryValue(view, base + propOffset.z.offset, propOffset.z.type);
      colors[outIndex * 3] = propOffset.red ? readBinaryValue(view, base + propOffset.red.offset, propOffset.red.type) : 220;
      colors[outIndex * 3 + 1] = propOffset.green ? readBinaryValue(view, base + propOffset.green.offset, propOffset.green.type) : 220;
      colors[outIndex * 3 + 2] = propOffset.blue ? readBinaryValue(view, base + propOffset.blue.offset, propOffset.blue.type) : 220;
      outIndex += 1;
    }
    return normalizeCloud(points, colors, count);
  }

  if (format === "ascii") {
    const body = new TextDecoder().decode(bytes.slice(headerEnd));
    const rows = body.trim().split(/\r?\n/);
    const nameToIndex = Object.fromEntries(vertexProperties.map((prop, index) => [prop.name, index]));
    let outIndex = 0;
    for (let i = 0; i < rows.length && outIndex < count; i += step) {
      const values = rows[i].trim().split(/\s+/);
      points[outIndex * 3] = Number(values[nameToIndex.x]);
      points[outIndex * 3 + 1] = Number(values[nameToIndex.y]);
      points[outIndex * 3 + 2] = Number(values[nameToIndex.z]);
      colors[outIndex * 3] = Number(values[nameToIndex.red] ?? 220);
      colors[outIndex * 3 + 1] = Number(values[nameToIndex.green] ?? 220);
      colors[outIndex * 3 + 2] = Number(values[nameToIndex.blue] ?? 220);
      outIndex += 1;
    }
    return normalizeCloud(points, colors, outIndex);
  }

  throw new Error(`Unsupported PLY format: ${format}`);
}

function PointCloudViewer({ plyUrl }) {
  const canvasRef = React.useRef(null);
  const pointersRef = React.useRef(new Map());
  const lastPinchRef = React.useRef(null);
  const [cloud, setCloud] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [view, setView] = React.useState(DEFAULT_PLY_VIEW);

  React.useEffect(() => {
    if (!plyUrl) {
      setCloud(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError("");
    fetch(plyUrl)
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load PLY (${res.status})`);
        return res.arrayBuffer();
      })
      .then((buffer) => {
        if (!cancelled) setCloud(parsePly(buffer));
      })
      .catch((e) => {
        if (!cancelled) setError(e?.message || "Failed to load PLY");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [plyUrl]);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !cloud) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.max(1, Math.floor(rect.width * dpr));
    canvas.height = Math.max(1, Math.floor(rect.height * dpr));

    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, rect.width, rect.height);
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 0, rect.width, rect.height);

    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const scale = Math.min(rect.width, rect.height) * 0.9 * view.zoom;
    const cosX = Math.cos(view.rotX);
    const sinX = Math.sin(view.rotX);
    const cosY = Math.cos(view.rotY);
    const sinY = Math.sin(view.rotY);

    for (let i = 0; i < cloud.count; i += 1) {
      const x = cloud.points[i * 3];
      const y = cloud.points[i * 3 + 1];
      const z = cloud.points[i * 3 + 2];

      const x1 = x * cosY + z * sinY;
      const z1 = -x * sinY + z * cosY;
      const y1 = y * cosX - z1 * sinX;
      const z2 = y * sinX + z1 * cosX;
      const perspective = 1 / (1.8 - z2);
      const sx = cx + x1 * scale * perspective;
      const sy = cy - y1 * scale * perspective;
      if (sx < -4 || sy < -4 || sx > rect.width + 4 || sy > rect.height + 4) continue;

      ctx.fillStyle = `rgb(${cloud.colors[i * 3]}, ${cloud.colors[i * 3 + 1]}, ${cloud.colors[i * 3 + 2]})`;
      ctx.fillRect(sx, sy, 1.6, 1.6);
    }
  }, [cloud, view]);

  const updatePointer = (event) => {
    pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
  };

  const handlePointerDown = (event) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    updatePointer(event);
  };

  const handlePointerMove = (event) => {
    const previous = pointersRef.current.get(event.pointerId);
    if (!previous) return;
    updatePointer(event);
    const pointers = Array.from(pointersRef.current.values());

    if (pointers.length >= 2) {
      const [a, b] = pointers;
      const distance = Math.hypot(a.x - b.x, a.y - b.y);
      if (lastPinchRef.current) {
        const ratio = distance / lastPinchRef.current;
        setView((prev) => ({ ...prev, zoom: Math.min(5, Math.max(0.35, prev.zoom * ratio)) }));
      }
      lastPinchRef.current = distance;
      return;
    }

    lastPinchRef.current = null;
    setView((prev) => ({
      ...prev,
      rotY: prev.rotY + (event.clientX - previous.x) * 0.01,
      rotX: Math.max(-1.5, Math.min(1.5, prev.rotX + (event.clientY - previous.y) * 0.01)),
    }));
  };

  const handlePointerUp = (event) => {
    pointersRef.current.delete(event.pointerId);
    if (pointersRef.current.size < 2) lastPinchRef.current = null;
  };

  const handleWheel = (event) => {
    event.preventDefault();
    setView((prev) => ({
      ...prev,
      zoom: Math.min(5, Math.max(0.35, prev.zoom * (event.deltaY > 0 ? 0.9 : 1.1))),
    }));
  };

  const handleFitView = () => {
    pointersRef.current.clear();
    lastPinchRef.current = null;
    setView(DEFAULT_PLY_VIEW);
  };

  return (
    <Box sx={{ position: "relative", height: 360, borderRadius: 2, overflow: "hidden", bgcolor: "#0f172a" }}>
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onWheel={handleWheel}
        style={{ width: "100%", height: "100%", display: "block", touchAction: "none" }}
      />
      {!plyUrl && (
        <Box sx={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", color: "grey.300" }}>
          Select a plant with a PLY reconstruction.
        </Box>
      )}
      {loading && (
        <Box sx={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", bgcolor: "rgba(15,23,42,0.7)" }}>
          <CircularProgress />
        </Box>
      )}
      {error && (
        <Box sx={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", color: "error.light", p: 2, textAlign: "center" }}>
          {error}
        </Box>
      )}
      <Tooltip title="Fit point cloud to view">
        <span>
          <IconButton
            size="small"
            onClick={handleFitView}
            disabled={!cloud}
            sx={{
              position: "absolute",
              right: 12,
              bottom: 12,
              bgcolor: "rgba(15, 23, 42, 0.82)",
              color: "grey.100",
              border: "1px solid rgba(255,255,255,0.18)",
              "&:hover": {
                bgcolor: "rgba(30, 41, 59, 0.95)",
              },
              "&.Mui-disabled": {
                bgcolor: "rgba(15, 23, 42, 0.45)",
                color: "grey.600",
              },
            }}
          >
            <FitScreenIcon fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>
    </Box>
  );
}

export default function PhenoPage({ ros, connected }) {
  const notify = useAppSnackbar();
  const [filters, setFilters] = React.useState({ date: "", bench: "", row: "" });
  const [captureForm, setCaptureForm] = React.useState({ bench: "", row: "", plantNumber: "", viewNumber: "" });
  const [runs, setRuns] = React.useState([]);
  const [selectedRunId, setSelectedRunId] = React.useState("");
  const [selectedPlantId, setSelectedPlantId] = React.useState("");
  const [selectedImageId, setSelectedImageId] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [captureBusy, setCaptureBusy] = React.useState(false);
  const [error, setError] = React.useState("");

  const selectedRun = React.useMemo(() => runs.find((run) => run.id === selectedRunId) ?? null, [runs, selectedRunId]);
  const selectedPlant = React.useMemo(
    () => selectedRun?.plants.find((plant) => plant.id === selectedPlantId) ?? null,
    [selectedRun, selectedPlantId],
  );

  const imageOptions = React.useMemo(() => {
    const rowImages = selectedRun?.rowImages.map((image) => ({ ...image, group: "Row" })) ?? [];
    const plantImages =
      selectedPlant?.views
        .filter((view) => view.colorUrl)
        .map((view) => ({ id: view.id, label: view.label, url: view.colorUrl, group: selectedPlant.label })) ?? [];
    return [...rowImages, ...plantImages];
  }, [selectedRun, selectedPlant]);

  const selectedImage = imageOptions.find((image) => image.id === selectedImageId) ?? imageOptions[0] ?? null;
  const selectedPlyUrl = selectedPlant?.mergedPlyUrl || selectedRun?.rowPlyUrl || "";

  React.useEffect(() => {
    if (!selectedRun) {
      setSelectedPlantId("");
      return;
    }
    setSelectedPlantId(selectedRun.plants[0]?.id ?? "");
  }, [selectedRun]);

  React.useEffect(() => {
    setSelectedImageId(imageOptions[0]?.id ?? "");
  }, [imageOptions]);

  const updateFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const updateCaptureForm = (key, value) => {
    setCaptureForm((prev) => ({ ...prev, [key]: value }));
  };

  async function handleManualCapture() {
    const bench = Number(captureForm.bench || filters.bench);
    const row = Number(captureForm.row || filters.row);
    const plantNumber = Number(captureForm.plantNumber);
    const viewNumber = Number(captureForm.viewNumber);

    if (!Number.isFinite(bench) || !Number.isFinite(row) || !Number.isFinite(plantNumber) || !Number.isFinite(viewNumber)) {
      notify.error("Please fill bench, row, plant number, and view number before capturing.");
      return;
    }

    if (!ros || !connected) {
      notify.error("ROS is not connected. Connect first to capture a manual view.");
      return;
    }

    const now = new Date();
    const yyyymmdd = now.toISOString().slice(0, 10).replace(/-/g, "");
    const hhmmss = now.toTimeString().slice(0, 8).replace(/:/g, "");
    const runName = `b${bench}_r${row}_${yyyymmdd}_${hhmmss}`;
    const runDir = `/home/thiwa/scan_data_zed_manual/${runName}`;
    const viewLabel = `view_${viewNumber}`;

    setCaptureBusy(true);
    try {
      const service = new ROSLIB.Service({
        ros,
        name: "/orbbec_test_scan/capture_view",
        serviceType: "arm_interfaces/srv/CaptureView",
      });

      const request = {
        run_dir: runDir,
        plant_id: plantNumber,
        view_label: viewLabel,
      };

      const res = await new Promise((resolve, reject) => {
        service.callService(request, resolve, (err) => reject(new Error(err?.message || "Capture request failed")), 20000);
      });

      if (res?.success) {
        notify.success(`Manual capture requested for ${runDir}/plant_${String(plantNumber).padStart(2, "0")}/${viewLabel}`);
      } else {
        notify.error(res?.message || "Manual capture request failed.");
      }
    } catch (e) {
      notify.error(e?.message || "Manual capture failed.");
    } finally {
      setCaptureBusy(false);
    }
  }

  async function handleSearch() {
    const params = new URLSearchParams();
    if (filters.date) params.set("date", filters.date);
    if (filters.bench) params.set("bench", filters.bench);
    if (filters.row) params.set("row", filters.row);

    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/pheno/search?${params.toString()}`);
      if (!res.ok) throw new Error(`Search failed (${res.status})`);
      const data = await res.json();
      const nextRuns = data.runs ?? [];
      setRuns(nextRuns);
      setSelectedRunId(nextRuns[0]?.id ?? "");
      if (nextRuns[0]) {
        notify.success(`${nextRuns[0].plantCount} plants found`);
      } else {
        notify.warning("No plants found for that search");
      }
    } catch (e) {
      setError(e?.message || "Failed to search phenotype scans.");
      notify.error(e?.message || "Failed to search phenotype scans.");
      setRuns([]);
      setSelectedRunId("");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Stack spacing={2}>
      <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "1.4fr 1fr 1fr",
              md: "1.25fr 0.85fr 0.85fr 1fr 1.3fr",
            },
            gap: 1.5,
            alignItems: "center",
            width: "100%",
          }}
        >
          <TextField
            type="date"
            size="small"
            label="Date"
            InputLabelProps={{ shrink: true }}
            value={filters.date}
            onChange={(event) => updateFilter("date", event.target.value)}
            fullWidth
          />
          <TextField
            size="small"
            label="Bench"
            type="number"
            value={filters.bench}
            onChange={(event) => updateFilter("bench", event.target.value)}
            fullWidth
          />
          <TextField
            size="small"
            label="Row"
            type="number"
            value={filters.row}
            onChange={(event) => updateFilter("row", event.target.value)}
            fullWidth
          />
          <Button
            variant="contained"
            startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <SearchIcon />}
            onClick={handleSearch}
            sx={{ height: 40 }}
            fullWidth
          >
            Search
          </Button>
          <FormControl size="small" disabled={!selectedRun?.plants.length} fullWidth>
            <InputLabel>Plant</InputLabel>
            <Select value={selectedPlantId} label="Plant" onChange={(event) => setSelectedPlantId(event.target.value)}>
              {selectedRun?.plants.map((plant) => (
                <MenuItem key={plant.id} value={plant.id}>
                  {plant.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          {error && (
            <Typography variant="body2" color="error" sx={{ gridColumn: "1 / -1" }}>
              {error}
            </Typography>
          )}
        </Box>
      </Paper>

      <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} alignItems={{ xs: "stretch", md: "center" }}>
          <TextField
            size="small"
            label="Bench"
            type="number"
            value={captureForm.bench}
            onChange={(event) => updateCaptureForm("bench", event.target.value)}
            sx={{ minWidth: 110 }}
          />
          <TextField
            size="small"
            label="Row"
            type="number"
            value={captureForm.row}
            onChange={(event) => updateCaptureForm("row", event.target.value)}
            sx={{ minWidth: 110 }}
          />
          <TextField
            size="small"
            label="Plant #"
            type="number"
            value={captureForm.plantNumber}
            onChange={(event) => updateCaptureForm("plantNumber", event.target.value)}
            sx={{ minWidth: 110 }}
          />
          <TextField
            size="small"
            label="View #"
            type="number"
            value={captureForm.viewNumber}
            onChange={(event) => updateCaptureForm("viewNumber", event.target.value)}
            sx={{ minWidth: 110 }}
          />
          <Button
            variant="contained"
            color="primary"
            onClick={handleManualCapture}
            disabled={!connected || captureBusy || !ros}
            sx={{ height: 40, minWidth: 150 }}
          >
            {captureBusy ? "Capturing..." : "Capture manual view"}
          </Button>
        </Stack>
      </Paper>

      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          gap: 2,
          alignItems: "stretch",
          width: "100%",
        }}
      >
        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, flex: "1 1 42%", minWidth: 0 }}>
          <FormControl size="small" fullWidth disabled={!imageOptions.length} sx={{ mb: 1.5 }}>
            <InputLabel>Image</InputLabel>
            <Select value={selectedImageId} label="Image" onChange={(event) => setSelectedImageId(event.target.value)}>
              {imageOptions.map((image) => (
                <MenuItem key={`${image.group}-${image.id}`} value={image.id}>
                  {image.group}: {image.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Box
            sx={{
              height: 360,
              borderRadius: 2,
              bgcolor: "grey.100",
              overflow: "hidden",
              display: "grid",
              placeItems: "center",
            }}
          >
            {selectedImage ? (
              <Box component="img" src={selectedImage.url} alt={selectedImage.label} sx={{ width: "100%", height: "100%", objectFit: "contain" }} />
            ) : (
              <Typography variant="body2" color="text.secondary">
                No PNG image available.
              </Typography>
            )}
          </Box>
        </Paper>

        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, flex: "1 1 58%", minWidth: 0 }}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
            <ViewInArIcon fontSize="small" />
            <Typography sx={{ fontWeight: 800 }}>3D reconstruction</Typography>
            {selectedPlant?.mergedPlyUrl && <Chip size="small" label={selectedPlant.label} />}
          </Stack>
          <PointCloudViewer plyUrl={selectedPlyUrl} />
        </Paper>
      </Box>
    </Stack>
  );
}
