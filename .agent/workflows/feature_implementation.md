# Feature Implementation Workflow (Artifacts-first)

## 目的
Antigravityの強み（Artifacts駆動 + 自律探索）を最大化し、勝手実装を防ぐ。

## 手順（必須）
1. Discovery
   - `docs/PRD.md` を読む
   - `docs/DESIGN.md` を読む
   - `.agent/rules/tech_stack.md` と `.agent/rules/vibe_guidelines.md` を確認

2. Artifacts: Implementation Plan（必須）
   - 目的/非目的
   - 変更範囲（どのモジュール/ファイルを作るか）
   - リスク（DOM変更、権限、失敗時挙動）
   - 代替案
   - 受け入れ条件（Acceptance Criteria）
   - 画面/UXの具体

3. Artifacts: Task List（必須）
   - タスクを粒度小さく分割（UI/ストレージ/DOM操作/テスト）
   - 依存関係・順序を明記
   - リリース可能な最小スコープ（MVP）を先に置く

4. ユーザー承認
   - Plan と Task List を提示し、承認が出るまで実装しない

5. 実装
   - 小さく刻んでコミット可能な単位で作る
   - UIはプレビュー・Undo・エラー表示を先に作り、安全側から固める

6. 動作確認（Browser Agent）
   - 対象サイト（ChatGPT/Gemini）で実際に
     - サイドパネル起動
     - リネーム成功
     - 失敗時のメッセージ
     - Undo
     - 検索→ジャンプ
     を確認する

7. 仕上げ
   - 既知の制約と回避策を docs に追記（必要なら）
