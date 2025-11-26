import { useState, useEffect } from "react";
import "./styles/global.css";

import ChatScreen from "./components/Chat/ChatScreen";
import SecretBoxPage from "./pages/SecretBoxPage";
import SettingsPage from "./pages/SettingsPage";
import UserListPage from "./pages/UserListPage";

import { useAudioCall } from "./hooks/useAudioCall";
import InvitePage from "./pages/InvitePage";

type View = "userList" | "chat" | "secret" | "settings" | "invite";

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

type Contact = {
  id: string; // 共有IDなど
  name: string;
  lastMessage?: string;
  lastTime?: string;
};

function detectType(content: string): SecretItemType {
  if (/^https?:\/\//.test(content)) return "link";
  if (/\.[a-zA-Z0-9]{2,4}$/.test(content)) return "file";
  return "message";
}

// ランダム表示名の生成
function generateRandomName(): string {
  const adjectives = ["Blue", "Silent", "Lucky", "Swift", "Happy", "Brave"];
  const animals = ["Fox", "Cat", "Wolf", "Dolphin", "Panda", "Hawk"];

  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const animal = animals[Math.floor(Math.random() * animals.length)];
  const num = Math.floor(Math.random() * 900) + 100; // 3桁番号

  return `${adj}${animal}${num}`; // 例: BlueFox392
}

function App() {
  const [view, setView] = useState<View>("userList");

  // メッセージ一覧（localStorage から復元）
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const stored = localStorage.getItem("app_messages");
    if (!stored) return [];
    try {
      return JSON.parse(stored) as ChatMessage[];
    } catch {
      return [];
    }
  });

  // messages が変わるたびに localStorage に保存
  useEffect(() => {
    localStorage.setItem("app_messages", JSON.stringify(messages));
  }, [messages]);

  const [retentionMinutes, setRetentionMinutes] = useState<number>(60);
  const [secretItems, setSecretItems] = useState<SecretItem[]>([]);

  // 設定ページ用 state
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [fontSize, setFontSize] = useState<number>(16);

  // 連絡先一覧 & 選択中の相手（localStorage から復元）
  const [contacts, setContacts] = useState<Contact[]>(() => {
    const stored = localStorage.getItem("app_contacts");
    if (!stored) return [];
    try {
      return JSON.parse(stored) as Contact[];
    } catch {
      return [];
    }
  });
  const [currentContact, setCurrentContact] = useState<Contact | null>(null);

  // contacts が変わるたびに localStorage に保存
  useEffect(() => {
    localStorage.setItem("app_contacts", JSON.stringify(contacts));
  }, [contacts]);

  // テーマとフォントサイズを反映する
  useEffect(() => {
    document.body.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.style.setProperty(
      "--app-font-size",
      fontSize + "px"
    );
  }, [fontSize]);

  // 自分のユーザー名（アプリ初回で1度だけ自動生成 → localStorageへ保存）
  const [userName, setUserName] = useState<string>(() => {
    const stored = localStorage.getItem("app_user_name");
    if (stored) return stored;

    const name = generateRandomName(); // 新規生成
    localStorage.setItem("app_user_name", name); // 初回保存
    return name;
  });

  const handleDeleteContact = (id: string) => {
  setContacts((prev) => prev.filter((c) => c.id !== id));

  // 今開いてる相手を消した場合はチャットを閉じる
  if (currentContact && currentContact.id === id) {
    setCurrentContact(null);
    setView("userList");
  }
};


  // ユーザー名変更時にも localStorage に保存
  useEffect(() => {
    localStorage.setItem("app_user_name", userName);
  }, [userName]);

  const [shareId, setShareId] = useState<string | null>(null);
  const [shareExpiresAt, setShareExpiresAt] = useState<string | null>(null);

  const [ws, setWs] = useState<WebSocket | null>(null);

  const { inCall, startCall, endCall, remoteAudioRef } = useAudioCall({
    ws,
    roomId: shareId,
  });

