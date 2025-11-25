import { useState } from "react";
import ChatScreen from "./components/Chat/ChatScreen";
import SecretBoxPage from "./pages/SecretBoxPage";

type View = "chat" | "secret";

type SecretItemType = "message" | "link" | "file";

type SecretItem = {
  id: string;
  type: SecretItemType;
  content: string;
  createdAt: string;
};

type ChatMessage = {
  id: number;
  from: "own" | "other";
  text: string;
  time: string;
  isPhoto?: boolean;
  fileUrl?: string;
  fileName?: string;
  createdAt: string;
  expiresAt: string;
};

// テキストから「メッセージ / リンク / ファイル」を判定
function detectType(content: string): SecretItemType {
  if (/^https?:\/\//.test(content)) return "link";
  if (/\.[a-zA-Z0-9]{2,4}$/.test(content)) return "file";
  return "message";
}

function App() {
  const [view, setView] = useState<View>("chat");

  // チャットメッセージ（画面切り替えしても消えない）
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const now = new Date();
    const base = now.getTime();
    const oneHour = 60 * 60 * 1000;

    const makeTime = (date: Date) =>
      `${date.getHours().toString().padStart(2, "0")}:${date
        .getMinutes()
        .toString()
        .padStart(2, "0")}`;

    const m1Created = new Date(base - oneHour);
    const m2Created = new Date(base - oneHour + 1000);
    const m3Created = new Date(base - oneHour + 2000);
    const expires = new Date(base + oneHour).toISOString();

    return [
      {
        id: 1,
        from: "other",
        text: "こんにちは！",
        time: makeTime(m1Created),
        createdAt: m1Created.toISOString(),
        expiresAt: expires,
      },
      {
        id: 2,
        from: "own",
        text: "お疲れさまです！",
        time: makeTime(m2Created),
        createdAt: m2Created.toISOString(),
        expiresAt: expires,
      },
      {
        id: 3,
        from: "own",
        text: "[写真プレビュー]",
        isPhoto: true,
        time: makeTime(m3Created),
        createdAt: m3Created.toISOString(),
        expiresAt: expires,
      },
    ];
  });

  // 自動削除までの時間（分） 60=1h, 360=6h, 720=12h, 1440=1日
  const [retentionMinutes, setRetentionMinutes] = useState<number>(60);

  // 秘密BOXに保存された全アイテム
  const [secretItems, setSecretItems] = useState<SecretItem[]>([]);

  // 共有ID(5桁数字)と有効期限
  const [shareId, setShareId] = useState<string | null>(null);
  const [shareExpiresAt, setShareExpiresAt] = useState<string | 
null>(null);

  // チャットから秘密BOXへ保存するときに呼ばれる
  const handleSaveToSecretBox = (content: string) => {
    const trimmed = content.trim();
    if (!trimmed) return;

    const now = new Date();
    const newItem: SecretItem = {
      id: `${now.getTime()}-${Math.random().toString(36).slice(2, 8)}`,
      type: detectType(trimmed),
      content: trimmed,
      createdAt: now.toISOString(),
    };
    setSecretItems(prev => [...prev, newItem]);
    console.log("秘密BOXに保存:", newItem);
  };

  // メッセージ送信（テキスト）
  const handleSendMessage = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const now = new Date();
    const time = `${now.getHours().toString().padStart(2, "0")}:${now
      .getMinutes()
      .toString()
      .padStart(2, "0")}`;
    const expiresAt = new Date(
      now.getTime() + retentionMinutes * 60 * 1000
    ).toISOString();

    setMessages(prev => [
      ...prev,
      {
        id: prev.length ? prev[prev.length - 1].id + 1 : 1,
        from: "own",
        text: trimmed,
        time,
        createdAt: now.toISOString(),
        expiresAt,
      },
    ]);
  };

  // メッセージ送信（ファイル）
  const handleSendFile = (fileName: string, fileUrl: string) => {
    const now = new Date();
    const time = `${now.getHours().toString().padStart(2, "0")}:${now
      .getMinutes()
      .toString()
      .padStart(2, "0")}`;
    const expiresAt = new Date(
      now.getTime() + retentionMinutes * 60 * 1000
    ).toISOString();

    setMessages(prev => [
      ...prev,
      {
        id: prev.length ? prev[prev.length - 1].id + 1 : 1,
        from: "own",
        text: "",
        time,
        isPhoto: false,
        fileUrl,
        fileName,
        createdAt: now.toISOString(),
        expiresAt,
      },
    ]);
  };

  // 表示対象：期限が切れていないものだけ
  const nowMs = Date.now();
  const visibleMessages = messages.filter(
    m => new Date(m.expiresAt).getTime() > nowMs
  );

  // 共有IDを 5桁数字で発行
  const handleGenerateShareId = () => {
    const id = String(Math.floor(10000 + Math.random() * 90000));
 // 5桁数字
    const expires = new Date(Date.now() + 5 * 60 * 1000); // 5分後
    setShareId(id);
    setShareExpiresAt(expires.toISOString());
  };

  // 共有IDを相手が入力したときの簡易チェック（フロントのみ）
  const handlePairByCode = (code: string) => {
    const trimmed = code.trim();
    if (!trimmed || trimmed.length !== 5) {
      alert("5桁の共有IDを入力してください。");
      return;
    }
    if (!shareId || !shareExpiresAt) {
      alert("共有IDが発行されていません。");
      return;
    }
    const expired = new Date(shareExpiresAt).getTime() <= Date.now();
    if (expired) {
      alert("共有IDの有効期限が切れています。");
      return;
    }
    if (trimmed !== shareId) {
      alert("共有IDが一致しません。");
      return;
    }
    alert("共有IDが一致しました。（ここでサーバと接続する想定）");
  };

  return (
    <div className="app-root">
      <div className="app-frame">
        {view === "chat" && (
          <ChatScreen
            messages={visibleMessages}
            onSend={handleSendMessage}
            onSendFile={handleSendFile}
            onSaveToSecretBox={handleSaveToSecretBox}
            retentionMinutes={retentionMinutes}
            onChangeRetentionMinutes={setRetentionMinutes}
            secretCount={secretItems.length}
            shareId={shareId}
            shareExpiresAt={shareExpiresAt}
            onGenerateShareId={handleGenerateShareId}
            onPairByCode={handlePairByCode}
          />
        )}

        {view === "secret" && <SecretBoxPage items={secretItems} />}
      </div>

      {/* 端末の外側に出して入力欄の邪魔をしないようにする */}
      <nav className="bottom-nav">
        <button
          className={view === "chat" ? "nav-btn active" : "nav-btn"}
          onClick={() => setView("chat")}
        >
          チャット
        </button>
        <button
          className={view === "secret" ? "nav-btn active" : "nav-btn"}
          onClick={() => setView("secret")}
        >
          秘密BOX
        </button>
      </nav>
    </div>
  );
}

export default App;

