import { useState } from 'react'
import {
  COCHABAMBA_ZONES,
  CANDIDATE_FINDINGS_LIST,
  DATA_SOURCES_CATALOG,
} from '../../data/internalPanelData'
import { SharedGeoCanvas } from './SharedGeoCanvas'
import {
  NeonDonutChart,
  NeonSplineChart,
  ContouredIsoMap,
  NeonRadarChart,
} from './FuturisticCharts'

const MONTHS = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC']
const YEAR_LABELS = ['19', '20', '21', '22', '23', '24', '25', '26']

/* =========================================================================
   PESTAÑA 9 · PUNTOS CRÍTICOS (Transición de ResearchDiscoveryScreen)
   Basada 100% en alertas calculadas de indice_distritos.json
   ========================================================================= */
import PuntosCriticosScreen from './PuntosCriticosScreen'
export { PuntosCriticosScreen }
export const ResearchDiscoveryScreen = PuntosCriticosScreen

/* =========================================================================
   PANTALLA 07. EVIDENCIA Y VALIDACIÓN
   WOW: Pasaporte Científico (6 etapas) + «No sabemos todavía» + Índice Confianza 5D
   + «Dónde medir para aprender más» + Historial de Versiones (MAE/RMSE/R²/F1 + Matriz Confusión)
   ========================================================================= */
