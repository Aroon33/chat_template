chat-template

# チャットアプリ プロジェクト仕様書（移行用）

## 1. プロジェクト概要

- 種別：1対1チャットアプリ（LINEの「招待コード」方式）
- フロントエンド：React + Vite
- バックエンド：Node.js + WebSocket（シグナリングサーバー）
- インフラ：Nginx + PM2 で Node サーバー常駐
- ドメイン例：chat-template.net（※実際の環境に合わせて読み替え）

---

## 2. 技術スタック / 構成

### フロント（ブラウザ）

- React (Vite)
- WebSocket クライアント接続
- localStorage による簡易永続化

### バックエンド

- Node.js / TypeScript or JavaScript
- WebSocket サーバー
- 役割：
  - 共有ID発行 / 検証 API  
    - `POST /api/share/create`（5桁コード発行・有効期限 5分）
    - `POST /api/share/verify`（コード照合）
  - WebSocket エンドポイント  
    - `GET /ws?room=XXXX`（room ごとに参加ユーザーを管理し、メッセージを中継）

### 配置・PM2

- シグナリングサーバー本体：
  - `/var/www/chat-template.net/signaling/dist/server.js`
- PM2 で常駐起動済み  
  → SSH 後に `pm2 status` で確認可能。

---

## 3. 主要機能（現状）

### 3-1. ユーザー名（表示名）

- 初回起動時にランダム生成（例：`BlueWolf805`）
- 値は `localStorage` に保存
- ブラウザをリロードしても同じ名前を使用
- 設定画面からユーザー名の変更が可能

保存キー：
- `app_user_name` … 表示名

---

### 3-2. 友だち追加（共有ID招待方式）

1. 発行側：  
   「共有ID発行」ボタン → 5桁の招待コードを生成  
   - 有効期限：5分  
   - 発行者は「待機状態」のまま（すぐにチャット画面へは遷移しない）

2. 招待される側：  
   別ブラウザ / 別端末で「友だちの共有ID入力」欄にコードを入力

3. バックエンド：
   - `/api/share/verify` でコード検証
   - OKなら両者を同じ WebSocket ルーム（`room=XXXX`）に参加させる

4. ペアリング成立（joined メッセージ）：
   - 入力側が WebSocket で  
     ```json
     {
       "type": "joined",
       "displayName": "<自分のユーザー名>"
     }
     ```
     を送信
   - 発行側がそれを受信すると：
     - `friends` に新しい友だちを追加
     - `currentContact` を設定
     - 自動でチャット画面へ遷移
     - 相手の名前として `displayName` が反映される（「ユーザー1」ではなく本物の名前）

---

### 3-3. チャットメッセージ

- 送信時：
  - 自分側：入力欄から送信 → WebSocket で  
    `{"type":"chat","text":"...","createdAt":"...","from":"self"}` のような形式で送信
- 受信側：
  - WebSocket から `type:"chat"` を受信
  - `from:"other"` としてメッセージ一覧に追加
- 表示：
  - 自分：青い吹き出し
  - 相手：灰色の吹き出し

---

## 4. データ保存（現状）

すべてブラウザの `localStorage` ベース。

| キー名           | 内容                              |
| ---------------- | --------------------------------- |
| `app_user_name`  | 自分の表示名                     |
| `app_contacts`   | 友だち一覧（Contact[]）          |
| `app_messages`   | メッセージ履歴（現状は1ルーム想定） |

※ 将来は DB によるサーバー永続化に移行予定。

---

## 5. 画面構成 / UIフロー

### 5-1. UserListPage（ユーザー一覧）

- 友だち一覧表示（今後「LINE / Messenger 風」に改善予定）
- 機能：
  - 「共有ID発行」ボタン → 招待コードの表示
  - 「ID入力」 → 招待された側の友だち追加
  - 「設定」 → `SettingsPage` へ遷移

### 5-2. ChatScreen（1対1チャット画面）

