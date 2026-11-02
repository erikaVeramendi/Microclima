import { useState } from 'react'
import { CONCEPTUAL_ZONES } from '../data/publicSiteData'

export function TerritorialExplorerSection() {
  const [activeLayer, setActiveLayer] = useState('combinada')
  const [activePeriod, setActivePeriod] = useState('Reciente comparable (Ilustrativo)')
  const [selectedZoneId, setSelectedZoneId] = useState(CONCEPTUAL_ZONES[0].id)
  const [zoomLevel, setZoomLevel] = useState(1)

  const activeZone =
    CONCEPTUAL_ZONES.find((z) => z.id === selectedZoneId) || CONCEPTUAL_ZONES[0]

  const zoneVisualMetrics = {
    'ladera-norte': {
      gamcSubalcaldia: 'Subalcaldía Tunari · Distrito 1, 2, 13',
      nasaPass: 'Landsat-9 TIRS + Sentinel-2B + NASADEM',
      ndviBar: 78,
      lstBar: 38,
      elev: '2,750 – 3,400 m',
      accent: '#43A875',
    },
    'corredor-ripario': {
      gamcSubalcaldia: 'Eje Río Rocha · Subalcaldías Molle / Adela Zamudio',
      nasaPass: 'Sentinel-2 MSI (10m) + ISS ECOSTRESS',
      ndviBar: 84,
      lstBar: 44,
      elev: '2,555 – 2,580 m',
      accent: '#8BCB9A',
    },
    'trama-densa': {
      gamcSubalcaldia: 'Centro Histórico / Calatayud · Distritos 10, 11, 12',
      nasaPass: 'Landsat 8/9 Banda 10 TIR + MODIS Diurno/Nocturno',
      ndviBar: 26,
      lstBar: 88,
      elev: '2,548 – 2,570 m',
      accent: '#F28B50',
    },
    'expansion-sur': {
      gamcSubalcaldia: 'Valle Hermoso / Itocta · Distritos 6, 7, 8, 9, 14, 15',
      nasaPass: 'Landsat 8/9 TIRS + Sentinel-2 + Catastro GAMC',
      ndviBar: 34,
      lstBar: 82,
      elev: '2,520 – 2,640 m',
      accent: '#FFCB73',
    },
  }

  const currentMetric =
    zoneVisualMetrics[selectedZoneId] || zoneVisualMetrics['ladera-norte']

  return (
    <section id="territorio" className="section-block section-block--navy">
      <div className="container">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <span className="eyebrow eyebrow--amber" style={{ marginBottom: 0 }}>
            <span className="eyebrow-dot" />
            SIMULADOR SATELITAL INTERACTIVO
          </span>
          <span className="eyebrow eyebrow--green" style={{ marginBottom: 0 }}>
            <span className="eyebrow-dot" />
            DISTRITOS ALCALDÍA GAMC × SENSORES NASA
          </span>
        </div>

        <h2 className="section-title">
          Explorador Multiespectral del Valle de Cochabamba.
        </h2>
        <p className="section-lead">
          Alterna las capas satelitales y haz clic sobre cada macrosector del valle para
          inspeccionar su firma espectral y su vinculación con las subalcaldías.
        </p>

        <div
          className="explorer-console"
          role="region"
          aria-label="Simulador conceptual de exploración territorial NASA y Alcaldía"
        >
          <div className="explorer-topbar">
            <div className="layer-pills" role="group" aria-label="Capas de visualización conceptual">
              {[
                { id: 'combinada', label: '◆ Fusión NASA + GAMC' },
                { id: 'vegetacion', label: '● Huella Verde (Sentinel-2 NDVI)' },
                { id: 'termica', label: '▲ Infrarrojo Térmico (Landsat LST)' },
                { id: 'relieve', label: '◆ Topografía 3D (NASADEM)' },
              ].map((layer) => (
                <button
                  key={layer.id}
                  type="button"
                  className={`layer-pill-btn ${activeLayer === layer.id ? 'is-active' : ''}`}
                  onClick={() => setActiveLayer(layer.id)}
                >
                  {layer.label}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
              <label
                htmlFor="period-select"
                style={{ fontSize: '0.74rem', color: 'var(--color-gray)', fontFamily: 'var(--font-mono)' }}
              >
                Ventana:
              </label>
              <select
                id="period-select"
                value={activePeriod}
                onChange={(e) => setActivePeriod(e.target.value)}
                style={{
                  backgroundColor: '#090D18',
                  color: 'var(--color-cloud)',
                  border: '1px solid rgba(255, 203, 115, 0.35)',
                  borderRadius: '6px',
                  padding: '0.35rem 0.65rem',
                  fontSize: '0.76rem',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                <option value="Histórico base (Ilustrativo)">Histórico base (Ilustrativo)</option>
                <option value="Intermedio (Ilustrativo)">Intermedio (Ilustrativo)</option>
                <option value="Reciente comparable (Ilustrativo)">Reciente comparable (Ilustrativo)</option>
              </select>

              <div style={{ display: 'inline-flex', gap: '0.25rem' }}>
                <button
                  type="button"
                  className="layer-pill-btn"
                  onClick={() => setZoomLevel((z) => Math.max(1, +(z - 0.15).toFixed(2)))}
                  aria-label="Reducir zoom conceptual"
                >
                  −
                </button>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.75rem',
                    padding: '0.4rem 0.5rem',
                    color: '#FFCB73',
                  }}
                >
                  {Math.round(zoomLevel * 100)}%
                </span>
                <button
                  type="button"
                  className="layer-pill-btn"
                  onClick={() => setZoomLevel((z) => Math.min(1.45, +(z + 0.15).toFixed(2)))}
                  aria-label="Aumentar zoom conceptual"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          <div className="explorer-body">
            <div className="explorer-map-canvas">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 2, flexWrap: 'wrap', gap: '0.5rem' }}>
                <span
                  className="demo-tag"
                  style={{
                    backgroundColor: 'rgba(242, 139, 80, 0.15)',
                    color: '#FFCB73',
                    borderColor: 'rgba(242, 139, 80, 0.4)',
                  }}
                >
                  PASS ORBITAL WRS-2 PATH 232 / ROW 072 · ESQUEMA DEMOSTRATIVO
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: '#8BCB9A' }}>
                  ● API GAMC SINCRONIZADA · {activePeriod}
                </span>
              </div>

              <div style={{ overflow: 'hidden', borderRadius: '10px', marginBlock: '0.75rem', display: 'grid', placeItems: 'center', border: '1px solid rgba(245,247,252,0.12)' }}>
                <svg
                  viewBox="0 0 640 330"
                  style={{
                    width: '100%',
                    height: 'auto',
                    maxHeight: '320px',
                    transform: `scale(${zoomLevel})`,
                    transition: 'transform 0.25s ease',
                  }}
                  role="img"
                  aria-label="Visor multiespectral ilustrativo de Cochabamba con traza orbital NASA"
                >
                  <defs>
                    <pattern id="geoGrid" width="32" height="32" patternUnits="userSpaceOnUse">
                      <path d="M 32 0 L 0 0 0 32" fill="none" stroke="rgba(101, 200, 242, 0.08)" strokeWidth="1" />
                    </pattern>
                    <radialGradient id="heatCore" cx="55%" cy="62%" r="42%">
                      <stop offset="0%" stopColor="#D95757" stopOpacity="0.45" />
                      <stop offset="55%" stopColor="#F28B50" stopOpacity="0.2" />
                      <stop offset="100%" stopColor="#070910" stopOpacity="0" />
                    </radialGradient>
                    <radialGradient id="vegCore" cx="35%" cy="32%" r="45%">
                      <stop offset="0%" stopColor="#43A875" stopOpacity="0.42" />
                      <stop offset="65%" stopColor="#237B5B" stopOpacity="0.16" />
                      <stop offset="100%" stopColor="#070910" stopOpacity="0" />
                    </radialGradient>
                  </defs>

                  <rect width="640" height="330" fill="#070B14" />
                  <rect width="640" height="330" fill="url(#geoGrid)" />

                  {/* Resplandores espectrales según capa */}
                  {(activeLayer === 'combinada' || activeLayer === 'vegetacion') && (
                    <rect width="640" height="330" fill="url(#vegCore)" />
                  )}
                  {(activeLayer === 'combinada' || activeLayer === 'termica') && (
                    <rect width="640" height="330" fill="url(#heatCore)" />
                  )}

                  {/* Curvas de nivel NASADEM (Cordillera del Tunari) */}
                  <path
                    d="M 15 65 Q 190 18, 360 58 T 625 48"
                    fill="none"
                    stroke={activeLayer === 'relieve' ? '#65C8F2' : 'rgba(139, 203, 154, 0.35)'}
                    strokeWidth="1.6"
                    strokeDasharray="6 4"
                  />
                  <path
                    d="M 10 98 Q 210 48, 380 86 T 630 82"
                    fill="none"
                    stroke={activeLayer === 'relieve' ? '#65C8F2' : 'rgba(101, 200, 242, 0.25)'}
                    strokeWidth="1.2"
                  />

                  {/* Sector 1: Ladera Norte y Pie de Monte (Parque Tunari) */}
                  <polygon
                    points="55,38 565,38 535,108 82,108"
                    fill={
                      activeLayer === 'vegetacion'
                        ? 'rgba(67, 168, 117, 0.5)'
                        : activeLayer === 'termica'
                        ? 'rgba(255, 240, 179, 0.22)'
                        : 'rgba(67, 168, 117, 0.32)'
                    }
                    stroke={selectedZoneId === 'ladera-norte' ? '#8BCB9A' : 'rgba(139, 203, 154, 0.4)'}
                    strokeWidth={selectedZoneId === 'ladera-norte' ? '2.8' : '1.2'}
                    style={{ cursor: 'pointer' }}
                    onClick={() => setSelectedZoneId('ladera-norte')}
                  />

                  {/* Sector 2: Corredor Ripario Río Rocha y Parques Urbanos */}
                  <polygon
                    points="72,114 542,114 525,162 88,162"
                    fill={
                      activeLayer === 'vegetacion'
                        ? 'rgba(35, 123, 91, 0.62)'
                        : activeLayer === 'termica'
                        ? 'rgba(255, 203, 115, 0.32)'
                        : 'rgba(101, 200, 242, 0.28)'
                    }
                    stroke={selectedZoneId === 'corredor-ripario' ? '#65C8F2' : 'rgba(101, 200, 242, 0.4)'}
                    strokeWidth={selectedZoneId === 'corredor-ripario' ? '2.8' : '1.2'}
                    style={{ cursor: 'pointer' }}
                    onClick={() => setSelectedZoneId('corredor-ripario')}
                  />

                  {/* Sector 3: Trama Urbana Consolidada (Isla de Calor Superficial) */}
                  <polygon
                    points="92,168 520,168 500,234 112,234"
                    fill={
                      activeLayer === 'termica'
                        ? 'rgba(217, 87, 87, 0.55)'
                        : activeLayer === 'vegetacion'
                        ? 'rgba(217, 240, 220, 0.16)'
                        : 'rgba(242, 139, 80, 0.38)'
                    }
                    stroke={selectedZoneId === 'trama-densa' ? '#FFCB73' : 'rgba(242, 139, 80, 0.45)'}
                    strokeWidth={selectedZoneId === 'trama-densa' ? '2.8' : '1.2'}
                    style={{ cursor: 'pointer' }}
                    onClick={() => setSelectedZoneId('trama-densa')}
                  />

                  {/* Sector 4: Expansión Sur / Valle Hermoso / Itocta */}
                  <polygon
                    points="118,240 496,240 476,298 142,298"
                    fill={
                      activeLayer === 'termica'
                        ? 'rgba(242, 139, 80, 0.48)'
                        : activeLayer === 'vegetacion'
                        ? 'rgba(139, 203, 154, 0.24)'
                        : 'rgba(136, 117, 216, 0.32)'
                    }
                    stroke={selectedZoneId === 'expansion-sur' ? '#C4B5FD' : 'rgba(136, 117, 216, 0.45)'}
                    strokeWidth={selectedZoneId === 'expansion-sur' ? '2.8' : '1.2'}
                    style={{ cursor: 'pointer' }}
                    onClick={() => setSelectedZoneId('expansion-sur')}
                  />

                  {/* Traza diagonal de barrido del satélite NASA */}
                  <line
                    x1="150"
                    y1="10"
                    x2="475"
                    y2="320"
                    stroke="rgba(255, 203, 115, 0.55)"
                    strokeWidth="1.5"
                    strokeDasharray="8 5"
                  />
                  <circle cx="312" cy="165" r="6" fill="#FFCB73" />
                  <circle cx="312" cy="165" r="16" fill="none" stroke="#FFCB73" strokeWidth="1" />

                  {/* Etiquetas en el mapa */}
                  <text x="310" y="78" textAnchor="middle" fill="#F5F7FC" fontSize="11" fontFamily="monospace" fontWeight="700">
                    ● LADERA NORTE · PARQUE TUNARI (NDVI / NASADEM)
                  </text>
                  <text x="310" y="142" textAnchor="middle" fill="#F5F7FC" fontSize="11" fontFamily="monospace" fontWeight="700">
                    ◆ CORREDOR RÍO ROCHA & ARBOLADO MUNICIPAL GAMC
                  </text>
                  <text x="310" y="206" textAnchor="middle" fill="#FFF0B3" fontSize="11" fontFamily="monospace" fontWeight="700">
                    ▲ TRAMA URBANA DENSA · FOCO TÉRMICO SUPERFICIAL (LST)
                  </text>
                  <text x="310" y="274" textAnchor="middle" fill="#F5F7FC" fontSize="11" fontFamily="monospace" fontWeight="700">
                    ▲ EXPANSIÓN SUR · ITOCTA / VALLE HERMOSO / ALALAY
                  </text>
                </svg>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', fontSize: '0.74rem', color: 'var(--color-gray)' }}>
                <span>Haz clic en un sector del mapa para sincronizar su telemetría satelital y municipal.</span>
                <span style={{ fontFamily: 'var(--font-mono)', color: '#FFCB73' }}>
                  NASA Earthdata + IDE Alcaldía de Cochabamba
                </span>
              </div>
            </div>

            <aside className="explorer-sidebar">
              <div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: '#FFCB73', marginBottom: '0.5rem', fontWeight: 700 }}>
                  SELECCIÓN DE UNIDAD TERRITORIAL
                </div>
                <div className="zone-selector-list">
                  {CONCEPTUAL_ZONES.map((z) => (
                    <button
                      key={z.id}
                      type="button"
                      className={`zone-select-btn ${selectedZoneId === z.id ? 'is-active' : ''}`}
                      onClick={() => setSelectedZoneId(z.id)}
                    >
                      {z.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Panel de Telemetría Gráfica del Sector Seleccionado */}
              <div
                style={{
                  backgroundColor: 'rgba(10, 15, 28, 0.92)',
                  border: `1px solid ${currentMetric.accent}66`,
                  borderRadius: '12px',
                  padding: '1.05rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.65rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: currentMetric.accent, fontWeight: 700 }}>
                    {activeZone.coords}
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.64rem', color: '#65C8F2' }}>
                    ALT: {currentMetric.elev}
                  </span>
                </div>

                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.02rem', color: 'var(--color-cloud)', margin: 0 }}>
                  {activeZone.label}
                </h3>

                {/* Barras de Firma Espectral Ilustrativa */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', marginBlock: '0.2rem' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', fontFamily: 'var(--font-mono)', marginBottom: '0.2rem' }}>
                      <span style={{ color: '#8BCB9A' }}>Respuesta Vegetal (NDVI)</span>
                      <span style={{ color: '#8BCB9A' }}>Nivel Ilustrativo</span>
                    </div>
                    <div style={{ height: '7px', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: '99px', overflow: 'hidden' }}>
                      <div style={{ width: `${currentMetric.ndviBar}%`, height: '100%', backgroundColor: '#43A875', borderRadius: '99px' }} />
                    </div>
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', fontFamily: 'var(--font-mono)', marginBottom: '0.2rem' }}>
                      <span style={{ color: '#FFCB73' }}>Emisión Térmica (LST)</span>
                      <span style={{ color: '#FFCB73' }}>Nivel Ilustrativo</span>
                    </div>
                    <div style={{ height: '7px', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: '99px', overflow: 'hidden' }}>
                      <div style={{ width: `${currentMetric.lstBar}%`, height: '100%', background: 'linear-gradient(90deg, #FFCB73, #D95757)', borderRadius: '99px' }} />
                    </div>
                  </div>
                </div>

                <div style={{ fontSize: '0.76rem', color: 'var(--color-gray)', borderTop: '1px solid rgba(245,247,252,0.1)', paddingTop: '0.5rem' }}>
                  <div style={{ marginBottom: '0.25rem' }}>
                    <strong style={{ color: '#8BCB9A' }}>API Alcaldía:</strong> {currentMetric.gamcSubalcaldia}
                  </div>
                  <div>
                    <strong style={{ color: '#FFCB73' }}>Sensores NASA/EO:</strong> {currentMetric.nasaPass}
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </section>
  )
}
