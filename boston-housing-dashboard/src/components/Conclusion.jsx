import { useState } from 'react'

// ── Decision map card data ────────────────────────────────────────────────────
const DECISION_CARDS = [
  {
    scope: 'city agency',
    name: 'Boston Planning & Development Agency',
    desc: 'Approves or rejects major development projects',
    tag: 'mayoral appointee',
    controls: 'Large-scale project approvals, master planning, urban renewal designations',
    showUp: 'Every project has a public comment period — residents can attend and testify. No registration required.',
    fact: 'Board members are appointed by the mayor, not elected — making the mayor your lever here',
    linkText: '→ active projects & comment periods',
    linkHref: 'https://www.bostonplans.org/projects/development-projects',
  },
  {
    scope: 'city board',
    name: 'Zoning Board of Appeal',
    desc: 'Grants exceptions to zoning rules, one property at a time',
    tag: 'mayoral appointee',
    controls: 'Variances and special permits — whether a property can add units, build taller, or change use',
    showUp: 'Every ZBA hearing is public. Neighbors can speak for or against any application — in person or in writing.',
    fact: 'This is where neighbors most often successfully block new housing — and where pro-housing voices are most absent',
    linkText: '→ upcoming ZBA hearings',
    linkHref: 'https://www.boston.gov/departments/inspectional-services/zoning-board-appeal',
  },
  {
    scope: 'city government',
    name: 'Boston City Council',
    desc: 'Sets zoning policy and the city housing budget',
    tag: 'elected',
    controls: 'Citywide zoning ordinances, housing trust fund allocations, affordable housing linkage fees',
    showUp: 'Council meetings and committee hearings are open. Your district councilor is elected by your neighborhood and answers to it.',
    fact: 'A single email to your district councilor naming a specific project carries more weight than most residents realize',
    linkText: '→ find your district councilor',
    linkHref: 'https://www.boston.gov/departments/city-council',
  },
  {
    scope: 'state government',
    name: 'Massachusetts Legislature',
    desc: 'Controls the laws that shape what Boston can and must build',
    tag: 'state level',
    controls: 'Chapter 40B affordable housing law, MBTA Communities zoning mandate, state housing bond bills',
    showUp: 'Legislative hearings on housing bills are public. Your state rep and senator vote on every housing law.',
    fact: 'State law can override local zoning — Beacon Hill matters as much as City Hall',
    linkText: '→ find your state rep & senator',
    linkHref: 'https://malegislature.gov/Search/FindMyLegislator',
  },
]

// Tag pill styles — only these three colors are new to the design system
const TAG_STYLES = {
  'elected':           { background: 'rgba(29,158,117,0.13)',  color: '#1D9E75' },
  'mayoral appointee': { background: 'rgba(186,117,23,0.13)',  color: '#BA7517' },
  'state level':       { background: 'rgba(127,119,221,0.13)', color: '#7F77DD' },
}

const LEGEND_DOTS = [
  { color: '#1D9E75', label: 'elected' },
  { color: '#BA7517', label: 'mayoral appointee' },
  { color: '#7F77DD', label: 'state level' },
]

