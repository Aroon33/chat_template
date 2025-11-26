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
  userName: string; // ヘッダーに表示する相手名 or 自分名

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

  inCall: boolean;
  onToggleCall: () => void;

  onOpenSettings: () => void;
  onBack: () => void;
};

function ChatScreen({
  userName,
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
  inCall,
  onToggleCall,
  onOpenSettings,
  onBack,
}: ChatScreenProps) {
  const [input, setInput] = useState("");
  const [longPressTarget, setLongPressTarget] =
    useState<Message | null>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSend(input);
    setInput("");
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    onSendFile(file.name, url);
    e.target.value = "";
  };

  const handleSaveClick = () => {
    if (!longPressTarget) return;
    const content =
      longPressTarget.text || longPressTarget.fileName || "";
    if (!content) return;
    onSaveToSecretBox(content);
    setLongPressTarget(null);
  };

  return (
    <section className="chat-screen">
      {/* ヘッダー */}
      <ChatHeader
        name={userName}
        status="オンライン"
        shareId={shareId}
        shareExpiresAt={shareExpiresAt}
        onGenerateShareId={onGenerateShareId}
        onPairByCode={onPairByCode}
        inCall={inCall}
        onToggleCall={onToggleCall}
        onOpenSettings={onOpenSettings}
        onBack={onBack}
      />

      {/* 自動削除バー */}
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

      {/* 秘密保存インジケーター */}
      {secretCount > 0 && (
        <div className="saved-indicator">秘密保存: {secretCount} 件</div>
      )}

      {/* メッセージ一覧 */}
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

      {/* フッター：＋／入力／カメラ／送信 */}
      <footer className="chat-input-bar">
        {/* 画像追加ボタン */}
        <button
          className="round-btn attach-btn"
          onClick={() => document.getElementById("file-input")?.click()}
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

        {/* 入力フォーム＋カメラ＋送信 */}
        <form
          onSubmit={handleSubmit}
          className="chat-input-form"
        >
          <input
            className="chat-input"
            type="text"
            placeholder="メッセージを入力…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />

          <button
            type="button"
            className="round-btn camera-btn"
            onClick={() => console.log("カメラ起動（あとで実装）")}
          >
            📷
          </button>

          <button className="round-btn send-btn" type="submit">
            ↑
          </button>
        </form>
      </footer>

      {/* 長押しメニュー */}
      {longPressTarget && (
        <div className="longpress-menu">
          <button onClick={handleSaveClick}>秘密保存ボックスに保存</button>
          <button onClick={() => setLongPressTarget(null)}>キャンセル</button>
        </div>
      )}
    </section>
  );
}

export default ChatScreen;






