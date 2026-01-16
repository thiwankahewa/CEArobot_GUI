import http from "http";
import { exec } from "child_process";

const PORT = 7777;

function run(cmd) {
  return new Promise((resolve) => {
    exec(cmd, (err, stdout, stderr) => {
      resolve({ ok: !err, stdout, stderr });
    });
  });
}

const server = http.createServer(async (req, res) => {
  if (req.method !== "POST" || req.url !== "/exit-kiosk") {
    res.writeHead(404);
    return res.end("Not found");
  }

  const ip = req.socket.remoteAddress || "";
  if (!["127.0.0.1", "::1"].includes(ip)) {
    res.writeHead(403);
    return res.end("Forbidden");
  }

  const r = await run(
    "/usr/bin/bash -lc '$HOME/CEArobot_GUI/frontend/kiosk_control/exit_kiosk.sh'",
  );

  res.writeHead(r.ok ? 200 : 500, { "Content-Type": "application/json" });
  res.end(JSON.stringify(r));
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`Kiosk control API running on http://127.0.0.1:${PORT}`);
});
