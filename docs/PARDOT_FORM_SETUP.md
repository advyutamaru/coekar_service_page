# Pardot/beee.jpフォーム設定手順

コエカルサービスページのお問い合わせフォームからGA4へコンバージョンイベントを送信するための設定手順です。

## 概要

現在、お問い合わせフォームはiframeで埋め込まれたbeee.jp（Pardot）フォームです。フォーム送信完了時に親ウィンドウのGTMへイベントを通知する必要があります。

**iframe URL**: `https://go.lp.beee.jp/l/1010792/2025-08-20/31jy7`

---

## 親ウィンドウ側の実装状態

index.htmlには既に以下の実装が完了しています：

```javascript
// iframeからのpostMessageを受信してdataLayerにpush
window.addEventListener('message', function(event) {
    // セキュリティ: 信頼できるオリジンのみ処理
    if (event.origin.indexOf('beee.jp') === -1 && event.origin.indexOf('go.pardot.com') === -1) {
        return;
    }

    // フォーム送信完了メッセージを処理
    if (event.data && event.data.event === 'form_submit_success') {
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({
            'event': 'generate_lead',
            'form_id': event.data.form_id || 'contact_form',
            'lead_type': event.data.lead_type || 'demo_request',
            'form_name': event.data.form_name || '無料デモ申し込み'
        });
    }
});
```

---

## Pardot/beee.jp側で実装すべき内容

フォーム送信成功時に、親ウィンドウへpostMessageを送信する必要があります。

### 方法1: Completion Actions（推奨）

Pardotの管理画面でフォームのCompletion Actionsを設定します。

1. Pardot管理画面 > Marketing > Forms > 該当フォーム（ID: 1010792）を開く
2. Completion Actions タブを開く
3. 「Add New Action」をクリック
4. **Action Type**: Custom Redirect または JavaScript
5. 以下のJavaScriptを追加：

```javascript
<script>
  // 親ウィンドウにフォーム送信成功を通知
  if (window.parent && window.parent !== window) {
    window.parent.postMessage({
      event: 'form_submit_success',
      form_id: 'contact_form',
      lead_type: 'demo_request',
      form_name: '無料デモ申し込み',
      timestamp: new Date().toISOString()
    }, '*');
  }
</script>
```

**注意**: セキュリティ上、`'*'`ではなく`'https://info.coekar.com'`を指定することを推奨します。

### 方法2: Thank You Contentに埋め込み

フォーム送信後のThank Youページ（または表示されるメッセージ）にJavaScriptを埋め込みます。

1. Pardot管理画面 > 該当フォーム > Form Settings
2. Thank You Content に以下を追加：

```html
<div class="thank-you-message">
  <h2>お申し込みありがとうございます</h2>
  <p>担当者より2営業日以内にご連絡いたします。</p>
</div>

<script>
  (function() {
    try {
      // 親ウィンドウにフォーム送信成功を通知
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({
          event: 'form_submit_success',
          form_id: 'contact_form',
          lead_type: 'demo_request',
          form_name: '無料デモ申し込み',
          timestamp: new Date().toISOString()
        }, 'https://info.coekar.com');
      }
    } catch(e) {
      console.error('Failed to send form completion message:', e);
    }
  })();
</script>
```

### 方法3: フォームのonSubmitイベント（非推奨）

beee.jpのフォームでonSubmit時に処理を追加する方法もありますが、送信前のイベントであり、実際の送信成功を保証しないため非推奨です。

---

## 動作確認

### 1. ローカルテスト

1. `https://info.coekar.com/index.html?utm_source=qr&utm_medium=offline&utm_campaign=2025_q4_coekar&utm_content=test&qr_id=TEST-001`にアクセス
2. GTMプレビューモードを起動
3. フォームに入力して送信
4. GTMプレビューで以下を確認：
   - `Custom Event - generate_lead`トリガーが発火
   - `GA4 Event - generate_lead`タグが発火
   - イベントパラメータに`qr_id: TEST-001`が含まれる

### 2. ブラウザコンソールでの確認

フォーム送信後、ブラウザのコンソールで以下を実行：

```javascript
// dataLayerの内容を確認
console.log(window.dataLayer);

// generate_leadイベントが含まれているか確認
window.dataLayer.filter(item => item.event === 'generate_lead');
```

