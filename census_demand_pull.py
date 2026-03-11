"""
Boston Housing Demand — Census Data Puller
==========================================
Pulls three demand indicators for Boston from the Census Bureau:
  1. Annual population estimates (2010–2023)
  2. Total households (ACS 5-year, 2005–2023)
  3. Housing vacancy rate (ACS 5-year, 2005–2023)
  4. Owner vs. renter occupied households (ACS 5-year, 2005–2023)

HOW TO RUN:
-----------
1. Install dependencies (one time only):
      pip3 install requests pandas openpyxl

2. Get a free Census API key at:
      https://api.census.gov/data/key_signup.html

3. Paste your key below where it says YOUR_KEY_HERE

4. Run the script:
      python3 census_demand_pull.py

OUTPUT:
-------
  boston_demand_data.xlsx   — Excel workbook with all indicators
  boston_demand_data.csv    — flat CSV for use in visualization
"""

import requests
import pandas as pd
import time
import sys

# ─────────────────────────────────────────
# CONFIGURATION — paste your key here
# ─────────────────────────────────────────
API_KEY = "e394c7e44d5d56a7ebe2ce7eb34543ca706fdfa9"

# Boston = Suffolk County, MA
# FIPS: state=25, county=025
STATE  = "25"
COUNTY = "025"

# ─────────────────────────────────────────
# HELPER
# ─────────────────────────────────────────
def fetch(url, params):
    """Make a Census API request and return parsed JSON."""
    try:
        r = requests.get(url, params=params, timeout=20)
        r.raise_for_status()
        data = r.json()
        cols = data[0]
        rows = data[1:]
        return pd.DataFrame(rows, columns=cols)
    except requests.exceptions.HTTPError as e:
        print(f"  HTTP error: {e}")
        print(f"  URL: {r.url}")
        return None
    except Exception as e:
        print(f"  Error: {e}")
        return None

# ─────────────────────────────────────────
# CHECK API KEY
# ─────────────────────────────────────────
# Strip any accidental whitespace or quotes around the key
API_KEY = API_KEY.strip().strip('"').strip("'").strip()

if not API_KEY:
    print("ERROR: You need to add your Census API key.")
    print("Get a free key at: https://api.census.gov/data/key_signup.html")
    print("Then open this script and replace YOUR_KEY_HERE with your key.")
    sys.exit(1)

print(f"  API key loaded: {API_KEY[:6]}...{API_KEY[-4:]} ({len(API_KEY)} chars)")

print("="*60)
print("  Boston Housing Demand — Census Data Puller")
print("="*60)


# ─────────────────────────────────────────
# DATASET 1: POPULATION ESTIMATES (2010–2023)
# ─────────────────────────────────────────
# Source: Census Bureau Population Estimates Program
# Geography: Suffolk County (includes Boston, Chelsea, Revere, Winthrop)
# Variables: POP = total population estimate
print("\n[1/4] Pulling population estimates (2010-2023)...")

# Census PEP API uses different vintage endpoints by year range:
# 2010-2019: vintage 2019 endpoint, DATE_CODE 3-12
# 2020-2023: vintage 2023 endpoint, DATE_CODE 1-4
pop_rows = []

# 2010-2019
url = "https://api.census.gov/data/2019/pep/population"
params = {
    "get": "DATE_CODE,DATE_DESC,POP,NAME",
    "for": f"county:{COUNTY}",
    "in":  f"state:{STATE}",
    "key": API_KEY
}
df = fetch(url, params)
if df is not None:
    year_map = {str(i+3): 2010+i for i in range(10)}
    for _, row in df.iterrows():
        code = row.get("DATE_CODE")
        if code in year_map:
            y = year_map[code]
            pop = int(row["POP"])
            pop_rows.append({"year": y, "population": pop})
            print(f"  {y}: {pop:,}")
else:
    print("  2010-2019: failed")
time.sleep(0.5)

# 2020-2023
url = "https://api.census.gov/data/2023/pep/population"
params = {
    "get": "DATE_CODE,DATE_DESC,POP,NAME",
    "for": f"county:{COUNTY}",
    "in":  f"state:{STATE}",
    "key": API_KEY
}
df = fetch(url, params)
if df is not None:
    year_map2 = {"1": 2020, "2": 2021, "3": 2022, "4": 2023}
    for _, row in df.iterrows():
        code = row.get("DATE_CODE")
        if code in year_map2:
            y = year_map2[code]
            pop = int(row["POP"])
            pop_rows.append({"year": y, "population": pop})
            print(f"  {y}: {pop:,}")
else:
    print("  2020-2023: failed")
time.sleep(0.5)

