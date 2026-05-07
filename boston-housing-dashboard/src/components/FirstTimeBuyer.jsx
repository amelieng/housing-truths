import { useState, useRef } from 'react'

// Source: NAR Profile of Home Buyers and Sellers, various years
// 2025 median age (40) and 2024 median age (38): NAR 2025 and 2024 reports
// 1992–2022 data points: NAR historical trend data — verify each pair
// against individual annual reports before publishing

// ── Data ─────────────────────────────────────────────────────────────────────
// Pre-computed SVG coordinates for the age trend line
// ViewBox: 0 0 520 250  |  plot x=[44,480] y=[20,206]
// xScale: 44 + (year−1992) × 13.212   |   yScale: 206 − (age−28) × 13.286
const CHART_POINTS = [
  { year: 1992, age: 28, x:  44, y: 206 },
  { year: 2000, age: 32, x: 150, y: 153 },
  { year: 2010, age: 30, x: 282, y: 179 },
  { year: 2018, age: 32, x: 388, y: 153 },
  { year: 2021, age: 33, x: 427, y: 140 },
  { year: 2022, age: 36, x: 440, y: 100 },
  { year: 2024, age: 38, x: 467, y:  73 },
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
  { year: 1992, x:  44 },
  { year: 2000, x: 150 },
  { year: 2010, x: 282 },
  { year: 2025, x: 480 },
]

const PORTRAIT_CARDS = [
  { label: 'median age',            stat: '38–40',   body: 'a decade older than their parents' },
  { label: 'household income',      stat: '$162K',   body: 'needed to afford a starter home in Boston' },
  { label: 'down payment',          stat: '9–10%',   body: 'highest since 1989' },
  { label: 'have kids at home',     stat: '27%',     body: 'down from 58% in 1985' },
  { label: 'more in rent a first-time buyer pays today than in 2013', stat: '+69%', body: '' },
]

const TT_W = 120

