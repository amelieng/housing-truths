import { useState, useEffect, useRef } from 'react'

// ── DOM helpers — kept as direct DOM manipulation per project rules ────────
// makeBuilding, lightUpWindows, buildBuildings all receive a container
// element and imperatively build SVG; no JSX conversion.

function makeBuilding(type, floors) {
  const W = 110, floorH = 22, gap = 3
  const H = floors * (floorH + gap) + 20
  const ns = 'http://www.w3.org/2000/svg'
  const svg = document.createElementNS(ns, 'svg')
  svg.setAttribute('width', W)
  svg.setAttribute('height', H)
  svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H)
  svg.classList.add('bld-svg')

  const isRenter  = type === 'renter'
  const baseColor = isRenter ? '#8B4A4A' : '#4A7C74'
  const litColor  = isRenter ? '#F5C4B3' : '#9FE1CB'
  const dimColor  = isRenter ? '#2a1616' : '#0d2b28'

  const winCols = 4, winW = 14, winH = 10, winGapX = 10
  const startX  = (W - (winCols * winW + (winCols - 1) * winGapX)) / 2

  for (let f = floors - 1; f >= 0; f--) {
    const fy        = 10 + f * (floorH + gap)
    const floorRect = document.createElementNS(ns, 'rect')
    floorRect.setAttribute('x', 0)
    floorRect.setAttribute('y', fy)
    floorRect.setAttribute('width', W)
    floorRect.setAttribute('height', floorH)
    floorRect.setAttribute('fill', baseColor)
    floorRect.setAttribute('opacity', isRenter ? '0.85' : '0.8')
    svg.appendChild(floorRect)

    for (let c = 0; c < winCols; c++) {
      const wx  = startX + c * (winW + winGapX)
      const wy  = fy + (floorH - winH) / 2
      const win = document.createElementNS(ns, 'rect')
      win.setAttribute('x', wx)
      win.setAttribute('y', wy)
      win.setAttribute('width', winW)
      win.setAttribute('height', winH)
      win.setAttribute('rx', 1)
      win.setAttribute('fill', dimColor)
      win.setAttribute('opacity', '0.5')
      win.dataset.litColor = litColor
      win.dataset.dimColor = dimColor
      svg.appendChild(win)
    }
  }
  return svg
}

function lightUpWindows(svg, delay) {
  const wins = Array.from(svg.querySelectorAll('rect[data-lit-color]'))
  wins.forEach((w, i) => {
    setTimeout(() => {
      w.style.transition = 'fill 0.25s'
      w.setAttribute('fill', w.dataset.litColor)
      w.setAttribute('opacity', '1')
    }, delay + i * 60)
  })
}

function buildBuildings(container) {
  container.innerHTML = ''

  const renterCol = document.createElement('div')
  renterCol.className = 'rg-building-col'
  const renterSvg = makeBuilding('renter', 7)
  const renterLbl = document.createElement('p')
  renterLbl.className = 'rg-building-label'
  renterLbl.textContent = 'renters'
  const renterPct = document.createElement('p')
  renterPct.className = 'rg-building-pct'
  renterPct.style.color = '#8B4A4A'
  renterPct.textContent = '65%'
  renterCol.appendChild(renterSvg)
  renterCol.appendChild(renterLbl)
  renterCol.appendChild(renterPct)

  const vs = document.createElement('div')
  vs.style.cssText = "font-family: 'DM Mono', monospace; font-size: 11px; color: #6B6460; align-self: center; padding-bottom: 48px;"
  vs.textContent = 'vs'

  const ownerCol = document.createElement('div')
  ownerCol.className = 'rg-building-col'
  const ownerSvg = makeBuilding('owner', 4)
  const ownerLbl = document.createElement('p')
  ownerLbl.className = 'rg-building-label'
  ownerLbl.textContent = 'homeowners'
  const ownerPct = document.createElement('p')
  ownerPct.className = 'rg-building-pct'
  ownerPct.style.color = '#4A7C74'
  ownerPct.textContent = '35%'
  ownerCol.appendChild(ownerSvg)
  ownerCol.appendChild(ownerLbl)
  ownerCol.appendChild(ownerPct)

  container.appendChild(renterCol)
  container.appendChild(vs)
  container.appendChild(ownerCol)

  setTimeout(() => lightUpWindows(renterSvg, 0), 600)
  setTimeout(() => lightUpWindows(ownerSvg, 400), 600)
}

