import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 5173;

// Serve static files
app.use(express.static(path.join(__dirname, "dist")));

// SPA fallback (React router)
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

app.listen(PORT, "127.0.0.1", () => {
  console.log(`CEAbot UI running at http://127.0.0.1:${PORT}`);
});
