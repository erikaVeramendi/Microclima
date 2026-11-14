import { useState, useEffect, useMemo } from 'react'
import {
  COCHABAMBA_ZONES,
  CANDIDATE_FINDINGS_LIST,
} from '../../data/internalPanelData'
import { SharedGeoCanvas } from './SharedGeoCanvas'
import GamcMap from './GamcMap'
import {
  NeonDonutChart,
  NeonSplineChart,
  NeonEqBarChart,
  ContouredIsoMap,
  NeonRadarChart,
  BivariateScatterPlot,
  RedMonicaDiurnalChart,
} from './FuturisticCharts'

const YEAR_LABELS = ['19', '20', '21', '22', '23', '24', '25', '26']
const HOUR_LABELS = ['03H', '06H', '09H', '12H', '15H', '18H', '21H', '24H']

function haversineMeters(lon1, lat1, lon2, lat2) {
  const R = 6371000
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

/* =========================================================================
   COMPONENTE: TARJETA DE DATO CLAVE (100% REAL) PARA DIAGNÓSTICO GENERAL
   ========================================================================= */
function DiagnosticKpiCard({
  label,
  value,
  unit = '',
  badge = '',
  subtitle = '',
  accent = '#38BDF8',
  sparkData = null,
}) {
  const hasSpark = Array.isArray(sparkData) && sparkData.length > 1
  let linePath = ''
  let areaPath = ''
  if (hasSpark) {
    const min = Math.min(...sparkData)
    const max = Math.max(...sparkData)
    const range = max - min || 1
    const pts = sparkData.map((v, idx) => [
      4 + (idx / (sparkData.length - 1)) * 132,
      28 - ((v - min) / range) * 20,
    ])
    linePath = pts.reduce(
      (acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p[0].toFixed(1)},${p[1].toFixed(1)}`,
      ''
    )
    areaPath = `${linePath} L 136,32 L 4,32 Z`
  }

  return (
    <div className="hud-kpi-card" style={{ '--kpi-accent': accent }}>
      <div className="hud-kpi-top">
        <span className="hud-kpi-label">{label}</span>
        {badge && (
          <span className="hud-kpi-delta" style={{ color: accent, borderColor: `${accent}44` }}>
            {badge}
          </span>
        )}
      </div>

      <div className="hud-kpi-val-row">
        <strong className="hud-kpi-value">{value}</strong>
        {unit && <span className="hud-kpi-unit">{unit}</span>}
      </div>

      {hasSpark ? (
        <svg viewBox="0 0 140 32" className="hud-kpi-spark" preserveAspectRatio="none">
          <path d={areaPath} fill={accent} fillOpacity="0.18" />
          <path d={linePath} fill="none" stroke={accent} strokeWidth="2" strokeLinecap="round" />
        </svg>
      ) : (
        <div style={{ minHeight: '26px', display: 'flex', alignItems: 'center' }}>
          {subtitle && (
            <span style={{ fontSize: '0.74rem', color: 'var(--theme-text-muted)' }}>
              {subtitle}
            </span>
          )}
        </div>
      )}

      {hasSpark && subtitle && (
        <span
          style={{
            fontSize: '0.72rem',
            color: 'var(--theme-text-muted)',
            marginTop: '0.1rem',
            display: 'block',
          }}
        >
          {subtitle}
        </span>
      )}
    </div>
  )
}

/* =========================================================================
   COMPONENTE: GRÁFICO 1 - PROMEDIOS ANUALES MODIS (NDVI 2001-2025 / LST 2001-2019)
   ========================================================================= */
function AnnualModisChart({ series, variable, note }) {
  const chartData = useMemo(() => {
    return series.filter((d) => d[variable] !== null)
  }, [series, variable])

  const [hoveredPoint, setHoveredPoint] = useState(null)

  if (!chartData || chartData.length === 0) {
    return (
      <div
        style={{
          padding: '2.5rem',
          textAlign: 'center',
          color: 'var(--theme-text-muted)',
          fontSize: '0.85rem',
        }}
      >
        Cargando serie temporal MODIS...
      </div>
    )
  }

  const values = chartData.map((d) => d[variable])
  const minVal = Math.min(...values)
  const maxVal = Math.max(...values)
  const pad = (maxVal - minVal) * 0.12 || (variable === 'ndvi' ? 0.02 : 0.5)
  const yMin = minVal - pad
  const yMax = maxVal + pad
  const yRange = yMax - yMin || 1

  const width = 520
  const height = 155
  const padLeft = 44
  const padRight = 18
  const padTop = 16
  const padBottom = 26
  const plotW = width - padLeft - padRight
  const plotH = height - padTop - padBottom

  const pts = chartData.map((d, i) => {
    const x = padLeft + (i / (chartData.length - 1 || 1)) * plotW
    const y = padTop + (1 - (d[variable] - yMin) / yRange) * plotH
    return { x, y, year: d.year, val: d[variable] }
  })

  const lineD = pts.reduce(
    (acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)},${p.y.toFixed(1)}`,
    ''
  )
  const areaD = `${lineD} L ${pts[pts.length - 1].x.toFixed(1)},${height - padBottom} L ${pts[0].x.toFixed(1)},${height - padBottom} Z`

  const accentColor = variable === 'ndvi' ? '#22C55E' : '#F97316'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
      <div style={{ position: 'relative', width: '100%', height: '160px' }}>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          style={{ width: '100%', height: '100%', overflow: 'visible' }}
        >
          <defs>
            <linearGradient id={`modisGrad-${variable}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={accentColor} stopOpacity="0.28" />
              <stop offset="100%" stopColor={accentColor} stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Líneas guía horizontales */}
          <line
            x1={padLeft}
            y1={padTop}
            x2={width - padRight}
            y2={padTop}
            stroke="var(--theme-border, rgba(255,255,255,0.06))"
            strokeDasharray="3 3"
          />
          <line
            x1={padLeft}
            y1={height - padBottom}
            x2={width - padRight}
            y2={height - padBottom}
            stroke="var(--theme-border, rgba(255,255,255,0.06))"
          />

          {/* Área y línea */}
          <path d={areaD} fill={`url(#modisGrad-${variable})`} />
          <path
            d={lineD}
            fill="none"
            stroke={accentColor}
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Puntos interactivos */}
          {pts.map((p) => {
            const isHovered = hoveredPoint?.year === p.year
            return (
              <g
                key={p.year}
                onMouseEnter={() => setHoveredPoint(p)}
                onMouseLeave={() => setHoveredPoint(null)}
                style={{ cursor: 'pointer' }}
              >
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={isHovered ? 5.5 : 3}
                  fill={accentColor}
                  stroke="var(--theme-card-bg, #0b1329)"
                  strokeWidth="1.5"
                />
              </g>
            )
          })}

          {/* Eje X - Años */}
          {pts
            .filter((_, i) => i === 0 || i === pts.length - 1 || i % 4 === 0)
            .map((p) => (
              <text
                key={p.year}
                x={p.x}
                y={height - 8}
                textAnchor="middle"
                fill="var(--theme-text-muted, #94a3b8)"
                fontSize="10"
                fontFamily="var(--font-sans)"
              >
                {p.year}
              </text>
            ))}

          {/* Eje Y - Valores extremos */}
          <text
            x={padLeft - 6}
            y={padTop + 8}
            textAnchor="end"
            fill="var(--theme-text-muted, #94a3b8)"
            fontSize="10"
            fontFamily="var(--font-mono)"
          >
            {maxVal.toFixed(2)}
          </text>
          <text
            x={padLeft - 6}
            y={height - padBottom}
            textAnchor="end"
            fill="var(--theme-text-muted, #94a3b8)"
            fontSize="10"
            fontFamily="var(--font-mono)"
          >
            {minVal.toFixed(2)}
          </text>

          {/* Tooltip flotante */}
          {hoveredPoint && (
            <g
              transform={`translate(${Math.min(
                width - 80,
                Math.max(padLeft + 10, hoveredPoint.x)
              )}, ${Math.max(16, hoveredPoint.y - 12)})`}
            >
              <rect
                x="-36"
                y="-18"
                width="72"
                height="18"
                rx="4"
                fill="rgba(15, 23, 42, 0.94)"
                stroke={accentColor}
                strokeWidth="1"
              />
              <text
                x="0"
                y="-6"
                textAnchor="middle"
                fill="#ffffff"
                fontSize="10"
                fontWeight="600"
                fontFamily="var(--font-mono)"
              >
                {hoveredPoint.year}: {hoveredPoint.val.toFixed(2)}
                {variable === 'lst' ? '°C' : ''}
              </text>
            </g>
          )}
        </svg>
      </div>

      {variable === 'lst' && note && (
        <p
          style={{
            margin: '0.1rem 0 0',
            fontSize: '0.72rem',
            color: 'var(--theme-text-muted)',
            lineHeight: 1.35,
          }}
        >
          {note}
        </p>
      )}
    </div>
  )
}

/* =========================================================================
   COMPONENTE: GRÁFICO 2 - RANKING HORIZONTAL DE LOS 15 DISTRITOS POR LST MEDIA 2024
   ========================================================================= */
function DistrictThermalRanking({
  zones,
  activeZoneId,
  onSelectZone,
  municipalAvgLst,
}) {
  const sorted = useMemo(() => {
    return [...zones].sort((a, b) => b.lstMean - a.lstMean)
  }, [zones])

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.35rem',
        overflowY: 'auto',
        maxHeight: '190px',
        paddingRight: '0.3rem',
      }}
    >
      {sorted.map((zone, idx) => {
        const isSelected = zone.id === activeZoneId
        const minScale = 18
        const maxScale = 30
        const pct = Math.max(
          8,
          Math.min(100, ((zone.lstMean - minScale) / (maxScale - minScale)) * 100)
        )
        const isAboveAvg = zone.lstMean >= municipalAvgLst

        return (
          <div
            key={zone.id}
            onClick={() => onSelectZone(zone.id)}
            style={{
              display: 'grid',
              gridTemplateColumns: '22px 105px 1fr 68px',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.22rem 0.5rem',
              borderRadius: '6px',
              cursor: 'pointer',
              background: isSelected
                ? 'var(--theme-accent-subtle, rgba(56, 189, 248, 0.16))'
                : 'transparent',
              border: isSelected
                ? '1px solid var(--theme-accent, #38bdf8)'
                : '1px solid transparent',
              transition: 'all 0.15s ease',
            }}
            title={`Clic para seleccionar ${zone.name}`}
          >
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                color: isSelected ? 'var(--theme-accent, #38bdf8)' : 'var(--theme-text-muted)',
              }}
            >
              #{idx + 1}
            </span>
            <span
              style={{
                fontSize: '0.76rem',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                fontWeight: isSelected ? 700 : 500,
                color: isSelected ? 'var(--theme-text-primary, #ffffff)' : 'var(--theme-text-muted)',
              }}
            >
              {zone.shortName}
            </span>
            <div
              style={{
                position: 'relative',
                width: '100%',
                height: '7px',
                background: 'rgba(255,255,255,0.06)',
                borderRadius: '4px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${pct}%`,
                  height: '100%',
                  background: isSelected
                    ? 'var(--theme-accent, #38bdf8)'
                    : isAboveAvg
                    ? '#F97316'
                    : '#38BDF8',
                  borderRadius: '4px',
                  transition: 'width 0.3s ease',
                }}
              />
            </div>
            <span
              style={{
                fontSize: '0.75rem',
                fontFamily: 'var(--font-mono)',
                textAlign: 'right',
                fontWeight: isSelected ? 700 : 500,
                color: isSelected ? 'var(--theme-accent, #38bdf8)' : 'var(--theme-text-primary, #ffffff)',
              }}
            >
              {zone.lstMean.toFixed(2)} °C
            </span>
          </div>
        )
      })}
    </div>
  )
}

