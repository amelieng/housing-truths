import { useState, useEffect, useRef } from 'react';
import { householdIncomeBySize, householdSizeOptions } from '../data/household_income_by_size';

// ── Data ──────────────────────────────────────────────────────
const RAW = [
  { year: 2005, price: 385000, income: 44500, rate: 5.87 },
  { year: 2009, price: 375000, income: 49900, rate: 5.04 },
  { year: 2012, price: 391333, income: 53400, rate: 3.66 },
  { year: 2015, price: 519500, income: 59400, rate: 3.85 },
  { year: 2019, price: 670917, income: 71834, rate: 3.94 },
  { year: 2021, price: 728583, income: 76000, rate: 2.96 },
  { year: 2022, price: 760417, income: 80300, rate: 5.34 },
  { year: 2023, price: 786083, income: 94755, rate: 6.81 },
  { year: 2024, price: 809333, income: 97344, rate: 6.72 },
];

const NOTES = {
  2005: "Despite lower prices, rates near 6% meant a mortgage consumed 49% of the median monthly income — nearly double the 28% affordability threshold.",
  2009: "A post-crash dip in prices plus falling rates offered brief relief. Mortgage burden dropped to 39% of income — still well above affordable, but the lightest it had been in years.",
  2012: "The last near-affordable moment in Boston. Record-low rates (3.7%) pushed the mortgage burden to just 32% of income — 4 points above the limit. A median household was nearly able to qualify.",
  2015: "Prices surged $128K in three years as Boston's recovery accelerated. Even with rates still low, the mortgage burden climbed back to 39% of income.",
  2019: "Prices had risen 66% since 2009, but sub-4% rates kept monthly payments from exploding. Still, a household needed to spend 43% of income on a mortgage.",
  2021: "Pandemic-era rates under 3% opened a brief window. Despite rising prices, monthly payments stayed similar to 2019 — the last gasp of relative affordability.",
  2022: "The break point. Rates doubled from 3% to 5.3% in one year. The monthly mortgage jumped nearly $950 overnight. Over half of income, in one payment.",
  2023: "Rates peaked near 7%. A Boston household would need to earn $176K — nearly double the median — just to qualify for the median-priced home.",
  2024: "Rates remain near 7%. The affordability gap stands at $82K. You'd need to earn nearly double the median income to qualify for a median Boston home.",
};

// ── OEWS Occupation wage data — Boston MSA, annual median ─────
// Source: BLS OEWS; ~ = interpolated from adjacent years
const OCCUPATIONS_DATA = {
  median: {
    label: 'Average Bostonian',
    short: 'an average Bostonian',
    tier:  'median',
    wages: { 2005:44500, 2009:49900, 2012:53400, 2015:59400, 2019:71834, 2021:76000, 2022:80300, 2023:94755, 2024:97344 },
  },
  home_health: {
    label: 'Home health aide',
    short: 'a Boston home health aide',
    tier:  'red',
    wages: { 2005:23440, 2009:25940, 2012:26130, 2015:28160, 2019:31330, 2021:36300, 2022:34100, 2023:37450, 2024:38500 },
  },
  childcare: {
    label: 'Childcare worker',
    short: 'a Boston childcare worker',
    tier:  'red',
    wages: { 2005:21020, 2009:23370, 2012:25080, 2015:25040, 2019:29520, 2021:31130, 2022:38720, 2023:39110, 2024:40000 },
  },
  restaurant: {
    label: 'Restaurant worker',
    short: 'a Boston restaurant worker',
    tier:  'red',
    wages: { 2005:17210, 2009:18950, 2012:19340, 2015:19800, 2019:26210, 2021:30390, 2022:33820, 2023:35230, 2024:36000 },
  },
  teacher: {
    label: 'Elementary teacher',
    short: 'a Boston elementary school teacher',
    tier:  'yellow',
    wages: { 2005:54360, 2009:62620, 2012:66020, 2015:70880, 2019:81990, 2021:80200, 2022:80820, 2023:83950, 2024:85000 },
  },
  transit: {
    label: 'Transit driver',
    short: 'a Boston transit driver',
    tier:  'yellow',
    wages: { 2005:28880, 2009:33500, 2012:34930, 2015:46290, 2019:49290, 2021:62900, 2022:53070, 2023:62510, 2024:63500 },
  },
  firefighter: {
    label: 'Firefighter',
    short: 'a Boston firefighter',
    tier:  'yellow',
    wages: { 2005:45930, 2009:50490, 2012:54610, 2015:59930, 2019:62490, 2021:62010, 2022:64510, 2023:75040, 2024:76500 },
  },
  nurse: {
    label: 'Registered nurse',
    short: 'a Boston registered nurse',
    tier:  'yellow',
    wages: { 2005:66590, 2009:80470, 2012:80850, 2015:86390, 2019:90480, 2021:95430, 2022:99750, 2023:100360, 2024:102000 },
  },
  software_dev: {
    label: 'Software developer',
    short: 'a Boston software developer',
    tier:  'green',
    wages: { 2005:86420, 2009:100610, 2012:97210, 2015:106130, 2019:117257, 2021:129180, 2022:133540, 2023:139090, 2024:142000 },
  },
};

const HOUSE_COLORS = {
  roof:    '#E05A2B',   // warm terracotta orange
  body:    '#F2E6C8',   // warm cream
  gable:   '#E8C87A',   // soft golden yellow accent strip
  door:    '#5C3D2E',   // deep brown
  win:     '#89B4D4',   // realistic sky blue window glass
  winFrame:'#5C3D2E',   // window frame dark
  chimney: '#9B5E3A',   // warm sienna chimney
  step:    '#C8A882',   // stone step
};

// ── Mortgage payment calculation ──────────────────────────────
// 20% down, 30-year fixed, standard amortization formula
function calcMtg(price, annualRate) {
  const p = price * 0.80;
  const r = annualRate / 100 / 12;
  const n = 360;
  return p * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}

// ── Landmark years (median baseline pct, precomputed) ─────────
const _LANDMARK_PCTS = RAW.map(d => ({ year: d.year, pct: calcMtg(d.price, d.rate) / (d.income / 12) }));
const MOST_AFFORDABLE_YEAR  = _LANDMARK_PCTS.reduce((a, b) => a.pct < b.pct ? a : b).year;
const LEAST_AFFORDABLE_YEAR = _LANDMARK_PCTS.reduce((a, b) => a.pct > b.pct ? a : b).year;

// ── House animation helpers ────────────────────────────────────
function houseScale(pct) {
  const t = Math.min(1, Math.max(0, (pct - 0.28) / (0.55 - 0.28)));
  return 1.0 - t * 0.78;
}
function lerp(a, b, t) { return a + (b - a) * t; }
function easeInOut(t) { return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; }

