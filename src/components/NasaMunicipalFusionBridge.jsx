import { useState } from 'react'

const NASA_SATELLITES = [
  {
    id: 'landsat',
    badge: 'NASA / USGS · 705 KM LEO',
    name: 'Landsat 8 & 9 (OLI / TIRS)',
    band: 'Banda 10/11 Infrarrojo Térmico (10.9 µm)',
    resolution: '30m (Reescalado) · Revisita 8 días',
    variable: 'Temperatura Superficial Terrestre (LST)',
    color: '#F28B50',
    glow: 'rgba(242, 139, 80, 0.35)',
    impact: 'Detecta islas de calor superficial y tendencias térmicas multianuales por distrito.',
  },
  {
    id: 'ecostress',
    badge: 'NASA JPL / ISS · 408 KM LEO',
    name: 'ISS ECOSTRESS & Terra/Aqua MODIS',
    band: 'Radiómetro Térmico Multiespectral (5 bandas TIR)',
    resolution: '70m (ECOSTRESS) / Ciclo Diurno-Nocturno',
    variable: 'Estrés Evaporativo (ESI) y Dinámica Térmica',
    color: '#FFCB73',
    glow: 'rgba(255, 203, 115, 0.35)',
    impact: 'Evalúa cómo se enfrían o retienen calor las superficies urbanas entre el día y la noche.',
  },
  {
    id: 'sentinel',
    badge: 'ESA / COPERNICUS & NASA HLS',
    name: 'Sentinel-2 MSI & Harmonized Landsat',
    band: 'Banda 4 (Rojo) + Banda 8 (NIR Cercano)',
    resolution: '10m Alta Resolución Espacial',
    variable: 'Huella Verde · Vigor Fotosintético (NDVI)',
    color: '#43A875',
    glow: 'rgba(67, 168, 117, 0.35)',
    impact: 'Monitorea corredores ecológicos (Río Rocha, Parque Tunari, Laguna Alalay) a escala de cuadra.',
  },
  {
    id: 'nasadem',
    badge: 'NASA JPL · TOPOGRAFÍA 3D',
    name: 'NASADEM / SRTM & ERA5-Land',
    band: 'Interferometría Radar Banda C + Reanálisis',
    resolution: '30m Relieve · Gradiente Altitudinal',
    variable: 'Elevación (2,500m – 4,500m), Pendiente y Viento',
    color: '#65C8F2',
    glow: 'rgba(101, 200, 242, 0.35)',
    impact: 'Corrige el efecto altitudinal del valle para no confundir altura topográfica con anomalía térmica.',
  },
]

const ALCALDIA_APIS = [
  {
    id: 'gamc-clima',
    badge: 'API ALCALDÍA · TIEMPO REAL / HISTÓRICO',
    name: 'Red Municipal de Monitoreo Ambiental',
    endpoint: 'GET /api/v1/gamc/estaciones-ambientales',
    layer: 'Temperatura de Aire, Humedad y Radiación Local',
    color: '#FFCB73',
    syncDesc: 'Calibra y contrasta la radiancia superficial de la NASA (LST) con mediciones a nivel de calle.',
  },
  {
    id: 'gamc-catastro',
    badge: 'API ALCALDÍA · IDE COCHABAMBA',
    name: 'Distritos, Subalcaldías y Morfología Urbana',
    endpoint: 'GET /api/v1/gamc/geodistritos-h3',
    layer: '6 Subalcaldías · 15 Distritos · Impermeabilización',
    color: '#65C8F2',
    syncDesc: 'Cruza cada píxel satelital con límites administrativos reales para priorizar gestión municipal.',
  },
  {
    id: 'gamc-verde',
    badge: 'API ALCALDÍA · EMAVRA / MEDIO AMBIENTE',
    name: 'Inventario de Arbolado, Parques y Río Rocha',
    endpoint: 'GET /api/v1/gamc/huella-verde-urbana',
    layer: 'Áreas Verdes, Corredores Riparios y Forestación',
    color: '#43A875',
    syncDesc: 'Vincula la respuesta espectral NDVI con parques municipales para auditar pérdida o recuperación.',
  },
  {
    id: 'gamc-plan',
    badge: 'API ALCALDÍA · PLANIFICACIÓN URBANA',
    name: 'Equipamiento Sensible y Simulador de Intervención',
    endpoint: 'POST /api/v1/gamc/escenarios-mitigacion',
    layer: 'Unidades Educativas, Centros de Salud y Proyectos',
    color: '#8875D8',
    syncDesc: 'Evalúa dónde una intervención de arborización o techos fríos protege mayor población vulnerable.',
  },
]

