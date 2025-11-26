import "./../styles/settings.css";

type SettingsPageProps = {
  theme: "light" | "dark";
  onChangeTheme: (v: "light" | "dark") => void;

  fontSize: number;
  onChangeFontSize: (v: number) => void;

  retentionMinutes: number;
  onChangeRetention: (v: number) => void;

  onBack: () => void;
  onNavigateSecret: () => void;

  userName: string;
  onChangeUserName: (v: string) => void;
};

export default function SettingsPage({
  theme,
  onChangeTheme,
  fontSize,
  onChangeFontSize,
  retentionMinutes,
  onChangeRetention,
  onBack,
  onNavigateSecret,
  userName,
  onChangeUserName,
}: SettingsPageProps) {
  return (
    <div className="settings-page">
      {/* ヘッダー */}
      <div className="settings-header">
        <button onClick={onBack}>←</button>
        <span>設定</span>
      </div>

      {/* ユーザー名 */}
      <div className="settings-section">
        <h3>ユーザー名</h3>
        <input
          type="text"
          value={userName}
          onChange={(e) => onChangeUserName(e.target.value)}
          placeholder="表示名を入力"
        />
        <p className="settings-caption">
          初回インストール時に自動で設定されます。お好みで変更できます。
        </p>
      </div>

      {/* テーマ */}
      <div className="settings-section">
        <h3>テーマ</h3>
        <button
          className={theme === "light" ? "active" : ""}
          onClick={() => onChangeTheme("light")}
        >
          ライト
        </button>
        <button
          className={theme === "dark" ? "active" : ""}
          onClick={() => onChangeTheme("dark")}
        >
          ダーク
        </button>
      </div>

      {/* フォントサイズ */}
      <div className="settings-section">
        <h3>フォントサイズ</h3>
        <input
          type="range"
          min={12}
          max={24}
          value={fontSize}
          onChange={(e) => onChangeFontSize(Number(e.target.value))}
        />
        <div>{fontSize}px</div>
      </div>

      {/* チャット自動削除 */}
      <div className="settings-section">
        <h3>チャット自動削除</h3>
        <select
          value={retentionMinutes}
          onChange={(e) => onChangeRetention(Number(e.target.value))}
        >
          <option value={10}>10分</option>
          <option value={60}>1時間</option>
          <option value={360}>6時間</option>
          <option value={720}>12時間</option>
          <option value={1440}>1日</option>
        </select>
      </div>

      {/* その他（秘密BOXへ） */}
      <div className="settings-section">
        <h3>その他</h3>
        <button onClick={onNavigateSecret}>秘密BOXを開く</button>
      </div>
    </div>
  );
}


