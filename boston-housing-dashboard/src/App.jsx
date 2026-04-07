import { useState } from 'react'
import { loadData } from './utils/parseData'
import CrescentChart from './components/CrescentChart'
import Tooltip from './components/Tooltip'
import AffordabilityChart from '../../src/components/AffordabilityChart'
import RenterGuess from './components/RenterGuess'
import FirstTimeBuyer from './components/FirstTimeBuyer'
import Conclusion from './components/Conclusion'

const { permitData, demandData, demandByYear } = loadData()

export default function App() {
  const [showDemand, setShowDemand] = useState(true)
  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, content: null })

  return (
    <div>

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

      {/* ── Section 4: Crescent supply/demand chart ── */}
      <section className="scroll-section">
        <div className="section-inner section-inner--heading-only">
          <h2 className="section-heading">
            Boston has been under-building for 40 years.
          </h2>
          <p className="section-subhead">
            It's not that no one saw this coming. It's that not enough was built anyway.
          </p>
          <p className="pre-viz-copy">
            Each shape is one year of permitted housing. Its size encodes total units built; its hollow core encodes single-family units as absence. The orange trace is how many new homes Boston actually needed. When shapes fall below that line, the city fell behind.
          </p>
        </div>
        <CrescentChart
          permitData={permitData}
          demandData={demandData}
          demandByYear={demandByYear}
          showDemand={showDemand}
          onToggleDemand={() => setShowDemand(v => !v)}
          onTooltip={setTooltip}
        />
      </section>

      <Tooltip {...tooltip} />

      {/* ── Section 5: Conclusion ── */}
      <Conclusion />

    </div>
  )
}
