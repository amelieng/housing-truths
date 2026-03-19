import { useState } from 'react'
import { loadData } from './utils/parseData'
import Header from './components/Header'
import SummaryStrip from './components/SummaryStrip'
import CrescentChart from './components/CrescentChart'
import RatioChart from './components/RatioChart'
import NarrativeCards from './components/NarrativeCards'
import Tooltip from './components/Tooltip'

const { permitData, demandData, demandByYear, ratioData } = loadData()

export default function App() {
  const [showDemand, setShowDemand] = useState(true)
  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, content: null })

  return (
    <div className="page">
      <iframe
        src="/viz2.html"
        title="The House That Income Can't Reach"
        style={{
          width: '100%',
          height: '980px',
          border: 'none',
          display: 'block',
          marginBottom: '56px',
        }}
        scrolling="no"
      />

      <hr className="div" style={{ marginTop: 0 }} />

      <Header />

      <SummaryStrip
        permitData={permitData}
        demandByYear={demandByYear}
        ratioData={ratioData}
      />

      <CrescentChart
        permitData={permitData}
        demandData={demandData}
        demandByYear={demandByYear}
        showDemand={showDemand}
        onToggleDemand={() => setShowDemand(v => !v)}
        onTooltip={setTooltip}
      />

      <div className="ratio-wrap" style={{ opacity: showDemand ? 1 : 0.3 }}>
        <div className="ratio-label">
          Permit-to-Household Ratio · Units permitted per 100 new households
        </div>
        <RatioChart ratioData={ratioData} onTooltip={setTooltip} />
      </div>

      <div className="note">
        <strong>How to read this:</strong> Circle size = total units permitted (√units × scale
        factor). The paper-colored void = single-family units removed from the blue mass — what's
        missing from multifamily growth made visible. The orange trace shows annual household
        formation for Suffolk County from U.S. Census ACS 5-year estimates.{' '}
        <strong>Gap years</strong> (incomplete 12-month reporting) are shown as dashed connectors
        — neither supply nor demand data is interpolated for those years.
      </div>

      <hr className="div" />

      <NarrativeCards />

      <Tooltip {...tooltip} />
    </div>
  )
}
