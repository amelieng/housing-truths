"""
Boston ACS puller — household size income + income distribution
===============================================================

Outputs:
  - household_income_by_size.csv
  - income_distribution.csv

Geography:
  Boston city, Massachusetts
  state=25, place=07000

Tables:
  - B19019: Median household income by household size
  - B19001: Household income distribution

Usage:
  1. pip install requests pandas
  2. Set your Census API key:
       export CENSUS_API_KEY="your_key_here"
     or on Windows PowerShell:
       $env:CENSUS_API_KEY="your_key_here"
  3. Run:
       python boston_affordability_lenses_pull.py

Notes:
  - Default dataset is ACS 1-year.
  - If a year is unavailable, the script falls back to ACS 5-year.
  - Output is tidy and ready for visualization work.
"""

import os
import time
import requests
import pandas as pd

API_KEY = os.environ.get("CENSUS_API_KEY", "").strip()

STATE = "25"
PLACE = "07000"
YEARS = list(range(2005, 2024))  # adjust as needed

BASE_URL = "https://api.census.gov/data"

if not API_KEY:
    raise ValueError("Missing CENSUS_API_KEY environment variable.")

# ─────────────────────────────────────────────────────────────
# Table B19019 — Median household income by household size
# See ACS metadata for exact labels by year if needed.
# Common mapping used here:
#   B19019_001E = total
#   B19019_002E = 2-person
#   B19019_003E = 3-person
#   B19019_004E = 4-person
#   B19019_005E = 5-person
#   B19019_006E = 6-person
#   B19019_007E = 7+ person
#
# There is no 1-person median directly in B19019.
# We derive a practical "1-person proxy" from ACS table B19037 if available,
# otherwise leave blank.
# To keep this script robust and simple, we only use B19019 directly here
# and output 2,3,4,5,6,7+ plus total.
# If you need exact 1-person medians, add B19037 in a second pull.
# ─────────────────────────────────────────────────────────────

B19019_VARS = {
    "B19019_001E": "median_income_all_households",
    "B19019_002E": "median_income_2_person",
    "B19019_003E": "median_income_3_person",
    "B19019_004E": "median_income_4_person",
    "B19019_005E": "median_income_5_person",
    "B19019_006E": "median_income_6_person",
    "B19019_007E": "median_income_7plus_person",
}

# ─────────────────────────────────────────────────────────────
# Table B19001 — Household income distribution
# 001 = total households
# 002..017 = brackets
# ─────────────────────────────────────────────────────────────

B19001_VARS = {
    "B19001_001E": "total_households",
    "B19001_002E": "lt_10k",
    "B19001_003E": "10k_15k",
    "B19001_004E": "15k_20k",
    "B19001_005E": "20k_25k",
    "B19001_006E": "25k_30k",
    "B19001_007E": "30k_35k",
    "B19001_008E": "35k_40k",
    "B19001_009E": "40k_45k",
    "B19001_010E": "45k_50k",
    "B19001_011E": "50k_60k",
    "B19001_012E": "60k_75k",
    "B19001_013E": "75k_100k",
    "B19001_014E": "100k_125k",
    "B19001_015E": "125k_150k",
    "B19001_016E": "150k_200k",
    "B19001_017E": "200k_plus",
}


def fetch_acs(year: int, variables: dict, dataset: str) -> dict | None:
    url = f"{BASE_URL}/{year}/{dataset}"
    params = {
        "get": ",".join(["NAME"] + list(variables.keys())),
        "for": f"place:{PLACE}",
        "in": f"state:{STATE}",
        "key": API_KEY,
    }

    try:
        r = requests.get(url, params=params, timeout=30)
        r.raise_for_status()
        data = r.json()
        if len(data) < 2:
            return None
        row = dict(zip(data[0], data[1]))
        return row
    except requests.RequestException:
        return None


def parse_int(value):
    if value in (None, "", "-666666666", "-555555555", "null"):
        return None
    try:
        return int(value)
    except ValueError:
        return None


def fetch_with_fallback(year: int, variables: dict) -> tuple[dict | None, str | None]:
    # Try ACS 1-year first, then 5-year
    for dataset, label in [("acs/acs1", "ACS 1-year"), ("acs/acs5", "ACS 5-year")]:
        row = fetch_acs(year, variables, dataset)
        if row is not None:
            return row, label
        time.sleep(0.25)
    return None, None


def build_household_income_by_size() -> pd.DataFrame:
    rows = []

    for year in YEARS:
        row, source = fetch_with_fallback(year, B19019_VARS)
        if row is None:
            print(f"[B19019] {year}: failed")
            continue

        out = {"year": year, "source": source}
        for var, label in B19019_VARS.items():
            out[label] = parse_int(row.get(var))

        rows.append(out)
        print(f"[B19019] {year}: ok ({source})")

        time.sleep(0.25)

    df = pd.DataFrame(rows).sort_values("year").reset_index(drop=True)
    return df


def build_income_distribution() -> pd.DataFrame:
    rows = []

    for year in YEARS:
        row, source = fetch_with_fallback(year, B19001_VARS)
        if row is None:
            print(f"[B19001] {year}: failed")
            continue

        out = {"year": year, "source": source}
        for var, label in B19001_VARS.items():
            out[label] = parse_int(row.get(var))

        total = out.get("total_households")

        # Optional rollups for easy lensing
        low_income = sum(
            x or 0
            for x in [
                out.get("lt_10k"),
                out.get("10k_15k"),
                out.get("15k_20k"),
                out.get("20k_25k"),
                out.get("25k_30k"),
                out.get("30k_35k"),
                out.get("35k_40k"),
                out.get("40k_45k"),
                out.get("45k_50k"),
            ]
        )
        middle_income = sum(
            x or 0
            for x in [
                out.get("50k_60k"),
                out.get("60k_75k"),
                out.get("75k_100k"),
                out.get("100k_125k"),
            ]
        )
        high_income = sum(
            x or 0
            for x in [
                out.get("125k_150k"),
                out.get("150k_200k"),
                out.get("200k_plus"),
            ]
        )

        out["low_income_under_50k"] = low_income
        out["middle_income_50k_to_125k"] = middle_income
        out["high_income_125k_plus"] = high_income

        if total and total > 0:
            out["pct_low_income_under_50k"] = round(low_income / total * 100, 2)
            out["pct_middle_income_50k_to_125k"] = round(middle_income / total * 100, 2)
            out["pct_high_income_125k_plus"] = round(high_income / total * 100, 2)
        else:
            out["pct_low_income_under_50k"] = None
            out["pct_middle_income_50k_to_125k"] = None
            out["pct_high_income_125k_plus"] = None

        rows.append(out)
        print(f"[B19001] {year}: ok ({source})")

        time.sleep(0.25)

    df = pd.DataFrame(rows).sort_values("year").reset_index(drop=True)
    return df


def main():
    income_size_df = build_household_income_by_size()
    dist_df = build_income_distribution()

    income_size_path = "household_income_by_size.csv"
    dist_path = "income_distribution.csv"

    income_size_df.to_csv(income_size_path, index=False)
    dist_df.to_csv(dist_path, index=False)

    print("\nDone.")
    print(f"Wrote: {income_size_path}")
    print(f"Wrote: {dist_path}")


if __name__ == "__main__":
    main()