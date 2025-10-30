# GTM設定 簡易ガイド（コーディング不要）

GTM管理画面での設定を、**コーディングスキル不要**で行えるようにまとめたガイドです。

## 設定の種類

### 🟢 コードなし（GUI操作のみ）: 8個

マウス操作とテキスト入力だけで設定できます。

### 🟡 コピペ必要: 2個

提供されたJavaScriptコードをコピー&ペーストします（コードを理解する必要はありません）。

---

## 変数の設定（10個）

GTM管理画面 > 変数 > 新規 をクリックして作成します。

### 🟢 1. URL - qr_id（GUI操作のみ）

1. 変数名: `URL - qr_id`
2. 変数の種類: **URL**
3. コンポーネントタイプ: **クエリ**
4. クエリキー: `qr_id`
5. 保存

### 🟢 2. DataLayer - qr_id（GUI操作のみ）

1. 変数名: `DataLayer - qr_id`
2. 変数の種類: **データレイヤーの変数**
3. データレイヤーの変数名: `qr_id`
4. 保存

### 🟡 3. JS - QRID_Persisted（コピペ必要）

1. 変数名: `JS - QRID_Persisted`
2. 変数の種類: **カスタム JavaScript**
3. 以下のコードをコピー&ペースト:

```javascript
function() {
  try {
    var key = 'qr_id';
    if (window.dataLayer) {
      for (var i = window.dataLayer.length - 1; i >= 0; i--) {
        if (window.dataLayer[i][key]) {
          return window.dataLayer[i][key];
        }
      }
    }
    var s = sessionStorage.getItem(key);
    if (s) return s;
    var m = document.cookie.match(/(?:^|;\s*)qr_id=([^;]+)/);
    return m ? decodeURIComponent(m[1]) : undefined;
  } catch(e) {
    return undefined;
  }
}
```

4. 保存

### 🟢 4. URL - Path（GUI操作のみ）

1. 変数名: `URL - Path`
2. 変数の種類: **URL**
3. コンポーネントタイプ: **パス**
4. 保存

### 🟢 5. Lookup - page_type（GUI操作のみ）

1. 変数名: `Lookup - page_type`
2. 変数の種類: **検索テーブル**
3. 入力変数: `{{URL - Path}}`
4. **「正規表現のマッチング」にチェックを入れる** ← 重要！
5. 検索テーブルに以下を入力:

| 入力 | 出力 |
|------|------|
| `^/$\|/index\.html?$` | `home` |
| `^/lp/` | `lp` |
| `^/thanks` | `thanks` |

6. 「既定値を設定」にチェックを入れる
7. 既定値: `other`
8. 保存

### 🟡 6. JS - CanonicalPageURL（コピペ必要・オプション）

URLを正規化する変数です。必須ではありませんが、設定を推奨します。

1. 変数名: `JS - CanonicalPageURL`
2. 変数の種類: **カスタム JavaScript**
3. 以下のコードをコピー&ペースト:

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

4. 保存

### 🟢 7. DataLayer - cta_id（GUI操作のみ）

1. 変数名: `DataLayer - cta_id`
2. 変数の種類: **データレイヤーの変数**
3. データレイヤーの変数名: `cta_id`
4. 保存

### 🟢 8. DataLayer - cta_text（GUI操作のみ）

1. 変数名: `DataLayer - cta_text`
2. 変数の種類: **データレイヤーの変数**
3. データレイヤーの変数名: `cta_text`
4. 保存

### 🟢 9. DataLayer - cta_area（GUI操作のみ）

1. 変数名: `DataLayer - cta_area`
2. 変数の種類: **データレイヤーの変数**
3. データレイヤーの変数名: `cta_area`
4. 保存

### 🟢 10. DataLayer - page_section（GUI操作のみ）

1. 変数名: `DataLayer - page_section`
2. 変数の種類: **データレイヤーの変数**
3. データレイヤーの変数名: `page_section`
4. 保存

