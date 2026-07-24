# SCR — Supply Chain Resilience Command Center

A frontend-only demo of the **new-age SCR** described in the product blueprint: not a
filter-and-table BI dashboard, but a **persona-driven resilience intelligence platform**
for CPG and manufacturing — visual analytics, a supply-chain digital twin, disruption
simulation and an agentic AI layer in one product.

Demo company: **Veridia Group** — a global CPG & light-manufacturing group
(Beverages · Foods & Snacks · Home & Personal Care · Appliances & Devices; 8 plants,
6 DCs, 32 suppliers, 28 materials, 24 SKUs, 13 markets). All data is synthetic but
**derived from one resilience engine**, so every number reconciles across pages:

| Anchor | Value |
|---|---|
| NTS in scope | **$4.01B** |
| Value at risk (VAR) | **$373M** · AVAR **$143M** |
| Enterprise resilience index | **75%** (Stable) |
| TTR > TTS components | **14** (18 products exposed) |
| Single-source materials | **13** (8 risky) |
| AVAR mitigated YTD | **$46M** — equals the bridge's "Mitigated" step |

The engine (in `js/data.js`) computes, from BOM/supplier/inventory primitives:
**TTS** (survive) · **TTR** (recover) · **VAR** = dependent NTS × uncovered gap / 365 ·
**AVAR** = VAR × severity-scaled probability · **RRE** (residual risk 0–1) ·
**RI** (composite 0–100, higher = stronger).

## Run it

No build step, no dependencies (ECharts is vendored):

```bash
cd SCR
node serve.js 4190          # or: python3 -m http.server 4190
# open http://127.0.0.1:4190
```

Opening `index.html` directly from the filesystem also works (no ES modules).

## Pages × personas × charts

| Page | Persona / purpose | Chart forms |
|---|---|---|
| **Executive Summary** | Risk & Resilience Leader — enterprise exposure, top nodes, mitigation posture | **Waterfall** (AVAR bridge), **Donut** (AVAR by sector), ranked bars (top-10 nodes, AVAR/VAR/sales switch), **Area** (cumulative mitigated), **Mekko** (NTS by region × sector) |
| **Value Streams** | Value Chain / Stream Leader — product & market risk | **Column + line** (NTS + Wtd AVAR columns with RI on an aligned panel — no dual axis), **Bubble** (growth × margin × NTS), **Waterfall** (revenue bridge FY25→FY26), **Heat map** (market × month exposure), TTS-vs-TTR gap bars, missing TTR/TTS/RRE strip |
| **Category & Suppliers** | Category / Procurement Leader — sourcing risk | **Bubble** (spend × risk × AVAR), **Tree map** (spend by category → sub-category), node data summary, risk-driver profile, alternate-sourcing worklist |
| **Site Resilience** | SC Site Leader — plant/DC continuity | Threshold bars (which material stops production first), **Area** (inventory runway), risk-factor panel, playbook tracker |
| **Network Explorer** | Digital twin | **Sankey dependency trace** (supplier → material → plant → DC → market; ribbon width = NTS carried, red = single-source), enterprise value flow by material category, single-points-of-failure list |
| **Scenario Studio** | What-if simulation with live recompute | Compare tiles, **Waterfall** (exposed → inventory cover → mitigation → residual), ranked mitigation options |
| **Alerts & Actions** | Exception management | **Funnel** (signal → executed action), **Gantt** (resilience programs), action tracker with RRE before/after |
| **Recommendations** | The agentic layer | Approval queue, agent activity feed, daily digest |
| **Data Quality** | Governance | Completeness bars, coverage by sector, missing-data worklist, refresh log |

Cross-cutting:

- **Persona lens** (Terova pattern) — a "Viewing as" switcher in the app bar re-lenses
  the product per persona: the collapsible left sidebar (subtle width animation,
  persisted) shows only that persona's features (nav-as-metadata with per-item persona
  visibility), landing jumps to their cockpit ("MY VIEW"), and the copilot's sample
  questions re-tune per persona. R&R Leader sees everything; VSL, Category and Site
  leaders get focused sidebars. The Executive Summary opens with the E2E welcome hero.