// ★ WebSocket で相手からのメッセージを受信する（chat ＋ joined）
useEffect(() => {
  if (!ws) return;

  const handler = (event: MessageEvent) => {
    let data: any;
    try {
      data = JSON.parse(event.data as string);
    } catch {
      return; // JSONじゃなければ無視
    }

    // --- ① chat メッセージ ---
    if (data.type === "chat") {
      const text: string = data.text ?? "";
      if (!text.trim()) return;

      const createdAt = data.createdAt || new Date().toISOString();
      const time =
        data.time ||
        new Date(createdAt).toLocaleTimeString("ja-JP", {
          hour: "2-digit",
          minute: "2-digit",
        });
      const expiresAt =
        data.expiresAt ||
        new Date(Date.now() + retentionMinutes * 60000).toISOString();

      // ① メッセージ一覧に追加
      setMessages((prev) => {
        const newId = prev.length ? prev[prev.length - 1].id + 1 : 1;
        return [
          ...prev,
          {
            id: newId,
            from: "other",
            text,
            time,
            createdAt,
            expiresAt,
          },
        ];
      });

      // ② ユーザー一覧（contacts）の lastMessage / lastTime を更新
      if (shareId) {
        setContacts((prev) =>
          prev.map((c) =>
            c.id === shareId
              ? { ...c, lastMessage: text, lastTime: time }
              : c
          )
        );
      }

      return;
    }

    // --- ② joined メッセージ（相手が共有ID入力に成功した時）---
    if (data.type === "joined") {
      const displayName: string =
        typeof data.displayName === "string" && data.displayName.trim()
          ? data.displayName
          : shareId
          ? `ユーザー${shareId}`
          : "ユーザー";

      if (!shareId) {
        console.warn("joined を受け取ったが shareId が未設定");
        return;
      }

      const newContact: Contact = {
        id: shareId,
        name: displayName, // ←相手のユーザー名を使う
      };

      setContacts((prev) => {
        if (prev.some((c) => c.id === shareId)) return prev;
        return [...prev, newContact];
      });

      setCurrentContact(newContact);
      setView("chat"); // ← 発行者側もここでチャット画面へ移動

      return;
    }
  };

  ws.addEventListener("message", handler);

  return () => {
    ws.removeEventListener("message", handler);
  };
}, [ws, retentionMinutes, shareId]);



  // 共有ID発行
// 共有ID発行（＝招待コードを作るだけ。友だち登録＆チャット遷移はしない）
const handleGenerateShareId = async () => {
  try {
    const res = await fetch("/api/share/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("共有ID発行エラー status:", res.status, text);
      alert(`共有ID発行に失敗しました（${res.status}）`);
      return;
    }

    const data = await res.json();
    console.log("共有ID発行レスポンス:", data);

    // 共有IDを state に保存して画面に表示
    setShareId(data.id);
    setShareExpiresAt(new Date(data.expiresAt).toISOString());

    // WebSocket で部屋に参加（相手が入ってくるのを待つ）
    const sock = new WebSocket(`wss://${location.host}/ws?room=${data.id}`);
    setWs(sock);

    // ★ ここでは contacts に追加しない
    // ★ ここでは setView("chat") もしない
    // → 発行した側は、あくまで「招待コードを作っただけ」の状態にしておく

  } catch (err) {
    console.error("共有ID発行中にエラー:", err);
    alert("共有ID発行中にエラーが発生しました（コンソールを確認してください）");
  }
};



  // 共有IDでペアリング
  // 共有IDでペアリング
const handlePairByCode = async (code: string) => {
  const res = await fetch("/api/share/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: code }),
  });

  const data = await res.json();
  if (!data.ok) {
    alert("共有IDが無効です");
    return;
  }

  setShareId(code);
  setShareExpiresAt(new Date(data.expiresAt).toISOString());

  const sock = new WebSocket(`wss://${location.host}/ws?room=${code}`);
  setWs(sock);

  // ★ ここから1ブロック追加：自分のユーザー名を相手に知らせる
  sock.addEventListener("open", () => {
    sock.send(
      JSON.stringify({
        type: "joined",
        displayName: userName,  // 自分のユーザー名（BlueWolf805 など）
      })
    );
  });

  // 連絡先に保存
  const newContact: Contact = {
    id: code,
    name: `ユーザー${code}`, // とりあえず共有IDベース
  };

  setContacts((prev) => {
    if (prev.some((c) => c.id === code)) return prev;
    return [...prev, newContact];
  });

  setCurrentContact(newContact);
  setView("chat");

  alert("共有ID一致 → 接続しました！");
};


  // メッセージ送信
  // メッセージ送信
