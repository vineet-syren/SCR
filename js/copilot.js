/* ============================================================
   SCR · copilot.js
   Resilience Copilot — conversational panel over the live
   dataset. Keyword-routed intents; every answer is computed
   from SCR.data at ask-time (no canned numbers) and attributed
   to the agent that owns the underlying capability.
   ============================================================ */
window.SCR = window.SCR || {};

(function () {
  const D = () => SCR.data;
  const esc = s => SCR.ui.esc(s);

  let panel, thread, input;

  const AGENTS = {
    sensing: 'Network Sensing Agent',
    impact: 'Impact & VAR Agent',
    inventory: 'TTS Watch Agent',
    mitigation: 'Mitigation Strategist Agent',
    scenario: 'Scenario Twin Agent',
    copilot: 'Resilience Copilot'
  };

  const DEFAULT_SUGGESTS = [
    'Top 5 risk nodes by AVAR',
    'Which products have TTR > TTS?',
    'Why is CapForm Industries critical?',
    'Biggest value at risk right now',
    'Mitigation plan for single-source materials',
    'Daily resilience brief'
  ];
  let SUGGESTS = DEFAULT_SUGGESTS.slice();

  /** Persona lens: swap the suggestion chips (called by the persona switcher). */
  function setSuggests(list) {
    SUGGESTS = (list && list.length ? list : DEFAULT_SUGGESTS).slice();
    const sug = document.getElementById('copilotSuggests');
    if (!sug) return;
    sug.innerHTML = '';
    SUGGESTS.forEach(s => {
      const chip = SCR.ui.el(`<button class="chip">${esc(s)}</button>`);
      chip.addEventListener('click', () => ask(s));
      sug.appendChild(chip);
    });
  }

  const DIM_NAMES = { fin: 'Financial', qual: 'Quality', rel: 'Reliability', geo: 'Geopolitical', cyb: 'Cyber', clim: 'Climate' };

  /* ---------------- Thread rendering ---------------- */
  function scrollBottom() { thread.scrollTop = thread.scrollHeight; }

  function appendUser(text) {
    thread.appendChild(SCR.ui.el(
      `<div class="msg user"><div class="bubble">${esc(text)}</div></div>`));
    scrollBottom();
  }

  /** answer: { tag, html, actions:[{label, go}], followUp, after } */
  function appendBot(a) {
    const node = SCR.ui.el(`<div class="msg bot">
      <span class="agent-tag">✦ ${esc(a.tag)}</span>
      <div class="bubble">${a.html}${
        a.followUp ? `<div class="muted" style="font-size:12px;margin-top:8px">Follow-up: try “${esc(a.followUp)}”</div>` : ''
      }</div>
    </div>`);
    if (a.actions && a.actions.length) {
      const row = SCR.ui.el('<div class="msg-actions"></div>');
      a.actions.forEach(ac => {
        const b = SCR.ui.el(`<button class="chip">${esc(ac.label)}</button>`);
        b.addEventListener('click', ac.go);
        row.appendChild(b);
      });
      node.appendChild(row);
    }
    thread.appendChild(node);
    scrollBottom();
    if (a.after) a.after();
  }

  function ask(text) {
    appendUser(text);
    syncFabDot();
    const typing = SCR.ui.el(
      '<div class="msg bot"><div class="bubble typing"><i></i><i></i><i></i></div></div>');
    thread.appendChild(typing);
    scrollBottom();
    const answer = route(text);
    setTimeout(() => { typing.remove(); appendBot(answer); }, 650 + Math.random() * 400);
  }

  /* ---------------- Entity extraction ---------------- */
  function findSupplier(q) {
    for (const s of D().suppliers) {
      const words = s.name.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(w => w.length > 2);
      if (words.some(w => q.includes(w))) return s;
    }
    return null;
  }
  function findSite(q) {
    return D().plants.find(p => q.includes(p.name.split(',')[0].toLowerCase())) || null;
  }

  /* ---------------- Intent router ---------------- */
  function route(text) {
    const q = text.toLowerCase();
    const sup = findSupplier(q);
    const site = findSite(q);
    if (/why .*(critical|high|risky)|explain/.test(q) && sup) return whySupplier(sup);
    if (/top .*(node|supplier|risk)/.test(q)) return topNodes();
    if (/ttr\s*>\s*tts|recover|gap|survive/.test(q)) return gapAnswer();
    if (/single[- ]source|sole[- ]source/.test(q) && /plan|mitigat/.test(q)) return mitigationPlan();
    if (/single[- ]source|sole[- ]source/.test(q)) return singleSource();
    if (/value at risk|avar|var|exposure/.test(q)) return biggestVar();
    if (/what if|simulate|outage|fails/.test(q)) return whatIf(sup, site);
    if (/brief|digest|summary|summarize/.test(q)) return dailyBrief();
    if (site) return siteStatus(site);
    if (sup) return whySupplier(sup);
    if (/plan|mitigat/.test(q)) return mitigationPlan();
    return fallback();
  }

  /* ---------------- Intents ---------------- */
  function topNodes() {
    const top = D().nodes.slice().sort((a, b) => b.avar - a.avar).slice(0, 5);
    const rows = top.map(n => `<tr>
      <td>${esc(n.name)}<span class="cell-sub">${esc(n.type)} · ${esc(n.sub)}</span></td>
      <td>${SCR.fmt.usdM(n.avar)}</td>
      <td>${SCR.fmt.ri(n.ri)}</td>
    </tr>`).join('');
    return {
      tag: AGENTS.impact,
      html: `<p>The 5 nodes carrying the most adjusted value at risk right now:</p>
        <table><thead><tr><th>Node</th><th>AVAR</th><th>RI</th></tr></thead><tbody>${rows}</tbody></table>
        <p>Together they hold ${SCR.fmt.usdM(+top.reduce((a, n) => a + n.avar, 0).toFixed(1))} of the
        ${SCR.fmt.usdM(D().kpis.totalAVAR)} enterprise AVAR.</p>`,
      actions: [
        { label: 'Open ' + top[0].name, go: () => top[0].type === 'Supplier' ? SCR.ui.openSupplier(top[0].id) : SCR.ui.openSite(top[0].id) },
        { label: 'Executive Summary', go: () => SCR.navigate('executive') }
      ],
      followUp: 'Why is ' + top[0].name + ' critical?'
    };
  }

  function gapAnswer() {
    const gaps = D().materials.filter(m => m.gap > 0).sort((a, b) => b.gap - a.gap);
    const prods = D().products.filter(p => p.gapMax > 0);
    const items = gaps.slice(0, 5).map(m => {
      const s = D().supplierById(m.suppliers[0]);
      return `<li><strong>${esc(m.name)}</strong> — survives ${m.tts}d, recovers in ${m.ttr}d
        (<span style="color:var(--status-critical);font-weight:600">−${m.gap}d</span>) · ${esc(s.name)}${m.singleSource ? ' · single source' : ''}</li>`;
    }).join('');
    return {
      tag: AGENTS.inventory,
      html: `<p>${gaps.length} components recover slower than inventory survives (TTR &gt; TTS), exposing
        <strong>${prods.length} products</strong>. The worst gaps:</p>
        <ul>${items}</ul>
        <p>For these, replenishment ordered on the day of failure would arrive after the line stops —
        they need buffers or alternates, not faster POs.</p>`,
      actions: [{ label: 'Open Value Streams', go: () => SCR.navigate('valuestream') }],
      followUp: 'Mitigation plan for single-source materials'
    };
  }

  function whySupplier(s) {
    const dims = Object.keys(s.dims)
      .map(k => ({ name: DIM_NAMES[k], v: s.dims[k] }))
      .sort((a, b) => b.v - a.v);
    const worst = dims.slice(0, 2);
    const mats = D().materialsOf(s.id);
    const singles = mats.filter(m => m.singleSource);
    const gapped = mats.filter(m => m.gap > 0);
    const al = D().alerts.filter(a => a.nodes.includes(s.id) && a.status !== 'closed');
    let html = `<p><strong>${esc(s.name)}</strong> is rated ${SCR.ui.badge(s.rating)} at
      ${SCR.ui.scoreSpan(s.score)}, resilience index ${SCR.fmt.ri(s.ri)}.</p>
      <p>The score is driven by <strong>${esc(worst[0].name)}</strong> risk (${worst[0].v.toFixed(1)})
      and <strong>${esc(worst[1].name)}</strong> risk (${worst[1].v.toFixed(1)}). Recovery time after a failure: <strong>${s.ttr} days</strong>.</p>`;
    if (gapped.length) {
      html += `<p>${gapped.length} of their material${mats.length === 1 ? '' : 's'} recover slower than we can survive:
        ${gapped.map(m => `${esc(m.name)} (−${m.gap}d)`).join('; ')}.</p>`;
    }
    html += `<p>We depend on them for ${mats.length} material${mats.length === 1 ? '' : 's'}${
      singles.length ? `, ${singles.length} single-sourced` : ''} —
      ${SCR.fmt.usdM(s.depNTS)} of sales linked, ${SCR.fmt.usdM(s.avar)} AVAR.</p>`;
    if (al.length) html += `<p><strong>Open alert:</strong> ${esc(al[0].title)}</p>`;
    return {
      tag: AGENTS.sensing,
      html,
      actions: [
        { label: 'Supplier 360', go: () => SCR.ui.openSupplier(s.id) },
        { label: 'Simulate failure', go: () => SCR.navigate('scenario', { node: s.id }) }
      ]
    };
  }

  function singleSource() {
    const singles = D().materials.filter(m => m.singleSource).sort((a, b) => b.avar - a.avar);
    const rows = singles.slice(0, 6).map(m => `<tr>
      <td>${esc(m.name)}<span class="cell-sub">${esc(D().supplierById(m.suppliers[0]).name)}</span></td>
      <td>${m.gap > 0 ? '<span style="color:var(--status-critical);font-weight:600">−' + m.gap + 'd</span>' : 'OK'}</td>
      <td>${SCR.fmt.usdM(m.avar)}</td>
    </tr>`).join('');
    return {
      tag: AGENTS.impact,
      html: `<p>${singles.length} materials are single-sourced. Ranked by adjusted value at risk:</p>
        <table><thead><tr><th>Material</th><th>Gap</th><th>AVAR</th></tr></thead><tbody>${rows}</tbody></table>`,
      actions: [{ label: 'Alternate sourcing view', go: () => SCR.navigate('category', { cat: 'all' }) }],
      followUp: 'Mitigation plan for single-source materials'
    };
  }

  function biggestVar() {
    const mats = D().materials.slice().sort((a, b) => b.var - a.var).slice(0, 3);
    const items = mats.map(m => {
      const s = D().supplierById(m.suppliers[0]);
      return `<li><strong>${esc(m.name)}</strong> — ${SCR.fmt.usdM(m.var)} VAR / ${SCR.fmt.usdM(m.avar)} AVAR
        · ${m.depProducts.length} SKUs · ${esc(s.name)}</li>`;
    }).join('');
    return {
      tag: AGENTS.impact,
      html: `<p>Total enterprise exposure is <strong>${SCR.fmt.usdM(D().kpis.totalVAR)} VAR</strong>
        (${SCR.fmt.usdM(D().kpis.totalAVAR)} probability-adjusted). The three largest concentrations:</p>
        <ul>${items}</ul>`,
      actions: [{ label: 'Category & Suppliers', go: () => SCR.navigate('category') }],
      followUp: 'What if ' + D().supplierById(mats[0].suppliers[0]).name + ' fails for 30 days?'
    };
  }

  function mitigationPlan() {
    const risky = D().materials.filter(m => m.singleSource && m.score >= 2.8)
      .sort((a, b) => b.avar - a.avar);
    const steps = risky.slice(0, 3).map((m, i) => {
      const s = D().supplierById(m.suppliers[0]);
      const feas = (m.substitution.split('—')[0] || '').trim().toLowerCase();
      const act = feas.indexOf('low') === 0
        ? 'substitution is hard — start alternate qualification now and build the buffer to cover the full TTR'
        : feas.indexOf('medium') === 0
          ? 'activate the secondary option and pre-book capacity'
          : 'shift volume to qualified alternates';
      return `<li><strong>Step ${i + 1} · ${esc(m.name)}</strong> (${esc(s.name)}, gap ${m.gap > 0 ? '−' + m.gap + 'd' : 'none'}): ${esc(act)}.</li>`;
    }).join('');
    return {
      tag: AGENTS.mitigation,
      html: `<p>${risky.length} single-source materials sit above the 2.8 risk threshold. Proposed sequence for the three most exposed:</p>
        <ul>${steps}</ul>
        <p><strong>Execution & Workflow Agent:</strong> 3 qualification tickets drafted — approval routed to the Category Leader.</p>`,
      actions: [{ label: 'Review in AI Agents', go: () => SCR.navigate('agents') }],
      after: () => SCR.ui.toast('Workflow created', '3 alternate-sourcing tickets drafted for single-source materials.', 'good')
    };
  }

  function whatIf(sup, site) {
    const target = sup || site;
    return {
      tag: AGENTS.scenario,
      html: `<p>I can fail any node on the digital twin and return impacted SKUs, value at risk, the revised
        resilience index and the cheapest recovery plan in under 2 seconds.</p>
        ${target ? `<p>Loading <strong>${esc(target.name)}</strong> into the studio…</p>` : `<p>Ready presets:</p>
        <ul>
          <li>CapForm closures failure — 30 days</li>
          <li>Taicang MCU export halt — 45 days</li>
          <li>Pune plant monsoon outage — 21 days</li>
        </ul>`}`,
      actions: [{
        label: 'Open Scenario Studio',
        go: () => SCR.navigate('scenario', target ? { node: target.id } : {})
      }]
    };
  }

  function siteStatus(site) {
    const crit = site.materials.map(id => D().materialById(id)).filter(m => m.gap > 0);
    return {
      tag: AGENTS.sensing,
      html: `<p><strong>${esc(site.name)}</strong> (${esc(site.focus)}) serves ${SCR.fmt.usdM(site.nts)} NTS
        across ${site.markets} markets. RI ${SCR.fmt.ri(site.ri)}, utilization ${site.utilization}%.</p>
        <p>Shortest survival is <strong>${site.ttsMin} days</strong>; ${crit.length} inbound material${crit.length === 1 ? ' recovers' : 's recover'} slower
        than the site can survive${crit.length ? ' — worst: ' + esc(crit.sort((a, b) => b.gap - a.gap)[0].name) : ''}.</p>`,
      actions: [
        { label: 'Site Resilience view', go: () => SCR.navigate('site', { site: site.id }) },
        { label: 'Simulate outage', go: () => SCR.navigate('scenario', { node: site.id }) }
      ]
    };
  }

  function dailyBrief() {
    const k = D().kpis;
    const crit = D().alerts.filter(a => a.sev === 'critical' && a.status !== 'closed');
    const pending = D().recommendations.filter(r => r.status === 'pending')
      .sort((a, b) => b.exposure - a.exposure);
    return {
      tag: AGENTS.sensing,
      html: `<p>Resilience brief · ${esc(D().asOf)}:</p><ul>
        <li><strong>Exposure:</strong> ${SCR.fmt.usdM(k.totalVAR)} VAR / ${SCR.fmt.usdM(k.totalAVAR)} AVAR
          on ${SCR.fmt.usdM(k.totalNTS)} NTS</li>
        <li><strong>Enterprise RI:</strong> ${k.enterpriseRI}% (${SCR.fmt.signed(k.riDelta, ' pts')} vs last month)</li>
        <li><strong>${crit.length} critical alerts:</strong> ${crit.map(a => esc(a.type)).join(' · ')}</li>
        <li><strong>${pending.length} recommendations pending</strong> — top: ${esc(pending[0].title)}</li>
        <li><strong>Mitigated YTD:</strong> ${SCR.fmt.usdM(k.mitigatedYtd)} AVAR</li>
      </ul>`,
      actions: [{ label: 'Executive Summary', go: () => SCR.navigate('executive') }]
    };
  }

  function fallback() {
    return {
      tag: AGENTS.copilot,
      html: `<p>I didn't catch that — here's what I'm good at:</p>
        <ul>${SUGGESTS.map(s => `<li>${esc(s)}</li>`).join('')}</ul>
        <p>Ask in your own words, name any supplier or site, or tap a suggestion below.</p>`
    };
  }

  /* ---------------- Panel lifecycle (bottom-right dock) ---------------- */
  function open() {
    panel.classList.add('open');
    document.body.classList.add('copilot-open');
    setTimeout(() => input.focus(), 240);
  }
  function close() {
    panel.classList.remove('open');
    document.body.classList.remove('copilot-open');
  }

  function welcome() {
    const d = D();
    appendBot({
      tag: AGENTS.copilot,
      html: `<p>I watch <strong>${d.nodes.length} nodes</strong>, <strong>${d.materials.length} materials</strong>
        and <strong>${d.products.length} products</strong> for ${esc(d.company)} —
        ${SCR.fmt.usdM(d.kpis.totalVAR)} of value currently at risk, enterprise resilience
        <strong>${d.kpis.enterpriseRI}%</strong>.</p>
        <p>Ask in your own words, or tap a suggestion below.</p>`
    });
  }

  function reset() {
    if (!thread) return;
    thread.innerHTML = '';
    welcome();
    syncFabDot();
  }

  function syncFabDot() {
    const fab = document.getElementById('copilotBtn');
    if (fab) fab.classList.toggle('has-chat', thread && thread.querySelectorAll('.msg.user').length > 0);
  }

  /** Persona lens hand-off from the switcher: header line, suggestions, fresh thread. */
  function personaChanged(p) {
    const line = document.getElementById('copilotPersona');
    if (line) line.textContent = 'Viewing as ' + p.name;
    setSuggests(p.suggests);
    reset();
  }

  function init() {
    panel = document.getElementById('copilot');
    thread = document.getElementById('copilotThread');
    input = document.getElementById('copilotText');

    document.getElementById('copilotBtn').addEventListener('click', open);
    document.getElementById('copilotClose').addEventListener('click', close);
    document.getElementById('copilotReset').addEventListener('click', reset);
    document.getElementById('copilotForm').addEventListener('submit', e => {
      e.preventDefault();
      const text = input.value.trim();
      if (!text) return;
      input.value = '';
      ask(text);
    });

    setSuggests(SUGGESTS);
    welcome();
  }

  SCR.copilot = { init, open, close, setSuggests, personaChanged, reset };
})();