- **Resilience Copilot** — a floating dock bottom-right (Terova CopilotDock pattern):
  an extended FAB expands into a chat panel with persona-specific sample questions,
  live-computed agent-attributed answers, action chips, drill-through and a
  new-conversation reset. Every business KPI is answerable by name — NTS in scope,
  VAR, weighted AVAR, enterprise RI, TTR > TTS components, AVAR mitigated YTD,
  detection lead, single-source count, alerts and actions — as a value ("NTS in
  scope") or a definition ("how is AVAR calculated"), plus TTS/TTR/RRE concepts
  and a full KPI board on "show me all KPIs". Data freshness lives behind a refresh icon tooltip in the
  app bar (weekly recalc + daily external feeds).
- **360° drawers** — click any supplier / material / product / site / alert anywhere
  for a detail drawer with facts, 12-month trends, TTS-vs-TTR bars and cross-links.
- **Global search**, **alert center**, **dark mode** (fully re-themed charts), toasts,
  approve/dismiss workflow on agent recommendations, executive brief & daily digest
  generators, blueprint-faithful presets (the bottle-caps TTS 7d / TTR 21d case is
  the flagship scenario).

## The 6 agents

Network Sensing · Impact & VAR · TTS Watch · Mitigation Strategist ·
Execution & Workflow · Scenario Twin — surfaced in the live feed, the approval
queue, alerts and the copilot's attributed answers.

## Structure

```
index.html            shell (sidebar, topbar, drawers, copilot, modal)
css/styles.css        design system (light/dark via CSS custom properties)
js/theme.js           design tokens → ECharts bridge, formatters, TTR/TTS/RI helpers
js/data.js            synthetic dataset + the resilience engine (single source of truth)
js/charts.js          chart lifecycle + waterfall/mekko/gantt/sparkline/combo builders
js/components.js      shared UI + the 360° detail drawers
js/copilot.js         Resilience Copilot
js/pages/*.js         one module per page (self-registering)
js/app.js             router, persona registry + lens switcher, sidebar nav, search
vendor/echarts.min.js Apache ECharts 5.5 (vendored — fully offline)
```

## Navigation

Collapsible left sidebar (persona-filtered, subtle width animation) under a light app bar:
**My cockpit** (Executive Summary · Value Streams · Category & Suppliers · Site
Resilience) · **Intelligence** (Network Explorer · Scenario Studio) · **Act** (Alerts &
Actions · Recommendations) · **Govern** (Data Quality). An always-visible filter bar scopes
each persona page. Signature elements modernized from the original screenshots: icon-chip KPI strips
with the insight bulb, teal-headed tables, the Node Overview drill (product list → Node
AVAR vs Sales Impacted with AVAR/SALES toggle and in-cell bars), the Category node data
summary (multi-measure in-row bars) and the Node Risk Summary heat matrix.

**AI agent insights everywhere.** Every card carries an "AI insights" button top-right
that opens an agent-attributed drawer: the live readings behind that card, what the agent
sees in them, and where to go next. Content is computed at click time, so it reflects
whatever filters are active.

**Every KPI tile is a drill.** Each icon-chip tile in a strip either scrolls-and-highlights
the section that explains it (e.g. Nodes → the Top-10 ranking, Spend → the spend tree map)
or routes to another persona cockpit (Supplier/EM → Category, Plants & DCs → Site). The
RI tiles open the RI Matrix guide. **The agentic layer is functional**: any row in the
activity feed opens a 360° drawer with that agent's live stats, what it does, its recent
activity and jump-to actions into the relevant dashboard; the approval queue
approves/dismisses recommendations (handing off to Execution & Workflow), and the
daily-digest generator composes a live brief.

## Design language

A clean, modern SaaS-analytics UI in the Terova/Tradewind idiom: Inter on white cards over a
soft neutral canvas, a light dark-mode-capable app bar, and **indigo `#4f46e5`** as the single
decisioning accent. KPIs render as **spacious individual tiles** — a border-left accent, a soft
tinted icon chip, a large value, and a rounded delta pill or arrowed drill hint — not a joined
strip. Filters sit in a clean always-visible bar. Cards use a 14px radius, hairline borders and
soft layered shadows that lift on hover. A **validated categorical chart palette** in fixed order
(teal → violet → amber → blue → rose → emerald → indigo → orange; CVD-checked for both light and
dark surfaces) drives every chart; status colors (emerald/amber/orange/red) are reserved for
severity. The one place a % line meets $ columns, the line gets its own aligned panel and axis —
never a second y-axis on the same plot.
