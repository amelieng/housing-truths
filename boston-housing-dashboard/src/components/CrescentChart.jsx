import { useState, useRef, useEffect, useCallback } from 'react'

const W = 1080
const H = 820
const PAD = { top: 70, right: 30, bottom: 80, left: 60 }
const CW = W - PAD.left - PAD.right
const CH = H - PAD.top - PAD.bottom
const MIN_YEAR = 1980
const MAX_YEAR = 2024
const YEAR_RANGE = MAX_YEAR - MIN_YEAR
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
const X_TICKS = [1980, 1990, 2000, 2010, 2020, 2024]

function xScale(year) {
  return PAD.left + ((year - MIN_YEAR) / YEAR_RANGE) * CW
}

function buildYScale(maxTot) {
  return v => PAD.top + CH - (v / (maxTot * 1.35)) * CH
}

function buildTooltipHTML(d, demandByYear, showDemand, contextEvent) {
  const dem = demandByYear[d.year]
  let html = `<div class="tt-year">${d.year}</div>
    <div class="tt-val">${d.tot.toLocaleString()} total units</div>
    <div class="tt-sub">${d.mf.toLocaleString()} MF · ${d.sf} SF${d.bldgs != null ? ` · ${d.bldgs} bldgs` : ''}</div>`
  if (dem?.hh_new && showDemand) {
    const diff = d.tot - dem.hh_new
    const cls  = diff >= 0 ? 'tt-surplus' : 'tt-gap'
    html += `<div class="tt-delta ${cls}">${diff >= 0 ? '↑ ' : '↓ '}${Math.abs(diff).toLocaleString()} vs. demand (${dem.hh_new.toLocaleString()} new HH)</div>`
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

export default function CrescentChart({
  permitData,
  demandData,
  demandByYear,
  showDemand,
  onToggleDemand,
  onTooltip,
}) {
  const [view, setView] = useState({ zoom: 1, vbX: 0, vbY: 0 })
  const [dragging, setDragging] = useState(false)
  const [hoveredContext, setHoveredContext] = useState(null)
  const svgRef   = useRef(null)
  const dragRef  = useRef(null)

  const cleanData = permitData.filter(d => !d.gap && d.tot > 0)
  const maxTot    = Math.max(...cleanData.map(d => d.tot))
  const yScale    = buildYScale(maxTot)
  const isZoomedIn = view.zoom >= ZOOM_REVEAL

  const supplyByYear = {}
  cleanData.forEach(d => { supplyByYear[d.year] = d.tot })

  // Gap groups for hatched shading
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

  // SVG-coordinate mouse position helper
  function svgPoint(e) {
    const svg = svgRef.current
    if (!svg) return { x: 0, y: 0 }
    const pt = svg.createSVGPoint()
    pt.x = e.clientX
    pt.y = e.clientY
    const p = pt.matrixTransform(svg.getScreenCTM().inverse())
    return { x: p.x, y: p.y }
  }

  // Wheel zoom — attached imperatively so we can use { passive: false }
  const handleWheel = useCallback((e) => {
    e.preventDefault()
    const { x: mx, y: my } = svgPoint(e)
    const factor = e.deltaY < 0 ? 1.15 : 1 / 1.15
    setView(prev => {
      const newZoom = Math.max(1, Math.min(8, prev.zoom * factor))
      if (newZoom === 1) return { zoom: 1, vbX: 0, vbY: 0 }
      return {
        zoom: newZoom,
        vbX: mx - (mx - prev.vbX) * prev.zoom / newZoom,
        vbY: my - (my - prev.vbY) * prev.zoom / newZoom,
      }
    })
  }, [])

  useEffect(() => {
    const el = svgRef.current
    if (!el) return
    el.addEventListener('wheel', handleWheel, { passive: false })
    return () => el.removeEventListener('wheel', handleWheel)
  }, [handleWheel])

  // Drag to pan
  const handleMouseDown = (e) => {
    if (view.zoom <= 1) return
    e.preventDefault()
    setDragging(true)
    dragRef.current = { clientX: e.clientX, clientY: e.clientY, vbX: view.vbX, vbY: view.vbY }
  }

  const handleMouseMove = (e) => {
    onTooltip(prev => ({ ...prev, x: e.clientX, y: e.clientY }))
    if (dragging && dragRef.current && svgRef.current) {
      const rect = svgRef.current.getBoundingClientRect()
      const vbW = W / view.zoom
      const vbH = H / view.zoom
      const dx = (e.clientX - dragRef.current.clientX) / rect.width  * vbW
      const dy = (e.clientY - dragRef.current.clientY) / rect.height * vbH
      setView(prev => ({
        ...prev,
        vbX: dragRef.current.vbX - dx,
        vbY: dragRef.current.vbY - dy,
      }))
    }
  }

  const handleMouseUp = () => {
    setDragging(false)
    dragRef.current = null
  }

  const handleCrescentEnter = (e, d) => {
    const contextEvent = isZoomedIn ? CONTEXT_EVENTS[d.year] : null
    setHoveredContext(isZoomedIn && CONTEXT_EVENTS[d.year] ? d.year : null)
    onTooltip({ visible: true, x: e.clientX, y: e.clientY, content: buildTooltipHTML(d, demandByYear, showDemand, contextEvent) })
  }

  const handleDemandEnter = (e, d) => {
    onTooltip({ visible: true, x: e.clientX, y: e.clientY, content: buildDemandTooltipHTML(d, supplyByYear) })
  }

  const handleLeave = () => {
    onTooltip(prev => ({ ...prev, visible: false }))
    setHoveredContext(null)
  }

  const resetZoom = () => setView({ zoom: 1, vbX: 0, vbY: 0 })

  const baseline2019 = permitData.find(d => d.year === 2019)
  const vbW = W / view.zoom
  const vbH = H / view.zoom

  return (
    <>
      {/* Controls */}
      <div className="chart-controls">
        <div className="legend">
          <div className="legend-item">
            <div className="legend-crescent" />
            <span>MF units (crescent body)</span>
          </div>
          <div className="legend-item">
            <div className="legend-void" />
            <span>SF units (carved void)</span>
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
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {view.zoom > 1 && (
            <div className="zoom-controls">
              <span className="zoom-level">{view.zoom.toFixed(1)}×</span>
              {isZoomedIn && <span className="zoom-hint">hover ringed points for context</span>}
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
      </div>

      {/* Main SVG */}
      <div className="chart-wrap">
        <svg
          ref={svgRef}
          viewBox={`${view.vbX} ${view.vbY} ${vbW} ${vbH}`}
          style={{
            width: '100%',
            height: 'auto',
            display: 'block',
            cursor: view.zoom > 1 ? (dragging ? 'grabbing' : 'grab') : 'default',
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={() => { handleLeave(); handleMouseUp() }}
        >
          <defs />

          {/* Era bands */}
          {ERAS.map(era => {
            const x1 = xScale(era.start - 0.4)
            const x2 = xScale(era.end   + 0.4)
            const c  = ERA_COLORS[era.color]
            const mx = (x1 + x2) / 2
            return (
              <g key={era.start}>
                <rect x={x1} y={PAD.top} width={x2 - x1} height={CH} fill={c.band} />
                <text
                  x={mx} y={PAD.top - 10}
                  textAnchor="middle"
                  fontSize="11"
                  fontFamily="DM Mono, monospace"
                  fill={c.label}
                  opacity="0.85"
                >
                  {era.label}
                </text>
              </g>
            )
          })}

          {/* Y grid lines */}
          {Y_GRID.map(v => {
            const y = yScale(v)
            return (
              <g key={v}>
                <line x1={PAD.left} y1={y} x2={W - PAD.right} y2={y} stroke="#E5E0D9" strokeWidth="1" />
                <text x={PAD.left - 6} y={y + 4} textAnchor="end" fontSize="11" fontFamily="DM Mono, monospace" fill="#C4BDB7">
                  {v.toLocaleString()}
                </text>
              </g>
            )
          })}

          {/* Y-axis label */}
          <text
            x="16"
            y={PAD.top + CH / 2}
            textAnchor="middle"
            fontSize="11"
            fontFamily="DM Sans, sans-serif"
            fill="#A09C97"
            transform={`rotate(-90, 16, ${PAD.top + CH / 2})`}
          >
            Units permitted
          </text>

          {/* Demand layer */}
          {showDemand && (() => {
            const demPoints = demandData.filter(d => d.hh_new > 0)
            const pts = demPoints.map(d => `${xScale(d.year)},${yScale(d.hh_new)}`).join(' ')
            const barW = (CW / YEAR_RANGE) * 0.6

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
                {demPoints.length > 0 && (
                  <text
                    x={W - PAD.right + 2}
                    y={yScale(demPoints[demPoints.length - 1].hh_new)}
                    fontSize="9"
                    fontFamily="DM Mono, monospace"
                    fill="#C17D3C"
                    opacity="0.8"
                  >
                    demand
                  </text>
                )}
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

            const sfFrac  = d.sf / d.tot
            const rawVoidR = R * Math.sqrt(sfFrac) * 1.3
            const voidR   = Math.min(rawVoidR, R * 0.82)
            const offset  = (R - voidR) * 0.55

            const hasContext  = Boolean(CONTEXT_EVENTS[d.year])
            const isHovered   = hoveredContext === d.year
            const ringOpacity = isZoomedIn ? (isHovered ? 1 : 0.35) : 0
            const ringR       = R + 10 / view.zoom
            const ringStroke  = isHovered ? 2.5 / view.zoom : 1.5 / view.zoom
            const ringDash    = isHovered ? '' : `${5 / view.zoom},${3 / view.zoom}`

            return (
              <g key={d.year}>
                {/* Context ring — visible when zoomed in, bright on hover */}
                {hasContext && (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={ringR}
                    fill="none"
                    stroke="rgba(255,255,255,0.9)"
                    strokeWidth={ringStroke}
                    strokeDasharray={ringDash}
                    opacity={ringOpacity}
                    pointerEvents="none"
                    style={{ transition: 'opacity 0.2s' }}
                  />
                )}
                {/* Invisible hover target */}
                <circle
                  cx={cx} cy={cy} r={Math.max(R + 2, 6)}
                  fill="transparent"
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={e => handleCrescentEnter(e, d)}
                  onMouseLeave={handleLeave}
                />
                {/* MF body */}
                <circle cx={cx} cy={cy} r={R} fill="#3B6B8A" opacity="0.72" />
                {/* SF void */}
                {d.sf > 0 && R > 3 && (
                  <circle
                    cx={cx + offset}
                    cy={cy - offset * 0.5}
                    r={voidR}
                    fill="#FFFFFF"
                  />
                )}
              </g>
            )
          })}

          {/* X-axis ticks + labels */}
          {X_TICKS.map(y => (
            <g key={y}>
              <line
                x1={xScale(y)} y1={PAD.top + CH}
                x2={xScale(y)} y2={PAD.top + CH + 5}
                stroke="#D0CBC4"
                strokeWidth="1"
              />
              <text
                x={xScale(y)} y={PAD.top + CH + 18}
                textAnchor="middle"
                fontSize="11"
                fontFamily="DM Mono, monospace"
                fill="#A09C97"
              >
                {y}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </>
  )
}
