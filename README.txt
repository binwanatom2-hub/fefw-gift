万紫千紅 キャラ贈り物チェッカー

構成
- index.html : キャラ検索・選択・表示画面
- data.json : 表示用データ
- update.mjs : GameWithの対象ページから最新データを取得・解析
- .github/workflows/update.yml : 6時間ごとの自動更新

おすすめ運用
GitHubリポジトリにこのフォルダの中身を置き、GitHub Pagesを有効にします。
Actionsを許可すると、6時間ごとに対象ページを確認して data.json を更新します。
手動更新も Actions の workflow_dispatch から実行できます。

注意
- 外部ページのHTML構造が変わると解析処理の修正が必要になる場合があります。
- 解析失敗時は処理をエラー終了させるため、既存の data.json は壊しません。
- 公開・継続利用する場合は情報元サイトの利用条件・robots等も確認してください。
