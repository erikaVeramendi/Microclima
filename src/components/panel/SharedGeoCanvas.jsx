import { useState, useEffect, useRef } from 'react'
import { COCHABAMBA_ZONES, RED_MONICA_STATIONS, GAMC_WMS_CONFIG } from '../../data/internalPanelData'
import { COCHABAMBA_DISTRICT_SVGS } from '../../data/cochabambaDistrictsSvg'

/* Focos multiespectrales para renderizado bioluminiscente en HTML5 Canvas */
const HEAT_NODES = [
  // Cordillera del Tunari & Bosques Norte (Verde intenso - D13)
  { x: 160, y: 82, r: 78, type: 'veg', intensity: 0.94 },
  { x: 295, y: 76, r: 92, type: 'veg', intensity: 0.96 },
  { x: 445, y: 84, r: 86, type: 'veg', intensity: 0.88 },
  { x: 585, y: 94, r: 74, type: 'veg', intensity: 0.82 },
  // Corredor Río Rocha, Tupuraya, Cala Cala (D1, D2, D11)
  { x: 245, y: 194, r: 64, type: 'veg', intensity: 0.85 },
  { x: 360, y: 188, r: 68, type: 'veg', intensity: 0.89 },
  { x: 460, y: 195, r: 62, type: 'veg', intensity: 0.81 },
  { x: 545, y: 186, r: 58, type: 'veg', intensity: 0.78 },
  // Casco Central y La Cancha (D10, D6)
  { x: 285, y: 282, r: 88, type: 'heat', intensity: 0.96 },
  { x: 338, y: 296, r: 82, type: 'heat', intensity: 0.94 },
  { x: 235, y: 298, r: 64, type: 'heat', intensity: 0.82 },
  // Entorno Laguna Alalay e Industrial (D5)
  { x: 472, y: 314, r: 58, type: 'water', intensity: 0.92 },
  { x: 422, y: 332, r: 64, type: 'heat', intensity: 0.88 },
  // Expansión Sur y K'ara K'ara (D15, D8, D9)
  { x: 385, y: 418, r: 84, type: 'heat', intensity: 0.96 },
  { x: 445, y: 448, r: 92, type: 'heat', intensity: 0.98 },
  { x: 325, y: 432, r: 76, type: 'heat', intensity: 0.88 },
]

/* Polígonos de equipamientos urbanos (GAMC WMS simulado) */
const URBAN_PARCELS = [
  { pts: '215,182 278,176 284,218 218,224', fill: 'rgba(34,197,94,0.34)', stroke: '#4ADE80' },
  { pts: '342,178 422,174 428,216 346,220', fill: 'rgba(34,197,94,0.38)', stroke: '#4ADE80' },
  { pts: '278,284 348,280 354,336 282,340', fill: 'rgba(239,68,68,0.34)', stroke: '#F87171' },
  { pts: '366,296 444,292 448,354 370,358', fill: 'rgba(168,85,247,0.32)', stroke: '#C084FC' },
  { pts: '412,436 496,432 504,492 418,496', fill: 'rgba(239,68,68,0.4)', stroke: '#FB7185' },
  { pts: '338,438 412,434 418,494 342,498', fill: 'rgba(245,158,11,0.34)', stroke: '#FBBF24' },
]

const YEARS = [2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026]

