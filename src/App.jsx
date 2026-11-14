import { useState, useEffect } from 'react'
import './App.css'
import {
  NAV_LINKS,
  CHALLENGE_QUESTIONS,
  CAPABILITIES,
  METHODOLOGY_PRINCIPLES,
  DATA_SOURCES,
} from './data/publicSiteData'
import { HuellaVerdeAndThermalSections } from './components/HuellaVerdeAndThermalSections'
import { TerritorialExplorerSection } from './components/TerritorialExplorerSection'
import { InteractiveOrbitalValleyCanvas } from './components/InteractiveOrbitalValleyCanvas'
import { NasaMunicipalFusionBridge } from './components/NasaMunicipalFusionBridge'
import { LoginPage } from './components/LoginPage'
import { InternalPlatform } from './components/InternalPlatform'

function CapabilityIcon({ type }) {
  switch (type) {
    case 'map':
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
          <line x1="8" y1="2" x2="8" y2="18" />
          <line x1="16" y1="6" x2="16" y2="22" />
        </svg>
      )
    case 'leaf':
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
          <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
        </svg>
      )
    case 'thermometer':
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z" />
        </svg>
      )
    case 'network':
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <circle cx="18" cy="5" r="3" />
          <circle cx="6" cy="12" r="3" />
          <circle cx="18" cy="19" r="3" />
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
          <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
        </svg>
      )
    case 'shield':
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      )
    default:
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <polygon points="12 2 2 7 12 12 22 7 12 2" />
          <polyline points="2 17 12 22 22 17" />
          <polyline points="2 12 12 17 22 12" />
        </svg>
      )
  }
}