// ── Component ─────────────────────────────────────────────────
export default function AffordabilityChart() {
  const [selectedYear, setSelectedYear] = useState(2024);
  const [sidebarOpen, setSidebarOpen]   = useState(false);

  const selectedIndex = RAW.findIndex(d => d.year === selectedYear);
  const fillPct       = `${(selectedIndex / (RAW.length - 1)) * 100}%`;
  const atFirst       = selectedIndex === 0;
  const atLast        = selectedIndex === RAW.length - 1;

  function goEarlier() {
    if (!atFirst) setSelectedYear(RAW[selectedIndex - 1].year);
  }
  function goLater() {
    if (!atLast)  setSelectedYear(RAW[selectedIndex + 1].year);
  }

  const [selectedOccupation, setSelectedOccupation] = useState('median');
  const [selectedHHSize, setSelectedHHSize]         = useState(null);

  // ── Tooltip state ─────────────────────────────────────────────
  const [tooltip, setTooltip]       = useState(null);
  const [hoveredBar, setHoveredBar] = useState(null);
  const barRowRef   = useRef(null);
  const barOuterRef = useRef(null);
  const [isFinePointer] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia('(pointer: fine)').matches
  );

  // ── House animation ──────────────────────────────────────────
  const animFrameRef    = useRef(null);
  const currentScaleRef = useRef(null);  // null = not yet initialized
  const [animatedScale, setAnimatedScale] = useState(null);

  useEffect(() => {
    const ry = RAW.find(d => d.year === selectedYear);
    let inc_, price_;
    if (selectedHHSize) {
      const hhRow = householdIncomeBySize.find(d => d.year === selectedYear);
      const hhOpt = householdSizeOptions.find(o => o.id === selectedHHSize);
      inc_   = hhRow?.[selectedHHSize] ?? OCCUPATIONS_DATA.median.wages[selectedYear];
      price_ = hhOpt?.targetHomePrice ?? ry.price;
    } else {
      const occ_ = OCCUPATIONS_DATA[selectedOccupation];
      inc_   = occ_.wages[selectedYear] ?? OCCUPATIONS_DATA.median.wages[selectedYear];
      price_ = ry.price;
    }
    const target = houseScale(calcMtg(price_, ry.rate) / (inc_ / 12));

    if (currentScaleRef.current === null) {
      currentScaleRef.current = target;
      setAnimatedScale(target);
      return;
    }
    const from = currentScaleRef.current;
    if (Math.abs(target - from) < 0.001) return;
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    const start = performance.now();
    const DURATION = 500;
    function tick(now) {
      const t   = Math.min(1, (now - start) / DURATION);
      const val = lerp(from, target, easeInOut(t));
      currentScaleRef.current = val;
      setAnimatedScale(val);
      if (t < 1) animFrameRef.current = requestAnimationFrame(tick);
      else currentScaleRef.current = target;
    }
    animFrameRef.current = requestAnimationFrame(tick);
    return () => { if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current); };
  }, [selectedYear, selectedOccupation, selectedHHSize]);

  // ── Click-outside to dismiss tooltip (mobile) ─────────────────
  useEffect(() => {
    if (!tooltip) return;
    function handleOutside(e) {
      if (barRowRef.current && !barRowRef.current.contains(e.target)) {
        setTooltip(null);
      }
    }
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('touchstart', handleOutside);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('touchstart', handleOutside);
    };
  }, [tooltip]);

  // ── Derived values for current year + occupation ──────────────
  const BAR_SCALE = 16000;
  const BAR_PX    = 620;
  function fmt(v) { return '$' + Math.round(v).toLocaleString(); }

  const rawYear   = RAW.find(d => d.year === selectedYear);
  const occ       = OCCUPATIONS_DATA[selectedOccupation];
  const hhRow     = householdIncomeBySize.find(d => d.year === selectedYear);
  const income    = selectedHHSize
    ? (hhRow?.[selectedHHSize] ?? OCCUPATIONS_DATA.median.wages[selectedYear])
    : (occ.wages[selectedYear] ?? OCCUPATIONS_DATA.median.wages[selectedYear]);
  // Hhsize-aware display labels (used in stage header and bar label)
  const hhLens      = selectedHHSize !== null;
  const hhSizeOpt   = hhLens ? householdSizeOptions.find(o => o.id === selectedHHSize) : null;
  const stageLabel  = hhLens ? (hhSizeOpt?.label ?? '') : occ.label;
  const stageShort  = hhLens ? (hhSizeOpt?.label.toLowerCase() + ' household') : occ.short;
  const stageTier   = hhLens ? 'median' : occ.tier;
  // When hhsize lens is active, use the size-appropriate target home price instead of
  // the year's median. Both income and price update together on lens switch.
  const activePrice = hhLens ? (hhSizeOpt?.targetHomePrice ?? rawYear.price) : rawYear.price;
  const mo_inc    = income / 12;
  const mo_mtg    = calcMtg(activePrice, rawYear.rate);
  const afford    = mo_inc * 0.28;
  const pct       = mo_mtg / mo_inc;
  const over      = mo_mtg > afford;
  const leftover  = mo_inc - mo_mtg;
  const needed_mo = mo_mtg / 0.28;
  const needed_yr = needed_mo * 12;
  const gap_mo    = Math.max(0, needed_mo - mo_inc);

  const iW      = (mo_inc / BAR_SCALE * BAR_PX).toFixed(1);
  const extW    = (gap_mo / BAR_SCALE * BAR_PX).toFixed(1);
  const hasExt  = gap_mo > 0;
  const mtgPct  = (pct * 100).toFixed(2);
  const redW    = over ? (parseFloat(mtgPct) - 28).toFixed(2) : 0;
  const extLong = gap_mo / BAR_SCALE > 0.20;
  const extMultiplier = (needed_mo / mo_inc).toFixed(1);
  const extOccLabel   = hhLens
    ? (hhSizeOpt?.label.toLowerCase() ?? '') + ' income'
    : selectedOccupation === 'median' ? 'median income' : occ.label.toLowerCase() + ' salary';
  const extLabelText  = extLong
    ? `${extMultiplier}× ${extOccLabel} needed · +${fmt(gap_mo)}/mo`
    : `+${fmt(gap_mo)}/mo`;
  const gap_yr_rounded = over ? Math.round(gap_mo * 12 / 1000) * 1000 : 0;

  function openTooltip(which, anchorEl) {
    const elRect       = anchorEl.getBoundingClientRect();
    const containerRect = barRowRef.current.getBoundingClientRect();
    const centerX = elRect.left + elRect.width / 2 - containerRect.left;
    const flip    = elRect.top < 100;
    setTooltip({ which, x: centerX, flip });
  }

  // Stage header
  const TIER_COLORS = { median: '#6B6560', red: '#8B4A4A', yellow: '#8a5c0a', green: '#2d6b2d' };
  const pctVal  = Math.round(pct * 100);
  const headline = over
    ? `In ${selectedYear}, ${occ.short} would spend ${pctVal}% of monthly income on a mortgage — ${fmt(mo_mtg - afford)}/month above the affordability limit.`
    : `In ${selectedYear}, ${occ.short} would spend ${pctVal}% of monthly income on a mortgage — within reach of the 28% affordability threshold.`;
  const note = (!hhLens && selectedOccupation === 'median') ? (NOTES[selectedYear] || '') : '';

  // Pill active styles keyed by tier
  const PILL_ACTIVE = {
    median: { background: 'rgba(59,107,138,0.10)',  border: '1px solid rgba(59,107,138,0.35)',  color: '#3B6B8A' },
    red:    { background: 'rgba(139,74,74,0.10)',   border: '1px solid rgba(139,74,74,0.35)',   color: '#8B4A4A' },
    yellow: { background: 'rgba(180,120,40,0.10)',  border: '1px solid rgba(180,120,40,0.38)',  color: '#8a5c0a' },
    green:  { background: 'rgba(60,110,60,0.10)',   border: '1px solid rgba(60,110,60,0.35)',   color: '#2d6b2d' },
  };
  // Base pill style shared by both occupation and household-size pills
  const pillBase = {
    fontFamily: "'Lato', sans-serif", fontSize: '10px', padding: '5px 8px',
    borderRadius: '5px', border: '1px solid transparent', color: '#6B6560',
    background: 'transparent', cursor: 'pointer', textAlign: 'left',
    width: '100%', display: 'flex', alignItems: 'center', gap: '5px',
  };
  // Occupation pills — all inactive when the household-size lens is active
  function pillStyle(key) {
    if (hhLens) return pillBase;
    const tier = OCCUPATIONS_DATA[key].tier;
    return selectedOccupation === key
      ? { ...pillBase, ...PILL_ACTIVE[tier] }
      : pillBase;
  }
  // Household-size pills
  function hhSizePillStyle(id) {
    return selectedHHSize === id
      ? { ...pillBase, ...PILL_ACTIVE.median }
      : pillBase;
  }

  // ── House geometry (from animatedScale) ───────────────────────
  const sc      = animatedScale ?? houseScale(pct);
  const hW      = 160 * sc;
  const hH      = 138 * sc;
  const roofH   = hH * 0.36;
  const bodyH   = hH * 0.64;
  const hMidX   = hW / 2;
  const hBaseY  = 150 + (1 - sc) * 50;
  const hTopY   = hBaseY - hH;
  const hLeft   = 240 - hMidX;
  const hBlur   = (1 - sc) * 3.5;
  // Path trapezoid
  const ptL      = 240 - hW * 0.26, ptR = 240 + hW * 0.26;
  const pPathBlur = (1 - sc) * 1.5;
  const pFarOp   = (1 - sc) * 0.17, pNearOp = (1 - sc) * 0.833;
  // Chimney (local coords)
  const chX = hMidX + hW * 0.121, chY = -roofH * 0.305, chW = hW * 0.1, chH = hH * 0.365;
  // Gable
  const gableH = bodyH * 0.14;
  // Roof polygon
  const roofPts = `${hMidX.toFixed(1)},-2 ${(hW * 1.05).toFixed(1)},${(roofH + 2).toFixed(1)} ${(-hW * 0.05).toFixed(1)},${(roofH + 2).toFixed(1)}`;
  // Ridge
  const ridgeX1 = hMidX - hW * 0.12, ridgeX2 = hMidX + hW * 0.12;
  const ridgeY = roofH * 0.18, ridgeSW = sc * 1.5;
  // Door
  const dX = hMidX - hW * 0.1, dY = roofH + bodyH * 0.6, dW = hW * 0.2, dH = bodyH * 0.4;
  // Windows
  const winY = roofH + bodyH * 0.244, winW2 = hW * 0.17, winH2 = bodyH * 0.293;
  const winLX = hW * 0.095, winRX = hW - hW * 0.095 - winW2;
  const winMX = winW2 / 2, winMY = winH2 / 2, winSW = sc * 1.4;
  // Step
  const stH = hH * 0.04, stY = roofH + bodyH - hH * 0.025, stW = hW * 0.3, stX = hMidX - stW / 2;

  // ── Inline styles ────────────────────────────────────────────
  const S = {
    page: {
      maxWidth: '1160px',
      margin: '0 auto',
      padding: '64px 48px 96px',
      fontFamily: "'Lato', sans-serif",
      background: '#F7F6F3',
      color: '#1C1916',
      WebkitFontSmoothing: 'antialiased',
    },
    h1: {
      fontFamily: "'Oswald', sans-serif",
      fontSize: '36px',
      fontWeight: 400,
      letterSpacing: '-0.4px',
      lineHeight: 1.15,
      color: '#1C1916',
      marginBottom: '12px',
    },
    h1Em: {
      fontStyle: 'italic',
      color: '#8B4A4A',
    },
    lead: {
      fontSize: '15px',
      color: '#6B6560',
      lineHeight: 1.75,
      marginBottom: '12px',
    },
    contextNote: {
      fontFamily: "'Lato', sans-serif",
      fontSize: '11px',
      color: '#A09C97',
      lineHeight: 1.65,
      marginBottom: '28px',
      paddingLeft: '10px',
      borderLeft: '2px solid rgba(59,107,138,0.30)',
    },
    inlineLegend: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '14px',
      marginBottom: '4px',
      paddingBottom: '12px',
      borderBottom: '1px solid #E2DDD6',
    },
    ilItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      fontFamily: "'Lato', sans-serif",
      fontSize: '9px',
      color: '#A09C97',
      whiteSpace: 'nowrap',
    },
    ilSwatchBase: {
      width: '20px',
      height: '10px',
      borderRadius: '2px',
      flexShrink: 0,
    },
    miniStats: {
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      marginTop: '16px',
      paddingTop: '16px',
      borderTop: '1px solid #E2DDD6',
    },
    msFirst: {
      paddingRight: '16px',
    },
    msRest: {
      paddingLeft: '16px',
      paddingRight: '16px',
      borderLeft: '1px solid #E2DDD6',
    },
    msLbl: {
      fontFamily: "'Lato', sans-serif",
      fontSize: '9px',
      textTransform: 'uppercase',
      letterSpacing: '0.07em',
      color: '#A09C97',
      marginBottom: '3px',
      lineHeight: 1.3,
    },
    msVal: {
      fontSize: '18px',
      fontWeight: 400,
      color: '#1C1916',
      lineHeight: 1.1,
    },
    msValRed: {
      fontSize: '18px',
      fontWeight: 500,
      color: '#8B4A4A',
      lineHeight: 1.1,
    },
    msDelta: {
      fontFamily: "'Lato', sans-serif",
      fontSize: '10px',
      marginTop: '3px',
      display: 'flex',
      alignItems: 'center',
      gap: '2px',
      color: '#A09C97',
    },
    sourceRow: {
      paddingTop: '16px',
      borderTop: '1px solid #E2DDD6',
    },
    sourceText: {
      fontSize: '11px',
      color: '#A09C97',
      fontFamily: "'Lato', sans-serif",
      lineHeight: 1.7,
    },
    sourceSpan: {
      color: '#6B6560',
    },
    // ── House scene ──
    houseScene: {
      display: 'flex',
      justifyContent: 'center',
      margin: '28px 0 24px',
    },
    // ── Bar section ──
    barSection: {
      marginTop: '8px',
      width: '620px',
      overflow: 'visible',
    },
    barRow: {
      display: 'flex',
      alignItems: 'stretch',
      height: '24px',
      marginBottom: '8px',
      marginTop: '20px',
      position: 'relative',
      overflow: 'visible',
    },
    barOuter: {
      height: '24px',
      borderRadius: '3px 0 0 3px',
      background: '#EDE9E3',
      border: '1px solid #E2DDD6',
      borderRight: '2px solid #6B6560',
      position: 'relative',
      flexShrink: 0,
      overflow: 'visible',
    },
    barStripe: {
      position: 'absolute',
      top: 0, left: 0, bottom: 0,
      borderRadius: '3px 0 0 3px',
      background: 'repeating-linear-gradient(-45deg, rgba(59,107,138,0.18) 0px, rgba(59,107,138,0.18) 2px, transparent 2px, transparent 5px)',
      borderRight: '1.5px dashed rgba(59,107,138,0.45)',
    },
    barRed: {
      position: 'absolute',
      top: 0, bottom: 0,
      background: 'rgba(139,74,74,0.18)',
    },
    barMtg: {
      position: 'absolute',
      top: '-4px', bottom: '-4px',
      width: '2px',
      background: 'rgba(139,74,74,0.70)',
      borderRadius: '1px',
    },
    barExtension: {
      height: '24px',
      background: 'rgba(180,120,40,0.12)',
      border: '1.5px dashed rgba(180,120,40,0.55)',
      borderLeft: 'none',
      borderRadius: '0 3px 3px 0',
      position: 'relative',
      flexShrink: 0,
      overflow: 'visible',
    },
    extLabelAbove: {
      position: 'absolute',
      bottom: 'calc(100% + 5px)',
      left: 0,
      fontFamily: "'Lato', sans-serif",
      fontSize: '9px',
      color: 'rgba(160,100,20,0.80)',
      whiteSpace: 'nowrap',
      pointerEvents: 'none',
    },
    barAnnRow: {
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      width: '620px',
      marginTop: '6px',
      fontFamily: "'Lato', sans-serif",
      fontSize: '9px',
      color: '#A09C97',
    },
    annIncome: {
      whiteSpace: 'nowrap',
      lineHeight: 1.4,
      color: '#6B6560',
    },
    annAfford: {
      whiteSpace: 'nowrap',
      lineHeight: 1.4,
      color: 'rgba(59,107,138,0.75)',
    },
    annOver: {
      whiteSpace: 'nowrap',
      lineHeight: 1.4,
      color: '#8B4A4A',
    },
    annMortgage: {
      whiteSpace: 'nowrap',
      lineHeight: 1.4,
      color: '#A09C97',
      textAlign: 'right',
    },
    // ── Stage card ──
    stage: {
      background: '#FFFFFF',
      border: '1px solid #E2DDD6',
      borderRadius: '10px',
      marginBottom: '16px',
      position: 'relative',
      overflow: 'visible',
    },
    stageLayout: {
      display: 'grid',
      gridTemplateColumns: '28px 1fr',
      minHeight: '480px',
    },
    stageMain: {
      padding: '36px 40px 32px',
    },
    // ── Sidebar ──
    stageSidebar: {
      borderRight: '1px solid #E2DDD6',
      background: '#FAFAF8',
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
    },
    sidebarTab: {
      position: 'absolute',
      inset: 0,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '10px',
      cursor: 'pointer',
      zIndex: 2,
    },
    tabChevron: {
      fontSize: '11px',
      color: '#A09C97',
      lineHeight: 1,
    },
    tabLabel: {
      fontFamily: "'Lato', sans-serif",
      fontSize: '9px',
      letterSpacing: '0.12em',
      textTransform: 'uppercase',
      color: '#A09C97',
      writingMode: 'vertical-rl',
      textOrientation: 'mixed',
      transform: 'rotate(180deg)',
      whiteSpace: 'nowrap',
      lineHeight: 1,
    },
    sidebarPanel: {
      position: 'absolute',
      inset: 0,
      padding: '26px 14px 24px',
      display: 'flex',
      flexDirection: 'column',
      opacity: 0,
      pointerEvents: 'none',
      overflow: 'hidden',
    },
    sidebarHeader: {
      marginBottom: '12px',
    },
    sidebarLabel: {
      fontFamily: "'Lato', sans-serif",
      fontSize: '9px',
      textTransform: 'uppercase',
      letterSpacing: '0.1em',
      color: '#A09C97',
      whiteSpace: 'nowrap',
    },
    sidebarPills: {
      display: 'flex',
      flexDirection: 'column',
      gap: '2px',
      flex: 1,
      overflowY: 'auto',
    },
    sidebarEyebrow: {
      fontFamily: "'DM Mono', monospace",
      fontSize: '8px',
      letterSpacing: '0.1em',
      textTransform: 'uppercase',
      color: '#A09C97',
      marginTop: '6px',
      marginBottom: '2px',
      whiteSpace: 'nowrap',
      flexShrink: 0,
    },
    sidebarDivider: {
      height: '1px',
      background: '#E2DDD6',
      margin: '5px 0',
      flexShrink: 0,
    },
    occPillBase: {
      fontFamily: "'Lato', sans-serif",
      fontSize: '10px',
      padding: '5px 8px',
      borderRadius: '5px',
      border: '1px solid transparent',
      color: '#6B6560',
      background: 'transparent',
      cursor: 'pointer',
      textAlign: 'left',
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      gap: '5px',
    },
    occPillActiveMedian: {
      fontFamily: "'Lato', sans-serif",
      fontSize: '10px',
      padding: '5px 8px',
      borderRadius: '5px',
      border: '1px solid rgba(59,107,138,0.35)',
      color: '#3B6B8A',
      background: 'rgba(59,107,138,0.10)',
      cursor: 'pointer',
      textAlign: 'left',
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      gap: '5px',
    },
    pillDot: {
      width: '5px',
      height: '5px',
      borderRadius: '50%',
      flexShrink: 0,
    },
    sidebarFooter: {
      paddingTop: '10px',
      display: 'flex',
      justifyContent: 'center',
      borderTop: '1px solid #E2DDD6',
      marginTop: '6px',
      flexShrink: 0,
    },
    sidebarCollapse: {
      background: 'none',
      border: '1px solid #E2DDD6',
      cursor: 'pointer',
      fontFamily: "'Lato', sans-serif",
      fontSize: '9px',
      letterSpacing: '0.05em',
      color: '#6B6560',
      padding: '5px 10px',
      borderRadius: '4px',
      lineHeight: 1,
      display: 'flex',
      alignItems: 'center',
      gap: '5px',
      whiteSpace: 'nowrap',
    },
    // ── Timeline ──
    timelineWrap: {
      borderTop: '1px solid #E2DDD6',
      padding: '24px 40px 28px',
      background: '#FAFAF8',
      overflow: 'visible',
    },
    timelineLabel: {
      fontFamily: "'Lato', sans-serif",
      fontSize: '10px',
      letterSpacing: '0.1em',
      textTransform: 'uppercase',
      color: '#A09C97',
      marginBottom: '16px',
    },
    timelineTrack: {
      position: 'relative',
      height: '48px',
      display: 'flex',
      alignItems: 'center',
      overflow: 'visible',
      marginTop: '28px',
    },
    tlLine: {
      position: 'absolute',
      left: 0, right: 0,
      top: '50%',
      height: '1px',
      background: '#E2DDD6',
      transform: 'translateY(-50%)',
    },
    tlFill: {
      position: 'absolute',
      left: 0,
      top: '50%',
      height: '2px',
      background: '#3B6B8A',
      transform: 'translateY(-50%)',
      borderRadius: '1px',
    },
    tlDots: {
      position: 'relative',
      width: '100%',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    tlDot: {
      width: '10px',
      height: '10px',
      borderRadius: '50%',
      background: '#FFFFFF',
      border: '2px solid #E2DDD6',
      cursor: 'pointer',
      position: 'relative',
      zIndex: 2,
      flexShrink: 0,
    },
    tlDotPast: {
      width: '10px',
      height: '10px',
      borderRadius: '50%',
      background: '#3B6B8A',
      border: '2px solid #3B6B8A',
      cursor: 'pointer',
      position: 'relative',
      zIndex: 2,
      flexShrink: 0,
    },
    tlDotActive: {
      width: '10px',
      height: '10px',
      borderRadius: '50%',
      background: '#3B6B8A',
      border: '2px solid #3B6B8A',
      cursor: 'pointer',
      position: 'relative',
      zIndex: 2,
      flexShrink: 0,
      transform: 'scale(1.3)',
    },
    tlDotLabel: {
      position: 'absolute',
      top: '16px',
      left: '50%',
      transform: 'translateX(-50%)',
      fontFamily: "'Lato', sans-serif",
      fontSize: '10px',
      color: '#A09C97',
      whiteSpace: 'nowrap',
      pointerEvents: 'none',
    },
    tlDotLabelPast: {
      position: 'absolute',
      top: '16px',
      left: '50%',
      transform: 'translateX(-50%)',
      fontFamily: "'Lato', sans-serif",
      fontSize: '10px',
      color: '#3B6B8A',
      whiteSpace: 'nowrap',
      pointerEvents: 'none',
    },
    tlDotLabelActive: {
      position: 'absolute',
      top: '16px',
      left: '50%',
      transform: 'translateX(-50%)',
      fontFamily: "'Lato', sans-serif",
      fontSize: '10px',
      color: '#3B6B8A',
      fontWeight: 500,
      whiteSpace: 'nowrap',
      pointerEvents: 'none',
    },
    tlNav: {
      display: 'flex',
      justifyContent: 'center',
      gap: '12px',
      marginTop: '32px',
    },
    tlBtn: {
      fontFamily: "'Lato', sans-serif",
      fontSize: '11px',
      letterSpacing: '0.06em',
      color: '#6B6560',
      background: 'transparent',
      border: '1px solid #E2DDD6',
      borderRadius: '5px',
      padding: '7px 20px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    },
    // ── Household size price annotation ──
    priceAnnotation: {
      fontFamily: "'DM Mono', monospace",
      fontSize: '11px',
      color: '#8B6F47',
      marginTop: '3px',
      lineHeight: 1.5,
    },
    hhCallout: {
      fontFamily: "'Lato', sans-serif",
      fontSize: '13px',
      color: '#6B6460',
      lineHeight: 1.55,
      marginBottom: '6px',
      flexShrink: 0,
    },
    // ── Landmark banners ──
    landmarkBase: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '5px 10px',
      borderRadius: '4px',
      marginTop: '10px',
      fontFamily: "'Lato', sans-serif",
      fontSize: '10px',
      fontWeight: 500,
      letterSpacing: '0.05em',
      whiteSpace: 'nowrap',
      width: 'fit-content',
    },
    landmarkBest: {
      background: 'rgba(74,124,116,0.12)',
      border: '1px solid rgba(74,124,116,0.32)',
      color: '#4A7C74',
    },
    landmarkWorst: {
      background: 'rgba(139,74,74,0.10)',
      border: '1px solid rgba(139,74,74,0.28)',
      color: '#8B4A4A',
    },
  };

  return (
    <div className="affordability-chart" style={S.page}>

      {/* ── Page header ── */}
      <h2 style={{ fontFamily: "'Oswald', sans-serif", fontSize: '36px', fontWeight: 500, letterSpacing: '-0.4px', lineHeight: 1.15, color: '#1C1916', marginBottom: '12px' }}>
        The average Boston salary can no longer afford the average Boston home.
      </h2>
      <p style={{ fontFamily: "'Lato', sans-serif", fontSize: '16px', color: '#6B6460', lineHeight: 1, marginBottom: '28px' }}>
        See where you land. Select an occupation or household size below.
      </p>

      {/* ── Stage card ── */}
      <div style={S.stage}>
        <div style={{ ...S.stageLayout, gridTemplateColumns: sidebarOpen ? '156px 1fr' : '28px 1fr' }}>

          {/* ── Sidebar ── */}
          <div style={{
            ...S.stageSidebar,
            gridColumn: sidebarOpen ? '28px 1fr' : undefined,
          }}>

            {/* Collapsed tab — hidden when open */}
            <div
              style={{ ...S.sidebarTab, opacity: sidebarOpen ? 0 : 1, pointerEvents: sidebarOpen ? 'none' : 'auto' }}
              onClick={() => setSidebarOpen(true)}
            >
              <div style={S.tabChevron}>›</div>
              <div style={S.tabLabel}>What if you were a...</div>
            </div>

            {/* Expanded panel — visible when open */}
            <div style={{ ...S.sidebarPanel, opacity: sidebarOpen ? 1 : 0, pointerEvents: sidebarOpen ? 'all' : 'none' }}>
              <div style={S.sidebarHeader}>
                <div style={S.sidebarLabel}>What if you were a...</div>
              </div>
              <div style={S.sidebarPills}>
                <button style={pillStyle('median')} onClick={() => { setSelectedOccupation('median'); setSelectedHHSize(null); }}>
                  <span style={{ ...S.pillDot, background: '#3B6B8A' }} />Average Bostonian
                </button>
                <div style={S.sidebarDivider} />
                <button style={pillStyle('home_health')} onClick={() => { setSelectedOccupation('home_health'); setSelectedHHSize(null); }}>
                  <span style={{ ...S.pillDot, background: '#8B4A4A' }} />Home health aide
                </button>
                <button style={pillStyle('childcare')} onClick={() => { setSelectedOccupation('childcare'); setSelectedHHSize(null); }}>
                  <span style={{ ...S.pillDot, background: '#8B4A4A' }} />Childcare worker
                </button>
                <button style={pillStyle('restaurant')} onClick={() => { setSelectedOccupation('restaurant'); setSelectedHHSize(null); }}>
                  <span style={{ ...S.pillDot, background: '#8B4A4A' }} />Restaurant worker
                </button>
                <div style={S.sidebarDivider} />
                <button style={pillStyle('teacher')} onClick={() => { setSelectedOccupation('teacher'); setSelectedHHSize(null); }}>
                  <span style={{ ...S.pillDot, background: '#b87c20' }} />Teacher
                </button>
                <button style={pillStyle('transit')} onClick={() => { setSelectedOccupation('transit'); setSelectedHHSize(null); }}>
                  <span style={{ ...S.pillDot, background: '#b87c20' }} />Transit driver
                </button>
                <button style={pillStyle('firefighter')} onClick={() => { setSelectedOccupation('firefighter'); setSelectedHHSize(null); }}>
                  <span style={{ ...S.pillDot, background: '#b87c20' }} />Firefighter
                </button>
                <button style={pillStyle('nurse')} onClick={() => { setSelectedOccupation('nurse'); setSelectedHHSize(null); }}>
                  <span style={{ ...S.pillDot, background: '#b87c20' }} />Registered nurse
                </button>
                <div style={S.sidebarDivider} />
                <button style={pillStyle('software_dev')} onClick={() => { setSelectedOccupation('software_dev'); setSelectedHHSize(null); }}>
                  <span style={{ ...S.pillDot, background: '#3b7a3b' }} />Software developer
                </button>

                {/* ── Household size lens ── */}
                <div style={S.sidebarDivider} />
                <div style={S.sidebarEyebrow}>or by household size</div>
                <div style={S.hhCallout}>
                  Home price reflects the size of home each household would realistically need.
                  Larger homes cost more — making the affordability gap wider than it first appears.
                </div>
                {householdSizeOptions.map(opt => (
                  <button
                    key={opt.id}
                    style={hhSizePillStyle(opt.id)}
                    onClick={() => setSelectedHHSize(opt.id)}
                  >
                    <span style={{ ...S.pillDot, background: '#3B6B8A' }} />
                    {opt.label}
                  </button>
                ))}
              </div>
              <div style={S.sidebarFooter}>
                <button style={S.sidebarCollapse} onClick={() => setSidebarOpen(false)}>‹ Minimize</button>
              </div>
            </div>

          </div>{/* /stageSidebar */}

          {/* ── Stage main ── */}
          <div style={S.stageMain}>

      {/* ── Stage header ── */}
      <div style={{ marginBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '8px', flexWrap: 'wrap' }}>
          <div style={{ fontFamily: "'Oswald', sans-serif", fontSize: '36px', fontWeight: 400, letterSpacing: '-0.4px', lineHeight: 1, color: TIER_COLORS[stageTier] }}>
            {stageLabel}
          </div>
          <div style={{ fontFamily: "'Oswald', sans-serif", fontSize: '36px', fontWeight: 300, color: '#E2DDD6', lineHeight: 1 }}>·</div>
          <div style={{ fontFamily: "'Oswald', sans-serif", fontSize: '36px', fontWeight: 400, letterSpacing: '-0.4px', lineHeight: 1, color: over ? '#8B4A4A' : '#1C1916' }}>
            {selectedYear}
          </div>
        </div>
        {selectedYear === MOST_AFFORDABLE_YEAR && (
          <div style={{ ...S.landmarkBase, ...S.landmarkBest }}>
            ◆ Most affordable year on record — the last window of near-affordability.
          </div>
        )}
        {selectedYear === LEAST_AFFORDABLE_YEAR && (
          <div style={{ ...S.landmarkBase, ...S.landmarkWorst }}>
            ◆ Least affordable year on record — rates peaked, gap widest ever.
          </div>
        )}
        <div style={{ fontSize: '15px', fontWeight: 400, color: '#1C1916', lineHeight: 1.5, marginBottom: '4px', marginTop: '8px' }}>
          {over
            ? `In ${selectedYear}, ${stageShort} would spend ${pctVal}% of monthly income on a mortgage — ${fmt(mo_mtg - afford)}/month above the affordability limit.`
            : `In ${selectedYear}, ${stageShort} would spend ${pctVal}% of monthly income on a mortgage — within reach of the 28% affordability threshold.`}
        </div>
        {note && (
          <div style={{ fontSize: '13px', color: '#6B6560', lineHeight: 1.65, maxWidth: '640px' }}>
            {note}
          </div>
        )}
      </div>

      {/* ── Inline legend ── */}
      <div style={S.inlineLegend}>
        <div style={S.ilItem}>
          <div style={{ ...S.ilSwatchBase, background: '#EDE9E3', border: '1px solid #E2DDD6' }} />
          <span>Monthly income</span>
        </div>
        <div style={S.ilItem}>
          <div style={{
            ...S.ilSwatchBase,
            background: 'repeating-linear-gradient(-45deg, rgba(59,107,138,0.22) 0px, rgba(59,107,138,0.22) 2px, transparent 2px, transparent 6px)',
            border: '1px solid rgba(59,107,138,0.35)',
          }} />
          <span>28% affordability limit</span>
        </div>
        <div style={S.ilItem}>
          <div style={{ ...S.ilSwatchBase, background: 'rgba(139,74,74,0.18)', border: '1px solid rgba(139,74,74,0.4)' }} />
          <span>Mortgage over limit</span>
        </div>
        <div style={S.ilItem}>
          <div style={{ ...S.ilSwatchBase, background: 'rgba(180,120,40,0.12)', border: '1.5px dashed rgba(180,120,40,0.55)' }} />
          <span>Additional income needed</span>
        </div>
      </div>

      {/* ── House scene — animated ── */}
      <div style={S.houseScene}>
        <svg width="480" height="220" viewBox="0 0 480 220" style={{ display: 'block' }}>
          <defs>
            <linearGradient id="housePathGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#C8A882" stopOpacity={pFarOp} />
              <stop offset="100%" stopColor="#C8A882" stopOpacity={pNearOp} />
            </linearGradient>
          </defs>

          {/* Perspective trapezoid shadow */}
          <polygon
            points={`${ptL.toFixed(1)},${hBaseY.toFixed(1)} ${ptR.toFixed(1)},${hBaseY.toFixed(1)} 388,220 92,220`}
            fill="url(#housePathGrad)"
            stroke="none"
            style={{ filter: `blur(${pPathBlur.toFixed(2)}px)` }}
          />

          {/* Edge lines */}
          <line x1={ptL.toFixed(1)} y1={hBaseY.toFixed(1)} x2="92"  y2="220" stroke="#8B6B4A" strokeWidth="1.1" strokeDasharray="4 4" opacity="0.22" />
          <line x1={ptR.toFixed(1)} y1={hBaseY.toFixed(1)} x2="388" y2="220" stroke="#8B6B4A" strokeWidth="1.1" strokeDasharray="4 4" opacity="0.22" />

          {/* Centre line */}
          <line x1="240" y1={hBaseY.toFixed(1)} x2="240" y2="220" stroke="#A08060" strokeWidth="1" strokeDasharray="5 7" opacity="0.15" />

          {/* House group */}
          <g transform={`translate(${hLeft.toFixed(1)}, ${hTopY.toFixed(1)})`} style={{ filter: `blur(${hBlur.toFixed(2)}px)` }}>

            {/* Chimney */}
            <rect x={chX} y={chY} width={chW} height={chH} fill={HOUSE_COLORS.chimney} rx="2" />

            {/* Body wall */}
            <rect x="0" y={roofH} width={hW} height={bodyH} fill={HOUSE_COLORS.body} rx="2" />

            {/* Gable strip */}
            <rect x="0" y={roofH} width={hW} height={gableH} fill={HOUSE_COLORS.gable} />

            {/* Roof */}
            <polygon points={roofPts} fill={HOUSE_COLORS.roof} />

            {/* Roof ridge highlight */}
            <line x1={ridgeX1} y1={ridgeY} x2={ridgeX2} y2={ridgeY} stroke="rgba(255,255,255,0.25)" strokeWidth={ridgeSW} strokeLinecap="round" />

            {/* Door */}
            <rect x={dX} y={dY} width={dW} height={dH} fill={HOUSE_COLORS.door} rx="3" />

            {/* Window left */}
            <rect x={winLX} y={winY} width={winW2} height={winH2} fill={HOUSE_COLORS.win} rx="2" />
            {/* Window right */}
            <rect x={winRX} y={winY} width={winW2} height={winH2} fill={HOUSE_COLORS.win} rx="2" />

            {/* Window frames — left */}
            <line x1={winLX}        y1={winY + winMY} x2={winLX + winW2} y2={winY + winMY} stroke={HOUSE_COLORS.winFrame} strokeWidth={winSW} opacity="0.45" />
            <line x1={winLX + winMX} y1={winY}         x2={winLX + winMX} y2={winY + winH2} stroke={HOUSE_COLORS.winFrame} strokeWidth={winSW} opacity="0.45" />
            {/* Window frames — right */}
            <line x1={winRX}        y1={winY + winMY} x2={winRX + winW2} y2={winY + winMY} stroke={HOUSE_COLORS.winFrame} strokeWidth={winSW} opacity="0.45" />
            <line x1={winRX + winMX} y1={winY}         x2={winRX + winMX} y2={winY + winH2} stroke={HOUSE_COLORS.winFrame} strokeWidth={winSW} opacity="0.45" />

            {/* Door step */}
            <rect x={stX} y={stY} width={stW} height={stH} fill={HOUSE_COLORS.step} rx="1" />
          </g>
        </svg>
      </div>

      {/* ── Target home price (household size lens only) ── */}
      {hhLens && hhSizeOpt && (
        <div style={{ marginBottom: '8px', marginTop: '-8px' }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '13px', fontWeight: 500, color: '#1C1916', letterSpacing: '-0.2px', lineHeight: 1.2 }}>
            Target home: {fmt(activePrice)}
          </div>
          <div style={S.priceAnnotation}>
            {hhSizeOpt.bedroomContext} · {hhSizeOpt.priceNote}
          </div>
        </div>
      )}

      {/* ── Income bar ── */}
      <div style={S.barSection}>

        {/* barRow is position:relative — tooltip is absolute inside it */}
        <div ref={barRowRef} style={S.barRow}>

          {/* ── Tooltip ── */}
          {tooltip && (() => {
            const TW = 220;
            const containerW = barRowRef.current
              ? barRowRef.current.getBoundingClientRect().width
              : BAR_PX;
            const rawLeft = tooltip.x - TW / 2;
            const leftPx  = Math.max(0, Math.min(rawLeft, containerW - TW));
            const caretLeft = Math.max(10, Math.min(tooltip.x - leftPx, TW - 16));
            return (
              <div style={{
                position: 'absolute',
                left: `${leftPx}px`,
                ...(tooltip.flip
                  ? { top: 'calc(100% + 8px)' }
                  : { bottom: 'calc(100% + 8px)' }),
                width: `${TW}px`,
                background: '#1C1916',
                color: '#F7F6F3',
                fontFamily: "'Lato', sans-serif",
                fontSize: '14px',
                lineHeight: 1.6,
                padding: '0.75rem 1rem',
                borderRadius: '4px',
                pointerEvents: 'none',
                zIndex: 10,
                boxSizing: 'border-box',
              }}>
                {tooltip.which === 'income' && (<>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '11px', color: '#8B6F47', lineHeight: 1.4 }}>annual income</div>
                  <div style={{ fontFamily: "'Oswald', sans-serif", fontSize: '18px', color: '#F7F6F3', lineHeight: 1.2 }}>{fmt(income)}</div>
                  <div style={{ fontSize: '13px', color: '#C4BDB8' }}>({fmt(mo_inc)} / month gross)</div>
                </>)}
                {tooltip.which === 'limit' && (<>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '11px', color: '#8B6F47', lineHeight: 1.4 }}>affordability limit · 28% rule</div>
                  <div style={{ fontFamily: "'Oswald', sans-serif", fontSize: '18px', color: '#F7F6F3', lineHeight: 1.2 }}>{fmt(afford)} / month</div>
                  <div style={{ fontSize: '13px', color: '#C4BDB8' }}>maximum monthly housing cost</div>
                </>)}
                {tooltip.which === 'mortgage' && (<>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '11px', color: '#8B6F47', lineHeight: 1.4 }}>monthly mortgage</div>
                  <div style={{ fontFamily: "'Oswald', sans-serif", fontSize: '18px', color: '#F7F6F3', lineHeight: 1.2 }}>{fmt(mo_mtg)} / month</div>
                  <div style={{ fontSize: '13px', color: '#C4BDB8' }}>30-yr fixed · median Boston home</div>
                  <div style={{ fontSize: '13px', color: over ? '#F5C4B3' : '#9FE1CB', marginTop: '2px' }}>
                    {over ? 'not affordable for this income' : 'affordable for this income'}
                  </div>
                  {over && (
                    <div style={{ fontSize: '13px', color: '#C4BDB8', marginTop: '2px' }}>
                      need {fmt(gap_yr_rounded)} more/yr to qualify
                    </div>
                  )}
                </>)}
                {/* Caret triangle */}
                <div style={{
                  position: 'absolute',
                  [tooltip.flip ? 'top' : 'bottom']: '-6px',
                  left: `${caretLeft}px`,
                  width: 0, height: 0,
                  borderLeft: '6px solid transparent',
                  borderRight: '6px solid transparent',
                  ...(tooltip.flip
                    ? { borderBottom: '6px solid #1C1916' }
                    : { borderTop: '6px solid #1C1916' }),
                }} />
              </div>
            );
          })()}

          {/* Income bar */}
          <div
            ref={barOuterRef}
            style={{
              ...S.barOuter,
              width: `${iW}px`,
              ...(hasExt ? {} : { borderRadius: '3px', borderRight: '2px solid #6B6560' }),
              cursor: 'pointer',
              transition: 'filter 0.15s ease',
              filter: hoveredBar ? 'brightness(1.08)' : undefined,
            }}
            role="button"
            tabIndex="0"
            aria-label={`Annual income: ${fmt(income)}, ${fmt(mo_inc)} per month`}
            onMouseEnter={(e) => {
              if (!isFinePointer) return;
              setHoveredBar('income');
              openTooltip('income', e.currentTarget);
            }}
            onMouseLeave={() => {
              if (!isFinePointer) return;
              setHoveredBar(null);
              setTooltip(null);
            }}
            onClick={(e) => {
              if (isFinePointer) return;
              if (tooltip?.which === 'income') { setTooltip(null); } else { openTooltip('income', e.currentTarget); }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openTooltip('income', e.currentTarget); }
            }}
          >
            {/* Affordability limit stripe — interactive */}
            <div
              style={{ ...S.barStripe, width: '28%', cursor: 'pointer' }}
              role="button"
              tabIndex="0"
              aria-label={`Affordability limit: ${fmt(afford)} per month — 28% of income`}
              onMouseEnter={(e) => {
                if (!isFinePointer) return;
                setHoveredBar('limit');
                openTooltip('limit', e.currentTarget);
              }}
              onMouseLeave={() => {
                if (!isFinePointer) return;
                setHoveredBar('income');
                openTooltip('income', barOuterRef.current);
              }}
              onClick={(e) => {
                e.stopPropagation();
                if (isFinePointer) return;
                if (tooltip?.which === 'limit') { setTooltip(null); } else { openTooltip('limit', e.currentTarget); }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); openTooltip('limit', e.currentTarget); }
              }}
            />
            {over && <div style={{ ...S.barRed, left: '28%', width: `${redW}%` }} />}
            {/* Mortgage marker — 20px hit target wrapping 2px visual line */}
            {over && (
              <div
                style={{
                  position: 'absolute',
                  top: '-4px', bottom: '-4px',
                  width: '20px',
                  left: `calc(${Math.min(parseFloat(mtgPct), 99.5)}% - 10px)`,
                  cursor: 'pointer',
                  zIndex: 3,
                  display: 'flex',
                  alignItems: 'stretch',
                  justifyContent: 'center',
                  transition: 'filter 0.15s ease',
                  filter: hoveredBar === 'mortgage' ? 'brightness(1.5)' : undefined,
                }}
                role="button"
                tabIndex="0"
                aria-label={`Monthly mortgage: ${fmt(mo_mtg)}. Not affordable — ${fmt(mo_mtg - afford)} above the limit.`}
                onMouseEnter={(e) => {
                  if (!isFinePointer) return;
                  setHoveredBar('mortgage');
                  openTooltip('mortgage', e.currentTarget);
                }}
                onMouseLeave={() => {
                  if (!isFinePointer) return;
                  setHoveredBar('income');
                  openTooltip('income', barOuterRef.current);
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (isFinePointer) return;
                  if (tooltip?.which === 'mortgage') { setTooltip(null); } else { openTooltip('mortgage', e.currentTarget); }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); openTooltip('mortgage', e.currentTarget); }
                }}
              >
                <div style={{ width: '2px', background: 'rgba(139,74,74,0.70)', borderRadius: '1px', alignSelf: 'stretch' }} />
              </div>
            )}
          </div>

          {hasExt && (
            <div style={{ ...S.barExtension, width: `${extW}px` }}>
              <span style={extLong
                ? { position: 'absolute', top: '50%', left: '8px', transform: 'translateY(-50%)', fontFamily: "'Lato', sans-serif", fontSize: '9px', fontWeight: 500, color: 'rgba(160,100,20,0.85)', whiteSpace: 'nowrap', pointerEvents: 'none' }
                : S.extLabelAbove
              }>
                {extLabelText}
              </span>
            </div>
          )}
        </div>

        <div style={S.barAnnRow}>
          <span style={S.annIncome}>Income: ${Math.round(income / 1000)}K / yr ({fmt(mo_inc)}/mo)</span>
          <span style={S.annAfford}>Limit: {fmt(afford)}/mo</span>
          {over
            ? <span style={S.annOver}>+{fmt(mo_mtg - afford)} over limit</span>
            : <span style={S.annAfford} />
          }
          <span style={S.annMortgage}>Mortgage: {fmt(mo_mtg)}/mo</span>
        </div>
      </div>

      {/* ── Mini stats strip ── */}
      <div style={S.miniStats}>
        <div style={S.msFirst}>
          <div style={S.msLbl}>Monthly mortgage payment</div>
          <div style={over ? S.msValRed : S.msVal}>{fmt(mo_mtg)}</div>
          <div style={S.msDelta} />
        </div>
        <div style={S.msRest}>
          <div style={S.msLbl}>Left over each month</div>
          <div style={leftover < 0 ? S.msValRed : S.msVal}>{fmt(leftover)}</div>
          <div style={S.msDelta} />
        </div>
        <div style={S.msRest}>
          <div style={S.msLbl}>Annual income needed to qualify</div>
          <div style={over ? S.msValRed : S.msVal}>{fmt(needed_yr)}</div>
          <div style={S.msDelta} />
        </div>
        <div style={S.msRest}>
          <div style={S.msLbl}>Mortgage rate</div>
          <div style={S.msVal}>{rawYear.rate}%</div>
          <div style={S.msDelta} />
        </div>
      </div>

      {/* ── $179K callout — default state only ── */}
      {selectedOccupation === 'median' && selectedHHSize === null && (
        <div style={{
          marginTop: '20px',
          background: '#F0EDE8',
          borderLeft: '2px solid #8B4A4A',
          padding: '0.75rem 1rem',
          fontFamily: "'Lato', sans-serif",
          fontSize: '14px',
          color: '#4a3f38',
          lineHeight: 1.6,
          borderRadius: '0 4px 4px 0',
          maxWidth: '620px',
        }}>
          A household earning Boston's median income would need to nearly double it — to $179K — just to qualify for a mortgage on a median-priced home today.
        </div>
      )}

          </div>{/* /stageMain */}

        </div>{/* /stageLayout */}

        {/* ── Timeline ── */}
        <div style={S.timelineWrap}>
          <div style={S.timelineLabel}>Move through time</div>
          <div style={S.timelineTrack}>
            <div style={S.tlLine} />
            <div style={{ ...S.tlFill, width: fillPct }} />
            <div style={S.tlDots}>
              {RAW.map((d, i) => {
                const isPast   = i < selectedIndex;
                const isActive = d.year === selectedYear;
                const dotStyle   = isActive ? S.tlDotActive : isPast ? S.tlDotPast : S.tlDot;
                const labelStyle = isActive ? S.tlDotLabelActive : isPast ? S.tlDotLabelPast : S.tlDotLabel;
                return (
                  <div
                    key={d.year}
                    style={{ ...dotStyle, cursor: 'pointer' }}
                    onClick={() => setSelectedYear(d.year)}
                  >
                    <span style={labelStyle}>{d.year}</span>
                  </div>
                );
              })}
            </div>
          </div>
          <div style={S.tlNav}>
            <button
              style={atFirst ? { ...S.tlBtn, opacity: 0.35, cursor: 'not-allowed' } : S.tlBtn}
              onClick={goEarlier}
              disabled={atFirst}
            >
              ← Earlier
            </button>
            <button
              style={atLast ? { ...S.tlBtn, opacity: 0.35, cursor: 'not-allowed' } : S.tlBtn}
              onClick={goLater}
              disabled={atLast}
            >
              Later →
            </button>
          </div>
        </div>

      </div>{/* /stage */}

      {/* ── Source row ── */}
      <div style={S.sourceRow}>
        <div style={S.sourceText}>
          <span style={S.sourceSpan}>Price:</span> Redfin Data Center (2012–2024); PropertyShark/MAR (2005–2011) ·{' '}
          <span style={S.sourceSpan}>Income:</span> U.S. Census ACS 1-year, B19013 ·{' '}
          <span style={S.sourceSpan}>Mortgage:</span> Freddie Mac PMMS 30-yr fixed · 20% down assumed
        </div>
      </div>

    </div>
  );
}
