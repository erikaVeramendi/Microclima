import { useState, useMemo } from 'react'
import './InternalPlatform.css'
import {
  TEN_MODULES,
  COCHABAMBA_ZONES,
  CANDIDATE_FINDINGS_LIST,
  DATA_SOURCES_CATALOG,
  SCIENTIFIC_GLOSSARY_TERMS,
  SYSTEM_NOTIFICATIONS,
} from '../data/internalPanelData'
import {
  MonitoreoGeneralScreen,
  IntelligenceCenterScreen,
  TerritorialExplorerScreen,
  VegetationIntelligenceScreen,
  ThermalIntelligenceScreen,
  EnvironmentalRelationsScreen,
} from './panel/ScreensPart1'
import {
  ResearchDiscoveryScreen,
  EvidenceValidationScreen,
  DataManagementScreen,
  PlanningScenariosScreen,
  ResearchReportsScreen,
} from './panel/ScreensPart2'

function ModuleSidebarIcon({ type }) {
  switch (type) {
    case 'pulse':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
      )
    case 'radar':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
          <circle cx="12" cy="12" r="10" />
          <circle cx="12" cy="12" r="6" />
          <line x1="12" y1="12" x2="19" y2="5" />
        </svg>
      )
    case 'map':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
          <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
          <line x1="8" y1="2" x2="8" y2="18" />
          <line x1="16" y1="6" x2="16" y2="22" />
        </svg>
      )
    case 'leaf':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
          <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
          <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
        </svg>
      )
    case 'thermometer':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
          <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z" />
        </svg>
      )
    case 'network':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
          <circle cx="18" cy="5" r="3" />
          <circle cx="6" cy="12" r="3" />
          <circle cx="18" cy="19" r="3" />
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
          <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
        </svg>
      )
    case 'sparkles':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
          <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z" />
        </svg>
      )
    case 'shield':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      )
    case 'database':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
          <ellipse cx="12" cy="5" rx="9" ry="3" />
          <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
          <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
        </svg>
      )
    case 'sliders':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
          <line x1="4" y1="21" x2="4" y2="14" />
          <line x1="4" y1="10" x2="4" y2="3" />
          <line x1="12" y1="21" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12" y2="3" />
          <line x1="20" y1="21" x2="20" y2="16" />
          <line x1="20" y1="12" x2="20" y2="3" />
        </svg>
      )
    default:
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
      )
  }
}

