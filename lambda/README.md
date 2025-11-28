# Lambda関数デプロイ手順

## 1. AWS Lambdaで関数を作成

1. AWSコンソール → Lambda → 「関数の作成」
2. 「一から作成」を選択
3. 関数名: `coekar-contact-form`
4. ランタイム: `Python 3.12`
5. アーキテクチャ: `arm64`（コスト削減）

## 2. コードをアップロード

`lambda/contact-form/lambda_function.py` の内容をLambdaエディタに貼り付け

## 3. 環境変数を設定

設定 → 環境変数 → 編集

| キー | 値 |
|-----|-----|
| SLACK_WEBHOOK_URL | （Slackで発行したWebhook URLを設定） |
| ALLOWED_ORIGIN | https://coekar.com |

## 4. 関数URLを有効化

設定 → 関数URL → 「関数URLを作成」

- 認証タイプ: `NONE`
- CORSを設定: オフ（コード内で制御）

## 5. フロントエンドを更新

`js/contact-form.js` の `API_ENDPOINT` を関数URLに変更

```javascript
const API_ENDPOINT = 'https://xxxxxxxxxx.lambda-url.ap-northeast-1.on.aws/';
```

## 6. テスト

フォームから送信してSlack通知が届くことを確認
