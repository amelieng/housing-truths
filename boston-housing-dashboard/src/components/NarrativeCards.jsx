const CARDS = [
  {
    stat:  '1989–1996',
    color: 'red',
    hed:   'S&L Collapse ends the Miracle — permits hit a 40-year low',
    body:  'The Massachusetts Miracle unraveled as the regional economy turned down in 1989 and the Savings & Loan crisis hit hard in 1990. By 1992, Boston permitted just 100 units — its lowest recorded total. Recovery was slow through the mid-1990s.',
  },
  {
    stat:  '1997–2007',
    color: 'green',
    hed:   "Menino's \"Leading the Way\" drives a decade of growth",
    body:  'Mayor Menino took office in 1993 and launched his "Leading the Way" housing initiative in 2000, targeting 20,000 new units over a decade. Permits climbed steadily, peaking pre-crisis at 2,419 in 2006, before the Financial Crisis froze construction.',
  },
  {
    stat:  '2012–2021',
    color: 'green',
    hed:   'Menino–Walsh era: the biggest build surge in modern Boston history',
    body:  'The surge began under Menino\'s final years (2012–13) and accelerated under Mayor Walsh\'s "Housing a Changing City: Boston 2030" plan (October 2014). Permits peaked at 5,085 in 2017. Even COVID didn\'t break the era — 2020 and 2021 stayed well above the 2019 baseline.',
  },
  {
    stat:  '2022–2024',
    color: 'red',
    hed:   'Rate shock — not COVID — killed the pipeline',
    body:  "The Fed's aggressive hikes from March 2022 sent mortgage rates briefly to 8% in 2023, stalling multifamily financing nationwide. By 2023, Boston permitted only 2,051 units — a 60% drop from the 2017 peak. The 2024 total of 1,789 units remains well below pre-rate-shock levels.",
  },
]

export default function NarrativeCards() {
  return (
    <div className="narrative-grid">
      {CARDS.map(card => (
        <div key={card.stat} className="narr-card">
          <div className={`narr-stat ${card.color}`}>{card.stat}</div>
          <div className="narr-card-hed">{card.hed}</div>
          <div className="narr-card-body">{card.body}</div>
        </div>
      ))}
    </div>
  )
}
