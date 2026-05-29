import { useState } from 'react'
import { loadData } from './utils/parseData'
import Tooltip from './components/Tooltip'
import AffordabilityChart from './components/AffordabilityChart'
import RenterGuess from './components/RenterGuess'
import FirstTimeBuyer from './components/FirstTimeBuyer'
import Conclusion from './components/Conclusion'
import SupplyGapChart from './components/SupplyGapChart'

const { permitData, demandData, demandByYear } = loadData()

export default function App() {
  const [showDemand, setShowDemand] = useState(true)
  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, content: null })

  return (
    <div>

      {/* ── Feedback tab ── */}
      <a
        href="mailto:housing@goinvo.com"
        style={{
          position: 'fixed',
          top: 0,
          right: '24px',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          padding: '8px 14px',
          background: '#FFFFFF',
          border: '1px solid var(--border)',
          borderTop: 'none',
          borderRadius: '0 0 6px 6px',
          fontFamily: 'var(--font-data)',
          fontSize: '11px',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: 'var(--text-secondary)',
          textDecoration: 'none',
          cursor: 'pointer',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          transition: 'background 0.15s ease, color 0.15s ease',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = '#FFFFFF'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
      >
        Feedback
      </a>


      {/* ── Section 1: Renter / homeowner ratio ── */}
      <section className="scroll-section">
        <RenterGuess />
      </section>

      {/* ── Section 2: First-time buyers ── */}
      <section className="scroll-section">
        <FirstTimeBuyer />
      </section>

      {/* ── Section 3: Affordability calculator ── */}
      <section className="scroll-section">
        <AffordabilityChart />
      </section>

      {/* ── Section 4: Supply gap ── */}
      <section className="scroll-section">
        <SupplyGapChart />
      </section>

      {/* ── Section 5: Conclusion ── */}
      <Conclusion />

      {/* ── Authors + Sources ── */}
      <div style={{ borderTop: '1px solid var(--border)', marginTop: '64px' }} />
      <footer style={{
        padding: '32px 20px 64px',
        maxWidth: '720px',
        margin: '0 auto',
        boxSizing: 'border-box',
      }}>

        {/* Authors */}
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <p style={{
            fontFamily: 'var(--font-data)',
            fontSize: '11px',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'var(--text-muted)',
            marginBottom: '12px',
          }}>Authors</p>
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '32px',
            fontFamily: 'var(--font-body)',
            fontSize: '15px',
            color: 'var(--text-secondary)',
          }}>
            <span>Amelie Eng</span>
            <span>Juhan Sonin</span>
            <span>Chloe Ma</span>
          </div>
        </div>

        {/* Sources */}
        <div>
          <p style={{
            fontFamily: 'var(--font-data)',
            fontSize: '11px',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'var(--text-muted)',
            marginBottom: '16px',
            textAlign: 'center',
          }}>References</p>
          <ol style={{
            fontFamily: 'var(--font-body)',
            fontSize: '13px',
            color: 'var(--text-secondary)',
            lineHeight: '1.7',
            paddingLeft: '18px',
            marginBottom: '28px',
          }}>
            <li>NAR Profile of Home Buyers and Sellers, 2024–2025 — first-time buyer age trends (1981–2025), national data</li>
            <li>Boston Indicators, Greater Boston Housing Report Card, 2025 — household income required to afford a starter home in Boston</li>
            <li>Redfin Data Center, 2012–2024 — Boston home price data</li>
            <li>PropertyShark / MAR, 2005–2011 — historical Boston home price data</li>
            <li>U.S. Census ACS 1-year, Table B19013 — median household income</li>
            <li>U.S. Census ACS 1-year, Table B19019 — household income by household size</li>
            <li>U.S. Census ACS 2016–2020 5-year estimates — housing conditions</li>
            <li>U.S. Census Bureau, Building Permits Survey — annual permit data</li>
            <li>ACS Table B11001 (Household Type) — household formation / demand estimates</li>
            <li>Freddie Mac PMMS 30-year fixed (Primary Mortgage Market Survey) — mortgage rate data</li>
            <li>BLS OEWS (Occupational Employment and Wage Statistics) — occupation wage data</li>
            <li>Warren Group — Greater Boston median condo sale price, 2023</li>
            <li>Boston Mayor's Office of Housing, 2022 Housing Conditions Report — renter/homeowner ratio</li>
          </ol>

          <p style={{
            fontFamily: 'var(--font-data)',
            fontSize: '11px',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'var(--text-muted)',
            marginBottom: '10px',
          }}>Methodology</p>
          <ul style={{
            fontFamily: 'var(--font-body)',
            fontSize: '13px',
            color: 'var(--text-secondary)',
            lineHeight: '1.7',
            paddingLeft: '18px',
          }}>
            <li>20% down payment assumed for all mortgage calculations</li>
            <li>1-person household income derived as median 2-person income × 0.67 (proxy — not directly in source data)</li>
            <li>2024 household demand estimated</li>
            <li>BLS wage data interpolated for some years</li>
            <li>Stepped demand baseline (supply gap chart): The "estimated true need" line is a constructed estimate, not a single published figure. It combines annual household formation (~2,500/yr, from ACS B11001) and an estimated backlog absorption rate that rises over time as cumulative underproduction compounds. Tiers: ~3,000/yr (1997–2001), ~4,000/yr (2002–2014), ~5,000/yr (2015–2024). The 2015 step-up is grounded in regional housing targets from EOHLC and the Metro Mayors Coalition; earlier tiers are proportional estimates derived from the Pioneer Institute's job-to-permit ratio finding and the known gap years in permit data. This estimate will be revised if Boston-specific backlog figures become available from a primary source.</li>
            <li>Gap years in permit data: Years with no MA DHCD permit records (1985–1989, 1991, 1993–1996, 2005, 2008–2011) are excluded from supply totals and chart calculations. They are not treated as zero-permit years.</li>
          </ul>
        </div>

      </footer>

    </div>
  )
}
