# QRコード流入計測 ドキュメント

コエカルサービスページにおけるQRコード流入計測の実装ドキュメント集です。

## ドキュメント一覧

### 1. [GTM_GA4_BASICS.md](./GTM_GA4_BASICS.md) 【まず読む】

QRコード流入計測を理解するための基礎知識をまとめたドキュメントです。

**対象者**: GTM/GA4初心者、計測の仕組みを理解したい方

**内容**:
- Google Tag Manager（GTM）とは
- Google Analytics 4（GA4）とは
- dataLayerとは
- UTMパラメータとは
- カスタムイベント・カスタムディメンションとは
- 変数・トリガー・タグの関係
- Cookie vs sessionStorageとは
- postMessageとは
- イベント駆動型トラッキング

### 2. [GTM_QR_TRACKING_SETUP.md](./GTM_QR_TRACKING_SETUP.md) 【実装する】

GTM管理画面での設定手順を詳細に解説したドキュメントです。

**対象者**: GTM設定を行う担当者

**内容**:
- 変数の設定（10個）
- タグの設定（4個）
- トリガーの設定（4個）
- GA4側の設定（カスタムディメンション、コンバージョン）
- デバッグ・QA方法
- 流入経路の集計方法
- トラブルシューティング

### 3. [PARDOT_FORM_SETUP.md](./PARDOT_FORM_SETUP.md) 【オプション】

Pardot/beee.jpフォームでコンバージョンイベントを送信するための設定手順です。

**対象者**: Pardot/beee.jp管理者、フォーム設定担当者

**内容**:
- Pardot側で実装すべき内容（postMessage送信）
- 実装方法（Completion Actions、Thank You Content）
- 動作確認方法
- トラブルシューティング
- 代替案（リダイレクトベースの追跡）

## 実装の流れ

### ステップ1: 基礎知識を理解する

[GTM_GA4_BASICS.md](./GTM_GA4_BASICS.md)を読んで、GTM/GA4の基礎知識を理解します。

**所要時間**: 30分〜1時間

### ステップ2: HTML側の実装を確認する

`index.html`に以下が実装済みであることを確認します：

- ✅ GTMコンテナタグ（GTM-MCF8R75T）
- ✅ qr_idパラメータ永続化スクリプト
- ✅ CTA クリック追跡スクリプト（trackCTA関数）
- ✅ CTAボタンへのdata属性とonclick属性
- ✅ フォーム送信完了イベント受信スクリプト（postMessage）

**所要時間**: 10分

### ステップ3: GTM管理画面で設定する

[GTM_QR_TRACKING_SETUP.md](./GTM_QR_TRACKING_SETUP.md)に従って、GTM管理画面で設定します：

1. 変数を作成（10個）
2. タグを作成（4個）
3. トリガーを作成（4個）
4. プレビューモードでデバッグ
5. 公開

**所要時間**: 1時間〜2時間

### ステップ4: GA4側で設定する

[GTM_QR_TRACKING_SETUP.md](./GTM_QR_TRACKING_SETUP.md)の「GA4側の設定」に従って設定します：

1. カスタムディメンションを作成（5個）
2. コンバージョンを登録（generate_lead）

**所要時間**: 10分〜20分

### ステップ5: Pardot/beee.jpフォームを設定する（オプション）

フォーム送信完了時のコンバージョン計測を行う場合、[PARDOT_FORM_SETUP.md](./PARDOT_FORM_SETUP.md)に従って設定します。

**所要時間**: 30分〜1時間

### ステップ6: デバッグ・QA

[GTM_QR_TRACKING_SETUP.md](./GTM_QR_TRACKING_SETUP.md)の「デバッグ・QA」セクションに従って、動作確認を行います。

**所要時間**: 30分〜1時間

## QRコードURL生成

QRコードを作成する際は、以下のフォーマットでURLを生成してください：

