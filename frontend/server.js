import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { searchPhenoRuns, resolvePhenoFile } from "./phenoApi.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 5173;

// Serve static files
app.use(express.static(path.join(__dirname, "dist")));

app.get("/api/pheno/search", (req, res) => {
  const { date, bench, row } = req.query;
  res.json({ runs: searchPhenoRuns({ date, bench, row }) });
});

app.get("/pheno-data/:rootId/*path", (req, res) => {
  const relativeParts = Array.isArray(req.params.path) ? req.params.path : [req.params.path];
  const filePath = resolvePhenoFile(req.params.rootId, relativeParts);
  if (!filePath) {
    res.status(404).send("Not found");
    return;
  }
  res.sendFile(filePath);
});

// SPA fallback (React router)
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

app.listen(PORT, "127.0.0.1", () => {
  console.log(`CEAbot UI running at http://127.0.0.1:${PORT}`);
});
