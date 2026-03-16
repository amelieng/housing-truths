export default function Header() {
  return (
    <>
      <div className="pillar-tag">Pillar 4 · Community &amp; Infrastructure · Housing Supply</div>
      <h1>
        Boston Housing Permits, 1980–2024
        <br />
        <span style={{ color: 'var(--text-secondary)', fontWeight: 300 }}>
          Supply vs. Household Demand
        </span>
      </h1>
      <p className="lead">
        Each shape represents one year of permitted housing — its size encodes total units, its
        void encodes single-family units as absence. The orange trace shows how many new households
        Boston actually needed to house. When the city built less than demand required, a gap
        opened.
      </p>
    </>
  )
}
