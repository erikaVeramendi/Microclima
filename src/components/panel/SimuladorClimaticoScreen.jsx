/**
 * src/components/panel/SimuladorClimaticoScreen.jsx
 * Pestaña 5 · Simulador climático
 * "¿Qué pasaría con el calor del suelo si el distrito tuviera más (o menos) vegetación?"
 *
 * Cálculo real: Regresión lineal de lstMean contra ndviMean usando los 15 distritos
 * de internalPanelData.js (2024).
 * Pendiente: -27,1721 °C por 1.0 NDVI (-2,72 °C por cada +0,10 NDVI), R² = 0,35.
 *
 * Datos de contexto nocturno: tendencias_distritos.json (tendencias.lst_noche).
 */

import { useState, useMemo, useEffect } from 'react'
import {
  Trees,
  Thermometer,
  Target,
  Info,
  Sliders,
  Moon,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Sparkles,
} from 'lucide-react'
import { COCHABAMBA_ZONES } from '../../data/internalPanelData'
import { COCHABAMBA_DISTRICT_SVGS } from '../../data/cochabambaDistrictsSvg'
import './SimuladorClimaticoScreen.css'

// Coeficientes de regresión lineal empírica calculados sobre los 15 distritos (2024)
// LST = 30.06 - 27.1721 * NDVI (r = -0.5898, R² = 0.3479)
const REGRESION = {
  pendiente: -27.1721, // °C por cada 1.0 de NDVI
  pendientePor01: -2.7172, // °C por cada +0.10 de NDVI
  intercepto: 30.06,
  r: -0.5898,
  r2: 0.3479,
  ndviParaBajar1C: 1 / 27.1721, // ≈ 0.0368 NDVI
}

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

// Escala continua de color térmico LST (18°C = azul/fresco, 25°C = amarillo, 32°C+ = rojo/cálido)
function getLstColor(lst) {
  const min = 18
  const max = 32
  const t = Math.max(0, Math.min(1, (lst - min) / (max - min)))

  if (t < 0.25) {
    // 18°C a 21.5°C: Azul a Cian (#0284C7 -> #06B6D4)
    const factor = t / 0.25
    const r = Math.round(2 + factor * (6 - 2))
    const g = Math.round(132 + factor * (182 - 132))
    const b = Math.round(199 + factor * (212 - 199))
    return `rgb(${r}, ${g}, ${b})`
  } else if (t < 0.5) {
    // 21.5°C a 25°C: Cian a Verde Lima (#06B6D4 -> #10B981)
    const factor = (t - 0.25) / 0.25
    const r = Math.round(6 + factor * (16 - 6))
    const g = Math.round(182 + factor * (185 - 182))
    const b = Math.round(212 + factor * (129 - 212))
    return `rgb(${r}, ${g}, ${b})`
  } else if (t < 0.75) {
    // 25°C a 28.5°C: Verde/Amarillo a Naranja (#EAB308 -> #F97316)
    const factor = (t - 0.5) / 0.25
    const r = Math.round(234 + factor * (249 - 234))
    const g = Math.round(179 + factor * (115 - 179))
    const b = Math.round(8 + factor * (22 - 8))
    return `rgb(${r}, ${g}, ${b})`
  } else {
    // 28.5°C a 32°C+: Naranja a Rojo Intenso (#F97316 -> #EF4444)
    const factor = (t - 0.75) / 0.25
    const r = Math.round(249 + factor * (239 - 249))
    const g = Math.round(115 + factor * (68 - 115))
    const b = Math.round(22 + factor * (68 - 22))
    return `rgb(${r}, ${g}, ${b})`
  }
}

