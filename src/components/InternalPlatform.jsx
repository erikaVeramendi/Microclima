import { useState, useEffect } from 'react'
import {
  Activity,
  Radar,
  Leaf,
  Thermometer,
  Network,
  Map,
  SlidersHorizontal,
  Database,
  ShieldCheck,
  Sparkles,
  FileText,
  BookOpen,
  Bot,
  Sun,
  Moon,
  User,
  ChevronLeft,
  ChevronRight,
  LogOut,
  MapPin,
  X,
} from 'lucide-react'
import './InternalPlatform.css'
import {
  TEN_MODULES,
  COCHABAMBA_ZONES,
  SCIENTIFIC_GLOSSARY_TERMS,
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
  ResearchReportsScreen,
} from './panel/ScreensPart2'
import IndiceScreen from './panel/IndiceScreen'
import ComparadorScreen from './panel/ComparadorScreen'
import PlanificacionScreen from './panel/PlanificacionScreen'
import SimuladorEquipamientosScreen from './panel/SimuladorEquipamientosScreen'
import FloatingAiAvatar from './panel/FloatingAiAvatar'

function ModuleSidebarIcon({ type, isActive, accent }) {
  const iconColor = isActive ? accent : 'var(--color-icon)'
  const props = { size: 18, strokeWidth: 1.75, color: iconColor }

  switch (type) {
    case 'pulse':
      return <Activity {...props} />
    case 'radar':
      return <Radar {...props} />
    case 'leaf':
      return <Leaf {...props} />
    case 'thermometer':
      return <Thermometer {...props} />
    case 'network':
      return <Network {...props} />
    case 'map':
      return <Map {...props} />
    case 'sliders':
      return <SlidersHorizontal {...props} />
    case 'database':
      return <Database {...props} />
    case 'shield':
      return <ShieldCheck {...props} />
    case 'sparkles':
      return <Sparkles {...props} />
    case 'file-text':
      return <FileText {...props} />
    default:
      return <FileText {...props} />
  }
}

