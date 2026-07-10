/* ============================================================
   SCR · pages/home.js
   Persona landing — modernized from the original E2E SCR home:
   welcome hero + mission, four persona cards (click to enter
   the persona view), additional links panel, live posture strip.
   ============================================================ */
window.SCR = window.SCR || {};

(function () {
  'use strict';

  const PERSONAS = [
    {
      key: 'valuestream', name: 'Value Chain / Stream Leader', tag: 'VSL',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M7 12h13"/><path d="M11 18h9"/><circle cx="4" cy="12" r="1"/><circle cx="8" cy="18" r="1"/></svg>',
      q: 'Which products and markets are exposed? Where does recovery outlive survival on my BOMs?',
      stats: p => [[p.products + ' SKUs', 'in scope'], [p.gaps + ' gapped', 'TTR > TTS']]
    },
    {
      key: 'executive', name: 'Risk & Resilience Leader', tag: 'R&R',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></svg>',
      q: 'Where is the largest enterprise exposure? Which nodes and sectors need investment first?',
      stats: p => [[p.avar, 'Wtd. AVAR'], [p.ri + '%', 'enterprise RI']]
    },
    {
      key: 'category', name: 'Category Leader', tag: 'CAT',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 8 12 3 3 8v8l9 5 9-5Z"/><path d="M12 13 3 8"/><path d="m12 13 9-5"/><path d="M12 13v8"/></svg>',
      q: 'Which suppliers and materials drive risk? Where do we need alternates, buffers or new terms?',
      stats: p => [[p.singles + ' sole-src', p.singlesRisky + ' risky'], [p.suppliers, 'suppliers']]
    },
    {
      key: 'site', name: 'SC Site Leader', tag: 'SITE',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21V8l7-5 7 5v13"/><path d="M10 21v-6h4v6"/><path d="M21 21V11l-4-3"/><path d="M3 21h18"/></svg>',
      q: 'Can my site keep running? Which inbound material stops production first, and what is the playbook?',
      stats: p => [[p.plants + ' plants', p.dcs + ' DCs'], [p.siteCrit + ' materials', 'can stop a site']]
    }
  ];

  function render(host) {
    const D = SCR.data, F = SCR.fmt, U = SCR.ui;
    SCR.setCrumbs([{ label: 'Home' }]);

    const stats = {
      products: D.kpis.products,
      gaps: D.kpis.gapMaterials,
      avar: F.usdM(D.kpis.totalAVAR),
      ri: Math.round(D.kpis.enterpriseRI),
      singles: D.kpis.singleSourceCount,
      singlesRisky: D.kpis.singleSourceRisky,
      suppliers: D.suppliers.length,
      plants: D.plants.length,
      dcs: D.dcs.length,
      siteCrit: D.materials.filter(m => m.gap > 0).length
    };

    /* ===== Hero ===== */
    host.appendChild(U.el(`<div class="hero">
      <h1>Welcome to the E2E Supply Chain Resilience Command Center</h1>
      <p><strong>Supply Chain Resilience</strong> creates end-to-end visibility to vulnerabilities by quantifying
      <strong>Value at Risk</strong> across every product, material, supplier, plant, DC and market.
      It focuses mitigation where it protects the most revenue — delivering confident, quantifiable decisions
      before disruption reaches the shelf. Sensing, impact math and mitigation are run continuously by an
      agentic AI layer; humans approve the moves that matter.</p>
      <div class="hero-stats">
        <div class="hero-stat"><div class="hs-val">${F.usdM(D.kpis.totalNTS)}</div><div class="hs-label">NTS in scope</div></div>
        <div class="hero-stat"><div class="hs-val">${F.usdM(D.kpis.totalVAR)}</div><div class="hs-label">Value at risk</div></div>
        <div class="hero-stat"><div class="hs-val">${F.usdM(D.kpis.totalAVAR)}</div><div class="hs-label">Wtd. AVAR</div></div>
        <div class="hero-stat"><div class="hs-val">${D.kpis.enterpriseRI}%</div><div class="hs-label">Enterprise RI</div></div>
        <div class="hero-stat"><div class="hs-val">${D.kpis.nodes}</div><div class="hs-label">Network nodes</div></div>
        <div class="hero-stat"><div class="hs-val">${D.kpis.gapMaterials}</div><div class="hs-label">TTR &gt; TTS components</div></div>
        <div class="hero-stat"><div class="hs-val">${F.usdM(D.kpis.mitigatedYtd)}</div><div class="hs-label">AVAR mitigated YTD</div></div>
      </div>
    </div>`));

    const grid = U.el('<div class="grid grid-12"></div>');
    host.appendChild(grid);

    /* ===== Persona cards ===== */
    const left = U.el('<div class="col-9" style="min-width:0"></div>');
    grid.appendChild(left);
    left.appendChild(U.el(`<div class="section-title">Resilience program personas <small>— click to open the persona-specific cockpit</small></div>`));
    const pGrid = U.el('<div class="persona-grid"></div>');
    left.appendChild(pGrid);
    PERSONAS.forEach(p => {
      const card = U.el(`<button class="persona-card">
        <span class="pc-go"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></svg></span>
        <span class="pc-icon">${p.icon}</span>
        <h3>${p.name}</h3>
        <span class="pc-q">${p.q}</span>
        <span class="pc-stats">${p.stats(stats).map(([b, s]) => `<span class="pc-stat"><b>${b}</b><span>${s}</span></span>`).join('')}</span>
      </button>`);
      card.addEventListener('click', () => SCR.navigate(p.key));
      pGrid.appendChild(card);
    });

    /* What changed this week */
    left.appendChild(U.el('<div class="section-title" style="margin-top:18px">What changed at the 10-Jul refresh</div>'));
    const feedCard = U.card({ title: 'Agent digest', sub: 'the agentic layer, overnight', flush: false });
    feedCard.classList.add('col-12');
    const feedWrap = U.el('<div class="feed"></div>');
    D.feed.slice(0, 5).forEach(f => {
      const a = D.agents.find(x => x.key === f.agent) || { name: f.agent, color: 1 };
      feedWrap.appendChild(U.el(`<div class="feed-item">
        <span style="width:9px;height:9px;border-radius:50%;background:var(--series-${a.color});flex-shrink:0;margin-top:6px"></span>
        <div class="feed-body">
          <span class="f-agent" style="color:var(--series-${a.color})">${U.esc(a.name)}</span>
          <div class="f-text">${f.text}</div>
        </div>
        <span class="feed-time">${U.esc(f.time)} UTC</span>
      </div>`));
    });
    feedCard.querySelector('.card-body').appendChild(feedWrap);
    left.appendChild(feedCard);

    /* ===== Additional links (from the original) ===== */
    const right = U.el('<div class="col-3" style="min-width:0"></div>');
    grid.appendChild(right);
    right.appendChild(U.el('<div class="section-title">Additional links</div>'));
    const linksCard = U.card({ title: 'Risk & resilience workspace', sub: 'guides, portals and related programs', flush: true });
    right.appendChild(linksCard);
    const lp = U.el('<div class="linkpanel"></div>');
    const L = [
      ['RI Matrix guide', 'How the Resilience Index is scored and banded', () => U.riMatrixGuide()],
      ['Metric definitions', 'TTR · TTS · VAR · AVAR · RRE explained', () => U.metricGuide()],
      ['Missing data worklist', '214 components missing TTR after week-27', () => SCR.navigate('quality')],
      ['Scenario Studio', 'Fail any node on the digital twin', () => SCR.navigate('scenario')],
      ['Network Explorer', 'Multi-tier dependency graph', () => SCR.navigate('network')],
      ['Supplier Risk Sensing (SRS)', 'Companion sensing program', () => U.toast('External link', 'SRS opens in the risk workspace.', '')],
      ['Business Continuity Portal', 'BCP playbooks & SOPs', () => U.toast('External link', 'BCP portal opens in the continuity workspace.', '')]
    ];
    L.forEach(([label, sub, go]) => {
      const b = U.el(`<button class="lp-item">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>
        <span>${U.esc(label)}<small>${U.esc(sub)}</small></span>
      </button>`);
      b.addEventListener('click', go);
      lp.appendChild(b);
    });
    linksCard.querySelector('.card-body').appendChild(lp);

    /* Critical alerts mini */
    const alCard = U.card({ title: 'Open critical alerts', sub: 'needs a decision', flush: true });
    alCard.classList.add('mt-16');
    right.appendChild(alCard);
    const crit = D.alerts.filter(a => a.sev === 'critical' && a.status !== 'closed');
    alCard.querySelector('.card-body').appendChild(U.table([
      { h: 'Alert', cell: a => `<span class="cell-main" style="font-size:12.5px">${U.esc(a.title.split(':')[0])}</span><span class="cell-sub">${U.esc(a.type)}</span>` },
      { h: 'VAR', cls: 'num', cell: a => SCR.fmt.usdM(a.exposure) }
    ], crit, a => U.openAlert(a.id)));
  }

  SCR.registerPage('home', {
    title: 'Home',
    render
  });
})();
