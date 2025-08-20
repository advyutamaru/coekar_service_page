// パフォーマンス最適化スクリプト

document.addEventListener('DOMContentLoaded', () => {
    // 1. Intersection Observerでアニメーションを制御
    const animatedElements = document.querySelectorAll('[class*="animate"], [class*="fade"], [class*="slide"]');
    
    if ('IntersectionObserver' in window) {
        const animationObserver = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        // 要素が表示されたらアニメーションを有効化
                        entry.target.style.animationPlayState = 'running';
                        entry.target.classList.add('visible');
                    } else {
                        // 要素が非表示になったらアニメーションを停止
                        entry.target.style.animationPlayState = 'paused';
                    }
                });
            },
            {
                threshold: 0.1,
                rootMargin: '50px'
            }
        );
        
        animatedElements.forEach(el => {
            el.style.animationPlayState = 'paused';
            animationObserver.observe(el);
        });
    }
    
    // 2. 画像の遅延読み込み
    const images = document.querySelectorAll('img');
    
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        // data-srcがあれば遅延読み込み
                        if (img.dataset.src) {
                            img.src = img.dataset.src;
                            img.removeAttribute('data-src');
                        }
                        imageObserver.unobserve(img);
                    }
                });
            },
            {
                threshold: 0.01,
                rootMargin: '100px'
            }
        );
        
        images.forEach(img => imageObserver.observe(img));
    }
    
    // 3. RequestIdleCallbackで非重要タスクを遅延実行
    if ('requestIdleCallback' in window) {
        requestIdleCallback(() => {
            // Google Fontsの最適化
            const link = document.querySelector('link[href*="fonts.googleapis.com"]');
            if (link) {
                link.rel = 'preload';
                link.as = 'style';
                link.onload = function() { this.rel = 'stylesheet'; };
            }
        });
    }
    
    // 4. スクロールイベントの最適化（既存のmain.jsを改善）
    let scrollTimer;
    let lastScrollY = window.scrollY;
    let ticking = false;
    
    function updateScroll() {
        const nav = document.querySelector('nav');
        if (!nav) return;
        
        const currentScrollY = window.scrollY;
        
        // スクロール方向を検出
        if (currentScrollY > lastScrollY && currentScrollY > 100) {
            // 下スクロール - ナビを隠す
            nav.style.transform = 'translateY(-100%)';
        } else {
            // 上スクロール - ナビを表示
            nav.style.transform = 'translateY(0)';
        }
        
        // scrolledクラスの管理
        if (currentScrollY > 20) {
            nav.classList.add('scrolled');
        } else {
            nav.classList.remove('scrolled');
        }
        
        lastScrollY = currentScrollY;
        ticking = false;
    }
    
    function requestTick() {
        if (!ticking) {
            window.requestAnimationFrame(updateScroll);
            ticking = true;
        }
    }
    
    // パッシブリスナーでスクロールパフォーマンス向上
    window.addEventListener('scroll', requestTick, { passive: true });
    
    // 5. CSSアニメーションの削減（ユーザー設定を尊重）
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    function handleReducedMotion() {
        if (prefersReducedMotion.matches) {
            document.documentElement.classList.add('reduce-motion');
        } else {
            document.documentElement.classList.remove('reduce-motion');
        }
    }
    
    handleReducedMotion();
    prefersReducedMotion.addListener(handleReducedMotion);
    
    // 6. デバウンス関数でリサイズイベントを最適化
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
    const optimizedResize = debounce(() => {
        // リサイズ時の処理
        console.log('Window resized');
    }, 250);
    
    window.addEventListener('resize', optimizedResize, { passive: true });
    
    // 7. 不要な再レンダリングを防ぐ
    document.addEventListener('touchstart', () => {}, { passive: true });
    document.addEventListener('touchmove', () => {}, { passive: true });
    document.addEventListener('wheel', () => {}, { passive: true });
});