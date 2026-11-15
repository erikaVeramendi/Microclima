/**
 * src/components/panel/SensadoVirtualScreen.jsx
 * Pestaña 4 · Sensado virtual con IA
 * Integra:
 *  - Subpestaña 1: "Estimación por IA" (validación del modelo Gradient Boosting, mapa de tendencia, ficha distrital, observado vs estimado y serie con banda de incertidumbre p10-p90).
 *  - Subpestaña 2: "Verdad de terreno: Red MÓNICA" (estaciones Kanata y SEMAPA, perfil 24h, serie mensual, y relación real con incendios).
 */

import { useState, useMemo } from 'react'
import {
  Cpu,
  Radio,
  Layers,
  MapPin,
  TrendingDown,
  Info,
  Flame,
  Clock,
  Calendar,
} from 'lucide-react'
import { useJSON } from '../../lib/datos'
import { COCHABAMBA_DISTRICT_SVGS } from '../../data/cochabambaDistrictsSvg'
import { COCHABAMBA_ZONES } from '../../data/internalPanelData'
import './SensadoVirtualScreen.css'

function formatNum(val, decimals = 1) {
  if (val === null || val === undefined || isNaN(val)) return '—'
  return Number(val).toLocaleString('es-BO', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  })
}

function formatSigned(val, decimals = 2) {
  if (val === null || val === undefined || isNaN(val)) return '—'
  const prefix = val > 0 ? '+' : ''
  return prefix + formatNum(val, decimals)
}