export function InternalPlatform({ userSession, onLogout }) {
  const [activeModuleId, setActiveModuleId] = useState('monitoreo-general')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  // Contexto Territorial y Temporal Compartido entre los 10 módulos (C.2)
  const [selectedZoneId, setSelectedZoneId] = useState('corredor-rocha')
  const [selectedPeriod, setSelectedPeriod] = useState('Estación Seca 2025 (Demostrativo)')

  // Buscador Global Inteligente (C.1)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchFocused, setSearchFocused] = useState(false)

  // Paneles Transversales: IA Contextual (B), Notificaciones (C.4), Glosario (C.5), Comparador Universal (C.3)
  const [aiDrawerOpen, setAiDrawerOpen] = useState(false)
  const [aiHistory, setAiHistory] = useState([])
  const [aiInput, setAiInput] = useState('')
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [glossaryOpen, setGlossaryOpen] = useState(false)
  const [comparatorOpen, setComparatorOpen] = useState(false)
  const [compZoneA, setCompZoneA] = useState('corredor-rocha')
  const [compZoneB, setCompZoneB] = useState('trama-central')
  const [savedOpen, setSavedOpen] = useState(false)
  const [savedViews, setSavedViews] = useState([
    { id: 'fav-1', label: 'Río Rocha · Térmico', moduleId: 'inteligencia-termica', zoneId: 'corredor-rocha' },
    { id: 'fav-2', label: 'Itocta · Escenarios 3D', moduleId: 'planificacion-escenarios', zoneId: 'expansion-sur' },
  ])

  const activeModule =
    TEN_MODULES.find((m) => m.id === activeModuleId) || TEN_MODULES[0]
  const activeZone =
    COCHABAMBA_ZONES.find((z) => z.id === selectedZoneId) || COCHABAMBA_ZONES[1]

  // Resultados agrupados del Buscador Global Inteligente (C.1)
  const groupedSearchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return null

    const modulesMatch = TEN_MODULES.filter(
      (m) => m.title.toLowerCase().includes(q) || m.subtitle.toLowerCase().includes(q)
    )
    const zonesMatch = COCHABAMBA_ZONES.filter(
      (z) => z.name.toLowerCase().includes(q) || z.districtRef.toLowerCase().includes(q)
    )
    const sourcesMatch = DATA_SOURCES_CATALOG.filter(
      (s) => s.name.toLowerCase().includes(q) || s.type.toLowerCase().includes(q)
    )
    const findingsMatch = CANDIDATE_FINDINGS_LIST.filter(
      (f) => f.title.toLowerCase().includes(q) || f.variable.toLowerCase().includes(q)
    )

    return { modulesMatch, zonesMatch, sourcesMatch, findingsMatch }
  }, [searchQuery])

  // Generación de respuesta estructurada honesta del Asistente IA Contextual (Sección B)
  const triggerAiPrompt = (promptText) => {
    setAiDrawerOpen(true)
    setAiHistory((prev) => [
      {
        id: prev.length + 1,
        role: activeModule.aiRole,
        question: promptText,
        observed: `En el contexto de "${activeZone.name}" (${selectedPeriod}), se dispone de metadatos satelitales preconfigurados (Sentinel-2 10m y Landsat 8/9 30m) con cobertura válida estimada del ${activeZone.validCoverage}%.`,
        explanations:
          'Las variaciones observadas pueden responder a cambios en cobertura vegetal, materiales impermeables de techo/calzada, gradiente altitudinal (NASADEM) o estacionalidad hídrica.',
        availableEvidence: `Catálogos públicos NASA/USGS y Copernicus listos; nivel de evidencia actual en la zona: ${activeZone.evidenceLevel}.`,
        missingEvidence:
          'Cartografía oficial validada de los 15 distritos (GAMC) y series de temperatura del aire de estaciones terrestres para calibración.',
        recommendation:
          'Contrastar en ventanas estacionales equivalentes (época seca) y verificar el Pasaporte Científico en el módulo de Evidencia y Validación.',
        sourceNote:
          'Origen de respuesta: Reglas metodológicas y metadatos del frontend (Proveedor LLM de backend pendiente de conexión; no se inventan mediciones).',
      },
      ...prev,
    ])
  }

  const handleAiFormSubmit = (e) => {
    e.preventDefault()
    if (!aiInput.trim()) return
    triggerAiPrompt(aiInput.trim())
    setAiInput('')
  }

  const renderActiveScreen = () => {
    const commonProps = {
      selectedZoneId,
      onSelectZone: setSelectedZoneId,
      selectedPeriod,
      onPeriodChange: setSelectedPeriod,
      onNavigateModule: setActiveModuleId,
      onOpenAssistantWithPrompt: triggerAiPrompt,
    }

    switch (activeModuleId) {
      case 'monitoreo-general':
        return <MonitoreoGeneralScreen {...commonProps} />
      case 'centro-inteligencia':
        return <IntelligenceCenterScreen {...commonProps} />
      case 'explorador-territorial':
        return <TerritorialExplorerScreen {...commonProps} />
      case 'inteligencia-vegetacion':
        return <VegetationIntelligenceScreen {...commonProps} />
      case 'inteligencia-termica':
        return <ThermalIntelligenceScreen {...commonProps} />
      case 'relaciones-ambientales':
        return <EnvironmentalRelationsScreen {...commonProps} />
      case 'investigacion-descubrimiento':
        return <ResearchDiscoveryScreen {...commonProps} />
      case 'evidencia-validacion':
        return <EvidenceValidationScreen {...commonProps} />
      case 'gestion-datos':
        return <DataManagementScreen {...commonProps} />
      case 'planificacion-escenarios':
        return <PlanningScenariosScreen {...commonProps} />
      case 'investigaciones-informes':
        return <ResearchReportsScreen {...commonProps} />
      default:
        return <MonitoreoGeneralScreen {...commonProps} />
    }
  }

  const zoneObjA = COCHABAMBA_ZONES.find((z) => z.id === compZoneA) || COCHABAMBA_ZONES[0]
  const zoneObjB = COCHABAMBA_ZONES.find((z) => z.id === compZoneB) || COCHABAMBA_ZONES[2]

  return (
    <div className="mon-shell">
      {/* =========================================================
          A.3. BARRA LATERAL FIJA, CONTRAÍBLE Y CON LOS 10 MÓDULOS
         ========================================================= */}
      <aside
        className={`mon-sidebar ${sidebarCollapsed ? 'is-collapsed' : ''}`}
        aria-label="Navegación principal de los 10 módulos"
      >
        <div className="mon-sidebar-brand">
          <div className="mon-logo-box" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 32 32" fill="none">
              <circle cx="16" cy="16" r="11" stroke="#65C8F2" strokeWidth="2" />
              <path
                d="M7 18C10.5 12.5 14.5 20 18 13.5C20.5 9.5 22.8 15 25.5 12"
                stroke="#43A875"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
              <circle cx="18" cy="13.5" r="2.6" fill="#FFCB73" />
            </svg>
          </div>
          {!sidebarCollapsed && (
            <div className="mon-brand-text">
              <strong>MICROCLIMA</strong>
              <span>LABORATORIO AMBIENTAL</span>
            </div>
          )}
          <button
            type="button"
            className="mon-collapse-btn"
            onClick={() => setSidebarCollapsed((p) => !p)}
            aria-label={sidebarCollapsed ? 'Expandir barra lateral' : 'Contraer barra lateral'}
          >
            {sidebarCollapsed ? '»' : '«'}
          </button>
        </div>

        <nav className="mon-sidebar-nav">
          {/* BLOQUE ENFOQUE 1: MICROCLIMAS CON IA (NASA × IA) */}
          <div className="mon-nav-group">
            {!sidebarCollapsed && (
              <div
                className="mon-nav-group-title"
                style={{
                  color: '#38BDF8',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span>ENFOQUE 1 · MICROCLIMAS</span>
                <span
                  style={{
                    fontSize: '0.52rem',
                    padding: '0.1rem 0.35rem',
                    borderRadius: '4px',
                    background: 'rgba(56,189,248,0.15)',
                    color: '#7DD3FC',
                    fontWeight: 700,
                  }}
                >
                  NASA × IA
                </span>
              </div>
            )}
            <div className="mon-nav-items">
              {TEN_MODULES.filter((m) => m.enfoque === 1).map((mod) => {
                const isActive = mod.id === activeModuleId
                return (
                  <button
                    key={mod.id}
                    type="button"
                    className={`mon-nav-btn ${isActive ? 'is-active' : ''}`}
                    onClick={() => setActiveModuleId(mod.id)}
                    title={mod.title}
                    style={
                      isActive
                        ? {
                            borderColor: `${mod.accent}66`,
                            boxShadow: `inset 3px 0 0 ${mod.accent}, 0 8px 22px -10px ${mod.accent}66`,
                          }
                        : undefined
                    }
                  >
                    <span
                      className="mon-nav-icon"
                      style={{ color: isActive ? mod.accent : 'inherit' }}
                    >
                      <ModuleSidebarIcon type={mod.icon} />
                    </span>
                    {!sidebarCollapsed && (
                      <span className="mon-nav-label">{mod.shortLabel}</span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* BLOQUE ENFOQUE 2: GESTIÓN DISTRITAL (GAMC × ALCALDÍA) */}
          <div className="mon-nav-group" style={{ marginTop: '0.85rem' }}>
            {!sidebarCollapsed && (
              <div
                className="mon-nav-group-title"
                style={{
                  color: '#34D399',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span>ENFOQUE 2 · GESTIÓN DISTRITAL</span>
                <span
                  style={{
                    fontSize: '0.52rem',
                    padding: '0.1rem 0.35rem',
                    borderRadius: '4px',
                    background: 'rgba(52,211,153,0.15)',
                    color: '#A7F3D0',
                    fontWeight: 700,
                  }}
                >
                  GAMC
                </span>
              </div>
            )}
            <div className="mon-nav-items">
              {TEN_MODULES.filter((m) => m.enfoque === 2).map((mod) => {
                const isActive = mod.id === activeModuleId
                return (
                  <button
                    key={mod.id}
                    type="button"
                    className={`mon-nav-btn ${isActive ? 'is-active' : ''}`}
                    onClick={() => setActiveModuleId(mod.id)}
                    title={mod.title}
                    style={
                      isActive
                        ? {
                            borderColor: `${mod.accent}66`,
                            boxShadow: `inset 3px 0 0 ${mod.accent}, 0 8px 22px -10px ${mod.accent}66`,
                          }
                        : undefined
                    }
                  >
                    <span
                      className="mon-nav-icon"
                      style={{ color: isActive ? mod.accent : 'inherit' }}
                    >
                      <ModuleSidebarIcon type={mod.icon} />
                    </span>
                    {!sidebarCollapsed && (
                      <span className="mon-nav-label">{mod.shortLabel}</span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </nav>

        {/* Contexto Territorial Compartido en el Pie de la Barra Lateral */}
        {!sidebarCollapsed && (
          <div className="mon-shared-context-box">
            <span className="mon-shared-label">ZONA ACTIVA COMPARTIDA</span>
            <select
              value={selectedZoneId}
              onChange={(e) => setSelectedZoneId(e.target.value)}
              className="mon-shared-select"
              aria-label="Zona activa sincronizada entre módulos"
            >
              {COCHABAMBA_ZONES.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="mon-sidebar-footer">
          <button type="button" className="mon-logout-btn" onClick={onLogout} title="Cerrar sesión">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            {!sidebarCollapsed && <span>Cerrar sesión</span>}
          </button>
        </div>
      </aside>

      {/* =========================================================
          A.3. ÁREA PRINCIPAL Y BARRA SUPERIOR COMPLETA
         ========================================================= */}
      <div className="mon-main-area">
        <header className="mon-topbar">
          {/* Nombre del módulo + Breadcrumbs */}
          <div className="mon-topbar-left">
            <span
              className="mon-active-dot"
              style={{ backgroundColor: activeModule.accent }}
            />
            <div>
              <nav className="mon-breadcrumbs" aria-label="Ruta de navegación">
                <span>Laboratorio</span>
                <span>/</span>
                <span style={{ color: activeModule.accent }}>{activeModule.title}</span>
                <span>/</span>
                <span style={{ color: '#8BCB9A' }}>{activeZone.name}</span>
              </nav>
              <div className="mon-active-title-row">
                <h1>{activeModule.title}</h1>
              </div>
            </div>
          </div>

          {/* Buscador Global Inteligente + Estado de Procesamiento + Herramientas + IA + Notificaciones + Perfil */}
          <div className="mon-topbar-controls">
            {/* C.1. Buscador Global Inteligente */}
            <div className="global-search-wrapper">
              <input
                type="search"
                placeholder="Buscar zonas, variables, fuentes, hallazgos..."
                value={searchQuery}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="global-search-input"
                aria-label="Buscador global inteligente"
              />
              {searchFocused && groupedSearchResults && (
                <div className="global-search-dropdown" role="listbox">
                  {groupedSearchResults.modulesMatch.length > 0 && (
                    <div className="search-group">
                      <span className="search-group-title">MÓDULOS</span>
                      {groupedSearchResults.modulesMatch.map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          className="search-result-btn"
                          onMouseDown={() => {
                            setActiveModuleId(m.id)
                            setSearchQuery('')
                          }}
                        >
                          {m.title}
                        </button>
                      ))}
                    </div>
                  )}
                  {groupedSearchResults.zonesMatch.length > 0 && (
                    <div className="search-group">
                      <span className="search-group-title">ZONAS TERRITORIALES</span>
                      {groupedSearchResults.zonesMatch.map((z) => (
                        <button
                          key={z.id}
                          type="button"
                          className="search-result-btn"
                          onMouseDown={() => {
                            setSelectedZoneId(z.id)
                            setSearchQuery('')
                          }}
                        >
                          {z.name}
                        </button>
                      ))}
                    </div>
                  )}
                  {groupedSearchResults.sourcesMatch.length > 0 && (
                    <div className="search-group">
                      <span className="search-group-title">FUENTES CIENTÍFICAS</span>
                      {groupedSearchResults.sourcesMatch.map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          className="search-result-btn"
                          onMouseDown={() => {
                            setActiveModuleId('gestion-datos')
                            setSearchQuery('')
                          }}
                        >
                          {s.name} ({s.institution})
                        </button>
                      ))}
                    </div>
                  )}
                  {groupedSearchResults.findingsMatch.length > 0 && (
                    <div className="search-group">
                      <span className="search-group-title">HALLAZGOS CANDIDATOS</span>
                      {groupedSearchResults.findingsMatch.map((f) => (
                        <button
                          key={f.id}
                          type="button"
                          className="search-result-btn"
                          onMouseDown={() => {
                            setSelectedZoneId(f.zoneId)
                            setActiveModuleId(f.targetModule)
                            setSearchQuery('')
                          }}
                        >
                          {f.id} · {f.title}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Estado de Procesamiento */}
            <button
              type="button"
              className="topbar-chip-btn"
              onClick={() => setActiveModuleId('gestion-datos')}
              title="Ver estado de procesamiento y fuentes"
            >
              <span className="status-led status-led--ready" />
              <span>Procesos: En espera</span>
            </button>

            {/* C.6. Favoritos y Espacios Guardados */}
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                className="topbar-chip-btn"
                onClick={() => setSavedOpen((p) => !p)}
              >
                ★ Guardados ({savedViews.length})
              </button>
              {savedOpen && (
                <div className="notifications-popover">
                  <div className="notif-header">ESPACIOS Y VISTAS GUARDADAS</div>
                  <button
                    type="button"
                    className="neo-ai-glow-btn"
                    onClick={() => {
                      setSavedViews((prev) => [
                        {
                          id: `fav-${prev.length + 1}`,
                          label: `${activeZone.shortName} · ${activeModule.shortLabel}`,
                          moduleId: activeModuleId,
                          zoneId: selectedZoneId,
                        },
                        ...prev,
                      ])
                    }}
                  >
                    + Guardar vista actual
                  </button>
                  {savedViews.map((sv) => (
                    <div
                      key={sv.id}
                      className="notif-item"
                      onClick={() => {
                        setSelectedZoneId(sv.zoneId)
                        setActiveModuleId(sv.moduleId)
                        setSavedOpen(false)
                      }}
                    >
                      <strong>★ {sv.label}</strong>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* C.3. Comparador Universal */}
            <button
              type="button"
              className="topbar-chip-btn"
              onClick={() => setComparatorOpen((p) => !p)}
            >
              ⇄ Comparador
            </button>

            {/* C.5. Glosario Científico */}
            <button
              type="button"
              className="topbar-chip-btn"
              onClick={() => setGlossaryOpen((p) => !p)}
            >
              📖 Glosario
            </button>

            {/* B. Acceso al Asistente de IA Contextual */}
            <button
              type="button"
              className="topbar-ai-btn"
              onClick={() => setAiDrawerOpen((p) => !p)}
            >
              ✦ Asistente IA
            </button>

            {/* C.4. Notificaciones Inteligentes */}
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                className="topbar-icon-btn"
                onClick={() => setNotificationsOpen((p) => !p)}
                aria-label="Notificaciones del sistema"
              >
                🔔
                <span className="notif-count">{SYSTEM_NOTIFICATIONS.length}</span>
              </button>
              {notificationsOpen && (
                <div className="notifications-popover">
                  <div className="notif-header">NOTIFICACIONES INTELIGENTES</div>
                  {SYSTEM_NOTIFICATIONS.map((n) => (
                    <div
                      key={n.id}
                      className="notif-item"
                      onClick={() => {
                        setActiveModuleId(n.moduleTarget)
                        setNotificationsOpen(false)
                      }}
                    >
                      <strong>{n.title}</strong>
                      <p>{n.detail}</p>
                      <span>{n.time}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Perfil del Usuario */}
            <div className="mon-user-badge">
              <span className="mon-live-pulse" />
              <span>{userSession?.identifier?.split('@')[0] || 'Investigador'}</span>
            </div>
          </div>
        </header>

        {/* Cinta Interactiva de Foco Zonal + Ciclo Conectado TRAZA */}
        <div className="neo-zone-ribbon" role="tablist" aria-label="Selector rápido de zonas y ciclo científico">
          <div className="neo-ribbon-group">
            <span className="neo-ribbon-tag">ZONA:</span>
            {COCHABAMBA_ZONES.map((z) => {
              const isSel = z.id === selectedZoneId
              return (
                <button
                  key={z.id}
                  type="button"
                  role="tab"
                  aria-selected={isSel}
                  className={`neo-zone-chip ${isSel ? 'is-active' : ''}`}
                  onClick={() => setSelectedZoneId(z.id)}
                  style={isSel ? { borderColor: z.color, boxShadow: `0 0 14px -3px ${z.color}88` } : undefined}
                >
                  <i style={{ backgroundColor: z.color }} />
                  <span>{z.shortName}</span>
                  <strong>{z.lstIllustrative}°</strong>
                </button>
              )
            })}
          </div>

          <div className="neo-cycle-stepper" aria-label="Ciclo conectado de investigación TRAZA">
            {[
              { step: 'Detectar', mod: 'centro-inteligencia' },
              { step: 'Investigar', mod: 'explorador-territorial' },
              { step: 'Contrastar', mod: 'relaciones-ambientales' },
              { step: 'Verificar', mod: 'evidencia-validacion' },
              { step: 'Simular', mod: 'planificacion-escenarios' },
              { step: 'Documentar', mod: 'investigaciones-informes' },
            ].map((c, idx) => (
              <button
                key={c.step}
                type="button"
                className={`neo-cycle-btn ${activeModuleId === c.mod ? 'is-active' : ''}`}
                onClick={() => setActiveModuleId(c.mod)}
              >
                <span>{idx + 1}.</span> {c.step}
              </button>
            ))}
          </div>
        </div>

        {/* Contenido Dinámico de la Pantalla Activa con Transición Suave */}
        <main className="mon-screen-viewport" key={activeModuleId}>
          {renderActiveScreen()}
        </main>
      </div>

      {/* =========================================================
          B. PANEL LATERAL DESPLEGABLE DEL ASISTENTE DE IA CONTEXTUAL
         ========================================================= */}
      {aiDrawerOpen && (
        <aside className="ai-contextual-drawer" aria-label="Asistente de Inteligencia Artificial Contextual">
          <div className="ai-drawer-header">
            <div>
              <span className="ai-role-badge">✦ {activeModule.aiRole}</span>
              <h3>Asistente Científico Contextual</h3>
            </div>
            <button
              type="button"
              className="ai-close-btn"
              onClick={() => setAiDrawerOpen(false)}
            >
              ✕
            </button>
          </div>

          <div className="ai-context-summary">
            <span>Módulo: <strong>{activeModule.title}</strong></span>
            <span>Zona: <strong>{activeZone.name}</strong></span>
            <span>Periodo: <strong>{selectedPeriod}</strong></span>
          </div>

          <div className="ai-drawer-body">
            <div className="ai-greeting-box">{activeModule.aiGreeting}</div>

            <div className="ai-prompts-section">
              <span className="ai-section-label">PREGUNTAS SUGERIDAS PARA ESTE MÓDULO:</span>
              <div className="ai-prompts-list">
                {activeModule.aiPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    className="ai-prompt-pill"
                    onClick={() => triggerAiPrompt(prompt)}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>

            {/* Historial de conversación contextual */}
            <div className="ai-history-stack">
              {aiHistory.map((item) => (
                <article key={item.id} className="ai-response-card">
                  <div className="ai-question-head">“{item.question}”</div>
                  <div className="ai-structured-list">
                    <div>
                      <strong>1. Lo que se observa:</strong> {item.observed}
                    </div>
                    <div>
                      <strong>2. Posibles explicaciones:</strong> {item.explanations}
                    </div>
                    <div>
                      <strong>3. Evidencia disponible:</strong> {item.availableEvidence}
                    </div>
                    <div>
                      <strong>4. Evidencia faltante:</strong> {item.missingEvidence}
                    </div>
                    <div>
                      <strong>5. Análisis recomendado:</strong> {item.recommendation}
                    </div>
                  </div>
                  <span className="ai-source-disclaimer">{item.sourceNote}</span>
                </article>
              ))}
            </div>
          </div>

          <form onSubmit={handleAiFormSubmit} className="ai-drawer-footer">
            <input
              type="text"
              placeholder="Escribe una consulta metodológica o territorial..."
              value={aiInput}
              onChange={(e) => setAiInput(e.target.value)}
              className="sci-input"
            />
            <button type="submit" className="sci-action-btn" style={{ width: 'auto' }}>
              Consultar
            </button>
          </form>
        </aside>
      )}

      {/* =========================================================
          C.5. MODAL DEL GLOSARIO CIENTÍFICO
         ========================================================= */}
      {glossaryOpen && (
        <div className="sci-modal-backdrop" onClick={() => setGlossaryOpen(false)}>
          <div className="sci-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="sci-card-head">
              <h3>Glosario Científico y Fórmulas de Referencia</h3>
              <button type="button" className="ai-close-btn" onClick={() => setGlossaryOpen(false)}>
                ✕
              </button>
            </div>
            <div className="glossary-list">
              {SCIENTIFIC_GLOSSARY_TERMS.map((g) => (
                <article key={g.term} className="glossary-item">
                  <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                    <strong style={{ color: '#65C8F2' }}>{g.term}</strong>
                    <code className="glossary-formula">{g.formula}</code>
                  </div>
                  <p>{g.explanation}</p>
                  <span className="sci-tiny-note">
                    Unidad: {g.unit} · Fuente: {g.source}
                  </span>
                </article>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          C.3. MODAL DEL COMPARADOR UNIVERSAL
         ========================================================= */}
      {comparatorOpen && (
        <div className="sci-modal-backdrop" onClick={() => setComparatorOpen(false)}>
          <div className="sci-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="sci-card-head">
              <h3>Comparador Universal (Zonas, Periodos y Variables)</h3>
              <button type="button" className="ai-close-btn" onClick={() => setComparatorOpen(false)}>
                ✕
              </button>
            </div>
            <div className="sci-main-split" style={{ gridTemplateColumns: '1fr 1fr' }}>
              <div className="scenario-compare-box">
                <label className="sci-tiny-note">Unidad A:</label>
                <select
                  value={compZoneA}
                  onChange={(e) => setCompZoneA(e.target.value)}
                  className="sci-input"
                >
                  {COCHABAMBA_ZONES.map((z) => (
                    <option key={z.id} value={z.id}>
                      {z.name}
                    </option>
                  ))}
                </select>
                <div className="sci-stat-kv">
                  <span>NDVI (Ilustrativo)</span>
                  <strong style={{ color: '#8BCB9A' }}>{zoneObjA.ndviIllustrative}</strong>
                </div>
                <div className="sci-stat-kv">
                  <span>LST Sup. (Ilustrativo)</span>
                  <strong style={{ color: '#FFCB73' }}>{zoneObjA.lstIllustrative} °C</strong>
                </div>
                <div className="sci-stat-kv">
                  <span>Elevación NASADEM</span>
                  <strong>{zoneObjA.elevation}</strong>
                </div>
                <div className="sci-stat-kv">
                  <span>Cobertura válida</span>
                  <strong>{zoneObjA.validCoverage}%</strong>
                </div>
              </div>

              <div className="scenario-compare-box">
                <label className="sci-tiny-note">Unidad B:</label>
                <select
                  value={compZoneB}
                  onChange={(e) => setCompZoneB(e.target.value)}
                  className="sci-input"
                >
                  {COCHABAMBA_ZONES.map((z) => (
                    <option key={z.id} value={z.id}>
                      {z.name}
                    </option>
                  ))}
                </select>
                <div className="sci-stat-kv">
                  <span>NDVI (Ilustrativo)</span>
                  <strong style={{ color: '#8BCB9A' }}>{zoneObjB.ndviIllustrative}</strong>
                </div>
                <div className="sci-stat-kv">
                  <span>LST Sup. (Ilustrativo)</span>
                  <strong style={{ color: '#FFCB73' }}>{zoneObjB.lstIllustrative} °C</strong>
                </div>
                <div className="sci-stat-kv">
                  <span>Elevación NASADEM</span>
                  <strong>{zoneObjB.elevation}</strong>
                </div>
                <div className="sci-stat-kv">
                  <span>Cobertura válida</span>
                  <strong>{zoneObjB.validCoverage}%</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
