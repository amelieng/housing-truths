import { useState, useEffect, useLayoutEffect, useRef } from 'react'

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
  vs.style.cssText = "font-family: 'Lato', sans-serif; font-weight: 400; font-size: 11px; letter-spacing: 0.08em; color: #6B6460; align-self: center; padding-bottom: 48px;"
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
  const skylineRef       = useRef(null)
  const guessBoxRef      = useRef(null)
  // Capture guess value at submit time so the effect closure reads the right value
  const guessAtSubmit    = useRef(guess)

  // ── Anchor the skyline's bottom to the guess-box's bottom (= submit button) ─
  // The skyline is a direct child of .renter-guess; we set its `bottom`
  // dynamically so the ground line sits at the submit button level even as
  // the section grows (reveal, comparison expand) below it.
  useLayoutEffect(() => {
    const sky  = skylineRef.current
    const box  = guessBoxRef.current
    const root = sky && sky.parentElement
    if (!sky || !box || !root) return

    function update() {
      const boxBottom = box.offsetTop + box.offsetHeight
      sky.style.bottom = (root.offsetHeight - boxBottom) + 'px'
    }
    update()

    const ro = new ResizeObserver(update)
    ro.observe(root)
    ro.observe(box)
    return () => ro.disconnect()
  }, [])

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
      {/* Decorative Boston skyline silhouette in background — vertically anchored to the bottom of the guess box via useLayoutEffect below */}
      <svg
        className="rg-skyline"
        ref={skylineRef}
        viewBox="0 0 2400 300"
        preserveAspectRatio="xMidYEnd meet"
        aria-hidden="true"
      >
        {/* Buildings — single continuous silhouette (no gaps, no bridge) */}
        <g fill="var(--blue)">
          {/* ── Beacon Hill / North End rowhouses with bay windows ── */}
          <rect x="372" y="150" width="38" height="150" />
          <rect x="410" y="165" width="12" height="135" />
          <rect x="422" y="125" width="42" height="175" />
          <rect x="464" y="160" width="12" height="140" />
          <rect x="476" y="150" width="35" height="150" />
          <path d="M 511 300 L 511 145 L 534 115 L 557 145 L 557 300 Z" />
          <rect x="557" y="150" width="35" height="150" />

          {/* ── Bunker Hill Monument (granite obelisk) ── */}
          <rect x="592" y="135" width="18" height="165" />
          <path d="M 592 135 L 601 113 L 610 135 Z" />

          {/* ── Old North Church (white spire) ── */}
          <rect x="610" y="245" width="55" height="55" />
          <rect x="625" y="215" width="25" height="30" />
          <rect x="629" y="195" width="17" height="20" />
          <rect x="631" y="175" width="13" height="20" />
          <path d="M 633 175 L 637.5 105 L 642 175 Z" />
          <rect x="636.5" y="92" width="2" height="13" />
          <rect x="633" y="96" width="9" height="2" />

          {/* ── Faneuil Hall (cupola w/ grasshopper weathervane) ── */}
          <rect x="665" y="180" width="80" height="120" />
          <rect x="693" y="157" width="22" height="23" />
          <path d="M 691 157 Q 704 142 717 157 Z" />
          <rect x="703" y="135" width="2" height="15" />
          <rect x="697" y="133" width="14" height="2" />

          {/* ── Custom House Tower (clock tower w/ pyramidal cap) ── */}
          <rect x="745" y="225" width="65" height="75" />
          <rect x="760" y="100" width="35" height="125" />
          <rect x="757" y="92" width="41" height="8" />
          <path d="M 757 92 L 777.5 55 L 798 92 Z" />
          <rect x="775" y="40" width="5" height="15" />

          {/* ── Massachusetts State House (golden dome) ── */}
          <rect x="810" y="240" width="120" height="60" />
          <rect x="840" y="210" width="60" height="30" />
          <path d="M 838 210 L 870 188 L 902 210 Z" />
          <rect x="857" y="172" width="26" height="16" />
          <path d="M 853 172 Q 870 145 887 172 Z" />
          <rect x="867" y="136" width="6" height="10" />
          <rect x="869" y="120" width="2" height="16" />

          {/* ── Old State House cupola ── */}
          <rect x="930" y="180" width="55" height="120" />
          <rect x="945" y="160" width="25" height="20" />
          <path d="M 947 160 Q 957.5 148 968 160 Z" />
          <rect x="956" y="137" width="4" height="11" />
          <rect x="957" y="125" width="2" height="12" />

          {/* ── Trinity Church (Richardsonian Romanesque) ── */}
          <rect x="985" y="180" width="100" height="120" />
          <rect x="990" y="160" width="14" height="20" />
          <path d="M 987 160 L 997 148 L 1007 160 Z" />
          <rect x="1066" y="160" width="14" height="20" />
          <path d="M 1063 160 L 1073 148 L 1083 160 Z" />
          <rect x="1015" y="135" width="40" height="45" />
          <rect x="1018" y="110" width="34" height="25" />
          <path d="M 1015 110 L 1035 73 L 1055 110 Z" />
          <rect x="1034" y="65" width="2" height="9" />

          {/* ── Federal Reserve Bank (slim with rounded top) ── */}
          <rect x="1085" y="105" width="55" height="195" />
          <path d="M 1085 105 Q 1112.5 78 1140 105 Z" />

          {/* ── Office mid-rise ── */}
          <rect x="1140" y="170" width="60" height="130" />

          {/* ── 200 Clarendon / John Hancock Tower ── */}
          <path d="M 1200 300 L 1200 65 L 1275 50 L 1275 300 Z" />

          {/* ── Mid block ── */}
          <rect x="1275" y="160" width="55" height="140" />

          {/* ── Prudential Tower (antenna mast) ── */}
          <rect x="1330" y="78" width="75" height="222" />
          <rect x="1342" y="58" width="51" height="20" />
          <rect x="1365" y="15" width="6" height="43" />

          {/* ── Christian Science Mother Church (dome) ── */}
          <rect x="1405" y="240" width="100" height="60" />
          <rect x="1430" y="218" width="50" height="22" />
          <path d="M 1422 218 Q 1455 168 1488 218 Z" />
          <rect x="1450" y="164" width="10" height="14" />
          <rect x="1453" y="148" width="4" height="16" />

          {/* ── 111 Huntington (R2-D2 — rounded crown) ── */}
          <rect x="1505" y="125" width="58" height="175" />
          <path d="M 1505 125 Q 1534 88 1563 125 Z" />
          <rect x="1531" y="78" width="6" height="14" />

          {/* ── One Dalton / Four Seasons (slim hexagonal) ── */}
          <path d="M 1563 300 L 1563 70 L 1581 45 L 1615 45 L 1633 70 L 1633 300 Z" />

          {/* ── Millennium Tower (tapered crown) ── */}
          <rect x="1633" y="105" width="65" height="195" />
          <path d="M 1633 105 L 1665.5 75 L 1698 105 Z" />

          {/* ── Office mid-rise ── */}
          <rect x="1698" y="180" width="55" height="120" />

          {/* ── Modern slim tower ── */}
          <rect x="1753" y="135" width="40" height="165" />

          {/* ── Stepped tower with setbacks ── */}
          <rect x="1793" y="195" width="55" height="105" />
          <rect x="1803" y="170" width="38" height="25" />
          <rect x="1813" y="148" width="22" height="22" />

          {/* ── Right Back Bay rowhouses with bay windows ── */}
          <rect x="1848" y="240" width="35" height="60" />
          <rect x="1883" y="248" width="12" height="52" />
          <rect x="1895" y="232" width="38" height="68" />
          <path d="M 1933 300 L 1933 235 L 1956 215 L 1979 235 L 1979 300 Z" />
          <rect x="1979" y="240" width="49" height="60" />
        </g>
      </svg>

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
        ref={guessBoxRef}
        style={{
          opacity: submitted ? 0.4 : 1,
          pointerEvents: submitted ? 'none' : 'auto',
        }}
      >
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
        <p className="rg-guess-label">renters for every 1 homeowner</p>
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
        <p className="rg-source" style={{ textAlign: 'center' }}>
          Sources: Boston Mayor's Office of Housing, 2022 Housing Conditions Report · ACS 2016–2020 5-year estimates
        </p>

        {/* City comparison */}
        <div
          className="rg-comparison"
          style={{ opacity: showComparison ? 1 : 0, pointerEvents: showComparison ? 'auto' : 'none' }}
        >
          <button className="rg-compare-toggle" onClick={handleCompareToggle}>
            {compareOpen ? 'Hide comparison ↑' : 'See how Boston compares ↓'}
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