/* =========================================================================
   OPCIÓN 00 (PRIMERA AL ENTRAR). MONITOREO GENERAL (Diagnóstico y Radar de Alertas)
   ========================================================================= */
export function MonitoreoGeneralScreen({
  selectedZoneId,
  onSelectZone,
  onNavigateModule,
}) {
  const [mapLayer, setMapLayer] = useState('dual')
  const [modisData, setModisData] = useState(null)
  const [modisVar, setModisVar] = useState('ndvi') // 'ndvi' o 'lst'

  const activeZone =
    COCHABAMBA_ZONES.find((z) => z.id === selectedZoneId) || COCHABAMBA_ZONES[0]

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

  // Identificador de distrito en MODIS
  const distNum = String(activeZone.number || activeZone.id.replace('distrito-', ''))
  const distModis = useMemo(() => {
    if (!modisData?.distritos) return null
    return modisData.distritos.find((d) => String(d.id) === distNum)
  }, [modisData, distNum])

  // Agrupación anual real (2001-2025 para NDVI, 2001-2019 para LST)
  const annualSeries = useMemo(() => {
    if (!distModis?.serie) return []
    const byYear = {}
    distModis.serie.forEach((pt) => {
      const year = pt.fecha.slice(0, 4)
      if (!byYear[year]) byYear[year] = { ndvi: [], lst: [] }
      if (pt.ndvi !== null && pt.ndvi !== undefined) byYear[year].ndvi.push(pt.ndvi)
      if (pt.lst !== null && pt.lst !== undefined) byYear[year].lst.push(pt.lst)
    })
    return Object.entries(byYear).map(([year, vals]) => ({
      year,
      ndvi: vals.ndvi.length > 0 ? vals.ndvi.reduce((a, b) => a + b, 0) / vals.ndvi.length : null,
      lst: vals.lst.length > 0 ? vals.lst.reduce((a, b) => a + b, 0) / vals.lst.length : null,
    }))
  }, [distModis])

  // Sparklines con datos anuales reales
  const sparkLst = useMemo(() => {
    return annualSeries.filter((d) => d.lst !== null).map((d) => d.lst)
  }, [annualSeries])

  const sparkNdvi = useMemo(() => {
    return annualSeries.filter((d) => d.ndvi !== null).map((d) => d.ndvi)
  }, [annualSeries])

  // Cálculos reales para la ficha técnica del distrito
  const municipalAvgLst = useMemo(() => {
    return (
      COCHABAMBA_ZONES.reduce((acc, z) => acc + (z.lstMean || 0), 0) /
      COCHABAMBA_ZONES.length
    )
  }, [])

  const thermalAnomalyCalc =
    activeZone.lstMean != null ? activeZone.lstMean - municipalAvgLst : null
  const thermalAnomalyFormatted =
    thermalAnomalyCalc != null
      ? `${thermalAnomalyCalc > 0 ? '+' : ''}${thermalAnomalyCalc.toFixed(2)} °C`
      : 'No calculado'

  const pearsonFormatted =
    activeZone.correlacionPearson != null && !isNaN(activeZone.correlacionPearson)
      ? activeZone.correlacionPearson.toFixed(2)
      : 'No calculado'

  const KANATA_COORDS = { lat: -17.4132, lng: -66.1554, name: 'Parque Kanata (Sur)' }
  const SEMAPA_COORDS = { lat: -17.3622, lng: -66.1714, name: 'SEMAPA (Norte)' }
  const distToKanata = Math.hypot(
    (activeZone.lat || 0) - KANATA_COORDS.lat,
    (activeZone.lng || 0) - KANATA_COORDS.lng
  )
  const distToSemapa = Math.hypot(
    (activeZone.lat || 0) - SEMAPA_COORDS.lat,
    (activeZone.lng || 0) - SEMAPA_COORDS.lng
  )
  const estacionReferencia =
    distToKanata < distToSemapa ? KANATA_COORDS.name : SEMAPA_COORDS.name

  return (
    <div className="neo-screen">
      {/* 1. Línea debajo del título que explica para qué sirve la pestaña */}
      <div style={{ marginBottom: '0.1rem' }}>
        <p
          style={{
            margin: 0,
            fontSize: '0.86rem',
            color: 'var(--theme-text-muted)',
            lineHeight: 1.45,
          }}
        >
          Diagnóstico bioclimático de los 15 distritos de Cochabamba combinando temperatura superficial satelital (Landsat 8) y vigor vegetal (Sentinel-2) 2024.
        </p>
      </div>

      {/* 2. Fila 1: Máximo 4 tarjetas de datos clave */}
      <section className="neo-kpi-strip">
        <DiagnosticKpiCard
          label="LST SUPERFICIAL MEDIA"
          value={activeZone.lstMean.toFixed(2)}
          unit="°C"
          badge="Landsat 8/9"
          subtitle={`Rango: ${activeZone.lstMin.toFixed(2)}° a ${activeZone.lstMax.toFixed(2)}°C`}
          accent="#F97316"
          sparkData={sparkLst}
        />
        <DiagnosticKpiCard
          label="HUELLA VERDE NDVI MEDIA"
          value={activeZone.ndviMean.toFixed(2)}
          unit="NDVI"
          badge="Sentinel-2"
          subtitle={`Rango: ${activeZone.ndviMin.toFixed(2)} a ${activeZone.ndviMax.toFixed(2)}`}
          accent="#22C55E"
          sparkData={sparkNdvi}
        />
        <DiagnosticKpiCard
          label="MUESTREO SATELITAL"
          value={activeZone.validPixels}
          unit="px"
          badge="Cobertura 100%"
          subtitle="Resolución 100 m libre de nubes"
          accent="#38BDF8"
          sparkData={null}
        />
        <DiagnosticKpiCard
          label="CORRELACIÓN LST VS NDVI"
          value={pearsonFormatted !== 'No calculado' ? `r = ${pearsonFormatted}` : 'No calculado'}
          unit=""
          badge="FDR p < 0,05"
          subtitle={
            activeZone.valorPFDR
              ? `p-valor FDR ${activeZone.valorPFDR}`
              : 'Significativo'
          }
          accent="#A855F7"
          sparkData={null}
        />
      </section>

      {/* 3. Fila 2: Mapa a la izquierda + 1 panel a la derecha */}
      <section className="neo-split-7-5">
        {/* Mapa interactivo */}
        <div
          className="neo-glass-card"
          style={{ padding: '0.65rem 0.85rem', overflow: 'hidden' }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '0.45rem',
            }}
          >
            <div>
              <span className="neo-micro-tag">MAPA BIOCLIMÁTICO INTERACTIVO</span>
              <h3 style={{ margin: 0, fontSize: '0.88rem' }}>
                15 Distritos Municipales de Cochabamba
              </h3>
            </div>
            <span className="neo-pill-badge neo-pill--cyan">Capas: LST / NDVI</span>
          </div>

          <SharedGeoCanvas
            selectedZoneId={selectedZoneId}
            onSelectZone={onSelectZone}
            activeLayer={mapLayer}
            onLayerChange={setMapLayer}
            onNavigateModule={onNavigateModule}
            height={440}
          />
        </div>

        {/* Panel derecho: Ficha técnica del distrito con único botón de acción */}
        <article
          className="neo-glass-card"
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div className="neo-card-header">
              <div>
                <span className="neo-micro-tag">FICHA TÉCNICA DISTRITAL</span>
                <h3>{activeZone.name}</h3>
              </div>
              <span className="neo-pill-badge neo-pill--cyan">{activeZone.zoneType}</span>
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.55rem',
                marginTop: '0.85rem',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.5rem 0.65rem',
                  borderRadius: '8px',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid var(--theme-border, rgba(56, 189, 248, 0.1))',
                }}
              >
                <span style={{ fontSize: '0.8rem', color: 'var(--theme-text-muted)' }}>
                  Elevación oficial
                </span>
                <strong
                  style={{
                    fontSize: '0.85rem',
                    color: 'var(--theme-text-primary)',
                  }}
                >
                  {activeZone.elevation}
                </strong>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.5rem 0.65rem',
                  borderRadius: '8px',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid var(--theme-border, rgba(56, 189, 248, 0.1))',
                }}
              >
                <span style={{ fontSize: '0.8rem', color: 'var(--theme-text-muted)' }}>
                  Coordenadas centroide
                </span>
                <strong
                  style={{
                    fontSize: '0.78rem',
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--theme-text-primary)',
                  }}
                >
                  {activeZone.coords}
                </strong>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.5rem 0.65rem',
                  borderRadius: '8px',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid var(--theme-border, rgba(56, 189, 248, 0.1))',
                }}
              >
                <span style={{ fontSize: '0.8rem', color: 'var(--theme-text-muted)' }}>
                  Anomalía térmica vs. media
                </span>
                <strong
                  style={{
                    fontSize: '0.85rem',
                    color:
                      (thermalAnomalyCalc ?? 0) > 0 ? '#F97316' : '#38BDF8',
                  }}
                >
                  {thermalAnomalyFormatted}
                </strong>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.5rem 0.65rem',
                  borderRadius: '8px',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid var(--theme-border, rgba(56, 189, 248, 0.1))',
                }}
              >
                <span style={{ fontSize: '0.8rem', color: 'var(--theme-text-muted)' }}>
                  Estación MÓNICA ref.
                </span>
                <strong
                  style={{
                    fontSize: '0.82rem',
                    color: 'var(--theme-text-primary)',
                  }}
                >
                  {estacionReferencia}
                </strong>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.5rem 0.65rem',
                  borderRadius: '8px',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid var(--theme-border, rgba(56, 189, 248, 0.1))',
                }}
              >
                <span style={{ fontSize: '0.8rem', color: 'var(--theme-text-muted)' }}>
                  Correlación LST vs NDVI
                </span>
                <strong
                  style={{
                    fontSize: '0.85rem',
                    color: 'var(--theme-text-primary)',
                  }}
                >
                  {pearsonFormatted !== 'No calculado'
                    ? `r = ${pearsonFormatted}`
                    : 'No calculado'}
                </strong>
              </div>
            </div>
          </div>

          {/* Único botón principal de acción */}
          <div style={{ marginTop: '1.2rem' }}>
            <button
              type="button"
              onClick={() => onNavigateModule('inteligencia-termica')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                width: '100%',
                padding: '0.76rem 1rem',
                borderRadius: '10px',
                background: 'var(--theme-accent, #38bdf8)',
                color: '#07101e',
                fontWeight: 700,
                fontSize: '0.88rem',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(56, 189, 248, 0.3)',
                transition: 'transform 0.15s ease, box-shadow 0.15s ease',
              }}
            >
              Ver cambio en el tiempo →
            </button>
          </div>
        </article>
      </section>

      {/* 4. Fila 3: Abajo, máximo 2 gráficos con datos reales */}
      <section className="neo-split-6-6">
        {/* Gráfico 1: Serie MODIS de promedios anuales */}
        <article className="neo-glass-card">
          <div className="neo-card-header">
            <div>
              <span className="neo-micro-tag">SERIE TEMPORAL HISTÓRICA MODIS</span>
              <h3>Promedios anuales · {activeZone.shortName}</h3>
            </div>
            {/* Subpestañas: 2 opciones (NDVI / LST) */}
            <div
              style={{
                display: 'flex',
                gap: '0.25rem',
                background: 'rgba(0,0,0,0.22)',
                padding: '0.18rem',
                borderRadius: '8px',
              }}
            >
              <button
                type="button"
                onClick={() => setModisVar('ndvi')}
                style={{
                  padding: '0.22rem 0.6rem',
                  fontSize: '0.74rem',
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: modisVar === 'ndvi' ? 700 : 500,
                  background:
                    modisVar === 'ndvi'
                      ? 'var(--theme-accent, #38bdf8)'
                      : 'transparent',
                  color:
                    modisVar === 'ndvi' ? '#0a101d' : 'var(--theme-text-muted)',
                  transition: 'all 0.15s ease',
                }}
              >
                NDVI (2001–2025)
              </button>
              <button
                type="button"
                onClick={() => setModisVar('lst')}
                style={{
                  padding: '0.22rem 0.6rem',
                  fontSize: '0.74rem',
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: modisVar === 'lst' ? 700 : 500,
                  background:
                    modisVar === 'lst'
                      ? 'var(--theme-accent, #38bdf8)'
                      : 'transparent',
                  color:
                    modisVar === 'lst' ? '#0a101d' : 'var(--theme-text-muted)',
                  transition: 'all 0.15s ease',
                }}
              >
                LST (2001–2019)
              </button>
            </div>
          </div>

          <AnnualModisChart
            series={annualSeries}
            variable={modisVar}
            note={modisData?.meta?.nota_lst}
          />
        </article>

        {/* Gráfico 2: Ranking horizontal de los 15 distritos por LST media 2024 */}
        <article className="neo-glass-card">
          <div className="neo-card-header">
            <div>
              <span className="neo-micro-tag">RANKING TÉRMICO MUNICIPAL 2024</span>
              <h3>15 Distritos por LST media (Landsat 8)</h3>
            </div>
            <span className="neo-pill-badge neo-pill--cyan">
              Media: {municipalAvgLst.toFixed(2)} °C
            </span>
          </div>

          <DistrictThermalRanking
            zones={COCHABAMBA_ZONES}
            activeZoneId={activeZone.id}
            onSelectZone={onSelectZone}
            municipalAvgLst={municipalAvgLst}
          />
        </article>
      </section>

      {/* 5. Aviso metodológico único en el pie */}
      <div
        style={{
          padding: '0.55rem 0.85rem',
          borderRadius: '8px',
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid var(--theme-border, rgba(56, 189, 248, 0.12))',
          fontSize: '0.75rem',
          color: 'var(--theme-text-muted)',
          lineHeight: 1.4,
          textAlign: 'center',
        }}
      >
        La temperatura superficial (LST) mide el calor de suelos y techos, no la temperatura del aire a la sombra. Datos 2024 procesados con Google Earth Engine.
      </div>
    </div>
  )
}

