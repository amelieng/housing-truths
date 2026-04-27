// Source: NAR Profile of Home Buyers and Sellers, 2024–2025

// ── Data ─────────────────────────────────────────────────────────────────────
// Pre-computed SVG coordinates for the age trend line
// ViewBox: 0 0 520 250  |  plot x=[44,480] y=[20,206]
// xScale: 44 + (year−1981) × 9.909   |   yScale: 206 − (age−28) × 13.286
const CHART_POINTS = [
  { year: 1981, age: 29, x:  44, y: 193 },
  { year: 2000, age: 32, x: 232, y: 153 },
  { year: 2010, age: 30, x: 331, y: 179 },
  { year: 2018, age: 32, x: 411, y: 153 },
  { year: 2021, age: 33, x: 440, y: 140 },
  { year: 2022, age: 36, x: 450, y: 100 },
  { year: 2024, age: 38, x: 470, y:  73 },
  { year: 2025, age: 40, x: 480, y:  47 },
]

// y positions for horizontal grid + axis labels (ages 30–40, every 2)
const Y_TICKS = [
  { age: 30, y: 179 },
  { age: 32, y: 153 },
  { age: 34, y: 126 },
  { age: 36, y: 100 },
  { age: 38, y:  73 },
  { age: 40, y:  47 },
]

// x positions for x-axis labels
const X_TICKS = [
  { year: 1981, x:  44 },
  { year: 2000, x: 232 },
  { year: 2010, x: 331 },
  { year: 2025, x: 480 },
]

const PORTRAIT_CARDS = [
  { label: 'median age',            stat: '38–40',   body: 'a decade older than their parents' },
  { label: 'household income',      stat: '$97K',    body: 'needed just to get to the table' },
  { label: 'down payment',          stat: '9–10%',   body: 'highest since 1989' },
  { label: 'have kids at home',     stat: '27%',     body: 'down from 58% in 1985' },
  { label: 'equity lost by waiting',stat: '~$150K',  body: 'buying at 40 vs. 30' },
]

