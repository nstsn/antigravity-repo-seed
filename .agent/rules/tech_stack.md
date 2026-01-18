# Tech Stack & Engineering Rules

## 対象
- Chrome 拡張（Manifest V3）
- 対応サイト：ChatGPT / Gemini（最初は2サイト、将来拡張可能な構造）

## 推奨スタック（デフォルト）
- 言語：TypeScript
- ビルド：Vite（Chrome拡張向け構成）
- UI：React + Tailwind（Side PanelのUIを素早く安定して作るため）
  - ただし、依存を減らしたい場合は「Vanilla + CSS」でも可（選択はImplementation Planで明記）
- Lint/Format：ESLint + Prettier
- テスト：
  - 単体：Vitest（文字類似度・タグ選定・タイトル整形）
  - 任意：Playwright（拡張読み込みのE2Eは余力があれば）

## 禁止事項
- Manifest V2は禁止（MV3のみ）
- 外部のAI APIを使ったタグ自動生成は禁止（無際限生成を防ぐため）
- リネーム対象の会話データ・内容を外部送信する実装は禁止（解析/ログ送信/トラッキング含む）
- DOMセレクタでクラス名に強く依存する実装は禁止（変更に弱い）
  - 可能な限り `aria-*`, `role`, `data-testid`, 可視テキスト を優先し、複数候補で冗長化する

## 主要コンポーネント責務（推奨アーキテクチャ）
- background/service worker：
  - 権限の境界、タブ/ショートカット処理、ストレージ統括
- side panel：
  - 画面UI（プレビュー/タグ選択/検索/ジャンプ/Undo）
- content scripts：
  - ページ上DOM操作（リネーム実行、現在スレッド識別）
- adapters（サイト別）：
  - ChatGPTAdapter / GeminiAdapter のように分離し、DOM変更の影響範囲を局所化

## データ方針（最低限）
- 検索対象：拡張で「リネーム成功」したスレッドのみをインデックス化
- 保存：chrome.storage（sync/localはImplementation Planで選択）
- 保存するキー：
  - url, service, title, prevTitle, datePrefix, tags[], renamedAt, lastOpenedAt（任意）

## UX方針（実装ルール）
- リネームは「1アクション」を目指す：
  - サイドパネルを開く → 本文入力 → タグ選択（任意）→ 実行
- 安全装置は必須：
  - 変更前/変更後の表示、プレビュー、Undo、失敗理由の明示
- タグはユーザ登録リストからのみ選ぶ：
  - 自動“確定”は最大1つ、複数はユーザ操作で追加
  - 最大タグ数：3（デフォルト）
