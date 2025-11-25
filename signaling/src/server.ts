import express from "express";
import cors from "cors";
import { WebSocketServer, WebSocket } from "ws";
import http from "http";

const app = express();

app.use(cors());
app.use(express.json());

// ★ メモリ上に共有IDを保存（DBはまだ使わないシンプル版）
type ShareRoom = {
  id: string;
  expiresAt: number; // ミリ秒
};

const rooms = new Map<string, ShareRoom>();

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
  const { id } = req.body as { id?: string };

  if (!id) return res.status(400).json({ ok: false, reason: "id required" });

  const room = rooms.get(id);
  if (!room) return res.json({ ok: false, reason: "not_found" });

  if (room.expiresAt <= Date.now())
    return res.json({ ok: false, reason: "expired" });

  res.json({ ok: true, expiresAt: room.expiresAt });
});

// HTTP サーバーを作成
const server = http.createServer(app);

// WebSocket サーバー（シグナリング用）
// クライアントは wss://chat-template.net/ws?room=共有ID で接続
const wss = new WebSocketServer({ server, path: "/ws" });

type ExtWebSocket = WebSocket & { roomId?: string };

const roomClients = new Map<string, Set<ExtWebSocket>>();

wss.on("connection", (ws: ExtWebSocket, req) => {
  const url = new URL(req.url || "", `http://${req.headers.host}`);
  const roomId = url.searchParams.get("room");

  if (!roomId) {
    ws.close();
    return;
  }

  ws.roomId = roomId;

  // ルームにクライアント追加
  let set = roomClients.get(roomId);
  if (!set) {
    set = new Set();
    roomClients.set(roomId, set);
  }

  set.add(ws);

  console.log(
    "WS client connected to room",
    roomId,
    "size",
    set.size
  );

  // メッセージ転送（同じroom内のみ）
  ws.on("message", (data) => {
    const msg = data.toString();
    const clients = roomClients.get(roomId);
    if (!clients) return;

    for (const client of clients) {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(msg);
      }
    }
  });

  ws.on("close", () => {
    const clients = roomClients.get(roomId);
    if (!clients) return;

    clients.delete(ws);

    console.log(
      "WS client disconnected from room",
      roomId,
      "size",
      clients.size
    );

    if (clients.size === 0) {
      roomClients.delete(roomId);
    }
  });
});

const PORT = process.env.PORT || 4000;

server.listen(PORT, () => {
  console.log("Signaling server listening on port", PORT);
});
	
