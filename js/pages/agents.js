/* ============================================================
   SCR · pages/agents.js
   AI Agents — the agentic layer. Approval queue for agent
   recommendations · full activity feed (rows open the agent's
   360° drawer) · daily digest generator.
   ============================================================ */
window.SCR = window.SCR || {};

(function () {
  'use strict';

  /* What each agent watches, and the moves it can hand off. */
  const AGENT_DETAIL = {
    sensing: {
      watches: 'External risk feeds (weather, geopolitical, financial, cyber, labour, logistics) plus every node threshold. Matches signals to the graph, scores severity and escalates breaches to the owning persona.',
      actions: [
        { label: 'Open Alerts inbox', go: () => SCR.navigate('actions') },
        { label: 'Open Network Explorer', go: () => SCR.navigate('network') }
      ]
    },
    impact: {
      watches: 'Recomputes VAR / AVAR whenever inventory, demand, BOM or a node score moves, and traces the product → market path so exposure is always attributed to real revenue.',
      actions: [
        { label: 'Open Executive Summary', go: () => SCR.navigate('executive') },
        { label: 'Open Value Streams', go: () => SCR.navigate('valuestream') }
      ]
    },
    inventory: {
      watches: 'Tracks inventory cover (TTS) against recovery time (TTR) on every component, flags TTR > TTS the moment it appears and raises cover alerts before a safety floor is breached.',
      actions: [
        { label: 'Open Site Resilience', go: () => SCR.navigate('site') },
        { label: 'Open Data Quality', go: () => SCR.navigate('quality') }
      ]
    },
    mitigation: {
      watches: 'Ranks mitigation options by cost, time-to-effect and residual-risk reduction, then proposes the best plan for each open risk. Approving one hands off to Execution & Workflow.',
      actions: [
        { label: 'Review pending recommendations', go: () => { SCR.ui.closeDrawer(); const c = document.getElementById('agQueue'); SCR.ui.scrollToCard(c); } },
        { label: 'Open Scenario Studio', go: () => SCR.navigate('scenario') }
      ]
    },
    workflow: {
      watches: 'Turns approved actions into tickets, POs, contract changes and notifications across 7 connected systems, then re-scores RRE once the action lands.',
      actions: [
        { label: 'Open action tracker', go: () => SCR.navigate('actions') }
      ]
    },
    scenario: {
      watches: 'Runs node-failure simulations on the digital twin before disruption hits — impacted SKUs, revised value at risk and the cheapest recovery plan — and stores the winners as continuity playbooks.',
      actions: [
        { label: 'Open Scenario Studio', go: () => SCR.navigate('scenario') },
        { label: 'Open Network Explorer', go: () => SCR.navigate('network') }
      ]
    }
  };

  function openAgent(a) {
    const D = SCR.data, F = SCR.fmt, U = SCR.ui;
    const det = AGENT_DETAIL[a.key] || { watches: a.role, actions: [] };
    const acts = D.feed.filter(f => f.agent === a.key);
    U.openDrawer('AI agent · live', a.name, body => {
      body.innerHTML = `
        <div class="drawer-section">
          <div class="flex aic gap8" style="margin-bottom:12px">
            <span class="agent-status"><span class="pulse"></span>LIVE</span>
            <span class="muted" style="font-size:12px">${U.esc(a.role)}</span>
          </div>
          <div class="facts">
            ${a.stats.map(([l, v]) => `<div class="fact"><div class="f-label">${U.esc(l)}</div><div class="f-value">${typeof v === 'number' && v % 1 !== 0 ? v.toFixed(1) : F.num(v)}</div></div>`).join('')}
          </div>
        </div>
        <div class="drawer-section">
          <h3>What this agent does</h3>
          <div class="sim-out-note">${U.esc(det.watches)}</div>
        </div>
        <div class="drawer-section">
          <h3>Recent activity</h3>
          ${acts.length ? `<div class="feed">${acts.map(f => `<div class="feed-item">
            <span style="width:9px;height:9px;border-radius:50%;background:var(--series-${a.color});flex-shrink:0;margin-top:6px"></span>
            <div class="feed-body"><div class="f-text">${f.text}</div></div>
            <span class="feed-time">${U.esc(f.time)} UTC</span>
          </div>`).join('')}</div>` : '<div class="muted" style="font-size:13px">No activity in the last 3 hours.</div>'}
        </div>
        <div class="drawer-section">
          <h3>Jump to</h3>
          <div class="flex gap8" style="flex-wrap:wrap" id="agActs"></div>
        </div>`;
      const wrap = body.querySelector('#agActs');
      det.actions.forEach((ac, i) => {
        const b = U.el(`<button class="btn btn-sm ${i === 0 ? 'btn-primary' : ''}">${U.esc(ac.label)}</button>`);
        b.addEventListener('click', () => { if (ac.go) ac.go(); });
        wrap.appendChild(b);
      });
    });
  }

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

    const grid = U.el('<div class="grid grid-12"></div>');
    host.appendChild(grid);

    /* ===== Approval queue ===== */
    const queueCard = U.card({
      title: 'Recommendations awaiting approval',
      sub: 'proposed by the Mitigation Strategist Agent · approving hands off to Execution & Workflow',
      cols: 7
    });
    queueCard.id = 'agQueue';
    grid.appendChild(queueCard);
    const qBody = queueCard.querySelector('.card-body');
    function renderQueue() {
      qBody.innerHTML = '';
      D.recommendations.forEach(r => {
        const node = U.el(`<div class="reco ${r.status !== 'pending' ? 'done' : ''}">
          <div class="reco-head">
            <span class="reco-title">${U.esc(r.title)}</span>
            <span class="badge neutral plain" style="cursor:pointer" data-alert="${U.esc(r.linked)}">${U.esc(r.linked)}</span>
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
        const linkBadge = node.querySelector('[data-alert]');
        if (linkBadge) linkBadge.addEventListener('click', e => { e.stopPropagation(); U.openAlert(linkBadge.dataset.alert); });
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
      title: 'Agent activity — last 3 hours', sub: 'what the layer sensed, computed and executed · click a row to open its agent',
      cols: 5, actions: [btnDigest]
    });
    grid.appendChild(feedCard);
    const feedWrap = U.el('<div class="feed"></div>');
    D.feed.forEach(f => {
      const a = D.agents.find(x => x.key === f.agent) || { name: f.agent, color: 1 };
      const item = U.el(`<div class="feed-item" style="cursor:pointer">
        <span style="width:9px;height:9px;border-radius:50%;background:var(--series-${a.color});flex-shrink:0;margin-top:6px"></span>
        <div class="feed-body">
          <span class="f-agent" style="color:var(--series-${a.color})">${U.esc(a.name)}</span>
          <div class="f-text">${f.text}</div>
        </div>
        <span class="feed-time">${U.esc(f.time)} UTC</span>
      </div>`);
      if (AGENT_DETAIL[f.agent]) item.addEventListener('click', () => openAgent(a));
      feedWrap.appendChild(item);
    });
    feedCard.querySelector('.card-body').appendChild(feedWrap);
  }

  SCR.registerPage('agents', {
    title: 'AI Agents',
    render
  });
})();
