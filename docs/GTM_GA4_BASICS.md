# GTM/GA4 QRコード流入計測 基礎知識

QRコード流入計測を理解するために必要な基礎知識をまとめたドキュメントです。

## 目次

1. [Google Tag Manager（GTM）とは](#google-tag-managergtmとは)
2. [Google Analytics 4（GA4）とは](#google-analytics-4ga4とは)
3. [dataLayerとは](#datalayerとは)
4. [UTMパラメータとは](#utmパラメータとは)
5. [カスタムイベントとは](#カスタムイベントとは)
6. [カスタムディメンションとは](#カスタムディメンションとは)
7. [変数・トリガー・タグの関係](#変数トリガータグの関係)
8. [Cookie vs sessionStorageとは](#cookie-vs-sessionstorageとは)
9. [postMessageとは](#postmessageとは)
10. [イベント駆動型トラッキング](#イベント駆動型トラッキング)

---

## Google Tag Manager（GTM）とは

### 概要

Google Tag Manager（GTM）は、Webサイトに設置する各種タグ（計測コード）を一元管理するためのツールです。

### GTMがないとどうなるか

従来の方法では、GA4やGoogle広告、Facebook Pixelなどの計測コードを直接HTMLに埋め込む必要がありました。

```html
<!-- 従来の方法：HTMLに直接埋め込み -->
<script>
  gtag('event', 'page_view', {...});
</script>
<script>
  fbq('track', 'PageView');
</script>
<!-- 変更のたびにHTMLを編集してデプロイが必要 -->
```

**問題点**:
- タグを追加・変更するたびにHTMLを編集し、デプロイが必要
- エンジニアに依頼しなければならず、スピードが遅い
- タグが増えると管理が煩雑になる

### GTMを使うメリット

GTMを導入すると、HTMLには**GTMコンテナタグのみ**を設置し、残りはGTM管理画面から設定できます。

```html
<!-- GTMコンテナタグのみ設置 -->
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-XXXXXXX');</script>
```

**メリット**:
- GTM管理画面から、コードを変更せずにタグを追加・変更できる
- マーケターが自分で設定できる（エンジニア不要）
- バージョン管理・ロールバック機能がある
- プレビューモードでデバッグできる

### GTMの構成要素

GTMは以下の3つの要素で構成されます：

1. **変数（Variables）**: データを保持・取得する
2. **トリガー（Triggers）**: いつタグを発火させるかを定義
3. **タグ（Tags）**: 実際に実行される処理（GA4イベント送信など）

---

## Google Analytics 4（GA4）とは

### 概要

Google Analytics 4（GA4）は、Googleが提供するWebサイト・アプリの分析ツールです。従来のUniversal Analytics（UA）の後継です。

### UAとGA4の違い

| 項目 | Universal Analytics（UA） | Google Analytics 4（GA4） |
|------|---------------------------|---------------------------|
| データモデル | セッション・ページビュー中心 | **イベント中心** |
| 計測単位 | ページビュー、セッション | **すべてイベント** |
| カスタマイズ性 | 限定的 | 柔軟（イベントパラメータ） |
| プライバシー | Cookie依存 | Cookieレス対応 |
| サポート終了 | 2023年7月終了 | 現行バージョン |

### GA4のイベントベースモデル

GA4では、**すべての計測がイベント**として扱われます。

```javascript
// ページビューもイベント
event: 'page_view'

// ボタンクリックもイベント
event: 'cta_click'

// コンバージョンもイベント
event: 'generate_lead'
```

各イベントには**パラメータ**を付与できます：

```javascript
{
  event: 'page_view',
  page_location: 'https://example.com/index.html',
  qr_id: 'POS-A1-023',  // カスタムパラメータ
  page_type: 'home'      // カスタムパラメータ
}
```

---

## dataLayerとは

### 概要

`dataLayer`は、Webサイトとタグマネージャー（GTM）の間でデータをやり取りするための**データ格納場所**です。

### dataLayerの仕組み

`dataLayer`は、JavaScriptの配列オブジェクトです。

```javascript
window.dataLayer = window.dataLayer || [];
```

データをpushすることで、GTMに情報を渡します：

```javascript
// ページビュー時
window.dataLayer.push({
  event: 'page_view',
  page_location: 'https://example.com/',
  qr_id: 'POS-A1-023'
});

// CTAクリック時
window.dataLayer.push({
  event: 'cta_click',
  cta_id: 'hero_demo_apply',
  cta_text: '無料デモを申し込む'
});
```

### GTMとdataLayerの連携

1. **HTML側**: `dataLayer.push()`でデータを送信
2. **GTM側**: トリガーがイベントを検知
3. **GTM側**: 変数がdataLayerからデータを取得
4. **GTM側**: タグが実行され、GA4にデータを送信

**フロー図**:

```
HTML
  ↓ dataLayer.push({ event: 'cta_click', ... })
GTM Trigger（Custom Event - cta_click）
  ↓ 発火
GTM Variables（DataLayer - cta_id など）
  ↓ データ取得
GTM Tag（GA4 Event - cta_click）
  ↓ イベント送信
GA4
```

### dataLayerの利点

- **疎結合**: HTMLとタグマネージャーが独立している
- **柔軟性**: GTM側で自由にデータを加工・利用できる
- **デバッグしやすい**: ブラウザコンソールで`window.dataLayer`を確認できる

```javascript
// ブラウザコンソールで確認
console.log(window.dataLayer);
// [{event: 'gtm.js', ...}, {event: 'page_view', ...}, ...]
```

---

## UTMパラメータとは

### 概要

UTMパラメータは、流入元を識別するためのURLクエリパラメータです。GA4で自動的に認識されます。

### 5つのUTMパラメータ

| パラメータ | 意味 | 例 |
|-----------|------|-----|
| `utm_source` | 流入元（どのメディアか） | `qr`, `google`, `facebook` |
| `utm_medium` | 流入媒体（どの手段か） | `offline`, `cpc`, `email` |
| `utm_campaign` | キャンペーン名 | `2025_q4_coekar` |
| `utm_content` | コンテンツ識別 | `poster_A1_stationEast_v1` |
| `utm_term` | 検索キーワード（検索広告用） | `医療記録 自動化` |

### QRコードでのUTM例

```
https://info.coekar.com/index.html
  ?utm_source=qr
  &utm_medium=offline
  &utm_campaign=2025_q4_coekar
  &utm_content=poster_A1_stationEast_v1
  &qr_id=POS-A1-023
```

- `utm_source=qr`: QRコード経由
- `utm_medium=offline`: オフライン施策
- `utm_campaign=2025_q4_coekar`: 2025年Q4のコエカルキャンペーン
- `utm_content=poster_A1_stationEast_v1`: A1ポスター・駅東口・バリアント1
- `qr_id=POS-A1-023`: 個別QR識別子（カスタムパラメータ）

### GA4での集計

GA4の「トラフィック獲得」レポートで、UTMパラメータごとに集計できます：

- セッションの参照元/メディア: `qr / offline`
- キャンペーン: `2025_q4_coekar`
- コンテンツ: `poster_A1_stationEast_v1`

---

## カスタムイベントとは

### 概要

カスタムイベントは、GA4の標準イベント以外に、独自に定義するイベントです。

### GA4の標準イベント

GA4には以下のような標準イベントがあります：

- `page_view`: ページビュー
- `scroll`: スクロール
- `click`: クリック
- `file_download`: ファイルダウンロード
- `form_start`: フォーム入力開始
- `purchase`: 購入

### カスタムイベントの作成

標準イベントで表現できない場合、カスタムイベントを作成します。

**例: CTAクリック**

```javascript
window.dataLayer.push({
  event: 'cta_click',  // カスタムイベント名
  cta_id: 'hero_demo_apply',
  cta_text: '無料デモを申し込む'
});
```

**例: リード獲得**

```javascript
window.dataLayer.push({
  event: 'generate_lead',  // 標準イベント名だが、カスタムパラメータを付与
  form_id: 'contact_form',
  lead_type: 'demo_request'
});
```

### カスタムイベントの利点

- **ビジネス要件に合わせた計測**ができる
- **より詳細なユーザー行動**を把握できる
- **カスタムパラメータ**で柔軟にデータを付与できる

---

## カスタムディメンションとは

### 概要

カスタムディメンションは、GA4の標準ディメンション（ページURL、デバイスカテゴリなど）以外に、独自に定義するディメンションです。

### ディメンションとは

ディメンションは、データを分類するための**軸**です。

| ディメンション | 例 |
|---------------|-----|
| ページパス | `/`, `/about`, `/contact` |
| デバイスカテゴリ | `desktop`, `mobile`, `tablet` |
| 参照元/メディア | `qr/offline`, `google/cpc` |
| **qr_id（カスタム）** | `POS-A1-023`, `FLY-A5-001` |

### カスタムディメンションの作成

GA4管理画面で、イベントパラメータをカスタムディメンションとして登録します。

**手順**:
1. GA4管理画面 > データの表示 > カスタムディメンション
2. 「カスタムディメンションを作成」
3. ディメンション名: `qr_id`
4. 範囲: **イベント**
5. イベントパラメータ: `qr_id`

### カスタムディメンションの利用

探索レポートで、`qr_id`をディメンションとして使用できます：

| qr_id | セッション | コンバージョン | CVR |
|-------|-----------|---------------|-----|
| POS-A1-023 | 150 | 12 | 8.0% |
| POS-A1-024 | 85 | 5 | 5.9% |
| FLY-A5-001 | 200 | 18 | 9.0% |

**QRコードごとの効果を比較できる！**

---

## 変数・トリガー・タグの関係

GTMの3つの要素（変数・トリガー・タグ）の関係を理解することが重要です。

### 全体の流れ

```
1. ユーザーがアクション（ページ表示、クリックなど）
   ↓
2. トリガーが発火条件を満たす
   ↓
3. 変数がデータを取得
   ↓
4. タグが実行される（GA4にイベント送信）
```

### 具体例: CTAクリック計測

#### 1. HTML側（ユーザーアクション）

```javascript
// ユーザーがCTAボタンをクリック
function trackCTA(ctaId, ctaText, ctaArea, pageSection) {
  window.dataLayer.push({
    event: 'cta_click',
    cta_id: ctaId,
    cta_text: ctaText,
    cta_area: ctaArea,
    page_section: pageSection
  });
}
```

#### 2. GTMトリガー（発火条件）

- **トリガー名**: `Custom Event - cta_click`
- **トリガーのタイプ**: カスタム イベント
- **イベント名**: `cta_click`

**意味**: dataLayerに`{event: 'cta_click'}`がpushされたら発火

#### 3. GTM変数（データ取得）

- **DataLayer - cta_id**: `{{cta_id}}`
- **DataLayer - cta_text**: `{{cta_text}}`
- **JS - QRID_Persisted**: sessionStorageから`qr_id`を取得

**意味**: dataLayerやストレージからデータを取得

#### 4. GTMタグ（実行処理）

- **タグ名**: `GA4 Event - cta_click`
- **タグの種類**: Google アナリティクス: GA4 イベント
- **イベント名**: `cta_click`
- **イベントパラメータ**:
  - `qr_id`: `{{JS - QRID_Persisted}}`
  - `cta_id`: `{{DataLayer - cta_id}}`
  - `cta_text`: `{{DataLayer - cta_text}}`
- **配信トリガー**: `Custom Event - cta_click`

**意味**: GA4に`cta_click`イベントを送信

### フロー図

```
ユーザー: CTAクリック
  ↓
HTML: trackCTA() 実行
  ↓
dataLayer.push({ event: 'cta_click', ... })
  ↓
GTM Trigger: Custom Event - cta_click 発火
  ↓
GTM Variables: DataLayer - cta_id などからデータ取得
  ↓
GTM Tag: GA4 Event - cta_click 実行
  ↓
GA4: cta_clickイベント受信
```

---

## Cookie vs sessionStorageとは

### ブラウザストレージの種類

Webサイトがブラウザにデータを保存する方法は主に3つあります：

| 種類 | 保存期間 | 容量 | サーバー送信 | 用途 |
|------|---------|------|------------|------|
| **Cookie** | 指定可能（例: 90日） | 4KB | 〇（毎回送信） | 認証、長期保存 |
| **sessionStorage** | タブを閉じるまで | 5MB | × | 一時データ |
| **localStorage** | 永続的 | 5MB | × | 長期保存 |

### Cookieの特徴

```javascript
// Cookieに保存（90日間）
document.cookie = 'qr_id=POS-A1-023;path=/;max-age=' + (60*60*24*90);

// Cookieから取得
var match = document.cookie.match(/(?:^|;\s*)qr_id=([^;]+)/);
var qrId = match ? decodeURIComponent(match[1]) : undefined;
```

**メリット**:
- 有効期限を指定できる（例: 90日後まで保持）
- 別タブでも共有される
- サブドメイン間で共有できる

**デメリット**:
- 容量が小さい（4KB）
- 毎回サーバーに送信される（通信量増加）

### sessionStorageの特徴

```javascript
// sessionStorageに保存
sessionStorage.setItem('qr_id', 'POS-A1-023');

// sessionStorageから取得
var qrId = sessionStorage.getItem('qr_id');
```

**メリット**:
- 容量が大きい（5MB）
- サーバーに送信されない（パフォーマンス向上）

**デメリット**:
- タブを閉じると消える
- 別タブでは共有されない

### QRコード流入計測での使い分け

本実装では、**両方を併用**しています：

```javascript
// URLパラメータにqr_idがある場合
if (val) {
  // sessionStorageに保存（高速アクセス）
  sessionStorage.setItem('qr_id', val);

  // Cookieに保存（90日間保持）
  document.cookie = 'qr_id=' + encodeURIComponent(val) + ';path=/;max-age=' + (60*60*24*90);
}

// 取得時の優先順位
var qrId = sessionStorage.getItem('qr_id');  // まずsessionStorageから
if (!qrId) {
  var match = document.cookie.match(/(?:^|;\s*)qr_id=([^;]+)/);
  qrId = match ? decodeURIComponent(match[1]) : undefined;  // なければCookieから
}
```

**理由**:
- **sessionStorage**: 高速アクセス、同一セッション内で使用
- **Cookie**: 長期保存、タブを閉じても保持、別タブでも共有

---

## postMessageとは

### 概要

`postMessage`は、異なるウィンドウ（iframe、ポップアップなど）間で安全にデータをやり取りするためのブラウザAPIです。

### 問題: iframeのセキュリティ制約

通常、iframe内のJavaScriptは親ウィンドウのJavaScriptにアクセスできません（**同一オリジンポリシー**）。

```javascript
// iframe内
parent.someFunction();  // ❌ エラー: Cross-origin access blocked
```

これは、セキュリティ上の理由（XSS攻撃防止）によるものです。

### 解決策: postMessage

`postMessage`を使うと、異なるオリジン間でも**安全に**データを送受信できます。

#### iframe側（送信側）

```javascript
// フォーム送信成功時
window.parent.postMessage({
  event: 'form_submit_success',
  form_id: 'contact_form'
}, 'https://info.coekar.com');
```

#### 親ウィンドウ側（受信側）

```javascript
window.addEventListener('message', function(event) {
  // セキュリティチェック: 信頼できるオリジンのみ受け入れ
  if (event.origin.indexOf('beee.jp') === -1) {
    return;  // 不正なオリジンは無視
  }

  // データを処理
  if (event.data && event.data.event === 'form_submit_success') {
    window.dataLayer.push({
      event: 'generate_lead',
      form_id: event.data.form_id
    });
  }
});
```

### postMessageのフロー

```
iframe（https://go.lp.beee.jp）
  ↓ postMessage({ event: 'form_submit_success' }, 'https://info.coekar.com')
親ウィンドウ（https://info.coekar.com）
  ↓ message イベントを受信
  ↓ オリジンチェック（beee.jpか？）
  ↓ dataLayer.push({ event: 'generate_lead' })
GTM
  ↓ Custom Event - generate_lead 発火
GA4
  ↓ generate_leadイベント受信
```

### セキュリティ考慮

**送信側（iframe）**: 第2引数でターゲットオリジンを指定

```javascript
// 推奨: 特定のオリジンのみに送信
window.parent.postMessage(data, 'https://info.coekar.com');

// 非推奨: すべてのオリジンに送信（セキュリティリスク）
window.parent.postMessage(data, '*');
```

**受信側（親ウィンドウ）**: オリジンを検証

```javascript
window.addEventListener('message', function(event) {
  // 信頼できるオリジンのみ受け入れ
  if (event.origin !== 'https://go.lp.beee.jp') {
    return;  // 拒否
  }
  // 処理...
});
```

---

## イベント駆動型トラッキング

### 概要

イベント駆動型トラッキングは、ユーザーの行動（イベント）をトリガーとして計測を行う手法です。

### 従来のページビュー中心型

```
ユーザーがページAを表示
  ↓
GA: ページビュー記録（/pageA）

ユーザーがページBに遷移
  ↓
GA: ページビュー記録（/pageB）
```

**問題点**:
- ページ遷移しないアクション（ボタンクリック、スクロール）は計測できない
- SPAでは正しく計測できない

### イベント駆動型

```
ユーザーがページAを表示
  ↓
GA: page_viewイベント送信

ユーザーがCTAをクリック
  ↓
GA: cta_clickイベント送信（ページ遷移なし）

ユーザーがフォーム送信
  ↓
GA: generate_leadイベント送信（ページ遷移なし）
```

**メリット**:
- **あらゆるユーザー行動**を計測できる
- **SPA対応**（ページ遷移なしでも計測可能）
- **柔軟な分析**（イベントパラメータで詳細データを付与）

### QRコード流入計測での適用

本実装では、以下のイベントを計測しています：

1. **page_view**: ページ表示時
   - パラメータ: `qr_id`, `page_type`, `page_location`

2. **cta_click**: CTAクリック時
   - パラメータ: `qr_id`, `cta_id`, `cta_text`, `cta_area`

3. **generate_lead**: フォーム送信完了時
   - パラメータ: `qr_id`, `form_id`, `lead_type`

**全イベントに`qr_id`を付与することで、QRコードごとの効果を追跡できる！**

---

## まとめ: 全体の流れ

### 1. ユーザーがQRコードからアクセス

```
https://info.coekar.com/index.html?utm_source=qr&utm_medium=offline&utm_campaign=2025_q4_coekar&qr_id=POS-A1-023
```

### 2. qr_idを永続化

```javascript
// HTMLの<head>内で実行
sessionStorage.setItem('qr_id', 'POS-A1-023');
document.cookie = 'qr_id=POS-A1-023;path=/;max-age=' + (60*60*24*90);
```

### 3. page_viewイベント送信

```javascript
// dataLayerにpush
window.dataLayer.push({
  event: 'page_view',
  qr_id: 'POS-A1-023',
  page_type: 'home'
});

// GTMが検知してGA4に送信
```

### 4. ユーザーがCTAをクリック

```javascript
// trackCTA()関数が実行される
window.dataLayer.push({
  event: 'cta_click',
  qr_id: 'POS-A1-023',  // sessionStorageから取得
  cta_id: 'hero_demo_apply'
});

// GTMが検知してGA4に送信
```

### 5. ユーザーがフォーム送信

```javascript
// iframe（beee.jp）からpostMessage
window.parent.postMessage({
  event: 'form_submit_success'
}, 'https://info.coekar.com');

// 親ウィンドウが受信してdataLayerにpush
window.dataLayer.push({
  event: 'generate_lead',
  qr_id: 'POS-A1-023',  // sessionStorageから取得
  form_id: 'contact_form'
});

// GTMが検知してGA4に送信
```

### 6. GA4で分析

GA4の探索レポートで、`qr_id`ディメンションを使用して分析：

| qr_id | セッション | CTAクリック | コンバージョン | CVR |
|-------|-----------|-----------|--------------|-----|
| POS-A1-023 | 150 | 45 | 12 | 8.0% |

**QRコードごとの効果を正確に把握できる！**

---

## 参考資料

- [Google Tag Manager公式ドキュメント](https://support.google.com/tagmanager)
- [Google Analytics 4公式ドキュメント](https://support.google.com/analytics)
- [dataLayerについて](https://developers.google.com/tag-platform/tag-manager/datalayer)
- [UTMパラメータについて](https://support.google.com/analytics/answer/10917952)
- [postMessage API](https://developer.mozilla.org/ja/docs/Web/API/Window/postMessage)

---

## 用語集

| 用語 | 説明 |
|------|------|
| GTM | Google Tag Manager。タグ管理ツール |
| GA4 | Google Analytics 4。分析ツール |
| dataLayer | GTMとWebサイト間のデータ受け渡し層 |
| UTM | Urchin Tracking Module。流入元識別パラメータ |
| イベント | ユーザーの行動（ページビュー、クリックなど） |
| パラメータ | イベントに付与する詳細データ |
| ディメンション | データを分類する軸 |
| 変数 | GTMでデータを保持・取得する要素 |
| トリガー | GTMでタグを発火させる条件 |
| タグ | GTMで実行される処理 |
| Cookie | ブラウザに保存されるデータ（有効期限あり） |
| sessionStorage | ブラウザに保存されるデータ（タブを閉じるまで） |
| postMessage | iframe間でデータをやり取りするAPI |
| 同一オリジンポリシー | セキュリティ制約（異なるドメイン間のアクセス制限） |

---

以上で、QRコード流入計測を理解するための基礎知識の説明は完了です。
