import { useState, useRef, useEffect, useCallback } from 'react'

const W = 1200
const H = 820
const PAD = { top: 70, right: 50, bottom: 80, left: 70 }
const CW = W - PAD.left - PAD.right   // 1080
const CH = H - PAD.top - PAD.bottom   // 670
const MIN_YEAR = 1980
const MAX_YEAR = 2024
// Half-year buffer on each side keeps edge circles away from the clip boundary
const X_MIN  = MIN_YEAR - 0.5          // 1979.5
const X_SPAN = (MAX_YEAR + 0.5) - X_MIN // 45
const SCALE = 0.38
const ZOOM_REVEAL = 2.0

const ERAS = [
  { start: 1980, end: 1988, label: 'Massachusetts Miracle', color: 'era-green' },
  { start: 1989, end: 1996, label: 'Bust & S&L Collapse',   color: 'era-red'   },
  { start: 1997, end: 2007, label: 'Menino Era',             color: 'era-green' },
  { start: 2008, end: 2011, label: 'Financial Crisis',       color: 'era-red'   },
  { start: 2012, end: 2021, label: 'Menino–Walsh Build Era', color: 'era-green' },
  { start: 2022, end: 2024, label: 'Rate Shock',             color: 'era-red'   },
]

const ERA_COLORS = {
  'era-green': { band: 'rgba(74,124,116,0.10)', label: '#4A7C74' },
  'era-red':   { band: 'rgba(139,74,74,0.09)',  label: '#8B4A4A' },
}

const CONTEXT_EVENTS = {
  1984: { title: 'Massachusetts Miracle', text: 'Dukakis-era high-tech boom along Route 128 spills into Boston. Office and residential construction surge together.' },
  1992: { title: 'S&L Crisis Trough', text: 'Savings & Loan collapse freezes real estate credit nationwide. Boston permits hit post-WWII lows as regional banks fail in cascade.' },
  1998: { title: '"Leading the Way" Begins', text: 'Mayor Menino launches Boston\'s first systematic affordable housing plan, targeting 10,000 units — a new model for city-led production.' },
  2000: { title: 'Dot-Com Overhang', text: 'Tech bust cools demand in Cambridge and Back Bay, but historically low interest rates prop up construction citywide.' },
  2006: { title: 'Pre-GFC Speculative Peak', text: 'Loose subprime lending and condo-flip speculation push construction to a 20-year high. The foreclosure wave arrives within 18 months.' },
  2009: { title: 'Financial Crisis Trough', text: 'Credit markets freeze solid. Developer financing collapses overnight and permits fall 60% from the 2006 peak in under two years.' },
  2013: { title: 'Housing a Changing City', text: 'Menino sets an ambitious 53,000-unit goal by 2030. The Walsh administration inherits and dramatically accelerates permitting.' },
  2017: { title: 'Walsh-Era Peak', text: 'Boston\'s strongest permit year since the 1980s boom. Luxury towers, mixed-income projects, and workforce housing flood the pipeline simultaneously.' },
  2020: { title: 'COVID-19 Shock', text: 'Pandemic shutdowns halt construction starts in spring. Supply chain disruptions and labor shortages compound into a multi-year drag on production.' },
  2022: { title: 'Rate Cycle Begins', text: 'Fed begins its fastest tightening cycle since 1980. Development financing costs double within months; new project underwriting breaks down.' },
  2023: { title: 'Rate Shock Collapse', text: 'With mortgage rates above 7% and cap rates inverted, virtually no new multifamily deals pencil out. Permitted units fall back to financial-crisis levels.' },
}

const Y_GRID = [1000, 2000, 3000, 4000, 5000]
const X_TICKS = [1980, 1990, 2000, 2010, 2020]

function xScale(year) {
  return PAD.left + ((year - X_MIN) / X_SPAN) * CW
}

function buildYScale(maxTot) {
  return v => PAD.top + CH - (v / (maxTot * 1.35)) * CH
}