export function SensadoVirtualScreen({
  selectedZoneId = 'distrito-1',
  onSelectZone,
}) {
  const [activeSubTab, setActiveSubTab] = useState('ia') // 'ia' | 'monica'
  const [selectedStationPrueba, setSelectedStationPrueba] = useState('Kanata')
  const [monicaViewMode, setMonicaViewMode] = useState('diurna') // 'diurna' | 'mensual'

  // Carga de datos
  const { datos: sv, cargando: cargandoSv, error: errorSv } = useJSON('sensado_virtual.json')
  const { datos: monica } = useJSON('red_monica_resumen.json')
  const { datos: tj } = useJSON('tendencias_distritos.json')

  // Distrito seleccionado
  const districtNum = useMemo(() => {
    const num = parseInt(String(selectedZoneId || '').replace('distrito-', ''), 10)
    return isNaN(num) || num < 1 || num > 15 ? 1 : num
  }, [selectedZoneId])

  const districtData = useMemo(() => {
    if (!sv || !sv.distritos) return null
    return (
      sv.distritos.find((d) => String(d.id) === String(districtNum)) ||
      sv.distritos[0]
    )
  }, [sv, districtNum])

  const activeZoneInfo = useMemo(() => {
    return (
      COCHABAMBA_ZONES.find((z) => z.id === `distrito-${districtNum}`) || {
        name: `Distrito ${districtNum}`,
        shortName: `D${districtNum}`,
      }
    )
  }, [districtNum])

  // Rango probable promedio de la serie (p10 a p90)
  const rangoProbablePromedio = useMemo(() => {
    if (!districtData || !districtData.serie || districtData.serie.length === 0) {
      return { p10: 0, p90: 0 }
    }
    const p10Sum = districtData.serie.reduce((acc, it) => acc + (it.p10 || 0), 0)
    const p90Sum = districtData.serie.reduce((acc, it) => acc + (it.p90 || 0), 0)
    const n = districtData.serie.length
    return {
      p10: +(p10Sum / n).toFixed(1),
      p90: +(p90Sum / n).toFixed(1),
    }
  }, [districtData])

  // Serie de estaciones de prueba (Observado vs Estimado)
  const pruebaEstacion = useMemo(() => {
    if (!sv || !sv.estaciones_prueba || !Array.isArray(sv.estaciones_prueba)) return null
    return (
      sv.estaciones_prueba.find((ep) =>
        ep.zona.toLowerCase().includes(selectedStationPrueba.toLowerCase())
      ) || sv.estaciones_prueba[0]
    )
  }, [sv, selectedStationPrueba])

  // Layout geométrico para el Gráfico 1: Observado vs Estimado
  const chartObsVsEstLayout = useMemo(() => {
    const W = 460
    const H = 220
    const padL = 40
    const padR = 20
    const padT = 20
    const padB = 30
    const plotW = W - padL - padR
    const plotH = H - padT - padB

    if (!pruebaEstacion || !pruebaEstacion.serie || pruebaEstacion.serie.length === 0) {
      return { W, H, padL, padR, padT, padB, obsPoints: [], estPoints: [], yTicks: [], xTicks: [] }
    }

    const serie = pruebaEstacion.serie
    const allVals = serie.flatMap((d) => [d.observado, d.estimado].filter((v) => v !== null && !isNaN(v)))
    const yMin = 0
    const yMax = Math.max(120, Math.max(...allVals) * 1.1)

    const obsPoints = []
    const estPoints = []

    serie.forEach((d, i) => {
      const x = padL + (i / Math.max(1, serie.length - 1)) * plotW
      if (d.observado !== null && !isNaN(d.observado)) {
        const yObs = padT + plotH - ((d.observado - yMin) / (yMax - yMin)) * plotH
        obsPoints.push({ x, y: yObs, val: d.observado, fecha: d.fecha })
      }
      if (d.estimado !== null && !isNaN(d.estimado)) {
        const yEst = padT + plotH - ((d.estimado - yMin) / (yMax - yMin)) * plotH
        estPoints.push({ x, y: yEst, val: d.estimado, fecha: d.fecha })
      }
    })

    const yTicks = [0, 45, 100, Math.round(yMax)].map((v) => ({
      val: v,
      y: padT + plotH - ((v - yMin) / (yMax - yMin)) * plotH,
    }))

    const step = Math.max(1, Math.floor(serie.length / 5))
    const xTicks = []
    for (let i = 0; i < serie.length; i += step) {
      xTicks.push({
        x: padL + (i / Math.max(1, serie.length - 1)) * plotW,
        label: serie[i].fecha,
      })
    }

    return { W, H, padL, padR, padT, padB, obsPoints, estPoints, yTicks, xTicks, yMin, yMax }
  }, [pruebaEstacion])

  // Layout geométrico para el Gráfico 2: Serie del Distrito con Banda p10-p90
  const chartDistrictSerieLayout = useMemo(() => {
    const W = 460
    const H = 220
    const padL = 40
    const padR = 20
    const padT = 20
    const padB = 30
    const plotW = W - padL - padR
    const plotH = H - padT - padB

    if (!districtData || !districtData.serie || districtData.serie.length === 0) {
      return { W, H, padL, padR, padT, padB, linePoints: [], bandArea: '', yTicks: [], xTicks: [] }
    }

    const serie = districtData.serie
    const allVals = serie.flatMap((d) => [d.pm10, d.p10, d.p90].filter((v) => v !== null && !isNaN(v)))
    const yMin = 0
    const yMax = Math.max(130, Math.max(...allVals) * 1.1)

    const points = []
    const topPoints = []
    const bottomPoints = []

    serie.forEach((d, i) => {
      const x = padL + (i / Math.max(1, serie.length - 1)) * plotW
      const yVal = padT + plotH - ((d.pm10 - yMin) / (yMax - yMin)) * plotH
      const yP10 = padT + plotH - ((d.p10 - yMin) / (yMax - yMin)) * plotH
      const yP90 = padT + plotH - ((d.p90 - yMin) / (yMax - yMin)) * plotH

      points.push({ x, y: yVal, val: d.pm10, fecha: d.fecha })
      topPoints.push({ x, y: yP90 })
      bottomPoints.push({ x, y: yP10 })
    })

    // Polígono de la banda sombreada entre p10 y p90
    let bandArea = ''
    if (topPoints.length > 1) {
      const topPath = topPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')
      const bottomPath = bottomPoints
        .slice()
        .reverse()
        .map((p) => `L ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
        .join(' ')
      bandArea = `${topPath} ${bottomPath} Z`
    }

    const whoY = padT + plotH - ((45 - yMin) / (yMax - yMin)) * plotH

    const yTicks = [0, 45, 80, Math.round(yMax)].map((v) => ({
      val: v,
      y: padT + plotH - ((v - yMin) / (yMax - yMin)) * plotH,
    }))

    const step = Math.max(1, Math.floor(serie.length / 5))
    const xTicks = []
    for (let i = 0; i < serie.length; i += step) {
      xTicks.push({
        x: padL + (i / Math.max(1, serie.length - 1)) * plotW,
        label: serie[i].fecha,
      })
    }

    return { W, H, padL, padR, padT, padB, points, bandArea, whoY, yTicks, xTicks }
  }, [districtData])

  // Datos de la Red MÓNICA para la subpestaña 2
  const monicaData = useMemo(() => {
    if (!monica || !monica.estaciones) return null
    return monica.estaciones
  }, [monica])

  // Layout geométrico para el gráfico de la Red MÓNICA
  const chartMonicaLayout = useMemo(() => {
    const W = 720
    const H = 240
    const padL = 45
    const padR = 25
    const padT = 20
    const padB = 30
    const plotW = W - padL - padR
    const plotH = H - padT - padB

    if (!monicaData || !monicaData.kanata || !monicaData.semapa) {
      return { W, H, padL, padR, padT, padB, kPts: [], sPts: [], whoY: 0, yTicks: [], xTicks: [] }
    }

    const isDiurnal = monicaViewMode === 'diurna'
    const serieK = isDiurnal ? monicaData.kanata.perfil_horario : monicaData.kanata.serie_mensual
    const serieS = isDiurnal ? monicaData.semapa.perfil_horario : monicaData.semapa.serie_mensual

    const valsK = (serieK || []).map((it) => it.pm10)
    const valsS = (serieS || []).map((it) => it.pm10)
    const allVals = [...valsK, ...valsS]

    const yMin = 0
    const yMax = Math.max(110, Math.max(...allVals) * 1.15)
    const whoY = padT + plotH - ((45 - yMin) / (yMax - yMin)) * plotH

    const n = Math.max(serieK?.length || 1, serieS?.length || 1)

    const kPts = (serieK || []).map((it, idx) => ({
      x: padL + (idx / Math.max(1, (serieK?.length || 1) - 1)) * plotW,
      y: padT + plotH - ((it.pm10 - yMin) / (yMax - yMin)) * plotH,
      val: it.pm10,
      label: isDiurnal ? it.etiqueta : it.mes,
    }))

    const sPts = (serieS || []).map((it, idx) => ({
      x: padL + (idx / Math.max(1, (serieS?.length || 1) - 1)) * plotW,
      y: padT + plotH - ((it.pm10 - yMin) / (yMax - yMin)) * plotH,
      val: it.pm10,
      label: isDiurnal ? it.etiqueta : it.mes,
    }))

    const yTicks = [0, 45, 80, Math.round(yMax)].map((v) => ({
      val: v,
      y: padT + plotH - ((v - yMin) / (yMax - yMin)) * plotH,
    }))

    const step = isDiurnal ? 3 : Math.max(1, Math.floor(n / 6))
    const xTicks = []
    const refSerie = serieK && serieK.length >= (serieS?.length || 0) ? serieK : serieS || []
    for (let i = 0; i < refSerie.length; i += step) {
      xTicks.push({
        x: padL + (i / Math.max(1, refSerie.length - 1)) * plotW,
        label: isDiurnal ? refSerie[i].etiqueta : refSerie[i].mes,
      })
    }

    return { W, H, padL, padR, padT, padB, kPts, sPts, whoY, yTicks, xTicks }
  }, [monicaData, monicaViewMode])

  if (cargandoSv && activeSubTab === 'ia') {
    return (
      <div className="neo-screen">
        <div className="sensado-screen">
          <div className="sensado-notice-bar">
            <span>Cargando modelo de sensado virtual e inferencias distritales...</span>
          </div>
        </div>
      </div>
    )
  }

  if (errorSv || !sv) {
    return (
      <div className="neo-screen">
        <div className="sensado-screen">
          <div className="sensado-notice-bar">
            <Info size={16} color="var(--color-icon)" />
            <span>Datos en proceso: el modelo se está entrenando</span>
          </div>
        </div>
      </div>
    )
  }

  const valDiasNoVistos = sv.meta?.validacion?.dias_no_vistos
  const valPromediosMensuales = sv.meta?.validacion?.promedios_mensuales
  const valKanataPredice = sv.meta?.validacion?.['Kanata predice SEMAPA']
  const valSemapaPredice = sv.meta?.validacion?.['SEMAPA predice Kanata']

  return (
    <div className="neo-screen">
      <div className="sensado-screen">
        {/* Encabezado y Selector de Subpestañas */}
        <div className="sensado-header">
          <div className="sensado-top-row">
            <h2 className="sensado-title">
              <Cpu size={22} color="var(--color-icon)" strokeWidth={1.75} />
              Sensado virtual con IA
            </h2>

            {/* Subpestañas */}
            <div className="sensado-tab-pills">
              <button
                type="button"
                className={`sensado-pill-btn ${activeSubTab === 'ia' ? 'is-active' : ''}`}
                onClick={() => setActiveSubTab('ia')}
              >
                <Cpu size={15} color="var(--color-icon)" />
                Estimación por IA
              </button>
              <button
                type="button"
                className={`sensado-pill-btn ${activeSubTab === 'monica' ? 'is-active' : ''}`}
                onClick={() => setActiveSubTab('monica')}
              >
                <Radio size={15} color="var(--color-icon)" />
                Verdad de terreno: Red MÓNICA
              </button>
            </div>
          </div>

          <p className="sensado-subtitle">
            {activeSubTab === 'ia'
              ? 'La Alcaldía tiene 2 estaciones de aire. La IA estima cómo está el aire en los 15 distritos.'
              : 'Mediciones continuas oficiales en tierra de la Red MÓNICA (GAMC).'}
          </p>
        </div>

        {/* =========================================================================
            SUBPESTAÑA 1: ESTIMACIÓN POR IA
            ========================================================================= */}
        {activeSubTab === 'ia' && (
          <>
            {/* Tarjetas (4) */}
            <div className="sensado-kpi-grid">
              {/* Tarjeta 1: Meses que nunca vio */}
              <div className="sensado-kpi-card">
                <div className="sensado-kpi-head">
                  <span className="sensado-kpi-label">Meses que nunca vio</span>
                  <span
                    className="sensado-help-icon"
                    data-tooltip="R² = qué tanto acierta (1 es perfecto); MAE = error promedio en µg/m³ (menor es mejor)."
                  >
                    ?
                  </span>
                </div>
                <div className="sensado-kpi-val">
                  R² {formatNum(valDiasNoVistos?.modelo?.r2, 3)}
                  <span className="sensado-kpi-unit">
                    · MAE {formatNum(valDiasNoVistos?.modelo?.mae, 1)} µg/m³
                  </span>
                </div>
                <div className="sensado-kpi-sub">
                  Prueba de generalización en meses no usados en el entrenamiento
                  <div className="sensado-kpi-baseline">
                    Línea base: R² = {formatNum(valDiasNoVistos?.linea_base?.r2, 3)} · MAE ={' '}
                    {formatNum(valDiasNoVistos?.linea_base?.mae, 1)}
                  </div>
                </div>
              </div>

              {/* Tarjeta 2: Promedios mensuales */}
              <div className="sensado-kpi-card">
                <div className="sensado-kpi-head">
                  <span className="sensado-kpi-label">Promedios mensuales</span>
                  <span
                    className="sensado-help-icon"
                    data-tooltip="R² = qué tanto acierta (1 es perfecto); MAE = error promedio en µg/m³ (menor es mejor)."
                  >
                    ?
                  </span>
                </div>
                <div className="sensado-kpi-val">
                  R² {formatNum(valPromediosMensuales?.modelo?.r2, 3)}
                  <span className="sensado-kpi-unit">
                    · MAE {formatNum(valPromediosMensuales?.modelo?.mae, 1)} µg/m³
                  </span>
                </div>
                <div className="sensado-kpi-sub">
                  Comparación a nivel de agregación mensual (la escala de la app)
                  <div className="sensado-kpi-baseline">
                    Línea base: R² = {formatNum(valPromediosMensuales?.linea_base?.r2, 3)} · MAE ={' '}
                    {formatNum(valPromediosMensuales?.linea_base?.mae, 1)}
                  </div>
                </div>
              </div>

              {/* Tarjeta 3: Una estación predice la otra */}
              <div className="sensado-kpi-card">
                <div className="sensado-kpi-head">
                  <span className="sensado-kpi-label">Una estación predice la otra</span>
                  <Radio size={16} color="var(--color-icon)" />
                </div>
                <div className="sensado-kpi-val" style={{ fontSize: '1.25rem' }}>
                  r = {formatNum(valKanataPredice?.modelo?.correlacion, 2)} y{' '}
                  {formatNum(valSemapaPredice?.modelo?.correlacion, 2)}
                </div>
                <div className="sensado-kpi-sub">
                  Kanata predice SEMAPA (r = {formatNum(valKanataPredice?.modelo?.correlacion, 2)}) · SEMAPA predice Kanata (r ={' '}
                  {formatNum(valSemapaPredice?.modelo?.correlacion, 2)})
                  <div className="sensado-kpi-baseline">
                    Correlación espacial cruzada norte–sur
                  </div>
                </div>
              </div>

              {/* Tarjeta 4: Variable más importante */}
              <div className="sensado-kpi-card">
                <div className="sensado-kpi-head">
                  <span className="sensado-kpi-label">Variables clave</span>
                  <Layers size={16} color="var(--color-icon)" />
                </div>
                <div className="sensado-kpi-val" style={{ fontSize: '1.15rem' }}>
                  1. Época del año (83,5 %)
                </div>
                <div className="sensado-kpi-sub">
                  2. Calor del suelo (11,7 %) · 3. Incendios semana (10,0 %)
                  <div className="sensado-kpi-baseline">
                    Importancia por permutación del modelo
                  </div>
                </div>
              </div>
            </div>

            {/* Bloque: Cómo leer estas pruebas */}
            {sv.meta?.como_leer && (
              <div className="sensado-how-to-read">
                <h4 className="sensado-htr-title">
                  <Info size={14} color="var(--theme-accent)" />
                  Cómo leer estas pruebas (transparencia del modelo)
                </h4>
                <div className="sensado-htr-grid">
                  <div className="sensado-htr-item">
                    <span className="sensado-htr-name">Meses que nunca vio</span>
                    <p className="sensado-htr-desc">{sv.meta.como_leer.dias_no_vistos}</p>
                  </div>
                  <div className="sensado-htr-item">
                    <span className="sensado-htr-name">Promedios mensuales</span>
                    <p className="sensado-htr-desc">{sv.meta.como_leer.promedios_mensuales}</p>
                  </div>
                  <div className="sensado-htr-item">
                    <span className="sensado-htr-name">Futuro 2025–2026 (R² −0,07)</span>
                    <p className="sensado-htr-desc">{sv.meta.como_leer.futuro_2025_2026}</p>
                  </div>
                  <div className="sensado-htr-item">
                    <span className="sensado-htr-name">Entre estaciones</span>
                    <p className="sensado-htr-desc">{sv.meta.como_leer.entre_estaciones}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Centro: Mapa de Tendencia Distrital + Ficha */}
            <div className="sensado-center-grid">
              {/* Mapa de los 15 distritos por TENDENCIA */}
              <div className="sensado-panel-box">
                <div className="sensado-panel-head">
                  <h3 className="sensado-panel-title">
                    <MapPin size={16} color="var(--color-icon)" />
                    Tendencia del PM10 por distrito
                  </h3>
                  <span style={{ fontSize: '0.74rem', color: 'var(--theme-text-muted)' }}>
                    Coloreado por dirección del cambio (Theil-Sen)
                  </span>
                </div>

                <div className="detective-svg-map-container" style={{ height: '300px' }}>
                  <svg viewBox="0 0 740 560" className="detective-svg-map">
                    {sv.distritos?.map((dist) => {
                      const zoneKey = `distrito-${dist.id}`
                      const shape = COCHABAMBA_DISTRICT_SVGS[zoneKey]
                      if (!shape) return null

                      const isSelected = zoneKey === selectedZoneId
                      const sen = dist.tendencia?.sen_pendiente_anual || 0
                      const isSig = dist.tendencia?.significativa

                      // Color según tendencia: si baja PM10 (el aire mejora), azul/verde; si sube, rojo
                      let fillColor = '#64748B' // Gris por defecto
                      if (isSig) {
                        if (sen < 0) fillColor = '#38BDF8' // Azul cielo (mejora)
                        else if (sen > 0) fillColor = '#EF4444' // Rojo (empeora)
                      }

                      // Opacidad según nivel de confianza
                      let fillOpacity = 0.85
                      if (dist.confianza === 'media') fillOpacity = 0.65
                      else if (dist.confianza === 'baja') fillOpacity = 0.35

                      return (
                        <g
                          key={zoneKey}
                          className="detective-map-district"
                          onClick={() => onSelectZone && onSelectZone(zoneKey)}
                        >
                          <path
                            d={shape.path}
                            fill={fillColor}
                            fillOpacity={isSelected ? 0.95 : fillOpacity}
                            stroke={isSelected ? '#F59E0B' : 'rgba(255, 255, 255, 0.45)'}
                            strokeWidth={isSelected ? 3.5 : 1.2}
                          />
                          <text
                            x={shape.cx}
                            y={shape.cy}
                            fill="#FFFFFF"
                            fontSize="13"
                            fontWeight="700"
                            textAnchor="middle"
                            dominantBaseline="central"
                            style={{
                              pointerEvents: 'none',
                              textShadow: '0 1px 4px rgba(0,0,0,0.85)',
                            }}
                          >
                            D{dist.id}
                          </text>
                        </g>
                      )
                    })}
                  </svg>

                  <div className="detective-map-legend">
                    <span>
                      <span className="detective-legend-dot" style={{ background: '#38BDF8' }} />{' '}
                      El aire mejora (baja PM10, p &lt; 0,05)
                    </span>
                    <span>
                      <span className="detective-legend-dot" style={{ background: '#EF4444' }} />{' '}
                      El aire empeora (sube PM10, p &lt; 0,05)
                    </span>
                    <span>
                      <span
                        className="detective-legend-dot"
                        style={{ background: '#64748B', opacity: 0.5 }}
                      />{' '}
                      Confianza media / translúcido
                    </span>
                    <span>
                      <span
                        className="detective-legend-dot"
                        style={{ background: 'transparent', border: '2px solid #F59E0B' }}
                      />{' '}
                      Seleccionado
                    </span>
                  </div>
                </div>
              </div>

              {/* Ficha del Distrito Seleccionado */}
              <div className="sensado-panel-box">
                <div className="sensado-panel-head">
                  <h3 className="sensado-panel-title">
                    <MapPin size={16} color="var(--color-icon)" />
                    Ficha de aire · {activeZoneInfo.name}
                  </h3>
                  <span className={`badge-confidence-${districtData?.confianza || 'alta'}`}>
                    Confianza {districtData?.confianza?.toUpperCase()}
                  </span>
                </div>

                <div className="sensado-ficha-body">
                  <div className="sensado-ficha-stat-row">
                    <span className="sensado-ficha-stat-lbl">PM10 estimado promedio</span>
                    <span className="sensado-ficha-stat-val">
                      {formatNum(districtData?.pm10_promedio, 1)} µg/m³
                    </span>
                  </div>

                  <div className="sensado-ficha-stat-row">
                    <span className="sensado-ficha-stat-lbl">Rango probable (p10 – p90)</span>
                    <span className="sensado-ficha-stat-val">
                      [{formatNum(rangoProbablePromedio.p10, 1)} a{' '}
                      {formatNum(rangoProbablePromedio.p90, 1)}] µg/m³
                    </span>
                  </div>

                  <div className="sensado-ficha-stat-row">
                    <span className="sensado-ficha-stat-lbl">Días que superan guía OMS (45 µg/m³)</span>
                    <span
                      className="sensado-ficha-stat-val"
                      style={{ color: districtData?.dias_sobre_oms_pct > 75 ? '#EF4444' : '#F59E0B' }}
                    >
                      {formatNum(districtData?.dias_sobre_oms_pct, 1)} % del tiempo
                    </span>
                  </div>

                  <div className="sensado-ficha-stat-row">
                    <span className="sensado-ficha-stat-lbl">Tendencia 2022–2026 (Sen)</span>
                    <span
                      className="sensado-ficha-stat-val"
                      style={{
                        color:
                          districtData?.tendencia?.sen_pendiente_anual < 0
                            ? '#10B981'
                            : '#EF4444',
                      }}
                    >
                      {formatSigned(districtData?.tendencia?.sen_pendiente_anual, 2)} µg/m³/año
                    </span>
                  </div>

                  <div className="sensado-ficha-stat-row">
                    <span className="sensado-ficha-stat-lbl">¿Significativo? (Mann-Kendall)</span>
                    <span className="sensado-ficha-stat-val">
                      {districtData?.tendencia?.significativa ? (
                        <span style={{ color: '#10B981' }}>
                          Sí (p {districtData.tendencia.mk_p < 0.001 ? '< 0,001' : `= ${formatNum(districtData.tendencia.mk_p, 4)}`})
                        </span>
                      ) : (
                        <span style={{ color: 'var(--theme-text-muted)' }}>No significativo</span>
                      )}
                    </span>
                  </div>

                  <div className="detective-sentence-card" style={{ marginTop: '0.25rem' }}>
                    <Info size={16} color="var(--theme-accent)" style={{ flexShrink: 0, marginTop: 2 }} />
                    <p className="detective-sentence-text" style={{ fontSize: '0.8rem' }}>
                      En el <strong>{activeZoneInfo.name}</strong>, la IA estima un promedio de{' '}
                      <strong>{formatNum(districtData?.pm10_promedio, 1)} µg/m³</strong>. La tendencia indica
                      que el material particulado{' '}
                      <strong>
                        {districtData?.tendencia?.sen_pendiente_anual < 0
                          ? 'disminuye a un ritmo de ' + formatNum(Math.abs(districtData?.tendencia?.sen_pendiente_anual), 2) + ' µg/m³ por año'
                          : 'se mantiene estable'}
                      </strong>
                      .
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Abajo: Dos Gráficos */}
            <div className="sensado-bottom-grid">
              {/* Gráfico 1: Observado vs Estimado en estaciones de prueba */}
              <div className="sensado-panel-box">
                <div className="sensado-panel-head">
                  <h3 className="sensado-panel-title">
                    <Radio size={16} color="var(--color-icon)" />
                    Observado vs. Estimado en prueba
                  </h3>
                  {/* Selector de estación de prueba */}
                  <div className="neo-pill-group">
                    {['Kanata', 'SEMAPA'].map((est) => (
                      <button
                        key={est}
                        type="button"
                        className={`geo-hud-pill ${selectedStationPrueba === est ? 'is-active' : ''}`}
                        onClick={() => setSelectedStationPrueba(est)}
                        style={{ padding: '0.2rem 0.6rem', fontSize: '0.75rem' }}
                      >
                        {est}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="sensado-chart-svg-wrap">
                  <svg viewBox={`0 0 ${chartObsVsEstLayout.W} ${chartObsVsEstLayout.H}`} className="sensado-chart-svg">
                    {/* Guías horizontales */}
                    {chartObsVsEstLayout.yTicks.map((t, idx) => (
                      <g key={idx}>
                        <line
                          x1={chartObsVsEstLayout.padL}
                          y1={t.y}
                          x2={chartObsVsEstLayout.W - chartObsVsEstLayout.padR}
                          y2={t.y}
                          stroke="var(--theme-border-subtle)"
                          strokeDasharray={t.val === 45 ? '3 3' : '2 2'}
                        />
                        <text
                          x={chartObsVsEstLayout.padL - 6}
                          y={t.y + 3}
                          fill="var(--theme-text-muted)"
                          fontSize="9"
                          textAnchor="end"
                          fontFamily="inherit"
                        >
                          {t.val}
                        </text>
                      </g>
                    ))}

                    {/* Eje X */}
                    {chartObsVsEstLayout.xTicks.map((t, idx) => (
                      <text
                        key={idx}
                        x={t.x}
                        y={chartObsVsEstLayout.H - chartObsVsEstLayout.padB + 14}
                        fill="var(--theme-text-muted)"
                        fontSize="9"
                        textAnchor="middle"
                        fontFamily="inherit"
                      >
                        {t.label}
                      </text>
                    ))}

                    {/* Línea Observada (Azul) */}
                    {chartObsVsEstLayout.obsPoints.length > 1 && (
                      <path
                        d={chartObsVsEstLayout.obsPoints
                          .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
                          .join(' ')}
                        fill="none"
                        stroke="#38BDF8"
                        strokeWidth="2.2"
                      />
                    )}

                    {/* Línea Estimada por IA (Naranja/Ámbar) */}
                    {chartObsVsEstLayout.estPoints.length > 1 && (
                      <path
                        d={chartObsVsEstLayout.estPoints
                          .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
                          .join(' ')}
                        fill="none"
                        stroke="#F59E0B"
                        strokeWidth="2.2"
                        strokeDasharray="4 2"
                      />
                    )}
                  </svg>
                </div>

                <div className="detective-chart-legend" style={{ justifyContent: 'center' }}>
                  <span>
                    <span className="detective-legend-line" style={{ background: '#38BDF8' }} /> Observado (sensor)
                  </span>
                  <span>
                    <span className="detective-legend-line" style={{ background: '#F59E0B' }} /> Estimado por IA
                  </span>
                </div>
              </div>

              {/* Gráfico 2: Serie Mensual Estimada del Distrito con Banda p10-p90 */}
              <div className="sensado-panel-box">
                <div className="sensado-panel-head">
                  <h3 className="sensado-panel-title">
                    <TrendingDown size={16} color="var(--color-icon)" />
                    Serie estimada · {activeZoneInfo.shortName}
                  </h3>
                  <span style={{ fontSize: '0.74rem', color: 'var(--theme-text-muted)' }}>
                    Banda sombreada: p10 a p90
                  </span>
                </div>

                <div className="sensado-chart-svg-wrap">
                  <svg viewBox={`0 0 ${chartDistrictSerieLayout.W} ${chartDistrictSerieLayout.H}`} className="sensado-chart-svg">
                    {/* Guías horizontales */}
                    {chartDistrictSerieLayout.yTicks.map((t, idx) => (
                      <g key={idx}>
                        <line
                          x1={chartDistrictSerieLayout.padL}
                          y1={t.y}
                          x2={chartDistrictSerieLayout.W - chartDistrictSerieLayout.padR}
                          y2={t.y}
                          stroke="var(--theme-border-subtle)"
                          strokeDasharray="2 2"
                        />
                        <text
                          x={chartDistrictSerieLayout.padL - 6}
                          y={t.y + 3}
                          fill="var(--theme-text-muted)"
                          fontSize="9"
                          textAnchor="end"
                          fontFamily="inherit"
                        >
                          {t.val}
                        </text>
                      </g>
                    ))}

                    {/* Línea de referencia OMS en 45 µg/m³ */}
                    <line
                      x1={chartDistrictSerieLayout.padL}
                      y1={chartDistrictSerieLayout.whoY}
                      x2={chartDistrictSerieLayout.W - chartDistrictSerieLayout.padR}
                      y2={chartDistrictSerieLayout.whoY}
                      stroke="#EF4444"
                      strokeWidth="1.6"
                      strokeDasharray="4 3"
                    />
                    <text
                      x={chartDistrictSerieLayout.W - chartDistrictSerieLayout.padR - 4}
                      y={chartDistrictSerieLayout.whoY - 4}
                      fill="#EF4444"
                      fontSize="9"
                      fontWeight="600"
                      textAnchor="end"
                      fontFamily="inherit"
                    >
                      Guía OMS (45 µg/m³)
                    </text>

                    {/* Eje X */}
                    {chartDistrictSerieLayout.xTicks.map((t, idx) => (
                      <text
                        key={idx}
                        x={t.x}
                        y={chartDistrictSerieLayout.H - chartDistrictSerieLayout.padB + 14}
                        fill="var(--theme-text-muted)"
                        fontSize="9"
                        textAnchor="middle"
                        fontFamily="inherit"
                      >
                        {t.label}
                      </text>
                    ))}

                    {/* Banda sombreada de incertidumbre p10 a p90 */}
                    {chartDistrictSerieLayout.bandArea && (
                      <path
                        d={chartDistrictSerieLayout.bandArea}
                        fill="rgba(56, 189, 248, 0.18)"
                      />
                    )}

                    {/* Línea central de PM10 estimado */}
                    {chartDistrictSerieLayout.points.length > 1 && (
                      <path
                        d={chartDistrictSerieLayout.points
                          .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
                          .join(' ')}
                        fill="none"
                        stroke="#38BDF8"
                        strokeWidth="2.2"
                      />
                    )}
                  </svg>
                </div>

                <div className="detective-chart-legend" style={{ justifyContent: 'center' }}>
                  <span>
                    <span className="detective-legend-line" style={{ background: '#38BDF8' }} /> PM10 estimado
                  </span>
                  <span>
                    <span
                      style={{
                        display: 'inline-block',
                        width: '14px',
                        height: '10px',
                        background: 'rgba(56, 189, 248, 0.25)',
                        borderRadius: '2px',
                        marginRight: '4px',
                        verticalAlign: 'middle',
                      }}
                    />{' '}
                    Rango probable (p10–p90)
                  </span>
                  <span>
                    <span className="detective-legend-line" style={{ background: '#EF4444' }} /> Guía OMS 24h (45)
                  </span>
                </div>
              </div>
            </div>

            {/* Aviso metodológico único de la subpestaña IA */}
            {sv.meta?.nota && (
              <div className="sensado-notice-bar">
                <Info size={16} color="var(--color-icon)" />
                <span>{sv.meta.nota}</span>
              </div>
            )}
          </>
        )}

        {/* =========================================================================
            SUBPESTAÑA 2: VERDAD DE TERRENO · RED MÓNICA
            ========================================================================= */}
        {activeSubTab === 'monica' && (
          <>
            {/* Tarjetas de las 2 estaciones y de la relación real con incendios */}
            <div className="sensado-kpi-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
              {/* Estación Kanata */}
              <div className="sensado-kpi-card">
                <div className="sensado-kpi-head">
                  <span className="sensado-kpi-label">Estación Parque Kanata</span>
                  <MapPin size={16} color="#F59E0B" />
                </div>
                <div className="sensado-kpi-val">
                  {formatNum(monicaData?.kanata?.promedio_general, 1)}
                  <span className="sensado-kpi-unit">µg/m³ promedio</span>
                </div>
                <div className="sensado-kpi-sub">
                  Av. 6 de Agosto / Parque Kanata (Zona Sur) · {monicaData?.kanata?.registros_validos?.toLocaleString('es-BO')} registros
                  <div className="sensado-kpi-baseline" style={{ color: '#EF4444' }}>
                    {formatNum(monicaData?.kanata?.pct_dias_sobre_guia_oms, 1)} % de días sobre la guía OMS (45 µg/m³)
                  </div>
                </div>
              </div>

              {/* Estación SEMAPA */}
              <div className="sensado-kpi-card">
                <div className="sensado-kpi-head">
                  <span className="sensado-kpi-label">Estación SEMAPA</span>
                  <MapPin size={16} color="#38BDF8" />
                </div>
                <div className="sensado-kpi-val">
                  {formatNum(monicaData?.semapa?.promedio_general, 1)}
                  <span className="sensado-kpi-unit">µg/m³ promedio</span>
                </div>
                <div className="sensado-kpi-sub">
                  Av. Circunvalación / SEMAPA (Zona Norte) · {monicaData?.semapa?.registros_validos?.toLocaleString('es-BO')} registros
                  <div className="sensado-kpi-baseline" style={{ color: '#F59E0B' }}>
                    {formatNum(monicaData?.semapa?.pct_dias_sobre_guia_oms, 1)} % de días sobre la guía OMS (45 µg/m³)
                  </div>
                </div>
              </div>

              {/* Relación con Incendios Forestales y Quemas (NASA FIRMS) */}
              <div className="sensado-kpi-card">
                <div className="sensado-kpi-head">
                  <span className="sensado-kpi-label">Relación con incendios</span>
                  <Flame size={16} color="#EF4444" />
                </div>
                <div className="sensado-kpi-val" style={{ fontSize: '1.25rem' }}>
                  r = {formatNum(tj?.ciudad?.focos_vs_pm10?.SEMAPA?.spearman_r ?? 0.51, 2)} (SEMAPA) · {formatNum(tj?.ciudad?.focos_vs_pm10?.Kanata?.spearman_r ?? 0.32, 2)} (Kanata)
                </div>
                <div className="sensado-kpi-sub">
                  Correlación de Spearman real con focos de calor NASA FIRMS (p &lt; 0,05)
                  <div className="sensado-kpi-baseline">
                    El PM10 se incrementa fuertemente durante la época de quemas
                  </div>
                </div>
              </div>
            </div>

            {/* Centro: Mapa de ubicación de las 2 estaciones */}
            <div className="sensado-panel-box">
              <div className="sensado-panel-head">
                <h3 className="sensado-panel-title">
                  <Radio size={16} color="var(--color-icon)" />
                  Ubicación de las 2 estaciones oficiales en el valle
                </h3>
                <span style={{ fontSize: '0.74rem', color: 'var(--theme-text-muted)' }}>
                  Kanata (Sur) y SEMAPA (Norte)
                </span>
              </div>

              <div className="detective-svg-map-container" style={{ height: '240px' }}>
                <svg viewBox="0 0 740 560" className="detective-svg-map">
                  {/* Contornos distritales de fondo */}
                  {Object.entries(COCHABAMBA_DISTRICT_SVGS).map(([k, shape]) => (
                    <path
                      key={k}
                      d={shape.path}
                      fill="var(--theme-surface)"
                      fillOpacity="0.45"
                      stroke="var(--theme-border-subtle)"
                      strokeWidth="1.1"
                    />
                  ))}

                  {/* Marcador Estación SEMAPA (Norte) */}
                  <g transform="translate(485, 210)">
                    <circle r="14" fill="#38BDF8" fillOpacity="0.25" />
                    <circle r="8" fill="#38BDF8" stroke="#FFFFFF" strokeWidth="2" />
                    <text
                      x="16"
                      y="4"
                      fill="var(--theme-text)"
                      fontSize="12"
                      fontWeight="700"
                      fontFamily="inherit"
                    >
                      SEMAPA (Norte) · Av. Circunvalación
                    </text>
                  </g>

                  {/* Marcador Estación Kanata (Sur) */}
                  <g transform="translate(435, 345)">
                    <circle r="14" fill="#F59E0B" fillOpacity="0.25" />
                    <circle r="8" fill="#F59E0B" stroke="#FFFFFF" strokeWidth="2" />
                    <text
                      x="16"
                      y="4"
                      fill="var(--theme-text)"
                      fontSize="12"
                      fontWeight="700"
                      fontFamily="inherit"
                    >
                      Kanata (Sur) · Av. 6 de Agosto
                    </text>
                  </g>
                </svg>
              </div>
            </div>

            {/* Abajo: Gráfico Diurno / Mensual de la Red MÓNICA */}
            <div className="sensado-panel-box">
              <div className="sensado-panel-head">
                <h3 className="sensado-panel-title">
                  {monicaViewMode === 'diurna' ? (
                    <Clock size={16} color="var(--color-icon)" />
                  ) : (
                    <Calendar size={16} color="var(--color-icon)" />
                  )}
                  {monicaViewMode === 'diurna'
                    ? 'Perfil promedio por hora del día (00:00 a 23:00)'
                    : 'Serie histórica de promedios mensuales (meses con ≥ 15 días)'}
                </h3>

                <div className="neo-pill-group">
                  <button
                    type="button"
                    className={`geo-hud-pill ${monicaViewMode === 'diurna' ? 'is-active' : ''}`}
                    onClick={() => setMonicaViewMode('diurna')}
                    style={{ padding: '0.2rem 0.65rem', fontSize: '0.75rem' }}
                  >
                    🕒 Horario 24 h
                  </button>
                  <button
                    type="button"
                    className={`geo-hud-pill ${monicaViewMode === 'mensual' ? 'is-active' : ''}`}
                    onClick={() => setMonicaViewMode('mensual')}
                    style={{ padding: '0.2rem 0.65rem', fontSize: '0.75rem' }}
                  >
                    📅 Serie Mensual
                  </button>
                </div>
              </div>

              <div className="sensado-chart-svg-wrap" style={{ height: '260px' }}>
                <svg viewBox={`0 0 ${chartMonicaLayout.W} ${chartMonicaLayout.H}`} className="sensado-chart-svg">
                  {/* Guías horizontales */}
                  {chartMonicaLayout.yTicks.map((t, idx) => (
                    <g key={idx}>
                      <line
                        x1={chartMonicaLayout.padL}
                        y1={t.y}
                        x2={chartMonicaLayout.W - chartMonicaLayout.padR}
                        y2={t.y}
                        stroke="var(--theme-border-subtle)"
                        strokeDasharray="2 2"
                      />
                      <text
                        x={chartMonicaLayout.padL - 6}
                        y={t.y + 3}
                        fill="var(--theme-text-muted)"
                        fontSize="9"
                        textAnchor="end"
                        fontFamily="inherit"
                      >
                        {t.val}
                      </text>
                    </g>
                  ))}

                  {/* Línea OMS en 45 µg/m³ */}
                  <line
                    x1={chartMonicaLayout.padL}
                    y1={chartMonicaLayout.whoY}
                    x2={chartMonicaLayout.W - chartMonicaLayout.padR}
                    y2={chartMonicaLayout.whoY}
                    stroke="#EF4444"
                    strokeWidth="1.6"
                    strokeDasharray="4 3"
                  />
                  <text
                    x={chartMonicaLayout.W - chartMonicaLayout.padR - 4}
                    y={chartMonicaLayout.whoY - 4}
                    fill="#EF4444"
                    fontSize="9"
                    fontWeight="600"
                    textAnchor="end"
                    fontFamily="inherit"
                  >
                    Guía OMS 24h (45 µg/m³)
                  </text>

                  {/* Eje X */}
                  {chartMonicaLayout.xTicks.map((t, idx) => (
                    <text
                      key={idx}
                      x={t.x}
                      y={chartMonicaLayout.H - chartMonicaLayout.padB + 14}
                      fill="var(--theme-text-muted)"
                      fontSize="9"
                      textAnchor="middle"
                      fontFamily="inherit"
                    >
                      {t.label}
                    </text>
                  ))}

                  {/* Línea Kanata (Naranja) */}
                  {chartMonicaLayout.kPts.length > 1 && (
                    <path
                      d={chartMonicaLayout.kPts
                        .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
                        .join(' ')}
                      fill="none"
                      stroke="#F59E0B"
                      strokeWidth="2.4"
                    />
                  )}

                  {/* Línea SEMAPA (Azul) */}
                  {chartMonicaLayout.sPts.length > 1 && (
                    <path
                      d={chartMonicaLayout.sPts
                        .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
                        .join(' ')}
                      fill="none"
                      stroke="#38BDF8"
                      strokeWidth="2.4"
                    />
                  )}
                </svg>
              </div>

              <div className="detective-chart-legend" style={{ justifyContent: 'center' }}>
                <span>
                  <span className="detective-legend-line" style={{ background: '#F59E0B' }} /> Estación Kanata (Zona Sur)
                </span>
                <span>
                  <span className="detective-legend-line" style={{ background: '#38BDF8' }} /> Estación SEMAPA (Zona Norte)
                </span>
                <span>
                  <span className="detective-legend-line" style={{ background: '#EF4444' }} /> Límite recomendado OMS (45 µg/m³)
                </span>
              </div>
            </div>

            {/* Aviso metodológico de la Red MÓNICA */}
            <div className="sensado-notice-bar">
              <Info size={16} color="var(--color-icon)" />
              <span>
                El PM10 son partículas finas que se respiran. La guía de la OMS recomienda no superar 45 µg/m³ en promedio de 24 horas.
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
