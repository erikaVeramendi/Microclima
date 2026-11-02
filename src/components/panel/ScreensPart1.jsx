import { useState } from 'react'
import {
  COCHABAMBA_ZONES,
  CANDIDATE_FINDINGS_LIST,
} from '../../data/internalPanelData'
import { SharedGeoCanvas } from './SharedGeoCanvas'
import {
  NeonKpiCard,
  NeonDonutChart,
  NeonSplineChart,
  NeonEqBarChart,
  ContouredIsoMap,
  SatellitePatchStrip,
  NeonRadarChart,
  BivariateScatterPlot,
} from './FuturisticCharts'

const YEAR_LABELS = ['19', '20', '21', '22', '23', '24', '25', '26']
const HOUR_LABELS = ['03H', '06H', '09H', '12H', '15H', '18H', '21H', '24H']

/* =========================================================================
   OPCIÓN 00 (PRIMERA AL ENTRAR). MONITOREO GENERAL (Resumen Ejecutivo HUD)
   ========================================================================= */
export function MonitoreoGeneralScreen({
  selectedZoneId,
  onSelectZone,
  onNavigateModule,
  onOpenAssistantWithPrompt,
}) {
  const [mapLayer, setMapLayer] = useState('dual')
  const activeZone =
    COCHABAMBA_ZONES.find((z) => z.id === selectedZoneId) || COCHABAMBA_ZONES[1]

  return (
    <div className="neo-screen">
      <section className="neo-kpi-strip">
        <NeonKpiCard
          icon="🔥"
          label="LST SUPERFICIAL (DEMO)"
          value={activeZone.lstIllustrative}
          unit="°C"
          delta={`${activeZone.thermalAnomaly > 0 ? '+' : ''}${activeZone.thermalAnomaly}° · LST≠Aire`}
          accent="#F28B50"
          sparkData={activeZone.annualLst}
          onClick={() => onNavigateModule('inteligencia-termica')}
        />
        <NeonKpiCard
          icon="🌿"
          label="HUELLA VERDE NDVI"
          value={activeZone.ndviIllustrative}
          unit="IDX"
          delta={`${activeZone.ndviDelta > 0 ? '+' : ''}${activeZone.ndviDelta} (S2 10m)`}
          accent="#43A875"
          sparkData={activeZone.annualNdvi}
          onClick={() => onNavigateModule('inteligencia-vegetacion')}
        />
        <NeonKpiCard
          icon="🛰"
          label="COBERTURA VÁLIDA QA"
          value={`${activeZone.validCoverage}%`}
          unit="SECA"
          delta="Sin interpolar vacíos"
          accent="#65C8F2"
          sparkData={[78, 82, 85, 81, 88, 91, 93, activeZone.validCoverage]}
          onClick={() => onNavigateModule('evidencia-validacion')}
        />
        <NeonKpiCard
          icon="⚡"
          label="CONFIANZA / EVIDENCIA"
          value={activeZone.evidenceLevel}
          unit=""
          delta={activeZone.elevation}
          accent="#8875D8"
          sparkData={[62, 68, 70, 74, 79, 82, 85, activeZone.validCoverage]}
          onClick={() => onNavigateModule('investigacion-descubrimiento')}
        />
      </section>

      <section className="neo-cockpit-3col">
        {/* Columna Izquierda */}
        <div className="neo-col-stack">
          <article className="neo-glass-card">
            <div className="neo-card-header">
              <div>
                <span className="neo-micro-tag">HUELLA VERDE × SUPERFICIE</span>
                <h3>Espectro · {activeZone.shortName}</h3>
              </div>
              <span className="neo-pill-badge neo-pill--emerald">NDVI ≠ ÁRBOLES</span>
            </div>

            <NeonDonutChart
              segments={[
                { label: 'Dosel Denso', value: activeZone.spectralSplit[0], color: '#43A875' },
                { label: 'Ripario / Parque', value: activeZone.spectralSplit[1], color: '#65C8F2' },
                { label: 'Transición', value: activeZone.spectralSplit[2], color: '#FFCB73' },
                { label: 'Impermeable', value: activeZone.spectralSplit[3], color: '#D95757' },
              ]}
              centerValue={String(activeZone.ndviIllustrative)}
              centerLabel="NDVI"
            />

            <NeonSplineChart
              series={[
                {
                  name: 'Memoria Verde NDVI',
                  data: activeZone.annualNdvi,
                  color: '#43A875',
                  unit: '',
                },
              ]}
              labels={YEAR_LABELS}
              height={114}
            />
          </article>

          <article className="neo-glass-card">
            <div className="neo-card-header">
              <div>
                <span className="neo-micro-tag">PULSO MULTIESPECTRAL</span>
                <h3>Cobertura por escena satelital</h3>
              </div>
              <span className="neo-pill-badge neo-pill--cyan">L9 + S2</span>
            </div>

            <NeonEqBarChart
              data={activeZone.eqPulses}
              accent="#65C8F2"
              secondaryAccent="#43A875"
              unit="%"
              height={104}
            />

            <SatellitePatchStrip zone={activeZone} />
          </article>
        </div>

        {/* Columna Central: Mapa Bioluminiscente */}
        <div className="neo-center-map-stage">
          <SharedGeoCanvas
            selectedZoneId={selectedZoneId}
            onSelectZone={onSelectZone}
            activeLayer={mapLayer}
            onLayerChange={setMapLayer}
            onNavigateModule={onNavigateModule}
            height={578}
          />
        </div>

        {/* Columna Derecha */}
        <div className="neo-col-stack">
          <article className="neo-glass-card">
            <div className="neo-card-header">
              <div>
                <span className="neo-micro-tag">RADAR TÉRMICO DEL VALLE</span>
                <h3>Contornos superficiales (LST)</h3>
              </div>
              <button
                type="button"
                className="neo-mini-link"
                onClick={() => onNavigateModule('inteligencia-termica')}
              >
                Radar →
              </button>
            </div>

            <ContouredIsoMap
              selectedZoneId={selectedZoneId}
              onSelectZone={onSelectZone}
            />
          </article>

          <article className="neo-glass-card">
            <div className="neo-card-header">
              <div>
                <span className="neo-micro-tag">EL HALLAZGO DEL DÍA · TRAZA</span>
                <h3>{CANDIDATE_FINDINGS_LIST[0].shortMetric} · Rocha vs. Centro</h3>
              </div>
              <span className="neo-pill-badge neo-pill--violet">CANDIDATO</span>
            </div>

            <NeonSplineChart
              series={[
                {
                  name: activeZone.shortName,
                  data: activeZone.diurnalLst,
                  color: '#F28B50',
                  unit: '°C',
                },
                {
                  name: 'Amortiguación Rocha',
                  data: COCHABAMBA_ZONES[1].diurnalLst,
                  color: '#65C8F2',
                  unit: '°C',
                },
              ]}
              labels={HOUR_LABELS}
              height={122}
            />

            <div className="neo-quick-ai-bar">
              <button
                type="button"
                className="neo-ai-glow-btn"
                onClick={() =>
                  onOpenAssistantWithPrompt &&
                  onOpenAssistantWithPrompt('¿Cuál es la zona con mayor anomalía térmica hoy?')
                }
              >
                ✦ Consultar IA TRAZA
              </button>
              <button
                type="button"
                className="neo-ghost-jump"
                onClick={() => onNavigateModule('centro-inteligencia')}
              >
                Centro Inteligencia →
              </button>
            </div>
          </article>
        </div>
      </section>
    </div>
  )
}

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
          { lbl: 'FUENTES DISPONIBLES', val: '11 / 13', sub: 'Catálogos NASA/ESA + GAMC pend.', col: '#65C8F2', mod: 'gestion-datos' },
          { lbl: 'PERIODOS ANALIZADOS', val: '2019–26', sub: 'Época seca comparable', col: '#43A875', mod: 'explorador-territorial' },
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
          {/* EL HALLAZGO DEL DÍA (Innovación clave TRAZA P1) */}
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
                <h3>Estado vivo del ciclo científico TRAZA</h3>
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
                accent="#65C8F2"
              />
              <div className="neo-compact-feed">
                <div className="neo-feed-pill">
                  <i style={{ background: '#43A875' }} />
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
   PANTALLA 02. EXPLORADOR TERRITORIAL
   Mapa 70% + 6 Grupos de Capas + Opacidad + Viaje Temporal sin interpolar vacíos
   ========================================================================= */
