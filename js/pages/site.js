/* ============================================================
   SCR · pages/site.js
   SC Site Leader — persona cockpit, modernized from the
   original supply-resilience site dashboard:
   · Site picker ("Which site are you interested in exploring?")
   · Site dashboard — KPI strip · critical materials by TTS ·
     inventory runway · inbound supplier risk · risk factors ·
     continuity playbooks · outage simulation hand-off
   ============================================================ */
window.SCR = window.SCR || {};

(function () {
  'use strict';

  const state = { site: null };

  const SITE_FACTORS = {
    PT1: { Weather: 2.6, Labor: 1.8, Utilities: 1.6, Cyber: 2.1, Quality: 1.7, Logistics: 2.0 },
    PT2: { Weather: 2.2, Labor: 3.1, Utilities: 2.4, Cyber: 2.0, Quality: 2.3, Logistics: 2.6 },
    PT3: { Weather: 1.7, Labor: 2.4, Utilities: 3.2, Cyber: 2.2, Quality: 1.8, Logistics: 2.1 },
    PT4: { Weather: 1.9, Labor: 2.2, Utilities: 2.6, Cyber: 1.9, Quality: 2.0, Logistics: 2.3 },
    PT5: { Weather: 3.8, Labor: 2.6, Utilities: 3.0, Cyber: 2.4, Quality: 2.2, Logistics: 3.2 },
    PT6: { Weather: 3.9, Labor: 2.8, Utilities: 2.9, Cyber: 2.7, Quality: 2.6, Logistics: 3.4 },
    PT7: { Weather: 2.8, Labor: 2.3, Utilities: 2.2, Cyber: 3.3, Quality: 2.4, Logistics: 3.0 },
    PT8: { Weather: 3.2, Labor: 2.9, Utilities: 2.5, Cyber: 2.1, Quality: 2.0, Logistics: 2.7 }
  };

  const PLAYBOOKS = {
    PT1: [
      ['Backup power', 'Dual feed + 2 MW generators tested Q2', 'ready'],
      ['Alternate site', 'São Paulo absorbs 30% of canning volume', 'ready'],
      ['Emergency closures buy', 'Spot contract drafted with Thai Cap Co.', 'in progress'],
      ['Labor contingency', 'Cross-trained crew pool 14%', 'gap']
    ],
    PT5: [
      ['Monsoon SOP', 'Raised dock + flood barriers · drilled 12 Jun', 'ready'],
      ['Alternate site', 'Atlanta covers isotonic exports (2-wk switch)', 'in progress'],
      ['Closures buffer', 'Building 7d → 21d under ACT-119', 'in progress'],
      ['Water utility backup', 'Borewell + tanker contract', 'ready']
    ],
    PT6: [
      ['Typhoon SOP', 'Shutter protocol + 48h pre-stage', 'ready'],
      ['Alternate site', 'Shenzhen line rebalance playbook (14d)', 'ready'],
      ['MCU air-bridge', 'Pending approval R-202', 'in progress'],
      ['Cell screening', '100% incoming inspection under ACT-127', 'in progress']
    ],
    PT8: [
      ['Frost response', 'Forward-buy trigger at 40% probability', 'in progress'],
      ['OJ air-bridge', 'Reefer rotation ACT-125 — overdue', 'gap'],
      ['Alternate carton feed', 'NordCarton allocation letter signed', 'ready'],
      ['Power resilience', 'Solar + grid dual feed', 'ready']
    ]
  };
  const DEFAULT_PB = [
    ['Backup power', 'Generator capacity verified this quarter', 'ready'],
    ['Alternate site', 'Volume-transfer playbook on file', 'ready'],
    ['Buffer stock', 'Safety-stock policy at target', 'in progress'],
    ['Emergency logistics', 'Air/rail alternates pre-negotiated', 'ready']
  ];

  /* =====================================================
     VIEW 1 · Site picker (from the original flow)
     ===================================================== */
  function renderPicker(host) {
    const D = SCR.data, F = SCR.fmt, U = SCR.ui;
    SCR.setCrumbs([{ label: 'Home', key: 'home' }, { label: 'SC Site Leader' }]);

    host.appendChild(U.el(`<div class="page-head">
      <span class="ph-kicker">SC Site Leader :</span><h1>Which site are you interested in exploring?</h1>
      <span class="ph-note">plant &amp; DC continuity · select a site to open its resilience dashboard</span>
    </div>`));

    const grid = U.el('<div class="grid grid-12"></div>');
    host.appendChild(grid);

    grid.appendChild(U.el('<div class="section-title col-12">Manufacturing plants</div>'));
    D.plants.forEach(pt => {
      const crit = pt.criticalMats;
      const card = U.el(`<div class="card col-3" style="cursor:pointer">
        <div class="card-body" style="padding:16px 17px 14px">
          <div class="flex aic spread" style="margin-bottom:8px">
            <strong style="font-size:14.5px">${U.esc(pt.name)}</strong>
            ${U.riBadge(pt.ri)}
          </div>
          <div class="muted" style="font-size:12px;margin-bottom:10px">${U.esc(pt.focus)} · ${U.esc(pt.region)}</div>
          <div class="flex gap12" style="font-size:12px">
            <span><b style="font-size:15px">${F.usdM(pt.nts)}</b><br/><span class="muted">NTS served</span></span>
            <span><b style="font-size:15px">${pt.products.length}</b><br/><span class="muted">products</span></span>
            <span><b style="font-size:15px;color:${crit ? 'var(--status-critical)' : 'var(--status-good)'}">${crit}</b><br/><span class="muted">can stop it</span></span>
          </div>
        </div>
      </div>`);
      card.addEventListener('click', () => { state.site = pt.id; SCR.navigate('site'); });
      grid.appendChild(card);
    });

    grid.appendChild(U.el('<div class="section-title col-12">Distribution centers</div>'));
    const dcCard = U.card({ title: 'DC network', sub: 'click a row for the DC 360°', cols: 12, flush: true });
    grid.appendChild(dcCard);
    dcCard.querySelector('.card-body').appendChild(U.table([
      { h: 'DC', cell: d => `<span class="cell-main">${U.esc(d.name)}</span><span class="cell-sub">${U.esc(d.region)}</span>` },
      { h: 'Markets served', cls: 'num', cell: d => d.marketsServed },
      { h: 'NTS throughput', cls: 'num', cell: d => F.usdM(d.nts) },
      { h: 'Recovery (TTR)', cls: 'num', cell: d => F.days(d.ttr) },
      { h: 'RI', cell: d => U.riMeter(d.ri) }
    ], D.dcs, d => U.openSite(d.id)));
  }

  /* =====================================================
     VIEW 2 · Site dashboard
     ===================================================== */
  function renderSite(host) {
    const D = SCR.data, F = SCR.fmt, U = SCR.ui;
    const site = D.plantById(state.site);
    const factors = SITE_FACTORS[state.site];

    SCR.setCrumbs([
      { label: 'Home', key: 'home' },
      { label: 'SC Site Leader', key: 'site', opts: { reset: true } },
      { label: site.name }
    ], `Site: ${site.name} ; Focus: ${site.focus}`);

    const head = U.el(`<div class="page-head">
      <button class="backbtn" title="Back to site picker">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5"/><path d="m11 18-6-6 6-6"/></svg>
      </button>
      <span class="ph-kicker">Site Resilience :</span><h1>${U.esc(site.name)}</h1>
      <span class="ph-note">${U.esc(site.focus)} · ${U.esc(site.region)}</span>
    </div>`);
    head.querySelector('.backbtn').addEventListener('click', () => { state.site = null; SCR.navigate('site'); });
    host.appendChild(head);

    const mats = site.materials.map(D.materialById);
    const critical = mats.filter(m => m.gap > 0).sort((a, b) => b.gap - a.gap);
    const prods = site.products.map(D.productById);
    const inbound = [...new Set(mats.flatMap(m => m.suppliers))].map(D.supplierById)
      .sort((a, b) => b.score - a.score);

    /* ===== KPI strip ===== */
    host.appendChild(U.kpiStrip([
      { icon: 'risk', color: 0, label: 'NTS served (MM USD)', value: F.num(site.nts) },
      { icon: 'box', color: 4, label: 'Products', value: site.products.length },
      { icon: 'globe', color: 2, label: 'Markets dependent', value: site.markets },
      { icon: 'truck', color: 1, label: 'Inbound suppliers', value: site.suppliersIn, sub: mats.length + ' materials' },
      {
        icon: 'gap', color: 3, label: 'Shortest survival (TTS)', value: site.ttsMin + 'd',
        sub: critical.length + ' materials can stop the site', subClass: critical.length ? 'bad' : 'good'
      },
      {
        icon: 'gauge', color: 5, label: 'Site resilience %', value: F.ri(site.ri),
        progress: { pct: site.ri, color: SCR.risk.riColor(site.ri) },
        sub: SCR.risk.riBand(site.ri) + ' · utilization ' + site.utilization + '%'
      },
      {
        icon: 'factory', color: 6, label: 'Capacity at risk', value: site.capacityAtRisk + '%',
        onClick: () => SCR.navigate('scenario', { node: site.id })
      }
    ], {
      bulb: {
        onClick: () => U.modal('Generated insights — ' + site.name, `
          <ul>
            <li>A <strong>${site.ttr}-day outage</strong> here puts
              <strong>${F.usdM(+(site.nts * site.ttr / 365).toFixed(1))}</strong> of NTS at risk before mitigation.</li>
            ${critical.length ? `<li>The binding constraint is <strong>${U.esc(critical[0].name)}</strong> —
              recovery ${critical[0].ttr}d vs ${critical[0].tts}d of cover
              (−${critical[0].gap}d uncovered).</li>` : '<li>No component currently recovers slower than it survives.</li>'}
            <li>Highest inbound node risk: <strong>${U.esc(inbound[0].name)}</strong>
              (${F.score(inbound[0].score)} · ${inbound[0].rating}).</li>
            <li>Site risk factors peak on <strong>${Object.keys(factors).sort((a, b) => factors[b] - factors[a])[0]}</strong>
              — see the playbook tracker for readiness.</li>
          </ul>`)
      }
    }));

    const grid = U.el('<div class="grid grid-12"></div>');
    host.appendChild(grid);

    /* ===== Critical materials by TTS ===== */
    const ttsCard = U.card({
      title: 'Which material stops production first?',
      sub: 'days of cover (TTS) vs the 20-day safety threshold · red = recovery exceeds survival',
      cols: 7, chartClass: 'chart-lg'
    });
    grid.appendChild(ttsCard);
    const ttsChart = SCR.charts.mount(ttsCard._chartEl, () => {
      const t = SCR.theme.tokens();
      const sorted = mats.slice().sort((a, b) => a.tts - b.tts).slice(0, 12);
      return Object.assign(SCR.theme.baseOption(), {
        tooltip: Object.assign(SCR.theme.baseOption().tooltip, {
          formatter: p => {
            const m = sorted[p.dataIndex];
            return `<strong>${m.name}</strong><br/>TTS ${m.tts}d · TTR ${m.ttr}d ${m.gap > 0 ? '· <span style="color:' + t.status.critical + '">gap −' + m.gap + 'd</span>' : ''}<br/>${m.singleSource ? 'Single source · ' : ''}${SCR.data.supplierById(m.suppliers[0]).name}`;
          }
        }),
        grid: { left: 8, right: 34, top: 8, bottom: 4, containLabel: true },
        xAxis: SCR.theme.valAxis({ axisLabel: { formatter: v => v + 'd' } }),
        yAxis: Object.assign(SCR.theme.catAxis(sorted.map(m => m.name).reverse()), {
          axisLabel: { color: t.ink2, fontSize: 11.5, width: 168, overflow: 'truncate' }
        }),
        series: [{
          type: 'bar',
          data: sorted.map(m => ({
            value: m.tts,
            itemStyle: { color: m.gap > 0 ? t.status.critical : t.series[0], borderRadius: [0, 4, 4, 0] }
          })).reverse(),
          barMaxWidth: 13,
          label: { show: true, position: 'right', fontSize: 11, color: t.ink2, formatter: p => p.value + 'd' },
          markLine: {
            symbol: 'none',
            lineStyle: { color: t.status.warning, type: 'dashed', width: 1.5 },
            label: { formatter: '20d safety', color: t.status.warning, fontSize: 10.5 },
            data: [{ xAxis: 20 }]
          }
        }]
      });
    });
    if (ttsChart) ttsChart.on('click', p => {
      const sorted = mats.slice().sort((a, b) => a.tts - b.tts).slice(0, 12).reverse();
      U.openMaterial(sorted[p.dataIndex].id);
    });

    /* ===== Inventory runway ===== */
    const worst = critical[0] || mats.slice().sort((a, b) => a.tts - b.tts)[0];
    const runCard = U.card({
      title: 'Inventory runway — ' + worst.name,
      sub: 'projected days of cover, next 8 weeks · replenishment vs consumption',
      cols: 5, chartClass: 'chart-lg'
    });
    grid.appendChild(runCard);
    SCR.charts.mount(runCard._chartEl, () => {
      const t = SCR.theme.tokens();
      const weeks = ['W28', 'W29', 'W30', 'W31', 'W32', 'W33', 'W34', 'W35'];
      const runway = [];
      let cover = worst.tts;
      for (let i = 0; i < 8; i++) {
        runway.push(cover);
        cover = Math.max(1, cover - 5 + (i === 1 || i === 4 ? (worst.gap > 0 ? 6 : 14) : 0) + (i === 6 ? (worst.gap > 0 ? 9 : 6) : 0));
      }
      return Object.assign(SCR.theme.baseOption(), {
        tooltip: Object.assign(SCR.theme.baseOption().tooltip, {
          trigger: 'axis',
          formatter: ps => `<strong>${ps[0].axisValue}</strong><br/>${ps[0].marker} Cover: <strong>${ps[0].value}d</strong>`
        }),
        grid: { left: 8, right: 14, top: 14, bottom: 4, containLabel: true },
        xAxis: SCR.theme.catAxis(weeks),
        yAxis: SCR.theme.valAxis({ max: Math.max(Math.max.apply(null, runway) + 4, 14), axisLabel: { formatter: v => v + 'd' } }),
        series: [{
          type: 'line', data: runway, smooth: true,
          symbol: 'circle', symbolSize: 7,
          lineStyle: { width: 2.5, color: worst.gap > 0 ? t.status.critical : t.series[0] },
          itemStyle: { color: worst.gap > 0 ? t.status.critical : t.series[0], borderColor: t.surface, borderWidth: 2 },
          areaStyle: { color: worst.gap > 0 ? t.status.critical : t.series[0], opacity: 0.12 },
          markLine: {
            symbol: 'none',
            lineStyle: { color: t.status.warning, type: 'dashed', width: 1.5 },
            label: { formatter: 'safety floor', color: t.status.warning, fontSize: 10.5 },
            data: [{ yAxis: 10 }]
          }
        }]
      });
    });

    /* ===== Inbound & factors ===== */
    grid.appendChild(U.el('<div class="section-title col-12">Inbound & outbound dependencies</div>'));
    const inCard = U.card({
      title: 'Inbound supplier risk', sub: 'suppliers feeding this site · click for the 360°',
      cols: 7, flush: true
    });
    grid.appendChild(inCard);
    inCard.querySelector('.card-body').appendChild(U.table([
      { h: 'Supplier', cell: s => `<span class="cell-main">${U.esc(s.name)}</span><span class="cell-sub">${U.esc(s.city)}, ${U.esc(s.country)}</span>` },
      { h: 'Feeds', cell: s => U.esc(D.materialsOf(s.id).filter(m => m.plants.includes(site.id)).map(m => m.sub).slice(0, 2).join(', ')) },
      { h: 'TTR', cls: 'num', cell: s => F.days(s.ttr) },
      { h: 'AVAR', cls: 'num', cell: s => F.usdM(s.avar) },
      { h: 'Risk', cell: s => U.meter(s.score) }
    ], inbound.slice(0, 7), s => U.openSupplier(s.id)));

    const rfCard = U.card({
      title: 'Site risk factors', sub: 'weather · labor · utilities · cyber · quality · logistics',
      cols: 5
    });
    grid.appendChild(rfCard);
    const prodChips = prods.slice(0, 8).map(p =>
      `<span class="badge neutral plain" style="cursor:pointer" data-prod="${p.id}">${U.esc(p.name)}</span>`).join('');
    rfCard.querySelector('.card-body').innerHTML =
      U.dimBars(factors) +
      `<div style="margin-top:14px">
        <h3 style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:var(--ink-3);margin-bottom:8px">Products made here</h3>
        <div style="display:flex;flex-wrap:wrap;gap:6px">${prodChips}</div>
      </div>`;
    rfCard.querySelectorAll('[data-prod]').forEach(n =>
      n.addEventListener('click', () => U.openProduct(n.dataset.prod)));

    /* ===== Playbooks ===== */
    grid.appendChild(U.el('<div class="section-title col-12">Continuity playbooks</div>'));
    const pbCard = U.card({
      title: 'Mitigation playbook tracker', sub: 'site continuity levers and their readiness',
      cols: 7
    });
    grid.appendChild(pbCard);
    const pbs = PLAYBOOKS[state.site] || DEFAULT_PB;
    const pbColor = { ready: 'var(--status-good)', 'in progress': 'var(--status-warning)', gap: 'var(--status-critical)' };
    const pbIcon = {
      ready: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>',
      'in progress': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>',
      gap: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 8v5"/><path d="M12 16.5v.5"/><circle cx="12" cy="12" r="9"/></svg>'
    };
    pbCard.querySelector('.card-body').innerHTML = pbs.map(([name, sub, st]) => `
      <div class="playbook">
        <span class="pb-ic" style="background:color-mix(in srgb, ${pbColor[st]} 14%, transparent);color:${pbColor[st]}">${pbIcon[st]}</span>
        <div class="pb-main">
          <div class="pb-name">${U.esc(name)}</div>
          <div class="pb-sub">${U.esc(sub)}</div>
        </div>
        <span class="badge plain ${st === 'ready' ? 'low' : st === 'in progress' ? 'medium' : 'critical'}">${st}</span>
      </div>`).join('');

    const simCard = U.card({
      title: 'Test this site before reality does', sub: 'run the digital twin on an outage scenario',
      cols: 5
    });
    grid.appendChild(simCard);
    simCard.querySelector('.card-body').innerHTML = `
      <div class="sim-out-note" style="margin-bottom:12px">
        A <strong>${site.ttr}-day outage</strong> at ${U.esc(site.name)} puts
        <strong>${F.usdM(+(site.nts * site.ttr / 365).toFixed(1))}</strong> of NTS at risk before mitigation.
        ${critical.length ? `The binding constraint is <strong>${U.esc(critical[0].name)}</strong> — recovery ${critical[0].ttr}d vs ${critical[0].tts}d cover.` : 'No component currently recovers slower than it survives.'}
      </div>`;
    const simBtn = U.el('<button class="btn btn-primary">Simulate site outage</button>');
    simBtn.addEventListener('click', () => SCR.navigate('scenario', { node: site.id }));
    simCard.querySelector('.card-body').appendChild(simBtn);
  }

  function render(host, opts) {
    if (opts.reset) state.site = null;
    if (opts.site && String(opts.site).startsWith('PT')) state.site = opts.site;
    if (state.site) renderSite(host);
    else renderPicker(host);
  }

  SCR.registerPage('site', {
    title: 'Site Resilience',
    render
  });
})();
