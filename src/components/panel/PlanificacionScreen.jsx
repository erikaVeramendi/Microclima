import { useState, useEffect, useMemo } from 'react'
import {
  Users,
  TrendingUp,
  HeartPulse,
  AlertTriangle,
  ArrowRight,
  Sparkles,
} from 'lucide-react'
import GamcMap from './GamcMap'
import PopulationSourceSelector from './PopulationSourceSelector'
import { getIneFactor } from './populationUtils'
import { COCHABAMBA_ZONES } from '../../data/internalPanelData'
import './IndiceScreen.css'

const SCENARIOS = [
  { id: 'bajo', label: 'Bajo (× 0,5)', mult: 0.5, desc: 'Crecimiento demográfico desacelerado' },
  { id: 'esperado', label: 'Esperado (× 1,0)', mult: 1.0, desc: 'Tendencia oficial estimada por GHSL' },
  { id: 'alto', label: 'Alto (× 1,5)', mult: 1.5, desc: 'Crecimiento acelerado por migración periférica' },
]

function getGrowthColor(growthPct) {
  if (growthPct >= 5.0) return '#EF4444' // Crecimiento alto
  if (growthPct >= 3.5) return '#F59E0B' // Crecimiento medio
  return '#38BDF8' // Crecimiento moderado
}

