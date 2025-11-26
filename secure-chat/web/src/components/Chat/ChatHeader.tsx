// src/components/Chat/ChatHeader.tsx
type ChatHeaderProps = {
  name: string;
  status?: string;

  // 既存の props（App/ChatScreen 側を壊さないためにそのまま受け取る）
  shareId?: string | null;
  shareExpiresAt?: string | null;
  onGenerateShareId?: () => void;
  onPairByCode?: (code: string) => void;

  inCall: boolean;
  onToggleCall: () => void;

  onOpenSettings: () => void;

  // 将来「ユーザー一覧に戻る」用に使うかもしれない
  onBack?: () => void;
};

export default function ChatHeader({
  name,
  status = "オンライン",
  inCall,
  onToggleCall,
  onOpenSettings,
  onBack,
}: ChatHeaderProps) {
  const initial = name.charAt(0).toUpperCase();

  return (
    <header className="chat-header">
      {/* 左側：戻る＋アイコン＋名前 */}
      <div className="chat-header-left">
        <button
          className="icon-btn back-btn"
          onClick={onBack}
          disabled={!onBack}
        >
          ←
        </button>

        <div className="avatar-circle">{initial}</div>

        <div className="chat-header-text">
          <div className="chat-header-name">{name}</div>
          <div className="chat-header-status">{status}</div>
        </div>
      </div>

      {/* 右側：通話＋設定 */}
      <div className="chat-header-actions">
        <button
          className={`icon-btn call-btn ${inCall ? "active" : ""}`}
          onClick={onToggleCall}
        >
          📞
        </button>
        <button className="icon-btn settings-btn" onClick={onOpenSettings}>
          ⚙️
        </button>
      </div>
    </header>
  );
}








