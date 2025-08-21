/**
 * 医療記録カード3Dインタラクション
 * マウス追従によるカードの立体的な動き
 */

document.addEventListener('DOMContentLoaded', function() {
  const cards = document.querySelectorAll('.record-card');
  
  cards.forEach(card => {
    let isHovering = false;
    let animationFrameId = null;
    
    // マウス位置を記録
    let mouseX = 0;
    let mouseY = 0;
    let currentX = 0;
    let currentY = 0;
    
    // スムーズなアニメーション用
    const lerp = (start, end, factor) => {
      return start + (end - start) * factor;
    };
    
    // 3D変換を適用
    const updateTransform = () => {
      if (!isHovering) {
        // ホバーしていない時は徐々に元に戻す
        currentX = lerp(currentX, 0, 0.1);
        currentY = lerp(currentY, 0, 0.1);
        
        if (Math.abs(currentX) < 0.01 && Math.abs(currentY) < 0.01) {
          currentX = 0;
          currentY = 0;
          card.style.transform = '';
          card.style.boxShadow = '';
          
          if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
          }
          return;
        }
      } else {
        // スムーズな追従
        currentX = lerp(currentX, mouseX, 0.1);
        currentY = lerp(currentY, mouseY, 0.1);
      }
      
      // カードの変形
      const rotateX = currentY * -12; // 縦の回転
      const rotateY = currentX * 12;  // 横の回転
      const translateZ = Math.abs(currentX) * 15 + Math.abs(currentY) * 15;
      
      card.style.transform = `
        perspective(1000px)
        rotateX(${rotateX}deg)
        rotateY(${rotateY}deg)
        translateZ(${translateZ}px)
        scale(${isHovering ? 1.03 : 1})
      `;
      
      // ダイナミックシャドウ
      const shadowX = currentX * 25;
      const shadowY = currentY * 25;
      const shadowBlur = 40 + Math.abs(currentX) * 20 + Math.abs(currentY) * 20;
      
      card.style.boxShadow = `
        ${shadowX}px ${shadowY}px ${shadowBlur}px rgba(30, 58, 138, 0.15),
        ${shadowX * 0.5}px ${shadowY * 0.5}px ${shadowBlur * 0.5}px rgba(59, 130, 246, 0.1),
        0 0 0 0.5px rgba(255, 255, 255, 0.9),
        0 0 0 1px rgba(59, 130, 246, 0.12),
        inset 0 2px 4px rgba(255, 255, 255, 0.98),
        inset 0 -1px 2px rgba(59, 130, 246, 0.08)
      `;
      
      animationFrameId = requestAnimationFrame(updateTransform);
    };
    
    // マウスエンター
    card.addEventListener('mouseenter', function() {
      isHovering = true;
      card.style.transition = 'none';
      if (!animationFrameId) {
        updateTransform();
      }
    });
    
    // マウス移動
    card.addEventListener('mousemove', function(e) {
      if (!isHovering) return;
      
      const rect = card.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      // -1 から 1 の範囲に正規化
      mouseX = (e.clientX - centerX) / (rect.width / 2);
      mouseY = (e.clientY - centerY) / (rect.height / 2);
      
      // 範囲を制限
      mouseX = Math.max(-1, Math.min(1, mouseX));
      mouseY = Math.max(-1, Math.min(1, mouseY));
    });
    
    // マウスリーブ
    card.addEventListener('mouseleave', function() {
      isHovering = false;
      mouseX = 0;
      mouseY = 0;
      
      // スムーズなトランジションを再有効化
      card.style.transition = 'transform 0.6s cubic-bezier(0.23, 1, 0.320, 1), box-shadow 0.6s cubic-bezier(0.23, 1, 0.320, 1)';
    });
    
    // タッチデバイス対応
    card.addEventListener('touchstart', function(e) {
      isHovering = true;
      const touch = e.touches[0];
      const rect = card.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      mouseX = (touch.clientX - centerX) / (rect.width / 2);
      mouseY = (touch.clientY - centerY) / (rect.height / 2);
      
      if (!animationFrameId) {
        updateTransform();
      }
    });
    
    card.addEventListener('touchend', function() {
      isHovering = false;
      mouseX = 0;
      mouseY = 0;
    });
  });
  
  // パフォーマンス最適化：スクロール時は一時停止
  let scrollTimeout;
  window.addEventListener('scroll', function() {
    document.body.classList.add('is-scrolling');
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(function() {
      document.body.classList.remove('is-scrolling');
    }, 150);
  });
});