export default function PlanificacionScreen({
  selectedZoneId,
  onSelectZone,
  onNavigateModule,
}) {
  const [indiceData, setIndiceData] = useState(null)
  const [distritosGeoJson, setDistritosGeoJson] = useState(null)
  const [scenarioId, setScenarioId] = useState('esperado')
  const [basePoblacion, setBasePoblacion] = useState('ghsl') // 'ghsl' | 'ine'
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    Promise.all([
      fetch('/data/indice_distritos.json').then((r) => (r.ok ? r.json() : null)),
      fetch('/data/distritos_indicadores_ambientales_2024.geojson').then((r) =>
        r.ok ? r.json() : null
      ),
    ])
      .then(([idx, geo]) => {
        if (!isMounted) return
        if (idx) setIndiceData(idx)
        if (geo) setDistritosGeoJson(geo)
        setLoading(false)
      })
      .catch((err) => {
        console.error('Error cargando datos en PlanificacionScreen:', err)
        if (isMounted) setLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [])

  const activeZone =
    COCHABAMBA_ZONES.find((z) => z.id === selectedZoneId) || COCHABAMBA_ZONES[0]
  const distNum = parseInt(
    String(activeZone.number || activeZone.id.replace('distrito-', '')),
    10
  )

  const activeScenario =
    SCENARIOS.find((s) => s.id === scenarioId) || SCENARIOS[1]
  const mult = activeScenario.mult

  // Factor de ajuste al Censo INE 2024
  const ineFactor = useMemo(() => getIneFactor(indiceData), [indiceData])
  const pobFactor = basePoblacion === 'ine' ? ineFactor : 1

  // Cálculos dinámicos con el escenario activo y base de población
  const distritosCalculados = useMemo(() => {
    if (!indiceData?.distritos) return []

    return indiceData.distritos.map((d) => {
      const ind = d.indicadores || {}
      const pobHoy = Math.round((ind.personas || 0) * pobFactor)
      const baseGrowth = (ind.factor_2030 || 1.0) - 1.0 // e.g. 0.07 para 7%
      const scenarioGrowth = baseGrowth * mult
      const pob2030Calc = Math.round(pobHoy * (1 + scenarioGrowth))
      const growthPct = scenarioGrowth * 100

      const saludCentros = ind.salud_1er || 0
      const habCentroHoy = saludCentros > 0 ? Math.round(pobHoy / saludCentros) : null
      const habCentro2030 = saludCentros > 0 ? Math.round(pob2030Calc / saludCentros) : null

      return {
        id: d.id,
        nombre: d.nombre,
        pobHoy,
        pob2030Calc,
        growthPct,
        saludCentros,
        habCentroHoy,
        habCentro2030,
        cobSaludHoy: ind.cobertura_salud || 0,
        cobSalud2030: ind.cobertura_salud_2030 || 0,
      }
    })
  }, [indiceData, mult, pobFactor])

  // Métricas agregadas municipales
  const municipalStats = useMemo(() => {
    if (distritosCalculados.length === 0) {
      return {
        totalHoy: 925811,
        total2030: 956300,
        pctCrecTotal: 3.3,
        maxGrowthDist: { nombre: 'Distrito 1', growthPct: 7.0 },
        avgCobHoy: 61.9,
        avgCob2030: 61.8,
        avgGrowth: 3.4,
      }
    }

    const totalHoy = distritosCalculados.reduce((a, d) => a + d.pobHoy, 0)
    const total2030 = distritosCalculados.reduce((a, d) => a + d.pob2030Calc, 0)
    const pctCrecTotal = totalHoy > 0 ? ((total2030 - totalHoy) / totalHoy) * 100 : 0

    // Distrito que más crece
    let maxDist = distritosCalculados[0]
    distritosCalculados.forEach((d) => {
      if (d.growthPct > maxDist.growthPct) maxDist = d
    })

    const avgCobHoy =
      distritosCalculados.reduce((a, d) => a + d.cobSaludHoy, 0) /
      distritosCalculados.length
    const avgCob2030 =
      distritosCalculados.reduce((a, d) => a + d.cobSalud2030, 0) /
      distritosCalculados.length
    const avgGrowth =
      distritosCalculados.reduce((a, d) => a + d.growthPct, 0) /
      distritosCalculados.length

    return {
      totalHoy,
      total2030,
      pctCrecTotal,
      maxGrowthDist: maxDist,
      avgCobHoy,
      avgCob2030,
      avgGrowth,
    }
  }, [distritosCalculados])

  // Ficha del distrito seleccionado
  const activeDistrictCalc = useMemo(() => {
    return (
      distritosCalculados.find((d) => parseInt(String(d.id), 10) === distNum) ||
      distritosCalculados[0]
    )
  }, [distritosCalculados, distNum])

  // "Dónde crecerá la necesidad": Crecimiento > promedio Y cobertura 2030 < promedio
  const distritosNecesidad = useMemo(() => {
    if (distritosCalculados.length === 0) return []
    return distritosCalculados
      .filter(
        (d) =>
          d.growthPct > municipalStats.avgGrowth &&
          d.cobSalud2030 < municipalStats.avgCob2030
      )
      .sort((a, b) => b.growthPct - a.growthPct)
  }, [distritosCalculados, municipalStats])

  // GeoJSON con polígonos coloreados por crecimiento 2030
  const distritosGeoJsonGrowth = useMemo(() => {
    if (!distritosGeoJson?.features || distritosCalculados.length === 0) return null

    const calcMap = {}
    distritosCalculados.forEach((d) => {
      calcMap[String(d.id)] = d
    })

    return {
      ...distritosGeoJson,
      features: distritosGeoJson.features.map((f) => {
        const cod = String(f.properties?.codigo_distrito || '')
        const item = calcMap[cod]
        const growth = item ? item.growthPct : 3.0
        const isSelected = parseInt(cod, 10) === distNum
        const color = getGrowthColor(growth)

        return {
          ...f,
          properties: {
            ...f.properties,
            selected: isSelected,
            color: isSelected ? 'var(--theme-accent, #38BDF8)' : color,
            fillColor: color,
            labelPermanent: `D${cod}: +${growth.toFixed(1).replace('.', ',')}%`,
            nombre: `${f.properties?.nombre || 'Distrito ' + cod} · Crecimiento proyectado: +${growth.toFixed(1).replace('.', ',')}%`,
          },
        }
      }),
    }
  }, [distritosGeoJson, distritosCalculados, distNum])

  if (loading && !indiceData) {
    return (
      <div className="neo-screen" style={{ padding: '2rem', textAlign: 'center' }}>
        <p style={{ color: 'var(--theme-text-muted)' }}>Cargando proyecciones a 5 años...</p>
      </div>
    )
  }

  return (
    <div className="neo-screen">
      {/* 1. Línea bajo el título y selector de población */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '0.1rem',
          flexWrap: 'wrap',
          gap: '0.5rem',
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: '0.86rem',
            color: 'var(--theme-text-muted)',
            lineHeight: 1.45,
          }}
        >
          Cómo crecerá cada distrito al 2030 y dónde faltarán servicios.
        </p>

        <PopulationSourceSelector
          value={basePoblacion}
          onChange={setBasePoblacion}
        />
      </div>

      {/* 2. Tarjetas (3): Población municipio · Distrito que más crece · Cobertura salud */}
      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '0.75rem',
        }}
      >
        {/* Tarjeta 1: Población hoy -> 2030 */}
        <div className="hud-kpi-card" style={{ '--kpi-accent': '#38BDF8' }}>
          <div className="hud-kpi-top">
            <span className="hud-kpi-label">POBLACIÓN MUNICIPIO HOY → 2030</span>
            <span
              className="hud-kpi-delta"
              style={{ color: '#38BDF8', borderColor: 'rgba(56, 189, 248, 0.44)' }}
            >
              +{municipalStats.pctCrecTotal.toFixed(1).replace('.', ',')}% ({activeScenario.label.split(' ')[0]})
            </span>
          </div>
          <div className="hud-kpi-val-row" style={{ alignItems: 'baseline', gap: '0.4rem' }}>
            <strong className="hud-kpi-value" style={{ fontSize: '1.45rem' }}>
              {Math.round(municipalStats.totalHoy).toLocaleString('es-BO')}
            </strong>
            <span style={{ fontSize: '1.1rem', color: 'var(--color-icon)' }}>→</span>
            <strong className="hud-kpi-value" style={{ fontSize: '1.45rem', color: 'var(--theme-accent, #38BDF8)' }}>
              {Math.round(municipalStats.total2030).toLocaleString('es-BO')}
            </strong>
          </div>
          <span style={{ fontSize: '0.74rem', color: 'var(--theme-text-muted)', marginTop: '0.2rem', display: 'block' }}>
            +{Math.round(municipalStats.total2030 - municipalStats.totalHoy).toLocaleString('es-BO')} nuevos habitantes
          </span>
        </div>

        {/* Tarjeta 2: Distrito que más crece */}
        <div className="hud-kpi-card" style={{ '--kpi-accent': '#EF4444' }}>
          <div className="hud-kpi-top">
            <span className="hud-kpi-label">DISTRITO QUE MÁS CRECE</span>
            <span
              className="hud-kpi-delta"
              style={{ color: '#EF4444', borderColor: 'rgba(239, 68, 68, 0.44)' }}
            >
              Mayor aceleración
            </span>
          </div>
          <div className="hud-kpi-val-row">
            <strong className="hud-kpi-value" style={{ color: '#EF4444' }}>
              +{municipalStats.maxGrowthDist.growthPct.toFixed(1).replace('.', ',')} %
            </strong>
          </div>
          <span style={{ fontSize: '0.74rem', color: 'var(--theme-text-muted)', marginTop: '0.2rem', display: 'block' }}>
            {municipalStats.maxGrowthDist.nombre} lidera la expansión habitacional
          </span>
        </div>

        {/* Tarjeta 3: Cobertura salud municipio */}
        <div className="hud-kpi-card" style={{ '--kpi-accent': '#10B981' }}>
          <div className="hud-kpi-top">
            <span className="hud-kpi-label">COBERTURA SALUD MUNICIPIO</span>
            <span
              className="hud-kpi-delta"
              style={{ color: '#10B981', borderColor: 'rgba(16, 185, 129, 0.44)' }}
            >
              1er nivel (1.000 m)
            </span>
          </div>
          <div className="hud-kpi-val-row" style={{ alignItems: 'baseline', gap: '0.4rem' }}>
            <strong className="hud-kpi-value" style={{ fontSize: '1.45rem' }}>
              {municipalStats.avgCobHoy.toFixed(1).replace('.', ',')}%
            </strong>
            <span style={{ fontSize: '1.1rem', color: 'var(--color-icon)' }}>→</span>
            <strong className="hud-kpi-value" style={{ fontSize: '1.45rem', color: '#10B981' }}>
              {municipalStats.avgCob2030.toFixed(1).replace('.', ',')}%
            </strong>
          </div>
          <span style={{ fontSize: '0.74rem', color: 'var(--theme-text-muted)', marginTop: '0.2rem', display: 'block' }}>
            Presión sostenida sobre centros primarios
          </span>
        </div>
      </section>

      {/* Control "Escenario de crecimiento" */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--theme-card-bg-subtle, rgba(255,255,255,0.02))',
          padding: '0.5rem 0.85rem',
          borderRadius: '8px',
          border: '1px solid var(--theme-border)',
          flexWrap: 'wrap',
          gap: '0.6rem',
        }}
      >
        <span
          style={{
            fontSize: '0.78rem',
            fontWeight: 600,
            color: 'var(--theme-text-primary)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
          }}
        >
          <Sparkles size={16} color="var(--theme-accent, #38BDF8)" />
          Escenario de crecimiento poblacional:
        </span>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {SCENARIOS.map((s) => {
            const isActive = scenarioId === s.id
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setScenarioId(s.id)}
                className="gamc-btn-secondary"
                style={{
                  fontSize: '0.75rem',
                  padding: '0.25rem 0.65rem',
                  borderRadius: '6px',
                  background: isActive ? 'var(--theme-accent, #38BDF8)' : undefined,
                  color: isActive ? '#0f172a' : undefined,
                  fontWeight: isActive ? 700 : 500,
                  borderColor: isActive ? 'var(--theme-accent)' : undefined,
                }}
                title={s.desc}
              >
                {s.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* 3. Centro: Mapa a la izquierda + Ficha del distrito a la derecha */}
      <section
        style={{
          display: 'grid',
          gridTemplateColumns: '1.25fr 1fr',
          gap: '0.75rem',
          alignItems: 'start',
        }}
      >
        {/* Mapa de crecimiento */}
        <div
          className="hud-card"
          style={{
            padding: '0.75rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <TrendingUp size={18} strokeWidth={1.75} color="var(--color-icon)" />
              <h3 style={{ margin: 0, fontSize: '0.88rem', fontWeight: 600 }}>
                Crecimiento Estimado al 2030 por Distrito
              </h3>
            </div>
            <div style={{ display: 'flex', gap: '0.65rem', fontSize: '0.7rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#38BDF8' }} />
                ≤ 3.0 %
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#F59E0B' }} />
                3.1 – 4.9 %
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#EF4444' }} />
                ≥ 5.0 %
              </span>
            </div>
          </div>

          <GamcMap
            geojson={distritosGeoJsonGrowth}
            onClickDistrito={(feat) => {
              const dNum = feat.properties?.codigo_distrito
              if (dNum && onSelectZone) {
                onSelectZone(`distrito-${dNum}`)
              }
            }}
            capasWms={['limite_distritos']}
            height="420px"
          />

          <span style={{ fontSize: '0.72rem', color: 'var(--theme-text-muted)', fontStyle: 'italic' }}>
            Haz clic sobre cualquier distrito para seleccionarlo y ver su ficha demográfica proyectada.
          </span>
        </div>

        {/* Ficha del distrito seleccionado */}
        {activeDistrictCalc && (
          <div
            className="hud-card"
            style={{
              padding: '0.85rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.65rem',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid var(--theme-border)',
                paddingBottom: '0.45rem',
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: '0.96rem', fontWeight: 700, color: 'var(--theme-text-primary)' }}>
                  {activeDistrictCalc.nombre}
                </h3>
                <span style={{ fontSize: '0.72rem', color: 'var(--theme-text-muted)' }}>
                  Ficha de Proyección 2025 → 2030
                </span>
              </div>
              <span
                style={{
                  fontSize: '0.74rem',
                  padding: '0.15rem 0.5rem',
                  borderRadius: '4px',
                  background: 'var(--theme-accent-subtle)',
                  color: 'var(--theme-accent, #38BDF8)',
                  fontWeight: 700,
                }}
              >
                +{activeDistrictCalc.growthPct.toFixed(1).replace('.', ',')} %
              </span>
            </div>

            {/* Métrica 1: Población */}
            <div
              style={{
                background: 'var(--theme-card-bg-subtle, rgba(255,255,255,0.02))',
                border: '1px solid var(--theme-border)',
                borderRadius: '8px',
                padding: '0.6rem 0.75rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.25rem' }}>
                <Users size={15} color="var(--color-icon)" />
                <span style={{ fontSize: '0.75rem', color: 'var(--color-icon)', fontWeight: 600 }}>
                  Población residente
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--theme-text-muted)' }}>Hoy: </span>
                  <strong>{Math.round(activeDistrictCalc.pobHoy).toLocaleString('es-BO')}</strong>
                </div>
                <span style={{ color: 'var(--color-icon)' }}>→</span>
                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--theme-text-muted)' }}>2030: </span>
                  <strong style={{ color: 'var(--theme-accent, #38BDF8)' }}>
                    {Math.round(activeDistrictCalc.pob2030Calc).toLocaleString('es-BO')}
                  </strong>
                </div>
              </div>
              <span style={{ fontSize: '0.7rem', color: 'var(--theme-text-muted)', marginTop: '0.2rem', display: 'block' }}>
                Incremento: +{Math.round(activeDistrictCalc.pob2030Calc - activeDistrictCalc.pobHoy).toLocaleString('es-BO')} personas
              </span>
            </div>

            {/* Métrica 2: Habitantes por centro de salud */}
            <div
              style={{
                background: 'var(--theme-card-bg-subtle, rgba(255,255,255,0.02))',
                border: '1px solid var(--theme-border)',
                borderRadius: '8px',
                padding: '0.6rem 0.75rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.25rem' }}>
                <HeartPulse size={15} color="var(--color-icon)" />
                <span style={{ fontSize: '0.75rem', color: 'var(--color-icon)', fontWeight: 600 }}>
                  Habitantes por centro de 1er nivel
                </span>
              </div>
              {activeDistrictCalc.habCentroHoy ? (
                <>
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                    <div>
                      <span style={{ fontSize: '0.72rem', color: 'var(--theme-text-muted)' }}>Hoy: </span>
                      <strong>{activeDistrictCalc.habCentroHoy.toLocaleString('es-BO')}</strong>
                    </div>
                    <span style={{ color: 'var(--color-icon)' }}>→</span>
                    <div>
                      <span style={{ fontSize: '0.72rem', color: 'var(--theme-text-muted)' }}>2030: </span>
                      <strong style={{ color: '#EF4444' }}>
                        {activeDistrictCalc.habCentro2030.toLocaleString('es-BO')}
                      </strong>
                    </div>
                  </div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--theme-text-muted)', marginTop: '0.2rem', display: 'block' }}>
                    {activeDistrictCalc.saludCentros} {activeDistrictCalc.saludCentros === 1 ? 'centro disponible' : 'centros disponibles'}
                  </span>
                </>
              ) : (
                <span style={{ fontSize: '0.75rem', color: '#EF4444', fontWeight: 600 }}>
                  No cuenta con centros de salud de 1er nivel propios
                </span>
              )}
            </div>

            {/* Métrica 3: Cobertura de salud */}
            <div
              style={{
                background: 'var(--theme-card-bg-subtle, rgba(255,255,255,0.02))',
                border: '1px solid var(--theme-border)',
                borderRadius: '8px',
                padding: '0.6rem 0.75rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.25rem' }}>
                <TrendingUp size={15} color="var(--color-icon)" />
                <span style={{ fontSize: '0.75rem', color: 'var(--color-icon)', fontWeight: 600 }}>
                  Cobertura de salud a 1.000 m
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--theme-text-muted)' }}>Hoy: </span>
                  <strong>{activeDistrictCalc.cobSaludHoy.toFixed(1).replace('.', ',')} %</strong>
                </div>
                <span style={{ color: 'var(--color-icon)' }}>→</span>
                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--theme-text-muted)' }}>2030: </span>
                  <strong style={{ color: activeDistrictCalc.cobSalud2030 >= 60 ? '#22C55E' : '#EF4444' }}>
                    {activeDistrictCalc.cobSalud2030.toFixed(1).replace('.', ',')} %
                  </strong>
                </div>
              </div>
              <span style={{ fontSize: '0.7rem', color: 'var(--theme-text-muted)', marginTop: '0.2rem', display: 'block' }}>
                {activeDistrictCalc.cobSalud2030 < 50
                  ? 'Nivel de cobertura bajo: más de la mitad de la población queda desprotegida'
                  : 'Nivel de cobertura adecuado'}
              </span>
            </div>
          </div>
        )}
      </section>

      {/* 4. Abajo: (1) Barras agrupadas hoy vs 2030 · (2) Dónde crecerá la necesidad */}
      <section
        style={{
          display: 'grid',
          gridTemplateColumns: '1.25fr 1fr',
          gap: '0.75rem',
          alignItems: 'start',
        }}
      >
        {/* Gráfico de barras agrupadas */}
        <div
          className="hud-card"
          style={{
            padding: '0.85rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.6rem',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <HeartPulse size={18} strokeWidth={1.75} color="var(--color-icon)" />
              <h3 style={{ margin: 0, fontSize: '0.88rem', fontWeight: 600 }}>
                Cobertura de Salud por Distrito: Hoy vs 2030
              </h3>
            </div>
            <div style={{ display: 'flex', gap: '0.85rem', fontSize: '0.7rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: 10, height: 6, background: '#38BDF8', display: 'inline-block', borderRadius: '1px' }} />
                Hoy (%)
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: 10, height: 6, background: '#818CF8', display: 'inline-block', borderRadius: '1px' }} />
                2030 (%)
              </span>
            </div>
          </div>

          {/* Gráfico SVG de barras agrupadas */}
          <div style={{ position: 'relative', width: '100%', height: '220px' }}>
            <svg viewBox="0 0 540 220" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
              {/* Líneas guía: 25%, 50%, 75%, 100% */}
              {[25, 50, 75, 100].map((val) => {
                const y = 190 - (val / 100) * 165
                return (
                  <g key={val}>
                    <line x1="30" y1={y} x2="525" y2={y} stroke="var(--theme-border)" strokeDasharray="3,3" strokeWidth="1" />
                    <text x="24" y={y + 3} fill="var(--theme-text-muted)" fontSize="8" textAnchor="end">
                      {val}%
                    </text>
                  </g>
                )
              })}

              {/* 15 pares de barras */}
              {distritosCalculados.map((d, idx) => {
                const slotWidth = 495 / 15
                const x0 = 30 + idx * slotWidth
                const barW = 11
                const isSelected = parseInt(String(d.id), 10) === distNum

                const hHoy = (d.cobSaludHoy / 100) * 165
                const yHoy = 190 - hHoy

                const h2030 = (d.cobSalud2030 / 100) * 165
                const y2030 = 190 - h2030

                return (
                  <g key={d.id} onClick={() => onSelectZone && onSelectZone(`distrito-${d.id}`)} style={{ cursor: 'pointer' }}>
                    {isSelected && (
                      <rect
                        x={x0 + 1}
                        y="20"
                        width={slotWidth - 2}
                        height="174"
                        fill="var(--theme-accent-subtle)"
                        rx="3"
                      />
                    )}
                    {/* Barra hoy */}
                    <rect x={x0 + 3} y={yHoy} width={barW} height={Math.max(1, hHoy)} fill="#38BDF8" rx="2">
                      <title>{`${d.nombre} Hoy: ${d.cobSaludHoy.toFixed(1)}%`}</title>
                    </rect>
                    {/* Barra 2030 */}
                    <rect x={x0 + 3 + barW + 2} y={y2030} width={barW} height={Math.max(1, h2030)} fill="#818CF8" rx="2">
                      <title>{`${d.nombre} 2030: ${d.cobSalud2030.toFixed(1)}%`}</title>
                    </rect>
                    {/* Etiqueta X */}
                    <text
                      x={x0 + slotWidth / 2}
                      y="205"
                      fill={isSelected ? 'var(--theme-accent, #38BDF8)' : 'var(--theme-text-muted)'}
                      fontWeight={isSelected ? 700 : 400}
                      fontSize="8"
                      textAnchor="middle"
                    >
                      D{d.id}
                    </text>
                  </g>
                )
              })}
            </svg>
          </div>
        </div>

        {/* Lista "Dónde crecerá la necesidad" */}
        <div
          className="hud-card"
          style={{
            padding: '0.85rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.65rem',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              borderBottom: '1px solid var(--theme-border)',
              paddingBottom: '0.45rem',
            }}
          >
            <AlertTriangle size={18} strokeWidth={1.75} color="#EF4444" />
            <div>
              <h3 style={{ margin: 0, fontSize: '0.88rem', fontWeight: 600 }}>
                Dónde crecerá la necesidad
              </h3>
              <span style={{ fontSize: '0.7rem', color: 'var(--theme-text-muted)' }}>
                Crecimiento superior al promedio ({municipalStats.avgGrowth.toFixed(1).replace('.', ',')} %) y cobertura 2030 &lt; {municipalStats.avgCob2030.toFixed(1).replace('.', ',')} %
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
            {distritosNecesidad.map((d) => (
              <div
                key={d.id}
                style={{
                  background: 'var(--theme-card-bg-subtle, rgba(255,255,255,0.02))',
                  border: '1px solid var(--theme-border)',
                  borderRadius: '8px',
                  padding: '0.55rem 0.75rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                  <strong style={{ fontSize: '0.84rem', color: 'var(--theme-text-primary)' }}>
                    {d.nombre}
                  </strong>
                  <span
                    style={{
                      fontSize: '0.7rem',
                      padding: '0.1rem 0.45rem',
                      borderRadius: '4px',
                      background: 'rgba(239, 68, 68, 0.15)',
                      color: '#EF4444',
                      fontWeight: 700,
                    }}
                  >
                    +{d.growthPct.toFixed(1).replace('.', ',')} % demográfico
                  </span>
                </div>

                <p style={{ margin: 0, fontSize: '0.74rem', color: 'var(--theme-text-muted)', lineHeight: 1.35 }}>
                  {d.saludCentros === 0
                    ? `No tiene centros de salud de primer nivel y su cobertura al 2030 se mantendrá crítica en ${d.cobSalud2030.toFixed(1).replace('.', ',')} %.`
                    : `Con el crecimiento, cada centro de salud atenderá a ${d.habCentro2030.toLocaleString('es-BO')} personas y la cobertura cubrirá solo al ${d.cobSalud2030.toFixed(1).replace('.', ',')} % del distrito.`}
                </p>

                <div style={{ marginTop: '0.4rem', display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => {
                      if (onSelectZone) onSelectZone(`distrito-${d.id}`)
                      if (onNavigateModule) onNavigateModule('simulador-equipamientos')
                    }}
                    className="gamc-btn-secondary"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                      fontSize: '0.7rem',
                      padding: '0.2rem 0.55rem',
                    }}
                  >
                    Simular nuevo centro
                    <ArrowRight size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Aviso metodológico único */}
      <footer style={{ marginTop: '0.4rem', textAlign: 'center' }}>
        <p
          style={{
            margin: 0,
            fontSize: '0.78rem',
            color: 'var(--theme-text-muted)',
            fontStyle: 'italic',
          }}
        >
          Población estimada con la grilla GHSL (Comisión Europea) para 2025 y 2030. Es una estimación, no un censo.
        </p>
      </footer>
    </div>
  )
}
