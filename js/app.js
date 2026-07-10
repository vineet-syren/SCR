/* ============================================================
   SCR · app.js
   Router with persona tab bar, breadcrumb API, Links dropdown,
   theme toggle, notifications, global search.
   Pages self-register on SCR.pages before this file runs.
   ============================================================ */
window.SCR = window.SCR || {};
SCR.pages = SCR.pages || {};
SCR.registerPage = function (key, page) { SCR.pages[key] = page; };

(function () {
  const icons = {
    home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="m3 10 9-7 9 7v10a1.6 1.6 0 0 1-1.6 1.6H4.6A1.6 1.6 0 0 1 3 20Z"/><path d="M9 21v-7h6v7"/></svg>',
    executive: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></svg>',
    valuestream: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M7 12h13"/><path d="M11 18h9"/><circle cx="4" cy="12" r="1"/><circle cx="8" cy="18" r="1"/></svg>',
    category: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M21 8 12 3 3 8v8l9 5 9-5Z"/><path d="M12 13 3 8"/><path d="m12 13 9-5"/><path d="M12 13v8"/></svg>',
    site: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21V8l7-5 7 5v13"/><path d="M10 21v-6h4v6"/><path d="M21 21V11l-4-3"/><path d="M3 21h18"/></svg>',
    network: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><circle cx="5" cy="6" r="2.1"/><circle cx="19" cy="6" r="2.1"/><circle cx="12" cy="12" r="2.5"/><circle cx="5" cy="18" r="2.1"/><circle cx="19" cy="18" r="2.1"/><path d="M6.8 7.3 10 10.4M17.2 7.3 14 10.4M6.8 16.7 10 13.6M17.2 16.7 14 13.6"/></svg>',
    scenario: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><path d="M6 3v12"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="6" r="3"/><path d="M18 9a9 9 0 0 1-9 9"/></svg>',
    actions: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2 2 20h20Z"/><path d="M12 9v5"/><path d="M12 17.5v.5"/></svg>',
    agents: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="8" width="16" height="12" rx="3"/><path d="M12 8V4"/><circle cx="12" cy="3" r="1.2"/><circle cx="9" cy="14" r="1.2"/><circle cx="15" cy="14" r="1.2"/><path d="M9 17.5h6"/></svg>',
    quality: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2 20 6.5V13c0 4.5-3.5 8-8 9-4.5-1-8-4.5-8-9V6.5Z"/><path d="m9 12 2 2 4-4.5"/></svg>'
  };

  const navModel = [
    { key: 'home', label: 'Home' },
    { key: 'executive', label: 'Executive Summary', persona: 'R&R' },
    { key: 'valuestream', label: 'Value Streams', persona: 'VSL' },
    { key: 'category', label: 'Category Leader', persona: 'CAT' },
    { key: 'site', label: 'SC Site Leader', persona: 'SITE' },
    { sep: true },
    { key: 'network', label: 'Network' },
    { key: 'scenario', label: 'Scenario Studio' },
    { key: 'actions', label: 'Alerts & Actions', badge: () => SCR.data.alerts.filter(a => a.sev === 'critical' && a.status !== 'closed').length },
    { key: 'agents', label: 'AI Agents', badge: () => SCR.data.recommendations.filter(r => r.status === 'pending').length },
    { key: 'quality', label: 'Data Quality' }
  ];

  /* ---------------- Breadcrumbs ---------------- */
  /** parts: [{label, key?, opts?}], scope: 'Sector: All ; …' */
  function setCrumbs(parts, scope) {
    const host = document.getElementById('crumbTrail');
    host.innerHTML = '';
    (parts || []).forEach((p, i) => {
      if (i) host.appendChild(SCR.ui.el('<span class="crumb-sep">/</span>'));
      if (p.key) {
        const b = SCR.ui.el(`<button class="crumb-link">${SCR.ui.esc(p.label)}</button>`);
        b.addEventListener('click', () => navigate(p.key, p.opts || {}));
        host.appendChild(b);
      } else {
        host.appendChild(SCR.ui.el(`<span class="crumb-here">${SCR.ui.esc(p.label)}</span>`));
      }
    });
    if (scope) host.appendChild(SCR.ui.el(`<span class="crumb-scope">· ${SCR.ui.esc(scope)}</span>`));
  }
  SCR.setCrumbs = setCrumbs;

  /* ---------------- Router ---------------- */
  function navigate(key, opts) {
    const page = SCR.pages[key];
    if (!page) return;
    document.querySelectorAll('.tab').forEach(n =>
      n.classList.toggle('active', n.dataset.key === key));
    setCrumbs([{ label: 'Home', key: 'home' }, { label: page.title }]); // default; pages may override
    SCR.charts.disposeAll();
    const host = document.getElementById('page');
    host.innerHTML = '';
    document.getElementById('pageScroll').scrollTop = 0;
    page.render(host, opts || {});
    requestAnimationFrame(() => SCR.charts.resizeAll());
  }
  SCR.navigate = navigate;

  function buildNav() {
    const nav = document.getElementById('tabbar');
    nav.innerHTML = '';
    navModel.forEach(item => {
      if (item.sep) { nav.appendChild(SCR.ui.el('<span class="tab-sep"></span>')); return; }
      const badge = item.badge ? item.badge() : 0;
      const btn = SCR.ui.el(`<button class="tab" data-key="${item.key}">
        ${icons[item.key] || ''}<span>${item.label}</span>
        ${badge ? `<span class="tab-badge">${badge}</span>` : (item.persona ? `<span class="tab-persona">${item.persona}</span>` : '')}
      </button>`);
      btn.addEventListener('click', () => navigate(item.key));
      nav.appendChild(btn);
    });
  }

  /* ---------------- Links dropdown ---------------- */
  function initLinks() {
    const menu = document.getElementById('linksMenu');
    const btn = document.getElementById('linksBtn');
    const items = [
      { head: 'Guides' },
      { label: 'RI Matrix guide', icon: 'grid', go: () => SCR.ui.riMatrixGuide() },
      { label: 'Metric definitions (TTR · TTS · VAR · AVAR · RRE)', icon: 'book', go: () => SCR.ui.metricGuide() },
      { head: 'Data' },
      { label: 'Missing data worklist', icon: 'alert', go: () => navigate('quality') },
      { label: 'Refresh & pipeline log', icon: 'clock', go: () => navigate('quality') },
      { head: 'Related programs' },
      { label: 'Supplier Risk Sensing (SRS)', icon: 'ext', go: () => SCR.ui.toast('External link', 'SRS — Supplier Risk Sensing opens in the risk workspace.', '') },
      { label: 'Business Continuity Portal (BCP)', icon: 'ext', go: () => SCR.ui.toast('External link', 'BCP portal opens in the continuity workspace.', '') }
    ];
    const ic = {
      grid: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>',
      book: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V2H6.5A2.5 2.5 0 0 0 4 4.5Z"/><path d="M20 22H6.5a2.5 2.5 0 0 1 0-5"/></svg>',
      alert: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 8v5"/><path d="M12 16.5v.5"/></svg>',
      clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>',
      ext: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M21 14v6a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h6"/></svg>'
    };
    menu.innerHTML = '';
    items.forEach(it => {
      if (it.head) { menu.appendChild(SCR.ui.el(`<div class="lm-head">${it.head}</div>`)); return; }
      const b = SCR.ui.el(`<button>${ic[it.icon] || ''}<span>${it.label}</span></button>`);
      b.addEventListener('click', () => { menu.classList.remove('open'); it.go(); });
      menu.appendChild(b);
    });
    btn.addEventListener('click', e => { e.stopPropagation(); menu.classList.toggle('open'); });
    document.addEventListener('click', e => {
      if (!document.getElementById('linksDd').contains(e.target)) menu.classList.remove('open');
    });
  }

  /* ---------------- Theme ---------------- */
  function initTheme() {
    const saved = localStorage.getItem('scr-theme');
    if (saved) document.body.setAttribute('data-theme', saved);
    const btn = document.getElementById('themeToggle');
    const sync = () => {
      const dark = document.body.getAttribute('data-theme') === 'dark';
      btn.querySelector('.ic-moon').style.display = dark ? 'none' : 'block';
      btn.querySelector('.ic-sun').style.display = dark ? 'block' : 'none';
    };
    sync();
    btn.addEventListener('click', () => {
      const next = document.body.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      document.body.setAttribute('data-theme', next);
      localStorage.setItem('scr-theme', next);
      sync();
      SCR.charts.rerenderAll();
    });
  }

  /* ---------------- Notifications ---------------- */
  function initNotifications() {
    const panel = document.getElementById('notifPanel');
    const sevColor = { critical: 'var(--status-critical)', high: 'var(--status-serious)', medium: 'var(--status-warning)' };
    panel.innerHTML = `
      <div class="notif-head">Alerts <span>ranked by impact × urgency</span></div>
      <div class="notif-list">${SCR.data.notifications.map(n => `
        <div class="notif-item">
          <span class="n-dot" style="background:${sevColor[n.sev] || 'var(--ink-3)'}"></span>
          <div class="n-body">${n.text}<span class="n-time">${n.time} UTC</span></div>
        </div>`).join('')}
      </div>`;
    const btn = document.getElementById('notifBtn');
    btn.addEventListener('click', e => {
      e.stopPropagation();
      panel.classList.toggle('open');
      document.getElementById('notifDot').style.display = 'none';
    });
    document.addEventListener('click', e => {
      if (!panel.contains(e.target)) panel.classList.remove('open');
    });
  }

  /* ---------------- Global search ---------------- */
  function initSearch() {
    const input = document.getElementById('globalSearch');
    const results = document.getElementById('searchResults');
    function run(q) {
      q = q.trim().toLowerCase();
      if (q.length < 2) { results.classList.remove('open'); return; }
      const hits = [];
      SCR.data.products.forEach(p => {
        if ((p.name + p.brand + p.stream).toLowerCase().includes(q))
          hits.push({ type: 'Product', label: p.name, sub: p.sectorName + ' · ' + p.stream, go: () => SCR.ui.openProduct(p.id) });
      });
      SCR.data.suppliers.forEach(s => {
        if ((s.name + s.city + s.country).toLowerCase().includes(q))
          hits.push({ type: 'Supplier', label: s.name, sub: s.city + ', ' + s.country, go: () => SCR.ui.openSupplier(s.id) });
      });
      SCR.data.materials.forEach(m => {
        if ((m.name + m.sub).toLowerCase().includes(q))
          hits.push({ type: 'Material', label: m.name, sub: m.sub, go: () => SCR.ui.openMaterial(m.id) });
      });
      SCR.data.plants.concat(SCR.data.dcs).forEach(s => {
        if (s.name.toLowerCase().includes(q))
          hits.push({ type: 'Site', label: s.name, sub: s.focus || s.region, go: () => SCR.ui.openSite(s.id) });
      });
      SCR.data.alerts.forEach(a => {
        if ((a.title + a.type).toLowerCase().includes(q))
          hits.push({ type: 'Alert', label: a.title, sub: a.type, go: () => SCR.ui.openAlert(a.id) });
      });
      results.innerHTML = hits.slice(0, 9).map((h, i) =>
        `<button class="search-hit" data-i="${i}"><span class="hit-type">${h.type}</span><span>${SCR.ui.esc(h.label)}<span class="cell-sub">${SCR.ui.esc(h.sub)}</span></span></button>`
      ).join('') || '<div class="empty">No matches</div>';
      results.querySelectorAll('.search-hit').forEach((b, i) => {
        b.addEventListener('click', () => {
          hits[i].go();
          results.classList.remove('open');
          input.value = '';
        });
      });
      results.classList.add('open');
    }
    input.addEventListener('input', () => run(input.value));
    input.addEventListener('focus', () => run(input.value));
    document.addEventListener('click', e => {
      if (!e.target.closest('.global-search')) results.classList.remove('open');
    });
  }

  /* ---------------- Overlays ---------------- */
  function initOverlays() {
    document.getElementById('drawerClose').addEventListener('click', SCR.ui.closeDrawer);
    document.getElementById('drawerScrim').addEventListener('click', SCR.ui.closeDrawer);
    document.getElementById('modalClose').addEventListener('click', SCR.ui.closeModal);
    document.getElementById('modalScrim').addEventListener('click', e => {
      if (e.target === document.getElementById('modalScrim')) SCR.ui.closeModal();
    });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') { SCR.ui.closeDrawer(); SCR.ui.closeModal(); SCR.copilot && SCR.copilot.close(); }
    });
  }

  /* ---------------- Boot ---------------- */
  document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    buildNav();
    initLinks();
    initNotifications();
    initSearch();
    initOverlays();
    if (SCR.copilot && SCR.copilot.init) SCR.copilot.init();
    navigate('home');
  });
})();