export function SimuladorClimaticoScreen({
  selectedZoneId = 'distrito-1',
  onSelectZone,
  onNavigateModule,
}) {
  // Deslizador de cambio de vegetación (-0.10 a +0.15 en NDVI)
  const [cambioNdvi, setCambioNdvi] = useState(0.0)

  // Carga de tendencias históricas distritales (para calor nocturno)
  const [tendenciasData, setTendenciasData] = useState(null)

  useEffect(() => {
    let isMounted = true
    fetch('/data/tendencias_distritos.json')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (isMounted && data) {
          setTendenciasData(data)
        }
      })
      .catch((err) => console.error('Error cargando tendencias_distritos.json:', err))
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
  const distNumber = useMemo(() => {
    const num = activeZone.number || parseInt(activeZone.id.replace('distrito-', ''), 10)
    return isNaN(num) ? 1 : num
  }, [activeZone])

  // Datos nocturnos del distrito activo desde tendencias_distritos.json
  const distNocturno = useMemo(() => {
    if (!tendenciasData?.distritos) return null
    const dist = tendenciasData.distritos.find((d) => Number(d.id) === Number(distNumber))
    return dist?.tendencias?.lst_noche || null
  }, [tendenciasData, distNumber])

  // Cálculos de simulación
  const ndviActual = activeZone.ndviMean || 0.18
  const lstActual = activeZone.lstMean || 25.0
  const ndviSimulado = Math.max(0.01, Math.min(0.85, ndviActual + cambioNdvi))
  const deltaLst = REGRESION.pendiente * cambioNdvi
  const lstSimulada = lstActual + deltaLst

  // Presets rápidos de intervención
  const presets = [
    { label: '−0,05 (Construcción / Pavimento)', val: -0.05, desc: 'Pérdida de áreas permeables' },
    { label: '0,00 (Actual)', val: 0.0, desc: 'Condición satelital base 2024' },
    { label: '+0,05 (Arborización barrial)', val: 0.05, desc: 'Incremento de copas arbóreas' },
    { label: '+0,10 (Corredor biológico)', val: 0.1, desc: 'Eje verde continuo estructurante' },
    { label: '+0,15 (Bosque urbano)', val: 0.15, desc: 'Transformación ecológica integral' },
  ]

  return (
    <div className="sim-clim-screen">
      {/* 1. ENCABEZADO: Título, etiqueta Estimación y frase conceptual */}
      <div className="sim-clim-header">
        <div className="sim-clim-title-row">
          <div className="sim-clim-title-group">
            <span className="neo-micro-tag">
              ENFOQUE 1 · CLIMA URBANO Y SIMULACIÓN BIOFÍSICA
            </span>
            <div className="sim-clim-title-wrap">
              <h2 className="sim-clim-title">Simulador climático</h2>
              <span className="sim-clim-badge-estimacion" title="Cálculo predictivo mediante regresión biofísica calibrada">
                ✦ Estimación
              </span>
            </div>
          </div>

          {/* Selector rápido de distrito */}
          <div className="sim-clim-dist-selector">
            <span className="sim-clim-selector-label">Distrito:</span>
            <select
              value={activeZone.id}
              onChange={(e) => onSelectZone && onSelectZone(e.target.value)}
              className="sim-clim-select"
            >
              {COCHABAMBA_ZONES.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.name} ({formatNum(z.lstMean, 1)} °C)
                </option>
              ))}
            </select>
          </div>
        </div>

        <p className="sim-clim-subtitle">
          ¿Qué pasaría con el calor del suelo si el distrito tuviera más (o menos) vegetación?
        </p>
      </div>

      {/* 2. CONTROL PRINCIPAL: Deslizador de cambio de vegetación (-0,10 a +0,15) */}
      <section className="sim-clim-control-card">
        <div className="sim-clim-slider-header">
          <div className="sim-clim-slider-label-group">
            <Sliders className="sim-clim-icon" size={18} />
            <div>
              <span className="sim-clim-slider-title">Cambio de vegetación proyectado (Δ NDVI)</span>
              <p className="sim-clim-slider-hint">
                Los valores negativos representan más superficie construida o pavimentada; los valores positivos simulan reforestación y áreas verdes.
              </p>
            </div>
          </div>
          <div className="sim-clim-slider-val-box">
            <span
              className={`sim-clim-slider-val-badge ${
                cambioNdvi > 0
                  ? 'is-cooling'
                  : cambioNdvi < 0
                  ? 'is-warming'
                  : 'is-neutral'
              }`}
            >
              {formatSigned(cambioNdvi, 2)} NDVI
            </span>
          </div>
        </div>

        {/* Input range estilo simulador de equipamientos */}
        <div className="sim-clim-slider-container">
          <input
            type="range"
            min="-0.10"
            max="0.15"
            step="0.01"
            value={cambioNdvi}
            onChange={(e) => setCambioNdvi(parseFloat(e.target.value))}
            className="sim-clim-range-input"
            aria-label="Cambio de vegetación en NDVI"
          />
          <div className="sim-clim-range-ticks">
            <span>−0,10 (Más construcción)</span>
            <span>−0,05</span>
            <span className="tick-zero">0,00 (Actual)</span>
            <span>+0,05</span>
            <span>+0,10</span>
            <span>+0,15 (Máx. verde)</span>
          </div>
        </div>

        {/* Píldoras rápidas de presets */}
        <div className="sim-clim-presets-row">
          <span className="sim-clim-presets-title">Escenarios rápidos:</span>
          <div className="sim-clim-presets-list">
            {presets.map((p) => {
              const isActive = Math.abs(cambioNdvi - p.val) < 0.005
              return (
                <button
                  key={p.val}
                  type="button"
                  onClick={() => setCambioNdvi(p.val)}
                  className={`sim-clim-preset-btn ${isActive ? 'is-active' : ''}`}
                  title={p.desc}
                >
                  {p.label}
                </button>
              )
            })}
          </div>
        </div>
      </section>

      {/* 3. TARJETAS (3): NDVI actual → simulado | LST actual → estimada | Meta para -1 °C */}
      <section className="sim-clim-kpi-grid">
        {/* Tarjeta 1: NDVI actual → simulado */}
        <article className="sim-clim-kpi-card">
          <div className="sim-clim-kpi-top">
            <span className="sim-clim-kpi-label">ÍNDICE DE VEGETACIÓN (NDVI)</span>
            <Trees className="sim-clim-icon" size={18} />
          </div>
          <div className="sim-clim-kpi-val-row">
            <span className="sim-clim-kpi-orig">{formatNum(ndviActual, 4)}</span>
            <ChevronRight size={16} className="sim-clim-arrow" />
            <strong className="sim-clim-kpi-val is-green">
              {formatNum(ndviSimulado, 4)}
            </strong>
          </div>
          <div className="sim-clim-kpi-sub">
            <span
              className={`sim-clim-delta-chip ${
                cambioNdvi > 0
                  ? 'chip-cool'
                  : cambioNdvi < 0
                  ? 'chip-warm'
                  : 'chip-neut'
              }`}
            >
              {formatSigned(cambioNdvi, 2)} NDVI
            </span>
            <span className="sim-clim-kpi-desc">Vigor vegetal en superficie</span>
          </div>
        </article>

        {/* Tarjeta 2: LST actual → estimada */}
        <article className="sim-clim-kpi-card">
          <div className="sim-clim-kpi-top">
            <span className="sim-clim-kpi-label">TEMPERATURA SUPERFICIAL (LST)</span>
            <Thermometer className="sim-clim-icon" size={18} />
          </div>
          <div className="sim-clim-kpi-val-row">
            <span className="sim-clim-kpi-orig">{formatNum(lstActual, 2)} °C</span>
            <ChevronRight size={16} className="sim-clim-arrow" />
            <strong
              className={`sim-clim-kpi-val ${
                deltaLst < 0 ? 'is-cool' : deltaLst > 0 ? 'is-warm' : ''
              }`}
            >
              {formatNum(lstSimulada, 2)} °C
            </strong>
          </div>
          <div className="sim-clim-kpi-sub">
            <span
              className={`sim-clim-delta-chip ${
                deltaLst < 0
                  ? 'chip-cool'
                  : deltaLst > 0
                  ? 'chip-warm'
                  : 'chip-neut'
              }`}
            >
              {formatSigned(deltaLst, 2)} °C
            </span>
            <span className="sim-clim-kpi-desc">
              Sensibilidad: {formatSigned(REGRESION.pendientePor01, 2)} °C por cada +0,10 NDVI
            </span>
          </div>
        </article>

        {/* Tarjeta 3: Para bajar 1 °C se necesita +X de NDVI */}
        <article className="sim-clim-kpi-card">
          <div className="sim-clim-kpi-top">
            <span className="sim-clim-kpi-label">META PARA REDUCIR 1 °C</span>
            <Target className="sim-clim-icon" size={18} />
          </div>
          <div className="sim-clim-kpi-val-row">
            <strong className="sim-clim-kpi-val is-cyan">
              +{formatNum(REGRESION.ndviParaBajar1C, 3)} NDVI
            </strong>
          </div>
          <div className="sim-clim-kpi-sub">
            <span className="sim-clim-delta-chip chip-info">
              Pendiente {formatNum(REGRESION.pendiente, 2)} °C
            </span>
            <span className="sim-clim-kpi-desc">
              Incremento de vigor fotosintético necesario para enfriar 1 °C
            </span>
          </div>
        </article>
      </section>

      {/* 4. CENTRO: Mapa de 15 distritos coloreado por LST (con distrito simulado) + Panel de Explicación */}
      <section className="sim-clim-center-grid">
        {/* Mapa SVG de los 15 distritos */}
        <article className="sim-clim-map-card">
          <div className="sim-clim-card-header">
            <div>
              <span className="neo-micro-tag">MAPA TÉRMICO DISTRITAL ESTIMADO (LST)</span>
              <h3 className="sim-clim-card-title">
                {activeZone.name} · {formatNum(lstSimulada, 2)} °C (Simulado)
              </h3>
            </div>
            <div className="sim-clim-map-status">
              <span className="sim-clim-map-badge">
                {cambioNdvi !== 0 ? 'Modo Intervención Activo' : 'Línea de Base 2024'}
              </span>
            </div>
          </div>

          <div className="sim-clim-svg-map-stage">
            <svg viewBox="0 0 740 560" className="sim-clim-svg-map">
              {COCHABAMBA_ZONES.map((zone) => {
                const shape = COCHABAMBA_DISTRICT_SVGS[zone.id]
                if (!shape) return null

                const isSelected = zone.id === activeZone.id
                // Si es el distrito seleccionado, aplicamos su LST simulada; para los demás, su LST base
                const tempVisual = isSelected ? lstSimulada : zone.lstMean
                const colorDistrito = getLstColor(tempVisual)

                return (
                  <g
                    key={zone.id}
                    className={`sim-clim-map-polygon ${isSelected ? 'is-selected' : ''}`}
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
                      className="sim-clim-map-label"
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
                      className="sim-clim-map-temp"
                    >
                      {formatNum(tempVisual, 1)}°C
                    </text>
                  </g>
                )
              })}
            </svg>

            {/* Leyenda de la escala continua de temperatura */}
            <div className="sim-clim-map-legend">
              <div className="sim-clim-legend-bar-wrap">
                <span className="sim-clim-legend-bound">18 °C (Fresco)</span>
                <div className="sim-clim-legend-gradient" />
                <span className="sim-clim-legend-bound">32 °C+ (Cálido)</span>
              </div>
              <p className="sim-clim-legend-note">
                El distrito <strong>{activeZone.shortName}</strong> muestra su temperatura estimada ({formatNum(lstSimulada, 2)} °C) con el cambio de vegetación. Haz clic en otro distrito para simularlo.
              </p>
            </div>
          </div>
        </article>

        {/* Panel explicativo de la regresión a la derecha */}
        <article className="sim-clim-info-card">
          <div className="sim-clim-card-header">
            <div>
              <span className="neo-micro-tag">EVIDENCIA MATEMÁTICA Y BIOFÍSICA</span>
              <h3 className="sim-clim-card-title">¿Cómo se calcula esta estimación?</h3>
            </div>
            <Info className="sim-clim-icon" size={18} />
          </div>

          <div className="sim-clim-info-body">
            {/* Ecuación destacada */}
            <div className="sim-clim-formula-box">
              <span className="sim-clim-formula-tag">FÓRMULA EMPÍRICA (MUNICIPAL 2024)</span>
              <code className="sim-clim-formula-code">
                LST_estimada = LST_base + ({formatNum(REGRESION.pendiente, 2)} × ΔNDVI)
              </code>
            </div>

            {/* Métricas reales de la regresión */}
            <div className="sim-clim-metrics-grid">
              <div className="sim-clim-metric-item">
                <span className="sim-clim-metric-lbl">Pendiente real</span>
                <strong className="sim-clim-metric-val is-orange">
                  {formatNum(REGRESION.pendientePor01, 2)} °C
                </strong>
                <span className="sim-clim-metric-hint">por cada +0,10 de NDVI</span>
              </div>

              <div className="sim-clim-metric-item">
                <span className="sim-clim-metric-lbl">Bondad de ajuste (R²)</span>
                <strong className="sim-clim-metric-val is-cyan">
                  {formatNum(REGRESION.r2, 2)}
                </strong>
                <span className="sim-clim-metric-hint">34,8% de la varianza explicada</span>
              </div>

              <div className="sim-clim-metric-item">
                <span className="sim-clim-metric-lbl">Correlación de Pearson</span>
                <strong className="sim-clim-metric-val is-green">
                  r = {formatNum(REGRESION.r, 2)}
                </strong>
                <span className="sim-clim-metric-hint">Significativa (p &lt; 0,05)</span>
              </div>

              <div className="sim-clim-metric-item">
                <span className="sim-clim-metric-lbl">Muestra calibrada</span>
                <strong className="sim-clim-metric-val">
                  15 distritos
                </strong>
                <span className="sim-clim-metric-hint">Landsat 8 y Sentinel-2 2024</span>
              </div>
            </div>

            {/* Explicación didáctica del fenómeno físico */}
            <div className="sim-clim-explanation-text">
              <p>
                <strong>El principio biofísico:</strong> La vegetación enfría la superficie mediante dos mecanismos simultáneos: la <em>sombra directa</em> (que intercepta la radiación solar incidente) y la <em>evapotranspiración</em> (que convierte energía calórica en vapor de agua).
              </p>
              <p>
                En Cochabamba, los distritos del norte montañoso (Distrito 13 y 12) presentan NDVI promedio superior a 0,25 y temperaturas superficiales de 20–22 °C, mientras que los distritos densificados del sur (Distrito 9 y 8) caen a NDVI 0,13–0,15 con temperaturas que superan los 29 °C.
              </p>
            </div>

            {/* Comparativa rápida en el distrito actual */}
            <div className="sim-clim-district-snapshot">
              <div className="sim-clim-snap-header">
                <strong>Resumen para {activeZone.shortName}</strong>
                <span className="sim-clim-snap-badge">{activeZone.zoneType}</span>
              </div>
              <div className="sim-clim-snap-stats">
                <div>
                  <span>LST Base 2024:</span>
                  <strong>{formatNum(lstActual, 2)} °C</strong>
                </div>
                <div>
                  <span>NDVI Base 2024:</span>
                  <strong>{formatNum(ndviActual, 4)}</strong>
                </div>
                <div>
                  <span>Impacto proyectado:</span>
                  <strong className={deltaLst < 0 ? 'is-cool' : deltaLst > 0 ? 'is-warm' : ''}>
                    {formatSigned(deltaLst, 2)} °C
                  </strong>
                </div>
              </div>
            </div>
          </div>
        </article>
      </section>

      {/* 5. ABAJO: Dato de contexto real de tendencias_distritos.json (Calor nocturno) */}
      <section className="sim-clim-night-card">
        <div className="sim-clim-night-header">
          <div className="sim-clim-night-title-group">
            <Moon className="sim-clim-icon" size={20} />
            <div>
              <span className="neo-micro-tag">
                CONTEXTO HISTÓRICO REAL · MODIS AQUA (2003–2021)
              </span>
              <h3 className="sim-clim-night-title">
                Tendencia del calor nocturno · {activeZone.shortName}
              </h3>
            </div>
          </div>

          {distNocturno?.significativa && (
            <span className="sim-clim-sig-pill is-sig">
              ✓ Tendencia estadísticamente significativa (p &lt; 0,05)
            </span>
          )}
        </div>

        <div className="sim-clim-night-content">
          <div className="sim-clim-night-sentence-box">
            <p className="sim-clim-night-sentence">
              {distNocturno?.sen_pendiente_anual !== undefined ? (
                <>
                  “De noche, este distrito se está calentando{' '}
                  <strong className="sim-clim-night-highlight">
                    {formatSigned(distNocturno.sen_pendiente_anual, 2)} °C por año
                  </strong>{' '}
                  (2003–2021).”
                </>
              ) : (
                <>
                  “De noche, este distrito presenta tendencia de calentamiento continuo según registros MODIS Aqua (2003–2021).”
                </>
              )}
            </p>
          </div>

          <div className="sim-clim-night-metrics">
            <div className="sim-clim-night-metric">
              <span>Pendiente de Sen:</span>
              <strong>
                {distNocturno?.sen_pendiente_anual !== undefined
                  ? `${formatSigned(distNocturno.sen_pendiente_anual, 4)} °C/año`
                  : '—'}
              </strong>
            </div>

            <div className="sim-clim-night-metric">
              <span>p-valor (Mann-Kendall):</span>
              <strong>
                {distNocturno?.mk_p !== undefined
                  ? distNocturno.mk_p < 0.001
                    ? 'p < 0,001'
                    : `p = ${formatNum(distNocturno.mk_p, 4)}`
                  : '—'}
              </strong>
            </div>

            <div className="sim-clim-night-metric">
              <span>Meses satelitales analizados:</span>
              <strong>{distNocturno?.meses_validos || 228} meses</strong>
            </div>
          </div>
        </div>

        <p className="sim-clim-night-note">
          <strong>¿Por qué importa la noche?</strong> Durante el día los árboles proyectan sombra y moderan la radiación solar; de noche, los pavimentos y techos de concreto liberan lentamente la inercia térmica acumulada (isla de calor nocturna), lo que dificulta el descanso biológico y la renovación del aire en la cuenca.
        </p>
      </section>

      {/* 6. AVISO METODOLÓGICO ÚNICO */}
      <footer className="sim-clim-footer-notice">
        <Info className="sim-clim-icon" size={16} />
        <span>
          Estimación basada en la relación entre vegetación y calor de los 15 distritos en 2024. No considera sombra de edificios, agua ni materiales de techos.
        </span>
      </footer>
    </div>
  )
}

export default SimuladorClimaticoScreen
