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
  TrendingUp,
  BarChart3,
  GitCompare,
  AlertTriangle,
  Calendar,
  Building2,
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
  PlanningScenariosScreen,
  ResearchReportsScreen,
} from './panel/ScreensPart2'
import { IndiceScreen } from './panel/IndiceScreen'
import { ComparadorScreen } from './panel/ComparadorScreen'
import { PlanificacionScreen } from './panel/PlanificacionScreen'
import { SimuladorEquipamientosScreen } from './panel/SimuladorEquipamientosScreen'
import FloatingAiAvatar from './panel/FloatingAiAvatar'

// Definición de grupos y pestañas del menú reorganizado
const MENU_GROUPS = [
  {
    id: 'inicio',
    title: 'INICIO',
    items: [
      {
        id: 'modo-detective',
        title: 'Modo detective',
        shortLabel: 'Modo detective',
        icon: 'radar',
        accent: '#65C8F2',
        aiRole: 'Orientador de Investigaciones',
        aiGreeting:
          'Modo Detective activo. Superviso el radar de sensores, vacíos de observación y hallazgos prioritarios.',
        aiPrompts: [
          '¿Qué información ambiental tenemos disponible?',
          '¿Cuáles son las alertas prioritarias en revisión?',
        ],
      },
    ],
  },
  {
    id: 'enfoque-1',
    title: 'ENFOQUE 1 · CLIMA URBANO',
    badge: 'NASA × IA',
    color: 'var(--theme-accent)',
    badgeBg: 'var(--theme-accent-subtle)',
    badgeColor: 'var(--theme-accent)',
    items: [
      {
        id: 'diagnostico-distrital',
        title: '1 Diagnóstico distrital',
        shortLabel: '1 Diagnóstico distrital',
        icon: 'activity',
        accent: '#38BDF8',
        aiRole: 'Director de Telemetría Orbital',
        aiGreeting:
          'Diagnóstico Distrital activo. Analizo anomalías térmicas LST y vigor fotosintético NDVI.',
        aiPrompts: [
          '¿Cuál es la zona con mayor anomalía térmica?',
          'Resumen rápido de vegetación vs. islas de calor',
        ],
      },
      {
        id: 'detective-tendencias',
        title: '2 Detective de tendencias',
        shortLabel: '2 Detective de tendencias',
        icon: 'trending-up',
        accent: '#FB923C',
        aiRole: 'Especialista en Tendencias Térmicas',
        aiGreeting:
          'Detective de Tendencias activo. Analizo series multitemporales e iso-contornos térmicos.',
        aiPrompts: [
          '¿Dónde se concentran los núcleos cálidos persistentes?',
          '¿Cómo evoluciona el pulso térmico en el tiempo?',
        ],
      },
      {
        id: 'red-monica',
        title: '3 Red MÓNICA',
        shortLabel: '3 Red MÓNICA',
        icon: 'network',
        accent: '#A78BFA',
        aiRole: 'Analista de Calidad del Aire',
        aiGreeting:
          'Módulo Red MÓNICA activo. Cruzo calidad del aire (PM10/PM2.5) con islas de calor superficiales.',
        aiPrompts: [
          '¿Cómo se vincula el pico matutino de PM10 con la inversión térmica?',
          '¿Qué intensidad tiene la relación inversa NDVI vs LST?',
        ],
      },
      {
        id: 'sensado-virtual-ia',
        title: '4 Sensado virtual con IA',
        shortLabel: '4 Sensado virtual con IA',
        icon: 'shield-check',
        accent: '#38BDF8',
        aiRole: 'Auditor Científico de IA',
        aiGreeting:
          'Sensado Virtual con IA activo. Evalúo incertidumbre espectral, calibración y pasaporte de trazabilidad.',
        aiPrompts: [
          '¿Cuál es el nivel de confianza satelital en este sector?',
          '¿Qué sensores faltan para calibrar en campo?',
        ],
      },
      {
        id: 'simulador-climatico',
        title: '5 Simulador climático',
        shortLabel: '5 Simulador climático',
        icon: 'sliders',
        accent: '#10B981',
        aiRole: 'Simulador de Clima Urbano',
        aiGreeting:
          'Simulador Climático activo. Simulo rangos exploratorios de enfriamiento mediante infraestructura verde y albedo.',
        aiPrompts: [
          '¿Qué reducción térmica se proyecta al reforestar un 15%?',
          '¿Cómo balancear techos fríos vs arbolado?',
        ],
      },
    ],
  },
  {
    id: 'enfoque-2',
    title: 'ENFOQUE 2 · CIUDAD Y SERVICIOS',
    badge: 'GAMC',
    color: '#34D399',
    badgeBg: 'rgba(52,211,153,0.15)',
    badgeColor: '#A7F3D0',
    items: [
      {
        id: 'indice-socioambiental',
        title: '6 Índice socio-ambiental',
        shortLabel: '6 Índice socio-ambiental',
        icon: 'bar-chart',
        accent: '#34D399',
        aiRole: 'Analista Socio-Ambiental',
        aiGreeting:
          'Índice Socio-Ambiental en preparación. Evalúo calidad de vida, calor y acceso a servicios.',
        aiPrompts: [
          '¿Qué factores componen el índice socio-ambiental?',
          '¿Cuáles son los distritos más vulnerables?',
        ],
      },
      {
        id: 'comparador-distritos',
        title: '7 Comparador de distritos',
        shortLabel: '7 Comparador de distritos',
        icon: 'git-compare',
        accent: '#6EE7B7',
        aiRole: 'Analista de Comparación Territorial',
        aiGreeting:
          'Comparador de Distritos activo. Comparo indicadores socioambientales entre sectores.',
        aiPrompts: [
          'Comparar Distrito 9 frente a Distrito 12',
          '¿Qué distritos tienen mayor déficit de servicios?',
        ],
      },
      {
        id: 'cobertura-servicios',
        title: '8 Cobertura de servicios',
        shortLabel: '8 Cobertura de servicios',
        icon: 'map-pin',
        accent: '#34D399',
        aiRole: 'Asistente de Cobertura y Movilidad',
        aiGreeting:
          'Cobertura de Servicios activa. Analizo cartografía distrital, líneas de transporte y equipamientos.',
        aiPrompts: [
          '¿Dónde quedan los vacíos de cobertura de transporte?',
          '¿Qué líneas conectan con centros de salud?',
        ],
      },
      {
        id: 'puntos-criticos',
        title: '9 Puntos críticos',
        shortLabel: '9 Puntos críticos',
        icon: 'alert-triangle',
        accent: '#F59E0B',
        aiRole: 'Investigador de Puntos Críticos',
        aiGreeting:
          'Puntos Críticos activo. Detecto clústeres espaciales LISA, anomalías multivariables y contradicciones.',
        aiPrompts: [
          '¿Dónde se concentran los puntos críticos térmicos?',
          '¿Qué hipótesis explican las anomalías?',
        ],
      },
      {
        id: 'planificacion-5-anos',
        title: '10 Planificación a 5 años',
        shortLabel: '10 Planificación a 5 años',
        icon: 'calendar',
        accent: '#818CF8',
        aiRole: 'Planificador Quinquenal',
        aiGreeting:
          'Planificación a 5 Años activa. Proyecto el crecimiento demográfico acelerado y demandas de infraestructura.',
        aiPrompts: [
          '¿Cómo crecerá la población en el sur hacia 2030?',
          '¿Cuántos equipamientos nuevos se requerirán?',
        ],
      },
      {
        id: 'simulador-equipamientos',
        title: '11 Simulador de equipamientos',
        shortLabel: '11 Simulador de equipamientos',
        icon: 'building',
        accent: '#06B6D4',
        aiRole: 'Simulador de Equipamientos Urbanos',
        aiGreeting:
          'Simulador de Equipamientos activo. Evalúo coberturas de 1er y 2do nivel y escuelas a 15 minutos.',
        aiPrompts: [
          '¿Qué población se beneficiaría con un nuevo centro de 1er nivel?',
          '¿Dónde ubicar un nuevo colegio?',
        ],
      },
    ],
  },
  {
    id: 'general',
    title: 'GENERAL',
    items: [
      {
        id: 'metodos-fuentes',
        title: 'Métodos y fuentes',
        shortLabel: 'Métodos y fuentes',
        icon: 'database',
        accent: '#FBBF24',
        aiRole: 'Arquitecto de Datos Geoespaciales',
        aiGreeting:
          'Métodos y Fuentes activo. Catálogo de sensores satelitales NASA/ESA y capas GAMC.',
        aiPrompts: [
          '¿Qué resolución nativa aporta cada satélite?',
          '¿Qué capas oficiales GAMC están conectadas?',
        ],
      },
      {
        id: 'informe',
        title: 'Informe',
        shortLabel: 'Informe',
        icon: 'file-text',
        accent: '#818CF8',
        aiRole: 'Editor de Informes Ejecutivos',
        aiGreeting:
          'Módulo Informe activo. Compilo evidencias, mapas y métricas en reportes para el GAMC.',
        aiPrompts: [
          'Generar síntesis ejecutiva distrital',
          '¿Qué advertencias metodológicas incluir?',
        ],
      },
    ],
  },
]