// ── Slot-machine counter — kept as requestAnimationFrame per project rules ─
function slotMachineCount(el, target, duration, onDone) {
  const start = performance.now()
  function tick(now) {
    const t    = Math.min((now - start) / duration, 1)
    const ease = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
    el.textContent = Math.round(target * ease)
    if (t < 1) {
      requestAnimationFrame(tick)
    } else {
      el.textContent = target
      if (onDone) onDone()
    }
  }
  requestAnimationFrame(tick)
}

// ─────────────────────────────────────────────────────────────────────────────
export default function RenterGuess() {
  const [guess, setGuess]                       = useState(1)
  const [submitted, setSubmitted]               = useState(false)
  const [revealText, setRevealText]             = useState({ stat: '', statColor: '', sub: '' })
  const [showComparison, setShowComparison]     = useState(false)
  const [compareOpen, setCompareOpen]           = useState(false)
  const [compareBarsAnimated, setCompareBarsAnimated] = useState(false)

  const buildingsWrapRef = useRef(null)
  const counterRef       = useRef(null)
  // Capture guess value at submit time so the effect closure reads the right value
  const guessAtSubmit    = useRef(guess)

  // ── Run slot machine + reveal sequence when submitted ─────────────────────
  useEffect(() => {
    if (!submitted) return
    const el = counterRef.current
    if (!el) return

    slotMachineCount(el, 2, 1800, () => {
      const wasRight = guessAtSubmit.current === 2
      setRevealText({
        stat: wasRight
          ? 'You got it. 2 renters for every 1 homeowner.'
          : 'The real answer is 2 : 1 — you guessed ' + guessAtSubmit.current + ' : 1.',
        statColor: wasRight ? '#4A7C74' : '#8B4A4A',
        sub: 'Boston is one of the most renter-heavy cities in America. 65% of residents rent — nearly double the national average of 36%.',
      })
      if (buildingsWrapRef.current) {
        buildBuildings(buildingsWrapRef.current)
      }
      setTimeout(() => setShowComparison(true), 1200)
    })
  }, [submitted])

  // ── Animate comparison bars 50ms after grid becomes visible ───────────────
  useEffect(() => {
    if (!compareOpen) return
    const t = setTimeout(() => setCompareBarsAnimated(true), 50)
    return () => clearTimeout(t)
  }, [compareOpen])

  function handleSubmit() {
    guessAtSubmit.current = guess
    setSubmitted(true)
  }

  function handleCompareToggle() {
    if (compareOpen) {
      setCompareOpen(false)
      setCompareBarsAnimated(false)
    } else {
      setCompareOpen(true)
    }
  }

  return (
    <div className="renter-guess">
      <p className="rg-eyebrow">Boston housing truths</p>

      <div className="rg-h1">
        What do you think the renter-to-homeowner ratio is in Boston?
      </div>

      <p className="rg-subtext">
        Take a guess. Enter how many renters for every 1 homeowner.
      </p>

      {/* ── Guess controls ── */}
      <div
        className="rg-guess-box"
        style={{
          opacity: submitted ? 0.4 : 1,
          pointerEvents: submitted ? 'none' : 'auto',
        }}
      >
        <p className="rg-guess-label">renters for every 1 homeowner</p>
        <div className="rg-bubble-controls">
          <button
            className="rg-bubble-btn"
            onClick={() => setGuess(g => Math.max(1, g - 1))}
          >
            ▼
          </button>
          <div className="rg-guess-display">
            <span>{guess}</span>
            <span className="rg-denom"> : 1</span>
          </div>
          <button
            className="rg-bubble-btn"
            onClick={() => setGuess(g => Math.min(9, g + 1))}
          >
            ▲
          </button>
        </div>
        <button
          className="rg-submit-btn"
          onClick={handleSubmit}
          disabled={submitted}
        >
          Submit my guess
        </button>
      </div>

      {/* ── Reveal section ── */}
      <div className="rg-reveal" style={{ opacity: submitted ? 1 : 0 }}>

        {/* Slot-machine counter — textContent mutated by RAF */}
        <div className="rg-counter-wrap">
          <div className="rg-counter-num" ref={counterRef}>0</div>
          <div className="rg-counter-label">renters for every 1 homeowner</div>
        </div>

        {/* Stat + sub text + quote */}
        <div className="rg-reveal-header">
          <div
            className="rg-reveal-stat"
            style={{ color: revealText.statColor }}
          >
            {revealText.stat}
          </div>
          <p className="rg-reveal-sub">{revealText.sub}</p>
          <blockquote className="rg-reveal-quote">
            Nearly two in three Bostonians are building someone else's wealth, not their own.
          </blockquote>
        </div>

        {/* Buildings — DOM-manipulated via ref */}
        <div className="rg-buildings-wrap" ref={buildingsWrapRef} />

        {/* Source attribution */}
        <p className="rg-source">
          Source: Boston Mayor's Office of Housing, 2022 Housing Conditions Report · ACS 2016–2020 5-year estimates
        </p>

        {/* City comparison */}
        <div
          className="rg-comparison"
          style={{ opacity: showComparison ? 1 : 0, pointerEvents: showComparison ? 'auto' : 'none' }}
        >
          <button className="rg-compare-toggle" onClick={handleCompareToggle}>
            {compareOpen ? '↑ hide comparison' : '↓ see how boston compares'}
          </button>

          {/* Grid is kept in DOM so the CSS height transition can fire */}
          <div
            className="rg-compare-grid"
            style={{ display: compareOpen ? 'flex' : 'none' }}
          >
            {/* Boston */}
            <div className="rg-compare-item">
              <p className="rg-compare-name">Boston</p>
              <div className="rg-compare-bar-wrap">
                <div className="rg-bar-renter" style={{ height: compareBarsAnimated ? '52px' : '0px' }} />
                <div className="rg-bar-owner"  style={{ height: compareBarsAnimated ? '28px' : '0px' }} />
              </div>
              <p className="rg-compare-pcts">
                <span style={{ color: '#8B4A4A' }}>65%</span> rent<br />
                <span style={{ color: '#4A7C74' }}>35%</span> own
              </p>
            </div>

            {/* Massachusetts */}
            <div className="rg-compare-item">
              <p className="rg-compare-name">Massachusetts</p>
              <div className="rg-compare-bar-wrap">
                <div className="rg-bar-renter" style={{ height: compareBarsAnimated ? '30px' : '0px' }} />
                <div className="rg-bar-owner"  style={{ height: compareBarsAnimated ? '50px' : '0px' }} />
              </div>
              <p className="rg-compare-pcts">
                <span style={{ color: '#8B4A4A' }}>38%</span> rent<br />
                <span style={{ color: '#4A7C74' }}>62%</span> own
              </p>
            </div>

            {/* United States */}
            <div className="rg-compare-item">
              <p className="rg-compare-name">United States</p>
              <div className="rg-compare-bar-wrap">
                <div className="rg-bar-renter" style={{ height: compareBarsAnimated ? '29px' : '0px' }} />
                <div className="rg-bar-owner"  style={{ height: compareBarsAnimated ? '51px' : '0px' }} />
              </div>
              <p className="rg-compare-pcts">
                <span style={{ color: '#8B4A4A' }}>36%</span> rent<br />
                <span style={{ color: '#4A7C74' }}>64%</span> own
              </p>
            </div>
          </div>

          <div
            className="rg-legend"
            style={{ display: compareOpen ? 'flex' : 'none' }}
          >
            <div className="rg-legend-item">
              <div className="rg-legend-dot" style={{ background: '#8B4A4A' }} />
              renters
            </div>
            <div className="rg-legend-item">
              <div className="rg-legend-dot" style={{ background: '#4A7C74' }} />
              owners
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