### 3. GA4での確認

GA4 > 設定 > DebugView（または リアルタイム）で以下を確認：

- `generate_lead`イベントが送信されている
- イベントパラメータ：
  - `qr_id`: TEST-001
  - `form_id`: contact_form
  - `lead_type`: demo_request
  - `form_name`: 無料デモ申し込み

---

## トラブルシューティング

### postMessageが送信されない

- iframe側のJavaScriptコンソールでエラーが出ていないか確認
- `window.parent`が正しく取得できているか確認
- セキュリティポリシー（CSP）がpostMessageをブロックしていないか確認

### postMessageは送信されるがdataLayerにpushされない

- 親ウィンドウのコンソールでエラーが出ていないか確認
- `event.origin`のチェックでブロックされていないか確認（beee.jpまたはgo.pardot.comが含まれているか）
- `event.data.event`が`form_submit_success`であるか確認

### GTMでイベントが発火しない

- GTMプレビューモードで`Custom Event - generate_lead`トリガーが発火しているか確認
- `GA4 Event - generate_lead`タグが配信されているか確認
- タグの配信条件（フィルタ）が正しいか確認

---

## セキュリティ考慮事項

### postMessageのオリジン指定

現在、親ウィンドウ側では以下のオリジンのみ受け入れています：

- `*.beee.jp`
- `*.go.pardot.com`

iframe側からpostMessageを送信する際は、第2引数で送信先オリジンを指定してください：

```javascript
// 推奨
window.parent.postMessage(data, 'https://info.coekar.com');

// 非推奨（全てのオリジンに送信）
window.parent.postMessage(data, '*');
```

### XSS対策

postMessageで受信したデータをそのままdataLayerにpushしていますが、GTM/GA4側で適切にエスケープされます。ただし、将来的に他の用途でpostMessageを使用する場合は、受信データのバリデーションを強化してください。

---

## 代替案: リダイレクトベースの追跡

postMessageが実装できない場合、フォーム送信後に専用のThanksページへリダイレクトし、そのページでGA4イベントを送信する方法もあります。

### 手順

1. Thanksページ（例: `/thanks.html`）を作成
2. Pardotの設定で、フォーム送信後に`/thanks.html`へリダイレクト
3. `/thanks.html`でGTMタグを使用して`generate_lead`イベントを送信

**thanks.htmlの例**:

```html
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <title>お申し込みありがとうございます - コエカル</title>
    <!-- GTMコード -->
    <script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
    new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
    j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
    'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
    })(window,document,'script','dataLayer','GTM-MCF8R75T');</script>

    <!-- qr_id永続化 -->
    <script>
        (function() {
            try {
                var key = 'qr_id';
                var url = new URL(location.href);
                var val = url.searchParams.get(key);
                if (val) {
                    sessionStorage.setItem(key, val);
                    document.cookie = key + '=' + encodeURIComponent(val) + ';path=/;max-age=' + (60 * 60 * 24 * 90);
                }
                window.dataLayer = window.dataLayer || [];
                var persistedQrId = val || sessionStorage.getItem(key);
                if (!persistedQrId) {
                    var match = document.cookie.match(/(?:^|;\s*)qr_id=([^;]+)/);
                    persistedQrId = match ? decodeURIComponent(match[1]) : undefined;
                }
                if (persistedQrId) {
                    window.dataLayer.push({'qr_id': persistedQrId});
                }

                // generate_leadイベントをpush
                window.dataLayer.push({
                    'event': 'generate_lead',
                    'form_id': 'contact_form',
                    'lead_type': 'demo_request',
                    'form_name': '無料デモ申し込み'
                });
            } catch(e) {
                console.error('Error:', e);
            }
        })();
    </script>
</head>
<body>
    <noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-MCF8R75T"
    height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>

    <h1>お申し込みありがとうございます</h1>
    <p>担当者より2営業日以内にご連絡いたします。</p>
    <a href="/index.html">トップページへ戻る</a>
</body>
</html>
```

この方法の場合、GTM側で`Page View - Thanks Page`トリガーを使用してください（GTM設定手順書を参照）。

---

## 変更履歴

| 日付 | 変更内容 | 担当者 |
|------|---------|--------|
| 2025-10-30 | 初版作成 | - |

---

以上でPardot/beee.jpフォームの設定手順は完了です。
