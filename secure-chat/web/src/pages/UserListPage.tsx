// src/pages/UserListPage.tsx

import "../styles/settings.css";

type Contact = {
  id: string;      // 共有IDなど識別子
  name: string;    // 表示名
  lastMessage?: string;
  lastTime?: string;
};

type UserListPageProps = {
  userName: string;

  contacts: Contact[];
  onSelectContact: (contact: Contact) => void;

  onOpenSettings: () => void;
  onOpenInvite: () => void;              // 「友だち追加」ページへ
  onDeleteContact: (id: string) => void; // ユーザー削除
};

export default function UserListPage({
  userName,
  contacts,
  onSelectContact,
  onOpenSettings,
  onOpenInvite,
  onDeleteContact,
}: UserListPageProps) {
  return (
    <div className="userlist-root">
      {/* ヘッダー：自分の名前＋設定 */}
      <header className="userlist-header">
        <div className="userlist-header-left">
          <div className="userlist-avatar">
            {userName.charAt(0).toUpperCase()}
          </div>
          <div className="userlist-myinfo">
            <div className="userlist-myname">{userName}</div>
            <div className="userlist-mystatus">オンライン</div>
          </div>
        </div>
        <button className="userlist-settings-btn" onClick={onOpenSettings}>
          ⚙️
        </button>
      </header>

      <main className="userlist-main">
        <section className="userlist-section">
          <div className="userlist-section-header">
            <h3>ユーザー一覧</h3>
            {/* 友だち追加 → InvitePage へ */}
            <button
              className="primary-btn"
              style={{ padding: "4px 8px", fontSize: 12 }}
              onClick={onOpenInvite}
            >
              ＋ 友だち追加
            </button>
          </div>

          {contacts.length === 0 ? (
            // 友だち 0 人のとき
            <div className="userlist-empty">
              <p>まだ友だちがいません 👥</p>
              <p className="userlist-description">
                「＋ 友だち追加」から共有IDを使って登録してください。
              </p>
            </div>
          ) : (
            <div className="userlist-friend-list">
              {contacts.map((c) => (
                <div key={c.id} className="friend-item-row">
                  {/* 一覧でタップするとチャットへ */}
                  <button
                    onClick={() => onSelectContact(c)}
                    className="friend-item"
                  >
                    <div className="friend-avatar">
                      {c.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="friend-info">
                      <div className="friend-topline">
                        <span className="friend-name">{c.name}</span>
                        {c.lastTime && (
                          <span className="friend-lasttime">
                            {c.lastTime}
                          </span>
                        )}
                      </div>
                      {c.lastMessage ? (
                        <div className="friend-lastmsg">
                          {c.lastMessage}
                        </div>
                      ) : (
                        <div className="friend-lastmsg friend-lastmsg-empty">
                          メッセージはまだありません
                        </div>
                      )}
                    </div>
                  </button>

                  {/* 削除ボタン */}
                  <button
                    className="friend-delete-btn"
                    onClick={() => {
                      if (
                        window.confirm(
                          `${c.name} をユーザー一覧から削除しますか？`
                        )
                      ) {
                        onDeleteContact(c.id);
                      }
                    }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

