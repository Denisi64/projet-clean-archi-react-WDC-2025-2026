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
  if (req.method === "POST" && req.url === "/broadcast-group") {
    let body = "";
    req.on("data", (chunk) => { body += chunk; });
    req.on("end", () => {
      try {
        const payload = JSON.parse(body || "{}");
        io.to("group-chat").emit("group-message", payload);
        console.log("[ws] http relay group-message", payload);
        res.writeHead(200, { "content-type": "application/json" });
        res.end(JSON.stringify({ ok: true }));
      } catch (e) {
        res.writeHead(400, { "content-type": "application/json" });
        res.end(JSON.stringify({ ok: false, error: "INVALID_PAYLOAD" }));
      }
    });
    return;
  }
  if (req.method === "POST" && req.url === "/broadcast-discussion-message") {
    let body = "";
    req.on("data", (chunk) => { body += chunk; });
    req.on("end", () => {
      try {
        const payload = JSON.parse(body || "{}");
        if (payload?.discussionId) {
          io.to(`discussion:${payload.discussionId}`).emit("discussion.newMessage", payload);
        }
        res.writeHead(200, { "content-type": "application/json" });
        res.end(JSON.stringify({ ok: true }));
      } catch (e) {
        res.writeHead(400, { "content-type": "application/json" });
        res.end(JSON.stringify({ ok: false, error: "INVALID_PAYLOAD" }));
      }
    });
    return;
  }
  if (req.method === "POST" && req.url === "/broadcast-discussion-assigned") {
    let body = "";
    req.on("data", (chunk) => { body += chunk; });
    req.on("end", () => {
      try {
        const payload = JSON.parse(body || "{}");
        io.to("advisor-inbox").emit("discussion.assigned", payload);
        res.writeHead(200, { "content-type": "application/json" });
        res.end(JSON.stringify({ ok: true }));
      } catch (e) {
        res.writeHead(400, { "content-type": "application/json" });
        res.end(JSON.stringify({ ok: false, error: "INVALID_PAYLOAD" }));
      }
    });
    return;
  }
  if (req.method === "POST" && req.url === "/broadcast-discussion-created") {
    let body = "";
    req.on("data", (chunk) => { body += chunk; });
    req.on("end", () => {
      try {
        const payload = JSON.parse(body || "{}");
        io.to("advisor-inbox").emit("discussion.created", payload);
        console.log("[ws] http relay discussion.created", payload);
        res.writeHead(200, { "content-type": "application/json" });
        res.end(JSON.stringify({ ok: true }));
      } catch (e) {
        res.writeHead(400, { "content-type": "application/json" });
        res.end(JSON.stringify({ ok: false, error: "INVALID_PAYLOAD" }));
      }
    });
    return;
  }
  if (req.method === "POST" && req.url === "/broadcast-discussion-removed") {
    let body = "";
    req.on("data", (chunk) => { body += chunk; });
    req.on("end", () => {
      try {
        const payload = JSON.parse(body || "{}");
        io.to("advisor-inbox").emit("discussion.removed", payload);
        res.writeHead(200, { "content-type": "application/json" });
        res.end(JSON.stringify({ ok: true }));
      } catch (e) {
        res.writeHead(400, { "content-type": "application/json" });
        res.end(JSON.stringify({ ok: false, error: "INVALID_PAYLOAD" }));
      }
    });
    return;
  }
  if (req.method === "POST" && req.url === "/broadcast-discussion-transferred") {
    let body = "";
    req.on("data", (chunk) => { body += chunk; });
    req.on("end", () => {
      try {
        const payload = JSON.parse(body || "{}");
        if (payload?.discussionId) {
          io.to(`discussion:${payload.discussionId}`).emit("discussion.transferred", payload);
        }
        res.writeHead(200, { "content-type": "application/json" });
        res.end(JSON.stringify({ ok: true }));
      } catch (e) {
        res.writeHead(400, { "content-type": "application/json" });
        res.end(JSON.stringify({ ok: false, error: "INVALID_PAYLOAD" }));
      }
    });
    return;
  }
  if (req.method === "POST" && req.url === "/broadcast-discussion-closed") {
    let body = "";
    req.on("data", (chunk) => { body += chunk; });
    req.on("end", () => {
      try {
        const payload = JSON.parse(body || "{}");
        if (payload?.discussionId) {
          io.to(`discussion:${payload.discussionId}`).emit("discussion.closed", payload);
        }
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

  socket.on("group-join", () => {
    socket.join("group-chat");
    console.log("[ws] join group-chat");
  });

  socket.on("group-message", (payload) => {
    io.to("group-chat").emit("group-message", payload);
    console.log("[ws] relay group-message", payload);
  });

  socket.on("discussion.join", (payload) => {
    if (!payload?.discussionId) return;
    socket.join(`discussion:${payload.discussionId}`);
    console.log("[ws] join discussion", payload.discussionId);
  });

  socket.on("advisor.join", () => {
    socket.join("advisor-inbox");
    console.log("[ws] join advisor-inbox");
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

function broadcastGroupMessage(payload) {
  io.to("group-chat").emit("group-message", payload);
  console.log("[ws] broadcast group-message", payload);
}

module.exports = {
  server,
  io,
  broadcastSavingsRate,
  broadcastActionStock,
  broadcastGroupMessage,
};

if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`[ws] listening on ${PORT}`);
  });
}
