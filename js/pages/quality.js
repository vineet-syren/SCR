/* ============================================================
   SCR · pages/quality.js
   Data Quality & Governance — completeness by domain, missing
   TTR/TTS/RRE worklist with owners, refresh log.
   ============================================================ */
window.SCR = window.SCR || {};

(function () {
  'use strict';

  function pctColor(p) {
    if (p >= 95) return 'var(--status-good)';
    if (p >= 88) return 'var(--status-warning)';
    if (p >= 80) return 'var(--status-serious)';
    return 'var(--status-critical)';
  }

  function render(host) {
    const D = SCR.data, F = SCR.fmt, U = SCR.ui;
    const dq = D.dataQuality;

    /* ===== KPI strip ===== */
    const go = id => () => U.scrollToCard(document.getElementById(id));
    host.appendChild(U.kpiStrip([
      { icon: 'layers', color: 0, label: 'Components mapped', value: F.num(dq.componentsTotal), sub: 'coverage by sector', onClick: go('dqSector') },
      { icon: 'gap', color: 3, label: 'Missing TTR', value: F.num(dq.missingTTR), sub: '−38 this week · worklist', subClass: 'good', onClick: go('dqWorklist') },
      { icon: 'gap', color: 2, label: 'Missing TTS', value: F.num(dq.missingTTS), sub: 'fully covered', subClass: 'good', onClick: go('dqWorklist') },
      { icon: 'gap', color: 6, label: 'Missing RRE', value: F.num(dq.missingRRE), sub: 'assessments pending', onClick: go('dqWorklist') },
      {
        icon: 'gauge', color: 1, label: 'Trust score', value: '92.4%',
        progress: { pct: 92.4, color: 'var(--status-good)' }, sub: '+1.1 pts vs last month', subClass: 'good',
        onClick: go('dqDomains')
      }
    ]));

    const grid = U.el('<div class="grid grid-12"></div>');
    host.appendChild(grid);

    /* ===== Completeness by domain ===== */
    const domCard = U.card({
      title: 'Completeness by data domain', sub: 'share of required fields populated after the week-28 refresh',
      cols: 6
    });
    domCard.id = 'dqDomains';
    grid.appendChild(domCard);
    domCard.querySelector('.card-body').innerHTML = dq.domains.map(d => `
      <div class="dq-row">
        <span class="dq-label">${U.esc(d.name)}</span>
        <span class="dq-track"><span class="dq-fill" style="width:${d.pct}%;background:${pctColor(d.pct)}"></span></span>
        <span class="dq-val" style="color:${pctColor(d.pct)}">${d.pct.toFixed(1)}%</span>
      </div>`).join('') + `
      <div class="sim-out-note" style="margin-top:10px">
        TTR assessments are the weakest domain (78.4%) — concentrated in Electronics &amp; Components BOMs
        migrated from the legacy PLM. Worklist below assigns owners; resilience math falls back to
        supplier-level TTR where component TTR is missing, flagged with lower confidence.
      </div>`;

    /* ===== Completeness by sector ===== */
    const secCard = U.card({
      title: 'TTR / TTS / RRE coverage by sector', sub: '% of components with populated resilience inputs',
      cols: 6, chartClass: 'chart-md'
    });
    secCard.id = 'dqSector';
    grid.appendChild(secCard);
    SCR.charts.mount(secCard._chartEl, () => {
      const t = SCR.theme.tokens();
      const rows = dq.bySector;
      return Object.assign(SCR.theme.baseOption(), {
        tooltip: Object.assign(SCR.theme.baseOption().tooltip, {
          trigger: 'axis', axisPointer: { type: 'shadow' },
          formatter: ps => {
            let h = `<strong>${ps[0].axisValue}</strong>`;
            ps.forEach(p => { h += `<br/>${p.marker} ${p.seriesName}: <strong>${p.value}%</strong>`; });
            return h;
          }
        }),
        legend: Object.assign(SCR.theme.baseOption().legend, { top: 0 }),
        grid: { left: 8, right: 14, top: 32, bottom: 4, containLabel: true },
        xAxis: SCR.theme.catAxis(rows.map(r => r.sector), { axisLabel: { color: t.ink3, fontSize: 11.5, interval: 0, width: 110, overflow: 'break' } }),
        yAxis: SCR.theme.valAxis({ min: 0, max: 100, axisLabel: { formatter: v => v + '%' } }),
        series: [
          { name: 'TTR', type: 'bar', data: rows.map(r => r.ttr), barMaxWidth: 18, itemStyle: { color: t.series[0], borderRadius: [3, 3, 0, 0] } },
          { name: 'TTS', type: 'bar', data: rows.map(r => r.tts), barMaxWidth: 18, itemStyle: { color: t.series[1], borderRadius: [3, 3, 0, 0] } },
          { name: 'RRE', type: 'bar', data: rows.map(r => r.rre), barMaxWidth: 18, itemStyle: { color: t.series[2], borderRadius: [3, 3, 0, 0] } }
        ]
      });
    });

    /* ===== Worklist ===== */
    const wlCard = U.card({
      title: 'Missing-data worklist', sub: 'gaps assigned to data owners · auto-generated from the weekly refresh',
      cols: 12, flush: true
    });
    wlCard.id = 'dqWorklist';
    grid.appendChild(wlCard);
    wlCard.querySelector('.card-body').appendChild(U.table([
      { h: 'Item', cell: w => `<span class="cell-main">${U.esc(w.item)}</span>` },
      { h: 'Gap', cell: w => `<span class="badge high plain">${U.esc(w.gap)}</span>` },
      { h: 'Sector', cell: w => U.esc(w.sector) },
      { h: 'Owner', cell: w => U.esc(w.owner) },
      { h: 'Due', cell: w => U.esc(w.due) },
      { h: '', cell: () => '<button class="btn btn-sm">Nudge owner</button>' }
    ], dq.worklist));
    wlCard.querySelectorAll('.btn').forEach(b => b.addEventListener('click', e => {
      e.stopPropagation();
      U.toast('Reminder sent', 'The data owner was nudged with the gap details and due date.', '');
    }));

    /* ===== Refresh log ===== */
    const logCard = U.card({
      title: 'Refresh & pipeline log', sub: 'weekly full refresh by default · daily external feeds',
      cols: 12, flush: true
    });
    grid.appendChild(logCard);
    logCard.querySelector('.card-body').appendChild(U.table([
      { h: 'Run', cell: r => `<span class="cell-main">${U.esc(r.run)}</span>` },
      { h: 'When', cell: r => U.esc(r.when) },
      { h: 'Volume', cell: r => U.esc(r.rows) },
      { h: 'Status', cell: r => r.status.startsWith('Success') ? '<span class="badge low plain">Success</span>' : `<span class="badge medium plain">${U.esc(r.status)}</span>` }
    ], dq.refreshLog));
  }

  SCR.registerPage('quality', {
    title: 'Data Quality',
    crumb: 'Govern the inputs the resilience math depends on',
    render
  });
})();