- 構成：
  - ヘッダー：
    - 戻るボタン
    - 相手ユーザー名の表示
    - 通話ボタン（将来の音声通話用）
    - 設定ボタン
  - メッセージリスト：
    - 自分 / 相手の吹き出し
    - 日付ラベル（改善余地あり）
  - フッター：
    - メッセージ入力欄
    - ＋ボタン（将来の画像/ファイル送信）
    - カメラボタン（将来のカメラ送信）

### 5-3. その他画面

- `SecretBoxPage` : 将来リファイン予定の画面
- `SettingsPage` :
  - テーマ（ライト/ダーク）など将来拡張
  - フォント設定（予定）
  - ユーザー名変更

---

## 6. 動作確認済みの内容

- 2つのブラウザ間でリアルタイム双方向チャットが成功
- 「発行者」「入力者」どちら側にもチャット画面が正しく反映
- `joined` 処理により、相手の `displayName` が正しく反映される
- WebSocket rooms が正しく動作し、room ごとに中継
- シグナリングサーバーは PM2 管理で落ちずに稼働

---

## 7. 今後の開発タスク（やりたいこと）

### A. ユーザー一覧 UI の改善（最優先）

- 一覧の見た目を LINE / Messenger 風にする
- 表示名を「ユーザー + 数字」ではなく、本当の `displayName` で表示
- 最終メッセージのプレビュー表示
- 最終メッセージ時刻の表示
- 未読バッジ
- 並び順を「最新メッセージがあった順」にソート

### B. ChatScreen UI の仕上げ

- 吹き出しデザイン（角丸・色・余白など）の調整
- 送信時に自動スクロールで最下部へ
- 画像・ファイル送信時のプレビュー UI
- 日付ラベルのデザイン、区切りの改善

### C. ユーザー情報のサーバー側永続化

- 現在：localStorage ベース
- 追加予定 API 例：
  - `POST /api/auth/register`
  - `POST /api/auth/login`
  - `GET /api/me`
- DB にユーザー・友だち・メッセージを保存する構成へ移行

### D. 複数友だち対応のメッセージ保存

- 現状：`messages[]` が「単一ルーム」想定
- 変更案：  
  `messagesByContact: Record<contactId, ChatMessage[]>` のような構造に変更し、
  友だちごとに独立した履歴を保持する。

### E. モバイルアプリ化（iOS など）

- Capacitor でネイティブラップ
- WebView でこの React アプリを表示
- プッシュ通知
- ネイティブ通話機能連携 など

---

## 8. この仕様書の使い方（次のチャット用）

新しいチャットを始めるときは、まずこの仕様書を貼り付けてから、続けてやりたいことを伝えてください。  
例：

- 「ユーザー一覧の UI を LINE 風にしたいので、`UserListPage.tsx` のコード例をください」
- 「相手の名前をユーザー名（displayName）で表示する実装を一緒に直してほしい」
- 「メッセンジャー風のユーザー一覧コンポーネントを React で作ってください」
- 「WebSocket 受信部分（joined / chat）の `useEffect` の書き方を見直したいです」

この仕様書を渡せば、別セッションのアシスタントでもすぐに状況を理解できます。



📘 Chat-Template 開発サーバー構成まとめ（Markdown版）
🚀 全体アーキテクチャ
┌──────────────────────┐
│   ブラウザ（ユーザー）│
└──────────┬─────────┘
           │ HTTPS / WSS
┌──────────▼──────────┐
│            Nginx            │ ← フロントの静的配信 ＋ WS リバースプロキシ
└──────────┬──────────┘
      ┌─────▼──────┐
      │ Vite (dist) │ ← React 本番ビルド
      └───────────┘
      ┌───────────┐
      │ Node.js WS │ ← PM2常駐 WebSocket サーバー
      └───────────┘

