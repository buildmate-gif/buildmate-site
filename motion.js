/* BuildMate 超軽量モーション（記事ページの読了プログレスバーのみ） */
(function () {
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return;
  }

  function initReadProgress() {
    if (!document.body.classList.contains('bm-article-page')) return;

    const bar = document.createElement('div');
    bar.className = 'bm-read-progress';
    bar.setAttribute('aria-hidden', 'true');
    document.body.appendChild(bar);

    let ticking = false;
    function updateBar() {
      ticking = false;
      const doc = document.documentElement;
      const scrollable = doc.scrollHeight - window.innerHeight;
      if (scrollable <= 0) {
        bar.style.transform = 'scaleX(0)';
        return;
      }
      const ratio = Math.min(Math.max(window.scrollY / scrollable, 0), 1);
      bar.style.transform = 'scaleX(' + ratio.toFixed(4) + ')';
    }

    window.addEventListener(
      'scroll',
      function () {
        if (!ticking) {
          ticking = true;
          window.requestAnimationFrame(updateBar);
        }
      },
      { passive: true }
    );
    updateBar();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initReadProgress);
  } else {
    initReadProgress();
  }
})();