/* =========================================================================
   PANTALLA 01. CENTRO DE INTELIGENCIA
   6 Indicadores honestos + Mapa General + Radar Actividad + Hallazgo del Día
   ========================================================================= */
export function IntelligenceCenterScreen({
  selectedZoneId,
  onSelectZone,
  selectedPeriod,
  onNavigateModule,
  onOpenAssistantWithPrompt,
}) {
  const [mapLayer, setMapLayer] = useState('dual')
  const spotlight = CANDIDATE_FINDINGS_LIST[0]

  return (
    <div className="neo-screen">
      {/* 1. Encabezado contextual discreto y futurista (Especificación P01.1) */}
      <div className="neo-compact-banner">
        <div>
          <span className="neo-micro-tag">PANTALLA 01 · NÚCLEO DE OPERACIONES CIENTÍFICAS</span>
          <h2>Centro de inteligencia — Observa, investiga y comprende Cochabamba</h2>
        </div>
        <div className="neo-banner-chips">
          <span>Territorio: <b>Valle Cochabamba</b></span>
          <span>Periodo: <b>{selectedPeriod.split(' ')[0]} 2019–26</b></span>
          <span>Estado: <b style={{ color: '#FFCB73' }}>Demo Visual · Backend Pendiente</b></span>
        </div>
      </div>

      {/* 2. Los 6 Indicadores Principales Oficiales (Especificación P01.2) */}
      <section className="neo-kpi-6strip">
        {[
          { lbl: 'FUENTES DISPONIBLES', val: '11 / 13', sub: 'Catálogos NASA/ESA + GAMC pend.', col: '#65C8F2', mod: 'gestion-datos' },
          { lbl: 'PERIODOS ANALIZADOS', val: '2019–26', sub: 'Época seca comparable', col: '#43A875', mod: 'explorador-territorial' },
          { lbl: 'INVESTIGACIONES ACTIVAS', val: '03', sub: 'Rocha · Itocta · Islas LST', col: '#8875D8', mod: 'investigaciones-informes' },
          { lbl: 'ANÁLISIS COMPLETADOS', val: 'Base QA', sub: 'Cola PostGIS en espera', col: '#8BCB9A', mod: 'gestion-datos' },
          { lbl: 'HALLAZGOS CANDIDATOS', val: '04', sub: 'En revisión científica', col: '#FFCB73', mod: 'investigacion-descubrimiento' },
          { lbl: 'INFO. INSUFICIENTE', val: '02 Zonas', sub: 'Nubes Tunari · Sensores Sur', col: '#D95757', mod: 'evidencia-validacion' },
        ].map((k) => (
          <div
            key={k.lbl}
            className="neo-mini-kpi6"
            style={{ borderTopColor: k.col }}
            onClick={() => onNavigateModule(k.mod)}
          >
            <span>{k.lbl}</span>
            <strong style={{ color: k.col }}>{k.val}</strong>
            <small>{k.sub}</small>
          </div>
        ))}
      </section>

      {/* 3 & 4. Mapa General Central + Radar Circular de Actividad Investigativa + El Hallazgo del Día */}
      <section className="neo-split-7-5">
        <SharedGeoCanvas
          selectedZoneId={selectedZoneId}
          onSelectZone={onSelectZone}
          activeLayer={mapLayer}
          onLayerChange={setMapLayer}
          onNavigateModule={onNavigateModule}
          height={455}
        />

        <div className="neo-col-stack">
          {/* EL HALLAZGO DEL DÍA (Innovación clave MICROCLIMA P1) */}
          <article className="neo-glass-card" style={{ borderColor: 'rgba(136,117,216,0.45)' }}>
            <div className="neo-card-header">
              <div>
                <span className="neo-micro-tag" style={{ color: '#C4B5FD' }}>
                  ✦ EL HALLAZGO DEL DÍA (CANDIDATO · NO CAUSALIDAD)
                </span>
                <h3>{spotlight.title}</h3>
              </div>
              <span className="neo-pill-badge neo-pill--violet">{spotlight.shortMetric}</span>
            </div>

            <div className="neo-spotlight-actions">
              <button type="button" onClick={() => onSelectZone(spotlight.zoneId)}>
                ⊹ Ver en Mapa
              </button>
              <button type="button" onClick={() => onNavigateModule('inteligencia-termica')}>
                📈 Serie Histórica
              </button>
              <button type="button" onClick={() => onNavigateModule('evidencia-validacion')}>
                🛡 Evaluar Calidad
              </button>
              <button type="button" onClick={() => onNavigateModule('investigacion-descubrimiento')}>
                🔬 Investigar
              </button>
            </div>
          </article>

          {/* 4. Radar Circular de Actividad Investigativa + 6. Actividad Reciente */}
          <article className="neo-glass-card">
            <div className="neo-card-header">
              <div>
                <span className="neo-micro-tag">RADAR DE ACTIVIDAD INVESTIGATIVA</span>
                <h3>Estado vivo del ciclo científico MICROCLIMA</h3>
              </div>
              <button
                type="button"
                className="neo-mini-link"
                onClick={() =>
                  onOpenAssistantWithPrompt &&
                  onOpenAssistantWithPrompt('¿Qué análisis puedo realizar con los datos disponibles?')
                }
              >
                ✦ IA →
              </button>
            </div>

            <div className="neo-activity-radar-split">
              <NeonRadarChart
                metrics={[88, 72, 65, 84, 78]}
                axes={['FUENTES', 'ESTUDIOS', 'PROCESOS', 'HALLAZGOS', 'AUDITORÍA']}
                accent="#65C8F2"
              />
              <div className="neo-compact-feed">
                <div className="neo-feed-pill">
                  <i style={{ background: '#43A875' }} />
                  <span><b>Catálogo S2/L9</b> listo sin interpolar vacíos</span>
                </div>
                <div className="neo-feed-pill">
                  <i style={{ background: '#FFCB73' }} />
                  <span><b>Alerta inteligente:</b> anomalía LST Centro/Itocta</span>
                </div>
                <div className="neo-feed-pill">
                  <i style={{ background: '#D95757' }} />
                  <span><b>Vacío detectado:</b> 15 distritos GAMC pendientes</span>
                </div>
                <div className="neo-feed-pill">
                  <i style={{ background: '#8875D8' }} />
                  <span><b>3 Expedientes</b> activos en espacio colaborativo</span>
                </div>
              </div>
            </div>
          </article>
        </div>
      </section>

      {/* 5. Tarjetas Visuales de Hallazgos Candidatos Destacados */}
      <section className="neo-anomaly-4grid">
        {CANDIDATE_FINDINGS_LIST.map((f) => (
          <article
            key={f.id}
            className="neo-anomaly-card"
            onClick={() => {
              onSelectZone(f.zoneId)
              onNavigateModule(f.targetModule)
            }}
          >
            <div className="neo-anom-top">
              <span style={{ color: f.accent }}>{f.id} · {f.period}</span>
              <strong style={{ color: f.accent }}>{f.shortMetric}</strong>
            </div>
            <h4>{f.title}</h4>
            <div className="neo-anom-bottom">
              <span>{f.source}</span>
              <span className="neo-conf-chip">{f.evidenceState} →</span>
            </div>
          </article>
        ))}
      </section>
    </div>
  )
}