---

## トリガーの設定（4個）

GTM管理画面 > トリガー > 新規 をクリックして作成します。

### 🟢 1. Initialization - All Pages（GUI操作のみ）

1. トリガー名: `Initialization - All Pages`
2. トリガーのタイプ: **初期化**
3. このトリガーの発生場所: **すべての初期化イベント**
4. 保存

### 🟢 2. Window Loaded（GUI操作のみ）

1. トリガー名: `Window Loaded`
2. トリガーのタイプ: **ページビュー**
3. **ウィンドウの読み込み** を選択
4. このトリガーの発生場所: **すべてのページビュー**
5. 保存

### 🟢 3. Custom Event - cta_click（GUI操作のみ）

1. トリガー名: `Custom Event - cta_click`
2. トリガーのタイプ: **カスタム イベント**
3. イベント名: `cta_click`
4. このトリガーの発生場所: **すべてのカスタム イベント**
5. 保存

### 🟢 4. Custom Event - generate_lead（GUI操作のみ）

1. トリガー名: `Custom Event - generate_lead`
2. トリガーのタイプ: **カスタム イベント**
3. イベント名: `generate_lead`
4. このトリガーの発生場所: **すべてのカスタム イベント**
5. 保存

---

## タグの設定（4個）

GTM管理画面 > タグ > 新規 をクリックして作成します。

### 🟢 1. GA4 Config（GUI操作のみ）

1. タグ名: `GA4 Config`
2. タグの種類: **Google アナリティクス: GA4 設定**
3. 測定ID: `G-JN1R0QH33V`
4. 「設定フィールド」セクションで「フィールド名」を追加:
   - フィールド名: `send_page_view`
   - 値: `false`
5. トリガー: `Initialization - All Pages`
6. 保存

### 🟢 2. GA4 Event - page_view（GUI操作のみ）

1. タグ名: `GA4 Event - page_view`
2. タグの種類: **Google アナリティクス: GA4 イベント**
3. 設定タグ: `{{GA4 Config}}`（プルダウンから選択）
4. イベント名: `page_view`
5. 「イベント パラメータ」セクションで以下を追加:

| パラメータ名 | 値 |
|------------|-----|
| `page_location` | `{{JS - CanonicalPageURL}}`（または`{{Page URL}}`） |
| `page_referrer` | `{{Referrer}}` |
| `qr_id` | `{{JS - QRID_Persisted}}` |
| `page_type` | `{{Lookup - page_type}}` |

6. トリガー: `Window Loaded`
7. 保存

### 🟢 3. GA4 Event - cta_click（GUI操作のみ）

1. タグ名: `GA4 Event - cta_click`
2. タグの種類: **Google アナリティクス: GA4 イベント**
3. 設定タグ: `{{GA4 Config}}`
4. イベント名: `cta_click`
5. 「イベント パラメータ」セクションで以下を追加:

| パラメータ名 | 値 |
|------------|-----|
| `qr_id` | `{{JS - QRID_Persisted}}` |
| `cta_id` | `{{DataLayer - cta_id}}` |
| `cta_text` | `{{DataLayer - cta_text}}` |
| `cta_area` | `{{DataLayer - cta_area}}` |
| `page_section` | `{{DataLayer - page_section}}` |

6. トリガー: `Custom Event - cta_click`
7. 保存

### 🟢 4. GA4 Event - generate_lead（GUI操作のみ）

1. タグ名: `GA4 Event - generate_lead`
2. タグの種類: **Google アナリティクス: GA4 イベント**
3. 設定タグ: `{{GA4 Config}}`
4. イベント名: `generate_lead`
5. 「イベント パラメータ」セクションで以下を追加:

| パラメータ名 | 値 |
|------------|-----|
| `qr_id` | `{{JS - QRID_Persisted}}` |
| `form_id` | `contact_form` |
| `lead_type` | `demo_request` |
| `form_name` | `無料デモ申し込み` |