export function TerritorialExplorerScreen({
  selectedZoneId,
  onSelectZone,
  onNavigateModule,
}) {
  const [mapLayer, setMapLayer] = useState('parcelas')
  const [opacity, setOpacity] = useState(88)
  const [savedZones, setSavedZones] = useState(['corredor-rocha'])

  const activeZone =
    COCHABAMBA_ZONES.find((z) => z.id === selectedZoneId) || COCHABAMBA_ZONES[1]

  const toggleSaveZone = () => {
    setSavedZones((prev) =>
      prev.includes(selectedZoneId)
        ? prev.filter((id) => id !== selectedZoneId)
        : [...prev, selectedZoneId]
    )
  }

  return (
    <div className="neo-screen">
      {/* Barra superior compacta de herramientas espaciales y Viaje Temporal */}
      <div className="neo-toolbar-row">
        <div className="neo-pill-group">
          {[
            { id: 'lst', lbl: '🔥 Térmico (LST)' },
            { id: 'ndvi', lbl: '🌿 Vegetación (NDVI)' },
            { id: 'parcelas', lbl: '🏙 Territorio / OSM' },
            { id: 'elevacion', lbl: '⛰ Geografía (NASADEM)' },
            { id: 'dual', lbl: '👥 Población / Multicapa' },
            { id: 'vacios', lbl: '🛡 Evidencia y Vacíos' },
          ].map((c) => (
            <button
              key={c.id}
              type="button"
              className={`geo-hud-pill ${mapLayer === c.id ? 'is-active' : ''}`}
              onClick={() => setMapLayer(c.id)}
            >
              {c.lbl}
            </button>
          ))}
        </div>

        <div className="neo-pill-group">
          <span className="neo-pill-badge neo-pill--amber">
            15 DISTRITOS GAMC: PENDIENTE CARTOGRAFÍA OFICIAL
          </span>
          <button type="button" className="geo-hud-pill" onClick={toggleSaveZone}>
            {savedZones.includes(selectedZoneId) ? '★ Zona Guardada' : '☆ Guardar Zona'}
          </button>
        </div>
      </div>

      {/* Mapa 70% + Panel Derecho Contextual 30% */}
      <section className="neo-explorer-studio">
        <div className="neo-explorer-main">
          <div style={{ opacity: opacity / 100, transition: 'opacity 0.2s' }}>
            <SharedGeoCanvas
              selectedZoneId={selectedZoneId}
              onSelectZone={onSelectZone}
              activeLayer={mapLayer}
              onLayerChange={setMapLayer}
              enableCurtain={true}
              onNavigateModule={onNavigateModule}
              height={455}
            />
          </div>

          {/* INNOVACIÓN TRAZA: «Viaje Temporal por Cochabamba» SIN INTERPOLAR VACÍOS */}
          <article className="neo-glass-card">
            <div className="neo-card-header">
              <div>
                <span className="neo-micro-tag">
                  ✦ VIAJE TEMPORAL POR COCHABAMBA (SIN INTERPOLAR VACÍOS NUBOSOS)
                </span>
                <h3>Secuencia real de ventanas válidas vs. vacíos estacionales · Perfil Norte-Sur</h3>
              </div>
              <div className="neo-opacity-mini">
                <span>Opacidad {opacity}%</span>
                <input
                  type="range"
                  min="35"
                  max="100"
                  value={opacity}
                  onChange={(e) => setOpacity(Number(e.target.value))}
                />
              </div>
            </div>

            {/* Cinta visual de períodos mostrando explícitamente vacíos de época húmeda */}
            <div className="neo-temporal-gaps-strip">
              {[
                { p: 'SECA 2021', ok: true },
                { p: 'LLUVIA 22 (VACÍO NUBES)', ok: false },
                { p: 'SECA 2022', ok: true },
                { p: 'SECA 2023', ok: true },
                { p: 'LLUVIA 24 (VACÍO NUBES)', ok: false },
                { p: 'SECA 2024', ok: true },
                { p: 'SECA 2025', ok: true },
              ].map((slot) => (
                <span
                  key={slot.p}
                  className={`neo-gap-slot ${slot.ok ? 'is-valid' : 'is-gap'}`}
                >
                  {slot.ok ? '● ' : '⊘ '}
                  {slot.p}
                </span>
              ))}
            </div>

            <NeonSplineChart
              series={[
                {
                  name: 'Perfil Elevación / LST (°C)',
                  data: COCHABAMBA_ZONES.map((z) => z.lstIllustrative),
                  color: '#F28B50',
                  unit: '°C',
                },
                {
                  name: 'Vigor NDVI Escala',
                  data: COCHABAMBA_ZONES.map((z) => +(z.ndviIllustrative * 42).toFixed(1)),
                  color: '#43A875',
                  unit: '',
                },
              ]}
              labels={COCHABAMBA_ZONES.map((z) => z.shortName.slice(0, 9))}
              height={118}
            />
          </article>
        </div>

        {/* Panel Contextual Derecho */}
        <aside className="neo-col-stack">
          <article className="neo-glass-card">
            <div className="neo-card-header">
              <div>
                <span className="neo-micro-tag">{activeZone.coords}</span>
                <h3>{activeZone.shortName}</h3>
              </div>
              <span className="neo-pill-badge neo-pill--cyan">{activeZone.elevation}</span>
            </div>

            <NeonDonutChart
              segments={[
                { label: 'Dosel / Parque', value: activeZone.spectralSplit[0], color: '#43A875' },
                { label: 'Eje Ripario', value: activeZone.spectralSplit[1], color: '#65C8F2' },
                { label: 'Mixto', value: activeZone.spectralSplit[2], color: '#8875D8' },
                { label: 'Construido', value: activeZone.spectralSplit[3], color: '#F28B50' },
              ]}
              centerValue={`${activeZone.validCoverage}%`}
              centerLabel="QA VÁLIDO"
              size={132}
            />
          </article>

          <article className="neo-glass-card">
            <div className="neo-card-header">
              <div>
                <span className="neo-micro-tag">FIRMA MULTIBANDA & ACCESOS</span>
                <h3>Resolución S2 10m · L9 30m</h3>
              </div>
            </div>

            <div className="neo-multicolor-bars">
              {[
                { band: 'B2', val: 34, color: '#65C8F2' },
                { band: 'B3', val: 52, color: '#8BCB9A' },
                { band: 'B4', val: 28, color: '#D95757' },
                { band: 'NIR', val: Math.round(activeZone.ndviIllustrative * 115), color: '#43A875' },
                { band: 'SWIR', val: 64, color: '#8875D8' },
                { band: 'TIRS', val: Math.round(activeZone.lstIllustrative * 2.5), color: '#F28B50' },
              ].map((b) => (
                <div key={b.band} className="neo-mbar-col">
                  <div className="neo-mbar-track">
                    <div
                      className="neo-mbar-fill"
                      style={{ height: `${Math.min(100, b.val)}%`, backgroundColor: b.color }}
                    />
                  </div>
                  <span>{b.band}</span>
                </div>
              ))}
            </div>

            <SatellitePatchStrip zone={activeZone} />
          </article>
        </aside>
      </section>
    </div>
  )
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
      {/* Sub-navegación de las 4 capacidades de Vegetación (TRAZA P3 + P4) */}
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
                    { label: '0.40–0.60 Medio', value: activeZone.spectralSplit[1], color: '#43A875' },
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
                    { name: activeZone.shortName, data: activeZone.annualNdvi, color: '#43A875', unit: '' },
                    { name: 'Referencia Tunari', data: COCHABAMBA_ZONES[0].annualNdvi, color: '#65C8F2', unit: '' },
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
                  { st: 'Posible recuperación', pct: activeZone.ndviDelta > 0 ? 29 : 12, col: '#43A875' },
                  { st: 'Comportamiento estable', pct: 46, col: '#65C8F2' },
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
                  { t: 'T1 · MAYO 2020', v: activeZone.annualNdvi[1], col: '#43A875' },
                  { t: 'T2 · MAYO 2025', v: activeZone.ndviIllustrative, col: '#65C8F2' },
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
                accent="#43A875"
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
                    background: pos ? '#43A875' : '#D95757',
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
   PANTALLA 04. INTELIGENCIA TÉRMICA
   "El calor también deja patrones" · REGLA FIJA: LST ≠ TEMPERATURA DEL AIRE
   Integra: A. Radar de Cambio (Mann-Kendall / Sen) | B. Anomalía Contextual | C. Puntos de Inflexión (Ruptures)
   ========================================================================= */
export function ThermalIntelligenceScreen({
  selectedZoneId,
  onSelectZone,
  onNavigateModule,
}) {
  const [thermalTab, setThermalTab] = useState('radar-cambio') // 'radar-cambio' | 'anomalias' | 'inflexion'
  const activeZone =
    COCHABAMBA_ZONES.find((z) => z.id === selectedZoneId) || COCHABAMBA_ZONES[2]

  const senSlope = +(
    (activeZone.annualLst[7] - activeZone.annualLst[0]) / 7
  ).toFixed(2)

  return (
    <div className="neo-screen">
      <div className="neo-toolbar-row">
        <div>
          <span className="neo-micro-tag" style={{ color: '#FFCB73' }}>
            «EL CALOR TAMBIÉN DEJA PATRONES» · REGLA FUNDAMENTAL: LST SUPERFICIAL ≠ TEMPERATURA DEL AIRE
          </span>
        </div>
        <div className="neo-pill-group">
          {[
            { id: 'radar-cambio', lbl: '📡 A/B. Radar de Cambio (Sen & Mann-Kendall)' },
            { id: 'anomalias', lbl: '⚠ C. Anomalía Contextual' },
            { id: 'inflexion', lbl: '⚡ D. Puntos de Inflexión (Ruptures)' },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              className={`geo-hud-pill ${thermalTab === t.id ? 'is-active' : ''}`}
              onClick={() => setThermalTab(t.id)}
            >
              {t.lbl}
            </button>
          ))}
        </div>
      </div>

      <section className="neo-cockpit-3col">
        <div className="neo-center-map-stage" style={{ gridColumn: 'span 2' }}>
          <SharedGeoCanvas
            selectedZoneId={selectedZoneId}
            onSelectZone={onSelectZone}
            activeLayer="lst"
            onNavigateModule={onNavigateModule}
            height={455}
          />
        </div>

        <div className="neo-col-stack">
          {thermalTab === 'radar-cambio' && (
            <article className="neo-glass-card">
              <div className="neo-card-header">
                <div>
                  <span className="neo-micro-tag">✦ RADAR DE CAMBIO, NO SOLO DE CALOR</span>
                  <h3>Pendiente de Sen: +{senSlope} °C/año (Sup.)</h3>
                </div>
                <span className="neo-pill-badge neo-pill--amber">MANN-KENDALL</span>
              </div>

              {/* Las 5 clases térmicas de TRAZA P7 */}
              <div className="neo-zone-bars-list">
                {[
                  { z: 'trama-central', cls: 'Caliente + tendencia creciente', slp: '+0.26°/a', col: '#D95757' },
                  { z: 'expansion-sur', cls: 'Cambio rápido emergente (Itocta)', slp: '+0.34°/a', col: '#F28B50' },
                  { z: 'cuenca-alalay', cls: 'Cálida con tendencia moderada', slp: '+0.16°/a', col: '#FFCB73' },
                  { z: 'corredor-rocha', cls: 'Amortiguada / sin tendencia fuerte', slp: '+0.11°/a', col: '#65C8F2' },
                  { z: 'tunari-norte', cls: 'Evidencia parcial en lluvia', slp: '+0.12°/a', col: '#8BCB9A' },
                ].map((item) => (
                  <div
                    key={item.z}
                    className={`neo-zone-bar-item ${selectedZoneId === item.z ? 'is-selected' : ''}`}
                    onClick={() => onSelectZone(item.z)}
                  >
                    <div className="neo-zb-head">
                      <span>{item.cls}</span>
                      <strong style={{ color: item.col }}>{item.slp}</strong>
                    </div>
                  </div>
                ))}
              </div>

              <ContouredIsoMap selectedZoneId={selectedZoneId} onSelectZone={onSelectZone} />
            </article>
          )}

          {thermalTab === 'anomalias' && (
            <article className="neo-glass-card">
              <div className="neo-card-header">
                <div>
                  <span className="neo-micro-tag">✦ ANOMALÍA CONTEXTUAL ESTACIONAL</span>
                  <h3>Observado vs. línea base propia · {activeZone.shortName}</h3>
                </div>
                <span className="neo-pill-badge neo-pill--coral">
                  {activeZone.thermalAnomaly > 2 ? 'PERSISTENTE' : 'REPETIDA'}
                </span>
              </div>

              <NeonSplineChart
                series={[
                  { name: 'LST Observada', data: activeZone.diurnalLst, color: '#D95757', unit: '°C' },
                  {
                    name: 'Esperado Histórico',
                    data: activeZone.diurnalLst.map((v) => +(v - Math.max(0.8, activeZone.thermalAnomaly)).toFixed(1)),
                    color: '#65C8F2',
                    unit: '°C',
                  },
                ]}
                labels={HOUR_LABELS}
                height={155}
              />

              <NeonEqBarChart
                data={activeZone.eqPulses}
                accent="#F28B50"
                secondaryAccent="#D95757"
                unit="%"
                height={105}
              />
            </article>
          )}

          {thermalTab === 'inflexion' && (
            <article className="neo-glass-card">
              <div className="neo-card-header">
                <div>
                  <span className="neo-micro-tag">✦ HISTORIA DE TRANSFORMACIÓN (RUPTURES)</span>
                  <h3>Punto de inflexión detectado · Ventana 2022</h3>
                </div>
                <span className="neo-pill-badge neo-pill--violet">ANTES / DESPUÉS</span>
              </div>

              <div className="neo-4state-grid">
                <div className="neo-state-box" style={{ borderColor: '#65C8F255' }}>
                  <strong style={{ color: '#65C8F2' }}>{activeZone.annualLst[1]}°C</strong>
                  <span>Media Pre-2022</span>
                </div>
                <div className="neo-state-box" style={{ borderColor: '#D9575755' }}>
                  <strong style={{ color: '#D95757' }}>{activeZone.annualLst[7]}°C</strong>
                  <span>Media Post-2022</span>
                </div>
              </div>

              <NeonSplineChart
                series={[
                  { name: 'Trayectoria LST Superficial', data: activeZone.annualLst, color: '#FFCB73', unit: '°C' },
                ]}
                labels={YEAR_LABELS}
                height={155}
              />
            </article>
          )}
        </div>
      </section>
    </div>
  )
}