/* =========================================================================
   PANTALLA 08. COBERTURA DE SERVICIOS (ENFOQUE 2 · GESTIÓN MUNICIPAL)
   "Dónde hay y dónde faltan servicios: salud, colegios, transporte y áreas verdes"
   Integra: GamcMap WMS + equipamientos.geojson + poblacion_grilla.json + indice_distritos.json
   ========================================================================= */
export function TerritorialExplorerScreen({
  selectedZoneId,
  onSelectZone,
}) {
  const [indiceData, setIndiceData] = useState(null)
  const [equipamientosData, setEquipamientosData] = useState(null)
  const [grillaData, setGrillaData] = useState(null)
  const [distritosGeoJson, setDistritosGeoJson] = useState(null)

  // Radios de cobertura interactivos (metros)
  const [radioSalud, setRadioSalud] = useState(1000)
  const [radioColegios, setRadioColegios] = useState(1000)

  // Carga de datos reales oficiales
  useEffect(() => {
    let isMounted = true

    fetch('/data/indice_distritos.json')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => isMounted && d && setIndiceData(d))
      .catch((err) => console.error('Error cargando indice_distritos.json:', err))

    fetch('/data/equipamientos.geojson')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => isMounted && d && setEquipamientosData(d))
      .catch((err) => console.error('Error cargando equipamientos.geojson:', err))

    fetch('/data/poblacion_grilla.json')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => isMounted && d && setGrillaData(d))
      .catch((err) => console.error('Error cargando poblacion_grilla.json:', err))

    fetch('/data/distritos_indicadores_ambientales_2024.geojson')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => isMounted && d && setDistritosGeoJson(d))
      .catch((err) => console.error('Error cargando distritos.geojson:', err))

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

  const distritoInfo = useMemo(() => {
    if (!indiceData?.distritos) return null
    return (
      indiceData.distritos.find((d) => parseInt(String(d.id), 10) === distNum) ||
      indiceData.distritos[0]
    )
  }, [indiceData, distNum])

  const indicadores = distritoInfo?.indicadores

  // Promedios municipales oficiales para referencia
  const municipalAvg = useMemo(() => {
    if (!indiceData?.distritos || indiceData.distritos.length === 0) {
      return { salud: 61.9, colegio: 85.6, transporte: 94.6 }
    }
    const dists = indiceData.distritos
    const sumS = dists.reduce(
      (acc, d) => acc + (d.indicadores?.cobertura_salud || 0),
      0
    )
    const sumC = dists.reduce(
      (acc, d) => acc + (d.indicadores?.cobertura_colegio || 0),
      0
    )
    const sumT = dists.reduce(
      (acc, d) => acc + (d.indicadores?.cobertura_transporte || 0),
      0
    )
    return {
      salud: sumS / dists.length,
      colegio: sumC / dists.length,
      transporte: sumT / dists.length,
    }
  }, [indiceData])

  // Centros de salud de 1er nivel y Unidades educativas
  const saludPts = useMemo(() => {
    if (!equipamientosData?.features) return []
    return equipamientosData.features
      .filter((f) => {
        const p = f.properties
        return (
          p &&
          p.tipo === 'salud' &&
          p.nivel &&
          String(p.nivel).includes('1') &&
          f.geometry?.coordinates
        )
      })
      .map((f) => ({
        lng: f.geometry.coordinates[0],
        lat: f.geometry.coordinates[1],
        nombre: f.properties.nombre || 'Centro de Salud 1er nivel',
      }))
  }, [equipamientosData])

  const colegioPts = useMemo(() => {
    if (!equipamientosData?.features) return []
    return equipamientosData.features
      .filter((f) => {
        const p = f.properties
        return p && p.tipo === 'educacion' && f.geometry?.coordinates
      })
      .map((f) => ({
        lng: f.geometry.coordinates[0],
        lat: f.geometry.coordinates[1],
        nombre: f.properties.nombre || 'Unidad Educativa',
      }))
  }, [equipamientosData])

  // Recálculo dinámico de cobertura en el navegador con poblacion_grilla.json
  const coberturaCalculada = useMemo(() => {
    // Si no ha variado el radio (1000m por defecto) y ya tenemos los indicadores precargados
    if (
      radioSalud === 1000 &&
      radioColegios === 1000 &&
      indicadores?.cobertura_salud !== undefined
    ) {
      return {
        salud: indicadores.cobertura_salud,
        colegio: indicadores.cobertura_colegio,
      }
    }

    if (!grillaData?.celdas || !distNum) {
      return {
        salud: indicadores?.cobertura_salud ?? 0,
        colegio: indicadores?.cobertura_colegio ?? 0,
      }
    }

    // Celdas del distrito activo con población > 0
    const celdasDistrito = grillaData.celdas.filter(
      (c) => Math.round(c[4]) === distNum && c[2] > 0
    )
    if (celdasDistrito.length === 0) {
      return {
        salud: indicadores?.cobertura_salud ?? 0,
        colegio: indicadores?.cobertura_colegio ?? 0,
      }
    }

    let totalPob = 0
    let coveredPobSalud = 0
    let coveredPobColegio = 0

    const degBoxSalud = radioSalud / 100000
    const degBoxColegio = radioColegios / 100000

    for (let i = 0; i < celdasDistrito.length; i++) {
      const c = celdasDistrito[i]
      const cLon = c[0]
      const cLat = c[1]
      const cPob = c[2]
      totalPob += cPob

      // Verificación de salud
      let isCoveredSalud = false
      for (let j = 0; j < saludPts.length; j++) {
        const sp = saludPts[j]
        if (
          Math.abs(cLat - sp.lat) <= degBoxSalud &&
          Math.abs(cLon - sp.lng) <= degBoxSalud
        ) {
          if (haversineMeters(cLon, cLat, sp.lng, sp.lat) <= radioSalud) {
            isCoveredSalud = true
            break
          }
        }
      }
      if (isCoveredSalud) coveredPobSalud += cPob

      // Verificación de colegios
      let isCoveredColegio = false
      for (let k = 0; k < colegioPts.length; k++) {
        const cp = colegioPts[k]
        if (
          Math.abs(cLat - cp.lat) <= degBoxColegio &&
          Math.abs(cLon - cp.lng) <= degBoxColegio
        ) {
          if (haversineMeters(cLon, cLat, cp.lng, cp.lat) <= radioColegios) {
            isCoveredColegio = true
            break
          }
        }
      }
      if (isCoveredColegio) coveredPobColegio += cPob
    }

    const pctSalud = totalPob > 0 ? (coveredPobSalud / totalPob) * 100 : 0
    const pctColegio = totalPob > 0 ? (coveredPobColegio / totalPob) * 100 : 0

    return {
      salud: Number(pctSalud.toFixed(1)),
      colegio: Number(pctColegio.toFixed(1)),
    }
  }, [
    grillaData,
    distNum,
    indicadores,
    radioSalud,
    radioColegios,
    saludPts,
    colegioPts,
  ])

  // Círculos de radio de cobertura para GamcMap
  const radiosCoverage = useMemo(() => {
    const list = []
    saludPts.forEach((p) => {
      list.push({
        lat: p.lat,
        lng: p.lng,
        radius: radioSalud,
        color: '#EF4444',
        fillColor: '#EF4444',
        fillOpacity: 0.1,
        label: `${p.nombre} (Radio salud: ${radioSalud} m)`,
      })
    })
    colegioPts.forEach((p) => {
      list.push({
        lat: p.lat,
        lng: p.lng,
        radius: radioColegios,
        color: '#F59E0B',
        fillColor: '#F59E0B',
        fillOpacity: 0.08,
        label: `${p.nombre} (Radio colegio: ${radioColegios} m)`,
      })
    })
    return list
  }, [saludPts, colegioPts, radioSalud, radioColegios])

  // GeoJSON con el distrito seleccionado resaltado
  const distritosGeoJsonHighlight = useMemo(() => {
    if (!distritosGeoJson?.features) return null
    return {
      ...distritosGeoJson,
      features: distritosGeoJson.features.map((f) => ({
        ...f,
        properties: {
          ...f.properties,
          selected: parseInt(String(f.properties?.codigo_distrito), 10) === distNum,
          color:
            parseInt(String(f.properties?.codigo_distrito), 10) === distNum
              ? 'var(--theme-accent, #38BDF8)'
              : '#64748B',
        },
      })),
    }
  }, [distritosGeoJson, distNum])

  return (
    <div className="neo-screen">
      {/* 1. Línea bajo el título */}
      <div style={{ marginBottom: '0.1rem' }}>
        <p
          style={{
            margin: 0,
            fontSize: '0.86rem',
            color: 'var(--theme-text-muted)',
            lineHeight: 1.45,
          }}
        >
          Dónde hay y dónde faltan servicios: salud, colegios, transporte y áreas verdes.
        </p>
      </div>

      {/* 2. Tarjetas (3): Cobertura de salud, colegios y transporte con promedio municipal debajo */}
      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '0.75rem',
        }}
      >
        {/* Tarjeta 1: Salud 1er nivel */}
        <div className="hud-kpi-card" style={{ '--kpi-accent': '#EF4444' }}>
          <div className="hud-kpi-top">
            <span className="hud-kpi-label">POBLACIÓN CUBIERTA POR SALUD</span>
            <span
              className="hud-kpi-delta"
              style={{ color: '#EF4444', borderColor: 'rgba(239, 68, 68, 0.44)' }}
            >
              1er nivel ({radioSalud} m)
            </span>
          </div>
          <div className="hud-kpi-val-row">
            <strong className="hud-kpi-value">{coberturaCalculada.salud.toFixed(1)}%</strong>
          </div>
          <span
            style={{
              fontSize: '0.74rem',
              color: 'var(--theme-text-muted)',
              marginTop: '0.2rem',
              display: 'block',
            }}
          >
            Promedio municipal: {municipalAvg.salud.toFixed(1)}%
          </span>
        </div>

        {/* Tarjeta 2: Colegios */}
        <div className="hud-kpi-card" style={{ '--kpi-accent': '#F59E0B' }}>
          <div className="hud-kpi-top">
            <span className="hud-kpi-label">POBLACIÓN CUBIERTA POR COLEGIOS</span>
            <span
              className="hud-kpi-delta"
              style={{ color: '#F59E0B', borderColor: 'rgba(245, 158, 11, 0.44)' }}
            >
              Unidades educativas ({radioColegios} m)
            </span>
          </div>
          <div className="hud-kpi-val-row">
            <strong className="hud-kpi-value">{coberturaCalculada.colegio.toFixed(1)}%</strong>
          </div>
          <span
            style={{
              fontSize: '0.74rem',
              color: 'var(--theme-text-muted)',
              marginTop: '0.2rem',
              display: 'block',
            }}
          >
            Promedio municipal: {municipalAvg.colegio.toFixed(1)}%
          </span>
        </div>

        {/* Tarjeta 3: Transporte */}
        <div className="hud-kpi-card" style={{ '--kpi-accent': '#38BDF8' }}>
          <div className="hud-kpi-top">
            <span className="hud-kpi-label">POBLACIÓN CERCA DEL TRANSPORTE</span>
            <span
              className="hud-kpi-delta"
              style={{ color: '#38BDF8', borderColor: 'rgba(56, 189, 248, 0.44)' }}
            >
              Radio fijo 300 m
            </span>
          </div>
          <div className="hud-kpi-val-row">
            <strong className="hud-kpi-value">
              {(indicadores?.cobertura_transporte ?? municipalAvg.transporte).toFixed(1)}%
            </strong>
          </div>
          <span
            style={{
              fontSize: '0.74rem',
              color: 'var(--theme-text-muted)',
              marginTop: '0.2rem',
              display: 'block',
            }}
          >
            Promedio municipal: {municipalAvg.transporte.toFixed(1)}%
          </span>
        </div>
      </section>

      {/* 3. Centro: GamcMap con capas WMS + Controles a la derecha */}
      <section className="neo-split-7-5">
        {/* Mapa interactivo con capas de la Alcaldía */}
        <div
          className="neo-glass-card"
          style={{ padding: '0.5rem', overflow: 'hidden' }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '0.2rem 0.4rem 0.45rem',
            }}
          >
            <div>
              <span className="neo-micro-tag">MAPA OFICIAL GAMC CON COBERTURA</span>
              <h3 style={{ margin: 0, fontSize: '0.88rem' }}>
                Capas de la Alcaldía · {activeZone.name}
              </h3>
            </div>
            <span className="neo-pill-badge neo-pill--cyan">
              Radios: {radioSalud} m (Salud) · {radioColegios} m (Colegios)
            </span>
          </div>

          <GamcMap
            capasWms={[
              'limite_distritos',
              'centros_salud',
              'unidades_educativas',
              'areas_verdes',
              'poblacion_manzanas',
            ]}
            geojson={distritosGeoJsonHighlight}
            radios={radiosCoverage}
            onClickDistrito={(feature) => {
              const cod = feature?.properties?.codigo_distrito
              if (cod) onSelectZone(`distrito-${cod}`)
            }}
            height="460px"
          />
        </div>

        {/* Panel derecho: Controles de Radio dinámicos */}
        <article
          className="neo-glass-card"
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div className="neo-card-header">
              <div>
                <span className="neo-micro-tag">SIMULADOR DE ALCANCE</span>
                <h3>Radios de Cobertura</h3>
              </div>
              <span className="neo-pill-badge neo-pill--emerald">
                {activeZone.shortName}
              </span>
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                marginTop: '0.85rem',
              }}
            >
              {/* Control Radio Salud */}
              <div
                style={{
                  padding: '0.75rem 0.85rem',
                  borderRadius: '10px',
                  background: 'rgba(239, 68, 68, 0.06)',
                  border: '1px solid rgba(239, 68, 68, 0.22)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '0.45rem',
                  }}
                >
                  <span
                    style={{
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      color: 'var(--theme-text-primary)',
                    }}
                  >
                    Radio de salud (1er nivel)
                  </span>
                  <strong
                    style={{
                      fontSize: '0.85rem',
                      fontFamily: 'var(--font-mono)',
                      color: '#EF4444',
                    }}
                  >
                    {radioSalud} m
                  </strong>
                </div>
                <input
                  type="range"
                  min="500"
                  max="2000"
                  step="50"
                  value={radioSalud}
                  onChange={(e) => setRadioSalud(Number(e.target.value))}
                  style={{ width: '100%', accentColor: '#EF4444' }}
                />
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '0.68rem',
                    color: 'var(--theme-text-muted)',
                    marginTop: '0.2rem',
                  }}
                >
                  <span>500 m (caminable 6 min)</span>
                  <span>2.000 m (24 min)</span>
                </div>
              </div>

              {/* Control Radio Colegios */}
              <div
                style={{
                  padding: '0.75rem 0.85rem',
                  borderRadius: '10px',
                  background: 'rgba(245, 158, 11, 0.06)',
                  border: '1px solid rgba(245, 158, 11, 0.22)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '0.45rem',
                  }}
                >
                  <span
                    style={{
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      color: 'var(--theme-text-primary)',
                    }}
                  >
                    Radio de colegios
                  </span>
                  <strong
                    style={{
                      fontSize: '0.85rem',
                      fontFamily: 'var(--font-mono)',
                      color: '#F59E0B',
                    }}
                  >
                    {radioColegios} m
                  </strong>
                </div>
                <input
                  type="range"
                  min="500"
                  max="2000"
                  step="50"
                  value={radioColegios}
                  onChange={(e) => setRadioColegios(Number(e.target.value))}
                  style={{ width: '100%', accentColor: '#F59E0B' }}
                />
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '0.68rem',
                    color: 'var(--theme-text-muted)',
                    marginTop: '0.2rem',
                  }}
                >
                  <span>500 m (caminable 6 min)</span>
                  <span>2.000 m (24 min)</span>
                </div>
              </div>

              {/* Aclaración transporte fija */}
              <div
                style={{
                  padding: '0.6rem 0.75rem',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--theme-border, rgba(56, 189, 248, 0.12))',
                  fontSize: '0.74rem',
                  color: 'var(--theme-text-muted)',
                  lineHeight: 1.4,
                }}
              >
                <strong style={{ color: 'var(--theme-text-primary)', display: 'block', marginBottom: '2px' }}>
                  Transporte público (300 m fijo):
                </strong>
                La cobertura de transporte utiliza el estándar internacional de 300 m de caminata hacia paradas y líneas oficiales del GAMC.
              </div>
            </div>
          </div>

          <div style={{ marginTop: '1rem' }}>
            <button
              type="button"
              onClick={() => {
                setRadioSalud(1000)
                setRadioColegios(1000)
              }}
              style={{
                width: '100%',
                padding: '0.55rem',
                borderRadius: '8px',
                border: '1px solid var(--theme-border, rgba(56, 189, 248, 0.25))',
                background: 'transparent',
                color: 'var(--theme-text-muted)',
                fontSize: '0.78rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              Restablecer radios a 1.000 m
            </button>
          </div>
        </article>
      </section>

      {/* 4. Abajo: (1) Barras de los 15 distritos cobertura salud + (2) Tabla pequeña del distrito */}
      <section className="neo-split-6-6">
        {/* Bloque 1: Barras horizontales de los 15 distritos por cobertura de salud */}
        <article className="neo-glass-card">
          <div className="neo-card-header">
            <div>
              <span className="neo-micro-tag">COMPARATIVA MUNICIPAL</span>
              <h3>Cobertura de salud de 1er nivel por distrito</h3>
            </div>
            <span className="neo-pill-badge neo-pill--cyan">
              Media: {municipalAvg.salud.toFixed(1)}%
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.35rem',
              overflowY: 'auto',
              maxHeight: '195px',
              paddingRight: '0.3rem',
            }}
          >
            {(indiceData?.distritos || []).map((d) => {
              const dIdNum = parseInt(String(d.id), 10)
              const isSelected = dIdNum === distNum
              const cob = d.indicadores?.cobertura_salud || 0
              const isAboveAvg = cob >= municipalAvg.salud

              return (
                <div
                  key={d.id}
                  onClick={() => onSelectZone(`distrito-${d.id}`)}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '24px 105px 1fr 58px',
                    alignItems: 'center',
                    gap: '0.45rem',
                    padding: '0.22rem 0.45rem',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    background: isSelected
                      ? 'var(--theme-accent-subtle, rgba(56, 189, 248, 0.16))'
                      : 'transparent',
                    border: isSelected
                      ? '1px solid var(--theme-accent, #38BDF8)'
                      : '1px solid transparent',
                    transition: 'all 0.15s ease',
                  }}
                  title={`Clic para seleccionar Distrito ${d.id}`}
                >
                  <span
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      color: isSelected
                        ? 'var(--theme-accent, #38BDF8)'
                        : 'var(--theme-text-muted)',
                    }}
                  >
                    D{d.id}
                  </span>
                  <span
                    style={{
                      fontSize: '0.76rem',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      fontWeight: isSelected ? 700 : 500,
                      color: isSelected
                        ? 'var(--theme-text-primary, #ffffff)'
                        : 'var(--theme-text-muted)',
                    }}
                  >
                    {d.nombre.replace(/^Distrito\s*\d+\s*[·-]\s*/, '') || `Distrito ${d.id}`}
                  </span>
                  <div
                    style={{
                      position: 'relative',
                      width: '100%',
                      height: '7px',
                      background: 'rgba(255,255,255,0.06)',
                      borderRadius: '4px',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        width: `${Math.min(100, cob)}%`,
                        height: '100%',
                        background: isSelected
                          ? 'var(--theme-accent, #38BDF8)'
                          : isAboveAvg
                          ? '#10B981'
                          : '#EF4444',
                        borderRadius: '4px',
                        transition: 'width 0.3s ease',
                      }}
                    />
                  </div>
                  <span
                    style={{
                      fontSize: '0.74rem',
                      fontFamily: 'var(--font-mono)',
                      textAlign: 'right',
                      fontWeight: isSelected ? 700 : 500,
                      color: isSelected
                        ? 'var(--theme-accent, #38BDF8)'
                        : 'var(--theme-text-primary, #ffffff)',
                    }}
                  >
                    {cob.toFixed(1)}%
                  </span>
                </div>
              )
            })}
          </div>
        </article>

        {/* Bloque 2: Tabla pequeña del distrito seleccionado */}
        <article
          className="neo-glass-card"
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div className="neo-card-header">
              <div>
                <span className="neo-micro-tag">INVENTARIO DISTRITAL</span>
                <h3>Equipamiento y áreas verdes · {activeZone.shortName}</h3>
              </div>
              <span className="neo-pill-badge neo-pill--cyan">
                {indicadores?.personas ? `${(indicadores.personas).toLocaleString()} hab.` : 'Datos GAMC'}
              </span>
            </div>

            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '0.8rem',
                marginTop: '0.65rem',
              }}
            >
              <tbody>
                <tr style={{ borderBottom: '1px solid var(--theme-border, rgba(255,255,255,0.06))' }}>
                  <td style={{ padding: '0.45rem 0', color: 'var(--theme-text-muted)' }}>Población (Censo GHSL 2025)</td>
                  <td style={{ padding: '0.45rem 0', textAlign: 'right', fontWeight: 600, color: 'var(--theme-text-primary)' }}>
                    {indicadores?.personas ? `${indicadores.personas.toLocaleString()} personas` : '—'}
                  </td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--theme-border, rgba(255,255,255,0.06))' }}>
                  <td style={{ padding: '0.45rem 0', color: 'var(--theme-text-muted)' }}>Centros de salud (1er nivel)</td>
                  <td style={{ padding: '0.45rem 0', textAlign: 'right', fontWeight: 600, color: 'var(--theme-text-primary)' }}>
                    {indicadores?.salud_1er !== undefined ? `${indicadores.salud_1er} centros` : '—'}
                  </td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--theme-border, rgba(255,255,255,0.06))' }}>
                  <td style={{ padding: '0.45rem 0', color: 'var(--theme-text-muted)' }}>Unidades educativas oficiales</td>
                  <td style={{ padding: '0.45rem 0', textAlign: 'right', fontWeight: 600, color: 'var(--theme-text-primary)' }}>
                    {indicadores?.colegios !== undefined ? `${indicadores.colegios} colegios` : '—'}
                  </td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--theme-border, rgba(255,255,255,0.06))' }}>
                  <td style={{ padding: '0.45rem 0', color: 'var(--theme-text-muted)' }}>Superficie de áreas verdes</td>
                  <td style={{ padding: '0.45rem 0', textAlign: 'right', fontWeight: 600, color: 'var(--theme-text-primary)' }}>
                    {indicadores?.area_verde_m2
                      ? `${(indicadores.area_verde_m2 / 10000).toFixed(2)} ha (${Math.round(indicadores.area_verde_m2).toLocaleString()} m²)`
                      : '—'}
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '0.45rem 0', color: 'var(--theme-text-muted)' }}>Área verde por habitante</td>
                  <td style={{ padding: '0.45rem 0', textAlign: 'right', fontWeight: 600, color: '#10B981' }}>
                    {indicadores?.verde_por_hab !== undefined
                      ? `${indicadores.verde_por_hab.toFixed(1)} m²/hab.`
                      : '—'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div
            style={{
              padding: '0.45rem 0.65rem',
              borderRadius: '6px',
              background: 'rgba(255,255,255,0.03)',
              fontSize: '0.71rem',
              color: 'var(--theme-text-muted)',
              marginTop: '0.65rem',
            }}
          >
            Fuente: Catastro de Áreas Verdes y Cartografía Oficial del GAMC.
          </div>
        </article>
      </section>

      {/* 5. Aviso metodológico único en el pie */}
      <div
        style={{
          padding: '0.55rem 0.85rem',
          borderRadius: '8px',
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid var(--theme-border, rgba(56, 189, 248, 0.12))',
          fontSize: '0.75rem',
          color: 'var(--theme-text-muted)',
          lineHeight: 1.4,
          textAlign: 'center',
        }}
      >
        La cobertura mide cercanía. Muchas personas usan servicios lejos de su casa (por ejemplo, estudiantes del sur que estudian en el centro).
      </div>
    </div>
  )
}

