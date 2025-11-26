"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const ws_1 = require("ws");
const http_1 = __importDefault(require("http"));
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
const rooms = new Map();
// 共有ID発行: POST /api/share/create
app.post("/api/share/create", (req, res) => {
    const id = String(Math.floor(10000 + Math.random() * 90000)); // 5桁
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5分後
    rooms.set(id, { id, expiresAt });
    console.log("create shareId", id);
    res.json({ id, expiresAt });
});
// 共有IDチェック: POST /api/share/verify
app.post("/api/share/verify", (req, res) => {
    const { id } = req.body;
    if (!id)
        return res.status(400).json({ ok: false, reason: "id required" });
    const room = rooms.get(id);
    if (!room)
        return res.json({ ok: false, reason: "not_found" });
    if (room.expiresAt <= Date.now())
        return res.json({ ok: false, reason: "expired" });
    res.json({ ok: true, expiresAt: room.expiresAt });
});
// HTTP サーバーを作成
const server = http_1.default.createServer(app);
// WebSocket サーバー（シグナリング用）
// クライアントは wss://chat-template.net/ws?room=共有ID で接続
const wss = new ws_1.WebSocketServer({ server, path: "/ws" });
const roomClients = new Map();
wss.on("connection", (ws, req) => {
    const url = new URL(req.url || "", `http://${req.headers.host}`);
    const roomId = url.searchParams.get("room");
    if (!roomId) {
        ws.close();
        return;
    }
    ws.roomId = roomId;
    let set = roomClients.get(roomId);
    if (!set) {
        set = new Set();
        roomClients.set(roomId, set);
    }
    set.add(ws);
    console.log("WS client connected to room", roomId, "size", set.size);
    ws.on("message", (data) => {
        const msg = data.toString();
        const clients = roomClients.get(roomId);
        if (!clients)
            return;
        for (const client of clients) {
            if (client !== ws && client.readyState === ws_1.WebSocket.OPEN) {
                client.send(msg); // 受け取ったシグナリングを同じroomの他クライアントへ転送
            }
        }
    });
    ws.on("close", () => {
        const clients = roomClients.get(roomId);
        if (!clients)
            return;
        clients.delete(ws);
        console.log("WS client disconnected from room", roomId, "size", clients.size);
        if (clients.size === 0) {
            roomClients.delete(roomId);
        }
    });
});
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
    console.log("Signaling server listening on port", PORT);
});
