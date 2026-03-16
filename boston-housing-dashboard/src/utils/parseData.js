import demandRaw from '../../data/boston_demand_data.csv?raw'
import permitRaw from '../../data/boston_building_permit_data.csv?raw'

function parseLines(text) {
  return text.trim().split('\n').filter(l => l.trim())
}

function rowsFromLines(lines, headerIndex = 0, dataStart = 1) {
  const headers = lines[headerIndex].split(',').map(h => h.trim()).filter(Boolean)
  return lines.slice(dataStart).map(line => {
    const vals = line.split(',')
    const obj = {}
    headers.forEach((h, i) => { obj[h] = (vals[i] ?? '').trim() })
    return obj
  })
}

export function loadData() {
  // ── DEMAND / CENSUS CSV ──
  // Columns: year, total_permitted, sf, mf, population, households,
  //          hh_growth, permit_to_hh_ratio, units_per_1k_pop,
  //          total_units, occupied, vacant, vacancy_rate,
  //          owner_occ, renter_occ, owner_pct,
  //          med_income, owner_income, renter_income
  const demandLines = parseLines(demandRaw)
  const demandRows  = rowsFromLines(demandLines)

  const demandByYear = {}
  demandRows.forEach(r => {
    const year = parseInt(r.year)
    if (isNaN(year)) return
    demandByYear[year] = {
      year,
      // permit counts (used as fallback for years not in building permit CSV)
      total_permitted: r.total_permitted ? parseInt(r.total_permitted) : 0,
      sf: r.sf ? parseInt(r.sf) : 0,
      mf: r.mf ? parseInt(r.mf) : 0,
      // census indicators — only populated for years with ACS data
      households:   r.households   && r.households   !== '' ? parseInt(r.households)   : null,
      hh_new:       r.hh_growth    && r.hh_growth    !== '' ? parseFloat(r.hh_growth)  : null,
      vacancy_rate: r.vacancy_rate && r.vacancy_rate !== '' ? parseFloat(r.vacancy_rate) : null,
      med_income:   r.med_income   && r.med_income   !== '' ? parseInt(r.med_income)   : null,
    }
  })

  // ── BUILDING PERMIT CSV ──
  // Two-row header: row 0 = human-readable, row 1 = short codes
  // Columns: seq_id, muni_id, municipal, cal_year, months_rep,
  //          tot_b, tot_units, sf_b, sf_units, …
  // Coverage: Boston rows for 1980–2001 and 2024 only.
  const permitLines = parseLines(permitRaw)
  const permitRows  = rowsFromLines(permitLines, 1, 2)  // header = row 1, data from row 2

  const buildingPermitByYear = {}
  permitRows
    .filter(r => r.municipal === 'Boston')
    .forEach(r => {
      const year = parseInt(r.cal_year)
      if (isNaN(year)) return
      const months = parseInt(r.months_rep) || 0
      buildingPermitByYear[year] = {
        year,
        tot:   parseInt(r.tot_units) || 0,
        sf:    parseInt(r.sf_units)  || 0,
        mf:    parseInt(r.mf_units)  || 0,
        bldgs: parseInt(r.tot_b)     || 0,
        months,
        // gap = partial-year reporting (1–11 months); 0 or 12 = full year
        gap: months > 0 && months < 12,
      }
    })

  // ── MERGE into a single permit array ──
  // Prefer building permit CSV (has bldgs count + gap flag).
  // Fall back to demand CSV for years not in building permit CSV.
  // Mark a year as gap if it appears in neither source.
  const allYears = Array.from({ length: 2024 - 1980 + 1 }, (_, i) => 1980 + i)

  const permitData = allYears.map(year => {
    const bp = buildingPermitByYear[year]
    const dm = demandByYear[year]

    if (bp) {
      // Building permit CSV is the authoritative source for this year
      return bp
    } else if (dm && dm.total_permitted > 0) {
      // Only demand CSV has this year — no gap flag, no bldgs count
      return {
        year,
        tot:   dm.total_permitted,
        sf:    dm.sf,
        mf:    dm.mf,
        bldgs: null,  // not available in demand CSV
        months: 12,
        gap:   false,
      }
    } else {
      // Year is absent from both sources → data gap
      return { year, tot: 0, sf: 0, mf: 0, bldgs: null, months: 0, gap: true }
    }
  })

  // ── DEMAND array (years that have hh_new / household formation data) ──
  const demandData = Object.values(demandByYear)
    .filter(d => d.hh_new !== null)
    .sort((a, b) => a.year - b.year)

  // ── RATIO: permits per 100 new households ──
  const ratioData = permitData
    .filter(d => !d.gap && d.tot > 0)
    .filter(d => demandByYear[d.year]?.hh_new > 0)
    .map(d => ({
      year:   d.year,
      ratio:  (d.tot / demandByYear[d.year].hh_new) * 100,
      tot:    d.tot,
      hh_new: demandByYear[d.year].hh_new,
    }))

  return { permitData, demandData, demandByYear, ratioData }
}
