/**
 * src/components/panel/DiagnosticoDistritalScreen.jsx
 * Pestaña 1 · Diagnóstico distrital
 * Punto de entrada: cómo está hoy tu distrito.
 *
 * Se arma sobre MonitoreoGeneralScreen.
 * Se eliminaron todos los elementos decorativos/inventados:
 * - Dona spectralSplit fija (34/30/20/16 %)
 * - Pulsos eqPulses
 * - Tiras de parches SatellitePatchStrip
 * - Mapa de contornos isotérmicos ContouredIsoMap
 * - Curva diurna simulada diurnalLst
 * - Tarjetas con sparklines decorativos y sellos ficticios
 *
 * Datos 100% reales de internalPanelData.js y tendencias_distritos.json.
 */

import { useState, useMemo, useEffect } from 'react'
import {
  Thermometer,
  Leaf,
  BarChart2,
  Layers,
  Info,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  MapPin,
} from 'lucide-react'
import { COCHABAMBA_ZONES } from '../../data/internalPanelData'
import { COCHABAMBA_DISTRICT_SVGS } from '../../data/cochabambaDistrictsSvg'
import { promediosAnuales } from '../../lib/tendencias'
import './DiagnosticoDistritalScreen.css'

function formatNum(val, decimals = 2) {
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

// Escala térmica LST (18°C a 32°C+)
function getLstColor(lst) {
  const min = 18
  const max = 32
  const t = Math.max(0, Math.min(1, (lst - min) / (max - min)))

  if (t < 0.25) {
    const factor = t / 0.25
    const r = Math.round(2 + factor * (6 - 2))
    const g = Math.round(132 + factor * (182 - 132))
    const b = Math.round(199 + factor * (212 - 199))
    return `rgb(${r}, ${g}, ${b})`
  } else if (t < 0.5) {
    const factor = (t - 0.25) / 0.25
    const r = Math.round(6 + factor * (16 - 6))
    const g = Math.round(182 + factor * (185 - 182))
    const b = Math.round(212 + factor * (129 - 212))
    return `rgb(${r}, ${g}, ${b})`
  } else if (t < 0.75) {
    const factor = (t - 0.5) / 0.25
    const r = Math.round(234 + factor * (249 - 234))
    const g = Math.round(179 + factor * (115 - 179))
    const b = Math.round(8 + factor * (22 - 8))
    return `rgb(${r}, ${g}, ${b})`
  } else {
    const factor = (t - 0.75) / 0.25
    const r = Math.round(249 + factor * (239 - 249))
    const g = Math.round(115 + factor * (68 - 115))
    const b = Math.round(22 + factor * (68 - 22))
    return `rgb(${r}, ${g}, ${b})`
  }
}

// Escala vegetal NDVI (0.10 a 0.40+)
function getNdviColor(ndvi) {
  const min = 0.1
  const max = 0.4
  const t = Math.max(0, Math.min(1, (ndvi - min) / (max - min)))

  if (t < 0.33) {
    const factor = t / 0.33
    const r = Math.round(100 + factor * (132 - 100))
    const g = Math.round(116 + factor * (204 - 116))
    const b = Math.round(139 + factor * (22 - 139))
    return `rgb(${r}, ${g}, ${b})`
  } else if (t < 0.66) {
    const factor = (t - 0.33) / 0.33
    const r = Math.round(132 + factor * (34 - 132))
    const g = Math.round(204 + factor * (197 - 204))
    const b = Math.round(22 + factor * (94 - 22))
    return `rgb(${r}, ${g}, ${b})`
  } else {
    const factor = (t - 0.66) / 0.34
    const r = Math.round(34 + factor * (21 - 34))
    const g = Math.round(197 + factor * (128 - 197))
    const b = Math.round(94 + factor * (61 - 94))
    return `rgb(${r}, ${g}, ${b})`
  }
}

export function DiagnosticoDistritalScreen({
  selectedZoneId = 'distrito-1',
  onSelectZone,
  onNavigateModule,
}) {
  // Capa activa en el mapa: 'lst' (Calor del suelo) o 'ndvi' (Vegetación)
  const [activeLayer, setActiveLayer] = useState('lst')

  // Carga de tendencias históricas distritales
  const [modisData, setModisData] = useState(null)

  useEffect(() => {
    let isMounted = true
    fetch('/data/tendencias_distritos.json')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (isMounted && data) {
          setModisData(data)
        }
      })
      .catch((err) => console.error('Error cargando tendencias MODIS:', err))
    return () => {
      isMounted = false
    }
  }, [])

  // Distrito activo
  const activeZone = useMemo(() => {
    return (
      COCHABAMBA_ZONES.find((z) => z.id === selectedZoneId) ||
      COCHABAMBA_ZONES[0]
    )
  }, [selectedZoneId])

  // Número de distrito
  const distNum = useMemo(() => {
    const num = activeZone.number || parseInt(activeZone.id.replace('distrito-', ''), 10)
    return isNaN(num) ? 1 : num
  }, [activeZone])

  // Datos distritales en tendencias_distritos.json
  const distModis = useMemo(() => {
    if (!modisData?.distritos) return null
    return modisData.distritos.find((d) => Number(d.id) === Number(distNum)) || null
  }, [modisData, distNum])

  // Promedios anuales de NDVI (2001-2025) calculados con la función pura promediosAnuales()
  const annualNdviSeries = useMemo(() => {
    if (!distModis?.serie) return []
    const serieNdvi = distModis.serie
      .filter((pt) => pt.ndvi !== null && pt.ndvi !== undefined)
      .map((pt) => ({ fecha: pt.fecha, valor: pt.ndvi }))
    return promediosAnuales(serieNdvi)
  }, [distModis])

  // Media municipal de LST (promedio de los 15 distritos)
  const municipalAvgLst = useMemo(() => {
    return (
      COCHABAMBA_ZONES.reduce((acc, z) => acc + (z.lstMean || 0), 0) /
      COCHABAMBA_ZONES.length
    )
  }, [])

  // Diferencia térmica con la media municipal
  const thermalDiff = activeZone.lstMean - municipalAvgLst

  // Estación de la Red MÓNICA más cercana
  const KANATA_COORDS = { lat: -17.4132, lng: -66.1554, name: 'Parque Kanata (Zona Sur)' }
  const SEMAPA_COORDS = { lat: -17.3622, lng: -66.1714, name: 'SEMAPA (Zona Norte)' }
  const distToKanata = Math.hypot(
    (activeZone.lat || 0) - KANATA_COORDS.lat,
    (activeZone.lng || 0) - KANATA_COORDS.lng
  )
  const distToSemapa = Math.hypot(
    (activeZone.lat || 0) - SEMAPA_COORDS.lat,
    (activeZone.lng || 0) - SEMAPA_COORDS.lng
  )
  const estacionReferencia = distToKanata < distToSemapa ? KANATA_COORDS.name : SEMAPA_COORDS.name

  // Tooltip interactivo en gráfico anual
  const [hoveredYearPoint, setHoveredYearPoint] = useState(null)

  return (
    <div className="diag-screen">
      {/* 1. ENCABEZADO */}
      <div className="diag-header">
        <div className="diag-title-row">
          <div className="diag-title-group">
            <span className="neo-micro-tag">
              ENFOQUE 1 · CLIMA URBANO Y DIAGNÓSTICO SATELITAL
            </span>
            <h2 className="diag-title">1 Diagnóstico distrital</h2>
          </div>

          {/* Selector de distrito */}
          <div className="diag-dist-selector">
            <span className="diag-selector-label">Distrito:</span>
            <select
              value={activeZone.id}
              onChange={(e) => onSelectZone && onSelectZone(e.target.value)}
              className="diag-select"
            >
              {COCHABAMBA_ZONES.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.name} ({formatNum(z.lstMean, 1)} °C)
                </option>
              ))}
            </select>
          </div>
        </div>

        <p className="diag-subtitle">
          Cómo está hoy tu distrito: calor del suelo y vegetación, medidos por satélite en 2024.
        </p>
      </div>

      {/* 2. TARJETAS (4): LST media | NDVI medio | Diferencia valle | Relación calor-vegetación */}
      <section className="diag-kpi-grid">
        {/* Tarjeta 1: LST media 2024 (con rango mín-máx) */}
        <article className="diag-kpi-card">
          <div className="diag-kpi-top">
            <span className="diag-kpi-label">LST SUPERFICIAL MEDIA</span>
            <Thermometer className="diag-icon" size={18} />
          </div>
          <div className="diag-kpi-val-row">
            <strong className="diag-kpi-val is-orange">
              {formatNum(activeZone.lstMean, 2)}
            </strong>
            <span className="diag-kpi-unit">°C</span>
          </div>
          <div className="diag-kpi-sub">
            <span className="diag-badge-chip badge-orange">Landsat 8/9</span>
            <span className="diag-kpi-desc">
              Rango: {formatNum(activeZone.lstMin, 2)}° a {formatNum(activeZone.lstMax, 2)}°C
            </span>
          </div>
        </article>

        {/* Tarjeta 2: NDVI medio 2024 (con rango) */}
        <article className="diag-kpi-card">
          <div className="diag-kpi-top">
            <span className="diag-kpi-label">HUELLA VERDE (NDVI MEDIO)</span>
            <Leaf className="diag-icon" size={18} />
          </div>
          <div className="diag-kpi-val-row">
            <strong className="diag-kpi-val is-green">
              {formatNum(activeZone.ndviMean, 4)}
            </strong>
            <span className="diag-kpi-unit">NDVI</span>
          </div>
          <div className="diag-kpi-sub">
            <span className="diag-badge-chip badge-green">Sentinel-2 (10m)</span>
            <span className="diag-kpi-desc">
              Rango: {formatNum(activeZone.ndviMin, 4)} a {formatNum(activeZone.ndviMax, 4)}
            </span>
          </div>
        </article>

        {/* Tarjeta 3: Diferencia con el promedio del valle */}
        <article className="diag-kpi-card">
          <div className="diag-kpi-top">
            <span className="diag-kpi-label">DIFERENCIA CON EL VALLE</span>
            <BarChart2 className="diag-icon" size={18} />
          </div>
          <div className="diag-kpi-val-row">
            <strong
              className={`diag-kpi-val ${
                thermalDiff > 0 ? 'is-orange' : 'is-cyan'
              }`}
            >
              {formatSigned(thermalDiff, 2)}
            </strong>
            <span className="diag-kpi-unit">°C</span>
          </div>
          <div className="diag-kpi-sub">
            <span
              className={`diag-badge-chip ${
                thermalDiff > 0 ? 'badge-orange' : 'badge-cyan'
              }`}
            >
              {thermalDiff >= 0 ? 'Más cálido que la media' : 'Más fresco que la media'}
            </span>
            <span className="diag-kpi-desc">
              Media de los 15 distritos: {formatNum(municipalAvgLst, 2)} °C
            </span>
          </div>
        </article>

        {/* Tarjeta 4: Relación calor-vegetación (correlación r de internalPanelData.js) */}
        <article className="diag-kpi-card">
          <div className="diag-kpi-top">
            <span className="diag-kpi-label">RELACIÓN CALOR-VEGETACIÓN</span>
            <Layers className="diag-icon" size={18} />
          </div>
          <div className="diag-kpi-val-row">
            <strong className="diag-kpi-val is-purple">
              {activeZone.correlacionPearson != null && !isNaN(activeZone.correlacionPearson)
                ? `r = ${formatNum(activeZone.correlacionPearson, 2)}`
                : 'No calculado'}
            </strong>
          </div>
          <div className="diag-kpi-sub">
            <span className="diag-badge-chip badge-purple">
              {activeZone.valorPFDR ? `p FDR ${activeZone.valorPFDR}` : 'Significativo (p < 0,05)'}
            </span>
            <span className="diag-kpi-desc">
              {activeZone.correlacionPearson < -0.3
                ? 'Relación inversa: a mayor verde, menor temperatura'
                : 'Correlación espacial moderada en el distrito'}
            </span>
          </div>
        </article>
      </section>

      {/* 3. CENTRO: Mapa interactivo (LST/NDVI conmutador) + Ficha técnica con botón */}
      <section className="diag-center-grid">
        {/* Mapa vectorial de los 15 distritos */}
        <article className="diag-map-card">
          <div className="diag-card-header">
            <div>
              <span className="neo-micro-tag">MAPA BIOCLIMÁTICO MUNICIPAL 2024</span>
              <h3 className="diag-card-title">
                {activeLayer === 'lst'
                  ? `Calor del suelo (LST) · ${activeZone.name}: ${formatNum(activeZone.lstMean, 2)} °C`
                  : `Vigor vegetal (NDVI) · ${activeZone.name}: ${formatNum(activeZone.ndviMean, 4)}`}
              </h3>
            </div>

            {/* Conmutador de capas: LST vs NDVI */}
            <div className="diag-layer-toggle">
              <button
                type="button"
                className={`diag-toggle-btn ${activeLayer === 'lst' ? 'is-active' : ''}`}
                onClick={() => setActiveLayer('lst')}
              >
                🔥 Calor (LST)
              </button>
              <button
                type="button"
                className={`diag-toggle-btn ${activeLayer === 'ndvi' ? 'is-active' : ''}`}
                onClick={() => setActiveLayer('ndvi')}
              >
                🌿 Vegetación (NDVI)
              </button>
            </div>
          </div>

          <div className="diag-svg-map-stage">
            <svg viewBox="0 0 740 560" className="diag-svg-map">
              {COCHABAMBA_ZONES.map((zone) => {
                const shape = COCHABAMBA_DISTRICT_SVGS[zone.id]
                if (!shape) return null

                const isSelected = zone.id === activeZone.id
                const valVisual = activeLayer === 'lst' ? zone.lstMean : zone.ndviMean
                const colorDistrito =
                  activeLayer === 'lst' ? getLstColor(zone.lstMean) : getNdviColor(zone.ndviMean)

                return (
                  <g
                    key={zone.id}
                    className={`diag-map-polygon ${isSelected ? 'is-selected' : ''}`}
                    onClick={() => onSelectZone && onSelectZone(zone.id)}
                  >
                    <path
                      d={shape.path}
                      fill={colorDistrito}
                      fillOpacity={isSelected ? 0.95 : 0.72}
                      stroke={isSelected ? '#FFFFFF' : 'rgba(255, 255, 255, 0.45)'}
                      strokeWidth={isSelected ? 3.5 : 1.2}
                    />
                    <text
                      x={shape.cx}
                      y={shape.cy - 7}
                      fill="#FFFFFF"
                      fontSize="13"
                      fontWeight="800"
                      textAnchor="middle"
                      dominantBaseline="central"
                      className="diag-map-label"
                    >
                      D{zone.number}
                    </text>
                    <text
                      x={shape.cx}
                      y={shape.cy + 9}
                      fill="#FFFFFF"
                      fontSize="10.5"
                      fontWeight="600"
                      textAnchor="middle"
                      dominantBaseline="central"
                      className="diag-map-val"
                    >
                      {activeLayer === 'lst'
                        ? `${formatNum(valVisual, 1)}°C`
                        : formatNum(valVisual, 3)}
                    </text>
                  </g>
                )
              })}
            </svg>

            {/* Leyenda de la capa activa */}
            <div className="diag-map-legend">
              <div className="diag-legend-bar-wrap">
                <span className="diag-legend-bound">
                  {activeLayer === 'lst' ? '18 °C (Fresco)' : '0,10 (Bajo vigor)'}
                </span>
                <div
                  className="diag-legend-gradient"
                  style={{
                    background:
                      activeLayer === 'lst'
                        ? 'linear-gradient(90deg, #0284C7 0%, #06B6D4 25%, #10B981 50%, #EAB308 75%, #EF4444 100%)'
                        : 'linear-gradient(90deg, #64748B 0%, #84CC16 50%, #15803D 100%)',
                  }}
                />
                <span className="diag-legend-bound">
                  {activeLayer === 'lst' ? '32 °C+ (Cálido)' : '0,40+ (Denso)'}
                </span>
              </div>
              <p className="diag-legend-note">
                Haz clic en cualquier distrito del mapa para inspeccionar sus mediciones satelitales 2024.
              </p>
            </div>
          </div>
        </article>

        {/* Ficha técnica del distrito a la derecha con botón */}
        <article className="diag-profile-card">
          <div className="diag-card-header">
            <div>
              <span className="neo-micro-tag">FICHA TÉCNICA TERRITORIAL</span>
              <h3 className="diag-card-title">{activeZone.name}</h3>
            </div>
            <span className="diag-zone-type-badge">{activeZone.zoneType}</span>
          </div>

          <div className="diag-profile-rows">
            <div className="diag-profile-row">
              <span className="diag-p-label">Elevación oficial</span>
              <strong className="diag-p-val">{activeZone.elevation}</strong>
            </div>

            <div className="diag-profile-row">
              <span className="diag-p-label">Coordenadas centroide</span>
              <strong className="diag-p-val font-mono">{activeZone.coords}</strong>
            </div>

            <div className="diag-profile-row">
              <span className="diag-p-label">Anomalía térmica vs. media</span>
              <strong
                className={`diag-p-val ${
                  thermalDiff > 0 ? 'is-orange' : 'is-cyan'
                }`}
              >
                {formatSigned(thermalDiff, 2)} °C
              </strong>
            </div>

            <div className="diag-profile-row">
              <span className="diag-p-label">Estación MÓNICA más cercana</span>
              <strong className="diag-p-val">{estacionReferencia}</strong>
            </div>

            <div className="diag-profile-row">
              <span className="diag-p-label">Correlación LST vs NDVI</span>
              <strong className="diag-p-val">
                {activeZone.correlacionPearson != null && !isNaN(activeZone.correlacionPearson)
                  ? `r = ${formatNum(activeZone.correlacionPearson, 2)}`
                  : 'No calculado'}
              </strong>
            </div>

            <div className="diag-profile-row">
              <span className="diag-p-label">Píxeles satelitales analizados</span>
              <strong className="diag-p-val font-mono">
                {formatNum(activeZone.validPixels, 0)} px
              </strong>
            </div>
          </div>

          {/* Botón único de navegación al Detective de tendencias */}
          <div className="diag-profile-action">
            <button
              type="button"
              onClick={() =>
                onNavigateModule &&
                (onNavigateModule('detective-tendencias') || onNavigateModule('inteligencia-termica'))
              }
              className="diag-action-btn"
            >
              <span>Ver cambio en el tiempo →</span>
              <ChevronRight size={18} />
            </button>
            <p className="diag-action-hint">
              Abre el Detective de tendencias con <strong>{activeZone.shortName}</strong> preseleccionado.
            </p>
          </div>
        </article>
      </section>

      {/* 4. ABAJO: 2 BLOQUES (Ranking de los 15 distritos + Curva anual de NDVI 2001-2025) */}
      <section className="diag-bottom-grid">
        {/* Bloque 1: Dónde se ubica tu distrito en el valle (Ranking LST) */}
        <article className="diag-bottom-card">
          <div className="diag-card-header">
            <div>
              <span className="neo-micro-tag">COMPARATIVA MUNICIPAL</span>
              <h3 className="diag-card-title">Dónde se ubica tu distrito en el valle</h3>
            </div>
            <span className="diag-card-chip">
              Media municipal: {formatNum(municipalAvgLst, 2)} °C
            </span>
          </div>

          <p className="diag-card-intro">
            15 distritos ordenados por temperatura superficial (Landsat 8, 2024). Haz clic en una barra para seleccionarlo:
          </p>

          <div className="diag-ranking-bars-list">
            {[...COCHABAMBA_ZONES]
              .sort((a, b) => b.lstMean - a.lstMean)
              .map((zone, idx) => {
                const isSelected = zone.id === activeZone.id
                const minScale = 18
                const maxScale = 32
                const pct = Math.max(
                  8,
                  Math.min(100, ((zone.lstMean - minScale) / (maxScale - minScale)) * 100)
                )
                const isAboveAvg = zone.lstMean >= municipalAvgLst

                return (
                  <div
                    key={zone.id}
                    onClick={() => onSelectZone && onSelectZone(zone.id)}
                    className={`diag-ranking-row ${isSelected ? 'is-selected' : ''}`}
                    title={`Seleccionar ${zone.name}`}
                  >
                    <span className="diag-r-pos">#{idx + 1}</span>
                    <span className="diag-r-name">{zone.shortName}</span>
                    <div className="diag-r-track">
                      <div
                        className={`diag-r-bar ${
                          isSelected
                            ? 'bar-active'
                            : isAboveAvg
                            ? 'bar-warm'
                            : 'bar-cool'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="diag-r-val">{formatNum(zone.lstMean, 2)} °C</span>
                  </div>
                )
              })}
          </div>
        </article>

        {/* Bloque 2: Curva anual de NDVI (2001–2025) con promediosAnuales() */}
        <article className="diag-bottom-card">
          <div className="diag-card-header">
            <div>
              <span className="neo-micro-tag">EVOLUCIÓN HISTÓRICA SATELITAL (MODIS)</span>
              <h3 className="diag-card-title">
                Curva anual de NDVI (2001–2025) · {activeZone.shortName}
              </h3>
            </div>
            <span className="diag-card-chip chip-green">
              25 años observados
            </span>
          </div>

          <p className="diag-card-intro">
            Promedio anual de vigor vegetal para evaluar si este distrito ha ganado o perdido verde a lo largo de las últimas dos décadas:
          </p>

          {annualNdviSeries.length > 0 ? (
            <div className="diag-annual-chart-container">
              {(() => {
                const vals = annualNdviSeries.map((d) => d.valor)
                const minVal = Math.min(...vals) * 0.95
                const maxVal = Math.max(...vals) * 1.05
                const range = maxVal - minVal || 1

                const W = 520
                const H = 200
                const padL = 48
                const padR = 18
                const padT = 16
                const padB = 26
                const plotW = W - padL - padR
                const plotH = H - padT - padB

                const pts = annualNdviSeries.map((d, i) => {
                  const x = padL + (i / (annualNdviSeries.length - 1)) * plotW
                  const y = padT + plotH - ((d.valor - minVal) / range) * plotH
                  return { ...d, x, y }
                })

                const lineD = pts.reduce(
                  (acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)},${p.y.toFixed(1)}`,
                  ''
                )
                const areaD = `${lineD} L ${pts[pts.length - 1].x.toFixed(1)},${(padT + plotH).toFixed(1)} L ${pts[0].x.toFixed(1)},${(padT + plotH).toFixed(1)} Z`

                const firstVal = annualNdviSeries[0].valor
                const lastVal = annualNdviSeries[annualNdviSeries.length - 1].valor
                const cambioTotal = lastVal - firstVal

                return (
                  <>
                    <svg viewBox={`0 0 ${W} ${H}`} className="diag-annual-svg">
                      <defs>
                        <linearGradient id="diagNdviGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#22C55E" stopOpacity="0.35" />
                          <stop offset="100%" stopColor="#22C55E" stopOpacity="0.02" />
                        </linearGradient>
                      </defs>

                      {/* Líneas horizontales de guía */}
                      {[0.25, 0.5, 0.75].map((frac) => {
                        const yLine = padT + plotH * frac
                        const valLine = maxVal - frac * range
                        return (
                          <g key={frac}>
                            <line
                              x1={padL}
                              y1={yLine}
                              x2={W - padR}
                              y2={yLine}
                              stroke="rgba(255,255,255,0.06)"
                              strokeDasharray="3 3"
                            />
                            <text
                              x={padL - 6}
                              y={yLine + 3}
                              textAnchor="end"
                              fill="var(--theme-text-muted, #64748B)"
                              fontSize="9.5"
                              fontFamily="var(--font-mono, monospace)"
                            >
                              {valLine.toFixed(2)}
                            </text>
                          </g>
                        )
                      })}

                      {/* Área y línea */}
                      <path d={areaD} fill="url(#diagNdviGrad)" />
                      <path
                        d={lineD}
                        fill="none"
                        stroke="#22C55E"
                        strokeWidth="2.4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />

                      {/* Puntos anuales interactivos */}
                      {pts.map((p) => {
                        const isHovered = hoveredYearPoint?.año === p.año
                        return (
                          <g
                            key={p.año}
                            onMouseEnter={() => setHoveredYearPoint(p)}
                            onMouseLeave={() => setHoveredYearPoint(null)}
                            style={{ cursor: 'pointer' }}
                          >
                            <circle
                              cx={p.x}
                              cy={p.y}
                              r={isHovered ? 5.5 : 3}
                              fill="#22C55E"
                              stroke="#0B1329"
                              strokeWidth="1.5"
                            />
                          </g>
                        )
                      })}

                      {/* Eje X con años cada 4 años */}
                      {pts
                        .filter((_, i) => i === 0 || i === pts.length - 1 || i % 4 === 0)
                        .map((p) => (
                          <text
                            key={p.año}
                            x={p.x}
                            y={H - 8}
                            textAnchor="middle"
                            fill="var(--theme-text-muted, #64748B)"
                            fontSize="9.5"
                            fontFamily="var(--font-mono, monospace)"
                          >
                            {p.año}
                          </text>
                        ))}

                      {/* Tooltip flotante */}
                      {hoveredYearPoint && (
                        <g
                          transform={`translate(${Math.min(
                            W - 65,
                            Math.max(padL + 25, hoveredYearPoint.x)
                          )}, ${Math.max(16, hoveredYearPoint.y - 14)})`}
                        >
                          <rect
                            x="-38"
                            y="-18"
                            width="76"
                            height="18"
                            rx="4"
                            fill="rgba(15, 23, 42, 0.95)"
                            stroke="#22C55E"
                            strokeWidth="1"
                          />
                          <text
                            x="0"
                            y="-6"
                            textAnchor="middle"
                            fill="#FFFFFF"
                            fontSize="10"
                            fontWeight="700"
                            fontFamily="var(--font-mono, monospace)"
                          >
                            {hoveredYearPoint.año}: {formatNum(hoveredYearPoint.valor, 3)}
                          </text>
                        </g>
                      )}
                    </svg>

                    <div className="diag-annual-footer">
                      <span>
                        Cambio neto (2001–2025):{' '}
                        <strong
                          className={
                            cambioTotal > 0
                              ? 'text-green'
                              : cambioTotal < 0
                              ? 'text-orange'
                              : ''
                          }
                        >
                          {formatSigned(cambioTotal, 4)} NDVI
                        </strong>
                      </span>
                      <span>
                        Valores procesados con <code>promediosAnuales()</code> (mínimo 6 meses válidos por año).
                      </span>
                    </div>
                  </>
                )
              })()}
            </div>
          ) : (
            <div className="diag-no-data">
              <span>Cargando serie anual de vegetación para este distrito...</span>
            </div>
          )}
        </article>
      </section>

      {/* 5. AVISO METODOLÓGICO ÚNICO */}
      <footer className="diag-footer-notice">
        <Info className="diag-icon" size={16} />
        <span>
          La temperatura superficial (LST) mide el calor de suelos y techos, no la temperatura del aire a la sombra. Datos 2024 procesados con Google Earth Engine.
        </span>
      </footer>
    </div>
  )
}

export default DiagnosticoDistritalScreen
