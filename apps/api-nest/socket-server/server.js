const { createServer } = require("http");
const { Server } = require("socket.io");

const PORT = process.env.SOCKET_PORT || 4001;
const server = createServer((req, res) => {
  if (req.method === "POST" && req.url === "/broadcast") {
    let body = "";
    req.on("data", (chunk) => { body += chunk; });
    req.on("end", () => {
      try {
        const payload = JSON.parse(body || "{}");
        io.emit("savings-rate-updated", payload);
        console.log("[ws] http relay savings-rate-updated", payload);
        res.writeHead(200, { "content-type": "application/json" });
        res.end(JSON.stringify({ ok: true }));
      } catch (e) {
        res.writeHead(400, { "content-type": "application/json" });
        res.end(JSON.stringify({ ok: false, error: "INVALID_PAYLOAD" }));
      }
    });
    return;
  }
  if (req.method === "POST" && req.url === "/broadcast-actions") {
    let body = "";
    req.on("data", (chunk) => { body += chunk; });
    req.on("end", () => {
      try {
        const payload = JSON.parse(body || "{}");
        io.emit("action-stock-updated", payload);
        console.log("[ws] http relay action-stock-updated", payload);
        res.writeHead(200, { "content-type": "application/json" });
        res.end(JSON.stringify({ ok: true }));
      } catch (e) {
        res.writeHead(400, { "content-type": "application/json" });
        res.end(JSON.stringify({ ok: false, error: "INVALID_PAYLOAD" }));
      }
    });
    return;
  }
  res.writeHead(404);
  res.end();
});
const io = new Server(server, { cors: { origin: "*" } });

io.on("connection", (socket) => {
  console.log("[ws] client connected");

  socket.on("savings-rate-updated", (payload) => {
    io.emit("savings-rate-updated", payload);
    console.log("[ws] relay savings-rate-updated", payload);
  });

  socket.on("action-stock-updated", (payload) => {
    io.emit("action-stock-updated", payload);
    console.log("[ws] relay action-stock-updated", payload);
  });
});

function broadcastSavingsRate(payload) {
  io.emit("savings-rate-updated", payload);
  console.log("[ws] broadcast savings-rate-updated", payload);
}

function broadcastActionStock(payload) {
  io.emit("action-stock-updated", payload);
  console.log("[ws] broadcast action-stock-updated", payload);
}

module.exports = { server, io, broadcastSavingsRate, broadcastActionStock };

if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`[ws] listening on ${PORT}`);
  });
}