export function SharedGeoCanvas({
  selectedZoneId,
  onSelectZone,
  activeLayer = 'dual', // 'dual' | 'lst' | 'ndvi' | 'bivariado' | 'monica' | 'areas-verdes' | 'cota2750'
  onLayerChange,
  enableCurtain = false,
  onNavigateModule,
  height = 510,
  compactHud = false,
}) {
  const canvasRef = useRef(null)
  const [internalLayer, setInternalLayer] = useState(activeLayer)
  const [zoom, setZoom] = useState(1)
  const [curtainPos, setCurtainPos] = useState(50)
  const [isSplitActive, setIsSplitActive] = useState(enableCurtain)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [activeTool, setActiveTool] = useState('select')
  const [yearIdx, setYearIdx] = useState(YEARS.length - 1)
  const [isPlaying, setIsPlaying] = useState(false)

  const currentLayer = onLayerChange ? activeLayer : internalLayer
  const handleSwitchLayer = (id) => {
    setInternalLayer(id)
    if (onLayerChange) onLayerChange(id)
  }

  // Find active zone or default to Distrito 15 or Distrito 1
  const selectedZone =
    COCHABAMBA_ZONES.find((z) => z.id === selectedZoneId) ||
    COCHABAMBA_ZONES[0]

  /* Animación del reproductor temporal 2019 -> 2026 */
  useEffect(() => {
    if (!isPlaying) return undefined
    const timer = setInterval(() => {
      setYearIdx((prev) => (prev + 1) % YEARS.length)
    }, 1100)
    return () => clearInterval(timer)
  }, [isPlaying])

  /* Renderizado satelital multiespectral de alta densidad en HTML5 Canvas */
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const W = 740
    const H = 560
    ctx.clearRect(0, 0, W, H)

    // 1. Fondo orbital profundo
    const bgGrad = ctx.createRadialGradient(370, 280, 40, 370, 280, 460)
    bgGrad.addColorStop(0, '#0B172A')
    bgGrad.addColorStop(0.65, '#070E1B')
    bgGrad.addColorStop(1, '#040811')
    ctx.fillStyle = bgGrad
    ctx.fillRect(0, 0, W, H)

    // 2. Relieve sombreado Cordillera del Tunari (Norte)
    for (let ridge = 0; ridge < 7; ridge++) {
      ctx.beginPath()
      const baseY = 24 + ridge * 18
      ctx.moveTo(0, baseY)
      for (let x = 0; x <= W; x += 28) {
        const wave =
          Math.sin(x * 0.014 + ridge * 0.9) * 12 +
          Math.cos(x * 0.032 - ridge) * 6
        ctx.lineTo(x, baseY + wave)
      }
      ctx.strokeStyle =
        currentLayer === 'cota2750'
          ? `rgba(56, 189, 248, ${0.4 - ridge * 0.04})`
          : `rgba(100, 180, 220, ${0.12 - ridge * 0.012})`
      ctx.lineWidth = currentLayer === 'cota2750' ? 1.6 : 1
      ctx.stroke()
    }

    // 3. Malla urbana satelital de Cochabamba
    ctx.save()
    ctx.strokeStyle = 'rgba(148, 183, 218, 0.07)'
    ctx.lineWidth = 0.8
    for (let x = 60; x < 680; x += 18) {
      ctx.beginPath()
      ctx.moveTo(x + (x % 36 === 0 ? -4 : 3), 140)
      ctx.lineTo(x, 520)
      ctx.stroke()
    }
    for (let y = 150; y < 520; y += 16) {
      ctx.beginPath()
      ctx.moveTo(55, y)
      ctx.lineTo(675, y + Math.sin(y * 0.03) * 6)
      ctx.stroke()
    }

    // Avenidas estructurales (Blanco Galindo, América, Circunvalación, Petrolera, Panamericana)
    ctx.strokeStyle = 'rgba(125, 211, 252, 0.2)'
    ctx.lineWidth = 1.5
    const avenues = [
      [[30, 295], [310, 305], [680, 345]],
      [[85, 190], [375, 195], [665, 210]],
      [[305, 130], [295, 325], [345, 535]],
      [[140, 250], [285, 245], [460, 260], [635, 300]],
    ]
    avenues.forEach((pts) => {
      ctx.beginPath()
      ctx.moveTo(pts[0][0], pts[0][1])
      pts.slice(1).forEach((p) => ctx.lineTo(p[0], p[1]))
      ctx.stroke()
    })
    ctx.restore()

    // 4. Factor temporal dinámico
    const timeFactor = 0.86 + (yearIdx / (YEARS.length - 1)) * 0.20

    // 5. Renderizado Bioluminiscente Multiespectral
    ctx.save()
    ctx.globalCompositeOperation = 'screen'
    HEAT_NODES.forEach((node) => {
      const showVeg = currentLayer === 'dual' || currentLayer === 'ndvi' || currentLayer === 'areas-verdes'
      const showHeat = currentLayer === 'dual' || currentLayer === 'lst' || currentLayer === 'bivariado'

      let cInner = 'rgba(34, 197, 94, 0)'
      let cMid = 'rgba(16, 185, 129, 0)'

      if (node.type === 'veg' && showVeg) {
        const p = node.intensity
        cInner = currentLayer === 'ndvi' ? `rgba(250, 204, 21, ${0.6 * p})` : `rgba(74, 222, 128, ${0.48 * p})`
        cMid = `rgba(16, 185, 129, ${0.34 * p})`
      } else if (node.type === 'heat' && showHeat) {
        const p = Math.min(1, node.intensity * timeFactor)
        cInner = currentLayer === 'lst' ? `rgba(254, 240, 138, ${0.68 * p})` : `rgba(239, 68, 68, ${0.54 * p})`
        cMid = `rgba(249, 115, 22, ${0.36 * p})`
      } else if (node.type === 'water') {
        cInner = 'rgba(56, 189, 248, 0.58)'
        cMid = 'rgba(14, 165, 233, 0.26)'
      }

      const grad = ctx.createRadialGradient(node.x, node.y, 4, node.x, node.y, node.r)
      grad.addColorStop(0, cInner)
      grad.addColorStop(0.48, cMid)
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)')
      ctx.fillStyle = grad
      ctx.beginPath()
      ctx.arc(node.x, node.y, node.r, 0, Math.PI * 2)
      ctx.fill()
    })
    ctx.restore()

    // 6. Micro-píxeles activos
    ctx.fillStyle = 'rgba(226, 232, 240, 0.25)'
    for (let i = 0; i < 150; i++) {
      const px = 75 + ((i * 71) % 590)
      const py = 155 + ((i * 93) % 355)
      ctx.fillRect(px, py, 1.4, 1.4)
    }
  }, [currentLayer, yearIdx])

  const officialDistricts = COCHABAMBA_ZONES.filter((z) => z.number && z.number <= 15)

  return (
    <div
      className={`shared-geo-wrapper ${isFullscreen ? 'is-fullscreen' : ''}`}
      style={{ height: isFullscreen ? '100vh' : `${height}px` }}
    >
      {/* Píldoras flotantes limpias de capas (Arriba Izquierda) */}
      <div className="geo-hud-top-bar">
        <div className="geo-hud-layers">
          {[
            { id: 'dual', label: '◈ Fusión 100m' },
            { id: 'lst', label: '🔥 LST Térmico (Landsat 8)' },
            { id: 'ndvi', label: '🌿 NDVI Clorofila (Sentinel-2)' },
            { id: 'bivariado', label: '📊 Cuadrantes LST×NDVI' },
            { id: 'monica', label: '🏛 Red MÓNICA (GAMC PM10)' },
            { id: 'areas-verdes', label: '🌳 Áreas Verdes (WMS)' },
            { id: 'cota2750', label: '⛰ Cota 2750 (Tunari)' },
          ].map((l) => (
            <button
              key={l.id}
              type="button"
              className={`geo-hud-pill ${currentLayer === l.id ? 'is-active' : ''}`}
              onClick={() => handleSwitchLayer(l.id)}
            >
              {l.label}
            </button>
          ))}
        </div>

        <div className="geo-hud-actions">
          <button
            type="button"
            className={`geo-hud-pill ${isSplitActive ? 'is-active' : ''}`}
            onClick={() => setIsSplitActive((p) => !p)}
            title="Comparador antes / después T1 vs T2"
          >
            ⇄ T1/T2
          </button>
          <button
            type="button"
            className="geo-hud-pill"
            onClick={() => setIsFullscreen((p) => !p)}
            title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
          >
            {isFullscreen ? '✕' : '⛶'}
          </button>
        </div>
      </div>

      {/* Barra vertical flotante de cristal */}
      <div className="geo-glass-tool-dock" role="toolbar" aria-label="Controles espaciales">
        {[
          { id: 'select', icon: '⊹', tip: 'Foco Zonal' },
          { id: 'polygon', icon: '⬠', tip: 'Polígonos' },
          { id: 'measure', icon: '📏', tip: 'Transecto' },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            className={`geo-dock-btn ${activeTool === t.id ? 'is-active' : ''}`}
            onClick={() => setActiveTool(t.id)}
            title={t.tip}
          >
            {t.icon}
          </button>
        ))}
        <div className="geo-dock-sep" />
        <button
          type="button"
          className="geo-dock-btn"
          onClick={() => setZoom((z) => Math.min(1.42, +(z + 0.12).toFixed(2)))}
          title="Zoom +"
        >
          +
        </button>
        <button
          type="button"
          className="geo-dock-btn"
          onClick={() => setZoom((z) => Math.max(0.9, +(z - 0.12).toFixed(2)))}
          title="Zoom −"
        >
          −
        </button>
        <button
          type="button"
          className="geo-dock-btn"
          onClick={() => setZoom(1)}
          title="Centrar"
        >
          ⌂
        </button>
      </div>

      {/* Escenario híbrido HTML5 Canvas + Vectores SVG Luminosos */}
      <div className="geo-stage-viewport">
        <div
          className="geo-zoom-plane"
          style={{ transform: `scale(${zoom})` }}
        >
          <canvas
            ref={canvasRef}
            width={740}
            height={560}
            className="geo-heatmap-canvas"
          />

          <svg viewBox="0 0 740 560" className="geo-vector-svg">
            <defs>
              <filter id="neonCyanGlow" x="-25%" y="-25%" width="150%" height="150%">
                <feDropShadow dx="0" dy="0" stdDeviation="5" floodColor="#38BDF8" floodOpacity="0.95" />
              </filter>
              <filter id="neonRedGlow" x="-25%" y="-25%" width="150%" height="150%">
                <feDropShadow dx="0" dy="0" stdDeviation="5" floodColor="#EF4444" floodOpacity="0.9" />
              </filter>
              <linearGradient id="rochaGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.3" />
                <stop offset="50%" stopColor="#22D3EE" stopOpacity="0.95" />
                <stop offset="100%" stopColor="#34D399" stopOpacity="0.4" />
              </linearGradient>
            </defs>

            {/* Río Rocha hidrológico */}
            <path
              d="M 690,178 C 610,186 525,206 430,198 C 335,188 240,196 150,214 C 95,224 45,222 10,234"
              fill="none"
              stroke="url(#rochaGrad)"
              strokeWidth="3.8"
              strokeLinecap="round"
            />

            {/* Espejo Laguna Alalay */}
            <path
              d="M 458,304 C 476,294 506,298 514,318 C 520,336 502,354 478,352 C 456,350 444,322 458,304 Z"
              fill="rgba(14, 165, 233, 0.45)"
              stroke="#38BDF8"
              strokeWidth="1.6"
            />

            {/* Cota 2750 Tunari (WMS GAMC) */}
            {(currentLayer === 'cota2750' || currentLayer === 'dual') && (
              <path
                d="M 30,128 C 145,115 285,110 445,118 C 555,124 645,138 720,152"
                fill="none"
                stroke="#38BDF8"
                strokeWidth="2.2"
                strokeDasharray="6 4"
                opacity="0.85"
              />
            )}

            {/* Capas WMS de Áreas Verdes */}
            {(currentLayer === 'areas-verdes' || currentLayer === 'parcelas') &&
              URBAN_PARCELS.map((p, idx) => (
                <polygon
                  key={idx}
                  points={p.pts}
                  fill={p.fill}
                  stroke={p.stroke}
                  strokeWidth="1.3"
                />
              ))}

            {/* Contornos Oficiales de los 15 Distritos de Cochabamba (EPSG:32719 Armonizado) */}
            {officialDistricts.map((zone) => {
              const shape = COCHABAMBA_DISTRICT_SVGS[zone.id]
              if (!shape) return null
              const isSelected = zone.id === selectedZoneId

              let fillColor = 'rgba(15, 23, 42, 0.08)'
              let strokeColor = 'rgba(148, 163, 184, 0.28)'
              let strokeWidth = 1.1

              if (currentLayer === 'lst') {
                const t = Math.max(0, Math.min(1, (zone.lstMean - 19.0) / (29.2 - 19.0)))
                fillColor = `rgba(${Math.round(239 * t + 56 * (1 - t))}, ${Math.round(68 * t + 189 * (1 - t))}, ${Math.round(68 * t + 248 * (1 - t))}, ${isSelected ? 0.38 : 0.22})`
                strokeColor = isSelected ? '#38BDF8' : zone.color
                strokeWidth = isSelected ? 2.6 : 1.3
              } else if (currentLayer === 'ndvi') {
                const v = Math.max(0, Math.min(1, (zone.ndviMean - 0.12) / (0.32 - 0.12)))
                fillColor = `rgba(${Math.round(34 * v + 245 * (1 - v))}, ${Math.round(197 * v + 158 * (1 - v))}, ${Math.round(94 * v + 11 * (1 - v))}, ${isSelected ? 0.38 : 0.22})`
                strokeColor = isSelected ? '#4ADE80' : 'rgba(74, 222, 128, 0.45)'
                strokeWidth = isSelected ? 2.6 : 1.3
              } else if (currentLayer === 'bivariado') {
                if (zone.thermalAnomaly > 1.5 && zone.ndviMean < 0.18) {
                  fillColor = 'rgba(239, 68, 68, 0.36)'
                } else if (zone.thermalAnomaly < -1.5 && zone.ndviMean > 0.25) {
                  fillColor = 'rgba(16, 185, 129, 0.36)'
                } else {
                  fillColor = 'rgba(56, 189, 248, 0.20)'
                }
                strokeColor = isSelected ? '#38BDF8' : 'rgba(148, 163, 184, 0.45)'
                strokeWidth = isSelected ? 2.6 : 1.3
              } else if (isSelected) {
                fillColor = 'rgba(56, 189, 248, 0.18)'
                strokeColor = '#38BDF8'
                strokeWidth = 2.6
              }

              return (
                <g
                  key={zone.id}
                  onClick={() => onSelectZone && onSelectZone(zone.id)}
                  style={{ cursor: 'pointer' }}
                >
                  <path
                    d={shape.path}
                    fill={fillColor}
                    stroke={strokeColor}
                    strokeWidth={strokeWidth}
                    filter={isSelected ? 'url(#neonCyanGlow)' : undefined}
                  />

                  {/* Nodo central de telemetría distrital */}
                  <circle
                    cx={shape.cx}
                    cy={shape.cy}
                    r={isSelected ? 13 : 7}
                    fill="none"
                    stroke={isSelected ? '#38BDF8' : zone.color}
                    strokeWidth="1.2"
                    opacity={isSelected ? 0.95 : 0.45}
                  />
                  <circle
                    cx={shape.cx}
                    cy={shape.cy}
                    r={isSelected ? 4.8 : 3}
                    fill={zone.color}
                    stroke="#FFFFFF"
                    strokeWidth="1.4"
                  />

                  {/* Cápsula de telemetría limpia */}
                  <g transform={`translate(${shape.cx - 44}, ${shape.cy + 9})`}>
                    <rect
                      width="88"
                      height="18"
                      rx="5"
                      fill={isSelected ? 'rgba(8, 20, 42, 0.95)' : 'rgba(7, 13, 26, 0.82)'}
                      stroke={isSelected ? '#38BDF8' : 'rgba(148,163,184,0.3)'}
                      strokeWidth="1"
                    />
                    <text
                      x="44"
                      y="12.5"
                      textAnchor="middle"
                      fill="#F8FAFC"
                      fontSize="7.6"
                      fontFamily="monospace"
                      fontWeight="700"
                    >
                      {zone.shortName.split(' ')[0]} · {zone.lstMean}°
                    </text>
                  </g>
                </g>
              )
            })}

            {/* Estaciones Físico-Terrestres Red MÓNICA (GAMC) */}
            {(currentLayer === 'monica' || currentLayer === 'dual') && (
              <g className="red-monica-markers">
                {/* Estación SEMAPA (Norte) */}
                <g transform="translate(325, 195)" style={{ cursor: 'pointer' }}>
                  <circle r="18" fill="rgba(16, 185, 129, 0.16)" stroke="#10B981" strokeWidth="1" strokeDasharray="3 3">
                    <animate attributeName="r" values="12;22;12" dur="3s" repeatCount="indefinite" />
                  </circle>
                  <circle r="6" fill="#10B981" stroke="#FFFFFF" strokeWidth="2" />
                  <rect x="10" y="-12" width="138" height="25" rx="6" fill="rgba(6, 15, 30, 0.94)" stroke="#10B981" strokeWidth="1" />
                  <text x="18" y="0" fill="#E2E8F0" fontSize="8" fontWeight="700">MÓNICA SEMAPA · Norte</text>
                  <text x="18" y="9" fill="#34D399" fontSize="7.2" fontFamily="monospace">PM10: 49.3 µg/m³ · 71k reg</text>
                </g>

                {/* Estación KANATA (Sur) */}
                <g transform="translate(345, 375)" style={{ cursor: 'pointer' }}>
                  <circle r="18" fill="rgba(239, 68, 68, 0.16)" stroke="#EF4444" strokeWidth="1" strokeDasharray="3 3">
                    <animate attributeName="r" values="12;22;12" dur="3s" repeatCount="indefinite" />
                  </circle>
                  <circle r="6" fill="#EF4444" stroke="#FFFFFF" strokeWidth="2" />
                  <rect x="10" y="-12" width="138" height="25" rx="6" fill="rgba(6, 15, 30, 0.94)" stroke="#EF4444" strokeWidth="1" />
                  <text x="18" y="0" fill="#E2E8F0" fontSize="8" fontWeight="700">MÓNICA KANATA · Sur</text>
                  <text x="18" y="9" fill="#F87171" fontSize="7.2" fontFamily="monospace">PM10: 67.1 µg/m³ (+36%)</text>
                </g>
              </g>
            )}

            {/* Herramienta Transecto Espacial */}
            {activeTool === 'measure' && (
              <g>
                <line
                  x1="445"
                  y1="119"
                  x2="525"
                  y2="414"
                  stroke="#FBBF24"
                  strokeWidth="2.2"
                  strokeDasharray="6 4"
                />
                <rect
                  x="450"
                  y="255"
                  width="132"
                  height="22"
                  rx="5"
                  fill="rgba(10,16,30,0.94)"
                  stroke="#FBBF24"
                />
                <text
                  x="516"
                  y="269"
                  textAnchor="middle"
                  fill="#FDE68A"
                  fontSize="8.4"
                  fontFamily="monospace"
                >
                  Tunari → K'ara: ΔLST +10.1°C
                </text>
              </g>
            )}

            {/* Cortina Antes / Después T1 vs T2 */}
            {isSplitActive && (
              <g>
                <rect
                  x="0"
                  y="0"
                  width={(curtainPos / 100) * 740}
                  height="560"
                  fill="rgba(14, 165, 233, 0.08)"
                />
                <line
                  x1={(curtainPos / 100) * 740}
                  y1="0"
                  x2={(curtainPos / 100) * 740}
                  y2="560"
                  stroke="#38BDF8"
                  strokeWidth="2.5"
                />
                <circle
                  cx={(curtainPos / 100) * 740}
                  cy="280"
                  r="13"
                  fill="#081428"
                  stroke="#38BDF8"
                  strokeWidth="2"
                />
                <text
                  x={(curtainPos / 100) * 740}
                  y="283.5"
                  textAnchor="middle"
                  fill="#38BDF8"
                  fontSize="10"
                  fontFamily="monospace"
                >
                  ⇄
                </text>
              </g>
            )}
          </svg>
        </div>
      </div>

      {/* Control deslizante de Cortina si está activa */}
      {isSplitActive && (
        <div className="geo-curtain-floating">
          <span>T1 · 2019</span>
          <input
            type="range"
            min="10"
            max="90"
            value={curtainPos}
            onChange={(e) => setCurtainPos(Number(e.target.value))}
          />
          <span>T2 · {YEARS[yearIdx]}</span>
        </div>
      )}

      {/* Badge WMS Oficial cuando se activan capas del GAMC */}
      {(currentLayer === 'areas-verdes' || currentLayer === 'cota2750' || currentLayer === 'monica') && (
        <div className="geo-wms-indicator-badge">
          <span className="wms-live-dot" />
          <span>GAMC WMS 1.1.1: {currentLayer === 'areas-verdes' ? 'Áreas Verdes (UUID: 47360ddc)' : currentLayer === 'cota2750' ? 'Cota 2750 Tunari (UUID: 297cefa4)' : 'Red MÓNICA Terrestre (DIMA)'}</span>
          <small>Key: 1a3d2d9c · HTTP 200 OK</small>
        </div>
      )}

      {/* Mini HUD Flotante de Zona Activa */}
      {!compactHud && (
        <aside className="geo-mini-zone-hud">
          <div className="geo-mini-head">
            <span className="geo-live-dot" style={{ backgroundColor: selectedZone.color }} />
            <strong>{selectedZone.shortName || selectedZone.name}</strong>
            <span className="geo-elev-pill">{selectedZone.elevation}</span>
          </div>

          <div className="geo-mini-bars">
            <div className="geo-mini-bar-row">
              <span>LST SUP.</span>
              <div className="geo-bar-track">
                <div
                  className="geo-bar-fill"
                  style={{
                    width: `${Math.min(100, (selectedZone.lstMean / 36) * 100)}%`,
                    background: 'linear-gradient(90deg, #F59E0B, #EF4444)',
                  }}
                />
              </div>
              <strong style={{ color: '#FB923C' }}>{selectedZone.lstMean}°C</strong>
            </div>

            <div className="geo-mini-bar-row">
              <span>NDVI</span>
              <div className="geo-bar-track">
                <div
                  className="geo-bar-fill"
                  style={{
                    width: `${Math.min(100, selectedZone.ndviMean * 100 * 2.5)}%`,
                    background: 'linear-gradient(90deg, #10B981, #4ADE80)',
                  }}
                />
              </div>
              <strong style={{ color: '#4ADE80' }}>{selectedZone.ndviMean}</strong>
            </div>

            <div className="geo-mini-bar-row">
              <span>CORR. r</span>
              <div className="geo-bar-track">
                <div
                  className="geo-bar-fill"
                  style={{
                    width: `${Math.abs(selectedZone.correlacionPearson || 0.4) * 100}%`,
                    background: 'linear-gradient(90deg, #0284C7, #38BDF8)',
                  }}
                />
              </div>
              <strong style={{ color: '#38BDF8' }}>{selectedZone.correlacionPearson}</strong>
            </div>
          </div>

          <div className="geo-mini-meta-line">
            <span>Píxeles: <b>{selectedZone.validPixels}</b></span>
            <span>FDR p: <b>{selectedZone.valorPFDR}</b></span>
          </div>

          {onNavigateModule && (
            <div className="geo-mini-jumps">
              <button type="button" onClick={() => onNavigateModule('inteligencia-termica')}>
                Térmico →
              </button>
              <button type="button" onClick={() => onNavigateModule('inteligencia-vegetacion')}>
                NDVI →
              </button>
              <button type="button" onClick={() => onNavigateModule('planificacion-escenarios')}>
                Simular →
              </button>
            </div>
          )}
        </aside>
      )}

      {/* Scrubber Temporal Animado Inferior */}
      <div className="geo-timeline-dock">
        <button
          type="button"
          className="geo-play-btn"
          onClick={() => setIsPlaying((p) => !p)}
          title={isPlaying ? 'Pausar serie orbital' : 'Reproducir evolución multianual'}
        >
          {isPlaying ? '❚❚' : '▶'}
        </button>

        <div className="geo-timeline-track-wrap">
          <input
            type="range"
            min={0}
            max={YEARS.length - 1}
            value={yearIdx}
            onChange={(e) => setYearIdx(Number(e.target.value))}
            className="geo-timeline-slider"
          />
          <div className="geo-timeline-ticks">
            {YEARS.map((yr, i) => (
              <span
                key={yr}
                className={i === yearIdx ? 'is-current' : ''}
                onClick={() => setYearIdx(i)}
              >
                {yr}
              </span>
            ))}
          </div>
        </div>

        <div className="geo-sat-pass-badge">
          <span className="geo-pass-led" />
          <span>L8/9 · S2 · 100m · {YEARS[yearIdx]}</span>
        </div>
      </div>
    </div>
  )
}