const ALL_MENU_ITEMS = MENU_GROUPS.flatMap((g) => g.items)

function ModuleSidebarIcon({ type, isActive, accent }) {
  const iconColor = isActive ? accent : 'var(--color-icon)'
  const props = { size: 18, strokeWidth: 1.75, color: iconColor }

  switch (type) {
    case 'radar':
      return <Radar {...props} />
    case 'activity':
    case 'pulse':
      return <Activity {...props} />
    case 'trending-up':
      return <TrendingUp {...props} />
    case 'network':
      return <Network {...props} />
    case 'shield-check':
    case 'shield':
      return <ShieldCheck {...props} />
    case 'sliders':
      return <SlidersHorizontal {...props} />
    case 'bar-chart':
      return <BarChart3 {...props} />
    case 'git-compare':
      return <GitCompare {...props} />
    case 'map-pin':
      return <MapPin {...props} />
    case 'alert-triangle':
      return <AlertTriangle {...props} />
    case 'calendar':
      return <Calendar {...props} />
    case 'building':
      return <Building2 {...props} />
    case 'database':
      return <Database {...props} />
    case 'file-text':
      return <FileText {...props} />
    case 'leaf':
      return <Leaf {...props} />
    case 'thermometer':
      return <Thermometer {...props} />
    case 'map':
      return <Map {...props} />
    case 'sparkles':
      return <Sparkles {...props} />
    default:
      return <FileText {...props} />
  }
}