pop_df = pd.DataFrame(pop_rows).sort_values("year").reset_index(drop=True)

# DATASET 2: HOUSEHOLDS + VACANCY (ACS 5-year, 2005–2023)
# ─────────────────────────────────────────
# Table B25002: Occupancy status (total units, occupied, vacant)
# Table B25003: Tenure (owner occupied, renter occupied)
# ACS 5-year estimates are available from 2009 onward (covering 2005–2009)
print("\n[2/4] Pulling households and vacancy (ACS 5-year, 2009–2023)...")

# ACS 5-year variables:
# B25001_001E  = total housing units
# B25002_002E  = occupied units
# B25002_003E  = vacant units
# B25003_002E  = owner occupied
# B25003_003E  = renter occupied
# B11001_001E  = total households

acs_vars = "NAME,B25001_001E,B25002_002E,B25002_003E,B25003_002E,B25003_003E,B11001_001E"

acs_rows = []
# ACS 5-year available from 2009 onward
for year in range(2009, 2024):
    url = f"https://api.census.gov/data/{year}/acs/acs5"
    params = {
        "get": acs_vars,
        "for": f"county:{COUNTY}",
        "in":  f"state:{STATE}",
        "key": API_KEY
    }
    df = fetch(url, params)
    if df is not None:
        total_units   = int(df["B25001_001E"].iloc[0])
        occupied      = int(df["B25002_002E"].iloc[0])
        vacant        = int(df["B25002_003E"].iloc[0])
        owner_occ     = int(df["B25003_002E"].iloc[0])
        renter_occ    = int(df["B25003_003E"].iloc[0])
        households    = int(df["B11001_001E"].iloc[0])
        vacancy_rate  = round(vacant / total_units * 100, 2) if total_units > 0 else None
        owner_pct     = round(owner_occ / occupied * 100, 2) if occupied > 0 else None

        acs_rows.append({
            "year":         year,
            "total_units":  total_units,
            "occupied":     occupied,
            "vacant":       vacant,
            "vacancy_rate": vacancy_rate,
            "owner_occ":    owner_occ,
            "renter_occ":   renter_occ,
            "owner_pct":    owner_pct,
            "households":   households,
        })
        print(f"  {year}: {households:,} households | vacancy {vacancy_rate}% | owner {owner_pct}%")
    time.sleep(0.3)

acs_df = pd.DataFrame(acs_rows)


# ─────────────────────────────────────────
# DATASET 3: MEDIAN HOUSEHOLD INCOME (ACS 5-year)
# ─────────────────────────────────────────
# B19013_001E = median household income
# B25119_002E = median income for owner households
# B25119_003E = median income for renter households
print("\n[3/4] Pulling median income — overall, owner, renter (2009–2023)...")

income_rows = []
for year in range(2009, 2024):
    url = f"https://api.census.gov/data/{year}/acs/acs5"
    params = {
        "get": "NAME,B19013_001E,B25119_002E,B25119_003E",
        "for": f"county:{COUNTY}",
        "in":  f"state:{STATE}",
        "key": API_KEY
    }
    df = fetch(url, params)
    if df is not None:
        med_income        = int(df["B19013_001E"].iloc[0])
        owner_income      = int(df["B25119_002E"].iloc[0])
        renter_income     = int(df["B25119_003E"].iloc[0])
        income_rows.append({
            "year":           year,
            "med_income":     med_income,
            "owner_income":   owner_income,
            "renter_income":  renter_income,
        })
        print(f"  {year}: median ${med_income:,} | owner ${owner_income:,} | renter ${renter_income:,}")
    time.sleep(0.3)

income_df = pd.DataFrame(income_rows)


# ─────────────────────────────────────────
# DATASET 4: HOUSING PERMITS (our existing data — for ratio calc)
# ─────────────────────────────────────────
# We already have this but include it here so the ratio calc works
print("\n[4/4] Loading existing permits data for ratio calculation...")

