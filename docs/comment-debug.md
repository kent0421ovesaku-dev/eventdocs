# コメントが表示されない問題の調査手順

## 実行手順

1. ブラウザで開発サーバー（`npm run dev`）を起動し、F12 でコンソールを開く
2. 新しいセッションを作成（トップでタイトル入力 → 「比較セッションを作成」）
3. PDF または Excel を左右いずれかにアップロード
4. ファイル上をクリック → コメントを入力して保存

## 確認するコンソールログ

- **saving comment:** 保存しようとしている内容（session_id, side, x_percent, y_percent, commenter_name, content, page_number）
- **insert result:** `{ data, error }` … **error がある場合はここが原因**
- **fetched comments:** 再取得したコメント配列と error（保存後に出る「refresh」の結果）
- **all comments:** 現在パネルに渡っているコメント一覧
- **currentPage:** 現在のページ番号（PDF のとき）
- **visibleComments:** 上記を `currentPage` でフィルタした結果（ここにピンが並ぶ）

## 想定される原因と対処

| 状況 | 想定原因 | 対処 |
|------|----------|------|
| insert result に `error` がある | DB の制約やカラム不足 | メッセージを確認。`page_number` 関連ならマイグレーション実行 |
| fetched comments が空 or 保存したコメントが含まれない | RLS や select の条件 | Supabase の RLS とクエリ条件を確認 |
| all comments に保存したコメントがあるが visibleComments が空 | ページ番号の不一致 | currentPage と各コメントの page_number を比較 |

## Supabase での確認

- **Table Editor → comments** で、保存したコメントが 1 件増えているか確認
- `page_number` カラムがない場合は、以下を SQL Editor で実行：

```sql
ALTER TABLE comments ADD COLUMN IF NOT EXISTS page_number INTEGER DEFAULT 1;
```

## コード上の修正（実施済み）

- insert で **error のときはモーダルを閉じず**、`onCommentsChange`（再取得）は呼ばない
- insert **成功時のみ** モーダルを閉じ、**await onCommentsChange()** で再取得完了を待ってから表示を更新
