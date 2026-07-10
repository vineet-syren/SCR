/* ============================================================
   SCR · data.js
   Synthetic — but internally consistent — dataset for
   Veridia Group, a global CPG & light-manufacturing company:
   Beverages · Foods & Snacks · Home & Personal Care ·
   Appliances & Devices.

   The resilience engine below derives every metric from the
   same primitives so all pages reconcile:

   · TTS  (Time to Survive)  = inventory cover, days
   · TTR  (Time to Recover)  = node/material recovery, days
   · VAR  ($M)               = dependent NTS × uncovered gap / 365
   · AVAR ($M)               = VAR × probability(severity)
   · RRE  (0–1)              = residual risk after mitigation
   · RI   (0–100, higher=stronger) = composite resilience index

   Anchors: NTS $4.01B · 24 products · 13 markets · 40 nodes ·
   8 single-source materials · mitigated YTD $84.2M AVAR.
   ============================================================ */
window.SCR = window.SCR || {};

(function () {
  const asOf = '2026-07-10';
  const company = 'Veridia Group';

  /* ---------------- Sectors & value streams ---------------- */
  const sectors = [
    { key: 'bev',  name: 'Beverages',             streams: ['Hydration', 'Juice, Coffee & RTD'] },
    { key: 'food', name: 'Foods & Snacks',        streams: ['Snacking', 'Breakfast & Bakery'] },
    { key: 'hpc',  name: 'Home & Personal Care',  streams: ['Home Care', 'Personal Care'] },
    { key: 'dev',  name: 'Appliances & Devices',  streams: ['Kitchen Devices', 'Home Devices'] }
  ];
  const sectorName = k => (sectors.find(s => s.key === k) || {}).name || k;

  /* ---------------- Markets ---------------- */
  const markets = [
    { id: 'US', name: 'United States', region: 'North America', nts: 1140, riskIdx: 2.1 },
    { id: 'CA', name: 'Canada',        region: 'North America', nts: 190,  riskIdx: 1.6 },
    { id: 'MX', name: 'Mexico',        region: 'LATAM',         nts: 230,  riskIdx: 3.1 },
    { id: 'BR', name: 'Brazil',        region: 'LATAM',         nts: 340,  riskIdx: 3.4 },
    { id: 'UK', name: 'United Kingdom',region: 'Europe',        nts: 320,  riskIdx: 2.0 },
    { id: 'DE', name: 'Germany',       region: 'Europe',        nts: 380,  riskIdx: 2.2 },
    { id: 'FR', name: 'France',        region: 'Europe',        nts: 240,  riskIdx: 2.3 },
    { id: 'PL', name: 'Poland',        region: 'Europe',        nts: 150,  riskIdx: 2.6 },
    { id: 'IN', name: 'India',         region: 'APAC',          nts: 420,  riskIdx: 3.6 },
    { id: 'CN', name: 'China',         region: 'APAC',          nts: 260,  riskIdx: 3.3 },
    { id: 'ID', name: 'Indonesia',     region: 'APAC',          nts: 130,  riskIdx: 3.8 },
    { id: 'VN', name: 'Vietnam',       region: 'APAC',          nts: 90,   riskIdx: 4.1 },
    { id: 'AE', name: 'UAE / Gulf',    region: 'MEA',           nts: 120,  riskIdx: 2.9 }
  ];

  /* ---------------- Sites: plants & DCs ---------------- */
  const plants = [
    { id: 'PT1', name: 'Atlanta, USA',            type: 'Plant', region: 'North America', focus: 'Beverage bottling & canning',  ttr: 28, utilization: 84 },
    { id: 'PT2', name: 'Guadalajara, Mexico',     type: 'Plant', region: 'LATAM',         focus: 'Snacks & bars',                ttr: 21, utilization: 78 },
    { id: 'PT3', name: 'Hamburg, Germany',        type: 'Plant', region: 'Europe',        focus: 'Home care liquids',            ttr: 35, utilization: 88 },
    { id: 'PT4', name: 'Łódź, Poland',            type: 'Plant', region: 'Europe',        focus: 'Breakfast, bakery & spreads',  ttr: 24, utilization: 81 },
    { id: 'PT5', name: 'Pune, India',             type: 'Plant', region: 'APAC',          focus: 'Beverages & personal care',    ttr: 30, utilization: 92 },
    { id: 'PT6', name: 'Ho Chi Minh City, Vietnam', type: 'Plant', region: 'APAC',        focus: 'Device assembly',              ttr: 42, utilization: 86 },
    { id: 'PT7', name: 'Shenzhen, China',         type: 'Plant', region: 'APAC',          focus: 'Devices & electronics',        ttr: 38, utilization: 74 },
    { id: 'PT8', name: 'São Paulo, Brazil',       type: 'Plant', region: 'LATAM',         focus: 'Beverages, juice & coffee',    ttr: 26, utilization: 83 }
  ];
  const dcs = [
    { id: 'DC1', name: 'Memphis RDC',    type: 'DC', region: 'North America', markets: ['US', 'CA'],       ttr: 12 },
    { id: 'DC2', name: 'Rotterdam EDC',  type: 'DC', region: 'Europe',        markets: ['UK', 'DE', 'FR'], ttr: 14 },
    { id: 'DC3', name: 'Dubai MDC',      type: 'DC', region: 'MEA',           markets: ['AE'],             ttr: 10 },
    { id: 'DC4', name: 'Singapore RDC',  type: 'DC', region: 'APAC',          markets: ['IN', 'CN', 'ID', 'VN'], ttr: 13 },
    { id: 'DC5', name: 'Panama LDC',     type: 'DC', region: 'LATAM',         markets: ['MX', 'BR'],       ttr: 11 },
    { id: 'DC6', name: 'Warsaw RDC',     type: 'DC', region: 'Europe',        markets: ['PL'],             ttr: 9 }
  ];

  /* ---------------- Material categories ---------------- */
  const categories = [
    { key: 'ing', name: 'Ingredients & Raw Materials' },
    { key: 'pkg', name: 'Packaging' },
    { key: 'elc', name: 'Electronics & Components' },
    { key: 'chm', name: 'Chemicals & Actives' }
  ];
  const catName = k => (categories.find(c => c.key === k) || {}).name || k;

  /* ---------------- Suppliers ----------------
     row: [id, name, city, country, region, catKey, tier, spend$M, ttrDays,
           {fin, qual, rel, geo, cyb, clim}] — score computed below.   */
  const S = [
    ['S01', 'CapForm Industries',        'Ho Chi Minh City', 'Vietnam',      'APAC',  'pkg', 1, 34,  21, { fin: 3.6, qual: 3.6, rel: 4.8, geo: 4.2, cyb: 3.4, clim: 4.8 }],
    ['S02', 'Taicang MicroControls',     'Taicang',          'China',        'APAC',  'elc', 1, 52,  45, { fin: 2.8, qual: 2.4, rel: 4.4, geo: 4.9, cyb: 4.0, clim: 3.0 }],
    ['S03', 'Cerrado Sugar Co-op',       'Ribeirão Preto',   'Brazil',       'LATAM', 'ing', 1, 84,  12, { fin: 1.8, qual: 1.9, rel: 2.4, geo: 2.6, cyb: 2.0, clim: 3.4 }],
    ['S04', 'Santos Verde Coffee',       'Santos',           'Brazil',       'LATAM', 'ing', 1, 96,  30, { fin: 2.2, qual: 2.1, rel: 3.0, geo: 2.8, cyb: 2.2, clim: 4.6 }],
    ['S05', 'Citrus Andina SA',          'São Paulo',        'Brazil',       'LATAM', 'ing', 1, 62,  28, { fin: 2.9, qual: 2.4, rel: 3.4, geo: 2.8, cyb: 2.4, clim: 4.2 }],
    ['S06', 'ArchiPalm Nusantara',       'Medan',            'Indonesia',    'APAC',  'ing', 1, 118, 25, { fin: 2.4, qual: 2.6, rel: 3.2, geo: 4.4, cyb: 2.6, clim: 3.8 }],
    ['S07', 'Vistula Grain Mills',       'Poznań',           'Poland',       'Europe','ing', 1, 57,  10, { fin: 1.6, qual: 1.7, rel: 1.9, geo: 2.0, cyb: 1.8, clim: 2.2 }],
    ['S08', 'Anatolia Hazelnut & Cocoa', 'Ordu',             'Türkiye',      'MEA',   'ing', 1, 74,  32, { fin: 2.8, qual: 2.5, rel: 3.4, geo: 3.8, cyb: 2.4, clim: 4.4 }],
    ['S09', 'Alpine Dairy Co-op',        'Kempten',          'Germany',      'Europe','ing', 1, 41,  18, { fin: 1.9, qual: 2.2, rel: 2.3, geo: 1.8, cyb: 2.0, clim: 2.6 }],
    ['S10', 'AromaWerk Flavors',         'Geneva',           'Switzerland',  'Europe','ing', 1, 88,  40, { fin: 1.7, qual: 2.0, rel: 3.3, geo: 1.7, cyb: 3.0, clim: 2.1 }],
    ['S11', 'Rhine Surfactants GmbH',    'Ludwigshafen',     'Germany',      'Europe','chm', 1, 92,  16, { fin: 2.5, qual: 2.0, rel: 2.7, geo: 2.1, cyb: 2.4, clim: 2.9 }],
    ['S12', 'NovoZym Biotech',           'Copenhagen',       'Denmark',      'Europe','chm', 1, 38,  60, { fin: 1.9, qual: 2.3, rel: 3.2, geo: 1.6, cyb: 3.1, clim: 1.9 }],
    ['S13', 'Grasse Parfums SARL',       'Grasse',           'France',       'Europe','chm', 2, 46,  21, { fin: 2.1, qual: 1.9, rel: 2.4, geo: 1.9, cyb: 2.1, clim: 2.5 }],
    ['S14', 'PrairieWhey Proteins',      'Chicago',          'USA',          'North America', 'ing', 2, 33, 24, { fin: 2.6, qual: 2.3, rel: 2.7, geo: 1.7, cyb: 2.2, clim: 2.4 }],
    ['S15', 'PolyPet Resins',            'Jubail',           'Saudi Arabia', 'MEA',   'pkg', 1, 129, 15, { fin: 1.8, qual: 2.0, rel: 2.8, geo: 3.2, cyb: 2.3, clim: 2.7 }],
    ['S16', 'LumenCan Packaging',        'Monterrey',        'Mexico',       'LATAM', 'pkg', 1, 77,  11, { fin: 2.3, qual: 2.1, rel: 2.9, geo: 2.7, cyb: 2.1, clim: 2.4 }],
    ['S17', 'FlexiWrap Films',           'Chennai',          'India',        'APAC',  'pkg', 1, 58,  18, { fin: 2.7, qual: 2.6, rel: 3.8, geo: 3.0, cyb: 2.5, clim: 4.5 }],
    ['S18', 'Corruboard Americas',       'Memphis',          'USA',          'North America', 'pkg', 1, 71, 6, { fin: 1.5, qual: 1.6, rel: 1.7, geo: 1.4, cyb: 1.9, clim: 2.0 }],
    ['S19', 'NordCarton Oyj',            'Tampere',          'Finland',      'Europe','pkg', 1, 42,  30, { fin: 2.2, qual: 2.0, rel: 2.9, geo: 1.7, cyb: 2.6, clim: 2.3 }],
    ['S20', 'Shandong Glassworks',       'Zibo',             'China',        'APAC',  'pkg', 2, 36,  19, { fin: 2.5, qual: 2.8, rel: 3.1, geo: 3.5, cyb: 2.7, clim: 2.9 }],
    ['S21', 'PrintSleeve Labels',        'Kraków',           'Poland',       'Europe','pkg', 2, 24,  8,  { fin: 1.5, qual: 1.6, rel: 1.8, geo: 1.9, cyb: 1.7, clim: 1.8 }],
    ['S22', 'Dragon Cell Tech',          'Dongguan',         'China',        'APAC',  'elc', 1, 44,  50, { fin: 2.9, qual: 3.3, rel: 3.6, geo: 4.1, cyb: 3.2, clim: 3.0 }],
    ['S23', 'Mekong Motor & Thermal',    'Hanoi',            'Vietnam',      'APAC',  'elc', 1, 94,  26, { fin: 2.4, qual: 3.1, rel: 3.0, geo: 3.2, cyb: 2.6, clim: 3.6 }],
    ['S24', 'Pearl River EMS',           'Shenzhen',         'China',        'APAC',  'elc', 1, 71,  22, { fin: 2.2, qual: 2.5, rel: 3.0, geo: 3.7, cyb: 3.4, clim: 2.8 }],
    ['S25', 'Delta Polymers',            'Ho Chi Minh City', 'Vietnam',      'APAC',  'chm', 2, 49,  14, { fin: 2.3, qual: 2.2, rel: 2.6, geo: 3.0, cyb: 2.2, clim: 3.3 }],
    ['S26', 'PureFlow Filtration',       'Daejeon',          'South Korea',  'APAC',  'elc', 1, 22,  35, { fin: 2.0, qual: 2.1, rel: 3.1, geo: 2.9, cyb: 2.5, clim: 2.2 }],
    ['S27', 'EuroSweet Refineries',      'Gdańsk',           'Poland',       'Europe','ing', 1, 46,  10, { fin: 1.7, qual: 1.8, rel: 2.1, geo: 2.0, cyb: 1.9, clim: 2.3 }],
    ['S28', 'SunGrove Citrus Partners',  'Lakeland',         'USA',          'North America', 'ing', 1, 38, 24, { fin: 2.1, qual: 2.0, rel: 2.6, geo: 1.8, cyb: 2.0, clim: 3.6 }],
    ['S29', 'Great Plains Millers',      'Kansas City',      'USA',          'North America', 'ing', 1, 41, 8,  { fin: 1.6, qual: 1.7, rel: 1.8, geo: 1.5, cyb: 1.8, clim: 2.4 }],
    ['S30', 'PacRim Packaging Group',    'Taipei',           'Taiwan',       'APAC',  'pkg', 1, 66,  13, { fin: 1.9, qual: 2.0, rel: 2.4, geo: 3.3, cyb: 2.2, clim: 2.6 }],
    ['S31', 'Highland Robusta Co-op',    'Da Lat',           'Vietnam',      'APAC',  'ing', 2, 29,  20, { fin: 2.4, qual: 2.4, rel: 2.7, geo: 3.1, cyb: 2.3, clim: 3.5 }],
    ['S32', 'Palmex Malaysia',           'Port Klang',       'Malaysia',     'APAC',  'ing', 1, 52,  17, { fin: 2.0, qual: 2.2, rel: 2.5, geo: 2.9, cyb: 2.1, clim: 3.2 }]
  ];

  const DIM_W = { fin: 0.24, qual: 0.16, rel: 0.20, geo: 0.16, cyb: 0.12, clim: 0.12 };

  const suppliers = S.map(r => {
    const [id, name, city, country, region, cat, tier, spend, ttr, dims] = r;
    const score = +Object.keys(DIM_W).reduce((a, k) => a + DIM_W[k] * dims[k], 0).toFixed(2);
    const rating = SCR.risk.ratingOf(score);
    // deterministic 12-month score trend ending at current score
    const trend = [];
    for (let i = 0; i < 12; i++) {
      const drift = (score - 0.3) + (i / 11) * 0.3;
      const wob = 0.14 * Math.sin(i * 1.9 + id.charCodeAt(2));
      trend.push(Math.max(0.4, Math.min(5, +(drift + wob).toFixed(2))));
    }
    trend[11] = score;
    return { id, name, city, country, region, cat, catName: catName(cat), tier, spend, ttr, dims, score, rating, trend, type: 'Supplier' };
  });

  /* ---------------- Materials / components ----------------
     row: [id, name, catKey, sub, supplierIds, plantIds,
           ttsDays, ttrDays, rre(0–1), spend$M, substitution note]  */
  const M = [
    ['M01', 'Refined cane sugar',        'ing', 'Sweeteners',        ['S03', 'S27'],        ['PT1', 'PT4', 'PT8'], 26, 12, 0.24, 84,  'High — multiple origins, spot market at premium'],
    ['M02', 'Arabica green coffee',      'ing', 'Coffee & Cocoa',    ['S04', 'S31'],        ['PT5', 'PT8'],        34, 30, 0.38, 96,  'Medium — robusta blend shift needs cup-profile sign-off'],
    ['M03', 'Orange juice concentrate',  'ing', 'Fruit & Juice',     ['S05', 'S28'],        ['PT8'],               15, 28, 0.52, 62,  'Low — citrus supply concentrated in two origins'],
    ['M04', 'RSPO palm oil',             'ing', 'Oils & Fats',       ['S06', 'S32'],        ['PT2', 'PT4', 'PT5'], 22, 25, 0.44, 118, 'Medium — certified alternates limited, 6-wk requal'],
    ['M05', 'Milled grains & flour',     'ing', 'Grains',            ['S07', 'S29'],        ['PT2', 'PT4'],        28, 10, 0.18, 57,  'High — regional mills interchangeable'],
    ['M06', 'Hazelnut & cocoa paste',    'ing', 'Coffee & Cocoa',    ['S08'],        ['PT4'],               19, 32, 0.58, 74,  'Low — origin-specific roast profile, single source'],
    ['M07', 'Skimmed milk powder',       'ing', 'Dairy',             ['S09', 'S14'],        ['PT5', 'PT8'],        24, 18, 0.30, 41,  'High — commodity, EU/NZ alternates'],
    ['M08', 'Flavor & aroma systems',    'ing', 'Flavors',           ['S10'],        ['PT1', 'PT2', 'PT8'], 16, 40, 0.61, 88,  'Low — proprietary formulations, 8–10 wk re-match'],
    ['M09', 'Surfactants (LAS/SLES)',    'chm', 'Surfactants',       ['S11'],        ['PT3', 'PT5'],        21, 16, 0.27, 92,  'Medium — dual grade approval in progress'],
    ['M10', 'Enzymes & actives',         'chm', 'Actives',           ['S12'],        ['PT3'],               18, 60, 0.66, 38,  'Low — patented cold-wash enzyme, single source'],
    ['M11', 'Fragrance oils',            'chm', 'Fragrance',         ['S13', 'S10'],        ['PT3', 'PT5'],        25, 21, 0.33, 46,  'Medium — re-match feasible in 4 wks'],
    ['M12', 'Whey protein blend',        'ing', 'Proteins',          ['S14', 'S09'],        ['PT2'],               20, 24, 0.41, 33,  'Medium — soy blend approved as fallback'],
    ['M13', 'PET resin & preforms',      'pkg', 'Rigid Plastics',    ['S15', 'S30'],        ['PT1', 'PT5', 'PT8'], 17, 15, 0.29, 129, 'High — resin is commodity; preform tooling movable'],
    ['M14', 'Closures & caps',           'pkg', 'Closures',          ['S01'],        ['PT1', 'PT5', 'PT8'], 7,  21, 0.82, 34,  'Low — single qualified cap supplier, tooling 3–4 wks'],
    ['M15', 'Aluminium cans 330ml',      'pkg', 'Metal Packaging',   ['S16', 'S30'],        ['PT1', 'PT8'],        14, 11, 0.21, 77,  'High — two can makers under contract'],
    ['M16', 'BOPP laminate film',        'pkg', 'Flexibles',         ['S17'],        ['PT2', 'PT4'],        12, 18, 0.49, 58,  'Medium — print cylinders re-engraved in 3 wks'],
    ['M17', 'Corrugated shippers',       'pkg', 'Corrugated',        ['S18', 'S30'],        ['PT1', 'PT2', 'PT3', 'PT4', 'PT5', 'PT6', 'PT7', 'PT8'], 23, 6, 0.12, 71, 'High — regional converters everywhere'],
    ['M18', 'Liquid carton board',       'pkg', 'Cartons',           ['S19'],        ['PT8'],               20, 30, 0.55, 42,  'Low — food-grade board allocation is tight'],
    ['M19', 'Glass jars',                'pkg', 'Glass',             ['S20'],        ['PT4', 'PT8'],        26, 19, 0.26, 36,  'Medium — mold transfer 4 wks'],
    ['M20', 'Labels & sleeves',          'pkg', 'Labels',            ['S21', 'S30'],        ['PT1', 'PT3', 'PT5', 'PT8'], 25, 8, 0.14, 24, 'High — print brokers available'],
    ['M21', 'HDPE bottles & closures',   'pkg', 'Rigid Plastics',    ['S15', 'S25'], ['PT3', 'PT5'],        19, 12, 0.22, 63,  'High — dual-sourced, common molds'],
    ['M22', '32-bit control MCU',        'elc', 'Semiconductors',    ['S02'],        ['PT6', 'PT7'],        8,  45, 0.74, 52,  'Low — firmware port + EMC retest 8–10 wks'],
    ['M23', 'Li-ion cells 2500 mAh',     'elc', 'Energy Storage',    ['S22'],        ['PT6'],               21, 50, 0.57, 44,  'Low — UN38.3 + pack redesign 10+ wks'],
    ['M24', 'BLDC motors',               'elc', 'Motors',            ['S23', 'S24'],        ['PT6', 'PT7'],        18, 26, 0.39, 66,  'Medium — second source at 40% capacity'],
    ['M25', 'Heating elements',          'elc', 'Thermal',           ['S23'],        ['PT6'],               24, 20, 0.28, 28,  'Medium — regional alternates in audit'],
    ['M26', 'Main PCBA',                 'elc', 'PCB Assemblies',    ['S24'],        ['PT6', 'PT7'],        15, 22, 0.36, 71,  'Medium — second EMS in qualification'],
    ['M27', 'ABS/PC housing resin',      'chm', 'Engineering Polymers', ['S25', 'S15'],     ['PT6', 'PT7'],        22, 14, 0.19, 49,  'High — commodity grades, color match needed'],
    ['M28', 'HEPA filter media',         'elc', 'Filtration',        ['S26'],        ['PT7'],               12, 35, 0.63, 22,  'Low — single certified media line']
  ];

  /* ---------------- Products / SKUs ----------------
     row: [id, name, brand, sectorKey, stream, nts$M, growth%, margin%,
           materialIds, plantIds, dcIds, marketIds] */
  const P = [
    ['P01', 'VeriSpark Sparkling 500ml',   'VeriSpark',  'bev',  'Hydration',           265, 9.4,  31.5, ['M08', 'M13', 'M14', 'M20', 'M17'],               ['PT1', 'PT5', 'PT8'], ['DC1', 'DC4', 'DC5'], ['US', 'CA', 'IN', 'BR', 'MX']],
    ['P02', 'AquaPure Still Water 1L',     'AquaPure',   'bev',  'Hydration',           210, 4.2,  24.8, ['M13', 'M14', 'M20', 'M17'],                      ['PT1', 'PT5'],        ['DC1', 'DC4'],        ['US', 'IN', 'AE']],
    ['P03', 'Vitalis Isotonic 600ml',      'Vitalis',    'bev',  'Hydration',           185, 14.6, 33.2, ['M01', 'M08', 'M13', 'M14', 'M20', 'M17'],        ['PT1', 'PT5'],        ['DC1', 'DC3', 'DC4'], ['US', 'IN', 'AE', 'ID']],
    ['P04', 'Kavaro Cold Brew RTD 250ml',  'Kavaro',     'bev',  'Juice, Coffee & RTD', 155, 21.3, 35.8, ['M02', 'M07', 'M15', 'M20', 'M17'],               ['PT8', 'PT5'],        ['DC1', 'DC5', 'DC4'], ['US', 'BR', 'MX', 'IN']],
    ['P05', 'Kavaro Instant Coffee 200g',  'Kavaro',     'bev',  'Juice, Coffee & RTD', 190, 6.8,  38.4, ['M02', 'M19', 'M20', 'M17'],                      ['PT8', 'PT5'],        ['DC5', 'DC4', 'DC2'], ['BR', 'MX', 'IN', 'UK', 'DE']],
    ['P06', 'OrchardPress Orange 1L',      'OrchardPress','bev', 'Juice, Coffee & RTD', 175, 3.1,  22.6, ['M03', 'M18', 'M14', 'M20', 'M17'],               ['PT8'],               ['DC5', 'DC2', 'DC1'], ['BR', 'US', 'UK', 'DE', 'FR']],
    ['P07', 'VeriSpark Cola Zero 330ml',   'VeriSpark',  'bev',  'Hydration',           280, 7.9,  30.1, ['M01', 'M08', 'M13', 'M14', 'M15', 'M20', 'M17'], ['PT1', 'PT5', 'PT8'], ['DC1', 'DC4', 'DC5', 'DC3'], ['US', 'MX', 'IN', 'AE', 'ID']],
    ['P08', 'CrunchWave Potato Chips',     'CrunchWave', 'food', 'Snacking',            240, 8.8,  29.4, ['M04', 'M08', 'M16', 'M17'],                      ['PT2', 'PT4'],        ['DC1', 'DC5', 'DC2', 'DC6'], ['US', 'MX', 'UK', 'DE', 'PL']],
    ['P09', 'NutriBar Protein Bar',        'NutriBar',   'food', 'Snacking',            145, 24.2, 34.6, ['M12', 'M06', 'M16', 'M17'],                      ['PT2'],               ['DC1', 'DC2'],        ['US', 'CA', 'UK', 'DE']],
    ['P10', 'GoldenMill Cereal 500g',      'GoldenMill', 'food', 'Breakfast & Bakery',  190, 2.4,  27.2, ['M05', 'M01', 'M16', 'M17'],                      ['PT4'],               ['DC2', 'DC6'],        ['UK', 'DE', 'FR', 'PL']],
    ['P11', 'ChocoNova Hazelnut Spread',   'ChocoNova',  'food', 'Snacking',            165, 11.2, 36.9, ['M06', 'M04', 'M19', 'M20', 'M17'],               ['PT4'],               ['DC2', 'DC6', 'DC3'], ['DE', 'FR', 'PL', 'UK', 'AE']],
    ['P12', 'BakeHouse Cookies',           'BakeHouse',  'food', 'Breakfast & Bakery',  120, 1.8,  25.3, ['M05', 'M01', 'M04', 'M16', 'M17'],               ['PT4', 'PT2'],        ['DC2', 'DC5', 'DC6'], ['DE', 'PL', 'MX', 'FR']],
    ['P13', 'GoldenMill Instant Oats',     'GoldenMill', 'food', 'Breakfast & Bakery',  105, 5.6,  26.1, ['M05', 'M16', 'M17'],                             ['PT4'],               ['DC2', 'DC6'],        ['UK', 'PL', 'DE']],
    ['P14', 'PureWash Liquid Detergent',   'PureWash',   'hpc',  'Home Care',           260, 6.3,  32.8, ['M09', 'M10', 'M11', 'M21', 'M20', 'M17'],        ['PT3', 'PT5'],        ['DC2', 'DC4', 'DC6'], ['DE', 'UK', 'FR', 'PL', 'IN']],
    ['P15', 'SoftSilk Fabric Conditioner', 'SoftSilk',   'hpc',  'Home Care',           140, 4.9,  30.4, ['M09', 'M11', 'M21', 'M20', 'M17'],               ['PT3'],               ['DC2', 'DC6'],        ['DE', 'UK', 'FR', 'PL']],
    ['P16', 'AquaFresh Dish Gel',          'AquaFresh',  'hpc',  'Home Care',           115, 7.7,  28.9, ['M09', 'M11', 'M21', 'M20'],                      ['PT3', 'PT5'],        ['DC2', 'DC4'],        ['DE', 'FR', 'IN', 'CN']],
    ['P17', 'VelvetCare Shampoo',          'VelvetCare', 'hpc',  'Personal Care',       185, 9.1,  35.6, ['M09', 'M11', 'M21', 'M20', 'M17'],               ['PT5', 'PT3'],        ['DC4', 'DC2', 'DC3'], ['IN', 'CN', 'ID', 'AE', 'DE']],
    ['P18', 'VelvetCare Body Wash',        'VelvetCare', 'hpc',  'Personal Care',       130, 12.4, 33.1, ['M09', 'M11', 'M21', 'M20'],                      ['PT5'],               ['DC4', 'DC3'],        ['IN', 'ID', 'AE', 'VN']],
    ['P19', 'DermaPure Bar Soap',          'DermaPure',  'hpc',  'Personal Care',       95,  2.2,  24.7, ['M04', 'M11', 'M16', 'M17'],                      ['PT5'],               ['DC4'],               ['IN', 'ID', 'VN']],
    ['P20', 'BrewMaster Coffee Machine',   'BrewMaster', 'dev',  'Kitchen Devices',     165, 13.8, 33.4, ['M22', 'M25', 'M26', 'M24', 'M27', 'M17'],        ['PT6', 'PT7'],        ['DC1', 'DC2'],        ['US', 'DE', 'UK', 'FR']],
    ['P21', 'AeroBlend Power Blender',     'AeroBlend',  'dev',  'Kitchen Devices',     135, 10.6, 31.2, ['M22', 'M24', 'M26', 'M27', 'M17'],               ['PT6', 'PT7'],        ['DC1', 'DC2', 'DC4'], ['US', 'DE', 'CN', 'IN']],
    ['P22', 'SteamGlide Garment Steamer',  'SteamGlide', 'dev',  'Home Devices',        90,  6.4,  27.8, ['M25', 'M22', 'M27', 'M17'],                      ['PT6'],               ['DC4', 'DC2'],        ['CN', 'IN', 'DE']],
    ['P23', 'TrimTech Grooming Kit Pro',   'TrimTech',   'dev',  'Home Devices',        120, 15.2, 36.3, ['M23', 'M22', 'M24', 'M27', 'M17'],               ['PT6'],               ['DC1', 'DC4'],        ['US', 'IN', 'CN', 'VN']],
    ['P24', 'AirPure Compact Purifier',    'AirPure',    'dev',  'Home Devices',        150, 26.1, 34.9, ['M22', 'M26', 'M28', 'M24', 'M27', 'M17'],        ['PT7'],               ['DC1', 'DC4', 'DC2'], ['US', 'CN', 'IN', 'DE', 'UK']]
  ];

  /* ============================================================
     Resilience engine — everything below is DERIVED
     ============================================================ */

  // materials (pass 1: structure)
  const materials = M.map(r => {
    const [id, name, cat, sub, sup, pl, tts, ttr, rre, spend, substitution] = r;
    return {
      id, name, cat, catName: catName(cat), sub,
      suppliers: sup, plants: pl, tts, ttr, rre, spend, substitution,
      singleSource: sup.length === 1,
      gap: ttr - tts,
      score: 0, var: 0, avar: 0, depNTS: 0, depProducts: []
    };
  });
  const materialById = id => materials.find(m => m.id === id);

  // products (pass 1: structure)
  const products = P.map(r => {
    const [id, name, brand, sector, stream, nts, growth, margin, mats, pl, dc, mk] = r;
    return {
      id, name, brand, sector, sectorName: sectorName(sector), stream,
      nts, growth, margin, materials: mats, plants: pl, dcs: dc, markets: mk
    };
  });

  // material risk score = worst supplier score, nudged by single-sourcing
  materials.forEach(m => {
    const sups = m.suppliers.map(sid => suppliers.find(s => s.id === sid)).filter(Boolean);
    const maxSup = Math.max(...sups.map(s => s.score));
    m.score = +Math.min(5, maxSup + (m.singleSource ? 0.25 : 0)).toFixed(2);
    m.rating = SCR.risk.ratingOf(m.score);
    m.depProducts = products.filter(p => p.materials.includes(m.id)).map(p => p.id);
    m.depNTS = +m.depProducts.reduce((a, pid) => a + products.find(p => p.id === pid).nts, 0).toFixed(0);
    // VAR = sales lost during the uncovered recovery window + residual allocation risk
    const gapDays = Math.max(0, m.ttr - m.tts);
    m.var = +(m.depNTS * gapDays / 365 + m.depNTS * 0.008 * (m.score / 5)).toFixed(1);
    // AVAR = VAR × disruption probability rising with node risk
    m.prob = +Math.min(0.55, 0.10 + 0.09 * m.score).toFixed(2);
    m.avar = +(m.var * m.prob).toFixed(1);
  });

  // product metrics from BOM
  products.forEach(p => {
    const mats = p.materials.map(materialById).filter(Boolean);
    p.var = +mats.reduce((a, m) => a + m.var * (p.nts / m.depNTS), 0).toFixed(1);
    p.avar = +mats.reduce((a, m) => a + m.avar * (p.nts / m.depNTS), 0).toFixed(1);
    p.ttsMin = Math.min(...mats.map(m => m.tts));
    p.ttrMax = Math.max(...mats.map(m => m.ttr));
    p.gapMax = Math.max(...mats.map(m => m.gap));
    p.gapCount = mats.filter(m => m.gap > 0).length;
    p.singleRisky = mats.filter(m => m.singleSource && m.score >= 2.8).length;
    p.avgRre = +(mats.reduce((a, m) => a + m.rre, 0) / mats.length).toFixed(2);
    const supScores = mats.map(m => m.score);
    p.maxScore = Math.max(...supScores);
    // Resilience Index — composite, higher is stronger
    let ri = 97
      - Math.max(0, p.gapMax) * 0.48         // recovery gap dominates
      - p.gapCount * 1.4                     // breadth of exposed components
      - p.singleRisky * 2.8                  // risky sole-sourcing
      - p.avgRre * 10                        // residual risk after mitigation
      - Math.max(0, p.maxScore - 2) * 3.2;   // worst node severity
    p.ri = +Math.max(34, Math.min(96, ri)).toFixed(1);
    p.riBand = SCR.risk.riBand(p.ri);
    // 12-month RI trend (deterministic wobble, ends at current)
    p.riTrend = [];
    for (let i = 0; i < 12; i++) {
      const drift = p.ri + 2.4 - (i / 11) * 2.4;
      const wob = 1.4 * Math.sin(i * 1.7 + p.id.charCodeAt(2));
      p.riTrend.push(+Math.max(30, Math.min(97, drift + wob)).toFixed(1));
    }
    p.riTrend[11] = p.ri;
  });

  // supplier (node) aggregates
  suppliers.forEach(s => {
    const mats = materials.filter(m => m.suppliers.includes(s.id));
    s.materialsCount = mats.length;
    const depP = new Set();
    mats.forEach(m => m.depProducts.forEach(pid => depP.add(pid)));
    s.productsCount = depP.size;
    s.depNTS = +[...depP].reduce((a, pid) => a + products.find(p => p.id === pid).nts, 0).toFixed(0);
    // attribute material VAR to the supplier (split across its suppliers)
    s.var = +mats.reduce((a, m) => a + m.var / m.suppliers.length, 0).toFixed(1);
    s.avar = +mats.reduce((a, m) => a + m.avar / m.suppliers.length, 0).toFixed(1);
    s.singleCount = mats.filter(m => m.singleSource).length;
    s.ri = +Math.max(30, Math.min(96, 99 - s.score * 12.5 - s.singleCount * 2.1)).toFixed(1);
    s.countries = new Set([...depP].flatMap(pid => products.find(p => p.id === pid).markets)).size;
  });

  // plant aggregates
  plants.forEach(pt => {
    const prods = products.filter(p => p.plants.includes(pt.id));
    pt.products = prods.map(p => p.id);
    pt.nts = +prods.reduce((a, p) => a + p.nts / p.plants.length, 0).toFixed(0);
    pt.materials = materials.filter(m => m.plants.includes(pt.id)).map(m => m.id);
    const mats = pt.materials.map(materialById);
    pt.ttsMin = Math.min(...mats.map(m => m.tts));
    pt.criticalMats = mats.filter(m => m.gap > 0).length;
    pt.suppliersIn = new Set(mats.flatMap(m => m.suppliers)).size;
    pt.markets = new Set(prods.flatMap(p => p.markets)).size;
    pt.var = +mats.reduce((a, m) => a + m.var * 0.45 / m.plants.length, 0).toFixed(1);
    pt.avar = +mats.reduce((a, m) => a + m.avar * 0.45 / m.plants.length, 0).toFixed(1);
    pt.ri = +Math.max(35, Math.min(95, 96 - pt.criticalMats * 2.6 - (pt.utilization - 70) * 0.34 - pt.ttr * 0.22)).toFixed(1);
    pt.capacityAtRisk = +(pt.utilization > 85 ? (pt.utilization - 85) * 1.9 + 8 : 5 + pt.criticalMats).toFixed(0);
  });

  // DC aggregates
  dcs.forEach(dc => {
    const prods = products.filter(p => p.dcs.includes(dc.id));
    dc.products = prods.map(p => p.id);
    dc.nts = +prods.reduce((a, p) => a + p.nts / p.dcs.length, 0).toFixed(0);
    dc.marketsServed = dc.markets.length;
    dc.var = +(dc.nts * 0.028).toFixed(1);
    dc.avar = +(dc.var * 0.24).toFixed(1);
    dc.ri = +Math.max(40, Math.min(95, 91 - dc.ttr * 0.7 + dc.marketsServed)).toFixed(1);
  });

  // unified node list (for exec ranking + network)
  const nodes = [
    ...suppliers.map(s => ({ ref: s, id: s.id, name: s.name, type: 'Supplier', sub: s.city + ', ' + s.country, var: s.var, avar: s.avar, sales: s.depNTS, ri: s.ri })),
    ...plants.map(p => ({ ref: p, id: p.id, name: p.name, type: 'Plant', sub: p.focus, var: p.var, avar: p.avar, sales: p.nts, ri: p.ri })),
    ...dcs.map(d => ({ ref: d, id: d.id, name: d.name, type: 'DC', sub: d.region + ' distribution', var: d.var, avar: d.avar, sales: d.nts, ri: d.ri }))
  ];

  /* ---------------- Enterprise KPIs ---------------- */
  const totalNTS = products.reduce((a, p) => a + p.nts, 0);
  const totalVAR = +materials.reduce((a, m) => a + m.var, 0).toFixed(1);
  const totalAVAR = +materials.reduce((a, m) => a + m.avar, 0).toFixed(1);
  const enterpriseRI = +(products.reduce((a, p) => a + p.ri * p.nts, 0) / totalNTS).toFixed(1);
  const gapProducts = products.filter(p => p.gapMax > 0).length;
  const gapMaterials = materials.filter(m => m.gap > 0).length;
  const singleSourceCount = materials.filter(m => m.singleSource).length;
  const singleSourceRisky = materials.filter(m => m.singleSource && m.score >= 2.8).length;

  /* ---------------- Monthly series (Aug 25 → Jul 26) ---------------- */
  const months = ['Aug 25', 'Sep 25', 'Oct 25', 'Nov 25', 'Dec 25', 'Jan 26', 'Feb 26', 'Mar 26', 'Apr 26', 'May 26', 'Jun 26', 'Jul 26'];
  const monthly = {
    months,
    ri: [2.9, 2.5, 2.1, 1.7, 1.2, 1.5, 0.9, 0.4, -0.4, -0.9, -1.3, 0].map(o => +(enterpriseRI + o).toFixed(1)),
    avar: [0.74, 0.77, 0.79, 0.82, 0.85, 0.84, 0.88, 0.91, 0.94, 0.97, 0.99, 1.0].map(f => +(totalAVAR * f).toFixed(1)),
    // cumulative AVAR mitigated by lever ($M) — scaled so YTD equals the bridge's Mitigated step
    mitigatedCum: (function () {
      const raw = {
        'Alternate supplier': [2.1, 4.6, 7.4, 10.5, 13.2, 16.4, 19.5, 22.8, 26.2, 29.4, 32.1, 34.6],
        'Safety stock build': [1.4, 3.1, 5.2, 7.0, 9.1, 11.2, 13.4, 15.9, 18.1, 20.4, 22.6, 24.8],
        'Re-routing & lanes': [0.8, 1.7, 2.9, 4.1, 5.3, 6.6, 7.8, 9.2, 10.5, 11.9, 13.1, 14.3],
        'Substitution':       [0.5, 1.2, 2.0, 2.9, 3.8, 4.7, 5.6, 6.6, 7.7, 8.7, 9.6, 10.5]
      };
      const rawTotal = 84.2;
      const scale = (totalAVAR * 0.32) / rawTotal;
      Object.keys(raw).forEach(k => { raw[k] = raw[k].map(v => +(v * scale).toFixed(1)); });
      return raw;
    })(),
    // market × month "% of NTS at risk" heat (deterministic, event-flavored)
    marketHeat: markets.map((mk, r) => months.map((_, c) => {
      let v = mk.riskIdx * 1.1 + 1.1 * Math.sin(c * 0.9 + r * 1.3);
      if (mk.id === 'IN' && (c === 10 || c === 11)) v += 2.8;      // monsoon
      if (mk.id === 'BR' && (c === 11)) v += 2.2;                  // coffee frost
      if (mk.id === 'VN' && (c === 1 || c === 2)) v += 2.4;        // typhoon season
      if (mk.id === 'CN' && c >= 9) v += 1.6;                      // export inspections
      if (mk.id === 'ID' && c >= 8) v += 1.4;                      // palm oil levy
      return +Math.max(0.3, Math.min(10, v)).toFixed(1);
    }))
  };
  const mitigatedYtd = +Object.values(monthly.mitigatedCum).reduce((a, s) => a + s[11], 0).toFixed(1);

  /* ---------------- AVAR bridge (waterfall, internally consistent) ---------------- */
  const wf = f => +(totalAVAR * f).toFixed(1);
  const avarBridge = {
    steps: [
      { label: 'FY26 opening AVAR', value: wf(0.78), type: 'total' },
      { label: 'New risk events', value: wf(0.49), type: 'up' },
      { label: 'Escalations', value: wf(0.16), type: 'up' },
      { label: 'Mitigated', value: -wf(0.32), type: 'down' },
      { label: 'Resolved / expired', value: -wf(0.11), type: 'down' },
      { label: 'Current AVAR', value: totalAVAR, type: 'total' }
    ]
  };

  /* ---------------- Mitigation funnel (FY26 YTD) ---------------- */
  const funnel = [
    { stage: 'Signals sensed', value: 1462 },
    { stage: 'Qualified risks', value: 386 },
    { stage: 'Impact assessed', value: 241 },
    { stage: 'Mitigations proposed', value: 118 },
    { stage: 'Approved', value: 84 },
    { stage: 'Executed & verified', value: 66 }
  ];

  /* ---------------- Resilience programs (Gantt) ---------------- */
  const gantt = [
    {
      id: 'G1', name: 'Closures dual-source — alternate cap supplier', owner: 'L. Tran', linked: 'AL-301', progress: 34,
      phases: [
        ['Assessment', '2026-06-08', '2026-06-24', 'done'],
        ['Design', '2026-06-24', '2026-07-15', 'active'],
        ['Build', '2026-07-15', '2026-08-20', 'planned'],
        ['Testing', '2026-08-20', '2026-09-10', 'planned'],
        ['Rollout', '2026-09-10', '2026-09-28', 'planned']
      ]
    },
    {
      id: 'G2', name: 'MCU second source qualification (STM-class)', owner: 'A. Chen', linked: 'AL-302', progress: 22,
      phases: [
        ['Assessment', '2026-05-28', '2026-06-18', 'done'],
        ['Design', '2026-06-18', '2026-07-20', 'active'],
        ['Build', '2026-07-20', '2026-09-01', 'planned'],
        ['Testing', '2026-09-01', '2026-10-06', 'planned'],
        ['Rollout', '2026-10-06', '2026-10-26', 'planned']
      ]
    },
    {
      id: 'G3', name: 'Enzyme buffer build & second fermentation site', owner: 'M. Sørensen', linked: 'AL-304', progress: 58,
      phases: [
        ['Assessment', '2026-04-20', '2026-05-05', 'done'],
        ['Design', '2026-05-05', '2026-05-26', 'done'],
        ['Build', '2026-05-26', '2026-07-22', 'active'],
        ['Testing', '2026-07-22', '2026-08-12', 'planned'],
        ['Rollout', '2026-08-12', '2026-08-30', 'planned']
      ]
    },
    {
      id: 'G4', name: 'Chennai film flood recovery & EU backup converter', owner: 'R. Iyer', linked: 'AL-306', progress: 71,
      phases: [
        ['Assessment', '2026-05-12', '2026-05-20', 'done'],
        ['Design', '2026-05-20', '2026-06-03', 'done'],
        ['Build', '2026-06-03', '2026-07-18', 'active'],
        ['Testing', '2026-07-18', '2026-08-02', 'planned'],
        ['Rollout', '2026-08-02', '2026-08-16', 'planned']
      ]
    },
    {
      id: 'G5', name: 'HEPA media localization (EU + NA lines)', owner: 'J. Park', linked: 'AL-308', progress: 12,
      phases: [
        ['Assessment', '2026-06-30', '2026-07-20', 'active'],
        ['Design', '2026-07-20', '2026-08-18', 'planned'],
        ['Build', '2026-08-18', '2026-09-28', 'planned'],
        ['Testing', '2026-09-28', '2026-10-25', 'planned'],
        ['Rollout', '2026-10-25', '2026-11-12', 'planned']
      ]
    }
  ];

  /* ---------------- Alerts ---------------- */
  const alerts = [
    {
      id: 'AL-301', sev: 'critical', type: 'TTR > TTS breach', status: 'open', time: '05:12', owner: 'Category Leader',
      title: 'Closures & caps: recovery 21d vs survival 7d — 5 beverage SKUs exposed',
      detail: 'CapForm Industries is the single qualified closures supplier. Inventory survives 7 days; supplier recovery after a disruption takes 21 days. Uncovered gap of 14 days puts $50M of NTS at risk across VeriSpark, AquaPure, Vitalis and OrchardPress lines.',
      nodes: ['S01'], mats: ['M14'], exposure: materialById('M14').var
    },
    {
      id: 'AL-302', sev: 'critical', type: 'TTR > TTS breach', status: 'open', time: '04:48', owner: 'Value Chain Leader',
      title: 'Control MCU: single source with 45d recovery vs 8d cover — all device SKUs',
      detail: 'Taicang MicroControls supplies the 32-bit MCU used in every appliance platform. Export inspections have stretched clearance. A failure stops assembly at HCMC and Shenzhen within 8 days; requalification takes 45 days.',
      nodes: ['S02'], mats: ['M22'], exposure: materialById('M22').var
    },
    {
      id: 'AL-303', sev: 'high', type: 'External event', status: 'ack', time: '04:15', owner: 'Risk & Resilience Leader',
      title: 'Brazil frost advisory — arabica supply and OJ concentrate under watch',
      detail: 'Cold front over Minas Gerais and São Paulo state. Santos Verde Coffee and Citrus Andina climate scores raised. Kavaro and OrchardPress streams carry $18.4M combined AVAR if frost materializes.',
      nodes: ['S04', 'S05'], mats: ['M02', 'M03'], exposure: 18.4
    },
    {
      id: 'AL-304', sev: 'high', type: 'Single-source critical', status: 'assigned', time: 'Yesterday', owner: 'Category Leader',
      title: 'Cold-wash enzymes: patented single source, 60d recovery',
      detail: 'NovoZym Biotech is the only source for the enzyme system in PureWash. RRE remains 0.66 after current mitigations. Buffer build (G3) is 58% complete — 22 days of extra cover secured so far.',
      nodes: ['S12'], mats: ['M10'], exposure: materialById('M10').var
    },
    {
      id: 'AL-305', sev: 'high', type: 'RI below threshold', status: 'open', time: 'Yesterday', owner: 'Risk & Resilience Leader',
      title: 'AirPure Compact Purifier RI dropped below 60 — fastest-growing device SKU',
      detail: 'Three of six components (MCU, HEPA media, PCBA) carry TTR > TTS. Growth of +26% is outpacing component qualification. RI has fallen below the 60 threshold.',
      nodes: ['S02', 'S26', 'S24'], mats: ['M22', 'M28', 'M26'], exposure: 24.6
    },
    {
      id: 'AL-306', sev: 'medium', type: 'External event', status: 'assigned', time: '2d ago', owner: 'SC Site Leader',
      title: 'Chennai flooding — FlexiWrap film plant at 60% output',
      detail: 'Monsoon flooding cut BOPP laminate output. Snacking and breakfast lines at Guadalajara and Łódź hold 12 days of film. EU backup converter onboarding (G4) at 71%.',
      nodes: ['S17'], mats: ['M16'], exposure: materialById('M16').var
    },
    {
      id: 'AL-307', sev: 'medium', type: 'Inventory depletion', status: 'open', time: '2d ago', owner: 'SC Site Leader',
      title: 'OJ concentrate cover fell to 15 days at São Paulo — below 20d safety threshold',
      detail: 'Citrus greening pressure reduced deliveries 8% this quarter. OrchardPress Orange 1L fill rate risk in EU from mid-August without expedites.',
      nodes: ['S05'], mats: ['M03'], exposure: materialById('M03').var
    },
    {
      id: 'AL-308', sev: 'medium', type: 'TTR > TTS breach', status: 'open', time: '3d ago', owner: 'Category Leader',
      title: 'HEPA filter media: 35d recovery vs 12d cover on AirPure line',
      detail: 'PureFlow Filtration runs a single certified media line in Daejeon. Localization program (G5) kicked off; until rollout the gap stays at 23 days.',
      nodes: ['S26'], mats: ['M28'], exposure: materialById('M28').var
    },
    {
      id: 'AL-309', sev: 'medium', type: 'External event', status: 'ack', time: '3d ago', owner: 'Category Leader',
      title: 'Indonesia palm oil export levy revision — landed cost +9% scenario',
      detail: 'Draft regulation would raise export levy on CPO derivatives. ArchiPalm volumes for foods and soap lines exposed; commercial hedge under evaluation.',
      nodes: ['S06'], mats: ['M04'], exposure: 11.2
    },
    {
      id: 'AL-310', sev: 'medium', type: 'Supplier risk shift', status: 'open', time: '4d ago', owner: 'Category Leader',
      title: 'Dragon Cell Tech quality score worsened to 3.3 after two lot rejections',
      detail: 'Incoming inspection at HCMC rejected two cell lots (swelling under thermal cycling). 100% screening imposed; TrimTech launch buffer consumes 6 days of cover.',
      nodes: ['S22'], mats: ['M23'], exposure: materialById('M23').var
    },
    {
      id: 'AL-311', sev: 'low', type: 'Missing data', status: 'open', time: '5d ago', owner: 'Data Steward',
      title: '214 components missing TTR · 37 missing RRE after week-27 refresh',
      detail: 'Coverage: TTR 91.1% (target 97%), RRE 98.5%. Largest gaps in Electronics & Components BOMs migrated from the legacy PLM.',
      nodes: [], mats: [], exposure: 0
    },
    {
      id: 'AL-312', sev: 'low', type: 'Mitigation overdue', status: 'snoozed', time: '6d ago', owner: 'Value Chain Leader',
      title: 'Robusta blend sign-off overdue 9 days — coffee substitution readiness',
      detail: 'Cup-profile approval for the robusta fallback blend (Kavaro) is pending with the sensory panel since 01 Jul.',
      nodes: ['S04'], mats: ['M02'], exposure: 4.1
    }
  ];

  /* ---------------- Mitigation actions ---------------- */
  const actions = [
    { id: 'ACT-118', title: 'Qualify alternate closures supplier (Thai Cap Co.)', type: 'Alternate supplier', owner: 'L. Tran', due: '2026-09-28', status: 'In progress', linked: 'AL-301', cost: 1.2, riskCut: 14.6, rrePre: 0.82, rrePost: 0.31 },
    { id: 'ACT-119', title: 'Raise closures safety stock 7d → 21d at 3 bottling plants', type: 'Inventory buffer', owner: 'P. Mehta', due: '2026-08-05', status: 'In progress', linked: 'AL-301', cost: 0.8, riskCut: 8.9, rrePre: 0.82, rrePost: 0.55 },
    { id: 'ACT-120', title: 'MCU second source qualification + firmware port', type: 'Alternate supplier', owner: 'A. Chen', due: '2026-10-26', status: 'In progress', linked: 'AL-302', cost: 2.4, riskCut: 19.8, rrePre: 0.74, rrePost: 0.28 },
    { id: 'ACT-121', title: 'Reserve 8 weeks MCU wafer capacity contractually', type: 'Contract action', owner: 'A. Chen', due: '2026-07-31', status: 'Open', linked: 'AL-302', cost: 1.6, riskCut: 11.2, rrePre: 0.74, rrePost: 0.52 },
    { id: 'ACT-122', title: 'Forward-buy 6 weeks arabica + robusta blend approval', type: 'Emergency procurement', owner: 'C. Duarte', due: '2026-07-24', status: 'In progress', linked: 'AL-303', cost: 0.9, riskCut: 7.4, rrePre: 0.38, rrePost: 0.22 },
    { id: 'ACT-123', title: 'Enzyme buffer build to 45 days cover', type: 'Inventory buffer', owner: 'M. Sørensen', due: '2026-08-30', status: 'In progress', linked: 'AL-304', cost: 1.1, riskCut: 9.6, rrePre: 0.66, rrePost: 0.34 },
    { id: 'ACT-124', title: 'EU backup film converter onboarding (Kraków)', type: 'Alternate supplier', owner: 'R. Iyer', due: '2026-08-16', status: 'In progress', linked: 'AL-306', cost: 0.7, riskCut: 6.8, rrePre: 0.49, rrePost: 0.24 },
    { id: 'ACT-125', title: 'Expedite OJ concentrate via reefer air-bridge', type: 'Re-routing', owner: 'S. Costa', due: '2026-07-18', status: 'Overdue', linked: 'AL-307', cost: 0.4, riskCut: 3.2, rrePre: 0.52, rrePost: 0.41 },
    { id: 'ACT-126', title: 'HEPA media localization feasibility (EU + NA)', type: 'Alternate supplier', owner: 'J. Park', due: '2026-11-12', status: 'Open', linked: 'AL-308', cost: 1.8, riskCut: 7.1, rrePre: 0.63, rrePost: 0.30 },
    { id: 'ACT-127', title: '100% screening + 8D with Dragon Cell Tech', type: 'Supplier improvement', owner: 'N. Vu', due: '2026-08-08', status: 'In progress', linked: 'AL-310', cost: 0.3, riskCut: 4.4, rrePre: 0.57, rrePost: 0.39 },
    { id: 'ACT-128', title: 'Palm oil commercial hedge + Malaysian alternate audit', type: 'Contract action', owner: 'C. Duarte', due: '2026-09-15', status: 'Open', linked: 'AL-309', cost: 0.5, riskCut: 5.3, rrePre: 0.44, rrePost: 0.29 },
    { id: 'ACT-129', title: 'Assign TTR data owners for 214 legacy components', type: 'Data quality', owner: 'Data Steward', due: '2026-07-31', status: 'In progress', linked: 'AL-311', cost: 0.1, riskCut: 0, rrePre: null, rrePost: null }
  ];

  /* ---------------- Agentic layer ---------------- */
  const agents = [
    {
      key: 'sensing', name: 'Network Sensing Agent', icon: 'radar', color: 1,
      role: 'Watches all ' + nodes.length + ' nodes, external feeds and thresholds continuously',
      stats: [['Signals today', 231], ['Node-matched', 42], ['Escalated', 6]]
    },
    {
      key: 'impact', name: 'Impact & VAR Agent', icon: 'target', color: 5,
      role: 'Recomputes VAR / AVAR and traces product → market impact',
      stats: [['Assessments today', 14], ['AVAR recomputed ($M)', 52.7], ['BOM traces run', 96]]
    },
    {
      key: 'inventory', name: 'TTS Watch Agent', icon: 'gauge', color: 3,
      role: 'Tracks inventory cover vs recovery time on every component',
      stats: [['Components watched', 2412], ['TTR>TTS flags', gapMaterials], ['Cover alerts', 3]]
    },
    {
      key: 'mitigation', name: 'Mitigation Strategist Agent', icon: 'route', color: 2,
      role: 'Proposes the best action by cost, time and residual-risk trade-off',
      stats: [['Open proposals', 5], ['Accepted (30d)', 19], ['Avg AVAR cut %', 54]]
    },
    {
      key: 'workflow', name: 'Execution & Workflow Agent', icon: 'flow', color: 6,
      role: 'Turns approvals into tickets, POs, contracts and notifications',
      stats: [['Open tickets', 16], ['Completed (30d)', 88], ['Systems connected', 7]]
    },
    {
      key: 'scenario', name: 'Scenario Twin Agent', icon: 'branch', color: 8,
      role: 'Simulates node failures on the digital twin before they happen',
      stats: [['Scenarios today', 11], ['Avg runtime (s)', 1.6], ['Saved playbooks', 27]]
    }
  ];

  const feed = [
    { time: '06:51', agent: 'sensing', text: '<strong>AL-301 update:</strong> CapForm melt-line output still degraded. Closures cover recalculated <strong>7d → 6d</strong> at Pune bottling.' },
    { time: '06:44', agent: 'impact', text: 'Re-traced <strong>MCU (M22)</strong> dependency: 5 device SKUs, $70.9M VAR, $31.2M AVAR. India + US launch quarters most exposed.' },
    { time: '06:38', agent: 'mitigation', text: 'New proposal for <strong>AL-301</strong>: emergency tooling transfer to Thai Cap Co. — cost +$0.4M, closes gap 14d → 5d, RRE 0.82 → 0.44.' },
    { time: '06:22', agent: 'scenario', text: 'Ran <strong>“Brazil frost 21d”</strong> on the twin: Kavaro RTD fill-rate −18% in week 4; best plan = forward-buy + robusta blend (cost $0.9M).' },
    { time: '06:05', agent: 'workflow', text: 'Created PR <strong>PO-77412</strong> (enzyme buffer, lot 3 of 4) and notified Hamburg planner. ERP requisition confirmed.' },
    { time: '05:47', agent: 'inventory', text: '<strong>OJ concentrate</strong> cover breached safety floor: 15d against 20d threshold. Expedite ACT-125 flagged overdue.' },
    { time: '05:30', agent: 'sensing', text: 'Indonesia levy draft moved to public consultation — probability raised <strong>35% → 55%</strong> on palm-oil cost scenario.' },
    { time: '05:12', agent: 'impact', text: 'Decision memory: Nov 25 film disruption — EU converter shift cut stockout risk 61% at +6% freight. Applied to AL-306 recommendation.' },
    { time: '04:58', agent: 'workflow', text: 'Program <strong>G3</strong> (enzyme buffer) build phase 58% — on track for 22 Jul testing gate.' },
    { time: '04:41', agent: 'scenario', text: 'Saved playbook <strong>“HCMC assembly outage 14d”</strong>: 5 SKUs, $28.3M exposure; best plan = Shenzhen line rebalance + air freight ($1.1M).' }
  ];

  const recommendations = [
    {
      id: 'R-201', linked: 'AL-301', status: 'pending', agent: 'mitigation',
      title: 'Emergency tooling transfer: run 40% of closures at Thai Cap Co. for 6 weeks',
      detail: 'CapForm recovery is 21 days against 7 days of cover. Thai Cap holds compatible tooling from the 2025 trial and has 52% free capacity.',
      cost: '+$0.4M tooling & freight', riskCut: '−64% stockout risk', exposure: materialById('M14').var, approvers: 'Category Leader · Bev Value Chain Leader'
    },
    {
      id: 'R-202', linked: 'AL-302', status: 'pending', agent: 'mitigation',
      title: 'Air-freight 6 weeks of MCU demand + rebalance safety stock to HCMC',
      detail: 'Covers the assembly gap while second-source qualification (G2) matures. Protects AirPure launch quarter first.',
      cost: '+$0.9M freight', riskCut: '−51% line-stop risk', exposure: materialById('M22').var, approvers: 'Devices Value Chain Leader · Logistics Director'
    },
    {
      id: 'R-203', linked: 'AL-303', status: 'pending', agent: 'mitigation',
      title: 'Forward-buy 6 weeks arabica before frost window closes',
      detail: 'Frost probability 46% and rising. Locking green coffee now costs +2.1% vs spot but caps the downside on both Kavaro SKUs.',
      cost: '+$0.9M inventory', riskCut: '−58% supply risk', exposure: 18.4, approvers: 'Category Leader'
    },
    {
      id: 'R-204', linked: 'AL-307', status: 'pending', agent: 'mitigation',
      title: 'Activate reefer air-bridge for OJ concentrate (2 rotations)',
      detail: 'Cover is 15 days and falling. Two air rotations restore 9 days of cover while sea expedites catch up.',
      cost: '+$0.4M freight', riskCut: '−44% fill-rate risk', exposure: materialById('M03').var, approvers: 'SC Site Leader São Paulo'
    },
    {
      id: 'R-205', linked: 'AL-305', status: 'pending', agent: 'mitigation',
      title: 'Gate AirPure channel expansion until HEPA + MCU cover reaches 21 days',
      detail: 'Growth of +26% is consuming component buffers faster than qualification closes gaps. A 6-week gate keeps RI above 60.',
      cost: 'Deferred revenue ~$3.5M', riskCut: '−37% launch risk', exposure: 24.6, approvers: 'Devices Value Chain Leader · CFO delegate'
    }
  ];

  const notifications = [
    { sev: 'critical', time: '06:51', text: '<strong>AL-301</strong> — closures cover down to <strong>6 days</strong> at Pune. Tooling-transfer proposal R-201 awaiting approval.' },
    { sev: 'critical', time: '06:44', text: '<strong>MCU single source</strong>: $31.2M AVAR recomputed across 5 device SKUs. Second-source program 22% complete.' },
    { sev: 'high', time: '06:22', text: 'Scenario Twin: <strong>Brazil frost 21d</strong> would cut Kavaro RTD fill rate −18% by week 4.' },
    { sev: 'high', time: '05:47', text: '<strong>OJ concentrate</strong> inventory breached safety floor (15d &lt; 20d). Expedite ACT-125 is overdue.' },
    { sev: 'medium', time: '05:30', text: 'Indonesia export-levy probability raised to <strong>55%</strong> — palm-oil landed cost scenario refreshed.' },
    { sev: 'medium', time: 'Yesterday', text: 'Weekly resilience recalc complete — enterprise RI <strong>' + enterpriseRI + '%</strong>, 12 TTR&gt;TTS components open.' }
  ];

  /* ---------------- Data quality ---------------- */
  const dataQuality = {
    componentsTotal: 2412,
    missingTTR: 214, missingTTS: 0, missingRRE: 37,
    domains: [
      { name: 'BOM / recipe coverage', pct: 98.2 },
      { name: 'Supplier master', pct: 96.4 },
      { name: 'Demand & forecast', pct: 95.1 },
      { name: 'Inventory positions', pct: 93.8 },
      { name: 'TTS inputs', pct: 91.2 },
      { name: 'External risk feeds', pct: 88.9 },
      { name: 'RRE assessments', pct: 84.6 },
      { name: 'TTR assessments', pct: 78.4 }
    ],
    bySector: [
      { sector: 'Beverages', ttr: 88, tts: 96, rre: 91 },
      { sector: 'Foods & Snacks', ttr: 84, tts: 94, rre: 88 },
      { sector: 'Home & Personal Care', ttr: 81, tts: 92, rre: 86 },
      { sector: 'Appliances & Devices', ttr: 61, tts: 82, rre: 72 }
    ],
    worklist: [
      { item: 'M22 · MCU sub-components (44 parts)', gap: 'TTR missing', owner: 'A. Chen', sector: 'Appliances & Devices', due: '2026-07-24' },
      { item: 'M26 · PCBA second-level BOM (61 parts)', gap: 'TTR missing', owner: 'A. Chen', sector: 'Appliances & Devices', due: '2026-07-31' },
      { item: 'M23 · Cell pack assemblies (28 parts)', gap: 'TTR + RRE missing', owner: 'N. Vu', sector: 'Appliances & Devices', due: '2026-08-07' },
      { item: 'M08 · Flavor sub-formulations (19 parts)', gap: 'RRE missing', owner: 'C. Duarte', sector: 'Beverages', due: '2026-07-28' },
      { item: 'M16 · Film laminate structures (12 parts)', gap: 'TTR missing', owner: 'R. Iyer', sector: 'Foods & Snacks', due: '2026-07-21' },
      { item: 'M10 · Enzyme actives (8 parts)', gap: 'RRE missing', owner: 'M. Sørensen', sector: 'Home & Personal Care', due: '2026-07-25' },
      { item: 'M28 · Filter media grades (6 parts)', gap: 'TTR missing', owner: 'J. Park', sector: 'Appliances & Devices', due: '2026-08-02' },
      { item: 'M18 · Carton board specs (5 parts)', gap: 'TTR missing', owner: 'S. Costa', sector: 'Beverages', due: '2026-07-30' }
    ],
    refreshLog: [
      { run: 'Week 28 full refresh', when: '2026-07-10 05:00 UTC', status: 'Success', rows: '2.41M rows · 9 sources' },
      { run: 'External risk feeds (daily)', when: '2026-07-10 03:00 UTC', status: 'Success', rows: '18.2K events scored' },
      { run: 'ERP inventory snapshot', when: '2026-07-09 23:00 UTC', status: 'Success', rows: '412K positions' },
      { run: 'Supplier financial ratings', when: '2026-07-08 06:00 UTC', status: 'Partial — 2 sources stale', rows: '1.9K entities' },
      { run: 'Week 27 full refresh', when: '2026-07-03 05:00 UTC', status: 'Success', rows: '2.39M rows · 9 sources' }
    ]
  };

  /* ---------------- KPI headline set ---------------- */
  const kpis = {
    totalNTS, totalVAR, totalAVAR, enterpriseRI,
    products: products.length,
    countries: markets.length,
    nodes: nodes.length,
    supplierNodes: suppliers.length,
    siteNodes: plants.length + dcs.length,
    gapProducts, gapMaterials,
    singleSourceCount, singleSourceRisky,
    highRiskNodes: nodes.filter(n => n.ri < 60).length,
    openAlerts: alerts.filter(a => a.status !== 'closed').length,
    criticalAlerts: alerts.filter(a => a.sev === 'critical' && a.status !== 'closed').length,
    openActions: actions.filter(a => a.status !== 'Completed').length,
    overdueActions: actions.filter(a => a.status === 'Overdue').length,
    mitigatedYtd,
    riDelta: +(enterpriseRI - monthly.ri[10]).toFixed(1),
    avarDelta: +(totalAVAR - monthly.avar[10]).toFixed(1),
    detectionLeadDays: 11.8
  };

  /* ---------------- Lookup helpers ---------------- */
  const supplierById = id => suppliers.find(s => s.id === id);
  const productById = id => products.find(p => p.id === id);
  const plantById = id => plants.find(p => p.id === id);
  const dcById = id => dcs.find(d => d.id === id);
  const nodeById = id => nodes.find(n => n.id === id);
  const marketById = id => markets.find(m => m.id === id);
  const alertById = id => alerts.find(a => a.id === id);
  const materialsOf = sid => materials.filter(m => m.suppliers.includes(sid));
  const productsUsing = mid => products.filter(p => p.materials.includes(mid));
  const productsOf = sid => {
    const mats = materialsOf(sid).map(m => m.id);
    return products.filter(p => p.materials.some(m => mats.includes(m)));
  };
  /** Node Overview drill: every node touching a product, with attributed exposure. */
  const nodeExposureFor = pid => {
    const p = products.find(x => x.id === pid);
    if (!p) return [];
    const rows = [];
    const bySup = {};
    p.materials.map(materialById).forEach(m => {
      const share = p.nts / m.depNTS;
      m.suppliers.forEach(sid => {
        bySup[sid] = bySup[sid] || { avar: 0, var: 0, salesFactor: 0 };
        bySup[sid].avar += m.avar * share / m.suppliers.length;
        bySup[sid].var += m.var * share / m.suppliers.length;
        bySup[sid].salesFactor = Math.max(bySup[sid].salesFactor, m.singleSource ? 1 : 0.55);
      });
    });
    Object.keys(bySup).forEach(sid => {
      const s = supplierById(sid);
      rows.push({
        id: s.id, name: s.name, type: 'Supplier', sub: s.city + ', ' + s.country,
        sales: +(p.nts * bySup[sid].salesFactor).toFixed(1),
        avar: +bySup[sid].avar.toFixed(2), var: +bySup[sid].var.toFixed(2), ri: s.ri
      });
    });
    p.plants.forEach(id => {
      const pt = plantById(id);
      rows.push({
        id, name: pt.name, type: 'Plant', sub: pt.focus,
        sales: +(p.nts / p.plants.length).toFixed(1),
        avar: +(p.avar / p.plants.length).toFixed(2),
        var: +(p.var / p.plants.length).toFixed(2), ri: pt.ri
      });
    });
    p.dcs.forEach(id => {
      const d = dcById(id);
      rows.push({
        id, name: d.name, type: 'DC', sub: d.region + ' distribution',
        sales: +(p.nts / p.dcs.length).toFixed(1),
        avar: +(d.avar * (p.nts / d.nts) / p.dcs.length * 2).toFixed(2),
        var: +(d.var * (p.nts / d.nts) / p.dcs.length * 2).toFixed(2), ri: d.ri
      });
    });
    return rows;
  };

  SCR.data = {
    asOf, company,
    sectors, sectorName, categories, catName,
    markets, plants, dcs, suppliers, materials, products, nodes,
    monthly, avarBridge, funnel, gantt,
    alerts, actions, agents, feed, recommendations, notifications,
    dataQuality, kpis,
    supplierById, materialById, productById, plantById, dcById, nodeById, marketById, alertById,
    materialsOf, productsUsing, productsOf, nodeExposureFor
  };
})();
