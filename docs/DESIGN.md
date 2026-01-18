# Design: Architecture / UX / Data

## 1. 全体アーキテクチャ
### コンポーネント
- Side Panel UI
  - 入力（本文/タグ）
  - プレビュー（旧→新）
  - 実行/Undo
  - 検索/ジャンプ
- Background (Service Worker)
  - ショートカットイベント受け取り
  - タブ情報の取得仲介
  - ストレージI/O
- Content Script
  - DOM操作でリネーム実行
  - 現在スレッドの識別（URL優先）
- Site Adapters
  - ChatGPTAdapter
  - GeminiAdapter

### 責務の分離（重要）
- UIは「ユーザー操作と見た目」だけ
- リネーム手順の知識は Adapter に閉じる
- アルゴリズム（タイトル整形/タグ類似度）は shared に置く

## 2. ディレクトリ設計（推奨）
- src/
  - background/
  - panel/
  - content/
  - adapters/
  - shared/
    - title/
    - tags/
    - storage/

## 3. UI設計（Side Panel）
### 3.1 画面レイアウト（テキストワイヤー）
[Header]
- 対象サイト: ChatGPT / Gemini / 未対応
- 現在スレッド: (取得できればタイトル) / URL（短縮表示）

[Rename Card]
- 日付: 260118_（表示のみ or 設定で編集可）
- 本文: [ input ]
- タグ候補: [ #chrome拡張 ] [ #AI ] [ #仕様策定 ] ...（上位+最近+ピン）
- 選択中: [ #chrome拡張 ] [ #AI ] （最大3、×で外す）
- プレビュー:
  - Before: <旧タイトル>
  - After : 260118_<本文> #tag1 #tag2
- [ リネーム実行 ]（disabled条件: 本文空など）
- 実行後: toast「変更しました」 + [元に戻す]（10秒）

[Search Card]
- タグフィルタ: [#...]（複数選択可/ORかANDはMVPはOR推奨）
- 期間: from [YYMMDD] to [YYMMDD]
- キーワード: [ input ]
- 結果リスト:
  - 260118_... #tag
  - [開く]（同タブ） [新タブ]

### 3.2 状態（State）
- idle / loading / success / error
- errorは「原因（推定）」「再試行手順」を必ず表示

## 4. タイトル生成・整形
### 4.1 生成規則
- prefix = YYMMDD + "_"
- base = userInput（trim、連続空白は1つに）
- tags = selectedTags（0〜3）
- title = prefix + base + (tags.length ? " " + tags.join(" ") : "")

### 4.2 正規化
- 既にprefixがあるタイトルを再編集する場合：
  - 現タイトルから prefix と tags を除去した部分を本文の初期値にする
- prefix重複の自動除去（例：260118_260118_ → 260118_）

## 5. タグ提案（無限生成を防ぎつつ精度を出す）
### 5.1 入力
- baseText（本文）
- userTagList（ユーザ登録タグ、`#`付き想定だが内部では正規化して扱う）

### 5.2 スコアリング（推奨）
- 文字 n-gram（n=2 or 3）で類似度（Jaccard等）
- 追加の重み（任意）：
  - 最近使ったタグに加点
  - ピン留めタグに軽い加点
- 出力：
  - 上位K件（例：5）を候補として表示
  - 自動選択は「1位が閾値以上」なら1件だけ
  - 閾値未満なら自動選択しない（誤爆回避）

### 5.3 制約
- ユーザ登録リスト以外のタグは表示しない
- 最大タグ数：3
- “タグなし” を常に選べる

## 6. ストレージ設計（リネーム済みのみインデックス化）
### 6.1 保存対象
- tags（ユーザ候補リスト）
- renamedThreadsIndex（拡張でリネーム成功したスレッドの一覧）

### 6.2 データモデル（例）
- TagConfig
  - tags: string[]            // ["#chrome拡張", "#AI", ...]
  - pinned: string[]          // optional
  - recent: string[]          // optional (LRU)

- RenamedThreadRecord
  - id: string                // url hash など
  - service: "chatgpt" | "gemini"
  - url: string
  - title: string
  - prevTitle: string
  - datePrefix: string         // "260118"
  - tags: string[]             // ["#chrome拡張", "#AI"]
  - renamedAt: number          // epoch ms
  - lastOpenedAt?: number

### 6.3 検索
- フリーワード：titleに部分一致
- タグ：tags[]の完全一致（MVPはOR、必要ならAND追加）
- 期間：datePrefixをYYMMDDとして比較（prefixなしは除外/含める設定）

## 7. リネーム実行（DOM操作）設計
### 7.1 基本方針
- URLを主キーとして「アクティブスレッド」を特定
- サイト別AdapterがDOMを操作して Rename UI に到達する
- 待機は MutationObserver + timeout
- セレクタはクラス名に依存しない（aria/role/text優先）
- 多言語（日本語/英語）を想定して複数候補を持つ

### 7.2 Adapter インターフェース（概念）
- canHandle(url): boolean
- getActiveThreadInfo(): { title?: string, url: string }
- renameActiveThread(newTitle: string): Result

### 7.3 失敗時のUX
- エラー分類（例）：
  - Renameメニューが見つからない
  - 入力欄が見つからない
  - 保存操作に失敗
- 表示：
  - 「サイト側UI変更の可能性」「再読み込み」「手動リネーム」など現実的な次の手

## 8. ショートカット
- commands で定義
- 動作：アクティブタブに紐づくサイドパネルを開き、本文にフォーカス
- フォーカスは panel 側で “open時” に行う

## 9. 安全装置（必須セット）
- プレビュー（Before/After）
- Undo（prevTitleを用いて再リネーム）
- 実行ボタンのdisabled条件（本文空、対象サイトでない等）
- トースト（成功/失敗）

## 10. 受け入れ条件（Acceptance Criteria）
- ChatGPT/Geminiで、サイドパネルからリネームできる
- タイトルが `YYMMDD_本文` + ` #タグ...` 形式で作られる
- タグはユーザ登録リストからのみ選べ、最大3つ、無限生成しない
- リネーム成功したスレッドがインデックス化され、検索→ジャンプできる
- ショートカットでパネルが開く
- プレビューとUndoが機能する
- 失敗時に理由と行動が表示される