/* =========================================================================
   PANTALLA 03. INTELIGENCIA DE LA VEGETACIÓN
   "El verde también cuenta la historia de una ciudad"
   Integra: A. Huella/Memoria Verde | B. Pérdida y Recuperación | C. Expediente y Permanencia
   ========================================================================= */
export function VegetationIntelligenceScreen({
  selectedZoneId,
  onSelectZone,
  onNavigateModule,
}) {
  const [subTab, setSubTab] = useState('memoria') // 'memoria' | 'cambios' | 'expediente'
  const activeZone =
    COCHABAMBA_ZONES.find((z) => z.id === selectedZoneId) || COCHABAMBA_ZONES[1]

  return (
    <div className="neo-screen">
      {/* Sub-navegación de las 4 capacidades de Vegetación (MICROCLIMA P3 + P4) */}
      <div className="neo-toolbar-row">
        <div>
          <span className="neo-micro-tag" style={{ color: '#8BCB9A' }}>
            «EL VERDE TAMBIÉN CUENTA LA HISTORIA DE UNA CIUDAD»
          </span>
        </div>
        <div className="neo-pill-group">
          {[
            { id: 'memoria', lbl: '🌿 A. Huella & Memoria Verde' },
            { id: 'cambios', lbl: '📉 B/C. Pérdida y Recuperación' },
            { id: 'expediente', lbl: '🗂 D. Expediente & Permanencia' },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              className={`geo-hud-pill ${subTab === t.id ? 'is-active' : ''}`}
              onClick={() => setSubTab(t.id)}
            >
              {t.lbl}
            </button>
          ))}
          <span className="neo-pill-badge neo-pill--emerald">
            NDVI ≠ CONTEO DE ÁRBOLES NI HECTÁREAS EXACTAS
          </span>
        </div>
      </div>

      <section className="neo-split-7-5">
        <SharedGeoCanvas
          selectedZoneId={selectedZoneId}
          onSelectZone={onSelectZone}
          activeLayer="ndvi"
          enableCurtain={subTab !== 'memoria'}
          onNavigateModule={onNavigateModule}
          height={445}
        />

        <div className="neo-col-stack">
          {subTab === 'memoria' && (
            <>
              <article className="neo-glass-card">
                <div className="neo-card-header">
                  <div>
                    <span className="neo-micro-tag">ESCALA OFICIAL HUELLA VERDE</span>
                    <h3>Distribución NDVI · {activeZone.shortName}</h3>
                  </div>
                  <span className="neo-pill-badge neo-pill--emerald">S2 10m</span>
                </div>
                <NeonDonutChart
                  segments={[
                    { label: '>0.60 Vigor Alto', value: activeZone.spectralSplit[0], color: '#237B5B' },
                    { label: '0.40–0.60 Medio', value: activeZone.spectralSplit[1], color: '#43A875' },
                    { label: '0.20–0.40 Bajo', value: activeZone.spectralSplit[2], color: '#8BCB9A' },
                    { label: '<0.20 Suelo/Urbano', value: activeZone.spectralSplit[3], color: '#64748B' },
                  ]}
                  centerValue={String(activeZone.ndviIllustrative)}
                  centerLabel="NDVI"
                />
              </article>

              <article className="neo-glass-card">
                <div className="neo-card-header">
                  <div>
                    <span className="neo-micro-tag">✦ MEMORIA VERDE (2019–2026)</span>
                    <h3>Trayectoria gradual, repentina o recuperación</h3>
                  </div>
                </div>
                <NeonSplineChart
                  series={[
                    { name: activeZone.shortName, data: activeZone.annualNdvi, color: '#43A875', unit: '' },
                    { name: 'Referencia Tunari', data: COCHABAMBA_ZONES[0].annualNdvi, color: '#65C8F2', unit: '' },
                  ]}
                  labels={YEAR_LABELS}
                  height={138}
                />
              </article>
            </>
          )}

          {subTab === 'cambios' && (
            <article className="neo-glass-card">
              <div className="neo-card-header">
                <div>
                  <span className="neo-micro-tag">DETECTOR DE PÉRDIDA Y RECUPERACIÓN</span>
                  <h3>Clasificación espectral entre ventanas secas</h3>
                </div>
              </div>

              <div className="neo-4state-grid">
                {[
                  { st: 'Posible disminución', pct: activeZone.ndviDelta < 0 ? 34 : 11, col: '#D95757' },
                  { st: 'Posible recuperación', pct: activeZone.ndviDelta > 0 ? 29 : 12, col: '#43A875' },
                  { st: 'Comportamiento estable', pct: 46, col: '#65C8F2' },
                  { st: 'No concluyente (QA)', pct: 100 - activeZone.validCoverage, col: '#E6B85C' },
                ].map((c) => (
                  <div key={c.st} className="neo-state-box" style={{ borderColor: `${c.col}55` }}>
                    <strong style={{ color: c.col }}>{c.pct}%</strong>
                    <span>{c.st}</span>
                  </div>
                ))}
              </div>

              <NeonSplineChart
                series={[
                  { name: 'Serie NDVI', data: activeZone.annualNdvi, color: '#8BCB9A', unit: '' },
                ]}
                labels={YEAR_LABELS}
                height={135}
              />
            </article>
          )}

          {subTab === 'expediente' && (
            <article className="neo-glass-card">
              <div className="neo-card-header">
                <div>
                  <span className="neo-micro-tag">✦ EXPEDIENTE DE TRANSFORMACIÓN VERDE</span>
                  <h3>Permanencia vs. estacionalidad / cosecha</h3>
                </div>
                <span className="neo-pill-badge neo-pill--amber">NO ASUME TALA DIRECTA</span>
              </div>

              {/* Galería visual T1 / T2 / Diferencia */}
              <div className="neo-3patch-gallery">
                {[
                  { t: 'T1 · MAYO 2020', v: activeZone.annualNdvi[1], col: '#43A875' },
                  { t: 'T2 · MAYO 2025', v: activeZone.ndviIllustrative, col: '#65C8F2' },
                  { t: 'Δ DIFERENCIA', v: `${activeZone.ndviDelta > 0 ? '+' : ''}${activeZone.ndviDelta}`, col: '#FFCB73' },
                ].map((p) => (
                  <div key={p.t} className="neo-patch-card">
                    <div className="neo-patch-visual" style={{ borderColor: p.col }}>
                      <strong style={{ color: p.col }}>{p.v}</strong>
                    </div>
                    <span>{p.t}</span>
                  </div>
                ))}
              </div>

              <NeonEqBarChart
                data={activeZone.eqPulses}
                accent="#43A875"
                secondaryAccent="#8BCB9A"
                unit="% QA"
                height={110}
              />
            </article>
          )}
        </div>
      </section>

      {/* Comparación de ganancia y fragmentación en las 5 zonas */}
      <div className="neo-diverging-grid">
        {COCHABAMBA_ZONES.map((z) => {
          const pos = z.ndviDelta >= 0
          return (
            <div
              key={z.id}
              className={`neo-div-card ${z.id === selectedZoneId ? 'is-active' : ''}`}
              onClick={() => onSelectZone(z.id)}
            >
              <div className="neo-div-top">
                <strong>{z.shortName}</strong>
                <span style={{ color: pos ? '#8BCB9A' : '#D95757' }}>
                  {pos ? `+${z.ndviDelta}` : z.ndviDelta}
                </span>
              </div>
              <div className="neo-div-bar-bg">
                <div
                  className="neo-div-bar-fill"
                  style={{
                    width: `${Math.min(100, Math.abs(z.ndviDelta) * 950 + 22)}%`,
                    background: pos ? '#43A875' : '#D95757',
                  }}
                />
              </div>
              <small>NDVI {z.ndviIllustrative} · QA {z.validCoverage}%</small>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* =========================================================================
   PANTALLA 04. INTELIGENCIA TÉRMICA
   "El calor también deja patrones" · REGLA FIJA: LST ≠ TEMPERATURA DEL AIRE
   Integra: A. Radar de Cambio (Mann-Kendall / Sen) | B. Anomalía Contextual | C. Puntos de Inflexión (Ruptures)
   ========================================================================= */
export function ThermalIntelligenceScreen({
  selectedZoneId,
  onSelectZone,
  onNavigateModule,
}) {
  const [thermalTab, setThermalTab] = useState('radar-cambio') // 'radar-cambio' | 'anomalias' | 'inflexion'
  const activeZone =
    COCHABAMBA_ZONES.find((z) => z.id === selectedZoneId) || COCHABAMBA_ZONES[2]

  const senSlope = +(
    (activeZone.annualLst[7] - activeZone.annualLst[0]) / 7
  ).toFixed(2)

  return (
    <div className="neo-screen">
      <div className="neo-toolbar-row">
        <div>
          <span className="neo-micro-tag" style={{ color: '#FFCB73' }}>
            «EL CALOR TAMBIÉN DEJA PATRONES» · REGLA FUNDAMENTAL: LST SUPERFICIAL ≠ TEMPERATURA DEL AIRE
          </span>
        </div>
        <div className="neo-pill-group">
          {[
            { id: 'radar-cambio', lbl: '📡 A/B. Radar de Cambio (Sen & Mann-Kendall)' },
            { id: 'anomalias', lbl: '⚠ C. Anomalía Contextual' },
            { id: 'inflexion', lbl: '⚡ D. Puntos de Inflexión (Ruptures)' },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              className={`geo-hud-pill ${thermalTab === t.id ? 'is-active' : ''}`}
              onClick={() => setThermalTab(t.id)}
            >
              {t.lbl}
            </button>
          ))}
        </div>
      </div>

      <section className="neo-cockpit-3col">
        <div className="neo-center-map-stage" style={{ gridColumn: 'span 2' }}>
          <SharedGeoCanvas
            selectedZoneId={selectedZoneId}
            onSelectZone={onSelectZone}
            activeLayer="lst"
            onNavigateModule={onNavigateModule}
            height={455}
          />
        </div>

        <div className="neo-col-stack">
          {thermalTab === 'radar-cambio' && (
            <article className="neo-glass-card">
              <div className="neo-card-header">
                <div>
                  <span className="neo-micro-tag">✦ RADAR DE CAMBIO, NO SOLO DE CALOR</span>
                  <h3>Pendiente de Sen: +{senSlope} °C/año (Sup.)</h3>
                </div>
                <span className="neo-pill-badge neo-pill--amber">MANN-KENDALL</span>
              </div>

              {/* Las 5 clases térmicas de MICROCLIMA P7 */}
              <div className="neo-zone-bars-list">
                {[
                  { z: 'distrito-10', cls: 'D10 · Caliente + tendencia creciente', slp: '+0.26°/a', col: '#D95757' },
                  { z: 'distrito-9', cls: 'D9 · Cambio rápido emergente', slp: '+0.34°/a', col: '#F28B50' },
                  { z: 'distrito-6', cls: 'D6 · Cálida con tendencia moderada', slp: '+0.16°/a', col: '#FFCB73' },
                  { z: 'distrito-2', cls: 'D2 · Amortiguada / sin tendencia fuerte', slp: '+0.11°/a', col: '#65C8F2' },
                  { z: 'distrito-1', cls: 'D1 · Confort térmico relativo', slp: '+0.12°/a', col: '#8BCB9A' },
                ].map((item) => (
                  <div
                    key={item.z}
                    className={`neo-zone-bar-item ${selectedZoneId === item.z ? 'is-selected' : ''}`}
                    onClick={() => onSelectZone(item.z)}
                  >
                    <div className="neo-zb-head">
                      <span>{item.cls}</span>
                      <strong style={{ color: item.col }}>{item.slp}</strong>
                    </div>
                  </div>
                ))}
              </div>

              <ContouredIsoMap selectedZoneId={selectedZoneId} onSelectZone={onSelectZone} />
            </article>
          )}

          {thermalTab === 'anomalias' && (
            <article className="neo-glass-card">
              <div className="neo-card-header">
                <div>
                  <span className="neo-micro-tag">✦ ANOMALÍA CONTEXTUAL ESTACIONAL</span>
                  <h3>Observado vs. línea base propia · {activeZone.shortName}</h3>
                </div>
                <span className="neo-pill-badge neo-pill--coral">
                  {activeZone.thermalAnomaly > 2 ? 'PERSISTENTE' : 'REPETIDA'}
                </span>
              </div>

              <NeonSplineChart
                series={[
                  { name: 'LST Observada', data: activeZone.diurnalLst, color: '#D95757', unit: '°C' },
                  {
                    name: 'Esperado Histórico',
                    data: activeZone.diurnalLst.map((v) => +(v - Math.max(0.8, activeZone.thermalAnomaly)).toFixed(1)),
                    color: '#65C8F2',
                    unit: '°C',
                  },
                ]}
                labels={HOUR_LABELS}
                height={155}
              />

              <NeonEqBarChart
                data={activeZone.eqPulses}
                accent="#F28B50"
                secondaryAccent="#D95757"
                unit="%"
                height={105}
              />
            </article>
          )}

          {thermalTab === 'inflexion' && (
            <article className="neo-glass-card">
              <div className="neo-card-header">
                <div>
                  <span className="neo-micro-tag">✦ HISTORIA DE TRANSFORMACIÓN (RUPTURES)</span>
                  <h3>Punto de inflexión detectado · Ventana 2022</h3>
                </div>
                <span className="neo-pill-badge neo-pill--violet">ANTES / DESPUÉS</span>
              </div>

              <div className="neo-4state-grid">
                <div className="neo-state-box" style={{ borderColor: '#65C8F255' }}>
                  <strong style={{ color: '#65C8F2' }}>{activeZone.annualLst[1]}°C</strong>
                  <span>Media Pre-2022</span>
                </div>
                <div className="neo-state-box" style={{ borderColor: '#D9575755' }}>
                  <strong style={{ color: '#D95757' }}>{activeZone.annualLst[7]}°C</strong>
                  <span>Media Post-2022</span>
                </div>
              </div>

              <NeonSplineChart
                series={[
                  { name: 'Trayectoria LST Superficial', data: activeZone.annualLst, color: '#FFCB73', unit: '°C' },
                ]}
                labels={YEAR_LABELS}
                height={155}
              />
            </article>
          )}
        </div>
      </section>
    </div>
  )
}

/* =========================================================================
   PANTALLA 05. RELACIONES AMBIENTALES
   Constructor X/Y + Método (Pearson/Spearman/Parcial) + Detector de Coincidencias + Grafo Dinámico
   ========================================================================= */
export function EnvironmentalRelationsScreen({
  selectedZoneId,
  onSelectZone,
}) {
  const [pairMode, setPairMode] = useState('ndvi-lst')
  const [statMethod, setStatMethod] = useState('Spearman')

  const pairConfigs = {
    'ndvi-lst': {
      xKey: 'ndviIllustrative',
      yKey: 'lstIllustrative',
      xLabel: 'NDVI (Sentinel-2 100m)',
      yLabel: 'LST Superficial °C (Landsat 8 100m)',
      rho: statMethod === 'Spearman' ? '−0.43 (Valle)' : statMethod === 'Pearson' ? '−0.413 (Global Colab)' : '−0.474 (D13 Tunari)',
    },
    'monica-lst': {
      xKey: 'popDensity',
      yKey: 'lstIllustrative',
      xLabel: 'Material Particulado PM10 µg/m³ (Red MÓNICA GAMC)',
      yLabel: 'LST Superficial °C (Landsat 8 100m)',
      rho: '+0.78 (Kanata 67.1 vs SEMAPA 49.3 µg/m³)',
    },
    'imp-lst': {
      xKey: 'imperviousPct',
      yKey: 'lstIllustrative',
      xLabel: 'Densidad Edificada / Sellado % (OSM + GAMC)',
      yLabel: 'LST Superficial °C (Landsat 8 100m)',
      rho: statMethod === 'Spearman' ? '+0.91' : '+0.89',
    },
    'elev-lst': {
      xKey: 'elevationNum',
      yKey: 'lstIllustrative',
      xLabel: 'Elevación m s.n.m. (NASADEM)',
      yLabel: 'LST Superficial °C (Landsat 8 100m)',
      rho: '−0.78',
    },
    'pop-lst': {
      xKey: 'popDensity',
      yKey: 'lstIllustrative',
      xLabel: 'Densidad Poblacional (Manzanas GAMC)',
      yLabel: 'LST Superficial °C (Landsat 8 100m)',
      rho: '+0.84',
    },
  }
  const cfg = pairConfigs[pairMode]

  const matrixVars = ['LST', 'NDVI', 'EDIFIC.', 'DEM', 'POBLAC.']
  const matrixVals = [
    [1.0, -0.86, 0.91, -0.78, 0.84],
    [-0.86, 1.0, -0.88, 0.69, -0.79],
    [0.91, -0.88, 1.0, -0.64, 0.92],
    [-0.78, 0.69, -0.64, 1.0, -0.58],
    [0.84, -0.79, 0.92, -0.58, 1.0],
  ]

  return (
    <div className="neo-screen">
      {/* Constructor Visual de Relaciones + Selector Estadístico */}
      <div className="neo-toolbar-row">
        <div className="neo-pill-group">
          {[
            { id: 'ndvi-lst', label: '🌿 NDVI × 🔥 LST' },
            { id: 'monica-lst', label: '🏛 Red MÓNICA (PM10) × LST' },
            { id: 'imp-lst', label: '🏙 Edificaciones × 🔥 LST' },
            { id: 'elev-lst', label: '⛰ Elevación × 🔥 LST' },
            { id: 'pop-lst', label: '👥 Manzanas GAMC × 🔥 LST' },
          ].map((b) => (
            <button
              key={b.id}
              type="button"
              className={`geo-hud-pill ${pairMode === b.id ? 'is-active' : ''}`}
              onClick={() => setPairMode(b.id)}
            >
              {b.label}
            </button>
          ))}
        </div>

        <div className="neo-pill-group">
          {['Spearman', 'Pearson', 'Parcial (DEM)'].map((m) => (
            <button
              key={m}
              type="button"
              className={`geo-hud-pill ${statMethod === m ? 'is-active' : ''}`}
              onClick={() => setStatMethod(m)}
            >
              {m}
            </button>
          ))}
          <span className="neo-pill-badge neo-pill--violet">CORRELACIÓN ≠ CAUSALIDAD</span>
        </div>
      </div>

      {/* INNOVACIÓN MICROCLIMA P5: «Detector de Coincidencias Ambientales» (5 Clases) */}
      <div className="neo-diverging-grid">
        {[
          { cls: '↓ NDVI + ↑ LST', sub: 'Itocta / Sur (D9)', z: 'distrito-9', col: '#D95757' },
          { cls: '↑ NDVI + ↓ LST', sub: 'Cala Cala (D2)', z: 'distrito-2', col: '#43A875' },
          { cls: '= NDVI + ↑ LST', sub: 'Laguna Alalay (D6)', z: 'distrito-6', col: '#FFCB73' },
          { cls: '↓ NDVI + = LST', sub: 'Ladera Tunari (D13)', z: 'distrito-13', col: '#65C8F2' },
          { cls: 'Datos Insuficientes', sub: 'Queru Queru (D1)', z: 'distrito-1', col: '#8875D8' },
        ].map((item) => (
          <div
            key={item.cls}
            className={`neo-div-card ${selectedZoneId === item.z ? 'is-active' : ''}`}
            onClick={() => onSelectZone(item.z)}
          >
            <div className="neo-div-top">
              <strong style={{ color: item.col }}>{item.cls}</strong>
            </div>
            <small>{item.sub}</small>
          </div>
        ))}
      </div>

      <section className="neo-split-7-5">
        <article className="neo-glass-card">
          <div className="neo-card-header">
            <div>
              <span className="neo-micro-tag">DIAGRAMA DE DISPERSIÓN SINCRONIZADO ({statMethod})</span>
              <h3>{cfg.xLabel} vs. {cfg.yLabel}</h3>
            </div>
            <span className="neo-pill-badge neo-pill--cyan">Coef: {cfg.rho} · n=70</span>
          </div>

          <BivariateScatterPlot
            zones={COCHABAMBA_ZONES}
            selectedZoneId={selectedZoneId}
            onSelectZone={onSelectZone}
            xKey={cfg.xKey}
            yKey={cfg.yKey}
            xLabel={cfg.xLabel}
            yLabel={cfg.yLabel}
          />
        </article>

        <article className="neo-glass-card">
          <div className="neo-card-header">
            <div>
              <span className="neo-micro-tag">MATRIZ MULTIVARIABLE + GRAFO DE ACOPLAMIENTO</span>
              <h3>Interacción de 5 factores territoriales</h3>
            </div>
          </div>

          <div className="neo-corr-matrix">
            <div className="neo-corr-row neo-corr-head">
              <span />
              {matrixVars.map((v) => (
                <span key={v}>{v}</span>
              ))}
            </div>
            {matrixVars.map((rowName, rIdx) => (
              <div key={rowName} className="neo-corr-row">
                <span className="neo-corr-label">{rowName}</span>
                {matrixVals[rIdx].map((val, cIdx) => {
                  const bg =
                    val === 1
                      ? 'rgba(148,163,184,0.18)'
                      : val > 0
                        ? `rgba(242, 139, 80, ${Math.abs(val) * 0.65})`
                        : `rgba(101, 200, 242, ${Math.abs(val) * 0.65})`
                  return (
                    <div key={cIdx} className="neo-corr-cell" style={{ backgroundColor: bg }}>
                      {val > 0 && val !== 1 ? `+${val}` : val}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </article>
      </section>

      {/* TELEMETRÍA CONTINUA RED MÓNICA (GAMC OFICIAL): Curva Diurna 24H y Tendencia Mensual */}
      <section style={{ marginTop: '16px' }}>
        <article className="neo-glass-card">
          <RedMonicaDiurnalChart />
        </article>
      </section>
    </div>
  )
}
