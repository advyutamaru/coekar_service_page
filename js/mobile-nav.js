// Mobile navigation toggle
(function() {
  const menuToggle = document.querySelector('.mobile-menu-toggle');
  const navLinks = document.querySelector('.nav-links');

  if (!menuToggle || !navLinks) return;

  // メニュー開閉トグル
  menuToggle.addEventListener('click', function() {
    const isExpanded = menuToggle.getAttribute('aria-expanded') === 'true';

    menuToggle.setAttribute('aria-expanded', !isExpanded);
    menuToggle.setAttribute('aria-label', isExpanded ? 'メニューを開く' : 'メニューを閉じる');
    navLinks.classList.toggle('active');

    // スクロールロック（メニュー開時）
    document.body.style.overflow = isExpanded ? '' : 'hidden';
  });

  // リンククリック時にメニューを閉じる
  const links = navLinks.querySelectorAll('a');
  links.forEach(link => {
    link.addEventListener('click', function() {
      if (window.innerWidth <= 768) {
        menuToggle.setAttribute('aria-expanded', 'false');
        menuToggle.setAttribute('aria-label', 'メニューを開く');
        navLinks.classList.remove('active');
        document.body.style.overflow = '';
      }
    });
  });

  // ウィンドウリサイズ時の処理
  let resizeTimer;
  window.addEventListener('resize', function() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function() {
      if (window.innerWidth > 768) {
        menuToggle.setAttribute('aria-expanded', 'false');
        navLinks.classList.remove('active');
        document.body.style.overflow = '';
      }
    }, 250);
  });
})();
