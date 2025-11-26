import { useState } from "react";

type Tab = "messages" | "links" | "files";

type SecretItem = {
  id: string;
  type: "message" | "link" | "file";
  content: string;
  createdAt: string;
};

type SecretBoxPageProps = {
  items: SecretItem[];
  onBack: () => void; // ← 必須
};

function SecretBoxPage({ items, onBack }: SecretBoxPageProps) {   // ← 修正ポイント
  const [tab, setTab] = useState<Tab>("messages");

  const messages = items.filter((i) => i.type === "message");
  const links = items.filter((i) => i.type === "link");
  const files = items.filter((i) => i.type === "file");

  const currentItems =
    tab === "messages" ? messages : tab === "links" ? links : files;

  const tabLabel = {
    messages: "メッセージ",
    links: "リンク",
    files: "ファイル",
  }[tab];

  return (
    <div className="secret-box-page">
      <header className="sb-header">

        {/* ← 戻るボタンを追加（重要） */}
        <button className="sb-back-btn" onClick={onBack}>
          ← 戻る
        </button>

        <div className="sb-title">秘密保存ボックス</div>
        <div className="sb-subtitle">端末には残さない一時保存エリア</div>
      </header>

      <div className="sb-tabs">
        <button
          className={tab === "messages" ? "active" : ""}
          onClick={() => setTab("messages")}
        >
          メッセージ
        </button>
        <button
          className={tab === "links" ? "active" : ""}
          onClick={() => setTab("links")}
        >
          リンク
        </button>
        <button
          className={tab === "files" ? "active" : ""}
          onClick={() => setTab("files")}
        >
          ファイル
        </button>
      </div>

      <div className="sb-current-label">{tabLabel}一覧</div>

      <div className="sb-content">
        {currentItems.length === 0 && (
          <div className="sb-empty">
            まだ{tabLabel}は保存されていません。
            <br />
            チャットから「秘密BOXへ保存」で追加されます。
          </div>
        )}

        {currentItems.map((item) => (
          <div key={item.id} className="sb-item">
            <div className="sb-item-main">{item.content}</div>
            <div className="sb-item-meta">作成日時: {item.createdAt}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default SecretBoxPage;