function buildTooltipHTML(d, demandByYear, showDemand, contextEvent) {
  const dem = demandByYear[d.year]
  let html = `<div class="tt-year">${d.year}</div>
    <div class="tt-val">${d.tot.toLocaleString()} total units</div>
    <div class="tt-sub">${d.mf.toLocaleString()} multi-family · ${d.sf} single-family${d.bldgs != null ? ` · ${d.bldgs} bldgs` : ''}</div>`
  if (dem?.hh_new && showDemand) {
    const diff = d.tot - dem.hh_new
    const cls  = diff >= 0 ? 'tt-surplus' : 'tt-gap'
    html += `<div class="tt-delta ${cls}">${diff >= 0 ? '↑ ' : '↓ '}${Math.abs(diff).toLocaleString()} vs. demand (${dem.hh_new.toLocaleString()} new households)</div>`
  }
  if (contextEvent) {
    html += `<div class="tt-context-title">${contextEvent.title}</div><div class="tt-context-text">${contextEvent.text}</div>`
  }
  return html
}

function buildDemandTooltipHTML(d, supplyByYear) {
  const supply = supplyByYear[d.year]
  let html = `<div class="tt-year">${d.year} · Demand</div>
    <div class="tt-val">${d.hh_new.toLocaleString()} new households</div>`
  if (supply) {
    const diff = supply - d.hh_new
    const cls  = diff >= 0 ? 'tt-surplus' : 'tt-gap'
    html += `<div class="tt-delta ${cls}">${diff >= 0 ? '+' : ''}${diff.toLocaleString()} vs. demand</div>`
  }
  return html
}

// Clamp pan so data area always overlaps the visible plot window
function clampTransform(scale, tx, ty) {
  if (scale <= 1) return { scale: 1, tx: 0, ty: 0 }
  const minTx = PAD.left - scale * (PAD.left + CW)
  const maxTx = PAD.left * (1 - scale) + CW
  const minTy = PAD.top  - scale * (PAD.top  + CH)
  const maxTy = PAD.top  * (1 - scale) + CH
  return {
    scale,
    tx: Math.min(maxTx, Math.max(minTx, tx)),
    ty: Math.min(maxTy, Math.max(minTy, ty)),
  }
}

