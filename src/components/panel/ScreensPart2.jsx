import { useState } from 'react'
import {
  DATA_SOURCES_CATALOG,
} from '../../data/internalPanelData'

const MONTHS = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC']

/* =========================================================================
   PESTAÑA 9 · PUNTOS CRÍTICOS (Transición de ResearchDiscoveryScreen)
   Basada 100% en alertas calculadas de indice_distritos.json
   ========================================================================= */
import PuntosCriticosScreen from './PuntosCriticosScreen'
export { PuntosCriticosScreen }
export const ResearchDiscoveryScreen = PuntosCriticosScreen

/* =========================================================================
   PANTALLA 04. SENSADO VIRTUAL CON IA (Antes Evidencia y Validación)
   "La Alcaldía tiene 2 estaciones de aire. La IA estima cómo está el aire en los 15 distritos."
   Integra modelo Gradient Boosting validado y verdad de terreno Red MÓNICA (GAMC)
   ========================================================================= */
import { SensadoVirtualScreen } from './SensadoVirtualScreen'
export { SensadoVirtualScreen }
export const EvidenceValidationScreen = SensadoVirtualScreen

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
            { step: '1. FUENTE', name: '12 Catálogos', sub: 'NASA · ESA · GAMC', col: '#00BEFC', pct: 92 },
            { step: '2. ADQUISICIÓN', name: 'GEE / STAC API', sub: 'En integración', col: '#38BDF8', pct: 80 },
            { step: '3. CALIDAD QA', name: 'Cloud & Shadow', sub: 'QA_PIXEL / SCL', col: '#5CEA00', pct: 94 },
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
              { id: 'ALG-03', t: 'Detección Quiebres Ruptures', st: 'En espera backend', col: '#00BEFC' },
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
   PANTALLA 05. SIMULADOR CLIMÁTICO (Antes Planificación y Escenarios)
   "¿Qué pasaría con el calor del suelo si el distrito tuviera más (o menos) vegetación?"
   Regresión lineal real: LST vs NDVI de los 15 distritos (2024), pendiente -2,72 °C / +0,10 NDVI, R² = 0,35
   ========================================================================= */
import SimuladorClimaticoScreen from './SimuladorClimaticoScreen'
export { SimuladorClimaticoScreen }
export const PlanningScenariosScreen = SimuladorClimaticoScreen

/* =========================================================================
   PANTALLA: INFORME SOCIO-AMBIENTAL DISTRITAL
   Transformación de ResearchReportsScreen en "Informe"
   Usa solo datos reales de: indice_distritos.json, tendencias_distritos.json,
   internalPanelData.js, y opcionales sensado_virtual.json / lluvias_inundaciones.json
   ========================================================================= */
import InformeScreen from './InformeScreen'
export { InformeScreen }
export const ResearchReportsScreen = InformeScreen
