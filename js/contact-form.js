// Contact form submission via Lambda
(function() {
  const form = document.querySelector('.contact-form');
  if (!form) return;

  // Lambda Function URL
  const API_ENDPOINT = 'https://dhsyti2guuseuqcrb3g5yxucpy0nmhhn.lambda-url.ap-northeast-1.on.aws/';

  form.addEventListener('submit', async function(e) {
    e.preventDefault();

    const submitBtn = form.querySelector('.btn-submit');
    const originalText = submitBtn.textContent;

    // ボタンを無効化
    submitBtn.disabled = true;
    submitBtn.textContent = '送信中...';

    // フォームデータを取得
    const formData = new FormData(form);
    const data = {
      organization: formData.get('organization'),
      department: formData.get('department'),
      name: formData.get('name'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      message: formData.get('message') || ''
    };

    try {
      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error('API error');
      }

      showSuccessMessage();
      form.reset();

      // dataLayerにイベントを送信
      if (window.dataLayer) {
        window.dataLayer.push({
          event: 'generate_lead',
          form_id: 'contact_form',
          lead_type: 'document_request',
          form_name: '資料請求'
        });
      }

    } catch (error) {
      console.error('Form submission error:', error);
      showErrorMessage();
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  });

  function showSuccessMessage() {
    const wrapper = document.querySelector('.contact-form-wrapper');
    const successHtml = `
      <div class="form-success">
        <div class="success-icon">✓</div>
        <h3>送信完了</h3>
        <p>資料請求ありがとうございます。<br>担当者より折り返しご連絡いたします。</p>
      </div>
    `;
    wrapper.innerHTML = successHtml;
    wrapper.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function showErrorMessage() {
    alert('送信に失敗しました。お手数ですが、時間をおいて再度お試しください。');
  }
})();
