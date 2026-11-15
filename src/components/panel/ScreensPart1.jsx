import { useState } from 'react'
import {
  COCHABAMBA_ZONES,
  CANDIDATE_FINDINGS_LIST,
} from '../../data/internalPanelData'
import { SharedGeoCanvas } from './SharedGeoCanvas'
import { DetectiveTendenciasScreen } from './DetectiveTendenciasScreen'
import CoberturaServiciosScreen from './CoberturaServiciosScreen'
import {
  NeonDonutChart,
  NeonSplineChart,
  NeonEqBarChart,
  NeonRadarChart,
  BivariateScatterPlot,
  RedMonicaDiurnalChart,
} from './FuturisticCharts'

const YEAR_LABELS = ['19', '20', '21', '22', '23', '24', '25', '26']

/* =========================================================================
   PANTALLA 01. DIAGNÓSTICO DISTRITAL (Antes Monitoreo General)
   "Cómo está hoy tu distrito: calor del suelo y vegetación, medidos por satélite en 2024."
   Datos 100% reales de internalPanelData.js y tendencias_distritos.json
   ========================================================================= */
export { DiagnosticoDistritalScreen, DiagnosticoDistritalScreen as MonitoreoGeneralScreen } from './DiagnosticoDistritalScreen'

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
          { lbl: 'FUENTES DISPONIBLES', val: '11 / 13', sub: 'Catálogos NASA/ESA + GAMC pend.', col: '#00BEFC', mod: 'gestion-datos' },
          { lbl: 'PERIODOS ANALIZADOS', val: '2019–26', sub: 'Época seca comparable', col: '#5CEA00', mod: 'explorador-territorial' },
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
                <h3>Estado vivo del ciclo científico LlajtaLab</h3>
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
                accent="#00BEFC"
              />
              <div className="neo-compact-feed">
                <div className="neo-feed-pill">
                  <i style={{ background: '#5CEA00' }} />
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
export function TerritorialExplorerScreen(props) {
  return <CoberturaServiciosScreen {...props} />
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
                    { label: '0.40–0.60 Medio', value: activeZone.spectralSplit[1], color: '#5CEA00' },
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
                    { name: activeZone.shortName, data: activeZone.annualNdvi, color: '#5CEA00', unit: '' },
                    { name: 'Referencia Tunari', data: COCHABAMBA_ZONES[0].annualNdvi, color: '#00BEFC', unit: '' },
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
                  { st: 'Posible recuperación', pct: activeZone.ndviDelta > 0 ? 29 : 12, col: '#5CEA00' },
                  { st: 'Comportamiento estable', pct: 46, col: '#00BEFC' },
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
                  { t: 'T1 · MAYO 2020', v: activeZone.annualNdvi[1], col: '#5CEA00' },
                  { t: 'T2 · MAYO 2025', v: activeZone.ndviIllustrative, col: '#00BEFC' },
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
                accent="#5CEA00"
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
                    background: pos ? '#5CEA00' : '#D95757',
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
   PANTALLA 02. DETECTIVE DE TENDENCIAS (Antes Inteligencia Térmica)
   "Descubre si una variable está cambiando en tu distrito y si el cambio es real"
   Mann-Kendall estacional, pendiente de Sen e IC 95% con datos reales de la NASA y GAMC
   ========================================================================= */
export function ThermalIntelligenceScreen(props) {
  return <DetectiveTendenciasScreen {...props} />
}

export { DetectiveTendenciasScreen }

/* =========================================================================
   PANTALLA 03. LLUVIAS E INUNDACIONES (Antes Relaciones Ambientales)
   NASA GPM IMERG V07, JRC GHSL, Cota 2750 y Río Rocha
   ========================================================================= */
export { default as LluviasInundacionesScreen, default as EnvironmentalRelationsScreen } from './LluviasInundacionesScreen'