function CapabilityMiniGraphic({ index }) {
  if (index === 0) {
    return (
      <svg viewBox="0 0 220 44" style={{ width: '100%', height: '42px', display: 'block' }} aria-hidden="true">
        <rect x="2" y="8" width="38" height="28" rx="4" fill="rgba(67,168,117,0.22)" stroke="#43A875" strokeWidth="1" />
        <rect x="46" y="8" width="38" height="28" rx="4" fill="rgba(101,200,242,0.2)" stroke="#65C8F2" strokeWidth="1" />
        <rect x="90" y="8" width="38" height="28" rx="4" fill="rgba(255,203,115,0.22)" stroke="#FFCB73" strokeWidth="1" />
        <rect x="134" y="8" width="38" height="28" rx="4" fill="rgba(242,139,80,0.25)" stroke="#F28B50" strokeWidth="1" />
        <rect x="178" y="8" width="38" height="28" rx="4" fill="rgba(136,117,216,0.25)" stroke="#8875D8" strokeWidth="1" />
      </svg>
    )
  }
  if (index === 1) {
    return (
      <svg viewBox="0 0 220 44" style={{ width: '100%', height: '42px', display: 'block' }} aria-hidden="true">
        <defs>
          <linearGradient id="capVegGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#43A875" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#43A875" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d="M 4 36 Q 45 14, 90 22 T 170 10 L 216 14 L 216 40 L 4 40 Z" fill="url(#capVegGrad)" />
        <path d="M 4 36 Q 45 14, 90 22 T 170 10 L 216 14" fill="none" stroke="#8BCB9A" strokeWidth="2" />
        <circle cx="90" cy="22" r="3.5" fill="#8BCB9A" />
        <circle cx="170" cy="10" r="3.5" fill="#43A875" />
      </svg>
    )
  }
  if (index === 2) {
    return (
      <svg viewBox="0 0 220 44" style={{ width: '100%', height: '42px', display: 'block' }} aria-hidden="true">
        <defs>
          <linearGradient id="capLstGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#65C8F2" />
            <stop offset="45%" stopColor="#FFCB73" />
            <stop offset="100%" stopColor="#D95757" />
          </linearGradient>
        </defs>
        <path d="M 4 32 C 42 30, 72 10, 112 20 C 148 28, 178 6, 216 10" fill="none" stroke="url(#capLstGrad)" strokeWidth="2.5" />
        <circle cx="112" cy="20" r="3.5" fill="#FFCB73" />
        <circle cx="195" cy="9" r="4" fill="#D95757" />
      </svg>
    )
  }
  if (index === 3) {
    return (
      <svg viewBox="0 0 220 44" style={{ width: '100%', height: '42px', display: 'block' }} aria-hidden="true">
        <line x1="25" y1="22" x2="85" y2="12" stroke="rgba(136,117,216,0.5)" strokeWidth="1.5" />
        <line x1="85" y1="12" x2="145" y2="30" stroke="rgba(101,200,242,0.5)" strokeWidth="1.5" />
        <line x1="145" y1="30" x2="198" y2="14" stroke="rgba(242,139,80,0.5)" strokeWidth="1.5" />
        <circle cx="25" cy="22" r="5" fill="#43A875" />
        <circle cx="85" cy="12" r="6" fill="#8875D8" />
        <circle cx="145" cy="30" r="5" fill="#65C8F2" />
        <circle cx="198" cy="14" r="6" fill="#F28B50" />
      </svg>
    )
  }
  if (index === 4) {
    return (
      <svg viewBox="0 0 220 44" style={{ width: '100%', height: '42px', display: 'block' }} aria-hidden="true">
        <rect x="6" y="16" width="58" height="12" rx="6" fill="rgba(67,168,117,0.3)" stroke="#43A875" />
        <rect x="74" y="16" width="58" height="12" rx="6" fill="rgba(230,184,92,0.3)" stroke="#E6B85C" />
        <rect x="142" y="16" width="68" height="12" rx="6" fill="rgba(101,200,242,0.28)" stroke="#65C8F2" />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 220 44" style={{ width: '100%', height: '42px', display: 'block' }} aria-hidden="true">
      <rect x="10" y="22" width="24" height="16" rx="3" fill="#65C8F2" opacity="0.6" />
      <rect x="46" y="14" width="24" height="24" rx="3" fill="#43A875" opacity="0.8" />
      <rect x="82" y="8" width="24" height="30" rx="3" fill="#8BCB9A" />
      <rect x="118" y="16" width="24" height="22" rx="3" fill="#FFCB73" opacity="0.85" />
      <rect x="154" y="10" width="24" height="28" rx="3" fill="#8875D8" opacity="0.85" />
      <rect x="190" y="18" width="20" height="20" rx="3" fill="#F28B50" opacity="0.8" />
    </svg>
  )
}

function App() {
  const [currentRoute, setCurrentRoute] = useState(() => {
    if (window.location.hash === '#/panel') return 'panel'
    if (window.location.hash === '#/login') return 'login'
    return 'public'
  })
  const [userSession, setUserSession] = useState(null)
  const [activeSection, setActiveSection] = useState('inicio')
  const [isScrolled, setIsScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [heroSpectrumMode, setHeroSpectrumMode] = useState('dual')

  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash === '#/panel') {
        setCurrentRoute('panel')
        window.scrollTo({ top: 0, behavior: 'auto' })
      } else if (window.location.hash === '#/login') {
        setCurrentRoute('login')
        window.scrollTo({ top: 0, behavior: 'auto' })
      } else {
        setCurrentRoute('public')
      }
    }

    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  useEffect(() => {
    if (currentRoute !== 'public') return

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 36)

      const sectionIds = NAV_LINKS.map((item) => item.id)
      let current = 'inicio'
      for (const id of sectionIds) {
        const el = document.getElementById(id)
        if (el) {
          const rect = el.getBoundingClientRect()
          if (rect.top <= 180) {
            current = id
          }
        }
      }
      setActiveSection(current)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [currentRoute])

  const openLoginRoute = (e) => {
    if (e) e.preventDefault()
    setMobileMenuOpen(false)
    window.location.hash = '#/login'
    setCurrentRoute('login')
  }

  const returnToPublicSite = () => {
    window.location.hash = ''
    setCurrentRoute('public')
  }

  const handleLoginSuccess = (sessionData) => {
    setUserSession(sessionData)
    window.location.hash = '#/panel'
    setCurrentRoute('panel')
  }

  const handleLogout = () => {
    setUserSession(null)
    window.location.hash = ''
    setCurrentRoute('public')
  }

  const scrollToSection = (id) => {
    setMobileMenuOpen(false)
    const target = document.getElementById(id)
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' })
    }
  }

  if (currentRoute === 'panel') {
    return <InternalPlatform userSession={userSession} onLogout={handleLogout} />
  }

  if (currentRoute === 'login') {
    return (
      <LoginPage
        onNavigateBack={returnToPublicSite}
        onLoginSuccess={handleLoginSuccess}
      />
    )
  }

  const bentoVariantClasses = [
    'bento-card--lst',
    'bento-card--veg',
    'bento-card--purple',
    'bento-card--cyan',
  ]

  const bentoAccentColors = ['#F28B50', '#43A875', '#8875D8', '#65C8F2']

  const capabilityBorderColors = [
    '#65C8F2',
    '#43A875',
    '#F28B50',
    '#8875D8',
    '#FFCB73',
    '#8BCB9A',
  ]

  return (
    <div className="site-wrapper">
      {/* =========================================================
          01. BARRA DE NAVEGACIÓN FLOTANTE MULTIESPECTRAL
         ========================================================= */}
      <header className={`site-navbar ${isScrolled ? 'is-scrolled' : ''}`}>
        <div className="container">
          <div className="navbar-inner">
            <a
              href="#inicio"
              className="brand-link"
              onClick={(e) => {
                e.preventDefault()
                scrollToSection('inicio')
              }}
            >
              <div className="brand-logo" aria-hidden="true">
                <svg width="22" height="22" viewBox="0 0 32 32" fill="none">
                  <circle cx="16" cy="16" r="11" stroke="#43A875" strokeWidth="1.8" />
                  <path
                    d="M7 18C10.5 12.5 14.5 20 18 13.5C20.5 9.5 22.8 15 25.5 12"
                    stroke="#FFCB73"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <circle cx="18" cy="13.5" r="2.6" fill="#F28B50" />
                </svg>
              </div>
              <div className="brand-text-group">
                <span className="brand-name">LlajtaLab</span>
                <span className="brand-sub">Laboratorio climático urbano de Cochabamba</span>
              </div>
            </a>

            <nav aria-label="Navegación principal">
              <ul className="nav-links">
                {NAV_LINKS.map((link) => (
                  <li key={link.id}>
                    <button
                      type="button"
                      className={`nav-link-btn ${activeSection === link.id ? 'is-active' : ''}`}
                      onClick={() => scrollToSection(link.id)}
                    >
                      {link.label}
                    </button>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="nav-actions">
              <a
                href="#/login"
                className="btn btn--nav"
                onClick={openLoginRoute}
              >
                Portal de Misión →
              </a>

              <button
                type="button"
                className="mobile-menu-toggle"
                aria-label={mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
                aria-expanded={mobileMenuOpen}
                onClick={() => setMobileMenuOpen((prev) => !prev)}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  {mobileMenuOpen ? (
                    <path d="M18 6 6 18M6 6l12 12" />
                  ) : (
                    <path d="M3 12h18M3 6h18M3 18h18" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Menú Móvil */}
        <div className={`mobile-drawer ${mobileMenuOpen ? 'is-open' : ''}`}>
          <ul className="mobile-nav-list">
            {NAV_LINKS.map((link) => (
              <li key={link.id}>
                <button
                  type="button"
                  className={`nav-link-btn ${activeSection === link.id ? 'is-active' : ''}`}
                  onClick={() => scrollToSection(link.id)}
                >
                  {link.label}
                </button>
              </li>
            ))}
          </ul>
          <a
            href="#/login"
            className="btn btn--primary"
            style={{ width: '100%' }}
            onClick={openLoginRoute}
          >
            Portal de Misión →
          </a>
        </div>
      </header>

      <main>
        {/* =========================================================
            02. HERO INTERACTIVO 3D MULTIESPECTRAL + HUD DE GAUGES
           ========================================================= */}
        <section id="inicio" className="hero-section">
          <InteractiveOrbitalValleyCanvas mode="hero" activeLayer={heroSpectrumMode} />
          <div className="hero-vignette" aria-hidden="true" />

          <div className="container hero-grid">
            <div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.9rem' }}>
                <span className="eyebrow eyebrow--amber" style={{ marginBottom: 0 }}>
                  <span className="eyebrow-dot" />
                  SATÉLITES NASA EARTHDATA
                </span>
                <span className="eyebrow eyebrow--green" style={{ marginBottom: 0 }}>
                  <span className="eyebrow-dot" />
                  APIs ALCALDÍA DE COCHABAMBA (GAMC)
                </span>
                <span className="eyebrow eyebrow--purple" style={{ marginBottom: 0 }}>
                  <span className="eyebrow-dot" />
                  MOTOR GEO-AI CLIMÁTICO
                </span>
              </div>

              <h1 className="hero-title">
                LA CIUDAD CAMBIA.
                <span className="hero-title-highlight">NOSOTROS INVESTIGAMOS CÓMO.</span>
              </h1>

              <p className="hero-description">
                Estación de inteligencia microclimática que fusiona satélites de la NASA
                (Landsat 8/9, ISS ECOSTRESS, MODIS, NASADEM) con las APIs territoriales de la
                Alcaldía de Cochabamba para investigar islas de calor y Huella Verde.
              </p>

              <div className="hero-cta-group">
                <button
                  type="button"
                  className="btn btn--primary"
                  onClick={openLoginRoute}
                >
                  Iniciar Misión Geo-AI →
                </button>
                <button
                  type="button"
                  className="btn btn--outline"
                  onClick={() => scrollToSection('fusion-nasa-gamc')}
                >
                  Ver Fusión NASA × Alcaldía
                </button>
              </div>

              {/* Conmutador interactivo del terreno 3D en vivo */}
              <div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: '#FFCB73', marginBottom: '0.45rem', letterSpacing: '0.08em' }}>
                  ESPECTRO 3D INTERACTIVO · MUEVE EL CURSOR SOBRE EL VALLE:
                </div>
                <div className="hero-live-switcher" role="group" aria-label="Modo de visualización del terreno 3D">
                  <button
                    type="button"
                    className={`hero-mode-btn ${heroSpectrumMode === 'dual' ? 'is-active' : ''}`}
                    onClick={() => setHeroSpectrumMode('dual')}
                  >
                    ◆ Fusión Multiespectral
                  </button>
                  <button
                    type="button"
                    className={`hero-mode-btn ${heroSpectrumMode === 'thermal' ? 'is-active' : ''}`}
                    onClick={() => setHeroSpectrumMode('thermal')}
                  >
                    ▲ Infrarrojo Térmico (LST)
                  </button>
                  <button
                    type="button"
                    className={`hero-mode-btn ${heroSpectrumMode === 'ndvi' ? 'is-active' : ''}`}
                    onClick={() => setHeroSpectrumMode('ndvi')}
                  >
                    ● Bio-Vegetación (NDVI)
                  </button>
                </div>
              </div>
            </div>

            {/* Consola HUD Orbital Derecha con Medidores Circulares y Osciloscopio */}
            <aside className="hero-hud-console" aria-label="Consola de telemetría territorial">
              <div className="hud-console-top">
                <div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.74rem', color: 'var(--color-cloud)', letterSpacing: '0.08em', fontWeight: 700 }}>
                    TELEMETRÍA ORBITAL · VALLE DE COCHABAMBA
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.66rem', color: '#8BCB9A' }}>
                    ● ESCÁNER MULTIESPECTRAL ACTIVO · ESQUEMA CONCEPTUAL
                  </div>
                </div>
                <span className="eyebrow eyebrow--amber" style={{ marginBottom: 0, padding: '0.2rem 0.6rem', fontSize: '0.62rem' }}>
                  3D LIVE HUD
                </span>
              </div>

              {/* 3 Medidores Circulares SVG (Verde NDVI, Coral LST, Violeta IA) */}
              <div className="hud-gauges-grid">
                <div className="hud-gauge-card" style={{ borderColor: 'rgba(67, 168, 117, 0.35)' }}>
                  <svg width="68" height="68" viewBox="0 0 72 72" aria-hidden="true">
                    <circle cx="36" cy="36" r="28" fill="none" stroke="rgba(67, 168, 117, 0.16)" strokeWidth="6" />
                    <circle
                      cx="36"
                      cy="36"
                      r="28"
                      fill="none"
                      stroke="#43A875"
                      strokeWidth="6"
                      strokeDasharray="128 176"
                      strokeLinecap="round"
                      transform="rotate(-90 36 36)"
                    />
                    <text x="36" y="39" textAnchor="middle" fill="#8BCB9A" fontSize="12" fontFamily="monospace" fontWeight="700">
                      NDVI
                    </text>
                  </svg>
                  <strong style={{ fontSize: '0.76rem', color: '#8BCB9A', fontFamily: 'var(--font-display)' }}>
                    Huella Verde
                  </strong>
                  <span style={{ fontSize: '0.64rem', color: 'var(--color-gray)', fontFamily: 'var(--font-mono)' }}>
                    10m Sentinel-2
                  </span>
                </div>

                <div className="hud-gauge-card" style={{ borderColor: 'rgba(242, 139, 80, 0.38)' }}>
                  <svg width="68" height="68" viewBox="0 0 72 72" aria-hidden="true">
                    <circle cx="36" cy="36" r="28" fill="none" stroke="rgba(242, 139, 80, 0.16)" strokeWidth="6" />
                    <circle
                      cx="36"
                      cy="36"
                      r="28"
                      fill="none"
                      stroke="#F28B50"
                      strokeWidth="6"
                      strokeDasharray="142 176"
                      strokeLinecap="round"
                      transform="rotate(-90 36 36)"
                    />
                    <text x="36" y="39" textAnchor="middle" fill="#FFCB73" fontSize="12" fontFamily="monospace" fontWeight="700">
                      LST
                    </text>
                  </svg>
                  <strong style={{ fontSize: '0.76rem', color: '#FFCB73', fontFamily: 'var(--font-display)' }}>
                    Pulso Térmico
                  </strong>
                  <span style={{ fontSize: '0.64rem', color: 'var(--color-gray)', fontFamily: 'var(--font-mono)' }}>
                    TIRS Landsat 8/9
                  </span>
                </div>

                <div className="hud-gauge-card" style={{ borderColor: 'rgba(136, 117, 216, 0.38)' }}>
                  <svg width="68" height="68" viewBox="0 0 72 72" aria-hidden="true">
                    <circle cx="36" cy="36" r="28" fill="none" stroke="rgba(136, 117, 216, 0.16)" strokeWidth="6" />
                    <circle
                      cx="36"
                      cy="36"
                      r="28"
                      fill="none"
                      stroke="#8875D8"
                      strokeWidth="6"
                      strokeDasharray="115 176"
                      strokeLinecap="round"
                      transform="rotate(-90 36 36)"
                    />
                    <text x="36" y="39" textAnchor="middle" fill="#C4B5FD" fontSize="11" fontFamily="monospace" fontWeight="700">
                      LISA
                    </text>
                  </svg>
                  <strong style={{ fontSize: '0.76rem', color: '#C4B5FD', fontFamily: 'var(--font-display)' }}>
                    Motor Geo-AI
                  </strong>
                  <span style={{ fontSize: '0.64rem', color: 'var(--color-gray)', fontFamily: 'var(--font-mono)' }}>
                    Clústeres & Sen
                  </span>
                </div>
              </div>

              {/* Osciloscopio / Cruce Espectral en Vivo */}
              <div className="hud-radar-ring">
                <svg viewBox="0 0 360 150" style={{ width: '100%', height: '100%' }} aria-hidden="true">
                  <defs>
                    <linearGradient id="hudVegArea" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#43A875" stopOpacity="0.36" />
                      <stop offset="100%" stopColor="#43A875" stopOpacity="0" />
                    </linearGradient>
                    <linearGradient id="hudThermArea" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#F28B50" stopOpacity="0.34" />
                      <stop offset="100%" stopColor="#F28B50" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  {/* Grid lines */}
                  <line x1="0" y1="38" x2="360" y2="38" stroke="rgba(245,247,252,0.06)" />
                  <line x1="0" y1="75" x2="360" y2="75" stroke="rgba(245,247,252,0.06)" />
                  <line x1="0" y1="112" x2="360" y2="112" stroke="rgba(245,247,252,0.06)" />

                  {/* Curva NDVI Verde */}
                  <path
                    d="M 10 105 Q 75 38, 145 84 T 275 46 L 350 62 L 350 140 L 10 140 Z"
                    fill="url(#hudVegArea)"
                  />
                  <path
                    d="M 10 105 Q 75 38, 145 84 T 275 46 L 350 62"
                    fill="none"
                    stroke="#43A875"
                    strokeWidth="2.4"
                  />

                  {/* Curva LST Coral/Ámbar */}
                  <path
                    d="M 10 118 Q 90 92, 165 44 T 295 82 L 350 48 L 350 140 L 10 140 Z"
                    fill="url(#hudThermArea)"
                  />
                  <path
                    d="M 10 118 Q 90 92, 165 44 T 295 82 L 350 48"
                    fill="none"
                    stroke="#F28B50"
                    strokeWidth="2.4"
                  />

                  <circle cx="165" cy="44" r="4.5" fill="#FFCB73" />
                  <circle cx="275" cy="46" r="4.5" fill="#8BCB9A" />

                  <text x="12" y="20" fill="#FFCB73" fontSize="9" fontFamily="monospace" fontWeight="600">
                    ▲ PERFIL TÉRMICO (LST) vs. ● VIGOR VEGETAL (NDVI)
                  </text>
                  <text x="12" y="138" fill="#A9B8CC" fontSize="8.5" fontFamily="monospace">
                    TRANSECTO CONCEPTUAL: TUNARI → CENTRO → SUR
                  </text>
                </svg>
              </div>
            </aside>
          </div>

          {/* Cinta Orbital Animada Continua (NASA Satellites + APIs Alcaldía) */}
          <div className="orbital-ticker" aria-hidden="true">
            <div className="orbital-ticker-track">
              <span style={{ color: '#FFCB73' }}>▲ NASA LANDSAT 8/9 TIRS · TEMPERATURA SUPERFICIAL (LST 30M)</span>
              <span style={{ color: '#8BCB9A' }}>● API ALCALDÍA GAMC · RED DE MONITOREO AMBIENTAL & ARBOLADO</span>
              <span style={{ color: '#65C8F2' }}>◆ NASA ISS ECOSTRESS & MODIS · FLUJO TÉRMICO DIURNO/NOCTURNO</span>
              <span style={{ color: '#C4B5FD' }}>● API ALCALDÍA GAMC · CATASTRO 15 DISTRITOS & 6 SUBALCALDÍAS</span>
              <span style={{ color: '#43A875' }}>● SENTINEL-2 MSI & NASA HLS · HUELLA VERDE (NDVI 10M)</span>
              <span style={{ color: '#F28B50' }}>▲ NASA JPL NASADEM · MODELO TOPOGRÁFICO 3D DEL VALLE (2,558M)</span>
              <span style={{ color: '#FFCB73' }}>▲ NASA LANDSAT 8/9 TIRS · TEMPERATURA SUPERFICIAL (LST 30M)</span>
              <span style={{ color: '#8BCB9A' }}>● API ALCALDÍA GAMC · RED DE MONITOREO AMBIENTAL & ARBOLADO</span>
              <span style={{ color: '#65C8F2' }}>◆ NASA ISS ECOSTRESS & MODIS · FLUJO TÉRMICO DIURNO/NOCTURNO</span>
              <span style={{ color: '#C4B5FD' }}>● API ALCALDÍA GAMC · CATASTRO 15 DISTRITOS & 6 SUBALCALDÍAS</span>
            </div>
          </div>
        </section>

        {/* =========================================================
            02.5 PUENTE DE FUSIÓN: SATÉLITES NASA × APIs ALCALDÍA (GAMC)
           ========================================================= */}
        <NasaMunicipalFusionBridge />

        {/* =========================================================
            03 & 04. REALIDADES AMBIENTALES Y LAS 4 PREGUNTAS CLAVE
           ========================================================= */}
        <section id="realidades" className="section-block section-block--navy">
          <div className="container">
            <div className="split-2col" style={{ marginTop: 0, marginBottom: '2.8rem' }}>
              <div>
                <span className="eyebrow eyebrow--amber">
                  <span className="eyebrow-dot" />
                  Contraste Espectral Urbano
                </span>
                <h2 className="section-title">
                  Una misma ciudad. Diferentes firmas ambientales.
                </h2>
                <p className="section-lead">
                  Cruzamos la firma térmica superficial con la memoria vegetal para
                  comprender cómo responde cada sector de Cochabamba.
                </p>
              </div>

              <div className="comparison-showcase">
                <article className="sector-card" style={{ borderColor: 'rgba(67, 168, 117, 0.35)' }}>
                  <div className="sector-visual">
                    <img
                      src="https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=800&q=80"
                      alt="Corredor con cobertura vegetal"
                      loading="lazy"
                    />
                    <span className="sector-tag">● Espectro Bio-Vegetal (NDVI)</span>
                  </div>
                  <div className="sector-body">
                    <h3 style={{ color: '#8BCB9A' }}>Corredores y arbolado</h3>
                    <p>Amortiguación radiativa y vigor fotosintético estacional.</p>
                  </div>
                </article>

                <article className="sector-card" style={{ borderColor: 'rgba(242, 139, 80, 0.4)' }}>
                  <div className="sector-visual">
                    <img
                      src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80"
                      alt="Superficie urbana densa"
                      loading="lazy"
                    />
                    <span
                      className="sector-tag"
                      style={{
                        color: '#FFCB73',
                        borderColor: 'rgba(242, 139, 80, 0.55)',
                      }}
                    >
                      ▲ Espectro Infrarrojo (LST)
                    </span>
                  </div>
                  <div className="sector-body">
                    <h3 style={{ color: '#FFCB73' }}>Superficies impermeables</h3>
                    <p>Acumulación calórica y emisión térmica superficial.</p>
                  </div>
                </article>
              </div>
            </div>

            {/* Bento Grid Multicolor de las 4 preguntas guía */}
            <div className="bento-4grid">
              {CHALLENGE_QUESTIONS.map((item, idx) => (
                <article
                  key={item.code}
                  className={`bento-card ${bentoVariantClasses[idx % 4]}`}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                      <span
                        className="bento-num"
                        style={{ color: bentoAccentColors[idx % 4] }}
                      >
                        {item.code} · {item.category.toUpperCase()}
                      </span>
                      <div
                        className="capability-icon-box"
                        style={{
                          width: 34,
                          height: 34,
                          color: bentoAccentColors[idx % 4],
                          borderColor: `${bentoAccentColors[idx % 4]}55`,
                        }}
                      >
                        <CapabilityIcon
                          type={
                            item.icon === 'thermal'
                              ? 'thermometer'
                              : item.icon === 'vegetation'
                              ? 'leaf'
                              : item.icon === 'relation'
                              ? 'network'
                              : 'shield'
                          }
                        />
                      </div>
                    </div>
                    <h3>{item.question}</h3>
                  </div>

                  {/* Mini gráfico vectorial por tarjeta */}
                  <div style={{ marginBlock: '0.35rem' }}>
                    <CapabilityMiniGraphic index={idx + 1} />
                  </div>

                  <p>{item.detail}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* =========================================================
            05. ¿QUÉ ES LLAJTALAB? (PIPELINE MULTIESPECTRAL)
           ========================================================= */}
        <section id="plataforma" className="section-block section-block--slate">
          <div className="container">
            <span className="eyebrow eyebrow--green">
              <span className="eyebrow-dot" />
              Arquitectura Geo-AI
            </span>
            <h2 className="section-title">
              Del sensor orbital a la decisión territorial auditable.
            </h2>

            <div className="concept-pipeline" aria-label="Flujo de inteligencia ambiental">
              <div className="pipeline-steps">
                <div className="pipeline-node pipeline-node--veg">
                  <span className="pipeline-step-num" style={{ color: '#8BCB9A' }}>
                    01 · SENSORES
                  </span>
                  <h3>Ingesta Orbital</h3>
                  <p>Óptica Sentinel-2, térmico Landsat 8/9 y relieve NASADEM.</p>
                </div>

                <div className="pipeline-node pipeline-node--cyan">
                  <span className="pipeline-step-num" style={{ color: '#65C8F2' }}>
                    02 · CALIBRACIÓN
                  </span>
                  <h3>Cómputo Espectral</h3>
                  <p>Limpieza QA de nubes, armonización estacional y grillas H3.</p>
                </div>

                <div className="pipeline-node pipeline-node--ai">
                  <span className="pipeline-step-num" style={{ color: '#C4B5FD' }}>
                    03 · MOTOR GEO-AI
                  </span>
                  <h3>Patrones e IA</h3>
                  <p>Pendiente Theil-Sen, anomalías z-score y clústeres LISA.</p>
                </div>

                <div className="pipeline-node pipeline-node--lst">
                  <span className="pipeline-step-num" style={{ color: '#FFCB73' }}>
                    04 · AUDITORÍA
                  </span>
                  <h3>Trazabilidad QA</h3>
                  <p>Semáforo de evidencia, incertidumbre y vacíos de observación.</p>
                </div>

                <div className="pipeline-node pipeline-node--amber">
                  <span className="pipeline-step-num" style={{ color: '#F28B50' }}>
                    05 · LABORATORIO
                  </span>
                  <h3>Acción Urbana</h3>
                  <p>Priorización multicriterio y simulación de escenarios.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================
            06. LAS 6 CAPACIDADES CON GRÁFICOS VECTORIALES
           ========================================================= */}
        <section id="capacidades" className="section-block section-block--navy">
          <div className="container">
            <span className="eyebrow eyebrow--purple">
              <span className="eyebrow-dot" />
              Módulos de Investigación
            </span>
            <h2 className="section-title">
              Seis motores conectados en un solo entorno científico.
            </h2>

            <div className="capabilities-grid">
              {CAPABILITIES.map((cap, idx) => {
                const accentHex = capabilityBorderColors[idx % capabilityBorderColors.length]
                return (
                  <article
                    key={cap.number}
                    className="capability-card"
                    style={{ borderTop: `3px solid ${accentHex}` }}
                  >
                    <div>
                      <div className="capability-header">
                        <span className="capability-num" style={{ color: accentHex }}>
                          MÓDULO {cap.number}
                        </span>
                        <div
                          className="capability-icon-box"
                          aria-hidden="true"
                          style={{ color: accentHex, borderColor: `${accentHex}44` }}
                        >
                          <CapabilityIcon type={cap.icon} />
                        </div>
                      </div>
                      <h3 className="capability-title">{cap.title}</h3>
                      <p className="capability-desc">{cap.description}</p>
                    </div>

                    <div style={{ paddingBlock: '0.35rem' }}>
                      <CapabilityMiniGraphic index={idx} />
                    </div>

                    <div className="capability-quote" style={{ color: accentHex }}>
                      “{cap.quote}”
                    </div>
                  </article>
                )
              })}
            </div>
          </div>
        </section>

        {/* =========================================================
            07 Y 08. HUELLA VERDE E INTELIGENCIA TÉRMICA INTERACTIVA
           ========================================================= */}
        <HuellaVerdeAndThermalSections />

        {/* =========================================================
            09. INVESTIGACIÓN Y DESCUBRIMIENTO MULTIVARIABLE
           ========================================================= */}
        <section className="section-block section-block--slate">
          <div className="container">
            <span className="eyebrow eyebrow--purple">
              <span className="eyebrow-dot" />
              Descubrimiento Asistido por IA
            </span>
            <h2 className="section-title">
              Detectar anomalías, cruces bivariados y contradicciones.
            </h2>

            <div className="research-grid">
              <article className="research-card" style={{ borderTop: '3px solid #43A875' }}>
                <span className="bento-num" style={{ color: '#8BCB9A' }}>
                  01 · CRUCE BIVARIADO NDVI × LST
                </span>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', marginBlock: '0.4rem' }}>
                  Acoplamiento Térmico-Vegetal
                </h3>
                <CapabilityMiniGraphic index={1} />
                <p style={{ fontSize: '0.84rem', color: 'var(--color-gray)', marginTop: '0.45rem' }}>
                  Cruza vigor fotosintético, temperatura superficial y altitud para medir
                  la regulación microclimática.
                </p>
              </article>

              <article className="research-card" style={{ borderTop: '3px solid #F28B50' }}>
                <span className="bento-num" style={{ color: '#FFCB73' }}>
                  02 · DETECCIÓN DE CONTRADICCIONES
                </span>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', marginBlock: '0.4rem' }}>
                  Patrones Atípicos
                </h3>
                <CapabilityMiniGraphic index={2} />
                <p style={{ fontSize: '0.84rem', color: 'var(--color-gray)', marginTop: '0.45rem' }}>
                  Identifica zonas donde el calor superficial sube aun con vegetación
                  estable o viceversa.
                </p>
              </article>

              <article className="research-card" style={{ borderTop: '3px solid #8875D8' }}>
                <span className="bento-num" style={{ color: '#C4B5FD' }}>
                  03 · CONTRASTE DE HIPÓTESIS
                </span>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', marginBlock: '0.4rem' }}>
                  Laboratorio de Evidencia
                </h3>
                <CapabilityMiniGraphic index={3} />
                <p style={{ fontSize: '0.84rem', color: 'var(--color-gray)', marginTop: '0.45rem' }}>
                  Separa evidencia a favor, evidencia en contra y vacíos de observación
                  antes de emitir conclusiones.
                </p>
              </article>
            </div>

            <div className="discovery-banner">
              <div>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: '#FFCB73', display: 'block', marginBottom: '0.25rem' }}>
                  PRINCIPIO CIENTÍFICO DEL LABORATORIO
                </span>
                <p className="discovery-banner-quote">
                  “Una coincidencia es el comienzo de una investigación, no una prueba de
                  causalidad.”
                </p>
              </div>
              <button type="button" className="btn btn--primary" onClick={openLoginRoute}>
                Probar en el Laboratorio →
              </button>
            </div>
          </div>
        </section>

        {/* =========================================================
            10. EXPLORACIÓN TERRITORIAL (CONSOLA INTERACTIVA)
           ========================================================= */}
        <TerritorialExplorerSection />

        {/* =========================================================
            12 & 13. METODOLOGÍA, AUDITORÍA Y FUENTES SATELITALES
           ========================================================= */}
        <section id="metodologia" className="section-block section-block--slate">
          <div className="container">
            <span className="eyebrow eyebrow--green">
              <span className="eyebrow-dot" />
              Trazabilidad & Catálogo Satelital
            </span>
            <h2 className="section-title">
              Cada mapa e indicador cuenta con pasaporte de datos auditable.
            </h2>

            <div className="methodology-layout">
              <div className="principles-list">
                {METHODOLOGY_PRINCIPLES.map((p) => (
                  <article key={p.id} className="principle-row">
                    <span className="principle-num">{p.id}</span>
                    <div>
                      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', marginBottom: '0.2rem' }}>
                        {p.title}
                      </h3>
                      <p style={{ fontSize: '0.84rem', color: 'var(--color-gray)' }}>{p.desc}</p>
                    </div>
                  </article>
                ))}
              </div>

              <aside className="audit-panel">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: '#FFCB73' }}>
                    PASAPORTE DE EVIDENCIA CIENTÍFICA
                  </span>
                  <span className="demo-tag">AUDITADO</span>
                </div>
                <div className="audit-row">
                  <span>Fuente identificada</span>
                  <span>Sensor / Catálogo oficial</span>
                </div>
                <div className="audit-row">
                  <span>Comparabilidad</span>
                  <span>Misma estación climática</span>
                </div>
                <div className="audit-row">
                  <span>Resolución espacial</span>
                  <span>10 m (S2) · 30 m (L8/9)</span>
                </div>
                <div className="audit-row">
                  <span>Cobertura válida</span>
                  <span>Filtro QA de nubes y sombras</span>
                </div>
                <div className="audit-row" style={{ borderBottom: 'none' }}>
                  <span>Semáforo de confianza</span>
                  <span style={{ color: '#8BCB9A' }}>● Alta · ● Media · ● En revisión</span>
                </div>
              </aside>
            </div>

            {/* Catálogo de las 8 fuentes */}
            <div className="sources-grid" style={{ marginTop: '2.5rem' }}>
              {DATA_SOURCES.map((source) => (
                <article
                  key={source.name}
                  className="source-card"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '0.65rem',
                  }}
                >
                  <div>
                    <span
                      className={`source-status ${
                        source.statusType === 'public'
                          ? 'source-status--public'
                          : source.statusType === 'tool'
                          ? 'source-status--tool'
                          : 'source-status--pending'
                      }`}
                    >
                      {source.status}
                    </span>
                    <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', marginTop: '0.55rem' }}>
                      {source.name}
                    </h3>
                    <span className="source-provider">{source.provider}</span>
                    <p className="source-desc" style={{ marginTop: '0.35rem' }}>
                      {source.description}
                    </p>
                  </div>
                  <div style={{ paddingTop: '0.55rem', borderTop: '1px solid rgba(245,247,252,0.1)', fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--color-gray)' }}>
                    {source.variable}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* =========================================================
            15 & 16. VISIÓN Y LLAMADO A LA ACCIÓN
           ========================================================= */}
        <section id="acerca" className="cta-Closing">
          <div className="container cta-box">
            <span className="eyebrow eyebrow--amber">
              <span className="eyebrow-dot" />
              NASA Space Apps Challenge · Cochabamba
            </span>
            <h2 className="section-title">
              Comprender nuestra ciudad es el primer paso para transformarla.
            </h2>
            <p className="section-lead" style={{ textAlign: 'center' }}>
              Ingresa al Portal de Misión para explorar el relieve 3D multiespectral, las
              capas satelitales y la estación de inteligencia ambiental.
            </p>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center', marginTop: '0.75rem' }}>
              <a
                href="#/login"
                className="btn btn--primary"
                onClick={openLoginRoute}
              >
                Ingresar al Portal de Misión →
              </a>
              <button
                type="button"
                className="btn btn--outline"
                onClick={() => scrollToSection('territorio')}
              >
                Probar Simulador Territorial
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* =========================================================
          17. FOOTER
         ========================================================= */}
      <footer className="site-footer">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-col">
              <div className="brand-link" style={{ marginBottom: '0.75rem' }}>
                <div className="brand-logo" aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 32 32" fill="none">
                    <circle cx="16" cy="16" r="11" stroke="#43A875" strokeWidth="1.8" />
                    <path d="M8 17C11 13 15 19 18 14C20.5 10.5 22.5 15 25 13" stroke="#FFCB73" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                </div>
                <div className="brand-text-group">
                  <span className="brand-name">LlajtaLab</span>
                  <span className="brand-sub">
                    Laboratorio climático urbano de Cochabamba
                  </span>
                </div>
              </div>
              <p style={{ fontSize: '0.82rem', maxWidth: '38ch' }}>
                Plataforma de inteligencia geoespacial y análisis científico dedicada a
                investigar las transformaciones térmicas y vegetales de Cochabamba.
              </p>
            </div>

            <div className="footer-col">
              <h4>Explorar</h4>
              <ul className="footer-links">
                <li>
                  <button type="button" className="footer-link-btn" onClick={() => scrollToSection('plataforma')}>
                    Arquitectura Geo-AI
                  </button>
                </li>
                <li>
                  <button type="button" className="footer-link-btn" onClick={() => scrollToSection('capacidades')}>
                    Módulos del laboratorio
                  </button>
                </li>
                <li>
                  <button type="button" className="footer-link-btn" onClick={() => scrollToSection('metodologia')}>
                    Metodología y fuentes
                  </button>
                </li>
              </ul>
            </div>

            <div className="footer-col">
              <h4>Espectro</h4>
              <ul className="footer-links">
                <li>
                  <button type="button" className="footer-link-btn" onClick={() => scrollToSection('territorio')}>
                    Simulador conceptual
                  </button>
                </li>
                <li>
                  <button type="button" className="footer-link-btn" onClick={() => scrollToSection('realidades')}>
                    Contraste urbano
                  </button>
                </li>
              </ul>
            </div>

            <div className="footer-col">
              <h4>Acceso</h4>
              <ul className="footer-links">
                <li>
                  <a
                    href="#/login"
                    className="footer-link-btn"
                    style={{ color: '#FFCB73', fontWeight: 600 }}
                    onClick={openLoginRoute}
                  >
                    Portal de Misión →
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="footer-bottom">
            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
              <span>© 2026 LlajtaLab — Cochabamba, Bolivia.</span>
              <span style={{ fontFamily: 'var(--font-mono)', color: '#8BCB9A' }}>
                NASA Space Apps Challenge Cochabamba 2026
              </span>
            </div>
            <p>
              Aviso científico: Las visualizaciones demostrativas no sustituyen mediciones
              oficiales en campo ni validaciones científicas específicas.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App
