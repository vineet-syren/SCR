/* ============================================================
   SCR · pages/agents.js
   AI Agents — the agentic layer. Six live agents · approval
   queue for agent recommendations · full activity feed ·
   daily digest generator.
   ============================================================ */
window.SCR = window.SCR || {};

(function () {
  'use strict';

  const ICONS = {
    radar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M19.1 4.9A10 10 0 1 0 22 12"/><path d="M16.2 7.8A6 6 0 1 0 18 12"/><circle cx="12" cy="12" r="1.6"/><path d="m12 12 7-7"/></svg>',
    target: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.4"/></svg>',
    gauge: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 14a8 8 0 1 1 16 0"/><path d="m12 14 4-4"/><path d="M4 19h16"/></svg>',
    route: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="19" r="2.4"/><circle cx="18" cy="5" r="2.4"/><path d="M8.4 19H15a4 4 0 0 0 0-8H9a4 4 0 0 1 0-8h6.6"/></svg>',
    flow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="6" height="6" rx="1.5"/><rect x="15" y="15" width="6" height="6" rx="1.5"/><path d="M9 6h5a4 4 0 0 1 4 4v5"/><path d="m6 9v6a4 4 0 0 0 4 4h1"/></svg>',
    branch: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M6 3v12"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="6" r="3"/><path d="M18 9a9 9 0 0 1-9 9"/></svg>'
  };

  function openDigest() {
    const D = SCR.data, F = SCR.fmt, esc = SCR.ui.esc;
    const pending = D.recommendations.filter(r => r.status === 'pending');
    const h4 = 'font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:var(--ink-3);margin:15px 0 6px';
    SCR.ui.modal('Daily resilience digest — ' + D.asOf, `
      <div style="font-size:13.5px;line-height:1.62;color:var(--ink-2)">
        <p style="margin:0">Overnight, the sensing layer processed <strong>231 signals</strong>, matched 42 to network
        nodes and escalated 6. The twin recomputed AVAR on ${F.usdM(52.7)} of exposure and ran 11 scenarios.</p>
        <h4 style="${h4}">Needs a human decision</h4>
        <ul style="margin:0;padding-left:18px">
          ${pending.map(r => `<li style="margin:3px 0"><strong style="color:var(--ink)">${esc(r.title)}</strong>
            — protects ${F.usdM(r.exposure)} · ${esc(r.cost)} · approvers: ${esc(r.approvers)}</li>`).join('')}
        </ul>
        <h4 style="${h4}">What changed since yesterday</h4>
        <ul style="margin:0;padding-left:18px">
          <li>Closures cover at Pune recalculated 7d → <strong>6d</strong> (AL-301)</li>
          <li>Indonesia levy probability raised 35% → <strong>55%</strong></li>
          <li>Program G3 (enzyme buffer) build phase reached <strong>58%</strong></li>
          <li>OJ concentrate breached its 20-day safety floor — expedite overdue</li>
        </ul>
        <h4 style="${h4}">Agent health</h4>
        <p style="margin:0">All 6 agents nominal. 7 connected systems · last full graph rebuild 05:00 UTC · weekly recalc complete.</p>
      </div>`);
  }

  function render(host) {
    const D = SCR.data, F = SCR.fmt, U = SCR.ui;

    /* ===== Agent cards ===== */
    const agentGrid = U.el('<div class="agent-grid" style="margin-bottom:16px"></div>');
    D.agents.forEach(a => {
      const card = U.el(`<div class="agent-card">
        <div class="agent-top">
          <span class="agent-icon" style="background:color-mix(in srgb, var(--series-${a.color}) 14%, transparent);color:var(--series-${a.color})">${ICONS[a.icon] || ICONS.radar}</span>
          <div>
            <div class="agent-name">${U.esc(a.name)}</div>
            <div class="agent-role">${U.esc(a.role)}</div>
          </div>
          <span class="agent-status"><span class="pulse"></span>LIVE</span>
        </div>
        <div class="agent-stats">
          ${a.stats.map(([l, v]) => `<div class="agent-stat"><div class="as-val">${typeof v === 'number' && v % 1 !== 0 ? v.toFixed(1) : F.num(v)}</div><div class="as-label">${U.esc(l)}</div></div>`).join('')}
        </div>
      </div>`);
      agentGrid.appendChild(card);
    });
    host.appendChild(agentGrid);

    const grid = U.el('<div class="grid grid-12"></div>');
    host.appendChild(grid);

    /* ===== Approval queue ===== */
    const queueCard = U.card({
      title: 'Recommendations awaiting approval',
      sub: 'proposed by the Mitigation Strategist Agent · approving hands off to Execution & Workflow',
      cols: 7
    });
    grid.appendChild(queueCard);
    const qBody = queueCard.querySelector('.card-body');
    function renderQueue() {
      qBody.innerHTML = '';
      D.recommendations.forEach(r => {
        const node = U.el(`<div class="reco ${r.status !== 'pending' ? 'done' : ''}">
          <div class="reco-head">
            <span class="reco-title">${U.esc(r.title)}</span>
            <span class="badge neutral plain">${U.esc(r.linked)}</span>
          </div>
          <div style="font-size:12.5px;color:var(--ink-3);margin-top:4px">${U.esc(r.detail)}</div>
          <div class="reco-meta">
            <span class="rm">Protects<strong>${F.usdM(r.exposure)}</strong></span>
            <span class="rm">Risk cut<strong class="good">${U.esc(r.riskCut)}</strong></span>
            <span class="rm">Cost<strong>${U.esc(r.cost)}</strong></span>
            <span class="rm">Approvers<strong style="font-size:12px">${U.esc(r.approvers)}</strong></span>
          </div>
          <div class="reco-actions">
            ${r.status === 'pending'
              ? '<button class="btn btn-sm btn-good" data-op="approve">Approve</button><button class="btn btn-sm btn-ghost" data-op="dismiss">Dismiss</button>'
              : r.status === 'approved'
                ? '<span class="approved-tag">✓ Approved — execution ticket created</span>'
                : '<span class="dismissed-tag">Dismissed</span>'}
          </div>
        </div>`);
        node.querySelectorAll('[data-op]').forEach(b => b.addEventListener('click', () => {
          if (b.dataset.op === 'approve') {
            r.status = 'approved';
            U.toast('Recommendation approved',
              `Execution & Workflow Agent opened a ticket for <strong>${U.esc(r.id)}</strong>, notified approvers and scheduled the RRE re-score.`, 'good');
          } else {
            r.status = 'dismissed';
            U.toast('Recommendation dismissed', `${r.id} archived with your rationale requested.`, '');
          }
          renderQueue();
        }));
        qBody.appendChild(node);
      });
    }
    renderQueue();

    /* ===== Live feed ===== */
    const btnDigest = U.el('<button class="btn btn-sm btn-primary">Generate daily digest</button>');
    btnDigest.addEventListener('click', openDigest);
    const feedCard = U.card({
      title: 'Agent activity — last 3 hours', sub: 'what the layer sensed, computed and executed',
      cols: 5, actions: [btnDigest]
    });
    grid.appendChild(feedCard);
    const feedWrap = U.el('<div class="feed"></div>');
    D.feed.forEach(f => {
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
  }

  SCR.registerPage('agents', {
    title: 'AI Agents',
    crumb: 'The agentic layer · sensing → impact → mitigation → execution',
    render
  });
})();
