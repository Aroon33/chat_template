import { useState } from "react";
import type { ChangeEvent } from "react";

type ChatHeaderProps = {
  name: string;
  status?: string;
  shareId?: string | null;
  shareExpiresAt?: string | null;
  onGenerateShareId?: () => void;
  onPairByCode?: (code: string) => void;
};

function ChatHeader({
  name,
  status,
  shareId,
  shareExpiresAt,
  onGenerateShareId,
  onPairByCode,
}: ChatHeaderProps) {
  const [showPairInput, setShowPairInput] = useState(false);
  const [pairCode, setPairCode] = useState("");

  const now = new Date();
  const expires =
    shareId && shareExpiresAt ? new Date(shareExpiresAt) : null;
  const isActive = expires ? expires.getTime() > now.getTime() : false;

  let shareLabel = "";
  if (shareId && expires) {
    const hh = expires.getHours().toString().padStart(2, "0");
    const mm = expires.getMinutes().toString().padStart(2, "0");
    shareLabel = isActive
      ? `共有ID: ${shareId}（〜${hh}:${mm}）`
      : "共有ID: 期限切れ";
  }

  const handlePairSubmit = () => {
    if (onPairByCode) {
      onPairByCode(pairCode);
    }
  };

  const handlePairInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    // 数字のみ・5桁まで
    const v = e.target.value.replace(/[^0-9]/g, "").slice(0, 5);
    setPairCode(v);
  };

  return (
    <header className="chat-header">
      <button className="back-btn">←</button>

      <div className="chat-header-info">
        <div className="chat-name">{name}</div>
        {status && <div className="chat-status">{status}</div>}
        {shareLabel && (
          <div className="share-id-label">{shareLabel}</div>
        )}
      </div>

      <div className="chat-header-actions">
        {onGenerateShareId && (
          <button
            className="share-id-btn"
            onClick={onGenerateShareId}
            disabled={!!shareId && isActive}
          >
            {isActive ? "共有ID発行中" : "共有ID発行"}
          </button>
        )}

        {onPairByCode && (
          <button
            className="share-id-btn"
            onClick={() => setShowPairInput((v) => !v)}
          >
            ID入力
          </button>
        )}

        <button className="icon-btn" aria-label="Call">
          📞
        </button>
        <button className="icon-btn" aria-label="Menu">
          ⋮
        </button>
      </div>

      {showPairInput && (
        <div className="pair-box">
          <input
            type="text"
            className="pair-input"
            placeholder="5桁のID"
            value={pairCode}
            onChange={handlePairInputChange}
          />
          <button className="pair-submit" onClick={handlePairSubmit}>
            接続
          </button>
        </div>
      )}
    </header>
  );
}

export default ChatHeader;