export default function CrescentChart({
  permitData,
  demandData,
  demandByYear,
  showDemand,
  onToggleDemand,
  onTooltip,
}) {
  const [transform, setTransform] = useState({ scale: 1, tx: 0, ty: 0 })
  const [dragging, setDragging] = useState(false)
  const [hoveredContext, setHoveredContext] = useState(null)
  const svgRef  = useRef(null)
  const dragRef = useRef(null)

  const cleanData = permitData.filter(d => !d.gap && d.tot > 0)
  const maxTot    = Math.max(...cleanData.map(d => d.tot))
  const yScale    = buildYScale(maxTot)
  const supplyByYear = {}
  cleanData.forEach(d => { supplyByYear[d.year] = d.tot })

  const gapGroups = []
  let gapStart = null
  for (let yr = MIN_YEAR; yr <= MAX_YEAR; yr++) {
    const d = permitData.find(p => p.year === yr)
    if (!d || d.gap) {
      if (gapStart === null) gapStart = yr
    } else {
      if (gapStart !== null) { gapGroups.push([gapStart, yr - 1]); gapStart = null }
    }
  }
  if (gapStart !== null) gapGroups.push([gapStart, MAX_YEAR])

  const connectors = []
  for (let i = 0; i < cleanData.length - 1; i++) {
    const a = cleanData[i], b = cleanData[i + 1]
    if (b.year - a.year > 1) connectors.push([a, b])
  }

  function svgPoint(e) {
    const svg = svgRef.current
    if (!svg) return { x: 0, y: 0 }
    const pt = svg.createSVGPoint()
    pt.x = e.clientX
    pt.y = e.clientY
    return pt.matrixTransform(svg.getScreenCTM().inverse())
  }

  // Wheel zoom — pan+scale on data layer only; axes never affected
  const handleWheel = useCallback((e) => {
    e.preventDefault()
    const { x: mx, y: my } = svgPoint(e)
    const factor = e.deltaY < 0 ? 1.15 : 1 / 1.15
    setTransform(prev => {
      const newScale = Math.max(1, Math.min(8, prev.scale * factor))
      if (newScale === 1) return { scale: 1, tx: 0, ty: 0 }
      const f = newScale / prev.scale
      return clampTransform(
        newScale,
        mx - (mx - prev.tx) * f,
        my - (my - prev.ty) * f,
      )
    })
  }, [])

  useEffect(() => {
    const el = svgRef.current
    if (!el) return
    el.addEventListener('wheel', handleWheel, { passive: false })
    return () => el.removeEventListener('wheel', handleWheel)
  }, [handleWheel])

  const handleMouseDown = (e) => {
    if (transform.scale <= 1) return
    e.preventDefault()
    setDragging(true)
    dragRef.current = { clientX: e.clientX, clientY: e.clientY, tx: transform.tx, ty: transform.ty }
  }

  const handleMouseMove = (e) => {
    onTooltip(prev => ({ ...prev, x: e.clientX, y: e.clientY }))
    if (dragging && dragRef.current && svgRef.current) {
      const rect = svgRef.current.getBoundingClientRect()
      const dx = (e.clientX - dragRef.current.clientX) / rect.width  * W
      const dy = (e.clientY - dragRef.current.clientY) / rect.height * H
      // Capture tx/ty before the callback to avoid null-ref if dragRef is cleared first
      const newTx = dragRef.current.tx + dx
      const newTy = dragRef.current.ty + dy
      setTransform(prev => clampTransform(prev.scale, newTx, newTy))
    }
  }

  const handleMouseUp = () => {
    setDragging(false)
    dragRef.current = null
  }

  const handleCrescentEnter = (e, d) => {
    // Always show context annotation if available — rings signal this to the user
    const contextEvent = CONTEXT_EVENTS[d.year] ?? null
    setHoveredContext(contextEvent ? d.year : null)
    onTooltip({ visible: true, x: e.clientX, y: e.clientY, content: buildTooltipHTML(d, demandByYear, showDemand, contextEvent) })
  }

  const handleDemandEnter = (e, d) => {
    onTooltip({ visible: true, x: e.clientX, y: e.clientY, content: buildDemandTooltipHTML(d, supplyByYear) })
  }

  const handleLeave = () => {
    onTooltip(prev => ({ ...prev, visible: false }))
    setHoveredContext(null)
  }

  const resetZoom = () => setTransform({ scale: 1, tx: 0, ty: 0 })

  return (
    <div style={{ width: '100%', maxWidth: '1160px', margin: '0 auto', boxSizing: 'border-box', padding: '0 48px' }}>
      {/* Legend */}
      <div className="legend" style={{ marginBottom: 12 }}>
        <div className="legend-item">
          <div className="legend-crescent" />
          <span>Multi-family units (crescent body)</span>
        </div>
        <div className="legend-item">
          <div className="legend-void" />
          <span>Single-family units (carved void)</span>
        </div>
        <div className="legend-item">
          <div className="legend-swatch" style={{ background: 'var(--demand-color)' }} />
          <span>Household demand</span>
        </div>
        <div className="legend-item">
          <div className="legend-swatch" style={{ background: 'var(--gap-color)', opacity: 0.6 }} />
          <span>Supply gap</span>
        </div>
        <div className="legend-item">
          <div className="legend-swatch" style={{ background: 'var(--surplus-color)', opacity: 0.6 }} />
          <span>Supply surplus</span>
        </div>
        <div className="legend-item">
          <div className="legend-ring" />
          <span>Notable event (hover)</span>
        </div>
      </div>

      {/* Main SVG — viewBox is fixed; only the data layer transforms */}
      <div className="chart-wrap">
        {/* Controls overlay — anchored to top-right of chart */}
        <div className="chart-controls-overlay">
          {transform.scale > 1 && (
            <div className="zoom-controls">
              <span className="zoom-level">{transform.scale.toFixed(1)}×</span>
              <button className="zoom-reset" onClick={resetZoom}>Reset zoom</button>
            </div>
          )}
          <div
            className={`layer-toggle ${showDemand ? 'active' : ''}`}
            onClick={onToggleDemand}
          >
            <div className="toggle-dot" />
            <span>Demand layer</span>
          </div>
        </div>
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          style={{
            width: '100%',
            height: 'auto',
            display: 'block',
            cursor: transform.scale > 1 ? (dragging ? 'grabbing' : 'grab') : 'default',
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={() => { handleLeave(); handleMouseUp() }}
        >
          <defs>
            {/* Clip data layer to the plot area so it never bleeds into axis space */}
            <clipPath id="crescent-plot-clip">
              <rect x={PAD.left} y={PAD.top} width={CW} height={CH} />
            </clipPath>
          </defs>

          {/* ── STATIC LAYER ─────────────────────────────────────────────────
               Axes, grid lines, tick labels, era labels.
               Never transformed — always fully visible regardless of zoom.
          ─────────────────────────────────────────────────────────────────── */}

          {/* Era labels (above chart) */}
          {ERAS.map(era => {
            const x1 = xScale(era.start - 0.4)
            const x2 = xScale(era.end   + 0.4)
            const c  = ERA_COLORS[era.color]
            const mx = (x1 + x2) / 2
            return (
              <text
                key={era.start}
                x={mx} y={PAD.top - 10}
                textAnchor="middle"
                fontSize="11"
                fontFamily="Lato, sans-serif"
                fill={c.label}
                opacity="0.85"
              >
                {era.label}
              </text>
            )
          })}

          {/* Y grid lines + tick labels */}
          {Y_GRID.map(v => {
            const y = yScale(v)
            return (
              <g key={v}>
                <line x1={PAD.left} y1={y} x2={W - PAD.right} y2={y} stroke="#E5E0D9" strokeWidth="1" />
                <text x={PAD.left - 6} y={y + 4} textAnchor="end" fontSize="11" fontFamily="Lato, sans-serif" fill="#6B6460">
                  {v.toLocaleString()}
                </text>
              </g>
            )
          })}

          {/* Y-axis title */}
          <text
            x="16"
            y={PAD.top + CH / 2}
            textAnchor="middle"
            fontSize="11"
            fontFamily="Lato, sans-serif"
            fill="#6B6460"
            transform={`rotate(-90, 16, ${PAD.top + CH / 2})`}
          >
            Units permitted
          </text>

          {/* X-axis ticks + labels */}
          {X_TICKS.map(yr => (
            <g key={yr}>
              <line
                x1={xScale(yr)} y1={PAD.top + CH}
                x2={xScale(yr)} y2={PAD.top + CH + 5}
                stroke="#D0CBC4"
                strokeWidth="1"
              />
              <text
                x={xScale(yr)} y={PAD.top + CH + 18}
                textAnchor="middle"
                fontSize="11"
                fontFamily="Lato, sans-serif"
                fill="#6B6460"
              >
                {yr}
              </text>
            </g>
          ))}

          {/* ── DATA LAYER ───────────────────────────────────────────────────
               Clipped to the plot area. The inner <g> carries the zoom
               transform so only data elements pan/scale — axes are siblings
               above and are never affected.
          ─────────────────────────────────────────────────────────────────── */}
          <g clipPath="url(#crescent-plot-clip)">
            <g transform={`translate(${transform.tx}, ${transform.ty}) scale(${transform.scale})`}>

              {/* Era bands — tall enough to fill clip area at any zoom/pan */}
              {ERAS.map(era => {
                const x1 = xScale(era.start - 0.4)
                const x2 = xScale(era.end   + 0.4)
                const c  = ERA_COLORS[era.color]
                return (
                  <rect
                    key={era.start}
                    x={x1} y={-H}
                    width={x2 - x1} height={H * 4}
                    fill={c.band}
                  />
                )
              })}

              {/* Demand layer */}
              {showDemand && (() => {
                const demPoints = demandData.filter(d => d.hh_new > 0)
                const pts = demPoints.map(d => `${xScale(d.year)},${yScale(d.hh_new)}`).join(' ')
                const barW = (CW / X_SPAN) * 0.6

                return (
                  <g>
                    {demPoints
                      .filter(d => supplyByYear[d.year])
                      .map(d => {
                        const supply = supplyByYear[d.year]
                        const yTop   = yScale(Math.max(supply, d.hh_new))
                        const yBot   = yScale(Math.min(supply, d.hh_new))
                        const isGap  = supply < d.hh_new
                        return (
                          <rect
                            key={d.year}
                            x={xScale(d.year) - barW / 2}
                            y={yTop}
                            width={barW}
                            height={yBot - yTop}
                            fill={isGap ? 'rgba(184,64,64,0.18)' : 'rgba(74,124,116,0.18)'}
                            rx="2"
                          />
                        )
                      })
                    }
                    <polyline
                      points={pts}
                      fill="none"
                      stroke="#C17D3C"
                      strokeWidth="2"
                      strokeDasharray="5,3"
                      opacity="0.85"
                    />
                    {demPoints.map(d => (
                      <circle
                        key={d.year}
                        cx={xScale(d.year)}
                        cy={yScale(d.hh_new)}
                        r="3.5"
                        fill="#C17D3C"
                        opacity="0.8"
                        style={{ cursor: 'pointer' }}
                        onMouseEnter={e => handleDemandEnter(e, d)}
                        onMouseLeave={handleLeave}
                      />
                    ))}
                  </g>
                )
              })()}

              {/* Dashed connectors across gaps */}
              {connectors.map(([a, b]) => (
                <line
                  key={`${a.year}-${b.year}`}
                  x1={xScale(a.year)} y1={yScale(a.tot)}
                  x2={xScale(b.year)} y2={yScale(b.tot)}
                  stroke="#C4BDB7"
                  strokeWidth="1"
                  strokeDasharray="3,3"
                />
              ))}

              {/* Crescents */}
              {cleanData.map(d => {
                const cx = xScale(d.year)
                const cy = yScale(d.tot)
                const R  = Math.sqrt(d.tot) * SCALE

                const sfFrac   = d.sf / d.tot
                const rawVoidR = R * Math.sqrt(sfFrac) * 1.3
                const voidR    = Math.min(rawVoidR, R * 0.82)
                const offset   = (R - voidR) * 0.55

                const hasContext = Boolean(CONTEXT_EVENTS[d.year])
                const isHovered  = hoveredContext === d.year
                const ringR      = R + 5

                return (
                  <g key={d.year}>
                    {/* Stroke ring around annotated points — signals interactivity.
                        pointerEvents none so it never steals hover from the
                        invisible hit target below. */}
                    {hasContext && (
                      <circle
                        cx={cx}
                        cy={cy}
                        r={ringR}
                        fill="none"
                        stroke={`rgba(59,107,138,${isHovered ? 0.85 : 0.45})`}
                        strokeWidth={isHovered ? 2 : 1.5}
                        pointerEvents="none"
                        className={isHovered ? undefined : 'context-ring'}
                      />
                    )}
                    {/* Multi-family body */}
                    <circle cx={cx} cy={cy} r={R} fill="#3B6B8A" opacity="0.72" />
                    {/* Single-family void */}
                    {d.sf > 0 && R > 3 && (
                      <circle
                        cx={cx + offset}
                        cy={cy - offset * 0.5}
                        r={voidR}
                        fill="#FFFFFF"
                      />
                    )}
                    {/* Invisible hit target — must be last so it's on top of the crescent */}
                    <circle
                      cx={cx} cy={cy} r={Math.max(R + 2, 6)}
                      fill="transparent"
                      style={{ cursor: 'pointer' }}
                      onMouseEnter={e => handleCrescentEnter(e, d)}
                      onMouseLeave={handleLeave}
                    />
                  </g>
                )
              })}

            </g>
          </g>
        </svg>
      </div>
    <p style={{
      fontFamily: "'DM Mono', monospace",
      fontSize: '11px',
      color: '#A09C97',
      lineHeight: 1.6,
      marginTop: '12px',
      paddingLeft: '4px',
    }}>
      Permits: U.S. Census Bureau, Building Permits Survey · census.gov/construction/bpermits ·
      Household demand: calculated from ACS Table B11001 · 2024 demand estimated
    </p>
  </div>
  )
}
