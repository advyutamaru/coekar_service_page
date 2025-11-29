// Voice visualizer - 音声バーを動的生成
(function() {
  const visualizer = document.querySelector('.voice-visualizer');
  if (!visualizer) return;

  // バーの数（レスポンシブ対応）
  const barCount = window.innerWidth <= 768 ? 20 : 30;

  // バーを動的生成
  for (let i = 0; i < barCount; i++) {
    const bar = document.createElement('div');
    bar.className = 'voice-bar';
    // ランダムな遅延でアニメーションを差別化
    bar.style.animationDelay = `${Math.random() * 0.5}s`;
    visualizer.appendChild(bar);
  }

  // ウィンドウリサイズ時に再生成
  let resizeTimer;
  window.addEventListener('resize', function() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function() {
      const currentCount = visualizer.children.length;
      const newCount = window.innerWidth <= 768 ? 20 : 30;

      if (currentCount !== newCount) {
        visualizer.innerHTML = '';
        for (let i = 0; i < newCount; i++) {
          const bar = document.createElement('div');
          bar.className = 'voice-bar';
          bar.style.animationDelay = `${Math.random() * 0.5}s`;
          visualizer.appendChild(bar);
        }
      }
    }, 250);
  });
})();
