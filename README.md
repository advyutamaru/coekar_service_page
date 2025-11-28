# coekar_service_page

コエカル サービスページ

## 構成概要

- **フロントエンド**: 静的サイト（`index.html`, `css/`, `js/`, `image/`）
- **バックエンド**: Lambda（`lambda/contact-form/`）資料請求フォーム → Slack 通知
- **ホスティング**: S3 + CloudFront + Route 53
- **インフラ管理**: Terraform（`infra/`）
- **CI/CD**: GitHub Actions

## URL

- 本番: https://info.coekar.com

## ローカル開発

```bash
# 依存関係インストール
npm install

# 開発サーバー起動（最適化なし）
npm run dev

# ビルド（dist/ に出力）
npm run build

# ビルド結果をプレビュー
npm run serve
```

## GitHub Actions による自動デプロイ

ワークフロー: `.github/workflows/deploy.yml`

### トリガー

- `main` ブランチへの `push` → ビルド & デプロイ
- `main` 向けの `pull_request` → ビルドのみ
- `workflow_dispatch` → 手動実行

### 処理内容

1. チェックアウト
2. Node.js セットアップ
3. 依存関係インストール
4. HTML / CSS / JS / 画像の最適化
5. `dist/` ディレクトリに成果物を配置
6. （main のみ）AWS 認証 → S3 sync → CloudFront キャッシュ無効化

### GitHub Secrets

| Secret 名 | 説明 |
|-----------|------|
| `AWS_ROLE_TO_ASSUME` | GitHub Actions 用 IAM ロール ARN |
| `AWS_REGION` | `ap-northeast-1` |
| `S3_BUCKET` | `info.coekar.com` |
| `CLOUDFRONT_DISTRIBUTION_ID` | CloudFront ディストリビューション ID |

## インフラ（Terraform）

AWS リソースは `infra/` 配下の Terraform で管理しています。

### 管理リソース

- S3 バケット（静的サイトホスティング）
- CloudFront ディストリビューション + OAC
- ACM 証明書（us-east-1）
- Route 53 レコード（info.coekar.com）
- IAM ロール / ポリシー（GitHub Actions 用 OIDC）

### 操作方法

```bash
cd infra

# 初期化
AWS_PROFILE=medical-voice-ai terraform init

# 差分確認
AWS_PROFILE=medical-voice-ai terraform plan

# 適用
AWS_PROFILE=medical-voice-ai terraform apply
```

### 出力値

```bash
AWS_PROFILE=medical-voice-ai terraform output
```

- `site_domain`: サイトドメイン
- `site_bucket_name`: S3 バケット名
- `cloudfront_distribution_id`: CloudFront ID
- `github_actions_role_arn`: GitHub Actions 用ロール ARN

## Lambda（問い合わせフォーム）

- コード: `lambda/contact-form/lambda_function.py`
- ランタイム: Python 3.12（arm64）
- 環境変数:
  - `SLACK_WEBHOOK_URL`: Slack Webhook URL
  - `ALLOWED_ORIGINS`: CORS 許可オリジン（`https://info.coekar.com`）
- Function URL を有効化し、`js/contact-form.js` の `API_ENDPOINT` に設定

## 運用フロー

1. コードを `main` ブランチに push / merge
2. GitHub Actions が自動でビルド & S3 デプロイ
3. CloudFront キャッシュ無効化 → 数分で本番反映