// ── Component ─────────────────────────────────────────────────────────────────
export default function FirstTimeBuyer() {
  const polylinePoints = CHART_POINTS.map(p => `${p.x},${p.y}`).join(' ')

  return (
    <div className="ftb-wrap">

      {/* ── Section heading ── */}
      <h2 className="section-heading">
        Your parents' generation bought a house. Their kids are still waiting.
      </h2>
      <p className="ftb-subhead">
        The first-time buyer of today is a decade older than their parents were.
        Here's who is actually buying right now — and what the wait has cost them.
      </p>

      {/* ── Part 1: Then vs Now ── */}
      <div className="ftb-then-now">

        <div className="ftb-hero-card ftb-hero-card--then">
          <p className="ftb-hero-era">Your parents' generation</p>
          <p className="ftb-hero-yr">1981</p>
          <div className="ftb-hero-age">29</div>
          <p className="ftb-hero-age-lbl">median age at first purchase</p>
          <p className="ftb-hero-share">40% of all first-time buyers</p>
        </div>

        <div className="ftb-then-now-arrow" aria-hidden="true">→</div>

        <div className="ftb-hero-card ftb-hero-card--now">
          <p className="ftb-hero-era">Your generation</p>
          <p className="ftb-hero-yr">2025</p>
          <div className="ftb-hero-age">40</div>
          <p className="ftb-hero-age-lbl">median age at first purchase</p>
          <p className="ftb-hero-share">In 1992, the typical first-time buyer was 28. Today they're 40.</p>
          <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '13px', color: 'var(--text-source)', marginTop: '8px', lineHeight: '1.5' }}>A 12-year delay — in a single generation.</p>
          <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '13px', color: 'var(--text-source)', opacity: 0.65, marginTop: '6px', lineHeight: '1.4' }}>NAR Profile of Home Buyers and Sellers, 2025 · National data</p>
        </div>

      </div>

      {/* ── Part 2: Age trend line chart ── */}
      <div className="ftb-chart-outer">
        <p className="ftb-chart-eyebrow" style={{ fontFamily: "'Oswald', sans-serif", fontSize: '16px', color: '#1C1916' }}>Median first-time buyer age · NAR, 1981–2025</p>
        <svg
          viewBox="0 0 520 250"
          width="100%"
          style={{ display: 'block' }}
          aria-label="Line chart showing median first-time buyer age rising from 29 in 1981 to 40 in 2025"
        >
          {/* Y-axis grid lines */}
          {Y_TICKS.map(t => (
            <line
              key={t.age}
              x1={44} y1={t.y} x2={480} y2={t.y}
              stroke="#E2DDD6" strokeWidth="1"
            />
          ))}

          {/* X-axis baseline */}
          <line x1={44} y1={206} x2={480} y2={206} stroke="#E2DDD6" strokeWidth="1" />

          {/* Reference line: age 29 — 1981 baseline (solid subtle) */}
          <line
            x1={44} y1={193} x2={480} y2={193}
            stroke="#C4BDB8" strokeWidth="1.5" opacity="0.75"
          />
          {/* Label sits between the data curve and the reference line */}
          <text
            x={200} y={189}
            textAnchor="middle"
            fontFamily="Lato, sans-serif" fontSize="13" fill="#6B6460"
          >
            1981 baseline
          </text>

          {/* Reference line: age 30 — typical parents' purchase age (dashed) */}
          <line
            x1={44} y1={179} x2={480} y2={179}
            stroke="#C4BDB8" strokeWidth="1" strokeDasharray="4,3" opacity="0.7"
          />
          <text
            x={280} y={174}
            textAnchor="middle"
            fontFamily="Lato, sans-serif" fontSize="13" fill="#6B6460"
          >
            typical parents' purchase age
          </text>

          {/* Y-axis labels */}
          {Y_TICKS.map(t => (
            <text
              key={t.age}
              x={40} y={t.y + 3}
              textAnchor="end"
              fontFamily="Lato, sans-serif" fontSize="13" fill="#6B6460"
            >
              {t.age}
            </text>
          ))}

          {/* X-axis labels */}
          {X_TICKS.map(t => (
            <text
              key={t.year}
              x={t.x} y={222}
              textAnchor="middle"
              fontFamily="Lato, sans-serif" fontSize="13" fill="#6B6460"
            >
              {t.year}
            </text>
          ))}

          {/* Main trend line */}
          <polyline
            points={polylinePoints}
            fill="none"
            stroke="#8B4A4A"
            strokeWidth="2.5"
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {/* Data point dots */}
          {CHART_POINTS.map(p => (
            <circle
              key={p.year}
              cx={p.x} cy={p.y} r="4"
              fill="#8B4A4A" stroke="#FFFFFF" strokeWidth="1.5"
            />
          ))}

          {/* Endpoint label: "40 today" */}
          <text
            x={476} y={38}
            textAnchor="end"
            fontFamily="'Oswald', sans-serif" fontSize="13" fontWeight="500"
            fill="#8B4A4A"
          >
            40 today
          </text>

        </svg>
      </div>

      {/* ── Part 3: Portrait cards ── */}
      <p className="ftb-portrait-eyebrow">Who is buying right now</p>
      <div className="ftb-portrait-grid">
        {PORTRAIT_CARDS.map(card => (
          <div key={card.label} className="ftb-portrait-card">
            <p className="ftb-p-label">{card.label}</p>
            <div className="ftb-p-stat">{card.stat}</div>
            <p className="ftb-p-body">{card.body}</p>
          </div>
        ))}
      </div>

      {/* ── Source ── */}
      <p className="ftb-source">
        Source: NAR Profile of Home Buyers and Sellers, 2024–2025 · National data ·
        Boston buyers face additional pressure from higher local home prices
      </p>

    </div>
  )
}
