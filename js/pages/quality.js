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
      cols: 6,
      insight: () => {
        const d = (D.dataQuality && D.dataQuality.domains) || [];
        const r = d.slice().sort((a, b) => a.pct - b.pct);
        return {
          agent: 'Resilience Copilot',
          reads: [
            { label: 'Domains tracked', value: d.length },
            { label: 'Weakest', value: r.length ? r[0].name : '—' },
            { label: 'Its completeness', value: r.length ? r[0].pct + '%' : '—', tone: r.length && r[0].pct < 85 ? 'bad' : 'good' }
          ],
          points: [
            r.length ? `<strong>${U.esc(r[0].name)}</strong> is the least complete domain at ${r[0].pct}% of required fields populated.` : 'No domains tracked.',
            'Completeness caps confidence: a resilience index computed on partial TTR or inventory data is precise-looking but under-evidenced.',
            r.length > 1 ? `Best covered is ${U.esc(r[r.length - 1].name)} at ${r[r.length - 1].pct}%.` : ''
          ].filter(Boolean),
          actions: [{ label: 'Open the worklist', onClick: () => U.scrollToCard(document.getElementById('dqWorklist')) }]
        };
      }
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
      cols: 6, chartClass: 'chart-md',
      insight: () => ({
        agent: 'TTS Watch Agent',
        reads: [
          { label: 'Sectors', value: D.sectors.length },
          { label: 'Components missing TTR', value: (D.dataQuality && D.dataQuality.missingTTR) != null ? D.dataQuality.missingTTR : '—', tone: 'bad' },
          { label: 'TTR > TTS found', value: D.kpis.gapMaterials, tone: 'bad' }
        ],
        points: [
          'TTR, TTS and RRE are the three inputs every downstream number depends on — VAR, AVAR and the resilience index are all derived from them.',
          'A sector with low coverage here is not necessarily low risk; it is unmeasured risk, which is the more dangerous of the two.',
          `${D.kpis.gapMaterials} components are currently known to recover slower than they survive — that count can only grow as coverage improves.`
        ],
        actions: [{ label: 'Open Value Streams', onClick: () => SCR.navigate('valuestream') }]
      })
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
        xAxis: SCR.theme.catAxis(rows.map(r => r.sector), { axisLabel: { color: t.ink3, fontSize: 12.5, interval: 0, width: 110, overflow: 'break' } }),
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
      cols: 12, flush: true,
      insight: () => {
        const w = (D.dataQuality && D.dataQuality.worklist) || [];
        const byOwner = {};
        w.forEach(x => { byOwner[x.owner] = (byOwner[x.owner] || 0) + 1; });
        const busiest = Object.entries(byOwner).sort((a, b) => b[1] - a[1])[0];
        return {
          agent: 'Execution & Workflow Agent',
          reads: [
            { label: 'Open gaps', value: w.length, tone: w.length ? 'bad' : 'good' },
            { label: 'Owners involved', value: Object.keys(byOwner).length },
            { label: 'Largest queue', value: busiest ? busiest[1] : '—' }
          ],
          points: [
            `${w.length} data gaps are assigned rather than merely reported, so each one has an owner and a due path.`,
            busiest ? `<strong>${U.esc(busiest[0])}</strong> holds the largest queue at ${busiest[1]} item${busiest[1] === 1 ? '' : 's'}.` : '',
            'Closing these is what moves the coverage chart above, which in turn tightens every resilience figure in the product.'
          ].filter(Boolean),
          actions: [{ label: 'See coverage by sector', onClick: () => U.scrollToCard(document.getElementById('dqSector')) }]
        };
      }
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
      cols: 12, flush: true,
      insight: () => ({
        agent: 'Resilience Copilot',
        reads: [
          { label: 'Full refresh', value: 'Weekly' },
          { label: 'External feeds', value: 'Daily' },
          { label: 'Domains', value: ((D.dataQuality && D.dataQuality.domains) || []).length }
        ],
        points: [
          'Resilience inputs recompute weekly; external risk feeds land daily. That cadence is why an alert can be newer than the index it sits beside.',
          'Every figure in the product carries the timestamp of its slowest input, so a weekly-refreshed TTR bounds how fresh a derived AVAR can be.',
          'Use this log to check whether a surprising number reflects reality or simply a feed that has not landed yet.'
        ],
        actions: [{ label: 'Back to Executive Summary', onClick: () => SCR.navigate('executive') }]
      })
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
