# S3 + CloudFront + Route 53 + GitHub Actions 実装計画

このドキュメントは、`info.coekar.com` ドメインで本サービスページを運用するための実装計画です。

## ゴール

- `info.coekar.com` で静的サイトを HTTPS + CDN 付きで配信する
- `main` ブランチへの push をトリガーに、GitHub Actions で自動デプロイする
- 問い合わせフォームは既存の Lambda（Function URL）を経由して Slack 通知を行う

## 前提

- `coekar.com` の DNS を Route 53 で管理している
- AWS アカウントがあり、S3 / CloudFront / ACM / IAM にアクセスできる
- GitHub リポジトリ: `advyutamaru/coekar_service_page`

---

## 実装ステップ概要

Terraform で AWS リソースを管理します（定義ファイルは `infra/` 配下）。

1. Terraform の初期化と基本設定
2. S3 バケット / ACM 証明書 / CloudFront / Route 53 / IAM ロールを Terraform で作成
3. GitHub Secrets 設定
4. GitHub Actions ワークフロー確認
5. Lambda（問い合わせフォーム）の CORS 設定確認
6. 動作確認

---

## 1. Terraform の初期化と基本設定

目的: `infra/` ディレクトリで Terraform を実行できる状態にする。

- ローカルで以下を実行:

```bash
cd infra
terraform init
```

- `infra/terraform.tf` で Terraform / AWS プロバイダのバージョンを指定
- `infra/providers.tf` で
  - メインリージョン: `ap-northeast-1`
  - CloudFront/ACM 用リージョン: `us-east-1`（エイリアス `us_east_1`）を定義

必要に応じて `infra/variables.tf` で `root_domain`, `site_subdomain`, `tags` などを調整する。

---

## 2. S3 / ACM / CloudFront / Route 53 / IAM を Terraform で作成

目的: 本番運用に必要な AWS リソースを Terraform で一括作成する。

`infra/main.tf` には以下が定義されている。

- S3 バケット:
  - `aws_s3_bucket.site`: 静的サイト用バケット（デフォルト `info.coekar.com`）
  - バージョニング・暗号化・パブリックブロック設定
- ACM 証明書（us-east-1）:
  - `aws_acm_certificate.site` / `aws_acm_certificate_validation.site`
  - DNS 検証用 Route 53 レコード `aws_route53_record.site_cert_validation`
- CloudFront:
  - `aws_cloudfront_origin_access_control.site`
  - `aws_cloudfront_distribution.site`（オリジンに S3、CNAME に `info.coekar.com` を設定）
  - `default_root_object = "index.html"`
- S3 バケットポリシー:
  - `aws_s3_bucket_policy.site`（CloudFront OAC のみアクセス許可）
- Route 53:
  - `aws_route53_record.site_alias`（`info.coekar.com` → CloudFront への A レコード（ALIAS））
- GitHub Actions 用 IAM:
  - GitHub OIDC プロバイダ `aws_iam_openid_connect_provider.github`
  - ロール `aws_iam_role.github_actions`
  - ポリシー `aws_iam_role_policy.github_actions`
    - S3: List / PutObject / DeleteObject（対象バケットに限定）
    - CloudFront: CreateInvalidation（対象ディストリビューションに限定）

作成コマンド:

```bash
cd infra
terraform plan   # 差分を確認
terraform apply  # 確定
```

初回 `apply` により、S3 / CloudFront / Route 53 / IAM ロールなどがすべて作成される。

---

## 3. GitHub Secrets 設定

目的: ワークフローで利用する AWS 情報を GitHub Secrets に登録する。

リポジトリ設定 → `Settings` → `Secrets and variables` → `Actions` にて以下を登録。

- `AWS_ROLE_TO_ASSUME`
  - Terraform で作成された IAM ロールの ARN（`github_actions_role_arn` 出力値）
- `AWS_REGION`
  - `ap-northeast-1`
- `S3_BUCKET`
  - Terraform で作成されたバケット名（`site_bucket_name` 出力値。デフォルトでは `info.coekar.com`）
- `CLOUDFRONT_DISTRIBUTION_ID`
  - Terraform で作成されたディストリビューション ID（`cloudfront_distribution_id` 出力値）

---

## 4. GitHub Actions ワークフロー確認

目的: `.github/workflows/deploy.yml` が期待通りの挙動をするか確認する。

- トリガー:
  - `push`（`main` ブランチ）
  - `pull_request`（`main` 向け。ビルドのみ）
  - `workflow_dispatch`
- 主な処理:
  1. `npm ci`
  2. `npm run build`（`dist/` に出力）
  3. `main` ブランチの場合:
     - `aws-actions/configure-aws-credentials@v4` でロールを引き受ける
     - `aws s3 sync dist/ s3://$S3_BUCKET --delete`
     - `aws cloudfront create-invalidation --distribution-id $CLOUDFRONT_DISTRIBUTION_ID --paths "/*"`

必要に応じて小さな修正（ログ出力追加など）を行う。

---

## 5. Lambda（問い合わせフォーム）設定確認

目的: 本番ドメインからフォーム送信が正常に行えるようにする。

- Lambda コード: `lambda/contact-form/lambda_function.py`
- 環境変数:
  - `SLACK_WEBHOOK_URL`: 正しい Slack Webhook URL を設定
  - `ALLOWED_ORIGINS`: `https://info.coekar.com` を含める
- 関数 URL:
  - 認証タイプ: `NONE`
  - CORS はコード内で制御
- フロントエンド:
  - `js/contact-form.js` の `API_ENDPOINT` を Lambda Function URL に設定

---

## 6. 動作確認

目的: 一連のデプロイフローと本番サイトの動作を確認する。

1. ローカルで軽微な変更を加えて `main` に push
2. GitHub Actions の `Deploy to S3 and CloudFront` ワークフローが成功することを確認
3. `https://info.coekar.com` にアクセスし、変更が反映されていることを確認
4. 資料請求フォームから送信し、Slack に通知が届くことを確認

以上により、`info.coekar.com` での本番運用と、`main` ブランチからの自動デプロイが完了します。
