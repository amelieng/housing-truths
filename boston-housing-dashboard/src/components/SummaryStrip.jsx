export default function SummaryStrip({ permitData, demandByYear, ratioData }) {
  // Peak supply year (non-gap years only)
  const nonGap = permitData.filter(d => !d.gap && d.tot > 0)
  const peakYear = nonGap.reduce((a, b) => (a.tot > b.tot ? a : b), nonGap[0])

  // Most recent year with both permit data and hh_new (for supply gap %)
  const latestRatio = [...ratioData].sort((a, b) => b.year - a.year)[0]
  const supplyGapPct = latestRatio
    ? Math.round((latestRatio.ratio - 100))
    : null

  // Latest calendar year in permit data
  const latestPermit = [...permitData].sort((a, b) => b.year - a.year)[0]

  // Years below equilibrium (ratio < 100) out of all years with ratio data
  const yearsBelow = ratioData.filter(d => d.ratio < 100).length

  return (
    <div className="strip">
      <div className="strip-cell">
        <div className="strip-label">Peak Supply Year</div>
        <div className="strip-val">{peakYear?.year ?? '—'}</div>
        <div className="strip-sub">
          {peakYear ? `${peakYear.tot.toLocaleString()} units permitted` : ''}
        </div>
      </div>

      <div className="strip-cell">
        <div className="strip-label">{latestRatio?.year} Supply Gap</div>
        <div className={`strip-val ${supplyGapPct !== null && supplyGapPct < 0 ? 'red' : 'green'}`}>
          {supplyGapPct !== null
            ? `${supplyGapPct > 0 ? '+' : ''}${supplyGapPct}%`
            : '—'}
        </div>
        <div className="strip-sub">
          {latestRatio
            ? `${latestRatio.tot.toLocaleString()} units permitted vs. ${latestRatio.hh_new.toLocaleString()} new households`
            : ''}
        </div>
      </div>

      <div className="strip-cell">
        <div className="strip-label">{latestPermit?.year} Permitted</div>
        <div className={`strip-val ${!demandByYear[latestPermit?.year]?.hh_new ? '' : latestPermit?.tot < demandByYear[latestPermit?.year]?.hh_new ? 'red' : 'green'}`}>
          {latestPermit ? latestPermit.tot.toLocaleString() : '—'}
        </div>
        <div className="strip-sub">total units permitted</div>
      </div>

      <div className="strip-cell">
        <div className="strip-label">Below Equilibrium</div>
        <div className="strip-val amber">
          {yearsBelow} of {ratioData.length}
        </div>
        <div className="strip-sub">
          years where permits fell below new household formation
        </div>
      </div>
    </div>
  )
}
