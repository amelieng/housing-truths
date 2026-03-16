const W   = 1080
const H   = 100
const PAD = { top: 14, right: 20, bottom: 28, left: 52 }
const CW  = W - PAD.left - PAD.right
const CH  = H - PAD.top  - PAD.bottom

const MIN_YEAR  = 1980
const MAX_YEAR  = 2024
const YEAR_RANGE = MAX_YEAR - MIN_YEAR

function xScale(year) {
  return PAD.left + ((year - MIN_YEAR) / YEAR_RANGE) * CW
}

function buildTooltipHTML(d) {
  const cls = d.ratio >= 100 ? 'tt-surplus' : 'tt-gap'
  return `<div class="tt-year">${d.year}</div>
    <div class="tt-val">${Math.round(d.ratio)} units per 100 new HH</div>
    <div class="tt-sub">${d.tot.toLocaleString()} permitted · ${d.hh_new.toLocaleString()} new households</div>
    <div class="tt-delta ${cls}">${d.ratio >= 100 ? '↑ surplus' : '↓ deficit'} vs. equilibrium</div>`
}

export default function RatioChart({ ratioData, onTooltip }) {
  if (!ratioData.length) return null

  const maxRatio  = Math.max(...ratioData.map(d => d.ratio))
  const yMax      = Math.max(Math.ceil(maxRatio / 100) * 100, 200)
  const yScale    = v => PAD.top + CH - ((v - 0) / yMax) * CH
  const baseline  = yScale(100)
  const y0        = PAD.top + CH

  const barW = 14

  const handleEnter = (e, d) => {
    onTooltip({ visible: true, x: e.clientX, y: e.clientY, content: buildTooltipHTML(d) })
  }
  const handleMove = (e) => {
    onTooltip(prev => ({ ...prev, x: e.clientX, y: e.clientY }))
  }
  const handleLeave = () => {
    onTooltip(prev => ({ ...prev, visible: false }))
  }

  // Y grid ticks (multiples of 100 up to yMax, excluding 100 which is the baseline)
  const yTicks = []
  for (let v = 0; v <= yMax; v += 100) {
    if (v !== 100) yTicks.push(v)
  }

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ display: 'block', width: '100%' }}>
      {/* Baseline at 100 (equilibrium) */}
      <line
        x1={PAD.left} y1={baseline}
        x2={W - PAD.right} y2={baseline}
        stroke="#8B6B4A"
        strokeWidth="1.2"
        strokeDasharray="4,3"
        opacity="0.5"
      />
      <text
        x={PAD.left - 6} y={baseline + 4}
        textAnchor="end"
        fontSize="9"
        fontFamily="DM Mono, monospace"
        fill="#8B6B4A"
        opacity="0.7"
      >
        100
      </text>

      {/* Zero baseline */}
      <line x1={PAD.left} y1={y0} x2={W - PAD.right} y2={y0} stroke="#E5E0D9" strokeWidth="1" />

      {/* Y labels */}
      {yTicks.map(v => (
        <text
          key={v}
          x={PAD.left - 6}
          y={yScale(v) + 4}
          textAnchor="end"
          fontSize="9"
          fontFamily="DM Mono, monospace"
          fill="#C4BDB7"
        >
          {v}
        </text>
      ))}

      {/* Bars */}
      {ratioData.map(d => {
        const isAbove = d.ratio >= 100
        const yTop    = isAbove ? yScale(d.ratio) : baseline
        const barH    = Math.abs(yScale(d.ratio) - baseline)
        const color   = isAbove ? 'rgba(74,124,116,0.7)' : 'rgba(184,64,64,0.6)'
        const showLabel = d.ratio < 80 || d.ratio > 180
        const labelY  = isAbove ? yScale(d.ratio) - 3 : yScale(d.ratio) + 10

        return (
          <g key={d.year}>
            <rect
              x={xScale(d.year) - barW / 2}
              y={yTop}
              width={barW}
              height={barH}
              fill={color}
              rx="2"
              style={{ cursor: 'pointer' }}
              onMouseEnter={e => handleEnter(e, d)}
              onMouseMove={handleMove}
              onMouseLeave={handleLeave}
            />
            {showLabel && (
              <text
                x={xScale(d.year)}
                y={labelY}
                textAnchor="middle"
                fontSize="8"
                fontFamily="DM Mono, monospace"
                fill={isAbove ? '#4A7C74' : '#8B4A4A'}
              >
                {Math.round(d.ratio)}
              </text>
            )}
          </g>
        )
      })}

      {/* X labels */}
      {[2013, 2016, 2019, 2023].map(y => (
        <text
          key={y}
          x={xScale(y)}
          y={H - 4}
          textAnchor="middle"
          fontSize="9"
          fontFamily="DM Mono, monospace"
          fill="#A09C97"
        >
          {y}
        </text>
      ))}

      {/* Annotations */}
      <text
        x={xScale(MAX_YEAR) - 2} y={PAD.top + 2}
        textAnchor="end"
        fontSize="9"
        fontFamily="DM Sans, sans-serif"
        fill="#A09C97"
      >
        ↑ more built than needed
      </text>
      <text
        x={xScale(MAX_YEAR) - 2} y={H - PAD.bottom - 2}
        textAnchor="end"
        fontSize="9"
        fontFamily="DM Sans, sans-serif"
        fill="#A09C97"
      >
        ↓ more households than units
      </text>
    </svg>
  )
}
