// src/pages/InvitePage.tsx
import { useState } from "react";
import "../styles/settings.css";

type InvitePageProps = {
  shareId: string | null;
  shareExpiresAt: string | null;
  onGenerateShareId: () => void;
  onPairByCode: (code: string) => void;
  onBack: () => void;
};

export default function InvitePage({
  shareId,
  shareExpiresAt,
  onGenerateShareId,
  onPairByCode,
  onBack,
}: InvitePageProps) {
  const [code, setCode] = useState("");

  let expiresText = "";
  if (shareId && shareExpiresAt) {
    const d = new Date(shareExpiresAt);
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    expiresText = `有効期限: ${hh}:${mm}`;
  }

  const handlePair = () => {
    const trimmed = code.trim();
    if (!trimmed) return;
    onPairByCode(trimmed);
    setCode("");
  };

  return (
    <div className="settings-page">
      <div className="settings-header">
        <button onClick={onBack}>← 戻る</button>
        <span style={{ marginLeft: 8 }}>友だち追加</span>
      </div>

      <div className="settings-section">
        <h3>共有IDを使って友だち追加</h3>

        <p className="userlist-description">
          共有IDを発行して相手に伝えるか、
          相手から共有されたIDを入力してください。
        </p>

        <button
          className="primary-btn"
          style={{ marginBottom: 12 }}
          onClick={onGenerateShareId}
        >
          🔵 共有ID発行
        </button>

        {shareId && (
          <div className="userlist-shareinfo">
            <div>あなたの共有ID: {shareId}</div>
            {expiresText && (
              <div className="userlist-shareinfo-exp">{expiresText}</div>
            )}
          </div>
        )}

        <div style={{ marginTop: 24 }}>
          <label style={{ fontSize: 13 }}>
            友だちの共有ID
            <input
              type="text"
              maxLength={5}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="例: 12345"
              style={{ display: "block", marginTop: 4, width: "100%" }}
            />
          </label>
          <button
            className="secondary-btn"
            style={{ marginTop: 8 }}
            onClick={handlePair}
          >
            ID入力
          </button>
        </div>
      </div>
    </div>
  );
}