```
https://info.coekar.com/index.html
  ?utm_source=qr
  &utm_medium=offline
  &utm_campaign=2025_q4_coekar
  &utm_content=poster_A1_stationEast_v1
  &qr_id=POS-A1-023
```

**パラメータ規則**:
- `utm_source`: **qr** (固定)
- `utm_medium`: **offline** (固定)
- `utm_campaign`: `YYYY_qN_name` 形式（例: `2025_q4_coekar`）
- `utm_content`: `<媒体>_<サイズ>_<設置先>[_vN]`（例: `poster_A1_stationEast_v1`）
- `qr_id`: `<媒体略称>-<サイズ>-<連番>`（例: `POS-A1-023`）

**例**:
- ポスター（A1・駅東口）: `qr_id=POS-A1-023`
- チラシ（A5・店舗A）: `qr_id=FLY-A5-001`
- スタンド（A4・病院B）: `qr_id=STAND-A4-007`

## データ分析

### GA4標準レポート

**獲得 > トラフィック獲得**で以下を確認できます：

- セッションの参照元/メディア: `qr / offline`
- キャンペーン: `2025_q4_coekar`
- コンテンツ: `poster_A1_stationEast_v1`

### GA4探索レポート

**探索 > 空白**から、以下のフリーフォームレポートを作成できます：

**行**: `qr_id`（カスタムディメンション）
**列**: 日付
**値**: セッション、コンバージョン、CVR

**フィルタ**: `campaign = 2025_q4_coekar`

**例**:

| qr_id | セッション | コンバージョン | CVR |
|-------|-----------|--------------|-----|
| POS-A1-023 | 150 | 12 | 8.0% |
| POS-A1-024 | 85 | 5 | 5.9% |
| FLY-A5-001 | 200 | 18 | 9.0% |

**QRコードごとの効果を正確に比較できる！**

## トラブルシューティング

問題が発生した場合は、以下のドキュメントのトラブルシューティングセクションを参照してください：

- [GTM_QR_TRACKING_SETUP.md - トラブルシューティング](./GTM_QR_TRACKING_SETUP.md#トラブルシューティング)
- [PARDOT_FORM_SETUP.md - トラブルシューティング](./PARDOT_FORM_SETUP.md#トラブルシューティング)

## よくある質問

### Q1: qr_idはどのくらいの期間保持されますか？

**A**: Cookieで90日間保持されます。ただし、ユーザーがCookieを削除した場合は消えます。

### Q2: 別タブでもqr_idは保持されますか？

**A**: はい、Cookieで保存しているため、同一ブラウザの別タブでも保持されます。

### Q3: プライベートブラウジング（シークレットモード）でも計測できますか？

**A**: sessionStorageは利用できますが、Cookieはブラウザを閉じると消えます。セッション内のみ計測可能です。

### Q4: GTMの設定を変更した後、すぐに反映されますか？

**A**: GTMで「公開」すると、数分以内に反映されます。ただし、GA4のカスタムディメンションは24時間程度かかる場合があります。

### Q5: Enhanced Measurementの設定はどうすればいいですか？

**A**: `page_view`を**無効**にしてください。それ以外（scroll、click、file_downloadなど）は有効でも構いません。

### Q6: UTMパラメータに日本語を使用できますか？

**A**: 技術的には可能ですが、URLエンコードされて読みにくくなるため、**英数字のみ**を推奨します。

### Q7: QRコードごとの効果を比較するには？

**A**: GA4の探索レポートで、`qr_id`ディメンションを使用してください（上記「データ分析」セクション参照）。

## 関連リソース

- [Google Tag Manager公式ドキュメント](https://support.google.com/tagmanager)
- [Google Analytics 4公式ドキュメント](https://support.google.com/analytics)
- [UTMパラメータビルダー](https://ga-dev-tools.google/campaign-url-builder/)

## 変更履歴

| 日付 | 変更内容 | 担当者 |
|------|---------|--------|
| 2025-10-30 | 初版作成 | - |

---

以上で、QRコード流入計測の実装ドキュメントの説明は完了です。
