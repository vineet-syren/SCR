/* ============================================================
   SCR · pages/actions.js
   Alerts & Actions — exception management and mitigation
   tracking. Alert inbox with acknowledge / assign / snooze ·
   mitigation pipeline funnel · resilience program Gantt ·
   action tracker with RRE before/after.
   ============================================================ */
window.SCR = window.SCR || {};

(function () {
  'use strict';

  const sevRank = { critical: 0, high: 1, medium: 2, low: 3 };
  const state = { sevFilter: 'all' };

  function render(host) {
    const D = SCR.data, F = SCR.fmt, U = SCR.ui;

    /* ===== KPI strip ===== */
    const open = D.alerts.filter(a => a.status !== 'closed');
    host.appendChild(U.kpiStrip([
      { icon: 'risk', color: 5, label: 'Open alerts', value: open.length, sub: D.kpis.criticalAlerts + ' critical', subClass: 'bad' },
      { icon: 'dollar', color: 3, label: 'Exposure across open alerts', value: F.usdM(+open.reduce((a, x) => a + x.exposure, 0).toFixed(1)), sub: 'VAR linked' },
      { icon: 'gap', color: 1, label: 'Actions in flight', value: D.kpis.openActions, sub: D.kpis.overdueActions + ' overdue', subClass: D.kpis.overdueActions ? 'bad' : 'good' },
      { icon: 'gauge', color: 2, label: 'AVAR mitigated YTD', value: F.usdM(D.kpis.mitigatedYtd), sub: '66 actions executed', subClass: 'good' },
      { icon: 'globe', color: 0, label: 'Mean detection lead', value: D.kpis.detectionLeadDays + 'd', sub: 'signal → alert' }
    ]));

    const grid = U.el('<div class="grid grid-12"></div>');
    host.appendChild(grid);

    /* ===== Alert inbox ===== */
    const segSev = U.el(`<div class="seg">
      <button data-s="all" class="${state.sevFilter === 'all' ? 'active' : ''}">All</button>
      <button data-s="critical" class="${state.sevFilter === 'critical' ? 'active' : ''}">Critical</button>
      <button data-s="high" class="${state.sevFilter === 'high' ? 'active' : ''}">High</button>
      <button data-s="medium" class="${state.sevFilter === 'medium' ? 'active' : ''}">Med / Low</button>
    </div>`);
    const inboxCard = U.card({
      title: 'Alert inbox', sub: 'persona-routed exceptions · acknowledge, assign or snooze',
      cols: 7, actions: [segSev]
    });
    grid.appendChild(inboxCard);
    const inboxBody = inboxCard.querySelector('.card-body');

    const sevColor = { critical: 'var(--status-critical)', high: 'var(--status-serious)', medium: 'var(--status-warning)', low: 'var(--ink-3)' };

    function renderInbox() {
      const rows = D.alerts
        .filter(a => state.sevFilter === 'all' ? true : state.sevFilter === 'medium' ? (a.sev === 'medium' || a.sev === 'low') : a.sev === state.sevFilter)
        .slice().sort((a, b) => (a.status === 'closed') - (b.status === 'closed') || sevRank[a.sev] - sevRank[b.sev] || b.exposure - a.exposure);
      inboxBody.innerHTML = '';
      rows.forEach(a => {
        const row = U.el(`<div class="alert-row ${a.status === 'closed' ? 'closed' : ''}">
          <span class="a-sev" style="background:${sevColor[a.sev]}"></span>
          <div class="a-main">
            <div class="a-title" style="cursor:pointer">${U.esc(a.title)}</div>
            <div class="a-sub">${U.esc(a.type)} · ${U.esc(a.owner)} · ${U.esc(a.time)}${a.exposure ? ' · ' + F.usdM(a.exposure) + ' exposure' : ''}</div>
          </div>
          <div class="a-side">
            ${U.statusBadge(a.status)}
            <div class="flex gap8">
              ${a.status === 'open' ? `<button class="btn btn-sm" data-op="ack">Acknowledge</button>
              <button class="btn btn-sm btn-primary" data-op="assign">Assign</button>` :
              a.status !== 'closed' ? `<button class="btn btn-sm btn-good" data-op="close">Close</button>` : ''}
            </div>
          </div>
        </div>`);
        row.querySelector('.a-title').addEventListener('click', () => U.openAlert(a.id));
        row.querySelectorAll('[data-op]').forEach(b => b.addEventListener('click', () => {
          const op = b.dataset.op;
          if (op === 'ack') { a.status = 'ack'; U.toast('Alert acknowledged', `${a.id} marked as acknowledged.`, ''); }
          if (op === 'assign') { a.status = 'assigned'; U.toast('Alert assigned', `${a.id} routed to <strong>${U.esc(a.owner)}</strong> with a draft action attached.`, 'good'); }
          if (op === 'close') { a.status = 'closed'; U.toast('Alert closed', `${a.id} closed with resolution note.`, 'good'); }
          renderInbox();
        }));
        inboxBody.appendChild(row);
      });
      if (!rows.length) inboxBody.innerHTML = '<div class="empty">No alerts in this bucket.</div>';
    }
    renderInbox();
    segSev.querySelectorAll('button').forEach(b => b.addEventListener('click', () => {
      state.sevFilter = b.dataset.s;
      segSev.querySelectorAll('button').forEach(x => x.classList.toggle('active', x === b));
      renderInbox();
    }));

    /* ===== Funnel ===== */
    const funnelCard = U.card({
      title: 'Mitigation pipeline', sub: 'FY26 YTD — from sensed signal to executed action',
      cols: 5, chartClass: 'chart-lg'
    });
    grid.appendChild(funnelCard);
    SCR.charts.mount(funnelCard._chartEl, () => {
      const t = SCR.theme.tokens();
      const ord = t.ordinal;
      return Object.assign(SCR.theme.baseOption(), {
        tooltip: Object.assign(SCR.theme.baseOption().tooltip, {
          formatter: p => {
            const first = D.funnel[0].value;
            return `<strong>${p.name}</strong><br/>${F.num(p.value)} · ${(p.value / first * 100).toFixed(1)}% of signals`;
          }
        }),
        legend: { show: false },
        series: [{
          type: 'funnel',
          left: 0, right: 148, top: 8, bottom: 8,
          sort: 'descending', gap: 3,
          minSize: '12%',
          label: { color: t.ink, fontSize: 12, formatter: p => `${p.name}  ·  ${F.num(p.value)}` },
          labelLine: { lineStyle: { color: t.axis } },
          itemStyle: { borderColor: t.surface, borderWidth: 2, borderRadius: 4 },
          data: D.funnel.map((f, i) => ({
            name: f.stage, value: f.value,
            itemStyle: { color: ord[Math.min(i, ord.length - 1)] }
          }))
        }]
      });
    });

    /* ===== Gantt ===== */
    grid.appendChild(U.el('<div class="section-title col-12">Resilience programs</div>'));
    const ganttCard = U.card({
      title: 'Program timeline', sub: 'assessment → design → build → testing → rollout · dashed line = today',
      cols: 12, chartClass: 'chart-md'
    });
    grid.appendChild(ganttCard);
    SCR.charts.gantt(ganttCard._chartEl, D.gantt);

    /* ===== Action tracker ===== */
    const trackCard = U.card({
      title: 'Mitigation action tracker', sub: 'owner, due date, expected AVAR reduction and residual risk before/after',
      cols: 12, flush: true
    });
    grid.appendChild(trackCard);
    trackCard.querySelector('.card-body').appendChild(U.table([
      { h: 'Action', cell: a => `<span class="cell-main">${U.esc(a.title)}</span><span class="cell-sub">${U.esc(a.id)} · linked ${U.esc(a.linked)}</span>` },
      { h: 'Type', cell: a => `<span class="badge neutral plain">${U.esc(a.type)}</span>` },
      { h: 'Owner', cell: a => U.esc(a.owner) },
      { h: 'Due', cell: a => `<span style="${a.status === 'Overdue' ? 'color:var(--status-critical);font-weight:700' : ''}">${U.esc(a.due)}</span>` },
      { h: 'Cost', cls: 'num', cell: a => F.usdM(a.cost) },
      { h: 'AVAR cut', cls: 'num', cell: a => a.riskCut ? `<span style="color:var(--status-good);font-weight:700">−${F.usdM(a.riskCut)}</span>` : '–' },
      { h: 'RRE pre → post', cls: 'num', cell: a => a.rrePre != null ? `${a.rrePre.toFixed(2)} → <strong>${a.rrePost.toFixed(2)}</strong>` : '–' },
      { h: 'Status', cell: a => U.statusBadge(a.status) }
    ], D.actions, a => {
      const alert = D.alertById(a.linked);
      if (alert) U.openAlert(alert.id);
    }));
  }

  SCR.registerPage('actions', {
    title: 'Alerts & Actions',
    crumb: 'Exception management · mitigation portfolio',
    render
  });
})();
