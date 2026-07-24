/* ============================================================
   SCR · pages/valuestream.js
   Value Streams — persona: Value Chain / Stream Leader.
   Modernized from the original VSL dashboards, two views:

   · Overview      — Filter flyout · KPI strip with RI progress
                     and insight bulb · "NTS, WAVAR & Resilience %
                     by Product" (columns + RI dots panel) ·
                     missing TTR/TTS/RRE strip · product table
   · Node Overview — drill from any product: product list panel
                     (left) + "Node AVAR vs Sales Impacted" with
                     the AVAR/SALES toggle and in-cell bars +
                     node data table + component gap bars
   ============================================================ */
window.SCR = window.SCR || {};

(function () {
  'use strict';

  const state = { sector: 'all', stream: 'all', market: 'all', view: 'overview', product: null };

  function filtered() {
    const D = SCR.data;
    return D.products.filter(p =>
      (state.sector === 'all' || p.sector === state.sector) &&
      (state.stream === 'all' || p.stream === state.stream) &&
      (state.market === 'all' || p.markets.includes(state.market)));
  }

  function nodesOf(prods) {
    const D = SCR.data;
    const set = new Set();
    prods.forEach(p => {
      p.plants.forEach(x => set.add(x));
      p.dcs.forEach(x => set.add(x));
      p.materials.forEach(mid => D.materialById(mid).suppliers.forEach(s => set.add(s)));
    });
    return set;
  }

  function kpiStripFor(prods, host, bulbFn, clicks) {
    const D = SCR.data, F = SCR.fmt, U = SCR.ui;
    clicks = clicks || {};
    const nts = prods.reduce((a, p) => a + p.nts, 0);
    const avar = +prods.reduce((a, p) => a + p.avar, 0).toFixed(1);
    const ri = +(prods.reduce((a, p) => a + p.ri * p.nts, 0) / nts).toFixed(1);
    const mkts = new Set(prods.flatMap(p => p.markets));
    host.appendChild(U.kpiStrip([
      { icon: 'risk', color: 0, label: 'NTS (MM USD)', value: F.num(Math.round(nts)), onClick: clicks.nts },
      { icon: 'box', color: 4, label: 'Products', value: prods.length, onClick: clicks.products },
      { icon: 'globe', color: 2, label: 'Countries', value: mkts.size, onClick: clicks.countries },
      { icon: 'pin', color: 3, label: 'Nodes', value: nodesOf(prods).size, onClick: clicks.nodes || (() => SCR.navigate('network', prods.length === 1 ? { product: prods[0].id } : {})) },
      {
        icon: 'gauge', color: 1, label: 'Resilience %', value: F.ri(ri),
        progress: { pct: ri, color: SCR.risk.riColor(ri) },
        sub: SCR.risk.riBand(ri) + ' band · how it is scored',
        onClick: () => U.riMatrixGuide()
      },
      { icon: 'dollar', color: 5, label: 'Wtd. AVAR (MM USD)', value: F.num(Math.round(avar * 10) / 10), onClick: clicks.avar }
    ], { bulb: { onClick: bulbFn } }));
    return { nts, avar, ri };
  }

  /* =====================================================
     VIEW 1 · Overview
     ===================================================== */
  function renderOverview(host) {
    const D = SCR.data, F = SCR.fmt, U = SCR.ui;
    const scopeStr = `Sector: ${state.sector === 'all' ? 'All' : D.sectorName(state.sector)} ; Value Stream: ${state.stream === 'all' ? 'All' : state.stream} ; Product: All`;
    SCR.setCrumbs([
      { label: 'VSL Home', key: 'valuestream', opts: { reset: true } },
      { label: 'Overview' }
    ], scopeStr);

    host.appendChild(U.el(`<div class="page-head">
      <span class="ph-kicker">Overview :</span><h1>${state.stream === 'all' ? (state.sector === 'all' ? 'All Value Streams' : D.sectorName(state.sector)) : state.stream}</h1>
    </div>`));

    const streams = state.sector === 'all'
      ? D.sectors.flatMap(s => s.streams)
      : D.sectors.find(s => s.key === state.sector).streams;
    host.appendChild(U.filterBlock([
      {
        id: 'vsSector', label: 'Sector',
        options: [{ v: 'all', label: 'All sectors', sel: state.sector === 'all' }]
          .concat(D.sectors.map(s => ({ v: s.key, label: s.name, sel: state.sector === s.key }))),
        onChange: v => { state.sector = v; state.stream = 'all'; SCR.navigate('valuestream'); }
      },
      {
        id: 'vsStream', label: 'Value stream',
        options: [{ v: 'all', label: 'All value streams', sel: state.stream === 'all' }]
          .concat(streams.map(s => ({ v: s, label: s, sel: state.stream === s }))),
        onChange: v => { state.stream = v; SCR.navigate('valuestream'); }
      },
      {
        id: 'vsMarket', label: 'Country / market',
        options: [{ v: 'all', label: 'All markets', sel: state.market === 'all' }]
          .concat(D.markets.map(m => ({ v: m.id, label: m.name, sel: state.market === m.id }))),
        onChange: v => { state.market = v; SCR.navigate('valuestream'); }
      }
    ], 'Click any product below to open its Node Overview'));

    const prods = filtered().slice().sort((a, b) => b.nts - a.nts);
    if (!prods.length) {
      host.appendChild(U.el('<div class="empty">No products match this filter.</div>'));
      return;
    }

    kpiStripFor(prods, host, () => {
      const worst = prods.slice().sort((a, b) => a.ri - b.ri)[0];
      const gapped = prods.filter(p => p.gapMax > 0);
      U.modal('Generated insights — Value Streams', `
        <ul>
          <li><strong>${U.esc(worst.name)}</strong> is the most fragile product in scope
            (RI ${F.ri(worst.ri)} · ${worst.gapCount} gapped components · worst gap −${worst.gapMax}d).</li>
          <li><strong>${gapped.length} of ${prods.length} products</strong> carry at least one TTR &gt; TTS component.</li>
          <li>The scope's adjusted exposure concentrates in
            <strong>${U.esc(prods.slice().sort((a, b) => b.avar - a.avar)[0].name)}</strong>
            (${F.usdM(prods.slice().sort((a, b) => b.avar - a.avar)[0].avar)} AVAR).</li>
          <li>Recommended next click: open the worst product's <strong>Node Overview</strong> to see which
            suppliers, plants and DCs put its sales at risk.</li>
        </ul>
        <p class="muted" style="font-size:12.5px">Composed by the Impact &amp; VAR Agent from the current filter scope.</p>`);
    }, {
      nts: () => U.scrollToCard(document.getElementById('vsCombo')),
      products: () => U.scrollToCard(document.getElementById('vsProducts')),
      countries: () => U.scrollToCard(document.getElementById('vsProducts')),
      avar: () => U.scrollToCard(document.getElementById('vsCombo'))
    });

    const grid = U.el('<div class="grid grid-12"></div>');
    host.appendChild(grid);

    /* ===== Signature chart: NTS + WAVAR columns, RI dots ===== */
    const comboCard = U.card({
      title: 'NTS (MM USD), WAVAR (MM USD) and Resilience % by Product',
      sub: 'columns share the $ axis · Resilience % reads as dots on its own aligned panel · click a column to drill',
      cols: 12, chartClass: 'chart-xl'
    });
    comboCard.id = 'vsCombo';
    grid.appendChild(comboCard);
    const comboProds = prods.slice(0, 18);
    SCR.charts.comboPanel(comboCard._chartEl, {
      labels: comboProds.map(p => p.name),
      bars: [
        { name: 'NTS', data: comboProds.map(p => p.nts), color: t => t.series[0] },
        { name: 'Wtd. AVAR', data: comboProds.map(p => p.avar), color: t => t.series[2] }
      ],
      line: {
        name: 'Resilience %', data: comboProds.map(p => p.ri),
        min: 30, max: 100, fmt: F.ri, dots: true,
        color: t => t.series[6],
        pointColor: v => SCR.risk.riColor(v)
      }
    });
    const comboChart = echarts.getInstanceByDom(comboCard._chartEl);
    if (comboChart) comboChart.on('click', p => {
      const prod = comboProds[p.dataIndex];
      if (prod) { state.view = 'node'; state.product = prod.id; SCR.navigate('valuestream'); }
    });

    /* ===== Missing-data strip (from the original footer) ===== */
    const dq = D.dataQuality;
    const share = prods.reduce((a, p) => a + p.nts, 0) / D.kpis.totalNTS;
    const comps = Math.round(dq.componentsTotal * share);
    grid.appendChild(U.el('<div class="col-12"></div>')).appendChild(U.kpiStrip([
      { icon: 'layers', color: 5, label: 'Total Component Count', value: F.num(comps) },
      { icon: 'gap', color: 3, label: 'Component Count with Missing TTR', value: F.num(state.sector === 'all' ? dq.missingTTR : Math.round(dq.missingTTR * (state.sector === 'dev' ? 2.6 : 0.45) * share)), sub: 'assign owners in Data Quality', subClass: 'bad', onClick: () => SCR.navigate('quality') },
      { icon: 'gap', color: 2, label: 'Component Count with Missing TTS', value: F.num(dq.missingTTS), sub: 'fully covered', subClass: 'good' },
      { icon: 'gap', color: 6, label: 'Component Count with Missing RRE', value: F.num(state.sector === 'all' ? dq.missingRRE : Math.round(dq.missingRRE * share)), onClick: () => SCR.navigate('quality') }
    ]));

    /* ===== Product table ===== */
    const tblCard = U.card({
      title: 'Products in scope', sub: 'click a row to open the Node Overview drill (product → nodes → exposure)',
      cols: 12, flush: true
    });
    tblCard.id = 'vsProducts';
    grid.appendChild(tblCard);
    const tbl = U.table([
      { h: 'Brand', cell: p => `<span style="font-size:12.5px">${U.esc(p.brand)}</span>` },
      { h: 'Product', cell: p => `<span class="cell-main">${U.esc(p.name)}</span><span class="cell-sub">${U.esc(p.stream)}</span>` },
      { h: 'NTS (MM USD)', cls: 'num', cell: p => F.num(p.nts) },
      { h: 'Wtd. AVAR', cls: 'num', cell: p => p.avar.toFixed(1) },
      { h: 'Min TTS', cls: 'num', cell: p => F.days(p.ttsMin) },
      { h: 'Max TTR', cls: 'num', cell: p => F.days(p.ttrMax) },
      { h: 'TTR > TTS', cell: p => p.gapMax > 0 ? `<span class="badge critical plain">−${p.gapMax}d · ${p.gapCount} comp.</span>` : '<span class="badge low plain">Covered</span>' },
      { h: 'Resilience %', cell: p => U.riMeter(p.ri) },
      { h: '', cell: () => '<span class="crumb-link" style="font-size:12px;white-space:nowrap">Node overview →</span>' }
    ], prods, p => { state.view = 'node'; state.product = p.id; SCR.navigate('valuestream'); });
    tbl.querySelector('table').classList.add('tbl-teal');
    tblCard.querySelector('.card-body').appendChild(tbl);
  }

  /* =====================================================
     VIEW 2 · Node Overview (drill, from the original)
     ===================================================== */
  function renderNode(host) {
    const D = SCR.data, F = SCR.fmt, U = SCR.ui;
    const prods = filtered().slice().sort((a, b) => a.name.localeCompare(b.name));
    // Resolve the drilled product defensively: a stale/unknown id must not crash the view.
    const prod = D.productById(state.product) || prods[0] || D.products[0];
    if (!prod) {
      host.appendChild(U.el('<div class="empty">No product available for this scope.</div>'));
      return;
    }
    state.product = prod.id;

    const scopeStr = `Sector: ${prod.sectorName} ; Value Stream: ${prod.stream} ; Product: ${prod.name}`;
    SCR.setCrumbs([
      { label: 'VSL Home', key: 'valuestream', opts: { reset: true } },
      { label: 'Overview', key: 'valuestream', opts: { back: true } },
      { label: 'Node Overview' }
    ], scopeStr);

    const head = U.el(`<div class="page-head">
      <button class="backbtn" title="Back to Overview">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5"/><path d="m11 18-6-6 6-6"/></svg>
      </button>
      <span class="ph-kicker">Node Overview :</span><h1>${U.esc(prod.name)}</h1>
    </div>`);
    head.querySelector('.backbtn').addEventListener('click', () => {
      state.view = 'overview'; SCR.navigate('valuestream');
    });
    host.appendChild(head);

    kpiStripFor([prod], host, () => {
      const rows = D.nodeExposureFor(prod.id).sort((a, b) => b.avar - a.avar);
      U.modal('Generated insights — ' + prod.name, `
        <ul>
          <li>The single largest exposure node for this product is <strong>${U.esc(rows[0].name)}</strong>
            (${U.esc(rows[0].type)}) at <strong>${F.usdM(rows[0].avar)} AVAR</strong>.</li>
          <li>${prod.gapCount} of ${prod.materials.length} BOM components recover slower than they survive;
            the binding component gap is <strong>−${prod.gapMax} days</strong>.</li>
          <li>Resilience index is <strong>${F.ri(prod.ri)}</strong> (${SCR.risk.riBand(prod.ri)});
            single-source risky materials on the BOM: <strong>${prod.singleRisky}</strong>.</li>
          <li>Fastest lever: simulate a failure of the top node in the Scenario Studio and pre-approve
            its best mitigation as a playbook.</li>
        </ul>`);
    }, {
      nts: () => U.scrollToCard(document.getElementById('noNodeCard')),
      products: () => U.scrollToCard(document.getElementById('noNodeCard')),
      countries: () => U.scrollToCard(document.getElementById('noNodeCard')),
      nodes: () => U.scrollToCard(document.getElementById('noNodeCard')),
      avar: () => U.scrollToCard(document.getElementById('noGaps'))
    });

    const grid = U.el('<div class="grid grid-12"></div>');
    host.appendChild(grid);

    /* ===== LEFT · product list panel (from the original) ===== */
    const listWrap = U.el(`<div class="col-3" style="min-width:0">
      <div class="list-panel">
        <div class="lp-head">Product</div>
        <div class="lp-scroll"></div>
      </div>
    </div>`);
    grid.appendChild(listWrap);
    const scroll = listWrap.querySelector('.lp-scroll');
    prods.forEach(p => {
      const b = U.el(`<button class="lp-row ${p.id === prod.id ? 'sel' : ''}" title="${U.esc(p.name)}">${U.esc(p.name)}</button>`);
      b.addEventListener('click', () => { state.product = p.id; SCR.navigate('valuestream'); });
      scroll.appendChild(b);
    });

    /* ===== RIGHT · Node AVAR vs Sales Impacted (toggle + in-cell bars) ===== */
    let measure = 'avar';
    const seg = U.el(`<div class="seg">
      <button data-k="avar" class="active">AVAR</button>
      <button data-k="sales">SALES</button>
    </div>`);
    const nodeCard = U.card({
      title: 'Node AVAR vs Sales Impacted',
      sub: 'every supplier, plant and DC this product depends on · click a row for the node 360°',
      cols: 9, flush: true, actions: [seg]
    });
    nodeCard.id = 'noNodeCard';
    grid.appendChild(nodeCard);
    const nodeBody = nodeCard.querySelector('.card-body');
    nodeBody.style.maxHeight = '432px';
    nodeBody.style.overflowY = 'auto';

    function renderNodeTable() {
      const rows = D.nodeExposureFor(prod.id).sort((a, b) => b[measure] - a[measure]);
      const max = Math.max(...rows.map(r => r[measure]), 0.01);
      const barColor = measure === 'avar' ? 'var(--series-1)' : 'var(--series-4)';
      const headLabel = measure === 'avar' ? 'Adj Value At Risk (MM USD)' : 'Sales Impacted (MM USD)';
      nodeBody.innerHTML = '';
      const tbl = U.table([
        { h: 'Node', cell: r => `<span class="cell-main" style="font-size:12.5px">${U.esc(r.name)}</span><span class="cell-sub">${U.esc(r.sub)}</span>` },
        { h: 'Type', cell: r => `<span class="badge neutral plain">${r.type}</span>` },
        { h: 'Products', cell: () => `<span style="font-size:12.5px">${U.esc(prod.name.slice(0, 16))}…</span>` },
        { h: headLabel, cell: r => U.cellBar(r[measure], max, barColor, F.num(+r[measure].toFixed(1))) },
        { h: 'RI', cls: 'num', cell: r => U.riSpan(r.ri) }
      ], rows, r => { if (r.type === 'Supplier') U.openSupplier(r.id); else U.openSite(r.id); });
      tbl.querySelector('table').classList.add('tbl-teal');
      nodeBody.appendChild(tbl);
    }
    renderNodeTable();
    seg.querySelectorAll('button').forEach(b => b.addEventListener('click', () => {
      measure = b.dataset.k;
      seg.querySelectorAll('button').forEach(x => x.classList.toggle('active', x === b));
      renderNodeTable();
    }));

    /* ===== Node Data (below, from the original) ===== */
    const dataCard = U.card({
      title: 'Node Data', sub: 'attributed exposure per node with recovery and resilience',
      cols: 7, flush: true
    });
    grid.appendChild(dataCard);
    const rows2 = D.nodeExposureFor(prod.id).sort((a, b) => b.avar - a.avar);
    const nd = U.table([
      { h: 'Node', cell: r => `<span class="cell-main" style="font-size:12.5px">${U.esc(r.name)}</span>` },
      { h: 'Type', cell: r => r.type },
      { h: 'TTR', cls: 'num', cell: r => {
        const ref = r.type === 'Supplier' ? D.supplierById(r.id) : (D.plantById(r.id) || D.dcById(r.id));
        return F.days(ref.ttr);
      } },
      { h: 'VAR', cls: 'num', cell: r => F.num(+r.var.toFixed(1)) },
      { h: 'AVAR', cls: 'num', cell: r => F.num(+r.avar.toFixed(1)) },
      { h: 'RI', cell: r => U.riMeter(r.ri) }
    ], rows2.slice(0, 8), r => { if (r.type === 'Supplier') U.openSupplier(r.id); else U.openSite(r.id); });
    dataCard.querySelector('.card-body').appendChild(nd);

    /* ===== Component gaps for this product ===== */
    const mats = prod.materials.map(D.materialById).sort((a, b) => b.gap - a.gap);
    const gapCard = U.card({
      title: 'TTR vs TTS — this product’s BOM',
      sub: 'recovery beyond survival = uncovered days · click nothing, hover for detail',
      cols: 5
    });
    gapCard.id = 'noGaps';
    grid.appendChild(gapCard);
    gapCard.querySelector('.card-body').innerHTML = U.gapLegend +
      U.gapRows(mats.map(m => ({ name: m.name, sub: m.sub, tts: m.tts, ttr: m.ttr })));

    /* actions row */
    const act = U.el(`<div class="col-12 flex gap8" style="justify-content:flex-end">
      <button class="btn" id="noSim">Simulate top node failure</button>
      <button class="btn btn-primary" id="noAct">Create mitigation action</button>
    </div>`);
    grid.appendChild(act);
    act.querySelector('#noSim').addEventListener('click', () =>
      SCR.navigate('scenario', { node: rows2[0].type === 'Supplier' ? rows2[0].id : rows2[0].id }));
    act.querySelector('#noAct').addEventListener('click', () => U.createAction(prod.name));
  }

  function render(host, opts) {
    if (opts.sector) { state.sector = opts.sector; state.stream = 'all'; state.view = 'overview'; }
    if (opts.reset) { state.sector = 'all'; state.stream = 'all'; state.market = 'all'; state.view = 'overview'; state.product = null; }
    if (opts.back) state.view = 'overview';
    if (opts.product) { state.view = 'node'; state.product = opts.product; }
    if (state.view === 'node') renderNode(host);
    else renderOverview(host);
  }

  SCR.registerPage('valuestream', {
    title: 'Value Streams',
    render
  });
})();