📂 1. ディレクトリ構成（あなたのサーバーの実際の状態）
/var/www/chat-template.net/
├── secure-chat/
│   └── web/
│       ├── src/                 ← React + Vite の開発用ソース
│       │   ├── App.tsx
│       │   ├── components/
│       │   └── pages/
│       │       ├── UserListPage.tsx
│       │       ├── InvitePage.tsx
│       │       ├── SettingsPage.tsx
│       │       ├── SecretBoxPage.tsx
│       │       └── ChatPage.tsx
│       ├── dist/                ← 本番用ビルドファイル
│       ├── index.html
│       └── package.json
│
└── signaling/
    ├── src/server.ts            ← WebSocket（Signaling サーバー）
    └── dist/server.js           ← PM2 が動かしている実行ファイル

🧩 2. 使用している主要ツールの役割
🔵 Node.js（ノード）

JavaScript をサーバーで動かすエンジン

WebSocket サーバー（server.js）を動かすために必要

バックエンドの中核

主なコマンド
node -v
which node

🟣 npm（エヌピーエム）

Node.js 用のパッケージ管理ツール

React や Vite、WS ライブラリを管理

package.json に沿って依存関係をインストール

主なコマンド
npm install
npm run dev
npm run build

🟢 PM2

Node.js アプリを「落ちないように」常駐させるツール

WebSocket サーバー(server.js)を動かしているのは PM2

主なコマンド
pm2 start dist/server.js --name signaling
pm2 restart signaling
pm2 stop signaling
pm2 logs signaling
pm2 status

🟡 Vite（ビート）

React の開発サーバー & 本番ビルドツール

超高速でホットリロード

本番用 dist を生成

主なコマンド
npm run dev    # 開発モード（5173）
npm run build  # 本番 dist 出力

🟤 Nginx

Webアプリの入口（フロントとWebSocketの仲介）

本番サイトは Nginx → dist を返すため
「ローカルIP（npm run dev）」と UI が違って見える

🌈 3. 開発環境と本番環境の違い（UI が違う理由）
🔹 開発

URL：

http://[サーバーIP]:5173/


Vite の開発サーバー

最新の React コードがそのまま反映される

テーマなど localStorage が “別オリジン” として保存 → 見た目が違うことがある

🔹 本番

URL：

https://chat-template.net


Nginx が dist フォルダを返す

古い dist のまま → UI が違う

🔧 本番を更新したい場合
cd /var/www/chat-template.net/secure-chat/web
npm run build


その後、Nginx が新しい dist を読むので UI が更新される。

🧰 4. ほかのプロジェクトでも同じ環境にしたい時のポイント
✔ Node.js のバージョンを統一（nvm を推奨）

例：

node -v    # バージョン確認


プロジェクトごとに Node を変えると不具合の元になるので
基本は 同じ Node.js バージョン を使う。

✔ プロジェクト構成を統一

例：

/var/www/my-new-app/
  ├── web/      ← React + Vite
  └── api/      ← Node.js (PM2で管理)

✔ npm scripts を統一する

各プロジェクトの package.json は同じ構成がよい：

{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  }
}

✔ PM2 は本番バックエンド専用

Vite dev 用には使わず、
Node.js バックエンドだけを PM2 常駐させる。

✔ ポート衝突に注意

Vite → 5173

API → 3000, 4000 など固定

WebSocket → 4000（あなたの環境）

🧭 5. 不具合が出た時にチェックすべきポイント3つ
1️⃣ Node のバージョン
node -v

2️⃣ PM2 の状態
pm2 status
pm2 logs

3️⃣ ポート衝突
lsof -i:5173

🎯 6. この構成を別プロジェクトでも再利用する場合

以下のテンプレ構造を作るのが最も安定します👇

/var/www/your-app/
├── web/            ← React + Vite（npm run dev / build）
│   ├── src/
│   ├── dist/
│   └── package.json
└── api/            ← Node.js + PM2
    ├── src/server.ts
    ├── dist/server.js
    └── package.json

📝 7. もし次にやりたいことがあれば…

Nginx の設定ファイルを確認したい

本番側 dist が最新になるよう自動デプロイしたい

ほかのアプリも同じ構成にそろえたい

PM2 / Node / Nginx の整理を一緒にやりたい

サーバーを安全に運用するための設定をまとめたい

どれでも大歓迎です！