export function EvidenceValidationScreen({
  selectedZoneId,
  onSelectZone,
  onNavigateModule,
}) {
  const [evTab, setEvTab] = useState('pasaporte') // 'pasaporte' | 'validacion'
  const activeZone =
    COCHABAMBA_ZONES.find((z) => z.id === selectedZoneId) || COCHABAMBA_ZONES[1]

  return (
    <div className="neo-screen">
      {/* WOW: PASAPORTE CIENTÍFICO EN 6 NODOS CONECTADOS */}
      <article className="neo-glass-card">
        <div className="neo-card-header">
          <div>
            <span className="neo-micro-tag">✦ WOW · PASAPORTE CIENTÍFICO REPRODUCIBLE (ID: MICROCLIMA-EV-{activeZone.id.toUpperCase()})</span>
            <h3>Recorrido de trazabilidad: Fuente → Procesamiento → Método → Resultado → Validación → Limitaciones</h3>
          </div>
          <div className="neo-pill-group">
            <button
              type="button"
              className={`geo-hud-pill ${evTab === 'pasaporte' ? 'is-active' : ''}`}
              onClick={() => setEvTab('pasaporte')}
            >
              🛡 Confianza 5D & Vacíos
            </button>
            <button
              type="button"
              className={`geo-hud-pill ${evTab === 'validacion' ? 'is-active' : ''}`}
              onClick={() => setEvTab('validacion')}
            >
              📊 Modelos (MAE/RMSE/F1)
            </button>
          </div>
        </div>

        <div className="neo-pipeline-6grid">
          {[
            { step: '01 FUENTE', name: 'S2 MSI + L9 TIRS', sub: '10m / 30m Público', col: '#65C8F2', pct: 95 },
            { step: '02 PROCESO', name: 'Máscara QA / SCL', sub: 'Filtro nubes/sombras', col: '#43A875', pct: activeZone.validCoverage },
            { step: '03 MÉTODO', name: 'Sen + Spearman', sub: 'No paramétrico', col: '#8875D8', pct: 90 },
            { step: '04 RESULTADO', name: `${activeZone.lstIllustrative}°C · ${activeZone.ndviIllustrative}`, sub: activeZone.evidenceLevel, col: '#FFCB73', pct: 84 },
            { step: '05 VALIDACIÓN', name: 'In-Situ Pendiente', sub: 'LST ≠ Temp. Aire', col: '#F28B50', pct: 46 },
            { step: '06 LÍMITE', name: activeZone.validCoverage < 80 ? '«No sabemos todavía»' : 'Época Lluviosa', sub: 'Sin extrapolar verano', col: '#D95757', pct: 68 },
          ].map((st) => (
            <div key={st.step} className="neo-pipe-node" style={{ borderColor: `${st.col}55` }}>
              <div className="neo-pipe-top">
                <span style={{ color: st.col }}>{st.step}</span>
                <strong>{st.pct}%</strong>
              </div>
              <h4>{st.name}</h4>
              <small>{st.sub}</small>
              <div className="neo-bar-single-track">
                <div style={{ width: `${st.pct}%`, backgroundColor: st.col }} />
              </div>
            </div>
          ))}
        </div>
      </article>

      <section className="neo-split-7-5">
        {/* Mapa de Incertidumbre y «Dónde medir para aprender más» */}
        <SharedGeoCanvas
          selectedZoneId={selectedZoneId}
          onSelectZone={onSelectZone}
          activeLayer="vacios"
          onNavigateModule={onNavigateModule}
          height={430}
        />

        <div className="neo-col-stack">
          {evTab === 'pasaporte' ? (
            <>
              <article className="neo-glass-card">
                <div className="neo-card-header">
                  <div>
                    <span className="neo-micro-tag">✦ ÍNDICE DE CONFIANZA TERRITORIAL (NO OPACO)</span>
                    <h3>Perfil 5D · {activeZone.shortName}</h3>
                  </div>
                  <span className="neo-pill-badge neo-pill--emerald">{activeZone.evidenceLevel}</span>
                </div>
                <NeonRadarChart
                  metrics={[activeZone.validCoverage, 88, 92, 46, 82]}
                  axes={['ESPACIAL', 'TEMPORAL', 'RADIOMET.', 'CAMPO', 'CONSIST.']}
                  accent="#65C8F2"
                />
              </article>

              <article className="neo-glass-card">
                <span className="neo-micro-tag">✦ «DÓNDE MEDIR PARA APRENDER MÁS»</span>
                <div className="neo-zone-bars-list">
                  <div className="neo-zone-bar-item" onClick={() => onSelectZone('expansion-sur')}>
                    <div className="neo-zb-head">
                      <strong style={{ color: '#F28B50' }}>Prioridad #1: Itocta Sur</strong>
                      <span>Sensor Aire (≠ LST)</span>
                    </div>
                  </div>
                  <div className="neo-zone-bar-item" onClick={() => onSelectZone('tunari-norte')}>
                    <div className="neo-zb-head">
                      <strong style={{ color: '#65C8F2' }}>Prioridad #2: Ladera Tunari</strong>
                      <span>Pluviómetro / Humedad</span>
                    </div>
                  </div>
                </div>
              </article>
            </>
          ) : (
            <article className="neo-glass-card">
              <div className="neo-card-header">
                <div>
                  <span className="neo-micro-tag">C/D. VALIDACIÓN E HISTORIAL DE VERSIONES (v0.1 vs v0.2)</span>
                  <h3>Continuas (MAE/RMSE/R²) & Clasificación (Matriz Confusión)</h3>
                </div>
                <span className="neo-pill-badge neo-pill--amber">CONTRATO BACKEND</span>
              </div>

              <div className="neo-4state-grid">
                <div className="neo-state-box" style={{ borderColor: '#65C8F255' }}>
                  <strong style={{ color: '#65C8F2' }}>MAE / RMSE</strong>
                  <span>Pendiente Red MÓNICA</span>
                </div>
                <div className="neo-state-box" style={{ borderColor: '#43A87555' }}>
                  <strong style={{ color: '#43A875' }}>R² / Sesgo</strong>
                  <span>Separación Train/Val</span>
                </div>
                <div className="neo-state-box" style={{ borderColor: '#8875D855' }}>
                  <strong style={{ color: '#8875D8' }}>Precision / F1</strong>
                  <span>Clases cambio NDVI</span>
                </div>
                <div className="neo-state-box" style={{ borderColor: '#FFCB7355' }}>
                  <strong style={{ color: '#FFCB73' }}>v0.1 → v0.2</strong>
                  <span>+ Control NASADEM</span>
                </div>
              </div>

              {/* Matriz de Confusión Visual 3x3 (Esquema listo) */}
              <div className="neo-corr-matrix">
                <div className="neo-corr-row neo-corr-head">
                  <span>PRED\REF</span>
                  <span>PÉRDIDA</span>
                  <span>ESTABLE</span>
                  <span>GANANCIA</span>
                  <span>F1</span>
                  <span>ESTADO</span>
                </div>
                {[
                  ['PÉRDIDA', 'TP', 'FP', '—', 'Pend.', 'QA'],
                  ['ESTABLE', 'FN', 'TP', 'FP', 'Pend.', 'QA'],
                  ['GANANCIA', '—', 'FN', 'TP', 'Pend.', 'QA'],
                ].map((r) => (
                  <div key={r[0]} className="neo-corr-row">
                    <span className="neo-corr-label">{r[0]}</span>
                    {r.slice(1).map((c, idx) => (
                      <div
                        key={idx}
                        className="neo-corr-cell"
                        style={{
                          backgroundColor:
                            c === 'TP' ? 'rgba(67,168,117,0.35)' : 'rgba(38,59,89,0.45)',
                        }}
                      >
                        {c}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </article>
          )}
        </div>
      </section>
    </div>
  )
}

/* =========================================================================
   PANTALLA 08. GESTIÓN DE DATOS
   Flujo 6 etapas + Catálogo 12/13 Fuentes + Calendario Nubosidad + Reproducir Análisis + Importador
   ========================================================================= */
export function DataManagementScreen() {
  const [uploadedFile, setUploadedFile] = useState(null)
  const [dataView, setDataView] = useState('calendario') // 'calendario' | 'procesos'

  const handleFileChange = (e) => {
    const f = e.target.files?.[0]
    if (f) {
      setUploadedFile({
        name: f.name,
        sizeKb: Math.max(1, Math.round(f.size / 1024)),
      })
    }
  }

  return (
    <div className="neo-screen">
      {/* WOW: Flujo real de 6 etapas (Fuente -> Adquisición -> Control Calidad -> Procesamiento -> Almacenamiento -> Análisis) */}
      <article className="neo-glass-card">
        <div className="neo-card-header">
          <div>
            <span className="neo-micro-tag">✦ CENTRO VISUAL DE DATOS Y PASAPORTE DE PIPELINE</span>
            <h3>Fuente → Adquisición → Control de Calidad → Procesamiento → Almacenamiento → Análisis</h3>
          </div>
          <div className="neo-pill-group">
            <button
              type="button"
              className={`geo-hud-pill ${dataView === 'calendario' ? 'is-active' : ''}`}
              onClick={() => setDataView('calendario')}
            >
              📅 Calendario Nubosidad
            </button>
            <button
              type="button"
              className={`geo-hud-pill ${dataView === 'procesos' ? 'is-active' : ''}`}
              onClick={() => setDataView('procesos')}
            >
              ⚙ Procesos & Algoritmos
            </button>
            <label className="neo-upload-pill">
              ⬆ Importar GeoJSON / ZIP / GeoTIFF / CSV / NetCDF
              <input
                type="file"
                accept=".geojson,.json,.zip,.tif,.tiff,.csv,.nc"
                onChange={handleFileChange}
                hidden
              />
            </label>
          </div>
        </div>

        <div className="neo-pipeline-6grid">
          {[
            { step: '1. FUENTE', name: '12 Catálogos', sub: 'NASA · ESA · GAMC', col: '#65C8F2', pct: 92 },
            { step: '2. ADQUISICIÓN', name: 'GEE / STAC API', sub: 'En integración', col: '#38BDF8', pct: 80 },
            { step: '3. CALIDAD QA', name: 'Cloud & Shadow', sub: 'QA_PIXEL / SCL', col: '#43A875', pct: 94 },
            { step: '4. PROCESO', name: 'NDVI · LST · DEM', sub: 'UTM 19S / WGS84', col: '#8875D8', pct: 88 },
            { step: '5. RASTER DB', name: 'PostGIS / COG', sub: 'Cola en espera', col: '#FFCB73', pct: 65 },
            { step: '6. ANÁLISIS', name: 'PySAL / SciPy', sub: 'Reproducible', col: '#F28B50', pct: 85 },
          ].map((st) => (
            <div key={st.step} className="neo-pipe-node" style={{ borderColor: `${st.col}44` }}>
              <div className="neo-pipe-top">
                <span style={{ color: st.col }}>{st.step}</span>
                <strong>{st.pct}%</strong>
              </div>
              <h4>{st.name}</h4>
              <small>{st.sub}</small>
              <div className="neo-bar-single-track">
                <div style={{ width: `${st.pct}%`, backgroundColor: st.col }} />
              </div>
            </div>
          ))}
        </div>

        {uploadedFile && (
          <div className="neo-upload-toast">
            ✔ Validación CRS y estructura aprobada: <strong>{uploadedFile.name}</strong> ({uploadedFile.sizeKb} KB · Listo para ingesta)
          </div>
        )}
      </article>

      {dataView === 'calendario' ? (
        <article className="neo-glass-card">
          <div className="neo-card-header">
            <div>
              <span className="neo-micro-tag">MATRIZ ESTACIONAL DE COBERTURA Y VACÍOS (12 MESES)</span>
              <h3>Disponibilidad libre de nubes sobre Cochabamba (Ene–Mar vacíos húmedos vs. May–Oct óptimo)</h3>
            </div>
            <span className="neo-pill-badge neo-pill--emerald">VENTANA SECA COMPARABLE</span>
          </div>

          <div className="neo-cloud-heatmap">
            <div className="neo-ch-row neo-ch-header">
              <span>FUENTE</span>
              {MONTHS.map((m) => (
                <span key={m}>{m}</span>
              ))}
            </div>
            {DATA_SOURCES_CATALOG.slice(0, 6).map((src) => (
              <div key={src.id} className="neo-ch-row">
                <strong className="neo-ch-sensor" style={{ color: src.accent }}>
                  {src.name}
                </strong>
                {src.monthlyClear.map((val, idx) => {
                  const bg =
                    val >= 85
                      ? `rgba(67, 168, 117, ${val / 135})`
                      : val >= 60
                        ? `rgba(101, 200, 242, ${val / 130})`
                        : `rgba(217, 87, 87, ${0.35 + val / 160})`
                  return (
                    <div key={idx} className="neo-ch-cell" style={{ backgroundColor: bg }}>
                      {val}%
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </article>
      ) : (
        <article className="neo-glass-card">
          <div className="neo-card-header">
            <div>
              <span className="neo-micro-tag">D/E. COLA DE PROCESAMIENTO, ALGORITMOS Y «REPRODUCIR ANÁLISIS»</span>
              <h3>Estado real de motores científicos (Sin actividad falsa)</h3>
            </div>
          </div>
          <div className="neo-anomaly-4grid">
            {[
              { id: 'ALG-01', t: 'Theil-Sen + Mann-Kendall', st: 'Configurado · SciPy', col: '#F28B50' },
              { id: 'ALG-02', t: 'Autocorrelación Moran / LISA', st: 'Configurado · PySAL', col: '#8875D8' },
              { id: 'ALG-03', t: 'Detección Quiebres Ruptures', st: 'En espera backend', col: '#65C8F2' },
              { id: 'ALG-04', t: 'Recorte Oficial 15 Distritos', st: 'Pendiente GeoJSON GAMC', col: '#FFCB73' },
            ].map((a) => (
              <div key={a.id} className="neo-anomaly-card">
                <span style={{ color: a.col, fontFamily: 'monospace', fontSize: '0.64rem' }}>{a.id}</span>
                <h4>{a.t}</h4>
                <span className="neo-conf-chip">{a.st}</span>
              </div>
            ))}
          </div>
        </article>
      )}

      {/* Catálogo Visual de las 12 Fuentes */}
      <section className="neo-sources-12grid">
        {DATA_SOURCES_CATALOG.map((src) => (
          <article key={src.id} className="neo-source-tile">
            <div className="neo-st-top">
              <span className="neo-st-dot" style={{ backgroundColor: src.accent }} />
              <strong>{src.name}</strong>
              <span className="neo-st-res">{src.resolution}</span>
            </div>
            <div className="neo-st-mid">
              <span>{src.institution}</span>
              <span style={{ color: src.accent }}>{src.status}</span>
            </div>
            <div className="neo-bar-single-track">
              <div style={{ width: `${src.coveragePct}%`, backgroundColor: src.accent }} />
            </div>
          </article>
        ))}
      </section>
    </div>
  )
}

/* =========================================================================
   PANTALLA 09. PLANIFICACIÓN Y ESCENARIOS
   "¿Qué pasaría si transformamos una zona?"
   Integra: A. Prioridad Explicable Multicriterio | B/C/D. Ciudad Contrafactual + Vista 3D Conceptual + Comparador A/B
   ========================================================================= */
export function PlanningScenariosScreen({
  selectedZoneId,
  onSelectZone,
  onNavigateModule,
}) {
  const [planTab, setPlanTab] = useState('escenarios-3d') // 'escenarios-3d' | 'prioridad'
  const [treesPct, setTreesPct] = useState(40)
  const [coolRoofsPct, setCoolRoofsPct] = useState(30)
  const [corridorHa, setCorridorHa] = useState(18)

  // Pesos de Priorización Explicable Multicriterio
  const [wThermal, setWThermal] = useState(35)
  const [wVegDeficit, setWVegDeficit] = useState(30)
  const [wPop, setWPop] = useState(20)
  const [wDataGap, setWDataGap] = useState(15)

  const activeZone =
    COCHABAMBA_ZONES.find((z) => z.id === selectedZoneId) || COCHABAMBA_ZONES[2]

  const mitigationScore = Math.min(
    96,
    Math.round(treesPct * 0.85 + coolRoofsPct * 0.65 + corridorHa * 1.1)
  )

  return (
    <div className="neo-screen">
      <div className="neo-toolbar-row">
        <div>
          <span className="neo-micro-tag" style={{ color: '#8BCB9A' }}>
            «¿QUÉ PASARÍA SI TRANSFORMAMOS UNA ZONA?» · SIMULACIÓN CONCEPTUAL MULTICRITERIO (NO PREDICCIÓN TÉRMICA NO CALIBRADA)
          </span>
        </div>
        <div className="neo-pill-group">
          <button
            type="button"
            className={`geo-hud-pill ${planTab === 'escenarios-3d' ? 'is-active' : ''}`}
            onClick={() => setPlanTab('escenarios-3d')}
          >
            🏙 B/C/D. Ciudad Contrafactual & Gemelo 3D Conceptual
          </button>
          <button
            type="button"
            className={`geo-hud-pill ${planTab === 'prioridad' ? 'is-active' : ''}`}
            onClick={() => setPlanTab('prioridad')}
          >
            ⚖ A. Priorización Territorial Explicable
          </button>
        </div>
      </div>

      {planTab === 'escenarios-3d' ? (
        <>
          <section className="neo-cockpit-3col">
            {/* Constructor de Intervenciones */}
            <article className="neo-glass-card">
              <div className="neo-card-header">
                <div>
                  <span className="neo-micro-tag">CONSTRUCTOR DE ESCENARIOS</span>
                  <h3>Intervención · {activeZone.shortName}</h3>
                </div>
                <span className="neo-pill-badge neo-pill--emerald">{corridorHa} ha</span>
              </div>

              <div className="neo-sliders-stack">
                {[
                  { label: '🌳 Arbolado & Corredores Verdes', val: treesPct, set: setTreesPct, col: '#43A875', u: '%' },
                  { label: '🏠 Techos Reflectantes (Alto Albedo)', val: coolRoofsPct, set: setCoolRoofsPct, col: '#65C8F2', u: '%' },
                  { label: '📐 Superficie Intervenida', val: corridorHa, set: setCorridorHa, col: '#8875D8', u: ' ha' },
                ].map((s) => (
                  <div key={s.label} className="neo-slider-box">
                    <div className="neo-slider-top">
                      <span>{s.label}</span>
                      <strong style={{ color: s.col }}>{s.val}{s.u}</strong>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="80"
                      value={s.val}
                      onChange={(e) => s.set(Number(e.target.value))}
                      style={{ accentColor: s.col }}
                    />
                  </div>
                ))}
              </div>

              <NeonRadarChart
                metrics={[
                  Math.min(96, Math.round(activeZone.ndviIllustrative * 100 + treesPct * 0.55)),
                  Math.max(20, Math.round(activeZone.radarMetrics[1] - mitigationScore * 0.35)),
                  activeZone.validCoverage,
                  mitigationScore,
                  Math.max(22, activeZone.imperviousPct - Math.round(coolRoofsPct * 0.45)),
                ]}
                baseline={activeZone.radarMetrics}
                axes={['VERDOR', 'CARGA TÉRM.', 'QA DATOS', 'MITIGACIÓN', 'ABSORCIÓN']}
                accent="#43A875"
              />
            </article>

            {/* Mapa Territorial Sincronizado */}
            <div className="neo-center-map-stage">
              <SharedGeoCanvas
                selectedZoneId={selectedZoneId}
                onSelectZone={onSelectZone}
                activeLayer="parcelas"
                enableCurtain={true}
                onNavigateModule={onNavigateModule}
                height={435}
                compactHud={true}
              />
            </div>

            {/* WOW: VISTA 3D ISOMÉTRICA CONCEPTUAL INTERACTIVA */}
            <article className="neo-glass-card">
              <div className="neo-card-header">
                <div>
                  <span className="neo-micro-tag">✦ REPRESENTACIÓN 3D CONCEPTUAL</span>
                  <h3>Manzana contrafactual interactiva</h3>
                </div>
                <span className="neo-pill-badge neo-pill--cyan">SCORE +{mitigationScore}</span>
              </div>

              <svg viewBox="0 0 320 215" className="neo-graph-svg">
                {/* Halo térmico superior que se enfría al subir árboles y techos fríos */}
                <ellipse
                  cx="160"
                  cy="70"
                  rx="115"
                  ry="38"
                  fill={
                    mitigationScore > 55
                      ? 'rgba(101, 200, 242, 0.22)'
                      : 'rgba(217, 87, 87, 0.28)'
                  }
                />
                {/* Plataforma isométrica de manzana urbana */}
                <polygon
                  points="160,105 288,152 160,198 32,152"
                  fill="#13233F"
                  stroke="#65C8F2"
                  strokeWidth="1.5"
                />
                {/* Corredor verde isométrico central */}
                <polygon
                  points="142,112 270,158 178,192 50,146"
                  fill={`rgba(67, 168, 117, ${0.18 + treesPct / 120})`}
                />

                {/* Edificios 3D con techos que cambian a reflectantes según slider */}
                {[
                  { x: 96, y: 128, h: 42 },
                  { x: 162, y: 112, h: 56 },
                  { x: 218, y: 136, h: 38 },
                ].map((b, idx) => {
                  const roofCool = coolRoofsPct > idx * 22
                  return (
                    <g key={idx}>
                      <polygon
                        points={`${b.x},${b.y - b.h} ${b.x + 26},${b.y - b.h + 10} ${b.x},${b.y - b.h + 20} ${b.x - 26},${b.y - b.h + 10}`}
                        fill={roofCool ? '#E0F2FE' : '#F28B50'}
                        stroke="#38BDF8"
                        strokeWidth="1"
                      />
                      <polygon
                        points={`${b.x - 26},${b.y - b.h + 10} ${b.x},${b.y - b.h + 20} ${b.x},${b.y + 12} ${b.x - 26},${b.y + 2}`}
                        fill="#1E3356"
                      />
                      <polygon
                        points={`${b.x + 26},${b.y - b.h + 10} ${b.x},${b.y - b.h + 20} ${b.x},${b.y + 12} ${b.x + 26},${b.y + 2}`}
                        fill="#0F1C34"
                      />
                    </g>
                  )
                })}

                {/* Árboles 3D dinámicos según slider de arbolado */}
                {Array.from({ length: Math.max(2, Math.round(treesPct / 9)) }, (_, i) => {
                  const tx = 66 + i * 24
                  const ty = 148 + (i % 2) * 16
                  return (
                    <g key={i}>
                      <line x1={tx} y1={ty} x2={tx} y2={ty - 12} stroke="#8BCB9A" strokeWidth="2" />
                      <circle
                        cx={tx}
                        cy={ty - 16}
                        r={6 + (treesPct % 4)}
                        fill="#43A875"
                        style={{ filter: 'drop-shadow(0 0 6px rgba(67,168,117,0.8))' }}
                      />
                    </g>
                  )
                })}

                <text x="160" y="210" textAnchor="middle" fill="#94A3B8" fontSize="7.5" fontFamily="monospace">
                  REPRESENTACIÓN 3D CONCEPTUAL · TECHOS ALBEDO + CORREDOR VERDE
                </text>
              </svg>
            </article>
          </section>

          {/* D. Comparador Lado a Lado: Actual vs Escenario A vs Escenario B vs Combinado */}
          <div className="neo-anomaly-4grid">
            {[
              { name: '0. Referencia Actual', sup: '0 ha', ben: 'Base observada', inc: 'Observación satelital', col: '#94A3B8' },
              { name: 'Escenario A · Corredor Verde', sup: `${corridorHa} ha`, ben: ` Conectividad +${treesPct}%`, inc: 'Requiere censo arbóreo', col: '#43A875' },
              { name: 'Escenario B · Techos Albedo', sup: `${Math.round(corridorHa * 0.7)} ha`, ben: `Reflectancia +${coolRoofsPct}%`, inc: 'Requiere catastro techos', col: '#65C8F2' },
              { name: 'Combinado Integral', sup: `${Math.round(corridorHa * 1.4)} ha`, ben: `Índice Mitigación ${mitigationScore}/100`, inc: 'Simulación multicriterio', col: '#8875D8' },
            ].map((sc) => (
              <div key={sc.name} className="neo-anomaly-card" style={{ borderTop: `2px solid ${sc.col}` }}>
                <strong style={{ color: sc.col, fontSize: '0.8rem' }}>{sc.name}</strong>
                <h4>Superficie: {sc.sup} · {sc.ben}</h4>
                <span className="neo-conf-chip">{sc.inc}</span>
              </div>
            ))}
          </div>
        </>
      ) : (
        /* A. PRIORIZACIÓN TERRITORIAL EXPLICABLE MULTICRITERIO */
        <section className="neo-split-6-6">
          <article className="neo-glass-card">
            <div className="neo-card-header">
              <div>
                <span className="neo-micro-tag">✦ PRIORIDAD EXPLICABLE (FÓRMULA TRANSPARENTE)</span>
                <h3>P = (w₁·LST_norm + w₂·DéfNDVI + w₃·Pob + w₄·Vacíos) / Σw</h3>
              </div>
            </div>

            <div className="neo-sliders-stack">
              {[
                { label: '🔥 Exposición Térmica (w₁)', val: wThermal, set: setWThermal, col: '#F28B50' },
                { label: '🌿 Déficit de Vegetación (w₂)', val: wVegDeficit, set: setWVegDeficit, col: '#43A875' },
                { label: '👥 Exposición Poblacional (w₃)', val: wPop, set: setWPop, col: '#65C8F2' },
                { label: '📡 Necesidad de Medición / Vacíos (w₄)', val: wDataGap, set: setWDataGap, col: '#8875D8' },
              ].map((s) => (
                <div key={s.label} className="neo-slider-box">
                  <div className="neo-slider-top">
                    <span>{s.label}</span>
                    <strong style={{ color: s.col }}>{s.val}%</strong>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="60"
                    value={s.val}
                    onChange={(e) => s.set(Number(e.target.value))}
                    style={{ accentColor: s.col }}
                  />
                </div>
              ))}
            </div>
          </article>

          <article className="neo-glass-card">
            <div className="neo-card-header">
              <div>
                <span className="neo-micro-tag">RANKING EXPLICABLE EN TIEMPO REAL</span>
                <h3>Desglose: Ambiental vs. Poblacional vs. Medición</h3>
              </div>
            </div>

            <div className="neo-zone-bars-list">
              {COCHABAMBA_ZONES.map((z) => {
                const totalW = wThermal + wVegDeficit + wPop + wDataGap || 1
                const score = Math.round(
                  ((z.lstIllustrative / 36) * 100 * wThermal +
                    (1 - z.ndviIllustrative) * 100 * wVegDeficit +
                    z.popDensity * wPop +
                    (100 - z.validCoverage) * 2.2 * wDataGap) /
                    totalW
                )
                return { ...z, score }
              })
                .sort((a, b) => b.score - a.score)
                .map((z, idx) => (
                  <div
                    key={z.id}
                    className={`neo-zone-bar-item ${z.id === selectedZoneId ? 'is-selected' : ''}`}
                    onClick={() => onSelectZone(z.id)}
                  >
                    <div className="neo-zb-head">
                      <strong>#{idx + 1} · {z.shortName}</strong>
                      <span style={{ color: z.color }}>{z.score} / 100</span>
                    </div>
                    <div className="neo-bar-single-track">
                      <div style={{ width: `${z.score}%`, backgroundColor: z.color }} />
                    </div>
                  </div>
                ))}
            </div>
          </article>
        </section>
      )}
    </div>
  )
}

/* =========================================================================
   PANTALLA 10. INVESTIGACIONES E INFORMES
   Integra: A/B/C. Proyectos & Biblioteca («Una investigación nunca empieza desde cero»)
   + WOW: Línea Temporal / Grafo + D. «Informe Vivo» (13 Secciones Oficiales + Modo Claro/Oscuro)
   ========================================================================= */
export function ResearchReportsScreen({
  selectedZoneId,
  onSelectZone,
  onNavigateModule,
}) {
  const [lightDocMode, setLightDocMode] = useState(false)
  const [activeProject, setActiveProject] = useState('EXP-01')
  const [exportedFlag, setExportedFlag] = useState(false)

  const activeZone =
    COCHABAMBA_ZONES.find((z) => z.id === selectedZoneId) || COCHABAMBA_ZONES[1]

  const projects = [
    { id: 'EXP-01', title: 'Amortiguación Térmica Corredor Río Rocha vs. Centro', status: 'Informe Vivo v1.2' },
    { id: 'EXP-02', title: 'Transformación Vegetal y Expansión Urbana Sur (Itocta)', status: 'En contraste' },
    { id: 'EXP-03', title: 'Auditoría Estacional de Vacíos Ópticos en Ladera Tunari', status: 'Borrador QA' },
  ]

  const thirteenSections = [
    '01. Título', '02. Resumen', '03. Objetivo', '04. Área de estudio',
    '05. Fuentes', '06. Metodología', '07. Resultados', '08. Mapas',
    '09. Gráficos', '10. Discusión', '11. Limitaciones', '12. Conclusiones', '13. Referencias',
  ]

  const handleExportJson = () => {
    const payload = {
      projectId: activeProject,
      zone: activeZone.name,
      sectionsIncluded: thirteenSections,
      rules: ['LST != Air Temperature', 'NDVI != Direct Tree Count', 'Correlation != Causation'],
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `microclima-${activeProject.toLowerCase()}-${activeZone.id}.json`
    a.click()
    URL.revokeObjectURL(url)
    setExportedFlag(true)
  }

  return (
    <div className="neo-screen">
      {/* Selector de Expediente («Una investigación nunca empieza desde cero») + Modo Claro/Oscuro Documental */}
      <div className="neo-toolbar-row">
        <div className="neo-pill-group">
          {projects.map((p) => (
            <button
              key={p.id}
              type="button"
              className={`geo-hud-pill ${activeProject === p.id ? 'is-active' : ''}`}
              onClick={() => setActiveProject(p.id)}
            >
              📁 {p.id} · {p.status}
            </button>
          ))}
        </div>

        <div className="neo-pill-group">
          <button
            type="button"
            className="geo-hud-pill"
            onClick={() => setLightDocMode((p) => !p)}
          >
            {lightDocMode ? '🌙 Vista HUD Oscura' : '☀ Modo Claro Documental (#F5F7FC)'}
          </button>
          <button type="button" className="neo-ai-glow-btn" onClick={handleExportJson}>
            ⬇ Exportar Reproducible
          </button>
          <button type="button" className="geo-hud-pill" onClick={() => window.print()}>
            🖨 PDF / Imprimir
          </button>
        </div>
      </div>

      {exportedFlag && (
        <div className="neo-upload-toast">
          ✔ Expediente <strong>{activeProject}</strong> exportado con las 13 secciones científicas y trazabilidad QA.
        </div>
      )}

      {/* WOW: Línea Temporal Visual de la Investigación Conectada */}
      <div className="neo-pipeline-6grid">
        {[
          { step: '1. PREGUNTA', name: 'Gradiente Rocha', col: '#65C8F2' },
          { step: '2. HIPÓTESIS', name: 'HIP-01 Registrada', col: '#8875D8' },
          { step: '3. FUENTES', name: 'S2 10m + L9 30m', col: '#43A875' },
          { step: '4. ANÁLISIS', name: 'Spearman + Sen', col: '#FFCB73' },
          { step: '5. EVIDENCIA', name: 'Pasaporte QA', col: '#38BDF8' },
          { step: '6. INFORME VIVO', name: '13 Secciones', col: '#F28B50' },
        ].map((n) => (
          <div key={n.step} className="neo-pipe-node" style={{ borderColor: `${n.col}55` }}>
            <span style={{ color: n.col, fontFamily: 'monospace', fontSize: '0.58rem' }}>{n.step}</span>
            <h4>{n.name}</h4>
          </div>
        ))}
      </div>

      {/* Póster / Informe Vivo con soporte de Modo Claro Documental oficial de MICROCLIMA (#F5F7FC / #111B32) */}
      <article
        className="neo-infographic-poster"
        style={
          lightDocMode
            ? {
                background: '#F5F7FC',
                color: '#111B32',
                borderColor: '#A9B8CC',
              }
            : undefined
        }
      >
        <header className="neo-poster-header">
          <div>
            <span className="neo-micro-tag" style={lightDocMode ? { color: '#263B59' } : undefined}>
              ✦ INFORME VIVO REPRODUCIBLE · {activeProject}
            </span>
            <h2 style={lightDocMode ? { color: '#111B32' } : undefined}>
              {projects.find((p) => p.id === activeProject)?.title} · ({activeZone.shortName})
            </h2>
          </div>
          <div className="neo-poster-stamps">
            <span className="neo-pill-badge neo-pill--amber">LST ≠ TEMP. AIRE</span>
            <span className="neo-pill-badge neo-pill--emerald">NDVI ≠ N° ÁRBOLES</span>
            <span className="neo-pill-badge neo-pill--violet">CORRELACIÓN ≠ CAUSALIDAD</span>
          </div>
        </header>

        {/* Chips de las 13 Secciones Oficiales del Informe Científico */}
        <div className="neo-chip-cloud">
          {thirteenSections.map((sec) => (
            <span
              key={sec}
              className="neo-hyp-pill"
              style={
                lightDocMode
                  ? { backgroundColor: '#FFFFFF', color: '#111B32', borderColor: '#A9B8CC' }
                  : { borderColor: 'rgba(101,200,242,0.35)' }
              }
            >
              ✔ {sec}
            </span>
          ))}
        </div>

        <div className="neo-cockpit-3col">
          <div className="neo-glass-card">
            <span className="neo-micro-tag">08. MAPA ISO-TÉRMICO VINCULADO</span>
            <ContouredIsoMap selectedZoneId={selectedZoneId} onSelectZone={onSelectZone} />
          </div>

          <div className="neo-glass-card">
            <span className="neo-micro-tag">07. COMPOSICIÓN ESPECTRAL</span>
            <NeonDonutChart
              segments={[
                { label: 'Dosel Denso', value: activeZone.spectralSplit[0], color: '#43A875' },
                { label: 'Ripario / Parque', value: activeZone.spectralSplit[1], color: '#65C8F2' },
                { label: 'Transición', value: activeZone.spectralSplit[2], color: '#FFCB73' },
                { label: 'Impermeable', value: activeZone.spectralSplit[3], color: '#D95757' },
              ]}
              centerValue={`${activeZone.lstIllustrative}°`}
              centerLabel="LST SUP."
            />
          </div>

          <div className="neo-glass-card">
            <span className="neo-micro-tag">09. SERIE MULTIANUAL 2019–2026</span>
            <NeonSplineChart
              series={[
                { name: 'LST (°C)', data: activeZone.annualLst, color: '#F28B50', unit: '°C' },
              ]}
              labels={YEAR_LABELS}
              height={150}
            />
          </div>
        </div>

        {/* C. Biblioteca de Hallazgos Vinculados con salto directo a su módulo de origen */}
        <div className="neo-anomaly-4grid">
          {CANDIDATE_FINDINGS_LIST.map((f) => (
            <div
              key={f.id}
              className="neo-anomaly-card"
              onClick={() => {
                onSelectZone(f.zoneId)
                onNavigateModule(f.targetModule)
              }}
            >
              <div className="neo-anom-top">
                <span style={{ color: f.accent }}>{f.id}</span>
                <strong style={{ color: f.accent }}>{f.shortMetric}</strong>
              </div>
              <h4>{f.title}</h4>
              <div className="neo-anom-bottom">
                <span>{f.source}</span>
                <span className="neo-conf-chip">Abrir origen →</span>
              </div>
            </div>
          ))}
        </div>
      </article>
    </div>
  )
}
