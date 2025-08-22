// CTAセクション - マウス追従エフェクトとアニメーション
document.addEventListener('DOMContentLoaded', () => {
    const ctaSection = document.querySelector('.cta');
    
    if (!ctaSection) return;

    // マウス追従用の光のグラデーント要素を作成
    const mouseGradient = document.createElement('div');
    mouseGradient.className = 'mouse-gradient';
    mouseGradient.style.cssText = `
        position: absolute;
        width: 600px;
        height: 600px;
        background: radial-gradient(
            circle,
            rgba(96, 165, 250, 0.3) 0%,
            rgba(59, 130, 246, 0.15) 30%,
            transparent 70%
        );
        border-radius: 50%;
        pointer-events: none;
        z-index: 2;
        opacity: 0;
        transition: opacity 0.3s ease;
        filter: blur(40px);
        top: 0;
        left: 0;
        transform: translate(-300px, -300px);
    `;
    ctaSection.appendChild(mouseGradient);

    // マウス座標を追跡
    let mouseX = 0;
    let mouseY = 0;
    let currentX = 0;
    let currentY = 0;
    let isMouseInside = false;

    // マウス移動イベント
    ctaSection.addEventListener('mouseenter', () => {
        isMouseInside = true;
        mouseGradient.style.opacity = '1';
    });

    ctaSection.addEventListener('mouseleave', () => {
        isMouseInside = false;
        mouseGradient.style.opacity = '0';
    });

    ctaSection.addEventListener('mousemove', (e) => {
        const rect = ctaSection.getBoundingClientRect();
        mouseX = e.clientX - rect.left;
        mouseY = e.clientY - rect.top;
    });

    // スムーズなアニメーション用のループ
    function animateMouseGradient() {
        if (isMouseInside) {
            // イージングを適用した追従
            const ease = 0.15;
            currentX += (mouseX - currentX) * ease;
            currentY += (mouseY - currentY) * ease;

            // 位置を更新（中心を合わせる）
            const translateX = currentX - 300;
            const translateY = currentY - 300;
            mouseGradient.style.transform = `translate(${translateX}px, ${translateY}px)`;
        }
        requestAnimationFrame(animateMouseGradient);
    }
    animateMouseGradient();

    // 追加のインタラクティブ要素：ボタンの磁気効果
    const ctaButton = ctaSection.querySelector('.btn-primary');
    if (ctaButton) {
        
        ctaSection.addEventListener('mousemove', () => {
            // ボタンの現在の位置を取得
            const buttonRect = ctaButton.getBoundingClientRect();
            const ctaRect = ctaSection.getBoundingClientRect();
            
            // ボタンの中心座標を計算（相対座標）
            const buttonCenterX = buttonRect.left + buttonRect.width / 2 - ctaRect.left;
            const buttonCenterY = buttonRect.top + buttonRect.height / 2 - ctaRect.top;
            
            // マウスとボタンの距離を計算
            const distanceX = mouseX - buttonCenterX;
            const distanceY = mouseY - buttonCenterY;
            const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);
            
            // 磁気効果の範囲（150px以内）
            const magnetRange = 150;
            
            if (distance < magnetRange) {
                // 距離に応じた引力の強さ
                const pullStrength = (1 - distance / magnetRange) * 0.2;
                const pullX = distanceX * pullStrength;
                const pullY = distanceY * pullStrength;
                
                // ボタンを少し引き寄せる（既存のアニメーションを考慮）
                ctaButton.style.transform = `
                    translate(${pullX}px, ${pullY}px) 
                    scale(${1 + pullStrength * 0.05})
                `;
            } else {
                // 範囲外ではリセット（アニメーションは維持）
                ctaButton.style.transform = '';
            }
        });

        ctaSection.addEventListener('mouseleave', () => {
            ctaButton.style.transform = '';
        });
    }

    // スクロールトリガーアニメーション
    const observerOptions = {
        threshold: 0.2,
        rootMargin: '0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate');
                
                // 一度だけアニメーションを実行
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    observer.observe(ctaSection);

    // パーティクル追加エフェクト（オプション）
    function createParticle() {
        const particle = document.createElement('div');
        particle.style.cssText = `
            position: absolute;
            width: 2px;
            height: 2px;
            background: rgba(255, 255, 255, 0.5);
            border-radius: 50%;
            pointer-events: none;
            z-index: 1;
        `;
        
        // ランダムな開始位置
        const startX = Math.random() * ctaSection.offsetWidth;
        const startY = ctaSection.offsetHeight;
        
        particle.style.left = startX + 'px';
        particle.style.top = startY + 'px';
        
        ctaSection.appendChild(particle);
        
        // アニメーション
        let y = startY;
        let x = startX;
        let opacity = 0;
        let life = 0;
        const maxLife = 200;
        const speed = Math.random() * 2 + 1;
        
        function updateParticle() {
            life++;
            
            if (life < maxLife) {
                // 上昇と横揺れ
                y -= speed;
                x += Math.sin(life * 0.05) * 2;
                
                // フェードイン・アウト
                if (life < 20) {
                    opacity = life / 20;
                } else if (life > maxLife - 20) {
                    opacity = (maxLife - life) / 20;
                } else {
                    opacity = 1;
                }
                
                particle.style.transform = `translate(${x - startX}px, ${y - startY}px)`;
                particle.style.opacity = opacity * 0.6;
                
                requestAnimationFrame(updateParticle);
            } else {
                particle.remove();
            }
        }
        
        updateParticle();
    }

    // 定期的にパーティクルを生成（パフォーマンスを考慮）
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        setInterval(() => {
            if (isMouseInside && Math.random() > 0.7) {
                createParticle();
            }
        }, 300);
    }

    // タッチデバイス対応
    let touchX = 0;
    let touchY = 0;

    ctaSection.addEventListener('touchstart', (e) => {
        const rect = ctaSection.getBoundingClientRect();
        touchX = e.touches[0].clientX - rect.left;
        touchY = e.touches[0].clientY - rect.top;
        
        // タッチ位置に光のエフェクトを表示
        mouseGradient.style.opacity = '1';
        mouseGradient.style.transform = `translate(${touchX - 300}px, ${touchY - 300}px)`;
    });

    ctaSection.addEventListener('touchmove', (e) => {
        const rect = ctaSection.getBoundingClientRect();
        touchX = e.touches[0].clientX - rect.left;
        touchY = e.touches[0].clientY - rect.top;
        
        mouseGradient.style.transform = `translate(${touchX - 300}px, ${touchY - 300}px)`;
    });

    ctaSection.addEventListener('touchend', () => {
        mouseGradient.style.opacity = '0';
    });
});

// パフォーマンス監視
if (window.performance && performance.mark) {
    performance.mark('cta-animation-loaded');
}