/* =========================================================================
   PANTALLA 05. RELACIONES AMBIENTALES
   Constructor X/Y + Método (Pearson/Spearman/Parcial) + Detector de Coincidencias + Grafo Dinámico
   ========================================================================= */
export function EnvironmentalRelationsScreen({
  selectedZoneId,
  onSelectZone,
}) {
  const [pairMode, setPairMode] = useState('ndvi-lst')
  const [statMethod, setStatMethod] = useState('Spearman')

  const pairConfigs = {
    'ndvi-lst': {
      xKey: 'ndviIllustrative',
      yKey: 'lstIllustrative',
      xLabel: 'NDVI (Sentinel-2 10m)',
      yLabel: 'LST Superficial °C (Landsat 30m)',
      rho: statMethod === 'Spearman' ? '−0.86' : statMethod === 'Pearson' ? '−0.83' : '−0.79 (Ctrl DEM)',
    },
    'imp-lst': {
      xKey: 'imperviousPct',
      yKey: 'lstIllustrative',
      xLabel: 'Densidad Edificada / Sellado % (OSM)',
      yLabel: 'LST Superficial °C (Landsat 30m)',
      rho: statMethod === 'Spearman' ? '+0.91' : '+0.89',
    },
    'elev-lst': {
      xKey: 'elevationNum',
      yKey: 'lstIllustrative',
      xLabel: 'Elevación m s.n.m. (NASADEM)',
      yLabel: 'LST Superficial °C (Landsat 30m)',
      rho: '−0.78',
    },
    'pop-lst': {
      xKey: 'popDensity',
      yKey: 'lstIllustrative',
      xLabel: 'Densidad Poblacional (WorldPop 100m)',
      yLabel: 'LST Superficial °C (Landsat 30m)',
      rho: '+0.84',
    },
  }
  const cfg = pairConfigs[pairMode]

  const matrixVars = ['LST', 'NDVI', 'EDIFIC.', 'DEM', 'POBLAC.']
  const matrixVals = [
    [1.0, -0.86, 0.91, -0.78, 0.84],
    [-0.86, 1.0, -0.88, 0.69, -0.79],
    [0.91, -0.88, 1.0, -0.64, 0.92],
    [-0.78, 0.69, -0.64, 1.0, -0.58],
    [0.84, -0.79, 0.92, -0.58, 1.0],
  ]

  return (
    <div className="neo-screen">
      {/* Constructor Visual de Relaciones + Selector Estadístico */}
      <div className="neo-toolbar-row">
        <div className="neo-pill-group">
          {[
            { id: 'ndvi-lst', label: '🌿 NDVI × 🔥 LST' },
            { id: 'imp-lst', label: '🏙 Edificaciones × 🔥 LST' },
            { id: 'elev-lst', label: '⛰ Elevación × 🔥 LST' },
            { id: 'pop-lst', label: '👥 WorldPop × 🔥 LST' },
          ].map((b) => (
            <button
              key={b.id}
              type="button"
              className={`geo-hud-pill ${pairMode === b.id ? 'is-active' : ''}`}
              onClick={() => setPairMode(b.id)}
            >
              {b.label}
            </button>
          ))}
        </div>

        <div className="neo-pill-group">
          {['Spearman', 'Pearson', 'Parcial (DEM)'].map((m) => (
            <button
              key={m}
              type="button"
              className={`geo-hud-pill ${statMethod === m ? 'is-active' : ''}`}
              onClick={() => setStatMethod(m)}
            >
              {m}
            </button>
          ))}
          <span className="neo-pill-badge neo-pill--violet">CORRELACIÓN ≠ CAUSALIDAD</span>
        </div>
      </div>

      {/* INNOVACIÓN TRAZA P5: «Detector de Coincidencias Ambientales» (5 Clases) */}
      <div className="neo-diverging-grid">
        {[
          { cls: '↓ NDVI + ↑ LST', sub: 'Itocta / Centro', z: 'expansion-sur', col: '#D95757' },
          { cls: '↑ NDVI + ↓ LST', sub: 'Corredor Rocha', z: 'corredor-rocha', col: '#43A875' },
          { cls: '= NDVI + ↑ LST', sub: 'Contradicción Alalay', z: 'cuenca-alalay', col: '#FFCB73' },
          { cls: '↓ NDVI + = LST', sub: 'Ladera Media', z: 'tunari-norte', col: '#65C8F2' },
          { cls: 'Datos Insuficientes', sub: 'Verano Nuboso', z: 'tunari-norte', col: '#8875D8' },
        ].map((item) => (
          <div
            key={item.cls}
            className={`neo-div-card ${selectedZoneId === item.z ? 'is-active' : ''}`}
            onClick={() => onSelectZone(item.z)}
          >
            <div className="neo-div-top">
              <strong style={{ color: item.col }}>{item.cls}</strong>
            </div>
            <small>{item.sub}</small>
          </div>
        ))}
      </div>

      <section className="neo-split-7-5">
        <article className="neo-glass-card">
          <div className="neo-card-header">
            <div>
              <span className="neo-micro-tag">DIAGRAMA DE DISPERSIÓN SINCRONIZADO ({statMethod})</span>
              <h3>{cfg.xLabel} vs. {cfg.yLabel}</h3>
            </div>
            <span className="neo-pill-badge neo-pill--cyan">Coef: {cfg.rho} · n=70</span>
          </div>

          <BivariateScatterPlot
            zones={COCHABAMBA_ZONES}
            selectedZoneId={selectedZoneId}
            onSelectZone={onSelectZone}
            xKey={cfg.xKey}
            yKey={cfg.yKey}
            xLabel={cfg.xLabel}
            yLabel={cfg.yLabel}
          />
        </article>

        <article className="neo-glass-card">
          <div className="neo-card-header">
            <div>
              <span className="neo-micro-tag">MATRIZ MULTIVARIABLE + GRAFO DE ACOPLAMIENTO</span>
              <h3>Interacción de 5 factores territoriales</h3>
            </div>
          </div>

          <div className="neo-corr-matrix">
            <div className="neo-corr-row neo-corr-head">
              <span />
              {matrixVars.map((v) => (
                <span key={v}>{v}</span>
              ))}
            </div>
            {matrixVars.map((rowName, rIdx) => (
              <div key={rowName} className="neo-corr-row">
                <span className="neo-corr-label">{rowName}</span>
                {matrixVals[rIdx].map((val, cIdx) => {
                  const bg =
                    val === 1
                      ? 'rgba(148,163,184,0.18)'
                      : val > 0
                        ? `rgba(242, 139, 80, ${Math.abs(val) * 0.65})`
                        : `rgba(101, 200, 242, ${Math.abs(val) * 0.65})`
                  return (
                    <div key={cIdx} className="neo-corr-cell" style={{ backgroundColor: bg }}>
                      {val > 0 && val !== 1 ? `+${val}` : val}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  )
}
