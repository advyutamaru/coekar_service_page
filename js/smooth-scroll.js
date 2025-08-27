// スムーズスクロール機能
document.addEventListener('DOMContentLoaded', function() {
    // フォームセクションへのスムーズスクロール
    const scrollLinks = document.querySelectorAll('a[href^="#"]');
    
    scrollLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            
            // #のみの場合はスキップ
            if (href === '#') return;
            
            const targetElement = document.querySelector(href);
            if (targetElement) {
                e.preventDefault();
                
                // ナビゲーションの高さを考慮
                const navHeight = document.querySelector('nav')?.offsetHeight || 0;
                const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - navHeight - 20;
                
                // スムーズスクロール
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
                
                // URLハッシュを更新（履歴に残す）
                if (history.pushState) {
                    history.pushState(null, null, href);
                }
            }
        });
    });
    
    // ページ読み込み時にハッシュがある場合の処理
    if (window.location.hash) {
        setTimeout(() => {
            const targetElement = document.querySelector(window.location.hash);
            if (targetElement) {
                const navHeight = document.querySelector('nav')?.offsetHeight || 0;
                const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - navHeight - 20;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        }, 100);
    }
    
    // スクロール位置に応じてナビゲーションのアクティブ状態を更新
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-links a[href^="#"]');
    
    function updateActiveNav() {
        const scrollPosition = window.pageYOffset + 100;
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            const sectionId = section.getAttribute('id');
            
            if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                navLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === '#' + sectionId) {
                        link.classList.add('active');
                    }
                });
            }
        });
    }
    
    // スクロール時にアクティブ状態を更新
    let scrollTimer;
    window.addEventListener('scroll', () => {
        if (scrollTimer) clearTimeout(scrollTimer);
        scrollTimer = setTimeout(updateActiveNav, 10);
    });
    
    // 初期状態の設定
    updateActiveNav();
});

// フォームセクションが表示されたときにアニメーション
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        }
    });
}, observerOptions);

// フォームセクションを監視
document.addEventListener('DOMContentLoaded', () => {
    const formSection = document.querySelector('.contact-form');
    if (formSection) {
        observer.observe(formSection);
    }
});