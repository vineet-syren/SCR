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
        a.followUp ? `<div class="muted" style="font-size:13px;margin-top:8px">Follow-up: try “${esc(a.followUp)}”</div>` : ''
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

  /* ---------------- Business KPI registry ----------------
     Every headline number the product displays is answerable here, both as a
     value ("what is NTS in scope") and as a definition ("how is AVAR
     calculated"). `aliases` are matched longest-first so "value at risk" wins
     over the bare "var" inside it. */
  function KPIS() {
    const d = D(), k = d.kpis, F = SCR.fmt;
    return [
      {
        key: 'nts', label: 'NTS in scope', value: () => F.usdM(k.totalNTS),
        aliases: ['nts in scope', 'net trade sales', 'net sales', 'nts', 'turnover', 'top line', 'revenue in scope'],
        what: 'Net trade sales — the revenue carried by every product currently inside your filter scope. It is the denominator for everything else: exposure only means something relative to the sales it threatens.',
        how: 'Summed product NTS across the products in scope.',
        go: { label: 'Open Value Streams', run: () => SCR.navigate('valuestream') }
      },
      {
        key: 'var', label: 'Value at risk (VAR)', value: () => F.usdM(k.totalVAR),
        aliases: ['value at risk', 'gross exposure', 'var'],
        what: 'The sales that would be lost if a dependency failed and could not be recovered before cover ran out. It is the gross, worst-case number — before any judgement about how likely the event is.',
        how: 'For each node: dependent NTS × uncovered days ÷ 365, where uncovered days = TTR − TTS. If recovery lands inside cover, VAR is zero.',
        go: { label: 'Open Executive Summary', run: () => SCR.navigate('executive') }
      },
      {
        key: 'avar', label: 'Weighted AVAR', value: () => F.usdM(k.totalAVAR),
        aliases: ['weighted avar', 'wtd avar', 'wtd. avar', 'wavar', 'adjusted value at risk', 'probability adjusted', 'avar'],
        what: 'Value at risk after weighting for how likely the disruption actually is. This is the number to prioritise and fund against, because it reflects expected loss rather than worst case.',
        how: 'VAR × a severity-scaled probability per node. It is always lower than VAR — the gap between them is the part of the risk that is improbable rather than absent.',
        go: { label: 'Open Executive Summary', run: () => SCR.navigate('executive') }
      },
      {
        key: 'ri', label: 'Enterprise resilience index', value: () => k.enterpriseRI + '%',
        aliases: ['enterprise resilience index', 'resilience index', 'enterprise ri', 'resilience score', 'ri'],
        what: 'A composite 0–100 score where higher is stronger. It blends how much exposure is covered, how fast the network recovers, and how concentrated the dependencies are.',
        how: 'Weighted composite of cover ratio, TTR/TTS headroom and single-source concentration, normalised to 0–100.',
        go: { label: 'Open Executive Summary', run: () => SCR.navigate('executive') }
      },
      {
        key: 'gap', label: 'TTR > TTS components', value: () => String(k.gapMaterials),
        aliases: ['ttr > tts', 'ttr>tts', 'uncovered components', 'recovery gap', 'gap components', 'uncovered days'],
        what: 'Components that take longer to recover than they can survive on hand. These are the only components that can actually convert a disruption into lost sales — everything else is absorbed by cover.',
        how: 'Count of components where TTR exceeds TTS. ' + k.gapProducts + ' products are exposed through them.',
        go: { label: 'Open Value Streams', run: () => SCR.navigate('valuestream') }
      },
      {
        key: 'mitigated', label: 'AVAR mitigated YTD', value: () => F.usdM(k.mitigatedYtd),
        aliases: ['avar mitigated', 'mitigated ytd', 'risk removed', 'risk retired', 'mitigated'],
        what: 'Adjusted value at risk removed by mitigations that have actually landed this year — not planned, delivered.',
        how: 'Sum of realised AVAR reduction across executed actions. It is the same figure as the "Mitigated" step in the AVAR bridge.',
        go: { label: 'Open Alerts & Actions', run: () => SCR.navigate('actions') }
      },
      {
        key: 'detection', label: 'Mean detection lead', value: () => k.detectionLeadDays + ' days',
        aliases: ['mean detection lead', 'detection lead', 'detection time', 'signal to alert', 'lead time'],
        what: 'Average time between a signal arriving and an alert being raised. Detection lead is time you get to spend on mitigation instead of firefighting.',
        how: 'Mean elapsed time from sensed signal to raised alert across the funnel.',
        go: { label: 'Open Alerts & Actions', run: () => SCR.navigate('actions') }
      },
      {
        key: 'single', label: 'Single-source materials', value: () => k.singleSourceCount + ' (' + k.singleSourceRisky + ' risky)',
        aliases: ['single source materials', 'single-source', 'sole source', 'sole sourced'],
        what: 'Materials with exactly one qualified supplier. If that supplier stops, the material stops — there is no second source to switch to.',
        how: 'Count of materials with one qualified supplier; "risky" additionally have TTR > TTS.',
        go: { label: 'Open Category & Suppliers', run: () => SCR.navigate('category') }
      },
      {
        key: 'alerts', label: 'Open alerts', value: () => k.openAlerts + ' (' + k.criticalAlerts + ' critical)',
        aliases: ['open alerts', 'critical alerts', 'alerts'],
        what: 'Unresolved exceptions raised by the sensing layer, each routed to a named owner.',
        how: 'Alerts not yet closed; critical means a node is already failing or will inside its TTS.',
        go: { label: 'Open Alerts & Actions', run: () => SCR.navigate('actions') }
      },
      {
        key: 'actions', label: 'Actions in flight', value: () => k.openActions + ' (' + k.overdueActions + ' overdue)',
        aliases: ['actions in flight', 'open actions', 'overdue actions', 'actions'],
        what: 'Mitigations currently being executed, each tracked with residual risk before and after.',
        how: 'Actions not yet completed; overdue means past their due date.',
        go: { label: 'Open Alerts & Actions', run: () => SCR.navigate('actions') }
      },
      {
        key: 'nodes', label: 'Nodes monitored', value: () => k.nodes + ' (' + k.supplierNodes + ' suppliers, ' + k.siteNodes + ' plants & DCs)',
        aliases: ['nodes monitored', 'how many nodes', 'nodes', 'high risk nodes'],
        what: 'Every supplier, plant and distribution centre in the digital twin. ' + k.highRiskNodes + ' currently sit below an RI of 60.',
        how: 'Suppliers + plants + DCs across the modelled network.',
        go: { label: 'Open Network Explorer', run: () => SCR.navigate('network') }
      },
      {
        key: 'scope', label: 'Scope', value: () => k.products + ' products across ' + k.countries + ' markets',
        aliases: ['how many products', 'products in scope', 'markets', 'countries', 'products'],
        what: 'The products and markets currently modelled.',
        how: 'Counted from the product and market master.',
        go: { label: 'Open Value Streams', run: () => SCR.navigate('valuestream') }
      },
      {
        key: 'tts', label: 'TTS — time to survive', concept: true, value: () => 'measured per component',
        aliases: ['time to survive', 'tts'],
        what: 'How long production can keep running on the inventory and cover already in hand, with no resupply.',
        how: 'Days of cover from on-hand and in-transit stock at planned consumption.',
        go: { label: 'Open Site Resilience', run: () => SCR.navigate('site') }
      },
      {
        key: 'ttr', label: 'TTR — time to recover', concept: true, value: () => 'measured per node',
        aliases: ['time to recover', 'ttr'],
        what: 'How long it takes to restore supply after a node fails — including qualifying or switching to an alternate.',
        how: 'Assessed recovery time per node, from the supplier and site master.',
        go: { label: 'Open Network Explorer', run: () => SCR.navigate('network') }
      },
      {
        key: 'rre', label: 'RRE — residual risk exposure', concept: true, value: () => 'scored 0–1 per node',
        aliases: ['residual risk exposure', 'residual risk', 'rre'],
        what: 'How much risk remains after the mitigations already in place. A high RRE beside a high VAR is the combination that matters: real money exposed, and the current plan is not holding it.',
        how: 'Normalised 0–1 from the driver scores, net of mitigations in place.',
        go: { label: 'Open Category & Suppliers', run: () => SCR.navigate('category') }
      }
    ];
  }

  function matchKpi(q) {
    let best = null, bestLen = 0;
    KPIS().forEach(def => def.aliases.forEach(a => {
      // whole-token match so "var" doesn't fire inside "variance"
      const re = new RegExp('(^|[^a-z0-9])' + a.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '([^a-z0-9]|$)');
      if (re.test(q) && a.length > bestLen) { best = def; bestLen = a.length; }
    }));
    return best;
  }

  const isDefinitional = q =>
    /(what|whats|what's|which)\s+(is|are|does|do)\b|^what'?s\b|\bdefine\b|\bdefinition\b|\bmeaning\b|\bmeans?\b|\bexplain\b|how (is|are|do you|does).*(calculat|comput|derive|work|measur)|\bhow do you get\b/.test(q);

  function kpiAnswer(def, definitional) {
    return {
      tag: AGENTS.impact,
      html: `<p><strong>${esc(def.label)}</strong> — ${def.concept ? esc(def.value()) : `currently <strong>${def.value()}</strong>`}.</p>
        <p>${def.what}</p>
        <p style="opacity:.75"><strong>How it is derived:</strong> ${def.how}</p>`,
      actions: [{ label: def.go.label, go: def.go.run }]
    };
  }

  function kpiBoard() {
    const rows = KPIS().filter(d => !['tts', 'ttr', 'rre'].includes(d.key))
      .map(d => `<tr><td>${esc(d.label)}</td><td><strong>${d.value()}</strong></td></tr>`).join('');
    return {
      tag: AGENTS.impact,
      html: `<p>Every headline number I track, on the current scope:</p>
        <table><thead><tr><th>KPI</th><th>Now</th></tr></thead><tbody>${rows}</tbody></table>
        <p>Ask about any one of them by name for what it means and how it is derived.</p>`,
      actions: [{ label: 'Executive Summary', go: () => SCR.navigate('executive') }]
    };
  }

  /* ---------------- Intent router ---------------- */
  function route(text) {
    const q = text.toLowerCase();
    const sup = findSupplier(q);
    const site = findSite(q);
    const kpi = matchKpi(q);
    // "what is NTS" / "how is AVAR calculated" — definition beats value
    if (kpi && isDefinitional(q)) return kpiAnswer(kpi, true);
    if (/\b(kpis?|metrics?|scorecard|all the numbers|headline numbers)\b/.test(q)) return kpiBoard();
    if (/why .*(critical|high|risky)|explain/.test(q) && sup) return whySupplier(sup);
    if (/top .*(node|supplier|risk)/.test(q)) return topNodes();
    // "which products have TTR > TTS" wants the list, not the metric definition
    if (/ttr\s*>\s*tts|recover|gap|survive/.test(q) &&
        (!kpi || /\b(which|list|show|name)\b/.test(q))) return gapAnswer();
    if (/single[- ]source|sole[- ]source/.test(q) && /plan|mitigat/.test(q)) return mitigationPlan();
    if (/single[- ]source|sole[- ]source/.test(q)) return singleSource();
    if (/(biggest|largest|highest|worst|most|right now)/.test(q) && /(risk|exposure|var|avar)/.test(q)) return biggestVar();
    if (/what if|simulate|outage|fails/.test(q)) return whatIf(sup, site);
    if (/brief|digest|summary|summarize/.test(q)) return dailyBrief();
    // a bare metric question ("NTS in scope", "wtd avar", "enterprise RI")
    if (kpi) return kpiAnswer(kpi, false);
    if (site) return siteStatus(site);
    if (sup) return whySupplier(sup);
    if (/plan|mitigat/.test(q)) return mitigationPlan();
    if (/value at risk|avar|var|exposure/.test(q)) return biggestVar();
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
      actions: [{ label: 'Review recommendations', go: () => SCR.navigate('agents') }],
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
        <p>I can also explain or quote any KPI on the dashboards — NTS in scope, value at risk,
        weighted AVAR, enterprise RI, TTR&nbsp;&gt;&nbsp;TTS components, AVAR mitigated YTD,
        detection lead and more. Try <em>“what is AVAR”</em> or <em>“show me all KPIs”</em>.</p>
        <p>Ask in your own words, or name any supplier or site.</p>`
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

  // `route` is exported for diagnostics: it lets the intent layer be exercised
  // without the typing delay or the DOM.
  SCR.copilot = { init, open, close, setSuggests, personaChanged, reset, route };
})();