// ── Component ─────────────────────────────────────────────────────────────────
export default function FirstTimeBuyer() {
  const [tooltip, setTooltip] = useState(null)
  const svgRef  = useRef(null)
  const wrapRef = useRef(null)
  const polylinePoints = CHART_POINTS.map(p => `${p.x},${p.y}`).join(' ')

  function handleEnter(p) {
    if (!svgRef.current || !wrapRef.current) return
    const svgRect  = svgRef.current.getBoundingClientRect()
    const wrapRect = wrapRef.current.getBoundingClientRect()
    const scale    = svgRect.width / 520
    setTooltip({
      point: p,
      x: p.x * scale + (svgRect.left - wrapRect.left),
      y: p.y * scale + (svgRect.top  - wrapRect.top),
    })
  }

  const ttPos = (() => {
    if (!tooltip || !wrapRef.current) return null
    const cw   = wrapRef.current.offsetWidth
    let left   = tooltip.x - TT_W / 2
    if (left < 0)           left = 0
    if (left + TT_W > cw)   left = cw - TT_W
    const above = tooltip.y - 68 - 12
    return { left, top: above < 0 ? tooltip.y + 12 : above }
  })()

  return (
    <div className="ftb-wrap">

      {/* ── Section heading ── */}
      <p className="ftb-portrait-eyebrow">The wait to own · 1992 vs. today</p>
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
          <p className="ftb-hero-yr">1992</p>
          <div className="ftb-hero-age">28</div>
          <p className="ftb-hero-age-lbl">median age at first purchase</p>

        </div>

        <div className="ftb-then-now-arrow" aria-hidden="true">→</div>

        <div className="ftb-hero-card ftb-hero-card--now">
          <p className="ftb-hero-era">Your generation</p>
          <p className="ftb-hero-yr">2025</p>
          <div className="ftb-hero-age">40</div>
          <p className="ftb-hero-age-lbl">median age at first purchase</p>
        </div>

      </div>

      {/* ── Part 2: Age trend line chart ── */}
      <div className="ftb-chart-outer" ref={wrapRef} style={{ position: 'relative' }}>
        <p className="ftb-chart-eyebrow">Median first-time buyer age · NAR, 1992–2025</p>
        <svg
          ref={svgRef}
          viewBox="0 0 520 250"
          width="100%"
          style={{ display: 'block' }}
          aria-label="Line chart showing median first-time buyer age rising from 28 in 1992 to 40 in 2025"
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

          {/* Y-axis labels */}
          {Y_TICKS.map(t => (
            <text
              key={t.age}
              x={40} y={t.y + 3}
              textAnchor="end"
              fontFamily="Lato, sans-serif" fontSize="11" fill="#6B6460"
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
              fontFamily="Lato, sans-serif" fontSize="11" fill="#6B6460"
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

          {/* Halos for highlighted points */}
          <circle cx={44}  cy={206} r={10} fill="rgba(139,74,74,0.07)" stroke="#C4A8A8" strokeWidth="1" />
          <circle cx={480} cy={47}  r={10} fill="rgba(139,74,74,0.07)" stroke="#C4A8A8" strokeWidth="1" />

          {/* Data point dots + hit areas */}
          {CHART_POINTS.map(p => (
            <g
              key={p.year}
              onMouseEnter={() => handleEnter(p)}
              onMouseLeave={() => setTooltip(null)}
              style={{ cursor: 'pointer' }}
            >
              <circle cx={p.x} cy={p.y} r="12" fill="transparent" />
              <circle
                cx={p.x} cy={p.y}
                r={tooltip?.point.year === p.year ? 5.5 : 4}
                fill="#8B4A4A"
              />
            </g>
          ))}

          {/* Label connectors */}
          <line x1={54}  y1={172} x2={44}  y2={206} stroke="#C4A8A8" strokeWidth="1" opacity="0.5" />
          <line x1={460} y1={37}  x2={480} y2={47}  stroke="#C4A8A8" strokeWidth="1" opacity="0.5" />

          {/* Label box: 1992 */}
          <rect x={54} y={148} width={50} height={24} rx={2} fill="#F7F6F3" stroke="#D8CECE" strokeWidth="1" />
          <text x={79} y={159} textAnchor="middle" fontFamily="Lato, sans-serif" fontSize="10" fontWeight="700" fill="#8B7070">28 y/o</text>
          <text x={79} y={169} textAnchor="middle" fontFamily="Lato, sans-serif" fontSize="8" fill="#A09090">1992</text>

          {/* Label box: 2025 */}
          <rect x={435} y={13} width={50} height={24} rx={2} fill="#F7F6F3" stroke="#D8CECE" strokeWidth="1" />
          <text x={460} y={24} textAnchor="middle" fontFamily="Lato, sans-serif" fontSize="11" fontWeight="700" fill="#8B7070">40 y/o</text>
          <text x={460} y={34} textAnchor="middle" fontFamily="Lato, sans-serif" fontSize="8" fill="#A09090">2025</text>


        </svg>

        {ttPos && (
          <div style={{
            position: 'absolute',
            left: ttPos.left,
            top: ttPos.top,
            width: TT_W,
            background: '#1C1916',
            borderRadius: '4px',
            padding: '0.75rem 1rem',
            pointerEvents: 'none',
            zIndex: 10,
          }}>
            <div style={{ fontFamily: 'var(--font-data)', fontSize: '13px', fontWeight: 400, color: '#C9A87A', lineHeight: 1.4 }}>{tooltip.point.year}</div>
            <div style={{ fontFamily: 'var(--font-data)', fontSize: '18px', fontWeight: 700, color: '#F7F6F3', lineHeight: 1.2 }}>{tooltip.point.age} y/o</div>
          </div>
        )}
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
      <p className="ftb-source" style={{ marginTop: '16px' }}>
        Sources: Boston Indicators, Greater Boston Housing Report Card, 2025 ·
        Boston buyers face additional pressure from higher local home prices
      </p>

    </div>
  )
}
