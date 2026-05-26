/* ============================================
   System Page — 横向滚动风格列 + 自选对比
   每列 = 一个风格的「封面 + 中英名 + 核心气质 + 5 识别点 + 5 核心特征」
   右上角复选框可勾选 2-4 个,跳 compare.html 看横向对比表
   ============================================ */
(function () {
  const MARK_LABEL = { '★': 'core', '◎': 'supplement', '△': 'edge' };
  const MARK_CN = { '★': '核心风格', '◎': '补充风格', '△': '边缘风格' };
  const MARK_ORDER = { '★': 0, '◎': 1, '△': 2 };

  const FEATURE_KEYS = ['空间结构', '动线 / 视线', '植物语言', '色彩系统', '材料系统'];

  // 个人标记选项（与风格详情页的 style-page.js 共用 localStorage key: styleMark:<href>）
  const PERSONAL_MARKS = [
    { key: 'core',      label: '核心' },
    { key: 'favorite',  label: '偏好' },
    { key: 'reference', label: '借鉴' },
    { key: 'pending',   label: '待定' },
    { key: 'exclude',   label: '排除' },
  ];
  const MARK_STORE_PREFIX = 'styleMark:';

  // 稳定排序:★ → ◎ → △
  const rawStyles = window.SYSTEM_STYLES || [];
  const styles = rawStyles.map((s, i) => ({ ...s, _origIdx: i }))
    .sort((a, b) => {
      const ra = MARK_ORDER[a.mark] ?? 9;
      const rb = MARK_ORDER[b.mark] ?? 9;
      if (ra !== rb) return ra - rb;
      return a._origIdx - b._origIdx;
    });

  // 体系唯一 key,用于 sessionStorage 命名空间;若 system 页未设置则用文件名
  const SYS_KEY = window.SYSTEM_KEY ||
    (location.pathname.split('/').pop() || 'sys').replace(/\.html?$/, '');

  const scrollEl = document.getElementById('styleScroll');
  if (!scrollEl) return;

  // 已选索引(对应 styles 排序后的 idx)
  const selected = new Set();
  const MAX_SELECT = 4;

  /* ============================================
     抽取详情数据
     ============================================ */
  async function fetchStyleData(s) {
    if (s._cache) return s._cache;
    if (s.detail) { s._cache = s.detail; return s.detail; }
    try {
      const html = await fetch(s.href).then(r => r.text());
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const data = {};
      doc.querySelectorAll('.intro .kp').forEach(kp => {
        const lab = (kp.querySelector('.kp-label') || {}).textContent || '';
        const txt = (kp.querySelector('.kp-text') || {}).innerHTML || '';
        if (lab.trim() === '核心气质') data['核心气质'] = txt.trim();
      });
      doc.querySelectorAll('.features .feat-row').forEach(r => {
        const k = ((r.querySelector('.feat-key') || {}).textContent || '').trim();
        if (!k) return;
        const valEl = r.querySelector('.feat-val');
        if (!valEl) return;
        const plantLines = valEl.querySelectorAll('.plant-line');
        if (plantLines.length > 0) {
          const parts = Array.from(plantLines).map(pl => {
            const lab = (pl.querySelector('b') || {}).textContent || '';
            const span = (pl.querySelector('span') || {}).innerHTML || '';
            return `<b>${lab}</b>:${span}`;
          });
          data[k] = parts.join('<br>');
        } else {
          data[k] = valEl.innerHTML.trim();
        }
      });
      const recogs = doc.querySelectorAll('.recognize .recognize-text');
      data['识别点列表'] = Array.from(recogs).map(r => r.innerHTML.trim());
      s._cache = data;
      return data;
    } catch (err) {
      return { error: '加载失败' };
    }
  }

  /* ============================================
     渲染一列
     ============================================ */
  function buildColumn(s, idx) {
    const markClass = MARK_LABEL[s.mark] || 'edge';
    const markLabel = MARK_CN[s.mark] || '';
    const coverHTML = s.cover
      ? `<img src="${s.cover}" alt="${s.cn}" loading="lazy">`
      : `<div class="placeholder-cover">${s.cn} · 印象图</div>`;

    const col = document.createElement('article');
    col.className = 'style-col' + (s.href ? '' : ' empty');
    col.dataset.idx = idx;

    col.innerHTML = `
      <div class="col-cover">
        ${coverHTML}
        ${markLabel ? `<span class="badge-mark ${markClass}">${markLabel}</span>` : ''}
        ${s.href ? `<button type="button" class="col-compare-btn" data-idx="${idx}" title="加入对比"><span class="col-compare-text">+ 加入对比</span></button>` : ''}
      </div>
      <div class="col-head">
        ${s.href
          ? `<a class="col-head-link" href="${s.href}" title="查看详情">
              <div class="col-title">
                <span class="col-cn">${s.cn}</span>
                <span class="col-arrow">→</span>
              </div>
              <div class="col-en">${s.en}</div>
            </a>`
          : `<div class="col-title"><span class="col-cn">${s.cn}</span></div>
             <div class="col-en">${s.en}</div>`
        }
      </div>
      ${s.href ? `
      <div class="col-section col-mymark">
        <div class="col-section-label">个人标记 / My Mark</div>
        <div class="col-mymark-row" data-href="${s.href}">
          ${PERSONAL_MARKS.map(m => `
            <button type="button" class="col-mark-btn" data-mark="${m.key}">${m.label}</button>
          `).join('')}
        </div>
      </div>` : ''}
      <div class="col-section col-mood">
        <div class="col-section-label">核心气质</div>
        <div class="col-section-body" data-slot="核心气质">${s.href ? '加载中…' : (s.def || '—')}</div>
      </div>
      <div class="col-section col-recog">
        <div class="col-section-label">风格识别点 / How to Recognize</div>
        <ol class="col-recog-list" data-slot="识别点列表"><li class="loading">加载中…</li></ol>
      </div>
      <div class="col-section col-feat">
        <div class="col-section-label">核心特征 / Core Features</div>
        <dl class="col-feat-list">
          ${FEATURE_KEYS.map(k => `
            <dt>${k}</dt>
            <dd data-slot="${k}">${s.href ? '加载中…' : '—'}</dd>
          `).join('')}
        </dl>
      </div>
    `;
    return col;
  }

  // 同步卡片上的个人标记按钮状态（从 localStorage 读取）
  function syncMarkButtons(rowEl) {
    const href = rowEl.dataset.href;
    let saved = null;
    try { saved = localStorage.getItem(MARK_STORE_PREFIX + href); } catch (e) {}
    rowEl.querySelectorAll('.col-mark-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.mark === saved);
    });
  }

  // 刷新体系页顶部的 MARKED 单元（X / Y 已标记 + 各类小色点）
  function refreshMarkedCell() {
    const cell = document.getElementById('markedCell');
    if (!cell) return;
    const total = styles.filter(s => s.href).length;
    const counts = { core: 0, favorite: 0, reference: 0, pending: 0, exclude: 0 };
    let marked = 0;
    styles.forEach(s => {
      if (!s.href) return;
      let v = null;
      try { v = localStorage.getItem(MARK_STORE_PREFIX + s.href); } catch (e) {}
      if (v && counts.hasOwnProperty(v)) { counts[v]++; marked++; }
    });
    if (marked === 0) {
      cell.textContent = '未标记';
      return;
    }
    const dots = PERSONAL_MARKS
      .filter(m => counts[m.key] > 0)
      .map(m => `<span class="marked-dot ${m.key}" title="${m.label} ${counts[m.key]}">${counts[m.key]}</span>`)
      .join('');
    cell.innerHTML = `<span class="marked-summary">${marked} / ${total} 已标记</span><span class="marked-dots">${dots}</span>`;
  }

  // 给卡片上的个人标记按钮绑定点击
  function bindMarkButtons(rowEl) {
    const href = rowEl.dataset.href;
    rowEl.querySelectorAll('.col-mark-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const mark = btn.dataset.mark;
        const isActive = btn.classList.contains('active');
        try {
          if (isActive) {
            localStorage.removeItem(MARK_STORE_PREFIX + href);
          } else {
            localStorage.setItem(MARK_STORE_PREFIX + href, mark);
          }
        } catch (e) {}
        syncMarkButtons(rowEl);
        refreshMarkedCell();
      });
    });
    syncMarkButtons(rowEl);
  }

  function fillColumn(colEl, data) {
    if (data.error) {
      colEl.querySelectorAll('[data-slot]').forEach(el => {
        el.innerHTML = '<span style="color:var(--status-pending);font-size:12px;">需要 http 服务访问</span>';
      });
      return;
    }
    const moodEl = colEl.querySelector('[data-slot="核心气质"]');
    if (moodEl) moodEl.innerHTML = data['核心气质'] || '—';
    const recogEl = colEl.querySelector('[data-slot="识别点列表"]');
    if (recogEl) {
      const list = data['识别点列表'] || [];
      recogEl.innerHTML = list.length === 0
        ? '<li>—</li>'
        : list.map(item => `<li>${item}</li>`).join('');
    }
    FEATURE_KEYS.forEach(k => {
      const el = colEl.querySelector(`[data-slot="${CSS.escape(k)}"]`);
      if (el) {
        let v = data[k] || '—';
        if (typeof v === 'string' && v.length > 240) v = v.slice(0, 240) + '…';
        el.innerHTML = v;
      }
    });
  }

  /* ============================================
     浮动对比条
     ============================================ */
  let barEl = null;
  function ensureBar() {
    if (barEl) return barEl;
    barEl = document.createElement('div');
    barEl.className = 'compare-bar';
    barEl.innerHTML = `
      <span class="compare-bar-count">0 / ${MAX_SELECT}</span>
      <span class="compare-bar-list"></span>
      <button class="compare-bar-clear" type="button">清空</button>
      <button class="compare-bar-go" type="button">查看对比 →</button>
    `;
    document.body.appendChild(barEl);
    barEl.querySelector('.compare-bar-clear').addEventListener('click', clearAll);
    barEl.querySelector('.compare-bar-go').addEventListener('click', goCompare);
    return barEl;
  }

  function updateBar() {
    if (selected.size === 0) {
      if (barEl) barEl.classList.remove('visible');
      return;
    }
    const bar = ensureBar();
    bar.classList.add('visible');
    bar.querySelector('.compare-bar-count').textContent = `${selected.size} / ${MAX_SELECT}`;
    bar.querySelector('.compare-bar-list').textContent =
      Array.from(selected).map(i => styles[i].cn).join(' · ');
    bar.querySelector('.compare-bar-go').disabled = selected.size < 2;
  }

  function clearAll() {
    selected.clear();
    document.querySelectorAll('.col-compare-btn').forEach(btn => {
      btn.classList.remove('on');
      btn.querySelector('.col-compare-text').textContent = '+ 加入对比';
    });
    document.querySelectorAll('.style-col.compare-on').forEach(c => c.classList.remove('compare-on'));
    updateBar();
  }

  function goCompare() {
    if (selected.size < 2) return;
    // 把当前 styles(带 detail)存进 sessionStorage,compare 页直接读
    const payload = Array.from(selected).map(i => ({
      cn: styles[i].cn,
      en: styles[i].en,
      mark: styles[i].mark,
      href: styles[i].href,
      cover: styles[i].cover,
      detail: styles[i].detail || styles[i]._cache || null,
    }));
    try {
      sessionStorage.setItem('compare:' + SYS_KEY, JSON.stringify(payload));
    } catch (e) {}
    location.href = 'compare.html?sys=' + encodeURIComponent(SYS_KEY);
  }

  /* ============================================
     启动
     ============================================ */
  async function render() {
    const cols = styles.map((s, i) => {
      const col = buildColumn(s, i);
      scrollEl.appendChild(col);
      return { s, col, i };
    });

    // 绑定个人标记按钮
    scrollEl.querySelectorAll('.col-mymark-row').forEach(bindMarkButtons);
    refreshMarkedCell();

    // 页面回到前台时刷新一次（用户可能在详情页改过标记）
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        scrollEl.querySelectorAll('.col-mymark-row').forEach(syncMarkButtons);
        refreshMarkedCell();
      }
    });

    // 绑定"加入对比"按钮
    scrollEl.querySelectorAll('.col-compare-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const idx = +btn.dataset.idx;
        const card = btn.closest('.style-col');
        const textEl = btn.querySelector('.col-compare-text');
        const isOn = btn.classList.contains('on');
        if (!isOn) {
          if (selected.size >= MAX_SELECT) {
            alert(`最多同时对比 ${MAX_SELECT} 个风格`);
            return;
          }
          selected.add(idx);
          btn.classList.add('on');
          textEl.textContent = '已加入 ✓';
          card.classList.add('compare-on');
        } else {
          selected.delete(idx);
          btn.classList.remove('on');
          textEl.textContent = '+ 加入对比';
          card.classList.remove('compare-on');
        }
        updateBar();
      });
    });

    // 异步并行拉数据填充
    await Promise.all(cols.map(async ({ s, col }) => {
      if (!s.href) return;
      const data = await fetchStyleData(s);
      fillColumn(col, data);
    }));
  }

  render();
})();
