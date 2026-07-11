/* ============================================================
   SCR · pages/network.js
   Network Explorer — the supply chain digital twin.
   Layered dependency graph (supplier → material → plant → DC →
   market) with product scoping · Sankey value flow (category →
   plant → DC → region) · single-point-of-failure list.
   ============================================================ */
window.SCR = window.SCR || {};

(function () {
  'use strict';

  // fixed tier → series-slot identity
  const TIER = {
    Supplier: { slot: 1, x: 0 },
    Material: { slot: 2, x: 1 },
    Plant:    { slot: 0, x: 2 },
    DC:       { slot: 3, x: 3 },
    Market:   { slot: 4, x: 4 }
  };

  const state = { product: 'P07' };

  function buildGraph() {
    const D = SCR.data;
    const prods = state.product === 'all' ? D.products : [D.productById(state.product)];
    const mats = [...new Set(prods.flatMap(p => p.materials))].map(D.materialById);
    const sups = [...new Set(mats.flatMap(m => m.suppliers))].map(D.supplierById);
    const plants = [...new Set(prods.flatMap(p => p.plants))].map(D.plantById);
    const dcIds = new Set(prods.flatMap(p => p.dcs));
    const dcList = D.dcs.filter(d => dcIds.has(d.id));
    const mkIds = new Set(prods.flatMap(p => p.markets));
    const mkList = D.markets.filter(m => mkIds.has(m.id));

    const nodes = [], links = [], idx = {};
    function add(tier, id, name, value, sub, riskColorScore) {
      idx[id] = nodes.length;
      nodes.push({ tier, id, name, value, sub, riskColorScore });
    }
    sups.forEach(s => add('Supplier', s.id, s.name, s.avar, s.city + ', ' + s.country, s.score));
    mats.forEach(m => add('Material', m.id, m.name, m.avar, m.sub, m.score));
    plants.forEach(p => add('Plant', p.id, p.name, p.avar, p.focus, null));
    dcList.forEach(d => add('DC', d.id, d.name, d.avar, d.region, null));
    mkList.forEach(mk => add('Market', mk.id, mk.name, mk.nts * 0.02, mk.region, null));

    mats.forEach(m => {
      m.suppliers.forEach(sid => { if (idx[sid] != null) links.push([sid, m.id, m.singleSource]); });
      m.plants.forEach(pid => { if (idx[pid] != null) links.push([m.id, pid, false]); });
    });
    prods.forEach(p => {
      p.plants.forEach(pt => p.dcs.forEach(dc => {
        if (idx[pt] != null && idx[dc] != null) links.push([pt, dc, false]);
      }));
      p.dcs.forEach(dc => p.markets.forEach(mk => {
        const d = D.dcById(dc);
        if (d && d.markets.includes(mk) && idx[dc] != null && idx[mk] != null) links.push([dc, mk, false]);
      }));
    });
    // dedupe links
    const seen = new Set();
    const uniq = links.filter(l => {
      const k = l[0] + '>' + l[1];
      if (seen.has(k)) return false;
      seen.add(k); return true;
    });
    return { nodes, links: uniq };
  }

  /* Sankey: material category → plant → DC → region, NTS-attributed */
  function buildSankey() {
    const D = SCR.data;
    const flows = {}; // 'a␟b' -> value
    const bump = (a, b, v) => { const k = a + '␟' + b; flows[k] = (flows[k] || 0) + v; };
    D.products.forEach(p => {
      const perPlant = p.nts / p.plants.length;
      const cats = [...new Set(p.materials.map(m => D.materialById(m).cat))];
      p.plants.forEach(pt => {
        const plant = D.plantById(pt);
        cats.forEach(c => bump(D.catName(c), plant.name, perPlant / cats.length));
        const dcsIn = p.dcs;
        dcsIn.forEach(dc => bump(plant.name, D.dcById(dc).name, perPlant / dcsIn.length));
      });
      p.dcs.forEach(dc => {
        const d = D.dcById(dc);
        const served = p.markets.filter(mk => d.markets.includes(mk));
        const perDc = p.nts / p.dcs.length;
        if (served.length) {
          served.forEach(mk => bump(d.name, D.marketById(mk).region + ' markets', perDc / served.length));
        } else {
          bump(d.name, d.region + ' markets', perDc);
        }
      });
    });
    const names = new Set();
    const links = Object.keys(flows).map(k => {
      const [a, b] = k.split('␟');
      names.add(a); names.add(b);
      return { source: a, target: b, value: +flows[k].toFixed(0) };
    }).filter(l => l.value >= 8);
    return { nodes: [...names].map(n => ({ name: n })), links };
  }

  function render(host, opts) {
    const D = SCR.data, F = SCR.fmt, U = SCR.ui;
    if (opts.product) state.product = opts.product;

    /* ===== Scope bar ===== */
    host.appendChild(U.el(`<div class="page-head">
      <span class="ph-kicker">Digital twin :</span><h1>Network Explorer</h1>
      <span class="ph-note">supplier → material → plant → DC → market · red edge = single-source</span>
    </div>`));
    const fb = U.el(`<div class="filter-row"><div class="filter-flyout open" style="margin-top:0">
      <div class="ff-field" style="min-width:280px">
        <label>Trace a product's dependency chain</label>
        <select id="fProd">
          <option value="all">Entire network — all products</option>
          ${D.products.map(p => `<option value="${p.id}" ${state.product === p.id ? 'selected' : ''}>${p.name}</option>`).join('')}
        </select>
      </div>
    </div></div>`);
    host.appendChild(fb);
    fb.querySelector('#fProd').addEventListener('change', e => {
      state.product = e.target.value;
      SCR.navigate('network');
    });

    const g = buildGraph();
    const grid = U.el('<div class="grid grid-12"></div>');
    host.appendChild(grid);

    /* ===== Layered dependency graph ===== */
    const graphCard = U.card({
      title: state.product === 'all' ? 'Supply network — digital twin' : 'Dependency trace — ' + D.productById(state.product).name,
      sub: 'node size = AVAR at the node · click any node for its 360°',
      cols: 12, chartClass: state.product === 'all' ? 'chart-xxl' : 'chart-xl'
    });
    grid.appendChild(graphCard);
    const graphChart = SCR.charts.mount(graphCard._chartEl, () => {
      const t = SCR.theme.tokens();
      const tiers = Object.keys(TIER);
      const counts = {};
      g.nodes.forEach(n => { counts[n.tier] = (counts[n.tier] || 0) + 1; });
      const yPos = {};
      const dense = g.nodes.length > 44;
      // lay out in the container's own pixel space so fit-to-view stays uniform
      const el = graphCard._chartEl;
      const W = Math.max(560, el.clientWidth || 900);
      const H = Math.max(380, el.clientHeight || 460);
      const x0 = 150, x1 = W - 130, y0 = 44, y1 = H - 16;
      const nodes = g.nodes.map(n => {
        yPos[n.tier] = (yPos[n.tier] || 0) + 1;
        const total = counts[n.tier];
        const y = y0 + (yPos[n.tier] - 0.5) / total * (y1 - y0);
        return {
          id: n.id, name: n.name,
          x: x0 + TIER[n.tier].x / 4 * (x1 - x0), y,
          symbolSize: dense
            ? Math.max(6, Math.min(15, 6 + Math.sqrt(Math.max(0.1, n.value)) * 1.9))
            : Math.max(9, Math.min(34, 9 + Math.sqrt(Math.max(0.1, n.value)) * 4.4)),
          category: tiers.indexOf(n.tier),
          label: {
            show: counts[n.tier] <= 16,
            position: n.tier === 'Supplier' ? 'left' : n.tier === 'Market' ? 'right' : 'top',
            fontSize: 10.5, color: t.ink2,
            formatter: () => n.name.length > 19 ? n.name.slice(0, 18) + '…' : n.name
          },
          itemStyle: {
            color: n.riskColorScore != null && n.riskColorScore >= 3.5
              ? t.status.critical
              : t.series[TIER[n.tier].slot],
            borderColor: t.surface, borderWidth: 1.5
          },
          meta: n
        };
      });
      return Object.assign(SCR.theme.baseOption(), {
        tooltip: Object.assign(SCR.theme.baseOption().tooltip, {
          formatter: p => {
            if (p.dataType === 'edge') return null;
            const n = p.data.meta;
            return `<strong>${n.name}</strong> · ${n.tier}<br/>${n.sub}${n.tier !== 'Market' ? `<br/>AVAR ${F.usdM(n.value)}` : ''}`;
          }
        }),
        legend: Object.assign(SCR.theme.baseOption().legend, {
          top: 0, data: tiers.map((tr, i) => ({ name: tr, itemStyle: { color: t.series[TIER[tr].slot] } }))
        }),
        series: [{
          type: 'graph', layout: 'none',
          left: 60, right: 84, top: 46, bottom: 18,
          categories: tiers.map(tr => ({ name: tr, itemStyle: { color: t.series[TIER[tr].slot] } })),
          nodes,
          edges: g.links.map(l => ({
            source: l[0], target: l[1],
            lineStyle: {
              color: l[2] ? t.status.critical : (t.isDark ? 'rgba(148,163,184,.30)' : 'rgba(100,116,139,.28)'),
              width: l[2] ? 2 : 1.1,
              curveness: 0.24
            }
          })),
          emphasis: { focus: 'adjacency', lineStyle: { width: 2.4 } },
          roam: true, scaleLimit: { min: 0.7, max: 2.5 }
        }]
      });
    });
    if (graphChart) graphChart.on('click', p => {
      if (p.dataType !== 'node' || !p.data.meta) return;
      const n = p.data.meta;
      if (n.tier === 'Supplier') U.openSupplier(n.id);
      else if (n.tier === 'Material') U.openMaterial(n.id);
      else if (n.tier === 'Plant' || n.tier === 'DC') U.openSite(n.id);
      else if (n.tier === 'Market') { /* market: filter value streams */ SCR.navigate('valuestream', {}); }
    });

    /* ===== Sankey value flow ===== */
    const sank = buildSankey();
    const sankCard = U.card({
      title: 'Value flow through the network (Sankey)',
      sub: 'NTS attribution: material category → plant → distribution center → market region ($M)',
      cols: 7, chartClass: 'chart-xl'
    });
    grid.appendChild(sankCard);
    SCR.charts.mount(sankCard._chartEl, () => {
      const t = SCR.theme.tokens();
      return Object.assign(SCR.theme.baseOption(), {
        tooltip: Object.assign(SCR.theme.baseOption().tooltip, {
          formatter: p => p.dataType === 'edge'
            ? `<strong>${p.data.source}</strong> → <strong>${p.data.target}</strong><br/>${F.usdM(p.data.value)} NTS attributed`
            : `<strong>${p.name}</strong>`
        }),
        series: [{
          type: 'sankey',
          left: 8, right: 130, top: 12, bottom: 8,
          nodeWidth: 14, nodeGap: 10,
          data: sank.nodes.map((n, i) => ({
            name: n.name,
            itemStyle: { color: t.series[i % 8], borderColor: t.surface }
          })),
          links: sank.links,
          lineStyle: { color: 'gradient', opacity: 0.28, curveness: 0.5 },
          label: { color: t.ink2, fontSize: 11 },
          emphasis: { focus: 'adjacency' }
        }]
      });
    });

    /* ===== Single points of failure ===== */
    const spofCard = U.card({
      title: 'Single points of failure',
      sub: 'sole-sourced dependencies ranked by AVAR',
      cols: 5, flush: true
    });
    grid.appendChild(spofCard);
    const spofs = D.materials.filter(m => m.singleSource)
      .sort((a, b) => b.avar - a.avar);
    spofCard.querySelector('.card-body').appendChild(U.table([
      { h: 'Dependency', cell: m => `<span class="cell-main">${U.esc(m.name)}</span><span class="cell-sub">${U.esc(D.supplierById(m.suppliers[0]).name)}</span>` },
      { h: 'SKUs', cls: 'num', cell: m => m.depProducts.length },
      { h: 'Gap', cls: 'num', cell: m => `<span style="font-weight:700;color:${m.gap > 0 ? 'var(--status-critical)' : 'var(--status-good)'}">${m.gap > 0 ? '−' + m.gap + 'd' : 'OK'}</span>` },
      { h: 'AVAR', cls: 'num', cell: m => F.usdM(m.avar) }
    ], spofs, m => U.openMaterial(m.id)));
  }

  SCR.registerPage('network', {
    title: 'Network Explorer',
    crumb: 'Digital twin · multi-tier dependency graph',
    render
  });
})();
