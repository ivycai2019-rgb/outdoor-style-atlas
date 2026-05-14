// 个人标记交互 + localStorage 持久化
(function () {
  const opts = document.querySelectorAll('.marker-panel .opt');
  const statusEl = document.querySelector('.marker-panel .current-status');
  if (!statusEl) return;

  const statusLabel = statusEl.querySelector('span:last-child');
  const dot = document.querySelector('.marker-panel .dot');
  const root = getComputedStyle(document.documentElement);

  const colorMap = {
    core:      root.getPropertyValue('--status-core'),
    favorite:  root.getPropertyValue('--status-favorite'),
    reference: root.getPropertyValue('--status-reference'),
    pending:   root.getPropertyValue('--status-pending'),
    exclude:   root.getPropertyValue('--status-exclude'),
  };
  const labelMap = {
    core:      '核心',
    favorite:  '偏好',
    reference: '借鉴',
    pending:   '待定',
    exclude:   '排除',
  };

  // 用页面文件名作为 key,例如 "style-song.html"
  const pageKey = (location.pathname.split('/').pop() || 'unknown')
    .replace(/[#?].*$/, '');
  const storeKey = 'styleMark:' + pageKey;

  function applyMark(mark) {
    opts.forEach(b => b.classList.toggle('active', b.dataset.mark === mark));
    statusLabel.textContent = labelMap[mark];
    statusEl.classList.remove('muted');
    dot.classList.remove('empty');
    dot.style.background = (colorMap[mark] || '').trim();
  }

  function clearMark() {
    opts.forEach(b => b.classList.remove('active'));
    statusLabel.textContent = '未标记';
    statusEl.classList.add('muted');
    dot.classList.add('empty');
    dot.style.background = '';
  }

  // 1. 页面加载时读取已有标记
  try {
    const saved = localStorage.getItem(storeKey);
    if (saved && labelMap[saved]) {
      applyMark(saved);
    }
  } catch (e) { /* 隐私模式或被禁用 */ }

  // 2. 点击事件:再次点同一项 = 取消标记
  opts.forEach(btn => {
    btn.addEventListener('click', () => {
      const m = btn.dataset.mark;
      const isActive = btn.classList.contains('active');
      if (isActive) {
        clearMark();
        try { localStorage.removeItem(storeKey); } catch (e) {}
      } else {
        applyMark(m);
        try { localStorage.setItem(storeKey, m); } catch (e) {}
      }
    });
  });
})();