6. トリガー: `Custom Event - generate_lead`
7. 保存

---

## GA4側の設定

GA4管理画面で以下を設定します。

### カスタムディメンションの作成

GA4管理画面 > データの表示 > カスタムディメンション > 「カスタムディメンションを作成」

以下の5つを作成します：

#### 1. qr_id

- ディメンション名: `qr_id`
- 範囲: **イベント**
- イベントパラメータ: `qr_id`
- 保存

#### 2. page_type

- ディメンション名: `page_type`
- 範囲: **イベント**
- イベントパラメータ: `page_type`
- 保存

#### 3. cta_id

- ディメンション名: `cta_id`
- 範囲: **イベント**
- イベントパラメータ: `cta_id`
- 保存

#### 4. cta_area

- ディメンション名: `cta_area`
- 範囲: **イベント**
- イベントパラメータ: `cta_area`
- 保存

#### 5. page_section

- ディメンション名: `page_section`
- 範囲: **イベント**
- イベントパラメータ: `page_section`
- 保存

### コンバージョンの設定

GA4管理画面 > イベント

1. イベント一覧で`generate_lead`を探す
2. 右側の「コンバージョンとしてマークを付ける」トグルをON

---

## Enhanced Measurement の設定

GA4管理画面 > データストリーム > Webストリーム（G-JN1R0QH33V）> 「拡張計測機能」

1. **ページビュー** を **OFF** にする ← 重要！（二重送信防止）
2. その他（スクロール、クリックなど）は任意

---

## プレビューモードでテスト

### 1. GTMプレビューを起動

GTM管理画面 > 「プレビュー」をクリック

### 2. テストURLにアクセス

```
https://info.coekar.com/index.html?utm_source=qr&utm_medium=offline&utm_campaign=2025_q4_coekar&utm_content=test&qr_id=TEST-001
```

### 3. 確認項目

#### ✅ ページ読み込み時

- `GA4 Config`タグが発火
- `GA4 Event - page_view`タグが発火
- Variables タブで`JS - QRID_Persisted`が`TEST-001`を表示

#### ✅ CTAクリック時

1. 「無料デモを申し込む」ボタンをクリック
2. `Custom Event - cta_click`トリガーが発火
3. `GA4 Event - cta_click`タグが発火
4. パラメータに`qr_id: TEST-001`が含まれる

#### ✅ 2ページ目以降

1. ページ内の別のセクション（例: `#problem`）に遷移
2. `GA4 Event - page_view`タグが発火
3. パラメータに`qr_id: TEST-001`が含まれる（保持されている）

---

## まとめ

### コーディング不要の設定: 16個

- 変数: 8個
- トリガー: 4個
- タグ: 4個

### コピペが必要な設定: 2個

- 変数: 2個（`JS - QRID_Persisted`、`JS - CanonicalPageURL`）

**コードを理解する必要はありません。提供されたコードをコピー&ペーストするだけです。**

---

## 次のステップ

1. GTM管理画面で変数・トリガー・タグを作成
2. プレビューモードでテスト
3. 問題なければ「公開」をクリック
4. GA4でデータが入ってくるのを確認（24時間後）

---

## よくある質問

### Q: JavaScriptの知識は必要ですか？

**A**: いいえ、必要ありません。提供されたコードをコピー&ペーストするだけです。

### Q: コードを間違えたらどうなりますか？

**A**: GTMのプレビューモードでエラーが表示されます。その場合は、もう一度コピー&ペーストしてください。

### Q: 設定を間違えたらやり直せますか？

**A**: はい、GTMは変更履歴が残るので、いつでも以前のバージョンに戻せます。

### Q: プレビューモードでエラーが出ました

**A**: 以下を確認してください：
- コードのコピペが正しいか
- 変数名のスペルミスがないか
- トリガーが正しく設定されているか

---

以上で、GTM設定の簡易ガイドは完了です。
