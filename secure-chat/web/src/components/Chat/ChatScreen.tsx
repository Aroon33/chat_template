import { useState } from "react";
import type { FormEvent, ChangeEvent } from "react";


import ChatHeader from "./ChatHeader";
import ChatMessage from "./ChatMessage";

type Message = {
  id: number;
  from: "own" | "other";
  text: string;
  time: string;
  isPhoto?: boolean;
  fileUrl?: string;
  fileName?: string;
};

type ChatScreenProps = {
  messages: Message[];
  onSend: (text: string) => void;
  onSendFile: (fileName: string, fileUrl: string) => void;
  onSaveToSecretBox: (content: string) => void;
  retentionMinutes: number;
  onChangeRetentionMinutes: (m: number) => void;
  secretCount: number;
  shareId: string | null;
  shareExpiresAt: string | null;
  onGenerateShareId: () => void;
  onPairByCode: (code: string) => void;
};

function ChatScreen({
  messages,
  onSend,
  onSendFile,
  onSaveToSecretBox,
  retentionMinutes,
  onChangeRetentionMinutes,
  secretCount,
  shareId,
  shareExpiresAt,
  onGenerateShareId,
  onPairByCode,
}: ChatScreenProps) {
  const [input, setInput] = useState("");
  const [longPressTarget, setLongPressTarget] =
    useState<Message | null>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSend(input);
    setInput("");
  };

  const handleSaveToSecretBoxClick = () => {
    if (!longPressTarget) return;
    const content =
      longPressTarget.text || longPressTarget.fileName || "";
    if (!content) return;
    onSaveToSecretBox(content);
    setLongPressTarget(null);
  };

  // ＋ボタンからファイル選択 → 親(App)へ通知
  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    onSendFile(file.name, url);
    e.target.value = "";
  };

  return (
    <section className="chat-screen">
      <ChatHeader
        name="BlueFox"
        status="オンライン"
        shareId={shareId}
        shareExpiresAt={shareExpiresAt}
        onGenerateShareId={onGenerateShareId}
        onPairByCode={onPairByCode}
      />

      {/* 自動削除設定バー */}
      <div className="retention-bar">
        <span>自動削除:</span>
        <select
          value={retentionMinutes}
          onChange={(e) =>
            onChangeRetentionMinutes(Number(e.target.value))
          }
        >
          <option value={60}>1時間</option>
          <option value={360}>6時間</option>
          <option value={720}>12時間</option>
          <option value={1440}>1日</option>
        </select>
      </div>

      {secretCount > 0 && (
        <div className="saved-indicator">
          秘密保存: {secretCount} 件
        </div>
      )}

      <div className="message-list">
        <div className="date-divider">今日</div>

        {messages.map((m) => (
          <ChatMessage
            key={m.id}
            from={m.from}
            text={m.text}
            time={m.time}
            isPhoto={m.isPhoto}
            fileUrl={m.fileUrl}
            fileName={m.fileName}
            onLongPress={() => setLongPressTarget(m)}
          />
        ))}
      </div>

      <footer className="chat-input-bar">
        {/* 添付ボタン ＋ 隠し input */}
        <button
          className="round-btn attach-btn"
          onClick={() =>
            document.getElementById("file-input")?.click()
          }
        >
          ＋
        </button>
        <input
          id="file-input"
          type="file"
          accept="image/*,application/pdf"
          style={{ display: "none" }}
          onChange={handleFileSelect}
        />

        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flex: 1, gap: 6 }}
        >
          <input
            className="chat-input"
            type="text"
            placeholder="メッセージを入力…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button className="round-btn send-btn" type="submit">
            ↑
          </button>
        </form>
      </footer>

      {longPressTarget && (
        <div className="longpress-menu">
          <button onClick={handleSaveToSecretBoxClick}>
            秘密保存ボックスに保存
          </button>
          <button onClick={() => setLongPressTarget(null)}>
            キャンセル
          </button>
        </div>
      )}
    </section>
  );
}

export default ChatScreen;

