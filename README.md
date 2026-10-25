# Trio

3色の配色から、ポスター・バナー・Webサイト・SNS のデザインイメージを探せるモバイルファーストのWebアプリです。

## できること

| 画面 | 内容 |
| --- | --- |
| 探す | 63種のキュレーション配色を、14スタイル（カジュアル／かわいい／モダン／ポップ／エレガント／ナチュラル／レトロ／クール／ミニマル／和モダン／ストリート／テック／ラグジュアリー／フレッシュ）× 4媒体で一覧。キーワード・色名・HEX検索 |
| 配色詳細 | カラー名とHEX（タップでコピー）、ベース70／メイン25／アクセント5 の役割バー（入れ替え可）、媒体スワイプ、同じ配色を全スタイルで見比べ、近い配色 |
| 色から | 任意の3色を入力 → 相性のいいスタイルを判定してモックアップを即時描画。AI分析（印象・用途・使いこなしのコツ） |
| イメージから | 作りたいイメージを文章＋スタイルで入力 → AIが3案の配色を提案し、そのままモックアップで確認。ライブラリからの近い配色も表示 |
| AIイメージ生成 | 配色とスタイルからデザインイメージ画像を生成 |
| 保存 | 配色の保存・削除（Googleログイン） |

ゲストでも閲覧・入力・モックアップ確認はすべて使えます。保存とAI機能はGoogleログインが必要です（AIは1ユーザーあたり1日 テキスト40回・画像15回まで）。

## 技術スタックと選定理由

| 技術 | 用途 | 選定理由 |
| --- | --- | --- |
| **Cloudflare Workers + Static Assets** | ホスティング・API | フロントとAPIを1つのWorkerで配信でき、デプロイが1コマンド。エッジ配信で国内からも速い。SPAフォールバックが設定だけで有効になる。無料枠が大きい |
| **Hono** | APIルーティング | Workers向けに作られた軽量フレームワーク。型が効き、ミドルウェア（認証・CSRF対策）が簡潔に書ける |
| **Cloudflare D1** | ユーザー・セッション・保存・AI利用回数 | Workersからバインディングで直接使えるSQLite。保存データはリレーショナル（ユーザー↔保存）なのでKVよりD1が適している |
| **Workers AI: Llama 3.3 70B (fp8-fast)** | 配色分析・イメージ→配色提案 | JSON Schemaモードで構造化出力が安定し、日本語の応答品質と速度（6〜8秒）のバランスが良い。Qwen 3.8 27B も試したが JSON モードで応答形式が合わず不採用 |
| **Workers AI: FLUX.1 [schnell]** | デザインイメージ画像生成 | 約2秒で生成でき、待ち時間が短い。リクエストがシンプルで扱いやすい |
| **Google OAuth 2.0 / OpenID Connect（自前実装）** | ログイン | Googleのみなので Auth.js や Clerk 等の外部サービスは不要。Authorization Code + PKCE + state で実装し、セッショントークンはSHA-256ハッシュでD1に保存、Cookie は HttpOnly / Secure / SameSite=Lax |
| **React 19 + Vite 8 + @cloudflare/vite-plugin** | フロントエンド・開発環境 | 開発サーバー上でWorkerを本番と同じ workerd ランタイムで動かせるため、ローカルと本番の差が出にくい。SSRは不要なのでNext.js等は使わずSPAで軽量に |
| **Motion (Framer Motion)** | アニメーション | スプリング、共有レイアウト（`layoutId`）、スワイプ（drag）、`AnimatePresence` による出入りアニメーションを宣言的に書ける。`prefers-reduced-motion` にも追従 |
| **React Router 7** | ルーティング | 絞り込み・媒体・配色をURLに保持でき、共有や戻る操作で状態が復元される |
| **素のCSS（Tailwind不使用）** | リキッドグラスUI・モックアップ | `backdrop-filter`・マスクによる縁の光沢・SVGディスプレイスメントフィルタなど、リキッドグラス表現は細かい独自CSSが中心になるため。モックアップはコンテナクエリ単位（`cqw`）で描き、どのサイズでも同じ比率で縮尺される |
| **モックアップはHTML/CSS/SVGで描画** | 配色→デザインイメージ | 画像を用意する方式と違い、任意の3色を入力した瞬間に全スタイル×全媒体を描き直せる。色の変化もCSSトランジションで滑らかに見せられる |
| **Playwright** | E2Eテスト | 実ブラウザ（Chromium）でモバイル・デスクトップ両方を自動操作して検証できる |

## 構成

```
src/            フロントエンド（React）
  data/         キュレーション配色（palettes.ts）とスタイル定義（tastes.ts）
  lib/          色計算（役割判定・コントラスト・Lab色差）、スタイル推定、APIクライアント
  components/   リキッドグラスUI、スケルトン、モックアップ（mockups/）
  pages/        探す・配色詳細・色から・イメージから・保存
worker/         Cloudflare Worker（Hono）: 認証・保存API・Workers AI
migrations/     D1スキーマ
tests/          Playwright E2E
```

## セットアップ

```bash
npm install
npx wrangler login
npx wrangler d1 create trio-palette-db   # 表示された database_id を wrangler.jsonc に設定
```

### Google ログインの設定

1. [Google Cloud Console](https://console.cloud.google.com/apis/credentials) で「OAuth クライアント ID（ウェブアプリケーション）」を作成
2. 承認済みのリダイレクト URI に以下を追加
   - `https://<あなたのWorker>.workers.dev/auth/google/callback`
   - `http://localhost:5199/auth/google/callback`（ローカル用）
3. クライアントIDを `wrangler.jsonc` の `vars.GOOGLE_CLIENT_ID` に設定
4. クライアントシークレットを登録

```bash
npx wrangler secret put GOOGLE_CLIENT_SECRET
```

ローカルでGoogleログインを使う場合は `.dev.vars` に `GOOGLE_CLIENT_SECRET=...` を追記します。

## 開発

```bash
npm run db:migrate:local
npm run dev        # http://localhost:5199
```

Windows でプロジェクトのパスが長い場合、ローカルD1の保存先がパス長制限に掛かることがあります。その場合は `WRANGLER_STATE` に短いパスを指定してください（例: `WRANGLER_STATE=C:/tmp/trio npm run dev`、マイグレーションは `--persist-to C:/tmp/trio`）。

## テスト

`.dev.vars` に `DEV_LOGIN=1` を書くと、localhost でのみ有効なテスト用ログイン（`/auth/dev-login`）が使え、保存・AI機能までE2Eで検証できます（本番では常に404）。

```bash
npx playwright install chromium
npm test                                         # ローカル（ゲスト＋ログイン済み）
BASE_URL=https://<あなたのWorker>.workers.dev npm test   # 本番（ゲスト・API保護・OAuth開始）
```

## デプロイ

```bash
npm run db:migrate:remote
npm run deploy
```
