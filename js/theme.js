/* ============================================================
   SCR · theme.js
   Design tokens → chart bridge for the Supply Chain Resilience
   Command Center. Reads CSS custom properties at render time so
   every chart re-themes on light/dark toggle. All chart code
   must pull colors from here — never hardcode.

   Categorical palette (validated, fixed order, never cycled):
   teal → violet → amber → blue → rose → emerald → indigo → orange
   ============================================================ */
window.SCR = window.SCR || {};

/* Page registry — defined here (first script) so page modules can
   self-register regardless of load order; app.js consumes it. */
SCR.pages = SCR.pages || {};
SCR.registerPage = SCR.registerPage || function (key, page) { SCR.pages[key] = page; };

(function () {
  function cssVar(name) {
    return getComputedStyle(document.body || document.documentElement)
      .getPropertyValue(name).trim();
  }

  /** Live design tokens — call at chart render time (theme may have toggled). */
  function tokens() {
    const isDark = document.body.getAttribute('data-theme') === 'dark';
    return {
      isDark,
      surface: cssVar('--surface'),
      surface2: cssVar('--surface-2'),
      surface3: cssVar('--surface-3'),
      ink: cssVar('--ink'),
      ink2: cssVar('--ink-2'),
      ink3: cssVar('--ink-3'),
      grid: cssVar('--grid'),
      axis: cssVar('--axis'),
      accent: cssVar('--accent'),
      border: cssVar('--border-strong'),
      // categorical series — fixed order, never cycled
      series: [1, 2, 3, 4, 5, 6, 7, 8].map(i => cssVar('--series-' + i)),
      status: {
        good: cssVar('--status-good'),
        warning: cssVar('--status-warning'),
        serious: cssVar('--status-serious'),
        critical: cssVar('--status-critical')
      },
      // sequential single-hue teal ramp (light→dark reads low→high)
      seq: isDark
        ? ['#134e4a', '#115e59', '#0f766e', '#0d9488', '#14b8a6', '#2dd4bf', '#5eead4', '#99f6e4']
        : ['#ccfbf1', '#99f6e4', '#5eead4', '#2dd4bf', '#14b8a6', '#0d9488', '#0f766e', '#115e59'],
      // ordinal ramp for funnels / tiers (mid steps for contrast on both surfaces)
      ordinal: isDark
        ? ['#0f766e', '#0d9488', '#14b8a6', '#2dd4bf', '#5eead4']
        : ['#5eead4', '#2dd4bf', '#14b8a6', '#0d9488', '#0f766e']
    };
  }

  /** Base ECharts option fragments shared by every chart. */
  function baseOption() {
    const t = tokens();
    return {
      color: t.series,
      textStyle: {
        fontFamily: '"Inter", system-ui, -apple-system, "Segoe UI", "Helvetica Neue", Arial, sans-serif',
        color: t.ink2
      },
      tooltip: {
        backgroundColor: t.surface,
        borderColor: t.border,
        borderWidth: 1,
        padding: [10, 13],
        textStyle: { color: t.ink, fontSize: 13 },
        extraCssText: 'box-shadow:0 8px 30px rgba(0,0,0,.18);border-radius:10px;'
      },
      legend: {
        textStyle: { color: t.ink2, fontSize: 12.5 },
        itemWidth: 10, itemHeight: 10, icon: 'roundRect', itemGap: 14
      },
      grid: { left: 8, right: 14, top: 34, bottom: 4, containLabel: true }
    };
  }

  /** Category axis (x) with recessive styling. */
  function catAxis(data, extra) {
    const t = tokens();
    return Object.assign({
      type: 'category',
      data,
      axisLine: { lineStyle: { color: t.axis } },
      axisTick: { show: false },
      axisLabel: { color: t.ink3, fontSize: 12 }
    }, extra || {});
  }

  /** Value axis (y) with hairline grid. */
  function valAxis(extra) {
    const t = tokens();
    return Object.assign({
      type: 'value',
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: t.ink3, fontSize: 12 },
      splitLine: { lineStyle: { color: t.grid, width: 1 } }
    }, extra || {});
  }

  /* ---------------- Formatters ---------------- */
  const fmt = {
    /** $ millions → compact string. 1234 => $1.23B, 42.3 => $42.3M, 0.31 => $310K */
    usdM(v) {
      if (v == null || isNaN(v)) return '–';
      const abs = Math.abs(v);
      if (abs >= 1000) return '$' + (v / 1000).toFixed(2).replace(/\.?0+$/, '') + 'B';
      if (abs >= 10) return '$' + Math.round(v) + 'M';
      if (abs >= 1) return '$' + v.toFixed(1) + 'M';
      return '$' + Math.round(v * 1000) + 'K';
    },
    num(v) { return v == null ? '–' : v.toLocaleString('en-US'); },
    pct(v, d) { return v == null ? '–' : v.toFixed(d == null ? 1 : d) + '%'; },
    score(v) { return v == null ? '–' : Number(v).toFixed(2); },
    days(v) { return v == null ? '–' : v + 'd'; },
    ri(v) { return v == null ? '–' : Math.round(v) + '%'; },
    rre(v) { return v == null ? '–' : Number(v).toFixed(2); },
    signed(v, unit) {
      const s = v > 0 ? '+' : '';
      return s + v + (unit || '');
    }
  };

  /* ---------------- Risk helpers ---------------- */
  /** Map a 0–5 node risk score to rating bucket. */
  function ratingOf(score) {
    if (score >= 4.0) return 'Critical';
    if (score >= 3.0) return 'High';
    if (score >= 2.0) return 'Medium';
    return 'Low';
  }
  function ratingClass(rating) { return String(rating).toLowerCase(); }
  function ratingColor(rating) {
    const t = tokens();
    return {
      Low: t.status.good, Medium: t.status.warning,
      High: t.status.serious, Critical: t.status.critical
    }[rating] || t.ink3;
  }
  function scoreColor(score) { return ratingColor(ratingOf(score)); }

  /** Resilience Index (0–100, higher is stronger). */
  function riBand(ri) {
    if (ri >= 85) return 'Strong';
    if (ri >= 70) return 'Stable';
    if (ri >= 55) return 'Stressed';
    return 'Fragile';
  }
  function riClass(ri) {
    return { Strong: 'low', Stable: 'medium', Stressed: 'high', Fragile: 'critical' }[riBand(ri)];
  }
  function riColor(ri) {
    const t = tokens();
    return {
      Strong: t.status.good, Stable: t.status.warning,
      Stressed: t.status.serious, Fragile: t.status.critical
    }[riBand(ri)];
  }

  SCR.theme = { tokens, baseOption, catAxis, valAxis };
  SCR.fmt = fmt;
  SCR.risk = { ratingOf, ratingClass, ratingColor, scoreColor, riBand, riClass, riColor };
})();