export function NasaMunicipalFusionBridge() {
  const [selectedSatId, setSelectedSatId] = useState('landsat')
  const [selectedApiId, setSelectedApiId] = useState('gamc-clima')

  const activeSat =
    NASA_SATELLITES.find((s) => s.id === selectedSatId) || NASA_SATELLITES[0]
  const activeApi =
    ALCALDIA_APIS.find((a) => a.id === selectedApiId) || ALCALDIA_APIS[0]

  return (
    <section
      id="fusion-nasa-gamc"
      className="section-block"
      style={{
        background:
          'radial-gradient(circle at 20% 25%, rgba(67, 168, 117, 0.12), transparent 45%), radial-gradient(circle at 80% 70%, rgba(242, 139, 80, 0.14), transparent 48%), linear-gradient(180deg, #070A12 0%, #0D1424 100%)',
        borderBottom: '1px solid rgba(245, 247, 252, 0.14)',
      }}
    >
      <div className="container">
        {/* Encabezado de Alto Impacto NASA × Alcaldía */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            gap: '1.5rem',
            marginBottom: '2.2rem',
          }}
        >
          <div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <span className="eyebrow eyebrow--amber" style={{ marginBottom: 0 }}>
                <span className="eyebrow-dot" />
                CONSTELACIÓN EARTHDATA NASA
              </span>
              <span className="eyebrow eyebrow--green" style={{ marginBottom: 0 }}>
                <span className="eyebrow-dot" />
                APIs ALCALDÍA DE COCHABAMBA (GAMC)
              </span>
            </div>
            <h2 className="section-title" style={{ marginBottom: '0.4rem' }}>
              Fusión Orbital–Municipal en Tiempo Real.
            </h2>
            <p className="section-lead" style={{ maxWidth: '64ch' }}>
              Selecciona un satélite de observación terrestre y una API municipal para
              explorar cómo MICROCLIMA sincroniza el espacio con las calles de Cochabamba.
            </p>
          </div>

          {/* Telemetría rápida del Valle */}
          <div
            style={{
              display: 'flex',
              gap: '0.75rem',
              flexWrap: 'wrap',
              background: 'rgba(11, 16, 29, 0.88)',
              border: '1px solid rgba(245, 247, 252, 0.16)',
              borderRadius: '12px',
              padding: '0.75rem 1.1rem',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.72rem',
            }}
          >
            <div>
              <span style={{ color: 'var(--color-gray)', display: 'block', fontSize: '0.62rem' }}>
                COORDENADAS OBJETIVO
              </span>
              <strong style={{ color: '#FFCB73' }}>17°23&apos;22&quot;S · 66°09&apos;24&quot;W</strong>
            </div>
            <div style={{ width: 1, backgroundColor: 'rgba(245,247,252,0.14)' }} />
            <div>
              <span style={{ color: 'var(--color-gray)', display: 'block', fontSize: '0.62rem' }}>
                ALTITUD MEDIA VALLE
              </span>
              <strong style={{ color: '#65C8F2' }}>2,558 m s.n.m.</strong>
            </div>
            <div style={{ width: 1, backgroundColor: 'rgba(245,247,252,0.14)' }} />
            <div>
              <span style={{ color: 'var(--color-gray)', display: 'block', fontSize: '0.62rem' }}>
                MALLA ESPACIAL
              </span>
              <strong style={{ color: '#8BCB9A' }}>H3 Hexagonal + 15 Distritos</strong>
            </div>
          </div>
        </div>

        {/* Matriz Interactiva de 3 Columnas: Satélites NASA -> Núcleo Geo-AI -> APIs Alcaldía */}
        <div className="fusion-bridge-grid">
          {/* COLUMNA IZQUIERDA: SATÉLITES NASA */}
          <div className="fusion-column">
            <div className="fusion-col-header" style={{ borderColor: '#F28B50' }}>
              <span style={{ color: '#FFCB73', fontFamily: 'var(--font-mono)', fontSize: '0.72rem', fontWeight: 700 }}>
                01 · SEGMENTO ESPACIAL (SATÉLITES NASA / EO)
              </span>
              <span style={{ fontSize: '0.68rem', color: 'var(--color-gray)', fontFamily: 'var(--font-mono)' }}>
                4 SENSORES ACTIVOS
              </span>
            </div>

            <div className="fusion-cards-stack">
              {NASA_SATELLITES.map((sat) => {
                const isSelected = sat.id === selectedSatId
                return (
                  <button
                    key={sat.id}
                    type="button"
                    className={`fusion-select-card ${isSelected ? 'is-selected' : ''}`}
                    style={{
                      borderColor: isSelected ? sat.color : 'rgba(245, 247, 252, 0.12)',
                      boxShadow: isSelected ? `0 12px 32px -12px ${sat.glow}` : 'none',
                    }}
                    onClick={() => setSelectedSatId(sat.id)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                      <span
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '0.64rem',
                          color: sat.color,
                          fontWeight: 700,
                        }}
                      >
                        ● {sat.badge}
                      </span>
                      <span
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '0.64rem',
                          padding: '0.12rem 0.45rem',
                          borderRadius: '99px',
                          backgroundColor: isSelected ? `${sat.color}28` : 'rgba(255,255,255,0.05)',
                          color: isSelected ? '#F5F7FC' : 'var(--color-gray)',
                        }}
                      >
                        {isSelected ? 'TRANSMITIENDO' : 'SELECCIONAR'}
                      </span>
                    </div>
                    <strong style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', color: '#F5F7FC', marginTop: '0.2rem' }}>
                      {sat.name}
                    </strong>
                    <span style={{ fontSize: '0.76rem', color: 'var(--color-gray)' }}>
                      {sat.variable} · <span style={{ color: '#F5F7FC' }}>{sat.resolution}</span>
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* COLUMNA CENTRAL: NÚCLEO HOLOGRÁFICO DE FUSIÓN ORBITAL-MUNICIPAL */}
          <div className="fusion-core-stage">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: '0.5rem' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: '#C4B5FD' }}>
                ◆ MOTOR GEO-AI DE SINCRONIZACIÓN
              </span>
              <span className="demo-tag" style={{ fontSize: '0.62rem' }}>
                ESQUEMA DE ARQUITECTURA
              </span>
            </div>

            <svg
              viewBox="0 0 420 350"
              style={{ width: '100%', height: 'auto', maxHeight: '335px' }}
              role="img"
              aria-label="Diagrama animado de fusión entre satélites de la NASA y APIs de la Alcaldía de Cochabamba"
            >
              <defs>
                <radialGradient id="coreGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor={activeSat.color} stopOpacity="0.32" />
                  <stop offset="55%" stopColor="#8875D8" stopOpacity="0.14" />
                  <stop offset="100%" stopColor="#070910" stopOpacity="0" />
                </radialGradient>
                <linearGradient id="satBeamGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor={activeSat.color} stopOpacity="0.85" />
                  <stop offset="100%" stopColor="#8875D8" stopOpacity="0.2" />
                </linearGradient>
                <linearGradient id="apiBeamGrad" x1="1" y1="1" x2="0" y2="0">
                  <stop offset="0%" stopColor={activeApi.color} stopOpacity="0.85" />
                  <stop offset="100%" stopColor="#65C8F2" stopOpacity="0.2" />
                </linearGradient>
              </defs>

              <rect width="420" height="350" rx="14" fill="#070B14" />
              <circle cx="210" cy="175" r="145" fill="url(#coreGlow)" />

              {/* Anillos orbitales concéntricos */}
              <circle
                cx="210"
                cy="175"
                r="122"
                fill="none"
                stroke="rgba(101, 200, 242, 0.2)"
                strokeDasharray="5 5"
              />
              <circle
                cx="210"
                cy="175"
                r="88"
                fill="none"
                stroke="rgba(136, 117, 216, 0.28)"
              />

              {/* Haz de bajada desde el Satélite NASA seleccionado (Superior Izquierda -> Centro) */}
              <path
                d="M 28 52 Q 130 68, 210 155"
                fill="none"
                stroke="url(#satBeamGrad)"
                strokeWidth="3.5"
                strokeDasharray="6 4"
              />
              <polygon
                points="28,46 165,125 135,155"
                fill={activeSat.color}
                opacity="0.14"
              />
              <circle cx="34" cy="52" r="8" fill={activeSat.color} />
              <text x="50" y="48" fill="#F5F7FC" fontSize="10" fontFamily="monospace" fontWeight="700">
                DOWNLINK ORBITAL: {activeSat.name.split(' ')[0].toUpperCase()}
              </text>
              <text x="50" y="61" fill={activeSat.color} fontSize="8.5" fontFamily="monospace">
                {activeSat.band}
              </text>

              {/* Malla Hexagonal H3 del Valle de Cochabamba en el Centro */}
              {[
                { x: 210, y: 175, c: activeSat.color, label: 'H3 · CENTRO' },
                { x: 172, y: 153, c: '#43A875', label: 'TUNARI' },
                { x: 248, y: 153, c: '#65C8F2', label: 'ROCHA' },
                { x: 172, y: 197, c: '#FFCB73', label: 'CALATAYUD' },
                { x: 248, y: 197, c: '#D95757', label: 'SUR / ITOCTA' },
                { x: 210, y: 132, c: '#8BCB9A', label: 'NORTE' },
                { x: 210, y: 218, c: '#8875D8', label: 'ALALAY' },
              ].map((hex, idx) => (
                <g key={idx} transform={`translate(${hex.x}, ${hex.y})`}>
                  <polygon
                    points="0,-20 18,-10 18,10 0,20 -18,10 -18,-10"
                    fill={`${hex.c}26`}
                    stroke={hex.c}
                    strokeWidth="1.6"
                  />
                  <text
                    x="0"
                    y="3"
                    textAnchor="middle"
                    fill="#F5F7FC"
                    fontSize="6.5"
                    fontFamily="monospace"
                    fontWeight="700"
                  >
                    {hex.label}
                  </text>
                </g>
              ))}

              {/* Haz de subida desde la API Alcaldía seleccionada (Inferior Derecha -> Centro) */}
              <path
                d="M 388 298 Q 290 275, 210 195"
                fill="none"
                stroke="url(#apiBeamGrad)"
                strokeWidth="3.5"
                strokeDasharray="6 4"
              />
              <circle cx="386" cy="296" r="8" fill={activeApi.color} />
              <text x="372" y="286" textAnchor="end" fill="#F5F7FC" fontSize="10" fontFamily="monospace" fontWeight="700">
                UPLINK MUNICIPAL: {activeApi.endpoint}
              </text>
              <text x="372" y="299" textAnchor="end" fill={activeApi.color} fontSize="8.5" fontFamily="monospace">
                {activeApi.layer}
              </text>

              {/* Indicadores de esquina */}
              <rect x="14" y="314" width="392" height="24" rx="6" fill="rgba(16, 23, 42, 0.9)" stroke="rgba(245,247,252,0.12)" />
              <text x="210" y="330" textAnchor="middle" fill="#8BCB9A" fontSize="9" fontFamily="monospace">
                FUSIÓN ACTIVA: {activeSat.variable.toUpperCase()} × {activeApi.name.toUpperCase()}
              </text>
            </svg>

            {/* Tarjeta de Síntesis de Fusión */}
            <div
              style={{
                width: '100%',
                marginTop: '0.65rem',
                padding: '0.85rem 1rem',
                borderRadius: '10px',
                backgroundColor: 'rgba(12, 18, 32, 0.9)',
                border: '1px solid rgba(245, 247, 252, 0.14)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.35rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', fontFamily: 'var(--font-mono)' }}>
                <span style={{ color: activeSat.color }}>▲ SATÉLITE: {activeSat.name}</span>
                <span style={{ color: activeApi.color }}>● ALCALDÍA: {activeApi.endpoint}</span>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--color-cloud)', margin: 0 }}>
                {activeSat.impact} {activeApi.syncDesc}
              </p>
            </div>
          </div>

          {/* COLUMNA DERECHA: APIs ALCALDÍA DE COCHABAMBA */}
          <div className="fusion-column">
            <div className="fusion-col-header" style={{ borderColor: '#43A875' }}>
              <span style={{ color: '#8BCB9A', fontFamily: 'var(--font-mono)', fontSize: '0.72rem', fontWeight: 700 }}>
                02 · SEGMENTO TERRESTRE (APIs ALCALDÍA GAMC)
              </span>
              <span style={{ fontSize: '0.68rem', color: 'var(--color-gray)', fontFamily: 'var(--font-mono)' }}>
                4 ENDPOINTS MUNICIPALES
              </span>
            </div>

            <div className="fusion-cards-stack">
              {ALCALDIA_APIS.map((api) => {
                const isSelected = api.id === selectedApiId
                return (
                  <button
                    key={api.id}
                    type="button"
                    className={`fusion-select-card ${isSelected ? 'is-selected' : ''}`}
                    style={{
                      borderColor: isSelected ? api.color : 'rgba(245, 247, 252, 0.12)',
                      boxShadow: isSelected ? `0 12px 32px -12px ${api.color}55` : 'none',
                    }}
                    onClick={() => setSelectedApiId(api.id)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                      <span
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '0.64rem',
                          color: api.color,
                          fontWeight: 700,
                        }}
                      >
                        ◆ {api.badge}
                      </span>
                      <span
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '0.62rem',
                          color: isSelected ? '#8BCB9A' : 'var(--color-gray)',
                        }}
                      >
                        {isSelected ? 'SINCRONIZADO' : 'CONECTAR'}
                      </span>
                    </div>
                    <strong style={{ fontFamily: 'var(--font-display)', fontSize: '0.98rem', color: '#F5F7FC', marginTop: '0.2rem' }}>
                      {api.name}
                    </strong>
                    <code
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.68rem',
                        color: api.color,
                        backgroundColor: 'rgba(7, 9, 16, 0.75)',
                        padding: '0.18rem 0.45rem',
                        borderRadius: '4px',
                      }}
                    >
                      {api.endpoint}
                    </code>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

