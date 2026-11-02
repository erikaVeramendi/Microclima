import { useState, useEffect, useRef } from 'react'
import { COCHABAMBA_ZONES } from '../../data/internalPanelData'

/* Contornos geográficos orgánicos (curvas suaves del Valle de Cochabamba, NO rectángulos) */
const ORGANIC_ZONES = {
  'tunari-norte': {
    path: 'M 48,46 C 145,22 315,18 475,26 C 585,32 668,48 696,82 C 706,112 668,142 605,148 C 482,158 295,152 162,156 C 88,158 42,134 36,96 C 32,68 36,52 48,46 Z',
    cx: 372,
    cy: 92,
  },
  'corredor-rocha': {
    path: 'M 44,174 C 152,158 312,162 462,164 C 564,165 654,154 688,182 C 702,204 668,236 604,240 C 468,248 296,238 158,248 C 84,252 38,228 34,202 C 32,186 36,178 44,174 Z',
    cx: 356,
    cy: 204,
  },
  'trama-central': {
    path: 'M 92,264 C 178,250 308,252 398,266 C 436,276 452,314 440,352 C 426,386 356,396 264,394 C 174,392 98,382 80,344 C 66,312 72,274 92,264 Z',
    cx: 266,
    cy: 326,
  },
  'cuenca-alalay': {
    path: 'M 476,262 C 538,246 626,250 672,278 C 704,306 698,364 662,394 C 618,418 528,414 482,386 C 452,362 448,284 476,262 Z',
    cx: 576,
    cy: 332,
  },
  'expansion-sur': {
    path: 'M 106,416 C 214,402 386,404 536,416 C 618,424 668,452 654,492 C 638,528 536,540 382,538 C 236,536 124,526 96,490 C 78,462 84,424 106,416 Z',
    cx: 374,
    cy: 474,
  },
}

/* Focos multiespectrales para renderizado bioluminiscente en HTML5 Canvas */
const HEAT_NODES = [
  // Cordillera del Tunari & Bosques Norte (Verde intenso)
  { x: 160, y: 82, r: 78, type: 'veg', intensity: 0.92 },
  { x: 295, y: 76, r: 92, type: 'veg', intensity: 0.96 },
  { x: 445, y: 84, r: 86, type: 'veg', intensity: 0.88 },
  { x: 585, y: 94, r: 74, type: 'veg', intensity: 0.82 },
  // Corredor Río Rocha, Parque Lincoln, Mariscal Santa Cruz
  { x: 145, y: 204, r: 64, type: 'veg', intensity: 0.85 },
  { x: 280, y: 198, r: 68, type: 'veg', intensity: 0.89 },
  { x: 420, y: 205, r: 62, type: 'veg', intensity: 0.81 },
  { x: 565, y: 196, r: 58, type: 'veg', intensity: 0.78 },
  // Islas de Calor Trama Central / La Cancha / Terminal
  { x: 235, y: 322, r: 88, type: 'heat', intensity: 0.96 },
  { x: 318, y: 336, r: 82, type: 'heat', intensity: 0.94 },
  { x: 175, y: 338, r: 64, type: 'heat', intensity: 0.82 },
  { x: 382, y: 314, r: 62, type: 'heat', intensity: 0.79 },
  // Entorno Alalay (Contraste húmedo + ladera este cálida)
  { x: 562, y: 334, r: 58, type: 'water', intensity: 0.9 },
  { x: 632, y: 312, r: 64, type: 'heat', intensity: 0.76 },
  { x: 522, y: 365, r: 52, type: 'veg', intensity: 0.68 },
  // Expansión Sur / Itocta (Focos térmicos periurbanos)
  { x: 245, y: 468, r: 84, type: 'heat', intensity: 0.88 },
  { x: 385, y: 478, r: 92, type: 'heat', intensity: 0.93 },
  { x: 515, y: 472, r: 76, type: 'heat', intensity: 0.84 },
  { x: 155, y: 482, r: 58, type: 'veg', intensity: 0.56 },
]

/* Polígonos de parcelas vectoriales (modo híbrido satelital como panel inf-der de referencia) */
const URBAN_PARCELS = [
  { pts: '115,182 178,176 184,218 118,224', fill: 'rgba(34,197,94,0.34)', stroke: '#4ADE80' },
  { pts: '242,178 322,174 328,216 246,220', fill: 'rgba(34,197,94,0.38)', stroke: '#4ADE80' },
  { pts: '198,284 268,280 274,336 202,340', fill: 'rgba(239,68,68,0.34)', stroke: '#F87171' },
  { pts: '286,296 364,292 368,354 290,358', fill: 'rgba(168,85,247,0.32)', stroke: '#C084FC' },
  { pts: '124,294 184,290 188,348 128,352', fill: 'rgba(245,158,11,0.28)', stroke: '#FBBF24' },
  { pts: '488,284 542,278 548,324 492,328', fill: 'rgba(34,197,94,0.3)', stroke: '#4ADE80' },
  { pts: '312,436 406,432 414,492 318,496', fill: 'rgba(239,68,68,0.35)', stroke: '#FB7185' },
  { pts: '188,438 272,434 278,494 192,498', fill: 'rgba(168,85,247,0.3)', stroke: '#C084FC' },
  { pts: '452,442 536,438 542,496 458,500', fill: 'rgba(245,158,11,0.3)', stroke: '#FBBF24' },
]