export function InternalPlatform({ userSession, onLogout }) {
  const [activeModuleId, setActiveModuleId] = useState('modo-detective')
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
    ALL_MENU_ITEMS.find((m) => m.id === activeModuleId) ||
    TEN_MODULES.find((m) => m.id === activeModuleId) ||
    ALL_MENU_ITEMS[0]
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
      // INICIO
      case 'modo-detective':
      case 'centro-inteligencia':
        return <IntelligenceCenterScreen {...commonProps} />

      // ENFOQUE 1 · CLIMA URBANO
      case 'diagnostico-distrital':
      case 'monitoreo-general':
        return <MonitoreoGeneralScreen {...commonProps} />
      case 'detective-tendencias':
      case 'inteligencia-termica':
        return <ThermalIntelligenceScreen {...commonProps} />
      case 'red-monica':
      case 'relaciones-ambientales':
        return <EnvironmentalRelationsScreen {...commonProps} />
      case 'sensado-virtual-ia':
      case 'evidencia-validacion':
        return <EvidenceValidationScreen {...commonProps} />
      case 'simulador-climatico':
      case 'planificacion-escenarios':
        return <PlanningScenariosScreen {...commonProps} />

      // ENFOQUE 2 · CIUDAD Y SERVICIOS
      case 'indice-socioambiental':
        return <IndiceScreen {...commonProps} />
      case 'comparador-distritos':
        return <ComparadorScreen {...commonProps} />
      case 'cobertura-servicios':
      case 'explorador-territorial':
        return <TerritorialExplorerScreen {...commonProps} />
      case 'puntos-criticos':
      case 'investigacion-descubrimiento':
        return <ResearchDiscoveryScreen {...commonProps} />
      case 'planificacion-5-anos':
        return <PlanificacionScreen {...commonProps} />
      case 'simulador-equipamientos':
        return <SimuladorEquipamientosScreen {...commonProps} />

      // GENERAL
      case 'metodos-fuentes':
      case 'gestion-datos':
        return <DataManagementScreen {...commonProps} />
      case 'informe':
      case 'investigaciones-informes':
        return <ResearchReportsScreen {...commonProps} />

      // Pantalla de vegetación se preserva por compatibilidad
      case 'inteligencia-vegetacion':
        return <VegetationIntelligenceScreen {...commonProps} />

      default:
        return <IntelligenceCenterScreen {...commonProps} />
    }
  }

  return (
    <div className="mon-shell">
      {/* =========================================================
          BARRA LATERAL: GRUPOS Y PESTAÑAS DEL MENÚ
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
          {MENU_GROUPS.map((group) => (
            <div
              key={group.id}
              className="mon-nav-group"
              style={{ marginTop: group.id === 'inicio' ? 0 : '0.75rem' }}
            >
              {!sidebarCollapsed && (
                <div
                  className="mon-nav-group-title"
                  style={{
                    color: group.color || 'var(--color-text-muted)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span>{group.title}</span>
                  {group.badge && (
                    <span
                      style={{
                        fontSize: '0.68rem',
                        padding: '0.1rem 0.4rem',
                        borderRadius: '4px',
                        background: group.badgeBg || 'var(--theme-accent-subtle)',
                        color: group.badgeColor || 'var(--theme-accent)',
                        fontWeight: 600,
                      }}
                    >
                      {group.badge}
                    </span>
                  )}
                </div>
              )}
              <div className="mon-nav-items">
                {group.items.map((mod) => {
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
          ))}
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
