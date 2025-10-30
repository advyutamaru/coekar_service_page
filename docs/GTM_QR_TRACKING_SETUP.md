# GTM QRコード流入計測 設定手順書

コエカルサービスページにおけるQRコード流入計測のためのGTM設定手順です。

## 目次

1. [前提条件](#前提条件)
2. [変数の設定](#変数の設定)
3. [タグの設定](#タグの設定)
4. [トリガーの設定](#トリガーの設定)
5. [GA4側の設定](#ga4側の設定)
6. [デバッグ・QA](#デバッグqa)

---

## 前提条件

- GTMコンテナID: **GTM-MCF8R75T**
- GA4測定ID: **G-JN1R0QH33V**
- HTML側の実装: 完了（qr_id永続化、CTA追跡）

---

## 変数の設定

GTM管理画面 > 変数 > ユーザー定義変数 で以下を作成します。

### 1. URL - qr_id

URLクエリパラメータから`qr_id`を取得する変数。

- **変数名**: `URL - qr_id`
- **変数の種類**: URL
- **コンポーネントタイプ**: クエリ
- **クエリキー**: `qr_id`

### 2. DataLayer - qr_id

dataLayerから`qr_id`を取得する変数（HTML側で設定済み）。

- **変数名**: `DataLayer - qr_id`
- **変数の種類**: データレイヤーの変数
- **データレイヤーの変数名**: `qr_id`

### 3. JS - QRID_Persisted

sessionStorageまたはCookieから`qr_id`を取得する変数。

- **変数名**: `JS - QRID_Persisted`
- **変数の種類**: カスタム JavaScript
- **カスタム JavaScript**:

```javascript
function() {
  try {
    var key = 'qr_id';

    // dataLayerから取得を試みる
    if (window.dataLayer) {
      for (var i = window.dataLayer.length - 1; i >= 0; i--) {
        if (window.dataLayer[i][key]) {
          return window.dataLayer[i][key];
        }
      }
    }

    // sessionStorageから取得
    var s = sessionStorage.getItem(key);
    if (s) return s;

    // Cookieから取得
    var m = document.cookie.match(/(?:^|;\s*)qr_id=([^;]+)/);
    return m ? decodeURIComponent(m[1]) : undefined;
  } catch(e) {
    return undefined;
  }
}
```

### 4. URL - Path

URLパスを取得する変数（ページタイプ判定用）。

- **変数名**: `URL - Path`
- **変数の種類**: URL
- **コンポーネントタイプ**: パス

### 5. Lookup - page_type

ページタイプを判定する変数。

- **変数名**: `Lookup - page_type`
- **変数の種類**: 検索テーブル
- **入力変数**: `{{URL - Path}}`
- **正規表現のマッチング**: **有効化**
- **検索テーブル**:

| 入力 | 出力 |
|------|------|
| `^/$\|/index\.html?$` | `home` |
| `^/lp/` | `lp` |
| `^/thanks` | `thanks` |
| 既定値 | `other` |

### 6. JS - CanonicalPageURL（オプション）

`/index.html`を`/`に正規化し、クエリパラメータをソートする変数。

- **変数名**: `JS - CanonicalPageURL`
- **変数の種類**: カスタム JavaScript
- **カスタム JavaScript**:

```javascript
function() {
  try {
    const u = new URL(location.href);
    u.hash = '';
    u.pathname = u.pathname.replace(/\/index\.html?$/i, '/');
    const pairs = Array.from(u.searchParams.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    u.search = pairs.length ? '?' + pairs.map(p => encodeURIComponent(p[0]) + '=' + encodeURIComponent(p[1])).join('&') : '';
    return u.toString();
  } catch(e) {
    return location.href;
  }
}
```

### 7. DataLayer - cta_id

CTAクリック時のCTA IDを取得する変数。

- **変数名**: `DataLayer - cta_id`
- **変数の種類**: データレイヤーの変数
- **データレイヤーの変数名**: `cta_id`

### 8. DataLayer - cta_text

CTAクリック時のCTAテキストを取得する変数。

- **変数名**: `DataLayer - cta_text`
- **変数の種類**: データレイヤーの変数
- **データレイヤーの変数名**: `cta_text`

### 9. DataLayer - cta_area

CTAクリック時のCTAエリアを取得する変数。

- **変数名**: `DataLayer - cta_area`
- **変数の種類**: データレイヤーの変数
- **データレイヤーの変数名**: `cta_area`

### 10. DataLayer - page_section

CTAクリック時のページセクションを取得する変数。

- **変数名**: `DataLayer - page_section`
- **変数の種類**: データレイヤーの変数
- **データレイヤーの変数名**: `page_section`

---

## タグの設定

GTM管理画面 > タグ で以下を作成します。

### 1. GA4 Config（Google タグ）

GA4の基本設定タグ。

- **タグ名**: `GA4 Config`
- **タグの種類**: Google アナリティクス: GA4 設定
- **測定ID**: `G-JN1R0QH33V`
- **設定フィールド**:
  - `send_page_view`: `false` ※自動page_viewを無効化
- **配信トリガー**: `Initialization - All Pages`

**注意**: GA4のEnhanced Measurementで`page_view`を**無効化**してください（二重送信防止）。

### 2. GA4 Event - page_view

自前でpage_viewイベントを送信するタグ。

- **タグ名**: `GA4 Event - page_view`
- **タグの種類**: Google アナリティクス: GA4 イベント
- **設定タグ**: `{{GA4 Config}}`
- **イベント名**: `page_view`
- **イベントパラメータ**:
  - `page_location`: `{{JS - CanonicalPageURL}}` ※または`{{Page URL}}`
  - `page_referrer`: `{{Referrer}}`
  - `qr_id`: `{{JS - QRID_Persisted}}`
  - `page_type`: `{{Lookup - page_type}}`
- **配信トリガー**: `Window Loaded` または `DOM Ready`

**SPAの場合**: `History Change`トリガーも追加してください。

### 3. GA4 Event - cta_click

CTAクリックイベントを送信するタグ。

- **タグ名**: `GA4 Event - cta_click`
- **タグの種類**: Google アナリティクス: GA4 イベント
- **設定タグ**: `{{GA4 Config}}`
- **イベント名**: `cta_click`
- **イベントパラメータ**:
  - `qr_id`: `{{JS - QRID_Persisted}}`
  - `cta_id`: `{{DataLayer - cta_id}}`
  - `cta_text`: `{{DataLayer - cta_text}}`
  - `cta_area`: `{{DataLayer - cta_area}}`
  - `page_section`: `{{DataLayer - page_section}}`
- **配信トリガー**: `Custom Event - cta_click`

### 4. GA4 Event - generate_lead（オプション）

コンバージョンイベントを送信するタグ。

- **タグ名**: `GA4 Event - generate_lead`
- **タグの種類**: Google アナリティクス: GA4 イベント
- **設定タグ**: `{{GA4 Config}}`
- **イベント名**: `generate_lead`
- **イベントパラメータ**:
  - `qr_id`: `{{JS - QRID_Persisted}}`
  - `form_id`: `contact_form`
  - `lead_type`: `demo_request`
  - `form_name`: `無料デモ申し込み`
- **配信トリガー**: `Custom Event - lead_success` または Thanks ページ到達

**注意**: フォーム送信完了時に`lead_success`イベントをdataLayerにpushする実装が必要です。

---

## トリガーの設定

GTM管理画面 > トリガー で以下を作成します。

### 1. Initialization - All Pages

全ページで初期化時に発火するトリガー。

- **トリガー名**: `Initialization - All Pages`
- **トリガーのタイプ**: 初期化
- **このトリガーの発生場所**: すべての初期化イベント

### 2. Window Loaded

ページ読み込み完了時に発火するトリガー。

- **トリガー名**: `Window Loaded`
- **トリガーのタイプ**: ページビュー - ウィンドウの読み込み
- **このトリガーの発生場所**: すべてのページビュー

### 3. Custom Event - cta_click

CTAクリック時に発火するトリガー。

- **トリガー名**: `Custom Event - cta_click`
- **トリガーのタイプ**: カスタム イベント
- **イベント名**: `cta_click`
- **このトリガーの発生場所**: すべてのカスタム イベント

### 4. Custom Event - lead_success（オプション）

リード送信成功時に発火するトリガー。

- **トリガー名**: `Custom Event - lead_success`
- **トリガーのタイプ**: カスタム イベント
- **イベント名**: `lead_success`
- **このトリガーの発生場所**: すべてのカスタム イベント

**または**、Thanksページ到達時のトリガーを使用：

- **トリガー名**: `Page View - Thanks Page`
- **トリガーのタイプ**: ページビュー
- **このトリガーの発生場所**: 一部のページビュー
- **発生条件**: `{{URL - Path}}` `含む` `thanks`

---

## GA4側の設定

### 1. カスタムディメンションの作成

GA4管理画面 > データの表示 > カスタムディメンション で以下を作成します。

| ディメンション名 | 範囲 | イベントパラメータ | 説明 |
|------------------|------|-------------------|------|
| `qr_id` | イベント | `qr_id` | QRコード識別子 |
| `page_type` | イベント | `page_type` | ページタイプ |
| `cta_id` | イベント | `cta_id` | CTA識別子 |
| `cta_area` | イベント | `cta_area` | CTAエリア |
| `page_section` | イベント | `page_section` | ページセクション |

### 2. コンバージョンの設定

GA4管理画面 > イベント で`generate_lead`をコンバージョンとして登録します。

1. イベント一覧で`generate_lead`を見つける
2. 右側の「コンバージョンとしてマークを付ける」トグルをON

---

## デバッグ・QA

### 1. GTMプレビューモード

1. GTM管理画面 > プレビュー をクリック
2. `https://info.coekar.com/index.html?utm_source=qr&utm_medium=offline&utm_campaign=2025_q4_coekar&utm_content=poster_A1_test&qr_id=TEST-001` にアクセス
3. 以下を確認：
   - `GA4 Config`タグが発火
   - `GA4 Event - page_view`タグが発火
   - `page_view`イベントに`qr_id: TEST-001`が含まれる
   - Variables タブで`JS - QRID_Persisted`が`TEST-001`を返す

### 2. 2ページ目以降のqr_id保持確認

1. プレビューモードのまま、別のページ（例: `/#problem`）に遷移
2. `page_view`イベントに引き続き`qr_id: TEST-001`が含まれることを確認

### 3. CTAクリック追跡確認

1. プレビューモードのまま、CTAボタン（「無料デモを申し込む」）をクリック
2. `Custom Event - cta_click`トリガーが発火
3. `GA4 Event - cta_click`タグが発火
4. `cta_click`イベントに以下が含まれることを確認：
   - `qr_id: TEST-001`
   - `cta_id: hero_demo_apply`（クリックしたCTAによって異なる）
   - `cta_text: 無料デモを申し込む`
   - `cta_area: hero`
   - `page_section: hero`

### 4. Enhanced Measurement の二重送信確認

GA4のリアルタイムレポートで、同じページビューが2回カウントされていないことを確認します。

- Enhanced Measurementの`page_view`が**無効**であることを確認
- GTMからの`page_view`のみが送信されることを確認

### 5. GA4 DebugView

GA4管理画面 > 設定 > DebugView で以下を確認：

1. `page_view`イベントに`qr_id`パラメータが含まれる
2. `cta_click`イベントが正しく送信される
3. `generate_lead`イベントが送信される（フォーム送信後）

---

## 流入経路の集計方法

### 1. 標準レポート

GA4 > レポート > 獲得 > トラフィック獲得

- **軸**: `セッションのデフォルト チャネル グループ`または`セッションの参照元/メディア`
- `qr/offline`でフィルタ
- UTMパラメータ（campaign, content）で詳細を確認

### 2. 探索（フリーフォーム）

GA4 > 探索 > 空白

**行**:
- `qr_id`（カスタムディメンション）

**列**:
- 日付

**値**:
- セッション
- コンバージョン（`generate_lead`）
- CVR（カスタム指標: `コンバージョン / セッション`）

**フィルタ**:
- `campaign = 2025_q4_coekar`

これにより、QRコードごとの効果を比較できます。

---

## トラブルシューティング

### qr_idが保持されない

- ブラウザのCookieが有効か確認
- sessionStorageが利用可能か確認
- `JS - QRID_Persisted`変数がundefinedを返していないか確認

### page_viewが二重に送信される

- GA4のEnhanced Measurementで`page_view`が無効化されているか確認
- `GA4 Config`タグで`send_page_view: false`が設定されているか確認

### CTAクリックが追跡されない

- ブラウザコンソールで`dataLayer`を確認（`cta_click`イベントがpushされているか）
- GTMプレビューモードで`Custom Event - cta_click`トリガーが発火しているか確認

### カスタムディメンションが表示されない

- GA4でカスタムディメンションを作成してから24時間程度待つ
- イベントパラメータ名とカスタムディメンションのパラメータ名が一致しているか確認

---

## 付録：QRコードURL生成テンプレート

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
- `utm_campaign`: `YYYY_qN_name` 形式
- `utm_content`: `<媒体>_<サイズ>_<設置先>[_vN]`
- `qr_id`: `<媒体略称>-<サイズ>-<連番>`

**例**:
- ポスター: `POS-A1-001`
- チラシ: `FLY-A5-001`
- スタンド: `STAND-A4-001`

---

## 変更履歴

| 日付 | 変更内容 | 担当者 |
|------|---------|--------|
| 2025-10-30 | 初版作成 | - |

---

以上でGTM QRコード流入計測の設定は完了です。