// ── Component ─────────────────────────────────────────────────────────────────
export default function Conclusion() {
  const [projectDrawerOpen, setProjectDrawerOpen] = useState(true)
  const [policyDrawerOpen, setPolicyDrawerOpen] = useState(true)
  // 0–3 | null — only one decision map card expanded at a time
  const [openCard, setOpenCard] = useState(null)

  function handleProjectDrawer() {
    setProjectDrawerOpen(prev => !prev)
  }

  function handlePolicyDrawer() {
    setPolicyDrawerOpen(prev => !prev)
  }

  function handleCardClick(e) {
    const idx = parseInt(e.currentTarget.dataset.cardIdx, 10)
    setOpenCard(prev => prev === idx ? null : idx)
  }

  function handleCardKeyDown(e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      const idx = parseInt(e.currentTarget.dataset.cardIdx, 10)
      setOpenCard(prev => prev === idx ? null : idx)
    }
  }

  function handleLinkClick(e) {
    e.stopPropagation()
  }

  return (
    <section>
      <div className="conc-wrap">

        {/* ── PART 1: BRIDGE ── */}
        <p className="conc-eyebrow">what comes next</p>
        <h2 className="conc-heading">
          This is how Boston's housing got here. Here's how it changes.
        </h2>
        <p className="conc-body">
          The under-building you just saw wasn't accidental. It was the result of decisions made at public
          hearings — and the voices in those rooms have not historically been the ones asking for more housing.
        </p>
        <p className="conc-eyebrow" style={{ marginTop: '2rem' }}>
          how you engage depends on where you are
        </p>
        <p className="conc-subhead">
          Two ways to push for more housing. Both matter. Pick the one that fits.
        </p>

        {/* ── PART 2: THE FORK ── */}
        <div className="conc-fork">

          {/* Card Left — Project track */}
          <div className="conc-fork-card">
            <div className="conc-fork-card-content">
              <p className="conc-fork-eyebrow conc-fork-eyebrow--owner">for anyone · project level</p>
              <h3 className="conc-fork-title">Show up to support housing at public hearings</h3>
              <p className="conc-fork-body">
                The loudest voices at Boston's development hearings are usually opposing new housing.
                Pro-housing residents are rarely in the room. Showing up — even once, even for two
                minutes — shifts that balance.
              </p>
              <a
                href="https://www.bostonplans.org/projects/development-projects"
                target="_blank"
                rel="noopener noreferrer"
                className="conc-fork-cta"
              >
                → find upcoming BPDA hearings
              </a>
            </div>

            <button className="conc-drawer-toggle" onClick={handleProjectDrawer}>
              {projectDrawerOpen ? '↑' : '↓'} never been? here's what to expect
            </button>

            <div className={`conc-drawer${projectDrawerOpen ? ' conc-drawer--open' : ''}`}>
              <div className="conc-drawer-inner">

                <div className="conc-step">
                  <p className="conc-step-num">01</p>
                  <p className="conc-step-title">Find a hearing near you</p>
                  <p className="conc-step-body">
                    BPDA lists active projects with comment dates. Pick one in your neighborhood.
                    No reason needed beyond "I live here."
                  </p>
                  <p className="conc-step-meta">takes about 5 minutes to find one</p>
                </div>

                <div className="conc-step">
                  <p className="conc-step-num">02</p>
                  <p className="conc-step-title">Show up — no preparation required</p>
                  <p className="conc-step-body">
                    Walk in, sign in, wait for public comment. No registration. No expertise.
                    Renters welcome. Hearings also held online.
                  </p>
                  <p className="conc-step-meta">most hearings run 1–2 hours</p>
                </div>

                <div className="conc-step">
                  <p className="conc-step-num">03</p>
                  <p className="conc-step-title">Say your name, your neighborhood, one sentence</p>
                  <p className="conc-step-body">2 minutes at the mic.</p>
                  <blockquote className="conc-callout">
                    "My name is [name], I live in [neighborhood], and I support this project.
                    Boston needs more housing and this is a step in the right direction."
                  </blockquote>
                  <p className="conc-step-meta">that sentence, said out loud, is more than most people do</p>
                </div>

                <div className="conc-step">
                  <p className="conc-step-num">04</p>
                  <p className="conc-step-title">Can't attend? Submit written comment.</p>
                  <p className="conc-step-body">
                    Every BPDA project has an email for written comments. Two sentences from a real
                    resident goes into the public record and is read.
                  </p>
                  <a
                    href="https://www.bostonplans.org/projects/development-projects"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="conc-step-link"
                  >
                    → find project comment emails
                  </a>
                </div>

                <div className="conc-checks">
                  <div className="conc-check">
                    <span className="conc-check-icon">✓</span>
                    <span>Open to all residents — renters, students, anyone</span>
                  </div>
                  <div className="conc-check">
                    <span className="conc-check-icon">✓</span>
                    <span>No expertise needed — lived experience counts</span>
                  </div>
                  <div className="conc-check">
                    <span className="conc-check-icon">✓</span>
                    <span>Written comment works if you can't attend in person</span>
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* Card Right — Policy track */}
          <div className="conc-fork-card">
            <div className="conc-fork-card-content">
              <p className="conc-fork-eyebrow conc-fork-eyebrow--renter">for renters &amp; non-owners · policy level</p>
              <h3 className="conc-fork-title">Push for the policies that make housing scarce</h3>
              <p className="conc-fork-body">
                If your fight isn't about one building but about why Boston housing is unaffordable to
                begin with — that's a policy fight. The laws that govern what gets built, where, and at
                what cost are set at city and state level. Your voice belongs in that conversation too.
              </p>
              <a
                href="https://www.abundanthousingma.org"
                target="_blank"
                rel="noopener noreferrer"
                className="conc-fork-cta conc-fork-cta--renter"
              >
                → Abundant Housing Massachusetts
              </a>
            </div>

            <button className="conc-drawer-toggle" onClick={handlePolicyDrawer}>
              {policyDrawerOpen ? '↑' : '↓'} where to put your energy
            </button>

            <div className={`conc-drawer${policyDrawerOpen ? ' conc-drawer--open' : ''}`}>
              <div className="conc-drawer-inner">

                <div className="conc-step">
                  <p className="conc-step-num">01</p>
                  <p className="conc-step-title">Contact your state rep about housing bills</p>
                  <p className="conc-step-body">
                    The MBTA Communities Act, accessory dwelling unit legislation, and Chapter 40B reform
                    set the conditions Boston must build within. A five-minute email on a specific bill
                    is more durable than any single project.
                  </p>
                  <a
                    href="https://malegislature.gov/Search/FindMyLegislator"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="conc-step-link"
                  >
                    → find your state rep by address
                  </a>
                </div>

                <div className="conc-step">
                  <p className="conc-step-num">02</p>
                  <p className="conc-step-title">Join a pro-housing advocacy organization</p>
                  <p className="conc-step-body">
                    Abundant Housing Massachusetts and YIMBY Action Boston track citywide policy fights,
                    alert members when votes happen, and make it easy to show up at the right moments
                    without monitoring every hearing yourself.
                  </p>
                  <blockquote className="conc-callout">
                    These organizations do the work of knowing which fights matter most right now —
                    and they need bodies, not just signatures.
                  </blockquote>
                </div>

                <div className="conc-step">
                  <p className="conc-step-num">03</p>
                  <p className="conc-step-title">Vote on housing in every local election</p>
                  <p className="conc-step-body">
                    Boston's housing policy is shaped by who sits in the mayor's office and who controls
                    city council. For a renter who moves every few years, electoral engagement shapes
                    the whole environment.
                  </p>
                  <a
                    href="https://www.boston.gov/departments/city-council"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="conc-step-link"
                  >
                    → find your city councilor
                  </a>
                </div>

                <div className="conc-step">
                  <p className="conc-step-num">04</p>
                  <p className="conc-step-title">Know your rights as a renter</p>
                  <p className="conc-step-body">
                    If you're facing a rent increase or displacement pressure, tenant organizing is civic
                    engagement that directly addresses your housing situation right now.
                  </p>
                  <a
                    href="https://www.bostontenant.org"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="conc-step-link"
                  >
                    → Boston Tenant Coalition
                  </a>
                </div>

                <div className="conc-checks">
                  <div className="conc-check">
                    <span className="conc-check-icon">✓</span>
                    <span>Policy change outlasts any single building decision</span>
                  </div>
                  <div className="conc-check">
                    <span className="conc-check-icon">✓</span>
                    <span>Especially effective for renters and people who move often</span>
                  </div>
                  <div className="conc-check">
                    <span className="conc-check-icon">✓</span>
                    <span>Organizations track the right moments so you don't have to</span>
                  </div>
                </div>

              </div>
            </div>
          </div>

        </div>

        {/* ── PART 3: ASYMMETRY NOTE ── */}
        <div className="conc-asymmetry">
          The typical first-time buyer is now 40. In 1992 they were 28. Ten years of equity, delayed. That shortage
          was debated in public hearings and in legislative chambers. Most of those seats were empty.
        </div>

        {/* ── PART 4: DECISION MAP ── */}
        <hr className="div" />

        <p className="conc-eyebrow">who runs those hearings</p>

        <div className="conc-map-legend">
          {LEGEND_DOTS.map(d => (
            <div key={d.label} className="conc-map-legend-item">
              <div className="conc-map-dot" style={{ background: d.color }} />
              {d.label}
            </div>
          ))}
        </div>

        <div className="conc-map-grid">
          {DECISION_CARDS.map((card, idx) => (
            <div
              key={card.name}
              className={`conc-map-card${openCard === idx ? ' conc-map-card--active' : ''}`}
              onClick={handleCardClick}
              onKeyDown={handleCardKeyDown}
              data-card-idx={idx}
              role="button"
              tabIndex={0}
            >
              <span className="conc-map-expand">+</span>

              <p className="conc-map-card-scope">{card.scope}</p>
              <p className="conc-map-card-name">{card.name}</p>
              <p className="conc-map-card-desc">{card.desc}</p>
              <span className="conc-map-tag" style={TAG_STYLES[card.tag]}>{card.tag}</span>

              <div className={`conc-map-drawer${openCard === idx ? ' conc-map-drawer--open' : ''}`}>
                <div className="conc-map-drawer-inner">
                  <div className="conc-map-row">
                    <span className="conc-map-row-label">controls</span>
                    <span className="conc-map-row-val">{card.controls}</span>
                  </div>
                  <div className="conc-map-row">
                    <span className="conc-map-row-label">show up</span>
                    <span className="conc-map-row-val">{card.showUp}</span>
                  </div>
                  <div className="conc-map-fact">{card.fact}</div>
                  <a
                    href={card.linkHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="conc-map-link"
                    onClick={handleLinkClick}
                  >
                    {card.linkText}
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── PART 5: COMPARISON CITIES ── */}
        <hr className="div" />

        <p className="conc-eyebrow">other cities made different choices</p>

        <div className="conc-compare-cards">
          <div className="conc-compare-card">
            <p className="conc-compare-city">Minneapolis, MN</p>
            <p className="conc-compare-fact">
              Eliminated single-family-only zoning citywide. Permit applications{' '}
              <strong style={{ color: 'var(--owner-color)', fontWeight: 700 }}>doubled</strong>{' '}
              within two years.
            </p>
            <p className="conc-compare-note">policy change: 2019 · results visible by 2021</p>
          </div>
          <div className="conc-compare-card">
            <p className="conc-compare-city">Vienna, Austria</p>
            <p className="conc-compare-fact">
              Has kept{' '}
              <strong style={{ color: 'var(--owner-color)', fontWeight: 700 }}>60%</strong>{' '}
              of residents in subsidized housing since the 1920s. Average rents are roughly a third of Boston's.
            </p>
            <p className="conc-compare-note">sustained over a century of municipal commitment</p>
          </div>
        </div>

        <p className="conc-closing-prose">
          The current situation in Boston is not a law of nature. It is the accumulated result of
          choices — which means it can be the result of different choices.
        </p>


      </div>
    </section>
  )
}
