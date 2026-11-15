import { useState, useEffect, useMemo } from 'react'
import {
  Users,
  TrendingUp,
  HeartPulse,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Calendar,
  Layers,
  GraduationCap,
  Trees,
  CheckCircle2,
  Info,
} from 'lucide-react'
import GamcMap from './GamcMap'
import PopulationSourceSelector from './PopulationSourceSelector'
import { getIneFactor } from './populationUtils'
import { COCHABAMBA_ZONES } from '../../data/internalPanelData'
import './PlanificacionScreen.css'

const SCENARIOS = [
  {
    id: 'bajo',
    label: 'Bajo (× 0,5)',
    mult: 0.5,
    desc: 'Crecimiento desacelerado / menor flujo migratorio',
  },
  {
    id: 'esperado',
    label: 'Esperado (× 1,0)',
    mult: 1.0,
    desc: 'Tendencia base proyectada por modelo GHSL / GAMC',
  },
  {
    id: 'alto',
    label: 'Alto (× 1,5)',
    mult: 1.5,
    desc: 'Expansión acelerada por fuerte migración periférica',
  },
]

export default function PlanificacionScreen({
  selectedZoneId,
  onSelectZone,
  onNavigateModule,
}) {
  const [indiceData, setIndiceData] = useState(null)
  const [distritosGeoJson, setDistritosGeoJson] = useState(null)
  const [referenciasData, setReferenciasData] = useState(null)

  // Controles de Horizonte y Escenario
  const [horizonte, setHorizonte] = useState(5) // 5 (2030) | 10 (2035)
  const [scenarioId, setScenarioId] = useState('esperado')
  const [basePoblacion, setBasePoblacion] = useState('ghsl') // 'ghsl' | 'ine'

  // Métrica visualizada sobre el mapa
  const [metricaMapa, setMetricaMapa] = useState('crecimiento') // 'crecimiento' | 'salud' | 'colegios' | 'verde'

  // Métrica del gráfico comparativo inferior
  const [metricaGrafico, setMetricaGrafico] = useState('poblacion') // 'poblacion' | 'salud' | 'verde'

  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    Promise.all([
      fetch('/data/indice_distritos.json').then((r) => (r.ok ? r.json() : null)),
      fetch('/data/distritos_indicadores_ambientales_2024.geojson').then((r) =>
        r.ok ? r.json() : null
      ),
      fetch('/data/referencias_geograficas.geojson').then((r) =>
        r.ok ? r.json() : null
      ),
    ])
      .then(([idx, geo, ref]) => {
        if (!isMounted) return
        if (idx) setIndiceData(idx)
        if (geo) setDistritosGeoJson(geo)
        if (ref) setReferenciasData(ref)
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

  const anioObjetivo = horizonte === 5 ? 2030 : 2035

  // Cálculos dinámicos para los 15 distritos según horizonte y escenario
  const distritosCalculados = useMemo(() => {
    if (!indiceData?.distritos) return []

    return indiceData.distritos.map((d) => {
      const ind = d.indicadores || {}
      const pobHoy = Math.round((ind.personas || 0) * pobFactor)

      // Crecimiento base a 5 años (GHSL)
      const baseGrowth5 = (ind.factor_2030 || 1.0) - 1.0 // ej. 0.07 para +7%

      // Proyección a 5 o 10 años con modelo compuesto y multiplicador de escenario
      const periods = horizonte / 5
      const growthRatePeriod = baseGrowth5 * mult
      const compoundGrowth = Math.pow(1 + growthRatePeriod, periods) - 1
      const growthPct = compoundGrowth * 100

      const pobFuturo = Math.round(pobHoy * (1 + compoundGrowth))
      const incrementoPob = pobFuturo - pobHoy

      // 1. Salud: Habitantes por centro de primer nivel
      const saludCentros = ind.salud_1er || 0
      const habCentroHoy =
        saludCentros > 0 ? Math.round(pobHoy / saludCentros) : null
      const habCentroFuturo =
        saludCentros > 0 ? Math.round(pobFuturo / saludCentros) : null
      // Estándar GAMC/OMS: 1 centro por cada 25.000 habitantes
      const centrosRequeridos = Math.max(
        0,
        Math.ceil(pobFuturo / 25000) - saludCentros
      )

      // 2. Educación: Habitantes por unidad educativa
      const colegios = ind.colegios || 0
      const habColegioHoy =
        colegios > 0 ? Math.round(pobHoy / colegios) : null
      const habColegioFuturo =
        colegios > 0 ? Math.round(pobFuturo / colegios) : null
      // Estándar GAMC: 1 unidad educativa por cada 4.700 habitantes
      const colegiosRequeridos = Math.max(
        0,
        Math.ceil(pobFuturo / 4700) - colegios
      )

      // 3. Áreas Verdes: m² por habitante
      const areaVerdeM2 = ind.area_verde_m2 || 0
      const verdeHoy = ind.verde_por_hab || (areaVerdeM2 / (pobHoy || 1))
      // Asumiendo misma área verde si el municipio no expropia/adiciona parques
      const verdeFuturo =
        pobFuturo > 0 ? (areaVerdeM2 * pobFactor) / pobFuturo : verdeHoy
      const cumpleOms = verdeFuturo >= 9.0
      const deficitVerdeM2 = cumpleOms ? 0 : 9.0 - verdeFuturo
      const m2VerdesNecesarios = Math.round(deficitVerdeM2 * pobFuturo)

      // 4. Cobertura de salud estimada
      const cobSaludHoy = ind.cobertura_salud || 61.9
      const cobSaludFuturo =
        horizonte === 5
          ? ind.cobertura_salud_2030 || cobSaludHoy * 0.98
          : Math.max(25, cobSaludHoy * (1 - (growthPct / 100) * 0.35))

      return {
        id: d.id,
        nombre: d.nombre,
        pobHoy,
        pobFuturo,
        incrementoPob,
        growthPct,
        saludCentros,
        habCentroHoy,
        habCentroFuturo,
        centrosRequeridos,
        colegios,
        habColegioHoy,
        habColegioFuturo,
        colegiosRequeridos,
        areaVerdeM2,
        verdeHoy,
        verdeFuturo,
        cumpleOms,
        deficitVerdeM2,
        m2VerdesNecesarios,
        cobSaludHoy,
        cobSaludFuturo,
      }
    })
  }, [indiceData, horizonte, mult, pobFactor])

  // Estadísticas agregadas municipales
  const municipalStats = useMemo(() => {
    if (distritosCalculados.length === 0) {
      return {
        totalHoy: 925811,
        totalFuturo: 975000,
        incrementoTotal: 49189,
        pctCrecTotal: 5.3,
        maxGrowthDist: { nombre: 'Distrito 1', growthPct: 7.0 },
        avgGrowth: 3.4,
      }
    }

    const totalHoy = distritosCalculados.reduce((a, d) => a + d.pobHoy, 0)
    const totalFuturo = distritosCalculados.reduce((a, d) => a + d.pobFuturo, 0)
    const incrementoTotal = totalFuturo - totalHoy
    const pctCrecTotal =
      totalHoy > 0 ? (incrementoTotal / totalHoy) * 100 : 0

    let maxDist = distritosCalculados[0]
    distritosCalculados.forEach((d) => {
      if (d.growthPct > maxDist.growthPct) maxDist = d
    })

    const avgGrowth =
      distritosCalculados.reduce((a, d) => a + d.growthPct, 0) /
      distritosCalculados.length

    return {
      totalHoy,
      totalFuturo,
      incrementoTotal,
      pctCrecTotal,
      maxGrowthDist: maxDist,
      avgGrowth,
    }
  }, [distritosCalculados])

  // Ficha de proyección del distrito seleccionado ("ANTES VS DESPUÉS")
  const activeDistrictCalc = useMemo(() => {
    return (
      distritosCalculados.find((d) => parseInt(String(d.id), 10) === distNum) ||
      distritosCalculados[0]
    )
  }, [distritosCalculados, distNum])

  // Distritos con mayor urgencia de equipamiento
  const distritosUrgentes = useMemo(() => {
    return [...distritosCalculados]
      .sort((a, b) => {
        // Ponderar crecimiento demográfico + déficit de centros
        const scoreA = a.growthPct + (a.centrosRequeridos > 0 ? 10 : 0)
        const scoreB = b.growthPct + (b.centrosRequeridos > 0 ? 10 : 0)
        return scoreB - scoreA
      })
      .slice(0, 5)
  }, [distritosCalculados])

  // Función para determinar el color de cada distrito en el mapa según la métrica activa
  const getFeatureMapStyle = (item) => {
    if (!item) return { color: '#38BDF8', label: '--', textVal: '--' }

    if (metricaMapa === 'crecimiento') {
      const g = item.growthPct
      const threshMod = horizonte === 5 ? 3.0 : 6.0
      const threshMed = horizonte === 5 ? 5.0 : 10.0
      const threshAlt = horizonte === 5 ? 7.0 : 14.0

      let color = '#38BDF8' // Crecimiento moderado
      if (g >= threshAlt) color = '#DC2626' // Expansión acelerada
      else if (g >= threshMed) color = '#F97316' // Alto
      else if (g >= threshMod) color = '#F59E0B' // Medio

      return {
        color,
        label: `+${g.toFixed(1)}%`,
        textVal: `Crecimiento: +${g.toFixed(1)}%`,
      }
    }

    if (metricaMapa === 'salud') {
      const habs = item.habCentroFuturo
      let color = '#10B981'
      let text = 'Óptimo'

      if (!habs || item.saludCentros === 0) {
        color = '#DC2626'
        text = 'Sin centros de salud'
      } else if (habs > 40000) {
        color = '#DC2626'
        text = 'Saturación crítica'
      } else if (habs > 25000) {
        color = '#F59E0B'
        text = 'Alerta de saturación'
      }

      return {
        color,
        label: habs ? `${Math.round(habs / 1000)}k` : '0',
        textVal: `${habs ? habs.toLocaleString() + ' hab/c' : 'Sin centro'} (${text})`,
      }
    }

    if (metricaMapa === 'colegios') {
      const habs = item.habColegioFuturo
      let color = '#10B981'
      let text = 'Equilibrado'

      if (!habs || habs > 7000) {
        color = '#DC2626'
        text = 'Déficit severo de aulas'
      } else if (habs > 4700) {
        color = '#F59E0B'
        text = 'Presión moderada'
      }

      return {
        color,
        label: habs ? `${Math.round(habs / 1000)}k` : '--',
        textVal: `${habs ? habs.toLocaleString() + ' hab/col' : '--'} (${text})`,
      }
    }

    // metricaMapa === 'verde'
    const m2 = item.verdeFuturo
    let color = '#10B981'
    let text = 'Superávit saludable'

    if (m2 < 6.0) {
      color = '#DC2626'
      text = 'Déficit crítico'
    } else if (m2 < 9.0) {
      color = '#F97316'
      text = 'Bajo estándar OMS'
    } else if (m2 < 12.0) {
      color = '#84CC16'
      text = 'Cumple estándar OMS'
    }

    return {
      color,
      label: `${m2.toFixed(1)} m²`,
      textVal: `${m2.toFixed(1)} m²/hab. (${text})`,
    }
  }

  // GeoJSON con polígonos estilizados para GamcMap + Río Rocha
  const distritosGeoJsonStyled = useMemo(() => {
    if (!distritosGeoJson?.features) return null

    const calcMap = {}
    distritosCalculados.forEach((d) => {
      calcMap[String(d.id)] = d
    })

    const districtFeatures = distritosGeoJson.features.map((f) => {
      const cod = String(f.properties?.codigo_distrito || '')
      const item = calcMap[cod]
      const isSelected = parseInt(cod, 10) === distNum
      const styleInfo = getFeatureMapStyle(item)

      const tooltipHtml = `
        <div style="font-family: inherit; font-size: 12px; min-width: 195px; line-height: 1.45;">
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #E2E8F0; padding-bottom: 4px; margin-bottom: 6px;">
            <strong style="font-size: 13px; color: #0F172A;">${f.properties?.nombre || 'Distrito ' + cod}</strong>
            <span style="font-size: 10px; font-weight: 800; padding: 2px 7px; border-radius: 4px; background: ${styleInfo.color}20; color: ${styleInfo.color}; border: 1px solid ${styleInfo.color};">
              ${horizonte} AÑOS (${anioObjetivo})
            </span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
            <span style="color: #64748B;">Población Proyectada:</span>
            <strong style="color: #0F172A;">${item ? item.pobFuturo.toLocaleString() : '--'} hab.</strong>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 3px; font-size: 11px;">
            <span style="color: #64748B;">Crecimiento acumulado:</span>
            <strong style="color: #0284C7;">+${item ? item.growthPct.toFixed(1) : '--'}%</strong>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 3px; font-size: 11px;">
            <span style="color: #64748B;">Hab. por Centro Salud:</span>
            <strong style="color: #EF4444;">${item?.habCentroFuturo ? item.habCentroFuturo.toLocaleString() : 'Sin centro'}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 11px;">
            <span style="color: #64748B;">Área verde por hab.:</span>
            <strong style="color: ${item?.cumpleOms ? '#10B981' : '#DC2626'};">${item ? item.verdeFuturo.toFixed(1) : '--'} m²</strong>
          </div>
        </div>
      `

      return {
        ...f,
        properties: {
          ...f.properties,
          selected: isSelected,
          color: styleInfo.color,
          fillColor: styleInfo.color,
          fillOpacity: isSelected ? 0.88 : 0.75,
          borderColor: isSelected ? '#0284C7' : '#1E293B',
          borderWidth: isSelected ? 4 : 2,
          labelPermanent: `D${cod}: ${styleInfo.label}`,
          customTooltipHtml: tooltipHtml,
          nombre: `${f.properties?.nombre || 'Distrito ' + cod} · ${styleInfo.textVal}`,
        },
      }
    })

    const featuresAll = [...districtFeatures]

    // Incluir Río Rocha para contexto geográfico urbano
    if (referenciasData?.features) {
      const rochaFeat = referenciasData.features.find(
        (f) => f.properties?.id === 'rio_rocha'
      )
      if (rochaFeat) {
        featuresAll.push({
          ...rochaFeat,
          properties: {
            ...rochaFeat.properties,
            color: '#0284C7',
            borderColor: '#0284C7',
            borderWidth: 4,
            fillOpacity: 0,
            customTooltipHtml: `
              <div style="font-family: inherit; font-size: 12px; min-width: 180px;">
                <strong style="color: #0284C7; font-size: 13px;">Río Rocha (Corredor Ripario)</strong>
                <div style="font-size: 11px; color: #475569; margin-top: 3px;">
                  Eje regulador ecológico de Cochabamba
                </div>
              </div>
            `,
          },
        })
      }
    }

    return {
      type: 'FeatureCollection',
      features: featuresAll,
    }
  }, [
    distritosGeoJson,
    distritosCalculados,
    referenciasData,
    distNum,
    metricaMapa,
    horizonte,
    anioObjetivo,
  ])

  return (
    <div className="planificacion-screen-container">
      {/* 1. Header con Título Principal y Selector de Base Poblacional */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.6rem',
        }}
      >
        <div>
          <span className="neo-micro-tag" style={{ color: '#0284C7' }}>
            ENFOQUE 2 · MODELADO DEMOGRÁFICO Y URBANO
          </span>
          <h2 style={{ margin: '0.15rem 0 0', fontSize: '1.18rem', fontWeight: 800 }}>
            Planificación Territorial a 5 y 10 Años ({anioObjetivo})
          </h2>
          <p
            style={{
              margin: '0.15rem 0 0',
              fontSize: '0.84rem',
              color: 'var(--theme-text-muted, #475569)',
            }}
          >
            Simulación de expansión poblacional, saturación de equipamientos y cálculo de demanda futura de servicios.
          </p>
        </div>

        {/* Selector de Base Poblacional con tooltip */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <PopulationSourceSelector
            value={basePoblacion}
            onChange={setBasePoblacion}
          />
        </div>
      </div>

      {/* 2. 3 Tarjetas KPI Superiores */}
      <section className="plan-kpis-grid">
        {/* KPI 1: Población Municipio Hoy -> Horizonte */}
        <div className="plan-kpi-card kpi-poblacion">
          <div className="plan-kpi-header">
            <span className="plan-kpi-label">
              POBLACIÓN MUNICIPIO HOY → {anioObjetivo}
            </span>
            <span
              className="plan-kpi-badge"
              style={{ background: 'rgba(2, 132, 199, 0.1)', color: '#0284C7' }}
            >
              +{municipalStats.pctCrecTotal.toFixed(1)}% ({activeScenario.label.split(' ')[0]})
            </span>
          </div>
          <div className="plan-kpi-val-row">
            <span className="plan-kpi-val" style={{ color: '#0F172A' }}>
              {Math.round(municipalStats.totalHoy).toLocaleString()}
            </span>
            <span style={{ fontSize: '1.2rem', color: '#94A3B8', fontWeight: 700 }}>
              →
            </span>
            <span className="plan-kpi-val" style={{ color: '#0284C7' }}>
              {Math.round(municipalStats.totalFuturo).toLocaleString()}
            </span>
          </div>
          <span className="plan-kpi-sub">
            +{Math.round(municipalStats.incrementoTotal).toLocaleString()} nuevos habitantes estimados al {anioObjetivo}
          </span>
        </div>

        {/* KPI 2: Distrito que más crece */}
        <div className="plan-kpi-card kpi-aceleracion">
          <div className="plan-kpi-header">
            <span className="plan-kpi-label">MAYOR EXPANSIÓN DEMOGRÁFICA</span>
            <span
              className="plan-kpi-badge"
              style={{ background: 'rgba(220, 38, 38, 0.1)', color: '#DC2626' }}
            >
              Frente de expansión
            </span>
          </div>
          <div className="plan-kpi-val-row">
            <span className="plan-kpi-val" style={{ color: '#DC2626' }}>
              +{municipalStats.maxGrowthDist.growthPct.toFixed(1)}%
            </span>
            <span style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: 700 }}>
              en {horizonte} años
            </span>
          </div>
          <span className="plan-kpi-sub">
            <strong>{municipalStats.maxGrowthDist.nombre}</strong> lidera la tasa de densificación
          </span>
        </div>

        {/* KPI 3: Cobertura de salud promedio */}
        <div className="plan-kpi-card kpi-salud">
          <div className="plan-kpi-header">
            <span className="plan-kpi-label">PRESIÓN PROMEDIO EN SALUD</span>
            <span
              className="plan-kpi-badge"
              style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#059669' }}
            >
              1er Nivel (1.000 m)
            </span>
          </div>
          <div className="plan-kpi-val-row">
            <span className="plan-kpi-val" style={{ color: '#059669' }}>
              61.9%
            </span>
            <span style={{ fontSize: '1.2rem', color: '#94A3B8', fontWeight: 700 }}>
              →
            </span>
            <span
              className="plan-kpi-val"
              style={{ color: horizonte === 5 ? '#059669' : '#EAB308' }}
            >
              {horizonte === 5 ? '61.8%' : '58.4%'}
            </span>
          </div>
          <span className="plan-kpi-sub">
            Riesgo de pérdida de cobertura si no se incorporan nuevos centros
          </span>
        </div>
      </section>

      {/* 3. Barra de Controles: Horizonte, Escenario y Métrica */}
      <section className="plan-controls-bar">
        {/* Selector de Horizonte: A 5 años (2030) | A 10 años (2035) */}
        <div className="plan-control-section">
          <span className="plan-control-label">
            <Calendar size={15} color="#0284C7" /> Horizonte Temporal:
          </span>
          <div className="plan-pills-switch">
            <button
              type="button"
              className={`plan-pill-switch-btn ${horizonte === 5 ? 'is-active' : ''}`}
              onClick={() => setHorizonte(5)}
            >
              A 5 años (2030)
            </button>
            <button
              type="button"
              className={`plan-pill-switch-btn ${horizonte === 10 ? 'is-active' : ''}`}
              onClick={() => setHorizonte(10)}
            >
              A 10 años (2035)
            </button>
          </div>
        </div>

        {/* Selector de Escenario: Bajo (x0.5) | Esperado (x1.0) | Alto (x1.5) */}
        <div className="plan-control-section">
          <span className="plan-control-label">
            <Sparkles size={15} color="#818CF8" /> Escenario:
          </span>
          <div className="plan-pills-switch">
            {SCENARIOS.map((s) => (
              <button
                key={s.id}
                type="button"
                className={`plan-pill-switch-btn ${scenarioId === s.id ? 'is-active' : ''}`}
                onClick={() => setScenarioId(s.id)}
                title={s.desc}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Grid Central: Mapa Térmico (1.25) + Ficha de Proyección "Antes vs. Después" (1) */}
      <section className="plan-main-grid">
        {/* Mapa Térmico */}
        <div className="plan-map-card">
          <div className="plan-map-header">
            <div className="plan-map-title-box">
              <span className="neo-micro-tag">MAPA TÉRMICO DE VULNERABILIDAD FUTURA</span>
              <h3>Saturación y Demanda al {anioObjetivo}</h3>
            </div>

            {/* Botones de Selección de Métrica sobre el mapa */}
            <div className="plan-map-metric-pills">
              <button
                type="button"
                className={`plan-metric-pill-btn ${metricaMapa === 'crecimiento' ? 'is-active' : ''}`}
                onClick={() => setMetricaMapa('crecimiento')}
              >
                Crecimiento Poblacional %
              </button>
              <button
                type="button"
                className={`plan-metric-pill-btn ${metricaMapa === 'salud' ? 'is-active' : ''}`}
                onClick={() => setMetricaMapa('salud')}
              >
                Saturación de Salud
              </button>
              <button
                type="button"
                className={`plan-metric-pill-btn ${metricaMapa === 'colegios' ? 'is-active' : ''}`}
                onClick={() => setMetricaMapa('colegios')}
              >
                Saturación de Colegios
              </button>
              <button
                type="button"
                className={`plan-metric-pill-btn ${metricaMapa === 'verde' ? 'is-active' : ''}`}
                onClick={() => setMetricaMapa('verde')}
              >
                Déficit Áreas Verdes
              </button>
            </div>
          </div>

          {/* GamcMap Oficial sin marcas de agua con CartoDB Positron / Dark Matter */}
          <GamcMap
            geojson={distritosGeoJsonStyled}
            onClickDistrito={(feat) => {
              const dNum = feat?.properties?.codigo_distrito
              if (dNum && onSelectZone) {
                onSelectZone(`distrito-${dNum}`)
              }
            }}
            focusSelected={true}
            height="460px"
          />

          {/* Leyenda Térmica Inferior Dinámica */}
          <div className="plan-map-legend">
            {metricaMapa === 'crecimiento' && (
              <div className="plan-legend-scale">
                <span className="plan-legend-step">
                  <span className="plan-legend-box" style={{ background: '#38BDF8' }} />
                  &lt; {horizonte === 5 ? '3%' : '6%'}
                </span>
                <span className="plan-legend-step">
                  <span className="plan-legend-box" style={{ background: '#F59E0B' }} />
                  {horizonte === 5 ? '3%–5%' : '6%–10%'}
                </span>
                <span className="plan-legend-step">
                  <span className="plan-legend-box" style={{ background: '#F97316' }} />
                  {horizonte === 5 ? '5%–7%' : '10%–14%'}
                </span>
                <span className="plan-legend-step">
                  <span className="plan-legend-box" style={{ background: '#DC2626' }} />
                  &gt; {horizonte === 5 ? '7%' : '14%'}
                </span>
              </div>
            )}

            {metricaMapa === 'salud' && (
              <div className="plan-legend-scale">
                <span className="plan-legend-step">
                  <span className="plan-legend-box" style={{ background: '#10B981' }} />
                  &lt; 25k hab/centro
                </span>
                <span className="plan-legend-step">
                  <span className="plan-legend-box" style={{ background: '#F59E0B' }} />
                  25k–40k hab/centro
                </span>
                <span className="plan-legend-step">
                  <span className="plan-legend-box" style={{ background: '#DC2626' }} />
                  &gt; 40k o Sin Centro
                </span>
              </div>
            )}

            {metricaMapa === 'colegios' && (
              <div className="plan-legend-scale">
                <span className="plan-legend-step">
                  <span className="plan-legend-box" style={{ background: '#10B981' }} />
                  &lt; 4.7k hab/col
                </span>
                <span className="plan-legend-step">
                  <span className="plan-legend-box" style={{ background: '#F59E0B' }} />
                  4.7k–7.0k hab/col
                </span>
                <span className="plan-legend-step">
                  <span className="plan-legend-box" style={{ background: '#DC2626' }} />
                  &gt; 7.0k hab/col (Déficit)
                </span>
              </div>
            )}

            {metricaMapa === 'verde' && (
              <div className="plan-legend-scale">
                <span className="plan-legend-step">
                  <span className="plan-legend-box" style={{ background: '#10B981' }} />
                  ≥ 12 m²
                </span>
                <span className="plan-legend-step">
                  <span className="plan-legend-box" style={{ background: '#84CC16' }} />
                  9–12 m² (OMS)
                </span>
                <span className="plan-legend-step">
                  <span className="plan-legend-box" style={{ background: '#F97316' }} />
                  6–9 m² (Alerta)
                </span>
                <span className="plan-legend-step">
                  <span className="plan-legend-box" style={{ background: '#DC2626' }} />
                  &lt; 6 m² (Crítico)
                </span>
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span
                style={{
                  width: 14,
                  height: 3,
                  background: '#0284C7',
                  borderRadius: 2,
                  display: 'inline-block',
                }}
              />
              <span style={{ fontWeight: 700, color: '#0284C7' }}>Río Rocha</span>
            </div>
          </div>
        </div>

        {/* Ficha de Proyección del Distrito ("ANTES VS. DESPUÉS") */}
        <div className="plan-ficha-card">
          <div className="plan-ficha-header">
            <div className="plan-ficha-title">
              <h3>{activeDistrictCalc?.nombre || 'Distrito'}</h3>
              <span>
                Ficha Comparativa: 2025 (Hoy) vs. {anioObjetivo} ({horizonte} años)
              </span>
            </div>
            <span
              className="plan-kpi-badge"
              style={{
                background:
                  activeDistrictCalc?.growthPct >= 7
                    ? 'rgba(220, 38, 38, 0.12)'
                    : 'rgba(2, 132, 199, 0.12)',
                color: activeDistrictCalc?.growthPct >= 7 ? '#DC2626' : '#0284C7',
              }}
            >
              +{activeDistrictCalc?.growthPct.toFixed(1)}% demográfico
            </span>
          </div>

          {/* 4 Indicadores de Comparación Antes vs Después */}
          <div className="plan-indicators-list">
            {/* Indicador 1: Población residente (+nuevos habitantes) */}
            <div className="plan-indicator-box">
              <div className="plan-indicator-top">
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Users size={14} color="#0284C7" /> 1. Población Residente
                </span>
                <span style={{ color: '#0284C7', fontSize: '0.72rem' }}>
                  +{activeDistrictCalc?.incrementoPob.toLocaleString()} nuevos hab.
                </span>
              </div>
              <div className="plan-compare-row">
                <div className="plan-compare-col">
                  <span className="lbl">Hoy (2025):</span>
                  <strong className="val">
                    {activeDistrictCalc?.pobHoy.toLocaleString()} hab.
                  </strong>
                </div>
                <span className="plan-compare-arrow">→</span>
                <div className="plan-compare-col">
                  <span className="lbl">{anioObjetivo}:</span>
                  <strong className="val" style={{ color: '#0284C7' }}>
                    {activeDistrictCalc?.pobFuturo.toLocaleString()} hab.
                  </strong>
                </div>
              </div>
            </div>

            {/* Indicador 2: Habitantes por Centro de Salud (centros requeridos) */}
            <div className="plan-indicator-box">
              <div className="plan-indicator-top">
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <HeartPulse size={14} color="#DC2626" /> 2. Salud de 1er Nivel
                </span>
                <span style={{ fontSize: '0.7rem', color: '#64748B' }}>
                  {activeDistrictCalc?.saludCentros}{' '}
                  {activeDistrictCalc?.saludCentros === 1 ? 'centro actual' : 'centros actuales'}
                </span>
              </div>
              <div className="plan-compare-row">
                <div className="plan-compare-col">
                  <span className="lbl">Hoy:</span>
                  <strong className="val">
                    {activeDistrictCalc?.habCentroHoy
                      ? activeDistrictCalc.habCentroHoy.toLocaleString() + ' hab/c'
                      : 'Sin centro'}
                  </strong>
                </div>
                <span className="plan-compare-arrow">→</span>
                <div className="plan-compare-col">
                  <span className="lbl">{anioObjetivo}:</span>
                  <strong
                    className="val"
                    style={{
                      color:
                        activeDistrictCalc?.saludCentros === 0 ||
                        (activeDistrictCalc?.habCentroFuturo || 0) > 35000
                          ? '#DC2626'
                          : '#F59E0B',
                    }}
                  >
                    {activeDistrictCalc?.habCentroFuturo
                      ? activeDistrictCalc.habCentroFuturo.toLocaleString() + ' hab/c'
                      : 'Sin centro'}
                  </strong>
                </div>
              </div>
              <div
                className={`plan-indicator-req ${
                  activeDistrictCalc?.centrosRequeridos > 0 ? 'is-alert' : ''
                }`}
              >
                {activeDistrictCalc?.saludCentros === 0
                  ? '⚠️ Requiere urgente 1er centro primario de salud (+1 centro adicional).'
                  : activeDistrictCalc?.centrosRequeridos > 0
                  ? `⚠️ Se requiere construir +${activeDistrictCalc.centrosRequeridos} nuevo(s) centro(s) para mantener la cobertura.`
                  : '✓ Capacidad instalada suficiente para absorber el crecimiento.'}
              </div>
            </div>

            {/* Indicador 3: Habitantes por Unidad Educativa (colegios requeridos) */}
            <div className="plan-indicator-box">
              <div className="plan-indicator-top">
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <GraduationCap size={14} color="#2563EB" /> 3. Red Educativa GAMC
                </span>
                <span style={{ fontSize: '0.7rem', color: '#64748B' }}>
                  {activeDistrictCalc?.colegios} colegios actuales
                </span>
              </div>
              <div className="plan-compare-row">
                <div className="plan-compare-col">
                  <span className="lbl">Hoy:</span>
                  <strong className="val">
                    {activeDistrictCalc?.habColegioHoy
                      ? activeDistrictCalc.habColegioHoy.toLocaleString() + ' hab/col'
                      : '--'}
                  </strong>
                </div>
                <span className="plan-compare-arrow">→</span>
                <div className="plan-compare-col">
                  <span className="lbl">{anioObjetivo}:</span>
                  <strong
                    className="val"
                    style={{
                      color:
                        (activeDistrictCalc?.habColegioFuturo || 0) > 5500
                          ? '#DC2626'
                          : '#2563EB',
                    }}
                  >
                    {activeDistrictCalc?.habColegioFuturo
                      ? activeDistrictCalc.habColegioFuturo.toLocaleString() + ' hab/col'
                      : '--'}
                  </strong>
                </div>
              </div>
              <div
                className={`plan-indicator-req ${
                  activeDistrictCalc?.colegiosRequeridos > 0 ? 'is-alert' : ''
                }`}
              >
                {activeDistrictCalc?.colegiosRequeridos > 0
                  ? `Se requieren +${activeDistrictCalc.colegiosRequeridos} nuevo(s) colegio(s) o módulos de ampliación escolar.`
                  : '✓ Infraestructura escolar suficiente para el crecimiento proyectado.'}
              </div>
            </div>

            {/* Indicador 4: Área Verde por Habitante (m²/hab con alerta OMS) */}
            <div className="plan-indicator-box">
              <div className="plan-indicator-top">
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Trees size={14} color="#059669" /> 4. Área Verde por Habitante
                </span>
                <span style={{ fontSize: '0.7rem', color: '#64748B' }}>
                  Estándar OMS: ≥ 9.0 m²/hab
                </span>
              </div>
              <div className="plan-compare-row">
                <div className="plan-compare-col">
                  <span className="lbl">Hoy:</span>
                  <strong className="val">
                    {activeDistrictCalc?.verdeHoy.toFixed(1)} m²/hab
                  </strong>
                </div>
                <span className="plan-compare-arrow">→</span>
                <div className="plan-compare-col">
                  <span className="lbl">{anioObjetivo}:</span>
                  <strong
                    className="val"
                    style={{
                      color: activeDistrictCalc?.cumpleOms ? '#059669' : '#DC2626',
                    }}
                  >
                    {activeDistrictCalc?.verdeFuturo.toFixed(1)} m²/hab
                  </strong>
                </div>
              </div>
              <div
                className={`plan-indicator-req ${
                  !activeDistrictCalc?.cumpleOms ? 'is-alert' : ''
                }`}
              >
                {!activeDistrictCalc?.cumpleOms
                  ? `⚠️ Déficit crítico: Cae a ${activeDistrictCalc?.verdeFuturo.toFixed(
                      1
                    )} m² (-${activeDistrictCalc?.deficitVerdeM2.toFixed(
                      1
                    )} m² bajo estándar OMS). Faltan ${(
                      (activeDistrictCalc?.m2VerdesNecesarios || 0) / 10000
                    ).toFixed(1)} ha de parques.`
                  : `✓ Cumple estándar OMS (${activeDistrictCalc?.verdeFuturo.toFixed(
                      1
                    )} m²/hab, +${(
                      (activeDistrictCalc?.verdeFuturo || 9) - 9
                    ).toFixed(1)} m² de superávit).`}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Sección Inferior: Gráfico Comparativo y Prioridades de Expansión */}
      <section className="plan-bottom-grid">
        {/* Gráfico SVG comparativo Hoy vs Horizonte */}
        <div className="plan-chart-card">
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '0.4rem',
            }}
          >
            <div>
              <span className="neo-micro-tag">ANÁLISIS MUNICIPAL MULTI-DISTRITO</span>
              <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700 }}>
                Comparativa de los 15 Distritos: Hoy vs. {anioObjetivo}
              </h3>
            </div>

            {/* Selector de Métrica para Gráfico */}
            <div style={{ display: 'flex', gap: '0.25rem' }}>
              <button
                type="button"
                className={`plan-metric-pill-btn ${metricaGrafico === 'poblacion' ? 'is-active' : ''}`}
                onClick={() => setMetricaGrafico('poblacion')}
                style={{ fontSize: '0.68rem', padding: '0.2rem 0.5rem' }}
              >
                Población
              </button>
              <button
                type="button"
                className={`plan-metric-pill-btn ${metricaGrafico === 'salud' ? 'is-active' : ''}`}
                onClick={() => setMetricaGrafico('salud')}
                style={{ fontSize: '0.68rem', padding: '0.2rem 0.5rem' }}
              >
                Cobertura Salud %
              </button>
              <button
                type="button"
                className={`plan-metric-pill-btn ${metricaGrafico === 'verde' ? 'is-active' : ''}`}
                onClick={() => setMetricaGrafico('verde')}
                style={{ fontSize: '0.68rem', padding: '0.2rem 0.5rem' }}
              >
                Área Verde m²
              </button>
            </div>
          </div>

          {/* Gráfico SVG de barras agrupadas */}
          <div style={{ position: 'relative', width: '100%', height: '210px', marginTop: '0.35rem' }}>
            <svg
              viewBox="0 0 540 210"
              style={{ width: '100%', height: '100%', overflow: 'visible' }}
            >
              {[25, 50, 75, 100].map((val) => {
                const y = 180 - (val / 100) * 155
                return (
                  <g key={val}>
                    <line
                      x1="30"
                      y1={y}
                      x2="525"
                      y2={y}
                      stroke="var(--theme-border, #E2E8F0)"
                      strokeDasharray="3,3"
                      strokeWidth="1"
                    />
                    <text
                      x="24"
                      y={y + 3}
                      fill="var(--theme-text-muted, #64748B)"
                      fontSize="8"
                      textAnchor="end"
                    >
                      {metricaGrafico === 'poblacion'
                        ? `${Math.round((val / 100) * 150)}k`
                        : metricaGrafico === 'verde'
                        ? `${Math.round((val / 100) * 30)}m²`
                        : `${val}%`}
                    </text>
                  </g>
                )
              })}

              {distritosCalculados.map((d, idx) => {
                const slotWidth = 495 / 15
                const x0 = 30 + idx * slotWidth
                const barW = 10
                const isSelected = parseInt(String(d.id), 10) === distNum

                // Normalización de valores para el gráfico
                let maxRef = 100
                let valHoy = d.cobSaludHoy
                let valFuturo = d.cobSaludFuturo

                if (metricaGrafico === 'poblacion') {
                  maxRef = 150000
                  valHoy = d.pobHoy
                  valFuturo = d.pobFuturo
                } else if (metricaGrafico === 'verde') {
                  maxRef = 30
                  valHoy = d.verdeHoy
                  valFuturo = d.verdeFuturo
                }

                const hHoy = Math.max(2, Math.min(155, (valHoy / maxRef) * 155))
                const yHoy = 180 - hHoy

                const hFuturo = Math.max(2, Math.min(155, (valFuturo / maxRef) * 155))
                const yFuturo = 180 - hFuturo

                return (
                  <g
                    key={d.id}
                    onClick={() => onSelectZone?.(`distrito-${d.id}`)}
                    style={{ cursor: 'pointer' }}
                  >
                    {isSelected && (
                      <rect
                        x={x0 + 1}
                        y="15"
                        width={slotWidth - 2}
                        height="170"
                        fill="rgba(2, 132, 199, 0.12)"
                        rx="3"
                      />
                    )}
                    {/* Barra Hoy */}
                    <rect
                      x={x0 + 3}
                      y={yHoy}
                      width={barW}
                      height={hHoy}
                      fill="#0284C7"
                      rx="2"
                    >
                      <title>{`${d.nombre} Hoy: ${valHoy.toLocaleString()}`}</title>
                    </rect>
                    {/* Barra Futuro */}
                    <rect
                      x={x0 + 3 + barW + 2}
                      y={yFuturo}
                      width={barW}
                      height={hFuturo}
                      fill="#818CF8"
                      rx="2"
                    >
                      <title>{`${d.nombre} ${anioObjetivo}: ${valFuturo.toLocaleString()}`}</title>
                    </rect>
                    {/* Etiqueta X */}
                    <text
                      x={x0 + slotWidth / 2}
                      y="195"
                      fill={isSelected ? '#0284C7' : 'var(--theme-text-muted, #64748B)'}
                      fontWeight={isSelected ? 800 : 500}
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

          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '1.2rem',
              fontSize: '0.72rem',
              color: 'var(--theme-text-muted, #64748B)',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span
                style={{
                  width: 10,
                  height: 10,
                  background: '#0284C7',
                  borderRadius: 2,
                }}
              />
              2025 (Hoy)
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span
                style={{
                  width: 10,
                  height: 10,
                  background: '#818CF8',
                  borderRadius: 2,
                }}
              />
              {anioObjetivo} ({horizonte} años)
            </span>
          </div>
        </div>

        {/* Prioridades de Inversión y Expansión GAMC */}
        <div className="plan-prioridades-card">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              borderBottom: '1px solid var(--theme-border, #E2E8F0)',
              paddingBottom: '0.45rem',
            }}
          >
            <AlertTriangle size={17} color="#DC2626" />
            <div>
              <h3 style={{ margin: 0, fontSize: '0.88rem', fontWeight: 700 }}>
                Prioridades de Equipamiento al {anioObjetivo}
              </h3>
              <span style={{ fontSize: '0.7rem', color: 'var(--theme-text-muted, #64748B)' }}>
                Distritos con mayor desbalance entre crecimiento y cobertura instalada
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {distritosUrgentes.map((d) => (
              <div
                key={d.id}
                style={{
                  background: '#F8FAFC',
                  border: '1px solid var(--theme-border, #E2E8F0)',
                  borderRadius: '8px',
                  padding: '0.55rem 0.75rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.25rem',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <strong style={{ fontSize: '0.82rem', color: '#0F172A' }}>
                    {d.nombre}
                  </strong>
                  <span
                    style={{
                      fontSize: '0.68rem',
                      padding: '0.1rem 0.45rem',
                      borderRadius: '4px',
                      background: 'rgba(220, 38, 38, 0.1)',
                      color: '#DC2626',
                      fontWeight: 700,
                    }}
                  >
                    +{d.growthPct.toFixed(1)}% crecimiento
                  </span>
                </div>

                <p
                  style={{
                    margin: 0,
                    fontSize: '0.73rem',
                    color: '#64748B',
                    lineHeight: 1.35,
                  }}
                >
                  {d.saludCentros === 0
                    ? `Carece de centros de primer nivel. Al ${anioObjetivo} sumará +${d.incrementoPob.toLocaleString()} hab. sin cobertura primaria.`
                    : `Atenderá a ${d.habCentroFuturo.toLocaleString()} hab/centro. Se requieren +${d.centrosRequeridos} nuevo(s) centro(s).`}
                </p>

                <div
                  style={{
                    marginTop: '0.2rem',
                    display: 'flex',
                    justifyContent: 'flex-end',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      onSelectZone?.(`distrito-${d.id}`)
                      onNavigateModule?.('simulador-equipamientos')
                    }}
                    className="puntos-btn-action"
                    style={{ fontSize: '0.68rem', padding: '0.2rem 0.5rem' }}
                  >
                    Simular nuevo equipamiento
                    <ArrowRight size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
