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
   PANTALLA 00. MODO DETECTIVE (Antes Centro de Inteligencia)
   Conviértete en detective de datos: elige qué investigar y dónde.
   ========================================================================= */
export { default as ModoDetectiveScreen, default as IntelligenceCenterScreen } from './ModoDetectiveScreen'

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

