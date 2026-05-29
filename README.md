Housing Truths
A data storytelling site about Boston's housing crisis.

You can't engage with what you can't see.

Housing Truths is an interactive civic data journalism project that makes the systemic forces behind Boston's housing crisis visible — for residents, renters, first-time buyers, and policymakers alike. Built as a co-op project with GoInvo and the Center for Design at Northeastern University.
→ View the live site

The Story
Boston has been a renter city for decades. Two out of three households rent. The window to own keeps closing. The city never built enough. And most people have never seen it laid out like this.
Housing Truths tells that story across six interactive sections — moving from who Boston is, to how affordability collapsed, to what you can do about it.
SectionHeadingWhat it shows1How many Bostonians do you think own their home?Renter/homeowner ratio reveal with interactive guess + comparison to MA and U.S.2First-time buyers are now 40. Their parents were 29.Typographic portrait of who first-time buyers are today vs. a generation ago3The average Boston salary can no longer afford the average Boston home.Affordability calculator — median income vs. median mortgage, with occupational lens and household size4Boston never built enough.Crescent chart of housing permits (2001–2023) against household demand — the supply gap visualized5ConclusionPrimary action ask + two-track civic engagement fork (neighborhood-level vs. policy-level)

Design Principles

Resident framing first — tooltips and copy lead with plain-language significance before raw numbers
Psychologically inclusive civic engagement — the conclusion offers parallel on-ramps for renters and homeowners, recognizing that "show up to a hearing" is homeowner-coded
Causal chain narrative — each section has a clear job in a through-line: Boston rents → renters buy late → prices outran wages → the city underbuilt → here's who controls the levers
Era labels reference real history — not data-derived names (e.g. "Massachusetts Miracle" instead of "Build Boom")
Pre-COVID 2019 baseline — most intuitive reference point for public comprehension of trend data


Data Sources
DataSourceRenter/homeowner ratio (65%)Boston Mayor's Office of Housing, 2022 Housing Conditions Report (ACS 2016–2020 5-year estimates)First-time buyer age shift (29→40)National Association of Realtors, Profile of Home Buyers and SellersMedian condo sale price ($599,000)Warren Group / Greater Boston Association of Realtors, 2023Rent change (2013–2023)ACS, U.S. Census BureauHousing permits (2001–2023)MA DHCD Building Permit SurveyHousehold demand estimatesCensus Bureau Population Estimates Program

Tech Stack

Framework: React + Vite
Styling: CSS custom properties (GoInvo design system)
Deployment: Netlify (netlify.toml at repo root)
Typography: Oswald (headings), Lato (body), DM Mono (data labels)
Semantic colors: #8B4A4A (renter) / #4A7C74 (homeowner)

Local Development
bashcd boston-housing-dashboard
npm install
npm run dev
Preview at localhost:5173.

Project Context
This project grew out of a broader civic dashboard concept exploring economic stability, health, education, and housing in Boston. The housing pillar became its own standalone narrative site.
Design references: GoInvo civic health work, Giorgia Lupi–style annotated data storytelling.
Built by Amelie Eng — GoInvo × Center for Desig
Repo: github.com/amelieng/housing-truths