const YEARS = [2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026]

export function SharedGeoCanvas({
  selectedZoneId,
  onSelectZone,
  activeLayer = 'dual', // 'dual' | 'ndvi' | 'lst' | 'parcelas' | 'elevacion' | 'vacios'
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

  const selectedZone =
    COCHABAMBA_ZONES.find((z) => z.id === selectedZoneId) || COCHABAMBA_ZONES[1]

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

    // 1. Fondo satelital profundo nocturno/orbital
    const bgGrad = ctx.createRadialGradient(370, 280, 40, 370, 280, 460)
    bgGrad.addColorStop(0, '#0B172A')
    bgGrad.addColorStop(0.65, '#070E1B')
    bgGrad.addColorStop(1, '#040811')
    ctx.fillStyle = bgGrad
    ctx.fillRect(0, 0, W, H)

    // 2. Relieve sombreado Cordillera del Tunari (Norte) y serranías Este/Sur
    for (let ridge = 0; ridge < 7; ridge++) {
      ctx.beginPath()
      const baseY = 26 + ridge * 19
      ctx.moveTo(0, baseY)
      for (let x = 0; x <= W; x += 28) {
        const wave =
          Math.sin(x * 0.014 + ridge * 0.9) * 12 +
          Math.cos(x * 0.032 - ridge) * 6
        ctx.lineTo(x, baseY + wave)
      }
      ctx.strokeStyle =
        currentLayer === 'elevacion'
          ? `rgba(56, 189, 248, ${0.34 - ridge * 0.03})`
          : `rgba(100, 180, 220, ${0.13 - ridge * 0.012})`
      ctx.lineWidth = currentLayer === 'elevacion' ? 1.5 : 1
      ctx.stroke()
    }

    // 3. Trama urbana satelital realista de Cochabamba (malla vial y manzanas luminosas)
    ctx.save()
    ctx.strokeStyle = 'rgba(148, 183, 218, 0.075)'
    ctx.lineWidth = 0.8
    for (let x = 70; x < 670; x += 18) {
      ctx.beginPath()
      ctx.moveTo(x + (x % 36 === 0 ? -4 : 3), 155)
      ctx.lineTo(x, 515)
      ctx.stroke()
    }
    for (let y = 165; y < 515; y += 16) {
      ctx.beginPath()
      ctx.moveTo(65, y)
      ctx.lineTo(665, y + Math.sin(y * 0.03) * 6)
      ctx.stroke()
    }
    // Avenidas estructurales (Blanco Galindo, América, Circunvalación, Petrolera)
    ctx.strokeStyle = 'rgba(125, 211, 252, 0.18)'
    ctx.lineWidth = 1.6
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

    // 4. Factor temporal dinámico (2019 -> 2026 intensifica islas térmicas o muestra variación)
    const timeFactor = 0.84 + (yearIdx / (YEARS.length - 1)) * 0.22

    // 5. Renderizado Bioluminiscente Multiespectral (Estilo imagen de referencia)
    ctx.save()
    ctx.globalCompositeOperation = 'screen'
    HEAT_NODES.forEach((node) => {
      const showVeg =
        currentLayer === 'dual' ||
        currentLayer === 'ndvi' ||
        currentLayer === 'parcelas'
      const showHeat =
        currentLayer === 'dual' ||
        currentLayer === 'lst' ||
        currentLayer === 'parcelas'

      let cInner = 'rgba(34, 197, 94, 0)'
      let cMid = 'rgba(16, 185, 129, 0)'

      if (node.type === 'veg' && showVeg) {
        const p = node.intensity
        cInner =
          currentLayer === 'ndvi'
            ? `rgba(250, 204, 21, ${0.58 * p})` // Núcleo clorofila lima/oro como imagen izq
            : `rgba(74, 222, 128, ${0.46 * p})`
        cMid = `rgba(16, 185, 129, ${0.32 * p})`
      } else if (node.type === 'heat' && showHeat) {
        const p = Math.min(1, node.intensity * timeFactor)
        cInner =
          currentLayer === 'lst'
            ? `rgba(254, 240, 138, ${0.65 * p})`
            : `rgba(239, 68, 68, ${0.52 * p})`
        cMid = `rgba(249, 115, 22, ${0.34 * p})`
      } else if (node.type === 'water') {
        cInner = 'rgba(56, 189, 248, 0.55)'
        cMid = 'rgba(14, 165, 233, 0.24)'
      } else if (currentLayer === 'elevacion') {
        const elevBoost = node.y < 150 ? 0.52 : 0.2
        cInner = `rgba(56, 189, 248, ${elevBoost})`
        cMid = `rgba(99, 102, 241, ${elevBoost * 0.55})`
      } else if (currentLayer === 'vacios') {
        const gap = node.y < 140 || node.y > 430
        cInner = gap ? 'rgba(244, 63, 94, 0.48)' : 'rgba(34, 197, 94, 0.34)'
        cMid = gap ? 'rgba(245, 158, 11, 0.24)' : 'rgba(16, 185, 129, 0.16)'
      }

      const grad = ctx.createRadialGradient(
        node.x,
        node.y,
        4,
        node.x,
        node.y,
        node.r
      )
      grad.addColorStop(0, cInner)
      grad.addColorStop(0.48, cMid)
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)')
      ctx.fillStyle = grad
      ctx.beginPath()
      ctx.arc(node.x, node.y, node.r, 0, Math.PI * 2)
      ctx.fill()
    })
    ctx.restore()

    // 6. Micro-constelación de luces / píxeles activos urbanos
    ctx.fillStyle = 'rgba(226, 232, 240, 0.24)'
    for (let i = 0; i < 140; i++) {
      const px = 85 + ((i * 73) % 575)
      const py = 165 + ((i * 97) % 345)
      ctx.fillRect(px, py, 1.5, 1.5)
    }
  }, [currentLayer, yearIdx])

  return (
    <div
      className={`shared-geo-wrapper ${isFullscreen ? 'is-fullscreen' : ''}`}
      style={{ height: isFullscreen ? '100vh' : `${height}px` }}
    >
      {/* Píldoras flotantes limpias de capas (Arriba Izquierda) */}
      <div className="geo-hud-top-bar">
        <div className="geo-hud-layers">
          {[
            { id: 'dual', label: '◈ Fusión Espectral' },
            { id: 'ndvi', label: '🌿 Clorofila NDVI' },
            { id: 'lst', label: '🔥 Térmico LST' },
            { id: 'parcelas', label: '⬡ Polígonos Urbanos' },
            { id: 'elevacion', label: '⛰ DEM 3D' },
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
          >
            ⇄ T1/T2
          </button>
          <button
            type="button"
            className="geo-hud-pill"
            onClick={() => setIsFullscreen((p) => !p)}
          >
            {isFullscreen ? '✕' : '⛶'}
          </button>
        </div>
      </div>

      {/* Barra vertical flotante de cristal (como en la imagen de referencia) */}
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
              <linearGradient id="rochaGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.3" />
                <stop offset="50%" stopColor="#22D3EE" stopOpacity="0.95" />
                <stop offset="100%" stopColor="#34D399" stopOpacity="0.4" />
              </linearGradient>
            </defs>

            {/* Río Rocha serpenteante con resplandor hidrológico */}
            <path
              d="M 715,172 C 625,186 540,208 438,198 C 340,188 242,196 156,214 C 96,226 45,222 10,234"
              fill="none"
              stroke="url(#rochaGrad)"
              strokeWidth="4.2"
              strokeLinecap="round"
            />
            <path
              d="M 715,172 C 625,186 540,208 438,198 C 340,188 242,196 156,214 C 96,226 45,222 10,234"
              fill="none"
              stroke="#E0F2FE"
              strokeWidth="1.1"
              strokeDasharray="6 6"
              opacity="0.7"
            />

            {/* Espejo de agua Laguna Alalay */}
            <path
              d="M 538,316 C 556,304 586,308 594,328 C 600,346 582,364 558,362 C 536,360 524,332 538,316 Z"
              fill="rgba(14, 165, 233, 0.42)"
              stroke="#38BDF8"
              strokeWidth="1.6"
            />

            {/* Modo Parcelas Urbanas Vectoriales */}
            {(currentLayer === 'parcelas' || activeTool === 'polygon') &&
              URBAN_PARCELS.map((p, idx) => (
                <polygon
                  key={idx}
                  points={p.pts}
                  fill={p.fill}
                  stroke={p.stroke}
                  strokeWidth="1.3"
                />
              ))}

            {/* Contornos Territoriales Orgánicos con Resalte Celeste Luminoso */}
            {COCHABAMBA_ZONES.map((zone) => {
              const shape = ORGANIC_ZONES[zone.id]
              if (!shape) return null
              const isSelected = zone.id === selectedZoneId
              return (
                <g
                  key={zone.id}
                  onClick={() => onSelectZone && onSelectZone(zone.id)}
                  style={{ cursor: 'pointer' }}
                >
                  <path
                    d={shape.path}
                    fill={isSelected ? 'rgba(56, 189, 248, 0.09)' : 'rgba(15, 23, 42, 0.04)'}
                    stroke={isSelected ? '#38BDF8' : 'rgba(148, 163, 184, 0.24)'}
                    strokeWidth={isSelected ? 2.6 : 1.1}
                    strokeDasharray={isSelected ? undefined : '5 4'}
                    filter={isSelected ? 'url(#neonCyanGlow)' : undefined}
                  />

                  {/* Nodo sensor pulsante y cápsula de telemetría limpia */}
                  <circle
                    cx={shape.cx}
                    cy={shape.cy}
                    r={isSelected ? 15 : 9}
                    fill="none"
                    stroke={isSelected ? '#38BDF8' : zone.color}
                    strokeWidth="1.2"
                    opacity={isSelected ? 0.9 : 0.45}
                  />
                  <circle
                    cx={shape.cx}
                    cy={shape.cy}
                    r={isSelected ? 5.5 : 4}
                    fill={zone.color}
                    stroke="#FFFFFF"
                    strokeWidth="1.6"
                  />

                  <g transform={`translate(${shape.cx - 56}, ${shape.cy + 12})`}>
                    <rect
                      width="112"
                      height="22"
                      rx="6"
                      fill={isSelected ? 'rgba(8, 20, 42, 0.92)' : 'rgba(7, 13, 26, 0.78)'}
                      stroke={isSelected ? '#38BDF8' : 'rgba(148,163,184,0.28)'}
                      strokeWidth="1"
                    />
                    <text
                      x="56"
                      y="14"
                      textAnchor="middle"
                      fill="#F8FAFC"
                      fontSize="8.3"
                      fontFamily="monospace"
                      fontWeight="700"
                    >
                      {zone.shortName.slice(0, 10)} · {zone.lstIllustrative}°
                    </text>
                  </g>
                </g>
              )
            })}

            {/* Herramienta Transecto Espacial */}
            {activeTool === 'measure' && (
              <g>
                <line
                  x1="372"
                  y1="92"
                  x2="266"
                  y2="326"
                  stroke="#FBBF24"
                  strokeWidth="2.2"
                  strokeDasharray="6 4"
                />
                <rect
                  x="275"
                  y="196"
                  width="118"
                  height="22"
                  rx="5"
                  fill="rgba(10,16,30,0.94)"
                  stroke="#FBBF24"
                />
                <text
                  x="334"
                  y="210"
                  textAnchor="middle"
                  fill="#FDE68A"
                  fontSize="8.5"
                  fontFamily="monospace"
                >
                  4.8 km · ΔLST +9.6°C
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

      {/* Mini HUD Flotante de Zona Activa (Compacto, visual, cero párrafos) */}
      {!compactHud && (
        <aside className="geo-mini-zone-hud">
          <div className="geo-mini-head">
            <span className="geo-live-dot" style={{ backgroundColor: selectedZone.color }} />
            <strong>{selectedZone.shortName}</strong>
            <span className="geo-elev-pill">{selectedZone.elevation}</span>
          </div>

          <div className="geo-mini-bars">
            <div className="geo-mini-bar-row">
              <span>LST SUP.</span>
              <div className="geo-bar-track">
                <div
                  className="geo-bar-fill"
                  style={{
                    width: `${(selectedZone.lstIllustrative / 38) * 100}%`,
                    background: 'linear-gradient(90deg, #F59E0B, #EF4444)',
                  }}
                />
              </div>
              <strong style={{ color: '#FB923C' }}>{selectedZone.lstIllustrative}°C</strong>
            </div>

            <div className="geo-mini-bar-row">
              <span>NDVI</span>
              <div className="geo-bar-track">
                <div
                  className="geo-bar-fill"
                  style={{
                    width: `${selectedZone.ndviIllustrative * 100}%`,
                    background: 'linear-gradient(90deg, #10B981, #4ADE80)',
                  }}
                />
              </div>
              <strong style={{ color: '#4ADE80' }}>{selectedZone.ndviIllustrative}</strong>
            </div>

            <div className="geo-mini-bar-row">
              <span>ÓPTICO</span>
              <div className="geo-bar-track">
                <div
                  className="geo-bar-fill"
                  style={{
                    width: `${selectedZone.validCoverage}%`,
                    background: 'linear-gradient(90deg, #0284C7, #38BDF8)',
                  }}
                />
              </div>
              <strong style={{ color: '#38BDF8' }}>{selectedZone.validCoverage}%</strong>
            </div>
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

      {/* Scrubber Temporal Animado Inferior (Estilo barra play/timeline de la imagen de referencia) */}
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
          <span>L9 · S2 · {YEARS[yearIdx]}</span>
        </div>
      </div>
    </div>
  )
}
