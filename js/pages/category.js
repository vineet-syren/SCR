/* ============================================================
   SCR · pages/category.js
   Category & Suppliers — persona: Category / Procurement Leader.
   Filter bar (category · sourcing · region) · category KPI row ·
   supplier risk bubble (spend × risk × AVAR) · spend tree map
   (category → sub-category) · node data summary table · material
   dependency table · category risk-driver profile.
   ============================================================ */
window.SCR = window.SCR || {};

(function () {
  'use strict';

  const CAT_SLOT = { ing: 0, pkg: 1, elc: 2, chm: 3 };
  const state = { cat: 'all', sourcing: 'all', region: 'all' };

  function fMaterials() {
    const D = SCR.data;
    return D.materials.filter(m =>
      (state.cat === 'all' || m.cat === state.cat) &&
      (state.sourcing === 'all' || (state.sourcing === 'single' ? m.singleSource : !m.singleSource)) &&
      (state.region === 'all' || m.suppliers.some(s => D.supplierById(s).region === state.region)));
  }
  function fSuppliers(mats) {
    const D = SCR.data;
    const ids = new Set(mats.flatMap(m => m.suppliers));
    return D.suppliers.filter(s => ids.has(s.id) &&
      (state.region === 'all' || s.region === state.region));
  }

  function render(host, opts) {
    const D = SCR.data, F = SCR.fmt, U = SCR.ui;
    if (opts.cat) state.cat = opts.cat;

    /* ===== Filter bar ===== */
    const regions = [...new Set(D.suppliers.map(s => s.region))];
    const fb = U.el(`<div class="filter-bar">
      <span class="fb-label">Category</span>
      <select id="fCat">
        <option value="all">All categories</option>
        ${D.categories.map(c => `<option value="${c.key}" ${state.cat === c.key ? 'selected' : ''}>${c.name}</option>`).join('')}
      </select>
      <select id="fSrc">
        <option value="all" ${state.sourcing === 'all' ? 'selected' : ''}>All sourcing</option>
        <option value="single" ${state.sourcing === 'single' ? 'selected' : ''}>Single-source only</option>
        <option value="dual" ${state.sourcing === 'dual' ? 'selected' : ''}>Dual+ sourced</option>
      </select>
      <select id="fReg">
        <option value="all">All supplier regions</option>
        ${regions.map(r => `<option value="${r}" ${state.region === r ? 'selected' : ''}>${r}</option>`).join('')}
      </select>
      <span class="fb-spacer"></span>
      <span class="muted" style="font-size:12.5px">Risk drivers: financial · quality · reliability · geo · cyber · climate</span>
    </div>`);
    host.appendChild(fb);
    ['fCat', 'fSrc', 'fReg'].forEach((id, i) => {
      fb.querySelector('#' + id).addEventListener('change', e => {
        state[['cat', 'sourcing', 'region'][i]] = e.target.value;
        SCR.navigate('category');
      });
    });

    const mats = fMaterials();
    const sups = fSuppliers(mats);
    if (!mats.length || !sups.length) {
      host.appendChild(U.el('<div class="empty">No materials match this filter.</div>'));
      return;
    }
    const spend = +mats.reduce((a, m) => a + m.spend, 0).toFixed(0);
    const varSum = +mats.reduce((a, m) => a + m.var, 0).toFixed(1);
    const avarSum = +mats.reduce((a, m) => a + m.avar, 0).toFixed(1);
    const singles = mats.filter(m => m.singleSource);
    const altCoverage = Math.round((1 - singles.length / mats.length) * 100);

    /* ===== KPI row ===== */
    const kpiRow = U.el('<div class="kpi-row" style="margin-bottom:16px"></div>');
    kpiRow.appendChild(U.kpi({ label: 'Category spend (CY)', value: F.usdM(spend), sub: mats.length + ' materials' }));
    kpiRow.appendChild(U.kpi({ label: 'Value at risk', value: F.usdM(varSum), sub: F.usdM(avarSum) + ' AVAR' }));
    kpiRow.appendChild(U.kpi({ label: 'Suppliers', value: sups.length, sub: sups.filter(s => s.score >= 3).length + ' high risk' }));
    kpiRow.appendChild(U.kpi({
      label: 'Single-source materials', value: singles.length,
      sub: singles.filter(m => m.score >= 2.8).length + ' risky',
      onClick: () => { state.sourcing = 'single'; SCR.navigate('category'); }
    }));
    kpiRow.appendChild(U.kpi({
      label: 'Alternate coverage', value: altCoverage + '%', sub: 'materials with 2+ sources',
      delta: { text: altCoverage >= 70 ? 'healthy' : 'below 70% target', dir: altCoverage >= 70 ? 'good' : 'bad', vs: '' }
    }));
    kpiRow.appendChild(U.kpi({
      label: 'TTR > TTS in category', value: mats.filter(m => m.gap > 0).length,
      sub: 'components gapped', onClick: () => SCR.navigate('valuestream')
    }));
    host.appendChild(kpiRow);

    const grid = U.el('<div class="grid grid-12"></div>');
    host.appendChild(grid);

    /* ===== Supplier risk bubble ===== */
    const bubbleCard = U.card({
      title: 'Supplier portfolio — spend × node risk × AVAR',
      sub: 'bubble size = AVAR attributed · color = category · click for the supplier 360°',
      cols: 7, chartClass: 'chart-lg'
    });
    grid.appendChild(bubbleCard);
    const bubbleChart = SCR.charts.mount(bubbleCard._chartEl, () => {
      const t = SCR.theme.tokens();
      const byCat = {};
      sups.forEach(s => { (byCat[s.cat] = byCat[s.cat] || []).push(s); });
      return Object.assign(SCR.theme.baseOption(), {
        tooltip: Object.assign(SCR.theme.baseOption().tooltip, {
          formatter: p => {
            const s = p.data.meta;
            return `<strong>${s.name}</strong><br/>${s.city}, ${s.country}<br/>Spend ${F.usdM(s.spend)} · Risk ${F.score(s.score)} (${s.rating})<br/>AVAR ${F.usdM(s.avar)} · TTR ${s.ttr}d`;
          }
        }),
        legend: Object.assign(SCR.theme.baseOption().legend, { top: 0 }),
        grid: { left: 8, right: 18, top: 62, bottom: 4, containLabel: true },
        xAxis: SCR.theme.valAxis({ name: 'Annual spend ($M)', nameLocation: 'middle', nameGap: 26, nameTextStyle: { color: t.ink3, fontSize: 11.5 } }),
        yAxis: SCR.theme.valAxis({ name: 'Node risk score', nameLocation: 'middle', nameGap: 32, min: 0, max: 5, nameTextStyle: { color: t.ink3, fontSize: 11.5 } }),
        series: Object.keys(byCat).map(cat => ({
          name: D.catName(cat), type: 'scatter',
          data: byCat[cat].map(s => ({
            value: [s.spend, s.score],
            symbolSize: 9 + Math.sqrt(Math.max(0.3, s.avar)) * 5.2,
            meta: s,
            itemStyle: { color: t.series[CAT_SLOT[cat]], opacity: 0.78, borderColor: t.surface, borderWidth: 2 }
          }))
        })),
        // risk threshold line
        graphic: []
      });
    });
    if (bubbleChart) bubbleChart.on('click', p => { if (p.data.meta) U.openSupplier(p.data.meta.id); });

    /* ===== Spend tree map ===== */
    const treeCard = U.card({
      title: 'Spend contribution — category → sub-category',
      sub: 'tree map of current-year spend · click to zoom',
      cols: 5, chartClass: 'chart-lg'
    });
    grid.appendChild(treeCard);
    SCR.charts.mount(treeCard._chartEl, () => {
      const t = SCR.theme.tokens();
      const tree = D.categories
        .filter(c => state.cat === 'all' || c.key === state.cat)
        .map(c => {
          const catMats = mats.filter(m => m.cat === c.key);
          const bySub = {};
          catMats.forEach(m => { bySub[m.sub] = (bySub[m.sub] || 0) + m.spend; });
          return {
            name: c.name,
            value: +catMats.reduce((a, m) => a + m.spend, 0).toFixed(0),
            itemStyle: { color: t.series[CAT_SLOT[c.key]] },
            children: Object.keys(bySub).map(sub => ({
              name: sub, value: +bySub[sub].toFixed(0),
              itemStyle: { color: t.series[CAT_SLOT[c.key]], opacity: 0.82 }
            }))
          };
        }).filter(n => n.value > 0);
      return Object.assign(SCR.theme.baseOption(), {
        tooltip: Object.assign(SCR.theme.baseOption().tooltip, {
          formatter: p => `<strong>${p.name}</strong><br/>${F.usdM(p.value)} spend`
        }),
        series: [{
          type: 'treemap',
          roam: false, nodeClick: 'zoomToNode',
          breadcrumb: { show: true, top: 0, itemStyle: { color: t.surface3, textStyle: { color: t.ink2 } } },
          label: { show: true, fontSize: 11.5, color: '#fff', formatter: p => p.name + '\n' + F.usdM(p.value) },
          upperLabel: { show: true, height: 22, color: '#fff', fontSize: 11.5, fontWeight: 600 },
          itemStyle: { borderColor: t.surface, borderWidth: 2, gapWidth: 2 },
          levels: [
            { itemStyle: { borderWidth: 0, gapWidth: 3 } },
            { itemStyle: { gapWidth: 2, borderColor: t.surface } }
          ],
          data: tree
        }]
      });
    });

    /* ===== Node data summary ===== */
    grid.appendChild(U.el('<div class="section-title col-12">Category node data</div>'));
    const nodeCard = U.card({
      title: 'Node data summary', sub: 'suppliers in scope · sales impacted, VAR / AVAR and resilience · click for the 360°',
      cols: 12, flush: true
    });
    grid.appendChild(nodeCard);
    const supRows = sups.slice().sort((a, b) => b.avar - a.avar);
    nodeCard.querySelector('.card-body').appendChild(U.table([
      { h: 'Node', cell: s => `<span class="cell-main">${U.esc(s.name)}</span><span class="cell-sub">${U.esc(s.city)}, ${U.esc(s.country)} · Tier ${s.tier}</span>` },
      { h: 'Category', cell: s => U.esc(s.catName) },
      { h: 'Products', cls: 'num', cell: s => s.productsCount },
      { h: 'Materials', cls: 'num', cell: s => s.materialsCount },
      { h: 'Sales impacted', cls: 'num', cell: s => F.usdM(s.depNTS) },
      { h: 'Spend', cls: 'num', cell: s => F.usdM(s.spend) },
      { h: 'VAR', cls: 'num', cell: s => F.usdM(s.var) },
      { h: 'AVAR', cls: 'num', cell: s => F.usdM(s.avar) },
      { h: 'TTR', cls: 'num', cell: s => F.days(s.ttr) },
      { h: 'Risk', cell: s => U.meter(s.score) },
      { h: 'RI', cell: s => U.riMeter(s.ri) }
    ], supRows, s => U.openSupplier(s.id)));

    /* ===== Material dependency + risk drivers ===== */
    const matCard = U.card({
      title: 'Material dependency', sub: 'material → supplier → products exposed · click for the material 360°',
      cols: 7, flush: true
    });
    grid.appendChild(matCard);
    matCard.querySelector('.card-body').appendChild(U.table([
      { h: 'Material', cell: m => `<span class="cell-main">${U.esc(m.name)}</span><span class="cell-sub">${U.esc(m.sub)}</span>` },
      { h: 'Supplier', cell: m => U.esc(D.supplierById(m.suppliers[0]).name) + (m.suppliers.length > 1 ? ` <span class="muted">+${m.suppliers.length - 1}</span>` : '') },
      { h: 'Sourcing', cell: m => m.singleSource ? '<span class="badge critical plain">Single</span>' : '<span class="badge low plain">Dual+</span>' },
      { h: 'Products', cls: 'num', cell: m => m.depProducts.length },
      { h: 'AVAR', cls: 'num', cell: m => F.usdM(m.avar) },
      { h: 'RRE', cls: 'num', cell: m => F.rre(m.rre) }
    ], mats.slice().sort((a, b) => b.avar - a.avar).slice(0, 9), m => U.openMaterial(m.id)));

    const dimCard = U.card({
      title: 'Risk-driver profile', sub: 'average driver scores across suppliers in scope',
      cols: 5
    });
    grid.appendChild(dimCard);
    const dimKeys = ['fin', 'qual', 'rel', 'geo', 'cyb', 'clim'];
    const avgDims = {};
    dimKeys.forEach(k => {
      avgDims[k] = +(sups.reduce((a, s) => a + s.dims[k], 0) / sups.length).toFixed(1);
    });
    dimCard.querySelector('.card-body').innerHTML = U.dimBars(avgDims) + `
      <div class="sim-out-note" style="margin-top:12px">
        Highest driver in scope: <strong>${{ fin: 'Financial', qual: 'Quality', rel: 'Reliability', geo: 'Geopolitical', cyb: 'Cyber', clim: 'Climate' }[dimKeys.slice().sort((a, b) => avgDims[b] - avgDims[a])[0]]}</strong>.
        Scores blend ERP performance data with external feeds — financial ratings, geo & climate indices, cyber posture — refreshed weekly.
      </div>`;

    /* ===== Alternate sourcing opportunities ===== */
    const altCard = U.card({
      title: 'Alternate sourcing opportunities', sub: 'risky single-source materials — qualification recommended',
      cols: 12, flush: true
    });
    grid.appendChild(altCard);
    const opp = D.materials.filter(m => m.singleSource && m.score >= 2.8)
      .sort((a, b) => b.avar - a.avar);
    altCard.querySelector('.card-body').appendChild(U.table([
      { h: 'Material', cell: m => `<span class="cell-main">${U.esc(m.name)}</span><span class="cell-sub">${U.esc(m.catName)}</span>` },
      { h: 'Sole supplier', cell: m => U.esc(D.supplierById(m.suppliers[0]).name) },
      { h: 'Gap', cls: 'num', cell: m => `<span style="font-weight:700;color:${m.gap > 0 ? 'var(--status-critical)' : 'var(--status-good)'}">${m.gap > 0 ? '−' + m.gap + 'd' : 'OK'}</span>` },
      { h: 'AVAR', cls: 'num', cell: m => F.usdM(m.avar) },
      { h: 'Substitution', cell: m => `<span class="muted" style="font-size:12.5px">${U.esc(m.substitution)}</span>` },
      {
        h: '', cell: m => `<button class="btn btn-sm btn-primary" data-act="${m.id}">Qualify alternate</button>`
      }
    ], opp));
    altCard.querySelectorAll('[data-act]').forEach(b =>
      b.addEventListener('click', e => {
        e.stopPropagation();
        const m = D.materialById(b.dataset.act);
        U.createAction('alternate supplier qualification — ' + m.name);
      }));
  }

  SCR.registerPage('category', {
    title: 'Category & Suppliers',
    crumb: 'Persona · Category / Procurement Leader — materials & sourcing',
    render
  });
})();