permits_data = [
    {"year": 1980, "sf": 55,  "mf": 1252},
    {"year": 1981, "sf": 69,  "mf": 404},
    {"year": 1982, "sf": 0,   "mf": 405},
    {"year": 1983, "sf": 69,  "mf": 438},
    {"year": 1992, "sf": 46,  "mf": 54},
    {"year": 1997, "sf": 85,  "mf": 164},
    {"year": 1998, "sf": 88,  "mf": 669},
    {"year": 1999, "sf": 127, "mf": 1020},
    {"year": 2000, "sf": 96,  "mf": 471},
    {"year": 2001, "sf": 78,  "mf": 805},
    {"year": 2002, "sf": 71,  "mf": 701},
    {"year": 2003, "sf": 100, "mf": 1408},
    {"year": 2004, "sf": 102, "mf": 977},
    {"year": 2006, "sf": 94,  "mf": 2325},
    {"year": 2007, "sf": 48,  "mf": 993},
    {"year": 2012, "sf": 40,  "mf": 1736},
    {"year": 2013, "sf": 34,  "mf": 2527},
    {"year": 2014, "sf": 48,  "mf": 2793},
    {"year": 2015, "sf": 48,  "mf": 4907},
    {"year": 2016, "sf": 56,  "mf": 3292},
    {"year": 2017, "sf": 52,  "mf": 5033},
    {"year": 2018, "sf": 49,  "mf": 3553},
    {"year": 2019, "sf": 37,  "mf": 2956},
    {"year": 2020, "sf": 24,  "mf": 3508},
    {"year": 2021, "sf": 53,  "mf": 3459},
    {"year": 2022, "sf": 53,  "mf": 3882},
    {"year": 2023, "sf": 108, "mf": 1943},
    {"year": 2024, "sf": 72,  "mf": 1717},
]
permits_df = pd.DataFrame(permits_data)
permits_df["total_permitted"] = permits_df["sf"] + permits_df["mf"]
print(f"  {len(permits_df)} years of permits data loaded")


# ─────────────────────────────────────────
# MERGE + CALCULATE RATIOS
# ─────────────────────────────────────────
print("\n  Merging datasets and calculating ratios...")

# Merge permits with ACS data on year
merged = permits_df.merge(acs_df, on="year", how="left")
merged = merged.merge(income_df, on="year", how="left")
merged = merged.merge(pop_df, on="year", how="left")

# Calculate year-over-year household growth
merged = merged.sort_values("year")
merged["hh_growth"] = merged["households"].diff()

# Permit-to-household ratio
# > 1.0 = building more than households forming (overbuilding)
# < 1.0 = building less than households forming (underbuilding)
merged["permit_to_hh_ratio"] = merged.apply(
    lambda r: round(r["total_permitted"] / r["hh_growth"], 2)
    if pd.notna(r["hh_growth"]) and r["hh_growth"] > 0 else None,
    axis=1
)

# Units per 1,000 residents (supply intensity)
merged["units_per_1k_pop"] = merged.apply(
    lambda r: round(r["total_permitted"] / r["population"] * 1000, 2)
    if pd.notna(r["population"]) and r["population"] > 0 else None,
    axis=1
)


# ─────────────────────────────────────────
# OUTPUT
# ─────────────────────────────────────────
print("\n  Writing output files...")

# Clean column order
output_cols = [
    "year", "total_permitted", "sf", "mf",
    "population", "households", "hh_growth",
    "permit_to_hh_ratio", "units_per_1k_pop",
    "total_units", "occupied", "vacant", "vacancy_rate",
    "owner_occ", "renter_occ", "owner_pct",
    "med_income", "owner_income", "renter_income",
]
output_cols = [c for c in output_cols if c in merged.columns]
output = merged[output_cols]

# CSV
output.to_csv("boston_demand_data.csv", index=False)
print("  ✓ boston_demand_data.csv")

# Excel with multiple sheets
with pd.ExcelWriter("boston_demand_data.xlsx", engine="openpyxl") as writer:
    output.to_excel(writer, sheet_name="All Data", index=False)
    if not pop_df.empty:
        pop_df.to_excel(writer, sheet_name="Population", index=False)
    if not acs_df.empty:
        acs_df.to_excel(writer, sheet_name="Households & Vacancy", index=False)
    if not income_df.empty:
        income_df.to_excel(writer, sheet_name="Income", index=False)
    permits_df.to_excel(writer, sheet_name="Permits", index=False)
print("  ✓ boston_demand_data.xlsx")

# Summary printout
print("\n" + "="*60)
print("  SUMMARY")
print("="*60)
if not output.empty:
    overlap = output[output["permit_to_hh_ratio"].notna()]
    if not overlap.empty:
        print(f"\n  Permit-to-household ratio (years with both datasets):")
        for _, row in overlap.iterrows():
            ratio = row["permit_to_hh_ratio"]
            flag  = "OVER" if ratio > 1.0 else "UNDER"
            print(f"  {int(row['year'])}: {ratio:.2f}  [{flag}building]")
    if "vacancy_rate" in output.columns:
        vac = output[output["vacancy_rate"].notna()]
        if not vac.empty:
            print(f"\n  Vacancy rate range: {vac['vacancy_rate'].min()}% – {vac['vacancy_rate'].max()}%")

print("\n  Done. Add both files to your boston-civic-dashboard/data/ folder.")
print("="*60)