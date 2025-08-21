// パーティクル集合アニメーション
document.addEventListener('DOMContentLoaded', function() {
    const heroTitle = document.querySelector('.hero-title');
    if (!heroTitle) return;
    
    const originalText = heroTitle.textContent;
    const chars = originalText.split('');
    
    // タイトルをクリアして再構築
    heroTitle.textContent = '';
    heroTitle.classList.add('particle-title');
    
    // 各文字をspan要素に分割
    chars.forEach((char, index) => {
        const span = document.createElement('span');
        span.textContent = char;
        span.classList.add('particle-char');
        span.style.setProperty('--char-index', index);
        
        // パーティクルを生成
        if (char !== '、' && char !== '。' && char !== ' ') {
            // 各文字に対して複数のパーティクルを生成
            const isMobile = window.innerWidth <= 768;
            const baseCount = isMobile ? 30 : 50;
            const particleCount = Math.min(8, Math.floor(baseCount / chars.length)); // パフォーマンスを考慮
            const particleContainer = document.createElement('span');
            particleContainer.classList.add('particle-container');
            
            for (let i = 0; i < particleCount; i++) {
                const particle = document.createElement('span');
                particle.classList.add('particle');
                particle.style.setProperty('--particle-index', i);
                
                // シンプルな円形配置（軽量化）
                const angle = (Math.PI * 2 * i) / particleCount;
                const distance = 100 + Math.random() * 100;
                const startX = Math.cos(angle) * distance;
                const startY = Math.sin(angle) * distance;
                
                // パーティクルのサイズを固定（パフォーマンス向上）
                const size = 2;
                const opacity = 0.6;
                
                particle.style.setProperty('--start-x', `${startX}px`);
                particle.style.setProperty('--start-y', `${startY}px`);
                particle.style.setProperty('--size', `${size}px`);
                particle.style.setProperty('--opacity', opacity);
                particle.style.setProperty('--delay', `${index * 0.1 + (i * 0.05)}s`);
                
                particleContainer.appendChild(particle);
            }
            
            span.appendChild(particleContainer);
        }
        
        heroTitle.appendChild(span);
    });
    
    // Intersection Observerでアニメーション開始
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !entry.target.classList.contains('animated')) {
                entry.target.classList.add('animated');
                
                // パーティクルアニメーションを開始
                const particles = entry.target.querySelectorAll('.particle');
                const chars = entry.target.querySelectorAll('.particle-char');
                
                // パーティクルを集結させる
                particles.forEach(particle => {
                    particle.classList.add('gathering');
                });
                
                // 文字を表示（アニメーション後に滑らかに表示）
                chars.forEach((char, index) => {
                    setTimeout(() => {
                        char.classList.add('formed');
                    }, 1500 + index * 60);
                });
            }
        });
    }, {
        threshold: 0.3,
        rootMargin: '0px 0px -10% 0px'
    });
    
    observer.observe(heroTitle);
    
    // パフォーマンス最適化
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    if (prefersReducedMotion) {
        // アニメーションを無効化
        const particles = heroTitle.querySelectorAll('.particle');
        const chars = heroTitle.querySelectorAll('.particle-char');
        
        particles.forEach(particle => {
            particle.style.display = 'none';
        });
        
        chars.forEach(char => {
            char.style.opacity = '1';
            char.style.transform = 'none';
        });
    }
});