export function InternalPlatform({ userSession, onLogout }) {
  const [activeModuleId, setActiveModuleId] = useState('monitoreo-general')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  // 1. MODO CLARO / OSCURO con persistencia en localStorage
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('microclima_theme') || 'dark'
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('microclima_theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))
  }

  // 4. DISTRITOS: 15 Distritos Municipales oficiales (Distrito 1 por defecto)
  const [selectedZoneId, setSelectedZoneId] = useState('distrito-1')
  const [selectedPeriod, setSelectedPeriod] = useState('Estación Seca 2025 (Demostrativo)')

  // Paneles Transversales: Asistente IA Contextual y Glosario Científico
  const [aiDrawerOpen, setAiDrawerOpen] = useState(false)
  const [aiHistory, setAiHistory] = useState([])
  const [aiInput, setAiInput] = useState('')
  const [glossaryOpen, setGlossaryOpen] = useState(false)

  const activeModule =
    TEN_MODULES.find((m) => m.id === activeModuleId) || TEN_MODULES[0]
  const activeZone =
    COCHABAMBA_ZONES.find((z) => z.id === selectedZoneId) || COCHABAMBA_ZONES[0]

  // Generación de respuesta estructurada honesta del Asistente IA Contextual
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
      case 'indice-socioambiental':
        return <IndiceScreen {...commonProps} />
      case 'comparador-distritos':
        return <ComparadorScreen {...commonProps} />
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
      case 'puntos-criticos':
      case 'investigacion-descubrimiento':
        return <ResearchDiscoveryScreen {...commonProps} />
      case 'evidencia-validacion':
        return <EvidenceValidationScreen {...commonProps} />
      case 'gestion-datos':
        return <DataManagementScreen {...commonProps} />
      case 'planificacion-5anios':
      case 'planificacion-escenarios':
        return <PlanificacionScreen {...commonProps} />
      case 'simulador-equipamientos':
        return <SimuladorEquipamientosScreen {...commonProps} />
      case 'informe':
      case 'investigaciones-informes':
        return <ResearchReportsScreen {...commonProps} />
      default:
        return <MonitoreoGeneralScreen {...commonProps} />
    }
  }

  return (
    <div className="mon-shell">
      {/* =========================================================
          BARRA LATERAL: 11 MÓDULOS AGRUPADOS EN 2 ENFOQUES
         ========================================================= */}
      <aside
        className={`mon-sidebar ${sidebarCollapsed ? 'is-collapsed' : ''}`}
        aria-label="Navegación principal de módulos"
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
            {sidebarCollapsed ? (
              <ChevronRight size={18} strokeWidth={1.75} color="var(--color-icon)" />
            ) : (
              <ChevronLeft size={18} strokeWidth={1.75} color="var(--color-icon)" />
            )}
          </button>
        </div>

        <nav className="mon-sidebar-nav">
          {/* BLOQUE ENFOQUE 1: MICROCLIMAS CON IA (NASA × IA) */}
          <div className="mon-nav-group">
            {!sidebarCollapsed && (
              <div
                className="mon-nav-group-title"
                style={{
                  color: 'var(--theme-accent)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span>ENFOQUE 1 · MICROCLIMAS</span>
                <span
                  style={{
                    fontSize: '0.75rem',
                    padding: '0.1rem 0.4rem',
                    borderRadius: '4px',
                    background: 'var(--theme-accent-subtle)',
                    color: 'var(--theme-accent)',
                    fontWeight: 600,
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
                    <span className="mon-nav-icon">
                      <ModuleSidebarIcon type={mod.icon} isActive={isActive} accent={mod.accent} />
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
                    fontSize: '0.75rem',
                    padding: '0.1rem 0.4rem',
                    borderRadius: '4px',
                    background: 'rgba(52,211,153,0.15)',
                    color: '#A7F3D0',
                    fontWeight: 600,
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
                    <span className="mon-nav-icon">
                      <ModuleSidebarIcon type={mod.icon} isActive={isActive} accent={mod.accent} />
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
            <span className="mon-shared-label">DISTRITO ACTIVO</span>
            <select
              value={selectedZoneId}
              onChange={(e) => setSelectedZoneId(e.target.value)}
              className="mon-shared-select"
              aria-label="Distrito activo sincronizado entre módulos"
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
            <LogOut size={18} strokeWidth={1.75} color="var(--color-icon)" />
            {!sidebarCollapsed && <span>Cerrar sesión</span>}
          </button>
        </div>
      </aside>

      {/* =========================================================
          ÁREA PRINCIPAL Y BARRA SUPERIOR
         ========================================================= */}
      <div className="mon-main-area">
        <header className="mon-topbar">
          {/* Título de la pantalla + Breadcrumbs */}
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
                <span style={{ color: 'var(--theme-accent)' }}>{activeZone.name}</span>
              </nav>
              <div className="mon-active-title-row">
                <h1>{activeModule.title}</h1>
              </div>
            </div>
          </div>

          {/* Barra superior limpia: Selector de distrito, Glosario, Asistente IA, Modo Claro/Oscuro y Usuario */}
          <div className="mon-topbar-controls">
            {/* Selector desplegable de distrito (15 distritos oficiales) */}
            <div className="mon-topbar-district-wrap">
              <MapPin size={18} strokeWidth={1.75} color="var(--color-icon)" />
              <select
                value={selectedZoneId}
                onChange={(e) => setSelectedZoneId(e.target.value)}
                className="mon-topbar-district-select"
                aria-label="Seleccionar distrito municipal"
              >
                {COCHABAMBA_ZONES.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Glosario Científico */}
            <button
              type="button"
              className="topbar-chip-btn"
              onClick={() => setGlossaryOpen(true)}
              title="Abrir glosario científico"
            >
              <BookOpen size={18} strokeWidth={1.75} color="var(--color-icon)" />
              <span>Glosario</span>
            </button>

            {/* Asistente IA */}
            <button
              type="button"
              className="topbar-chip-btn topbar-ai-btn"
              onClick={() => setAiDrawerOpen((p) => !p)}
              title="Abrir asistente de IA"
            >
              <Bot size={18} strokeWidth={1.75} color="var(--theme-accent)" />
              <span>Asistente IA</span>
            </button>

            {/* Botón modo claro / oscuro */}
            <button
              type="button"
              className="topbar-chip-btn topbar-theme-toggle"
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
              aria-label={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
            >
              {theme === 'dark' ? (
                <Sun size={18} strokeWidth={1.75} color="var(--color-icon)" />
              ) : (
                <Moon size={18} strokeWidth={1.75} color="var(--color-icon)" />
              )}
            </button>

            {/* Usuario */}
            <div className="mon-user-badge" title="Sesión activa">
              <User size={18} strokeWidth={1.75} color="var(--color-icon)" />
              <span>{userSession?.identifier || 'investigador@cochabamba.bo'}</span>
            </div>
          </div>
        </header>

        {/* Contenido Dinámico de la Pantalla Activa */}
        <main className="mon-screen-viewport" key={activeModuleId}>
          {renderActiveScreen()}
        </main>
      </div>

      {/* =========================================================
          PANEL LATERAL DESPLEGABLE DEL ASISTENTE DE IA CONTEXTUAL
         ========================================================= */}
      {aiDrawerOpen && (
        <aside className="ai-contextual-drawer" aria-label="Asistente de Inteligencia Artificial Contextual">
          <div className="ai-drawer-header">
            <div>
              <span className="ai-role-badge">{activeModule.aiRole}</span>
              <h3>Asistente Científico Contextual</h3>
            </div>
            <button
              type="button"
              className="ai-close-btn"
              onClick={() => setAiDrawerOpen(false)}
              aria-label="Cerrar asistente"
            >
              <X size={18} strokeWidth={1.75} color="var(--color-icon)" />
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
              <span className="ai-section-label">Preguntas sugeridas para este módulo:</span>
              <div className="ai-prompts-list">
                {activeModule.aiPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    className="ai-prompt-chip"
                    onClick={() => triggerAiPrompt(prompt)}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>

            {aiHistory.length > 0 && (
              <div className="ai-history-section">
                <span className="ai-section-label">Respuestas del asistente:</span>
                <div className="ai-history-list">
                  {aiHistory.map((h) => (
                    <article key={h.id} className="ai-history-card">
                      <div className="ai-q-row">
                        <strong>Q:</strong> {h.question}
                      </div>
                      <div className="ai-structured-answer">
                        <div className="ai-block">
                          <span className="ai-block-lbl">Lo observado:</span>
                          <p>{h.observed}</p>
                        </div>
                        <div className="ai-block">
                          <span className="ai-block-lbl">Posibles explicaciones:</span>
                          <p>{h.explanations}</p>
                        </div>
                        <div className="ai-block">
                          <span className="ai-block-lbl">Evidencia disponible:</span>
                          <p>{h.availableEvidence}</p>
                        </div>
                        <div className="ai-block">
                          <span className="ai-block-lbl">Evidencia faltante:</span>
                          <p>{h.missingEvidence}</p>
                        </div>
                        <div className="ai-block ai-block--rec">
                          <span className="ai-block-lbl">Recomendación metodológica:</span>
                          <p>{h.recommendation}</p>
                        </div>
                        <div className="ai-source-note">{h.sourceNote}</div>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            )}
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
          MODAL DEL GLOSARIO CIENTÍFICO
         ========================================================= */}
      {glossaryOpen && (
        <div className="sci-modal-backdrop" onClick={() => setGlossaryOpen(false)}>
          <div className="sci-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="sci-card-head">
              <h3>Glosario Científico y Fórmulas de Referencia</h3>
              <button
                type="button"
                className="ai-close-btn"
                onClick={() => setGlossaryOpen(false)}
                aria-label="Cerrar glosario"
              >
                <X size={18} strokeWidth={1.75} color="var(--color-icon)" />
              </button>
            </div>
            <div className="glossary-list">
              {SCIENTIFIC_GLOSSARY_TERMS.map((g) => (
                <article key={g.term} className="glossary-item">
                  <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                    <strong style={{ color: 'var(--theme-accent)' }}>{g.term}</strong>
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

      {/* Copiloto Científico Flotante (Omnipresente en todas las pantallas) */}
      <FloatingAiAvatar
        activeModuleId={activeModuleId}
        activeZone={activeZone}
      />
    </div>
  )
}
