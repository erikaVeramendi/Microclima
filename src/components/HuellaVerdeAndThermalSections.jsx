import { useState } from 'react'

export function HuellaVerdeAndThermalSections() {
  const [ndviCompareSplit, setNdviCompareSplit] = useState(55)
  const [selectedThermalView, setSelectedThermalView] = useState('radar')

  return (
    <>
      {/* =========================================================
          SECCIÓN 07. HUELLA VERDE
         ========================================================= */}
      <section className="section-block section-block--slate">
        <div className="container">
          <span className="eyebrow" style={{ color: 'var(--veg-300)' }}>
            <span className="eyebrow-dot" />
            07 · Módulo Estratégico · Huella Verde
          </span>
          <h2 className="section-title">El verde también cuenta la historia de una ciudad.</h2>
          <p className="section-lead">
            Huella Verde es el espacio dedicado a investigar las transformaciones de la
            vegetación urbana de Cochabamba. Mediante información satelital e índices
            espectrales como NDVI, permite estudiar cambios, comparar periodos y explorar
            su posible relación con otros comportamientos ambientales.
          </p>

          <div className="huella-layout">
            <div className="huella-visualizer">
              <div className="visualizer-toolbar">
                <span className="demo-tag">
                  DEMOSTRACIÓN CONCEPTUAL · RESPUESTA ESPECTRAL NDVI
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--color-gray)' }}>
                  Periodos ilustrativos: T1 vs. T2 comparable
                </span>
              </div>

              <div className="ndvi-compare-stage" aria-label="Comparación conceptual antes y después de respuesta espectral">
                {/* Capa Base: Periodo T2 (Derecha / Fondo) */}
                <div
                  className="ndvi-layer"
                  style={{
                    background:
                      'linear-gradient(135deg, rgba(17,27,50,0.92), rgba(35,123,91,0.45)), url("https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80") center/cover',
                  }}
                >
                  <div style={{ alignSelf: 'flex-end', backgroundColor: 'rgba(17,27,50,0.88)', padding: '0.3rem 0.65rem', borderRadius: '4px', fontFamily: 'var(--font-mono)', fontSize: '0.72rem', border: '1px solid rgba(139,203,154,0.4)' }}>
                    Periodo T2 (Ilustrativo) · Contraste espectral
                  </div>
                </div>

                {/* Capa Superpuesta: Periodo T1 recortada según el control deslizante */}
                <div
                  className="ndvi-layer"
                  style={{
                    clipPath: `inset(0 ${100 - ndviCompareSplit}% 0 0)`,
                    background:
                      'linear-gradient(135deg, rgba(35,123,91,0.68), rgba(67,168,117,0.52)), url("https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80") center/cover',
                    borderRight: '2px solid var(--color-cyan)',
                  }}
                >
                  <div style={{ alignSelf: 'flex-start', backgroundColor: 'rgba(17,27,50,0.88)', padding: '0.3rem 0.65rem', borderRadius: '4px', fontFamily: 'var(--font-mono)', fontSize: '0.72rem', border: '1px solid rgba(101,200,242,0.45)' }}>
                    Periodo T1 (Ilustrativo) · Referencia base
                  </div>
                </div>

                {/* Gráfico conceptual superpuesto de serie NDVI */}
                <div
                  style={{
                    position: 'absolute',
                    left: '1rem',
                    right: '1rem',
                    bottom: '0.85rem',
                    backgroundColor: 'rgba(17, 27, 50, 0.9)',
                    border: '1px solid var(--color-border-dark)',
                    borderRadius: '6px',
                    padding: '0.65rem 0.85rem',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: 'var(--color-gray)', marginBottom: '0.3rem' }}>
                    <span>Serie conceptual de índice NDVI (observaciones válidas)</span>
                    <span style={{ color: 'var(--veg-300)' }}>Escala espectral [-1 a +1]</span>
                  </div>
                  <svg viewBox="0 0 420 48" style={{ width: '100%', height: '42px' }} aria-hidden="true">
                    <line x1="0" y1="24" x2="420" y2="24" stroke="rgba(169,184,204,0.18)" strokeDasharray="3 3" />
                    <polyline
                      fill="none"
                      stroke="#43A875"
                      strokeWidth="2.2"
                      points="10,32 70,26 130,18 190,22 250,30 310,20 370,15 410,17"
                    />
                    {[
                      [10, 32],
                      [70, 26],
                      [130, 18],
                      [190, 22],
                      [250, 30],
                      [310, 20],
                      [370, 15],
                      [410, 17],
                    ].map(([cx, cy], idx) => (
                      <circle key={idx} cx={cx} cy={cy} r="3.2" fill="#8BCB9A" />
                    ))}
                  </svg>
                </div>
              </div>

              <div className="ndvi-slider-control">
                <label htmlFor="ndvi-split-range">Comparador temporal:</label>
                <input
                  id="ndvi-split-range"
                  type="range"
                  min="15"
                  max="85"
                  value={ndviCompareSplit}
                  onChange={(e) => setNdviCompareSplit(Number(e.target.value))}
                />
                <span>{ndviCompareSplit}%</span>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--color-gray)', marginBottom: '0.35rem' }}>
                  <span>Escala semántica Huella Verde (NDVI)</span>
                  <span style={{ fontFamily: 'var(--font-mono)' }}>#D9F0DC → #237B5B</span>
                </div>
                <div className="veg-scale-bar">
                  <div className="veg-swatch" style={{ backgroundColor: 'var(--veg-100)' }} />
                  <div className="veg-swatch" style={{ backgroundColor: 'var(--veg-300)' }} />
                  <div className="veg-swatch" style={{ backgroundColor: 'var(--veg-500)' }} />
                  <div className="veg-swatch" style={{ backgroundColor: 'var(--veg-700)' }} />
                </div>
              </div>
            </div>

            <div className="huella-pillars">
              <article className="pillar-item">
                <h3>Memoria verde</h3>
                <p>
                  Explorar cómo cambia la señal de vegetación a través del tiempo,
                  reconstruyendo si las transformaciones fueron graduales, estacionales o
                  persistentes.
                </p>
              </article>

              <article className="pillar-item">
                <h3>Detector de transformaciones</h3>
                <p>
                  Identificar posibles señales de disminución, estabilidad o recuperación
                  vegetal entre periodos comparables y con control de calidad de píxeles.
                </p>
              </article>

              <article className="pillar-item">
                <h3>Relación vegetación-temperatura</h3>
                <p>
                  Investigar coincidencias entre cambios en la vegetación y comportamiento
                  térmico superficial en distintas zonas de la ciudad.
                </p>
              </article>

              <div className="caution-box" role="note">
                <strong>Advertencia científica sobre el índice NDVI</strong>
                El índice NDVI mide la respuesta espectral de la vegetación; no mide
                directamente cantidad de árboles, hectáreas de bosque ni porcentaje exacto
                de cobertura vegetal sin un procedimiento adicional de clasificación y
                validación. Una disminución del NDVI no demuestra automáticamente tala:
                puede estar influida por estacionalidad, humedad, sequía, cultivos o
                condiciones de observación.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          SECCIÓN 08. INTELIGENCIA TÉRMICA
         ========================================================= */}
      <section className="section-block section-block--navy">
        <div className="container">
          <span className="eyebrow" style={{ color: 'var(--lst-300)' }}>
            <span className="eyebrow-dot" />
            08 · Inteligencia Térmica
          </span>
          <h2 className="section-title">El calor también deja patrones.</h2>
          <p className="section-lead">
            Las observaciones térmicas permiten estudiar cómo se distribuye y transforma la
            temperatura superficial del territorio. LlajtaLab busca identificar tendencias,
            anomalías y diferencias espaciales para comprender mejor su comportamiento a lo
            largo del tiempo.
          </p>

          <div className="thermal-layout">
            <div className="huella-pillars">
              <article
                className="pillar-item"
                style={{
                  borderLeftColor: selectedThermalView === 'radar' ? 'var(--lst-500)' : 'var(--color-border-strong)',
                  cursor: 'pointer',
                }}
                onClick={() => setSelectedThermalView('radar')}
              >
                <h3>Radar de transformaciones</h3>
                <p>
                  Identifica tendencias térmicas a lo largo de distintos periodos,
                  distinguiendo zonas cálidas estables de aquellas con cambios sostenidos.
                </p>
              </article>

              <article
                className="pillar-item"
                style={{
                  borderLeftColor: selectedThermalView === 'anomalias' ? 'var(--lst-700)' : 'var(--color-border-strong)',
                  cursor: 'pointer',
                }}
                onClick={() => setSelectedThermalView('anomalias')}
              >
                <h3>Detector de anomalías</h3>
                <p>
                  Busca observaciones que se apartan del comportamiento histórico esperado
                  para cada sector en temporadas equivalentes.
                </p>
              </article>

              <article
                className="pillar-item"
                style={{
                  borderLeftColor: selectedThermalView === 'historia' ? 'var(--lst-300)' : 'var(--color-border-strong)',
                  cursor: 'pointer',
                }}
                onClick={() => setSelectedThermalView('historia')}
              >
                <h3>Historia térmica</h3>
                <p>
                  Permite investigar cómo cambia el comportamiento térmico de una zona y
                  detectar posibles puntos de inflexión en su serie histórica.
                </p>
              </article>

              <div className="caution-box" role="note" style={{ borderColor: 'rgba(242, 139, 80, 0.45)' }}>
                <strong style={{ color: 'var(--lst-300)' }}>
                  Aclaración científica obligatoria (LST vs. Temperatura del aire)
                </strong>
                La temperatura superficial terrestre obtenida mediante satélite (LST, en
                °C o K de radiancia superficial) no es equivalente a la temperatura del
                aire medida a nivel meteorológico por estaciones terrestres.
              </div>
            </div>

            <div className="huella-visualizer">
              <div className="visualizer-toolbar">
                <span
                  className="demo-tag"
                  style={{
                    backgroundColor: 'rgba(242, 139, 80, 0.16)',
                    color: 'var(--lst-300)',
                    borderColor: 'rgba(242, 139, 80, 0.4)',
                  }}
                >
                  VISUALIZACIÓN CONCEPTUAL · VARIABLE: LST (TEMPERATURA SUPERFICIAL)
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.74rem', color: 'var(--color-gray)' }}>
                  Unidad de referencia: °C (relativa ilustrativa)
                </span>
              </div>

              <div
                style={{
                  backgroundColor: 'var(--color-navy-deep)',
                  border: '1px solid var(--color-border-dark)',
                  borderRadius: '8px',
                  padding: '1.15rem',
                }}
              >
                <svg
                  viewBox="0 0 520 230"
                  style={{ width: '100%', height: 'auto' }}
                  role="img"
                  aria-label="Representación conceptual de distribución y tendencia térmica superficial"
                >
                  <rect width="520" height="230" fill="#0b1222" rx="6" />
                  {/* Contornos térmicos conceptuales */}
                  <ellipse cx="265" cy="115" rx="210" ry="88" fill="rgba(255, 240, 179, 0.14)" />
                  <ellipse cx="275" cy="120" rx="160" ry="68" fill="rgba(255, 203, 115, 0.2)" />
                  <ellipse cx="285" cy="122" rx="115" ry="48" fill="rgba(242, 139, 80, 0.28)" />
                  <ellipse cx="295" cy="125" rx="70" ry="30" fill="rgba(217, 87, 87, 0.38)" />
                  <ellipse cx="300" cy="125" rx="32" ry="15" fill="rgba(150, 61, 99, 0.55)" />

                  {/* Cuadrícula y ejes */}
                  <line x1="30" y1="195" x2="490" y2="195" stroke="rgba(169,184,204,0.22)" />
                  <line x1="30" y1="30" x2="30" y2="195" stroke="rgba(169,184,204,0.22)" />

                  {/* Curva ilustrativa de tendencia y anomalía */}
                  <polyline
                    fill="none"
                    stroke="#FFCB73"
                    strokeWidth="2"
                    points="45,165 110,155 175,148 240,132 305,98 370,122 435,112 480,105"
                  />
                  <circle cx="305" cy="98" r="5" fill="#D95757" stroke="#F5F7FC" strokeWidth="1.5" />
                  <text x="316" y="94" fill="#FFF0B3" fontSize="10" fontFamily="monospace">
                    Anomalía candidata (Ilustrativa)
                  </text>
                  <text x="45" y="46" fill="#A9B8CC" fontSize="10" fontFamily="monospace">
                    Distribución espacial y serie temporal conceptual de LST
                  </text>
                </svg>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--color-gray)', marginBottom: '0.35rem' }}>
                  <span>Escala térmica superficial oficial (LST)</span>
                  <span style={{ fontFamily: 'var(--font-mono)' }}>Menor → Mayor emisión térmica</span>
                </div>
                <div className="lst-scale-bar">
                  <div className="lst-swatch" style={{ backgroundColor: 'var(--lst-100)' }} title="#FFF0B3" />
                  <div className="lst-swatch" style={{ backgroundColor: 'var(--lst-300)' }} title="#FFCB73" />
                  <div className="lst-swatch" style={{ backgroundColor: 'var(--lst-500)' }} title="#F28B50" />
                  <div className="lst-swatch" style={{ backgroundColor: 'var(--lst-700)' }} title="#D95757" />
                  <div className="lst-swatch" style={{ backgroundColor: 'var(--lst-900)' }} title="#963D63" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}

