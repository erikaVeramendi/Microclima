import { useState, useId } from 'react'

/* Utilidad para curva suave Catmull-Rom / Cubic Bezier en SVG */
function buildSmoothPath(points) {
  if (!points || points.length === 0) return ''
  if (points.length === 1) return `M ${points[0][0]},${points[0][1]}`
  let d = `M ${points[0][0].toFixed(1)},${points[0][1].toFixed(1)}`
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i === 0 ? 0 : i - 1]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = points[i + 2 < points.length ? i + 2 : i + 1]
    const cp1x = p1[0] + (p2[0] - p0[0]) / 6
    const cp1y = p1[1] + (p2[1] - p0[1]) / 6
    const cp2x = p2[0] - (p3[0] - p1[0]) / 6
    const cp2y = p2[1] - (p3[1] - p1[1]) / 6
    d += ` C ${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`
  }
  return d
}

/* =========================================================================
   1. NEON KPI SPARKLINE CARD (Estilo HUD Futurista, cero texto largo)
   ========================================================================= */
export function NeonKpiCard({
  label,
  value,
  unit = '',
  delta,
  accent = '#38BDF8',
  sparkData = [35, 48, 44, 62, 58, 76, 84],
  icon = '◈',
  onClick,
  active = false,
}) {
  const uid = useId().replace(/:/g, '')
  const min = Math.min(...sparkData)
  const max = Math.max(...sparkData)
  const range = max - min || 1
  const pts = sparkData.map((v, idx) => [
    4 + (idx / (sparkData.length - 1)) * 132,
    30 - ((v - min) / range) * 23,
  ])
  const linePath = buildSmoothPath(pts)
  const areaPath = `${linePath} L 136,34 L 4,34 Z`

  return (
    <div
      className={`hud-kpi-card ${active ? 'is-active' : ''} ${onClick ? 'is-clickable' : ''}`}
      style={{ '--kpi-accent': accent }}
      onClick={onClick}
    >
      <div className="hud-kpi-top">
        <span className="hud-kpi-icon" style={{ color: accent }}>
          {icon}
        </span>
        <span className="hud-kpi-label">{label}</span>
        {delta && (
          <span className="hud-kpi-delta" style={{ color: accent, borderColor: `${accent}44` }}>
            {delta}
          </span>
        )}
      </div>

      <div className="hud-kpi-val-row">
        <strong className="hud-kpi-value">{value}</strong>
        {unit && <span className="hud-kpi-unit">{unit}</span>}
      </div>

      <svg viewBox="0 0 140 35" className="hud-kpi-spark" preserveAspectRatio="none">
        <defs>
          <linearGradient id={`kgrad-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={accent} stopOpacity="0.42" />
            <stop offset="100%" stopColor={accent} stopOpacity="0.0" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill={`url(#kgrad-${uid})`} />
        <path d={linePath} fill="none" stroke={accent} strokeWidth="2.1" strokeLinecap="round" />
        <circle
          cx={pts[pts.length - 1][0]}
          cy={pts[pts.length - 1][1]}
          r="2.8"
          fill="#FFFFFF"
          stroke={accent}
          strokeWidth="2"
        />
      </svg>
    </div>
  )
}

/* =========================================================================
   2. NEON MULTI-SEGMENT DONUT RING
   ========================================================================= */
export function NeonDonutChart({
  segments = [
    { label: 'Dosel Denso', value: 38, color: '#22C55E' },
    { label: 'Ripario / Parque', value: 28, color: '#38BDF8' },
    { label: 'Periurbano', value: 19, color: '#FBBF24' },
    { label: 'Impermeable', value: 15, color: '#F43F5E' },
  ],
  centerValue = '0.61',
  centerLabel = 'NDVI MED',
  size = 148,
}) {
  const [hoverIdx, setHoverIdx] = useState(null)
  const total = segments.reduce((acc, s) => acc + s.value, 0) || 1
  const r = 52
  const c = 2 * Math.PI * r

  const arcs = segments.reduce((acc, seg, idx) => {
    const prevSum = idx === 0 ? 0 : acc[idx - 1].endFraction
    const frac = seg.value / total
    acc.push({
      ...seg,
      frac,
      dash: Math.max(2, frac * c - 3.5),
      offset: -prevSum * c,
      endFraction: prevSum + frac,
    })
    return acc
  }, [])

  const activeSeg = hoverIdx !== null ? arcs[hoverIdx] : null

  return (
    <div className="hud-donut-layout">
      <div className="hud-donut-ring-box" style={{ width: size, height: size }}>
        <svg viewBox="0 0 140 140" className="hud-donut-svg">
          <circle
            cx="70"
            cy="70"
            r={r}
            fill="none"
            stroke="rgba(56, 189, 248, 0.08)"
            strokeWidth="15"
          />
          {arcs.map((arc, idx) => (
            <circle
              key={arc.label}
              cx="70"
              cy="70"
              r={r}
              fill="none"
              stroke={arc.color}
              strokeWidth={hoverIdx === idx ? 18 : 14}
              strokeDasharray={`${arc.dash} ${c}`}
              strokeDashoffset={arc.offset}
              strokeLinecap="round"
              transform="rotate(-90 70 70)"
              style={{
                filter: `drop-shadow(0 0 6px ${arc.color}88)`,
                transition: 'all 0.28s ease',
                cursor: 'pointer',
              }}
              onMouseEnter={() => setHoverIdx(idx)}
              onMouseLeave={() => setHoverIdx(null)}
            />
          ))}
        </svg>
        <div className="hud-donut-center">
          <strong>{activeSeg ? `${Math.round(activeSeg.frac * 100)}%` : centerValue}</strong>
          <span>{activeSeg ? activeSeg.label : centerLabel}</span>
        </div>
      </div>

      <div className="hud-donut-legend">
        {arcs.map((arc, idx) => (
          <div
            key={arc.label}
            className={`hud-donut-leg-row ${hoverIdx === idx ? 'is-hovered' : ''}`}
            onMouseEnter={() => setHoverIdx(idx)}
            onMouseLeave={() => setHoverIdx(null)}
          >
            <span className="hud-leg-dot" style={{ backgroundColor: arc.color, boxShadow: `0 0 8px ${arc.color}` }} />
            <span className="hud-leg-name">{arc.label}</span>
            <strong className="hud-leg-val">{arc.value}%</strong>
          </div>
        ))}
      </div>
    </div>
  )
}

/* =========================================================================
   3. NEON SPLINE AREA OSCILLOSCOPE CHART (1 o 2 series superpuestas)
   ========================================================================= */
export function NeonSplineChart({
  series = [
    {
      name: 'LST Superficial',
      data: [19.8, 25.4, 31.8, 34.4, 32.9, 27.6, 23.4, 20.9],
      color: '#FB923C',
      unit: '°C',
    },
  ],
  labels = ['03H', '06H', '09H', '12H', '15H', '18H', '21H', '24H'],
  height = 148,
}) {
  const uid = useId().replace(/:/g, '')
  const [hoverIndex, setHoverIndex] = useState(Math.floor(labels.length / 2))

  const allVals = series.flatMap((s) => s.data)
  const minVal = Math.min(...allVals)
  const maxVal = Math.max(...allVals)
  const span = maxVal - minVal || 1

  const W = 360
  const H = 135
  const padX = 16
  const padY = 22

  const mapSeriesPoints = (arr) =>
    arr.map((v, i) => [
      padX + (i / Math.max(1, arr.length - 1)) * (W - padX * 2),
      H - padY - ((v - minVal) / span) * (H - padY * 2 - 8),
    ])

  const primaryPts = mapSeriesPoints(series[0].data)
  const activeIdx = Math.min(hoverIndex, primaryPts.length - 1)
  const activePt = primaryPts[activeIdx] || [180, 60]

  return (
    <div className="hud-spline-wrap" style={{ minHeight: height }}>
      <svg viewBox={`0 0 ${W} ${H}`} className="hud-spline-svg">
        <defs>
          {series.map((s, sIdx) => (
            <linearGradient key={s.name} id={`sgrad-${uid}-${sIdx}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={s.color} stopOpacity="0.38" />
              <stop offset="100%" stopColor={s.color} stopOpacity="0.0" />
            </linearGradient>
          ))}
        </defs>

        {/* Líneas guía horizontales tipo osciloscopio */}
        {[0.2, 0.5, 0.8].map((r) => (
          <line
            key={r}
            x1={padX}
            y1={H * r}
            x2={W - padX}
            y2={H * r}
            stroke="rgba(148, 163, 184, 0.1)"
            strokeDasharray="3 4"
          />
        ))}

        {/* Curvas suaves y áreas */}
        {series.map((s, sIdx) => {
          const pts = mapSeriesPoints(s.data)
          const line = buildSmoothPath(pts)
          const area = `${line} L ${pts[pts.length - 1][0]},${H - padY + 4} L ${pts[0][0]},${H - padY + 4} Z`
          return (
            <g key={s.name}>
              <path d={area} fill={`url(#sgrad-${uid}-${sIdx})`} />
              <path
                d={line}
                fill="none"
                stroke={s.color}
                strokeWidth="2.4"
                style={{ filter: `drop-shadow(0 0 6px ${s.color}99)` }}
              />
            </g>
          )
        })}

        {/* Línea vertical de inspección interactiva */}
        <line
          x1={activePt[0]}
          y1={14}
          x2={activePt[0]}
          y2={H - padY + 4}
          stroke="rgba(56, 189, 248, 0.45)"
          strokeWidth="1.2"
          strokeDasharray="2 2"
        />

        {series.map((s) => {
          const pts = mapSeriesPoints(s.data)
          const pt = pts[activeIdx]
          if (!pt) return null
          return (
            <circle
              key={s.name}
              cx={pt[0]}
              cy={pt[1]}
              r="4.2"
              fill="#070B14"
              stroke={s.color}
              strokeWidth="2.5"
            />
          )
        })}

        {/* Callout flotante tipo HUD (como en la imagen de referencia) */}
        <g transform={`translate(${Math.min(W - 94, Math.max(8, activePt[0] - 42))}, 4)`}>
          <rect
            width="86"
            height="20"
            rx="5"
            fill="rgba(10, 18, 36, 0.92)"
            stroke={series[0].color}
            strokeWidth="1"
          />
          <text
            x="43"
            y="13.5"
            textAnchor="middle"
            fill="#F8FAFC"
            fontSize="8.8"
            fontFamily="monospace"
            fontWeight="700"
          >
            {labels[activeIdx]} · {series[0].data[activeIdx]}
            {series[0].unit || ''}
          </text>
        </g>

        {/* Etiquetas eje X + Zonas sensibles al mouse */}
        {labels.map((lbl, idx) => {
          const x = padX + (idx / Math.max(1, labels.length - 1)) * (W - padX * 2)
          return (
            <g key={lbl}>
              <text
                x={x}
                y={H - 5}
                textAnchor="middle"
                fill={idx === activeIdx ? '#38BDF8' : 'rgba(148,163,184,0.65)'}
                fontSize="8"
                fontFamily="monospace"
              >
                {lbl}
              </text>
              <rect
                x={x - W / labels.length / 2}
                y={0}
                width={W / labels.length}
                height={H}
                fill="transparent"
                style={{ cursor: 'crosshair' }}
                onMouseEnter={() => setHoverIndex(idx)}
              />
            </g>
          )
        })}
      </svg>
    </div>
  )
}

/* =========================================================================
   4. NEON EQUALIZER TELEMETRY BAR CHART (24 pulsos luminosos)
   ========================================================================= */
export function NeonEqBarChart({
  data = [64, 71, 78, 85, 89, 92, 87, 84, 90, 94, 91, 86, 82, 88, 93, 96, 91, 87, 85, 91],
  accent = '#22D3EE',
  secondaryAccent = '#22C55E',
  unit = '%',
  height = 118,
}) {
  const uid = useId().replace(/:/g, '')
  const [hoverIdx, setHoverIdx] = useState(Math.floor(data.length * 0.65))
  const max = Math.max(...data, 100)
  const W = 360
  const H = 110
  const barGap = (W - 20) / data.length
  const barW = Math.max(4, barGap * 0.56)

  const hx = 10 + hoverIdx * barGap + barW / 2
  const hVal = data[hoverIdx] ?? data[0]

  return (
    <div className="hud-eq-wrap" style={{ minHeight: height }}>
      <svg viewBox={`0 0 ${W} ${H}`} className="hud-eq-svg">
        <defs>
          <linearGradient id={`eqgrad-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={accent} stopOpacity="1" />
            <stop offset="65%" stopColor={secondaryAccent} stopOpacity="0.72" />
            <stop offset="100%" stopColor={secondaryAccent} stopOpacity="0.14" />
          </linearGradient>
        </defs>

        <line x1="10" y1={H - 12} x2={W - 10} y2={H - 12} stroke="rgba(148,163,184,0.16)" />

        {data.map((val, i) => {
          const bh = Math.max(8, (val / max) * (H - 36))
          const x = 10 + i * barGap
          const y = H - 12 - bh
          const isHot = i === hoverIdx
          return (
            <g key={i} onMouseEnter={() => setHoverIdx(i)} style={{ cursor: 'pointer' }}>
              <rect
                x={x}
                y={22}
                width={barW}
                height={H - 34}
                rx={barW / 2}
                fill="rgba(30, 41, 59, 0.36)"
              />
              <rect
                x={x}
                y={y}
                width={barW}
                height={bh}
                rx={barW / 2}
                fill={isHot ? '#FFFFFF' : `url(#eqgrad-${uid})`}
                style={
                  isHot
                    ? { filter: `drop-shadow(0 0 8px ${accent})` }
                    : undefined
                }
              />
            </g>
          )
        })}

        {/* Etiqueta flotante del pico seleccionado */}
        <g transform={`translate(${Math.min(W - 68, Math.max(6, hx - 30))}, 2)`}>
          <rect
            width="60"
            height="17"
            rx="4"
            fill="rgba(10, 18, 36, 0.94)"
            stroke={accent}
            strokeWidth="1"
          />
          <text
            x="30"
            y="11.5"
            textAnchor="middle"
            fill="#F8FAFC"
            fontSize="8.5"
            fontFamily="monospace"
            fontWeight="700"
          >
            T{hoverIdx + 1} · {hVal}
            {unit}
          </text>
        </g>
      </svg>
    </div>
  )
}

/* =========================================================================
   5. CONTOURED ISO-THERMAL CHOROPLETH MAP (Inspirado en panel sup-der de la imagen)
   ========================================================================= */
export function ContouredIsoMap({ selectedZoneId, onSelectZone }) {
  const [hourSlot, setHourSlot] = useState('14H')

  const hourPalettes = {
    '06H': ['#1E3A8A', '#0284C7', '#0D9488', '#38BDF8', '#22C55E'],
    '10H': ['#1D4ED8', '#0EA5E9', '#EAB308', '#F97316', '#EA580C'],
    '14H': ['#0284C7', '#06B6D4', '#F59E0B', '#EA580C', '#DC2626'],
    '18H': ['#1E40AF', '#0284C7', '#D97706', '#EA580C', '#B91C1C'],
    '22H': ['#172554', '#1D4ED8', '#0284C7', '#D97706', '#991B1B'],
  }
  const pal = hourPalettes[hourSlot] || hourPalettes['14H']

  return (
    <div className="hud-isomap-box">
      <div className="hud-isomap-stage">
        <svg viewBox="0 0 320 205" className="hud-isomap-svg">
          {/* Contorno exterior orgánico de la cuenca metropolitana de Cochabamba */}
          <path
            d="M 54,28 C 98,12 195,14 248,30 C 276,42 292,78 278,116 C 266,148 258,178 214,188 C 168,196 105,192 66,170 C 32,148 24,104 34,68 C 40,46 44,34 54,28 Z"
            fill={pal[0]}
            stroke="#38BDF8"
            strokeWidth="1.5"
            onClick={() => onSelectZone && onSelectZone('tunari-norte')}
            style={{ cursor: 'pointer' }}
          />
          {/* Banda intermedia fresca Corredor Río Rocha / Pedemonte */}
          <path
            d="M 52,64 C 102,48 205,46 258,66 C 274,88 268,132 236,158 C 194,178 112,176 70,152 C 44,132 38,88 52,64 Z"
            fill={pal[1]}
            stroke="rgba(255,255,255,0.32)"
            strokeWidth="1"
            onClick={() => onSelectZone && onSelectZone('corredor-rocha')}
            style={{ cursor: 'pointer' }}
          />
          {/* Banda cálida transición Valle Hermoso / Sur */}
          <path
            d="M 68,84 C 118,68 204,70 242,92 C 254,114 242,146 204,160 C 158,170 98,162 74,138 C 56,118 56,96 68,84 Z"
            fill={pal[2]}
            stroke="rgba(255,255,255,0.35)"
            strokeWidth="1"
            onClick={() => onSelectZone && onSelectZone('cuenca-alalay')}
            style={{ cursor: 'pointer' }}
          />
          {/* Banda alta emisión Expansión Sur / Itocta */}
          <path
            d="M 88,98 C 132,84 196,86 222,106 C 232,124 216,146 182,152 C 142,156 102,146 88,128 C 78,114 80,104 88,98 Z"
            fill={pal[3]}
            stroke="rgba(255,255,255,0.42)"
            strokeWidth="1"
            onClick={() => onSelectZone && onSelectZone('expansion-sur')}
            style={{ cursor: 'pointer' }}
          />
          {/* Núcleo Isla de Calor Superficial Trama Central / La Cancha */}
          <path
            d="M 114,106 C 146,96 186,98 200,112 C 206,124 192,136 164,139 C 136,141 114,132 109,120 C 106,113 108,109 114,106 Z"
            fill={pal[4]}
            stroke="#FFFFFF"
            strokeWidth={selectedZoneId === 'trama-central' ? '2.2' : '1.1'}
            onClick={() => onSelectZone && onSelectZone('trama-central')}
            style={{ cursor: 'pointer', filter: 'drop-shadow(0 0 10px rgba(239,68,68,0.65))' }}
          />
          {/* Espejo Laguna Alalay (Refugio hídrico al este) */}
          <ellipse
            cx="236"
            cy="128"
            rx="18"
            ry="11"
            fill="#0284C7"
            stroke="#7DD3FC"
            strokeWidth="1.3"
            onClick={() => onSelectZone && onSelectZone('cuenca-alalay')}
            style={{ cursor: 'pointer' }}
          />

          {/* Etiquetas limpias sobre las iso-bandas */}
          <text x="155" y="40" textAnchor="middle" fill="#E0F2FE" fontSize="7.5" fontFamily="monospace" fontWeight="700">
            TUNARI · 24.8°C
          </text>
          <text x="155" y="64" textAnchor="middle" fill="#F0F9FF" fontSize="7.5" fontFamily="monospace">
            RÍO ROCHA · 27.9°C
          </text>
          <text x="156" y="122" textAnchor="middle" fill="#FFFFFF" fontSize="8" fontFamily="monospace" fontWeight="700">
            CENTRO · 34.4°C
          </text>
          <text x="162" y="148" textAnchor="middle" fill="#FEF3C7" fontSize="7" fontFamily="monospace">
            ITOCTA · 33.6°C
          </text>
          <text x="236" y="131" textAnchor="middle" fill="#E0F2FE" fontSize="6.5" fontFamily="monospace">
            ALALAY
          </text>
        </svg>

        {/* Mini leyenda vertical limpia */}
        <div className="hud-iso-legend">
          <span><i style={{ background: '#DC2626' }} /> &gt;34°C</span>
          <span><i style={{ background: '#EA580C' }} /> 32°C</span>
          <span><i style={{ background: '#F59E0B' }} /> 29°C</span>
          <span><i style={{ background: '#06B6D4' }} /> 26°C</span>
          <span><i style={{ background: '#1D4ED8' }} /> &lt;24°C</span>
        </div>
      </div>

      {/* Selector horario diurno/nocturno tipo HUD */}
      <div className="hud-hour-pills">
        {['06H', '10H', '14H', '18H', '22H'].map((h) => (
          <button
            key={h}
            type="button"
            className={`hud-hour-btn ${hourSlot === h ? 'is-active' : ''}`}
            onClick={() => setHourSlot(h)}
          >
            {h}
          </button>
        ))}
        <span className="hud-iso-tag">LST ≠ AIRE</span>
      </div>
    </div>
  )
}

/* =========================================================================
   6. SATELLITE PATCH STRIP & MICRO-SENSOR TELEMETRY (Abajo-Izq en imagen ref)
   ========================================================================= */
export function SatellitePatchStrip({ zone }) {
  return (
    <div className="hud-satpatch-row">
      {/* Mini mosaico satelital multiespectral */}
      <div className="hud-satpatch-thumb">
        <svg viewBox="0 0 80 80" className="hud-satpatch-svg">
          <rect width="80" height="80" fill="#0B1526" />
          {/* Trama urbana satelital */}
          {[12, 24, 36, 48, 60, 70].map((p) => (
            <g key={p}>
              <line x1={p} y1="0" x2={p} y2="80" stroke="rgba(148,163,184,0.16)" strokeWidth="1" />
              <line x1="0" y1={p} x2="80" y2={p} stroke="rgba(148,163,184,0.16)" strokeWidth="1" />
            </g>
          ))}
          {/* Parches espectrales verdes y térmicos */}
          <circle cx="26" cy="28" r="16" fill="rgba(34, 197, 94, 0.35)" />
          <circle cx="54" cy="52" r="18" fill="rgba(249, 115, 22, 0.38)" />
          <path d="M 0,42 Q 36,34 80,46" fill="none" stroke="#38BDF8" strokeWidth="2.2" />
          <circle cx="40" cy="40" r="11" fill="none" stroke="#38BDF8" strokeDasharray="3 2" />
          <circle cx="40" cy="40" r="2.5" fill="#22C55E" />
        </svg>
        <span className="hud-patch-badge">S2 · 10m</span>
      </div>

      {/* Micro-telemetría atmosférica/superficial limpia */}
      <div className="hud-micro-telemetry">
        <div className="hud-micro-head">
          <strong>{zone?.shortName || 'Valle Central'}</strong>
          <span>PASS L9/S2</span>
        </div>
        <div className="hud-micro-4grid">
          <div className="hud-micro-cell">
            <span style={{ color: '#FBBF24' }}>☀ RAD</span>
            <strong>892 W/m²</strong>
          </div>
          <div className="hud-micro-cell">
            <span style={{ color: '#FB923C' }}>🌡 LST</span>
            <strong>{zone?.lstIllustrative ?? 31.2}°C</strong>
          </div>
          <div className="hud-micro-cell">
            <span style={{ color: '#38BDF8' }}>💧 HUM</span>
            <strong>{zone?.moistureIdx ?? 54}%</strong>
          </div>
          <div className="hud-micro-cell">
            <span style={{ color: '#22C55E' }}>🌿 NDVI</span>
            <strong>{zone?.ndviIllustrative ?? 0.44}</strong>
          </div>
        </div>
      </div>
    </div>
  )
}

/* =========================================================================
   7. NEON 5-AXIS SPIDER RADAR POLYGON
   ========================================================================= */
export function NeonRadarChart({
  metrics = [79, 48, 92, 54, 62],
  baseline = [55, 65, 85, 55, 70],
  axes = ['VERDOR', 'LST', 'COBERTURA', 'ALTITUD', 'URBANO'],
  accent = '#38BDF8',
}) {
  const cx = 110
  const cy = 98
  const maxR = 68

  const toCoords = (vals) =>
    vals.map((v, i) => {
      const angle = -Math.PI / 2 + (i * 2 * Math.PI) / vals.length
      const r = (v / 100) * maxR
      return [cx + Math.cos(angle) * r, cy + Math.sin(angle) * r]
    })

  const polyPts = toCoords(metrics)
  const basePts = toCoords(baseline)

  return (
    <svg viewBox="0 0 220 196" className="hud-radar-svg">
      {[0.33, 0.66, 1].map((lvl) => (
        <polygon
          key={lvl}
          points={axes
            .map((_, i) => {
              const a = -Math.PI / 2 + (i * 2 * Math.PI) / axes.length
              return `${(cx + Math.cos(a) * maxR * lvl).toFixed(1)},${(cy + Math.sin(a) * maxR * lvl).toFixed(1)}`
            })
            .join(' ')}
          fill="none"
          stroke="rgba(148, 163, 184, 0.16)"
          strokeDasharray={lvl === 0.66 ? '3 3' : undefined}
        />
      ))}

      {axes.map((lbl, i) => {
        const a = -Math.PI / 2 + (i * 2 * Math.PI) / axes.length
        const ex = cx + Math.cos(a) * maxR
        const ey = cy + Math.sin(a) * maxR
        const lx = cx + Math.cos(a) * (maxR + 18)
        const ly = cy + Math.sin(a) * (maxR + 14)
        return (
          <g key={lbl}>
            <line x1={cx} y1={cy} x2={ex} y2={ey} stroke="rgba(148,163,184,0.14)" />
            <text
              x={lx}
              y={ly + 3}
              textAnchor="middle"
              fill="#94A3B8"
              fontSize="7.5"
              fontFamily="monospace"
            >
              {lbl}
            </text>
          </g>
        )
      })}

      {/* Polígono promedio del valle */}
      <polygon
        points={basePts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ')}
        fill="rgba(167, 139, 250, 0.1)"
        stroke="rgba(167, 139, 250, 0.55)"
        strokeWidth="1.3"
        strokeDasharray="3 3"
      />

      {/* Polígono activo luminoso */}
      <polygon
        points={polyPts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ')}
        fill={`${accent}30`}
        stroke={accent}
        strokeWidth="2.2"
        style={{ filter: `drop-shadow(0 0 8px ${accent}88)` }}
      />

      {polyPts.map((p, i) => (
        <circle key={i} cx={p[0]} cy={p[1]} r="3.6" fill="#FFFFFF" stroke={accent} strokeWidth="2" />
      ))}
    </svg>
  )
}

/* =========================================================================
   8. BIVARIATE SCATTER & DENSITY CONTOUR STUDIO
   ========================================================================= */
export function BivariateScatterPlot({
  zones,
  selectedZoneId,
  onSelectZone,
  xKey = 'ndviIllustrative',
  yKey = 'lstIllustrative',
  xLabel = 'NDVI (Vigor Vegetal)',
  yLabel = 'LST Superficial (°C)',
}) {
  // Generamos nube satelital sintética realista alrededor de cada zona de Cochabamba
  const sampleCloud = zones.flatMap((z, zIdx) =>
    Array.from({ length: 14 }, (_, k) => {
      const dx = Math.sin(zIdx * 7 + k * 2.1) * (xKey === 'ndviIllustrative' ? 0.055 : 8)
      const dy = Math.cos(zIdx * 5 + k * 1.7) * 1.15
      return {
        zoneId: z.id,
        color: z.color,
        x: z[xKey] + dx,
        y: z[yKey] + dy,
      }
    })
  )

  const xs = sampleCloud.map((p) => p.x)
  const ys = sampleCloud.map((p) => p.y)
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minY = Math.min(...ys) - 0.8
  const maxY = Math.max(...ys) + 0.8

  const W = 420
  const H = 225
  const padL = 38
  const padR = 18
  const padT = 18
  const padB = 28

  const mapX = (v) => padL + ((v - minX) / (maxX - minX || 1)) * (W - padL - padR)
  const mapY = (v) => H - padB - ((v - minY) / (maxY - minY || 1)) * (H - padT - padB)

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="hud-scatter-svg">
      {/* Grid */}
      {[0.25, 0.5, 0.75].map((g) => (
        <g key={g}>
          <line
            x1={padL}
            y1={padT + g * (H - padT - padB)}
            x2={W - padR}
            y2={padT + g * (H - padT - padB)}
            stroke="rgba(148,163,184,0.12)"
            strokeDasharray="3 3"
          />
          <line
            x1={padL + g * (W - padL - padR)}
            y1={padT}
            x2={padL + g * (W - padL - padR)}
            y2={H - padB}
            stroke="rgba(148,163,184,0.12)"
            strokeDasharray="3 3"
          />
        </g>
      ))}

      {/* Banda de tendencia no paramétrica */}
      <path
        d={
          xKey === 'ndviIllustrative'
            ? `M ${padL + 10},${padT + 18} Q ${W * 0.52},${H * 0.48} ${W - padR - 8},${H - padB - 16}`
            : `M ${padL + 10},${H - padB - 18} Q ${W * 0.52},${H * 0.46} ${W - padR - 8},${padT + 18}`
        }
        fill="none"
        stroke="#38BDF8"
        strokeWidth="2"
        strokeDasharray="5 4"
        opacity="0.75"
      />

      {/* Nube de píxeles muestreados */}
      {sampleCloud.map((pt, i) => {
        const isSel = pt.zoneId === selectedZoneId
        return (
          <circle
            key={i}
            cx={mapX(pt.x)}
            cy={mapY(pt.y)}
            r={isSel ? 4.2 : 2.8}
            fill={pt.color}
            opacity={isSel ? 0.92 : 0.42}
            onClick={() => onSelectZone && onSelectZone(pt.zoneId)}
            style={{ cursor: 'pointer' }}
          />
        )
      })}

      {/* Centroides luminosos de las 5 macro-zonas */}
      {zones.map((z) => {
        const cx = mapX(z[xKey])
        const cy = mapY(z[yKey])
        const isSel = z.id === selectedZoneId
        return (
          <g
            key={z.id}
            onClick={() => onSelectZone && onSelectZone(z.id)}
            style={{ cursor: 'pointer' }}
          >
            {isSel && (
              <circle
                cx={cx}
                cy={cy}
                r="13"
                fill="none"
                stroke="#38BDF8"
                strokeWidth="1.6"
                strokeDasharray="3 2"
              />
            )}
            <circle
              cx={cx}
              cy={cy}
              r={isSel ? 7.5 : 5.8}
              fill={z.color}
              stroke="#FFFFFF"
              strokeWidth="2"
              style={{ filter: `drop-shadow(0 0 8px ${z.color})` }}
            />
            <text
              x={cx}
              y={cy - 10}
              textAnchor="middle"
              fill="#F8FAFC"
              fontSize="7.8"
              fontFamily="monospace"
              fontWeight="700"
            >
              {z.shortName}
            </text>
          </g>
        )
      })}

      {/* Etiquetas ejes */}
      <text x={W / 2} y={H - 6} textAnchor="middle" fill="#94A3B8" fontSize="8.5" fontFamily="monospace">
        {xLabel}
      </text>
      <text
        x="11"
        y={H / 2}
        textAnchor="middle"
        fill="#94A3B8"
        fontSize="8.5"
        fontFamily="monospace"
        transform={`rotate(-90 11 ${H / 2})`}
      >
        {yLabel}
      </text>
    </svg>
  )
}