const handleSendMessage = (text: string) => {
  const trimmed = text.trim();
  if (!trimmed) return;

  const now = new Date();
  const time = now.toLocaleTimeString("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const expiresAt = new Date(
    now.getTime() + retentionMinutes * 60000
  ).toISOString();

  // ① メッセージ一覧に追加 ＋ WebSocket 送信
  setMessages((prev) => {
    const newId = prev.length ? prev[prev.length - 1].id + 1 : 1;
    const newMsg: ChatMessage = {
      id: newId,
      from: "own",
      text: trimmed,
      time,
      createdAt: now.toISOString(),
      expiresAt,
    };

    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(
        JSON.stringify({
          type: "chat",
          text: trimmed,
          time,
          createdAt: newMsg.createdAt,
          expiresAt: newMsg.expiresAt,
        })
      );
    }

    return [...prev, newMsg];
  });

  // ② ユーザー一覧（contacts）の lastMessage / lastTime を更新
  //    今開いている相手（currentContact）に対して反映させる
  if (currentContact) {
    setContacts((prev) =>
      prev.map((c) =>
        c.id === currentContact.id
          ? { ...c, lastMessage: trimmed, lastTime: time }
          : c
      )
    );
  }
};


  // ファイル送信
  const handleSendFile = (fileName: string, fileUrl: string) => {
    const now = new Date();
    const time = now.toLocaleTimeString("ja-JP", {
      hour: "2-digit",
      minute: "2-digit",
    });
    const expiresAt = new Date(
      now.getTime() + retentionMinutes * 60000
    ).toISOString();

    setMessages((prev) => {
      const newId = prev.length ? prev[prev.length - 1].id + 1 : 1;
      const newMsg: ChatMessage = {
        id: newId,
        from: "own",
        text: "",
        fileName,
        fileUrl,
        time,
        createdAt: now.toISOString(),
        expiresAt,
      };
      return [...prev, newMsg];
    });
  };

  // 有効期限内メッセージのみ表示
  const visibleMessages = messages.filter(
    (m) => new Date(m.expiresAt).getTime() > Date.now()
  );

  // 秘密BOXへ保存
  const handleSaveToSecretBox = (content: string) => {
    const trimmed = content.trim();
    if (!trimmed) return;

    const now = new Date();
    setSecretItems((prev) => [
      ...prev,
      {
        id: now.getTime().toString(),
        type: detectType(trimmed),
        content: trimmed,
        createdAt: now.toISOString(),
      },
    ]);
  };

  return (
    <div className="app-root">
      <audio ref={remoteAudioRef} autoPlay />

      <div className="app-frame">
        {view === "userList" && (
  <UserListPage
    userName={userName}
    contacts={contacts}
    onSelectContact={(c) => {
      setCurrentContact(c);
      setView("chat");
    }}
    onOpenSettings={() => setView("settings")}
    // ★ 追加：友だち追加ページを開く
    onOpenInvite={() => setView("invite")}
    // ★ 追加：削除
    onDeleteContact={handleDeleteContact}
    // 共有IDまわりは InvitePage に移すので渡さなくてOK
  />
)}


        {view === "chat" && (
          <ChatScreen
            userName={currentContact?.name ?? userName}
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
            inCall={inCall}
            onToggleCall={() => (inCall ? endCall() : startCall())}
            onOpenSettings={() => setView("settings")}
            onBack={() => setView("userList")}
          />
        )}

        {view === "secret" && (
          <SecretBoxPage
            items={secretItems}
            onBack={() => setView("chat")}
          />
        )}

        {view === "settings" && (
          <SettingsPage
            theme={theme}
            onChangeTheme={setTheme}
            fontSize={fontSize}
            onChangeFontSize={setFontSize}
            retentionMinutes={retentionMinutes}
            onChangeRetention={setRetentionMinutes}
            onBack={() => setView("chat")}
            onNavigateSecret={() => setView("secret")}
            userName={userName}
            onChangeUserName={setUserName}
          />
        )}
      </div>
    </div>
  );
}

export default App;


