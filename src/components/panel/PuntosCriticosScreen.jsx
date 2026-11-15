import { useState, useEffect, useMemo, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import {
  AlertTriangle,
  HeartPulse,
  Leaf,
  BookOpen,
  Navigation,
  Clock,
  Layers,
  ArrowRight,
  Filter,
  Droplets,
  Flame,
  TrendingUp,
  MapPin,
  SlidersHorizontal,
  Eye,
} from 'lucide-react'
import { COCHABAMBA_ZONES } from '../../data/internalPanelData'
import './PuntosCriticosScreen.css'

// Opciones de filtros por categoría de alerta
const FILTER_OPTIONS = [
  { id: 'todas', label: 'Todas' },
  { id: 'ambiental', label: 'Ambiental' },
  { id: 'salud', label: 'Salud' },
  { id: 'educacion', label: 'Educación' },
  { id: 'transporte', label: 'Transporte' },
  { id: 'hidrico', label: 'Riesgo Hídrico' },
  { id: 'futura', label: 'Futuro 2030' },
]

// Escala coroplética estricta:
// Gris claro (#CBD5E1) para 0 alertas
// Amarillo (#FACC15) para 1-2 alertas
// Naranja (#F97316) para 3-4 alertas
// Rojo intenso (#DC2626) para 5-6 alertas
function getAlertIntensityColor(count) {
  if (count >= 5) return '#DC2626'
  if (count >= 3) return '#F97316'
  if (count >= 1) return '#FACC15'
  return '#CBD5E1'
}

// Alertas hídricas y ecológicas territoriales (Río Rocha, inundaciones y Cota 2750)
const ALERTAS_HIDRICAS_POR_DISTRITO = {
  1: [
    {
      tipo: 'hidrico',
      texto:
        'Población a < 200 m del Río Rocha (eje Muyurina) y riesgo de desborde pluvial.',
    },
  ],
  2: [
    {
      tipo: 'hidrico',
      texto:
        'Construcción y avance de loteamientos sobre la Cota 2750 del Parque Tunari.',
    },
  ],
  4: [
    {
      tipo: 'hidrico',
      texto:
        'Corredor Río Rocha: alta susceptibilidad a anegamiento en torrenteras bajas.',
    },
  ],
  5: [
    {
      tipo: 'hidrico',
      texto:
        'Afectación pluvial en cuenca baja del Río Rocha y canales recolectores.',
    },
  ],
  8: [
    {
      tipo: 'hidrico',
      texto:
        'Susceptibilidad alta a anegamiento por falta de drenaje pluvial estructural.',
    },
  ],
  9: [
    {
      tipo: 'hidrico',
      texto:
        'Susceptibilidad alta a inundación estacional en cuenca baja de La Tamborada.',
    },
  ],
  13: [
    {
      tipo: 'hidrico',
      texto:
        'Presión urbana sobre recarga acuífera y construcciones sobre la Cota 2750 (Tunari).',
    },
  ],
  15: [
    {
      tipo: 'hidrico',
      texto:
        'Riesgo de anegamiento y desborde pluvial hacia la depresión sur de la Tamborada.',
    },
  ],
}

// Clasificación de cada alerta con su badge de color claro e ícono
function getAlertBadgeConfig(alerta) {
  const tipo = (alerta.tipo || '').toLowerCase()
  const texto = (alerta.texto || '').toLowerCase()

  // 1. Badge Azul Cian: Riesgo Hídrico (Inundación / Río Rocha / Cota 2750)
  if (
    tipo === 'hidrico' ||
    tipo === 'inundacion' ||
    tipo === 'rocha' ||
    tipo === 'cota2750' ||
    texto.includes('rocha') ||
    texto.includes('inundación') ||
    texto.includes('inundacion') ||
    texto.includes('cota 2750') ||
    texto.includes('anegamiento') ||
    texto.includes('pluvial')
  ) {
    return {
      categoryKey: 'hidrico',
      badgeClass: 'badge-hidrico',
      label: 'Riesgo Hídrico',
      icon: <Droplets size={13} strokeWidth={2} />,
    }
  }

  // 2. Badge Naranja: Pérdida de Vegetación / Calor Extremo
  if (
    tipo === 'ambiental' ||
    tipo === 'calor' ||
    tipo === 'ndvi' ||
    texto.includes('vegetación') ||
    texto.includes('vegetacion') ||
    texto.includes('calor') ||
    texto.includes('ndvi')
  ) {
    return {
      categoryKey: 'ambiental',
      badgeClass: 'badge-ambiental',
      label: 'Pérdida Vegetación / Calor',
      icon: <Leaf size={13} strokeWidth={2} />,
    }
  }

  // 3. Badge Violeta: Alta presión demográfica al 2030
  if (
    tipo === 'futura' ||
    tipo === 'demografia' ||
    texto.includes('2030') ||
    texto.includes('crecerá')
  ) {
    return {
      categoryKey: 'futura',
      badgeClass: 'badge-futuro',
      label: 'Presión 2030',
      icon: <Clock size={13} strokeWidth={2} />,
    }
  }

  // 4. Badge Rojo: Crítico en Servicios (Salud/Colegios/Transporte/Índice)
  let subLabel = 'Crítico en Servicios'
  let iconComp = <AlertTriangle size={13} strokeWidth={2} />

  if (tipo === 'salud' || texto.includes('salud') || texto.includes('hospital')) {
    subLabel = 'Salud 1er Nivel'
    iconComp = <HeartPulse size={13} strokeWidth={2} />
  } else if (tipo === 'educacion' || texto.includes('educativa') || texto.includes('colegio')) {
    subLabel = 'Educación GAMC'
    iconComp = <BookOpen size={13} strokeWidth={2} />
  } else if (tipo === 'transporte' || texto.includes('transporte') || texto.includes('parada')) {
    subLabel = 'Transporte GAMC'
    iconComp = <Navigation size={13} strokeWidth={2} />
  }

  return {
    categoryKey: tipo === 'salud' ? 'salud' : tipo === 'educacion' ? 'educacion' : tipo === 'transporte' ? 'transporte' : 'servicios',
    badgeClass: 'badge-servicios',
    label: subLabel,
    icon: iconComp,
  }
}

export default function PuntosCriticosScreen({
  selectedZoneId,
  onSelectZone,
  onNavigateModule,
}) {
  const [indiceData, setIndiceData] = useState(null)
  const [distritosGeoJson, setDistritosGeoJson] = useState(null)
  const [referenciasData, setReferenciasData] = useState(null)
  const [activeFilter, setActiveFilter] = useState('todas')
  const [sortBy, setSortBy] = useState('alertas') // 'alertas' | 'indice' | 'crecimiento'
  const [loading, setLoading] = useState(true)

  // Referencias DOM y Leaflet
  const mapContainerRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const baseTileRef = useRef(null)
  const distritosLayerRef = useRef(null)
  const rochaLayerRef = useRef(null)

  // Observador de Modo Claro / Modo Oscuro
  const [theme, setTheme] = useState(() => {
    return document.documentElement.getAttribute('data-theme') || 'light'
  })

  useEffect(() => {
    const observer = new MutationObserver(() => {
      const currentTheme =
        document.documentElement.getAttribute('data-theme') || 'light'
      setTheme(currentTheme)
    })
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    })
    return () => observer.disconnect()
  }, [])

  // Carga de datos oficiales
  useEffect(() => {
    let isMounted = true

    Promise.all([
      fetch('/data/indice_distritos.json').then((r) => (r.ok ? r.json() : null)),
      fetch('/data/distritos_indicadores_ambientales_2024.geojson').then((r) =>
        r.ok ? r.json() : null
      ),
      fetch('/data/referencias_geograficas.geojson').then((r) =>
        r.ok ? r.json() : null
      ),
    ])
      .then(([idxData, geoData, refData]) => {
        if (!isMounted) return
        if (idxData) setIndiceData(idxData)
        if (geoData) setDistritosGeoJson(geoData)
        if (refData) setReferenciasData(refData)
        setLoading(false)
      })
      .catch((err) => {
        console.error('Error cargando datos en PuntosCriticosScreen:', err)
        if (isMounted) setLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [])

  const activeZone =
    COCHABAMBA_ZONES.find((z) => z.id === selectedZoneId) || COCHABAMBA_ZONES[0]
  const distNum = parseInt(
    String(activeZone.number || activeZone.id.replace('distrito-', '')),
    10
  )

  // Lista enriquecida con alertas oficiales de servicios, ambiente, hídricas y futuro
  const distritosConAlertasEnriquecidas = useMemo(() => {
    if (!indiceData?.distritos) return []

    return indiceData.distritos.map((d) => {
      const idNum = parseInt(String(d.id), 10)
      const baseAlertas = (d.alertas || []).map((a) => ({ ...a }))
      const hidricas = ALERTAS_HIDRICAS_POR_DISTRITO[idNum] || []

      // Combinar alertas base con alertas hídricas
      const todasAlertas = [...baseAlertas, ...hidricas]

      const growthPct = d.indicadores?.factor_2030
        ? (d.indicadores.factor_2030 - 1) * 100
        : 0

      return {
        ...d,
        todasAlertas,
        growthPct,
      }
    })
  }, [indiceData])

  // Métricas consolidadas para las 4 tarjetas superiores de resumen
  const stats = useMemo(() => {
    let conAlerta = 0
    let countServicios = 0
    let countAmbiental = 0
    let countHidrico = 0

    distritosConAlertasEnriquecidas.forEach((d) => {
      if (d.todasAlertas.length > 0) conAlerta++
      d.todasAlertas.forEach((a) => {
        const config = getAlertBadgeConfig(a)
        if (
          config.categoryKey === 'servicios' ||
          config.categoryKey === 'salud' ||
          config.categoryKey === 'educacion' ||
          config.categoryKey === 'transporte'
        ) {
          countServicios++
        } else if (config.categoryKey === 'ambiental') {
          countAmbiental++
        } else if (config.categoryKey === 'hidrico') {
          countHidrico++
        }
      })
    })

    return {
      distritosConAlerta: conAlerta,
      servicios: countServicios,
      ambiental: countAmbiental,
      hidrico: countHidrico,
    }
  }, [distritosConAlertasEnriquecidas])

  // Filtrado y ordenamiento de distritos
  const distritosProcesados = useMemo(() => {
    return distritosConAlertasEnriquecidas
      .map((d) => {
        let alertasFiltradas = d.todasAlertas

        if (activeFilter !== 'todas') {
          alertasFiltradas = d.todasAlertas.filter((a) => {
            const cfg = getAlertBadgeConfig(a)
            if (activeFilter === 'ambiental') return cfg.categoryKey === 'ambiental'
            if (activeFilter === 'salud') return cfg.categoryKey === 'salud'
            if (activeFilter === 'educacion') return cfg.categoryKey === 'educacion'
            if (activeFilter === 'transporte') return cfg.categoryKey === 'transporte'
            if (activeFilter === 'hidrico') return cfg.categoryKey === 'hidrico'
            if (activeFilter === 'futura') return cfg.categoryKey === 'futura'
            return true
          })
        }

        return {
          ...d,
          alertasVisibles: alertasFiltradas,
          alertCount: alertasFiltradas.length,
          totalAlertCount: d.todasAlertas.length,
        }
      })
      .filter((d) => (activeFilter === 'todas' ? true : d.alertCount > 0))
      .sort((a, b) => {
        if (sortBy === 'alertas') {
          if (b.totalAlertCount !== a.totalAlertCount) {
            return b.totalAlertCount - a.totalAlertCount
          }
          return a.indice - b.indice
        }
        if (sortBy === 'indice') {
          return a.indice - b.indice // Peor índice primero
        }
        if (sortBy === 'crecimiento') {
          return b.growthPct - a.growthPct // Mayor crecimiento primero
        }
        return 0
      })
  }, [distritosConAlertasEnriquecidas, activeFilter, sortBy])

  // Mapa de conteo de alertas por distrito para el coroplético
  const alertCountMap = useMemo(() => {
    const map = {}
    distritosConAlertasEnriquecidas.forEach((d) => {
      map[String(d.id)] = d.todasAlertas.length
    })
    return map
  }, [distritosConAlertasEnriquecidas])

  // Inicialización de Leaflet
  useEffect(() => {
    if (!mapContainerRef.current) return
    if (mapInstanceRef.current) return

    const map = L.map(mapContainerRef.current, {
      center: [-17.393, -66.16],
      zoom: 12,
      zoomControl: false,
    })

    L.control.zoom({ position: 'topleft' }).addTo(map)
    mapInstanceRef.current = map

    return () => {
      map.remove()
      mapInstanceRef.current = null
    }
  }, [])

  // Conmutación automática de CartoDB Positron (Light) / Dark Matter (Dark)
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map) return

    const isLight = theme === 'light'
    const tileUrl = isLight
      ? 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'

    if (baseTileRef.current) {
      map.removeLayer(baseTileRef.current)
    }

    const newBase = L.tileLayer(tileUrl, {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19,
    })

    newBase.addTo(map)
    baseTileRef.current = newBase
  }, [theme])

  // Trazado coroplético de distritos + Río Rocha en azul brillante
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map) return

    if (distritosLayerRef.current) {
      map.removeLayer(distritosLayerRef.current)
      distritosLayerRef.current = null
    }

    if (distritosGeoJson?.features) {
      const isLight = theme === 'light'

      const layer = L.geoJSON(distritosGeoJson, {
        style: (feature) => {
          const cod = parseInt(String(feature.properties?.codigo_distrito), 10)
          const isSelected = cod === distNum
          const count = alertCountMap[String(cod)] || 0
          const color = getAlertIntensityColor(count)

          return {
            color: isSelected ? '#0284C7' : isLight ? '#1E293B' : '#64748B',
            weight: isSelected ? 4 : 1.75,
            fillColor: color,
            fillOpacity: isLight ? 0.75 : 0.82,
          }
        },
        onEachFeature: (feature, l) => {
          const cod = feature.properties?.codigo_distrito
          const count = alertCountMap[String(cod)] || 0
          const distObj = distritosConAlertasEnriquecidas.find(
            (d) => parseInt(String(d.id), 10) === parseInt(String(cod), 10)
          )

          const tooltipHtml = `
            <div style="font-family: system-ui, sans-serif; font-size: 12px; min-width: 175px;">
              <div style="font-weight: 800; font-size: 13px; color: #0F172A; margin-bottom: 2px;">
                ${distObj?.nombre || 'Distrito ' + cod}
              </div>
              <div style="font-size: 11px; color: #475569; margin-bottom: 4px;">
                Índice Socio-Ambiental: <strong>${distObj?.indice || 'N/A'}/100</strong>
              </div>
              <div style="display: inline-block; padding: 2px 7px; border-radius: 4px; font-weight: 700; font-size: 11px; background: ${
                count >= 5 ? '#FEE2E2' : count >= 3 ? '#FFEDD5' : count >= 1 ? '#FEF9C3' : '#F1F5F9'
              }; color: ${
                count >= 5 ? '#DC2626' : count >= 3 ? '#EA580C' : count >= 1 ? '#A16207' : '#475569'
              };">
                ${count} ${count === 1 ? 'alerta crítica' : 'alertas críticas'}
              </div>
              <div style="font-size: 10px; color: #64748B; margin-top: 5px;">
                Clic para enfocar alertas del distrito
              </div>
            </div>
          `

          l.bindTooltip(tooltipHtml, {
            sticky: true,
            direction: 'top',
          })

          l.on('click', () => {
            if (cod) {
              onSelectZone?.(`distrito-${cod}`)
            }
          })
        },
      })

      layer.addTo(map)
      distritosLayerRef.current = layer
    }
  }, [
    distritosGeoJson,
    alertCountMap,
    distNum,
    theme,
    distritosConAlertasEnriquecidas,
    onSelectZone,
  ])

  // Trazado del Río Rocha en azul brillante (#0284C7 / #06B6D4)
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map) return

    if (rochaLayerRef.current) {
      map.removeLayer(rochaLayerRef.current)
      rochaLayerRef.current = null
    }

    if (referenciasData?.features) {
      const rochaFeat = referenciasData.features.find(
        (f) => f.properties?.id === 'rio_rocha'
      )
      if (rochaFeat) {
        const layer = L.geoJSON(rochaFeat, {
          style: {
            color: '#0284C7',
            weight: 4,
            opacity: 0.95,
          },
          onEachFeature: (feature, l) => {
            l.bindTooltip(
              '<strong>Río Rocha (Corredor Ripario Urbano GAMC)</strong><br/>Eje ecológico y riesgo de anegamiento pluvial',
              { sticky: true }
            )
          },
        })
        layer.addTo(map)
        rochaLayerRef.current = layer
      }
    }
  }, [referenciasData])

  // Centrar mapa al hacer clic en "Ver en el mapa"
  const handleFocusDistrictOnMap = (districtId) => {
    onSelectZone?.(`distrito-${districtId}`)
    const map = mapInstanceRef.current
    if (!map || !distritosGeoJson?.features) return

    const targetFeat = distritosGeoJson.features.find(
      (f) => parseInt(String(f.properties?.codigo_distrito), 10) === parseInt(String(districtId), 10)
    )
    if (targetFeat) {
      try {
        const bounds = L.geoJSON(targetFeat).getBounds()
        if (bounds.isValid()) {
          map.fitBounds(bounds, { padding: [30, 30], maxZoom: 14 })
        }
      } catch (e) {
        // fallback
      }
    }
  }

  if (loading && !indiceData) {
    return (
      <div className="neo-screen" style={{ padding: '2rem', textAlign: 'center' }}>
        <p style={{ color: 'var(--theme-text-muted)' }}>Cargando análisis de puntos críticos...</p>
      </div>
    )
  }

  return (
    <div className="puntos-criticos-container">
      {/* 1. Header explicativo */}
      <div>
        <span className="neo-micro-tag" style={{ color: '#DC2626' }}>
          ENFOQUE 2 · DIAGNÓSTICO DE VULNERABILIDADES
        </span>
        <h2 style={{ margin: '0.15rem 0 0', fontSize: '1.18rem', fontWeight: 800 }}>
          Puntos Críticos y Alertas Socio-Ambientales
        </h2>
        <p
          style={{
            margin: '0.15rem 0 0',
            fontSize: '0.84rem',
            color: 'var(--theme-text-muted, #475569)',
          }}
        >
          Consolidado municipal de brechas en servicios, pérdida de vegetación, islas de calor y riesgo hídrico.
        </p>
      </div>

      {/* 2. 4 Tarjetas de Resumen con Borde Lateral de Color */}
      <section className="puntos-kpis-grid">
        {/* Tarjeta 1: Distritos Críticos (12/15) */}
        <div className="puntos-kpi-card kpi-criticos">
          <div className="puntos-kpi-header">
            <span className="puntos-kpi-label">DISTRITOS CRÍTICOS</span>
            <span
              className="puntos-kpi-badge"
              style={{ background: 'rgba(220, 38, 38, 0.1)', color: '#DC2626' }}
            >
              Prioridad territorial
            </span>
          </div>
          <div className="puntos-kpi-val-row">
            <span className="puntos-kpi-val" style={{ color: '#DC2626' }}>
              {stats.distritosConAlerta}
            </span>
            <span style={{ fontSize: '0.9rem', color: '#64748B', fontWeight: 700 }}>
              de 15 distritos
            </span>
          </div>
          <span className="puntos-kpi-sub">
            Concentran al menos una alerta crítica oficial del GAMC
          </span>
        </div>

        {/* Tarjeta 2: Alertas de Salud y Educación */}
        <div className="puntos-kpi-card kpi-servicios">
          <div className="puntos-kpi-header">
            <span className="puntos-kpi-label">ALERTAS DE SERVICIOS</span>
            <span
              className="puntos-kpi-badge"
              style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#DC2626' }}
            >
              Salud y Educación
            </span>
          </div>
          <div className="puntos-kpi-val-row">
            <span className="puntos-kpi-val" style={{ color: '#EF4444' }}>
              {stats.servicios}
            </span>
            <span style={{ fontSize: '0.9rem', color: '#64748B', fontWeight: 700 }}>
              alertas activas
            </span>
          </div>
          <span className="puntos-kpi-sub">
            Saturación en centros de 1er nivel y falta de cobertura escolar
          </span>
        </div>

        {/* Tarjeta 3: Alertas Ambientales (Vegetación/Calor) */}
        <div className="puntos-kpi-card kpi-ambiental">
          <div className="puntos-kpi-header">
            <span className="puntos-kpi-label">ALERTAS AMBIENTALES</span>
            <span
              className="puntos-kpi-badge"
              style={{ background: 'rgba(249, 115, 22, 0.1)', color: '#EA580C' }}
            >
              Vegetación y LST
            </span>
          </div>
          <div className="puntos-kpi-val-row">
            <span className="puntos-kpi-val" style={{ color: '#F97316' }}>
              {stats.ambiental}
            </span>
            <span style={{ fontSize: '0.9rem', color: '#64748B', fontWeight: 700 }}>
              alertas satelitales
            </span>
          </div>
          <span className="puntos-kpi-sub">
            Pérdida neta de NDVI (2001–2025) y severas islas de calor urbano
          </span>
        </div>

        {/* Tarjeta 4: Riesgo Hídrico (Inundación y Río Rocha) */}
        <div className="puntos-kpi-card kpi-hidrico">
          <div className="puntos-kpi-header">
            <span className="puntos-kpi-label">RIESGO HÍDRICO</span>
            <span
              className="puntos-kpi-badge"
              style={{ background: 'rgba(2, 132, 199, 0.1)', color: '#0284C7' }}
            >
              Inundación & Rocha
            </span>
          </div>
          <div className="puntos-kpi-val-row">
            <span className="puntos-kpi-val" style={{ color: '#0284C7' }}>
              {stats.hidrico}
            </span>
            <span style={{ fontSize: '0.9rem', color: '#64748B', fontWeight: 700 }}>
              alertas hídricas
            </span>
          </div>
          <span className="puntos-kpi-sub">
            Franja de 200 m del Río Rocha, drenaje sur y Cota 2750
          </span>
        </div>
      </section>

      {/* 3. Barra de Filtros por Categoría y Selector de Ordenamiento */}
      <section className="puntos-toolbar">
        {/* Pills de categorías */}
        <div className="puntos-filters-group">
          <span
            style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              color: 'var(--theme-text-muted, #64748B)',
              textTransform: 'uppercase',
              marginRight: '0.2rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem',
            }}
          >
            <Filter size={14} /> Filtros:
          </span>

          {FILTER_OPTIONS.map((f) => {
            const isActive = activeFilter === f.id
            return (
              <button
                key={f.id}
                type="button"
                className={`puntos-filter-btn ${isActive ? 'is-active' : ''}`}
                onClick={() => setActiveFilter(f.id)}
              >
                {f.label}
              </button>
            )
          })}
        </div>

        {/* Selector de ordenamiento */}
        <div className="puntos-sort-group">
          <span style={{ fontWeight: 600 }}>Ordenar por:</span>
          <select
            className="puntos-sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="alertas">Mayor número de alertas</option>
            <option value="indice">Peor Índice Socio-Ambiental</option>
            <option value="crecimiento">Mayor crecimiento al 2030</option>
          </select>
        </div>
      </section>

      {/* 4. Layout Principal: Lista de Tarjetas (1.15) + Mapa Coroplético (1) */}
      <section className="puntos-main-grid">
        {/* Columna Izquierda: Tarjetas de distritos */}
        <div className="puntos-districts-list">
          {distritosProcesados.length === 0 ? (
            <div
              className="puntos-district-card"
              style={{ padding: '2rem', textAlign: 'center', color: '#64748B' }}
            >
              No se encontraron alertas para la categoría seleccionada.
            </div>
          ) : (
            distritosProcesados.map((d) => {
              const idNum = parseInt(String(d.id), 10)
              const isSelected = idNum === distNum
              const count = d.totalAlertCount
              const severityColor = getAlertIntensityColor(count)

              return (
                <div
                  key={d.id}
                  className={`puntos-district-card ${isSelected ? 'is-selected' : ''}`}
                  style={{ borderLeftColor: severityColor }}
                >
                  {/* Encabezado del distrito */}
                  <div className="puntos-dist-card-header">
                    <div className="puntos-dist-card-title">
                      <strong>{d.nombre}</strong>
                      <span
                        className={`puntos-dist-semaforo-badge ${
                          d.indice >= 67
                            ? 'semaforo-verde'
                            : d.indice >= 34
                            ? 'semaforo-amarillo'
                            : 'semaforo-rojo'
                        }`}
                      >
                        Índice {d.indice} · Semáforo {d.semaforo}
                      </span>
                    </div>

                    <span
                      className="puntos-dist-alert-count"
                      style={{
                        background:
                          count >= 5
                            ? 'rgba(220, 38, 38, 0.12)'
                            : count >= 3
                            ? 'rgba(249, 115, 22, 0.12)'
                            : count >= 1
                            ? 'rgba(250, 204, 21, 0.15)'
                            : 'rgba(203, 213, 225, 0.25)',
                        color:
                          count >= 5
                            ? '#DC2626'
                            : count >= 3
                            ? '#EA580C'
                            : count >= 1
                            ? '#A16207'
                            : '#64748B',
                      }}
                    >
                      {count} {count === 1 ? 'alerta' : 'alertas'}
                    </span>
                  </div>

                  {/* Lista de alertas con badges identificados */}
                  <div className="puntos-alerts-list">
                    {d.alertasVisibles.map((a, idx) => {
                      const cfg = getAlertBadgeConfig(a)
                      return (
                        <div key={idx} className="puntos-alert-item">
                          <span className={`puntos-alert-badge ${cfg.badgeClass}`}>
                            {cfg.icon}
                            {cfg.label}
                          </span>
                          <span className="puntos-alert-text">{a.texto}</span>
                        </div>
                      )
                    })}
                  </div>

                  {/* Acciones rápidas de navegación */}
                  <div className="puntos-dist-card-footer">
                    <button
                      type="button"
                      className="puntos-btn-action"
                      onClick={() => handleFocusDistrictOnMap(d.id)}
                    >
                      <MapPin size={13} />
                      Ver en el mapa
                    </button>

                    <button
                      type="button"
                      className="puntos-btn-action"
                      onClick={() => {
                        onSelectZone?.(`distrito-${d.id}`)
                        onNavigateModule?.('explorador-territorial')
                      }}
                    >
                      <Eye size={13} />
                      Ver Cobertura
                    </button>

                    <button
                      type="button"
                      className="puntos-btn-action"
                      onClick={() => {
                        onSelectZone?.(`distrito-${d.id}`)
                        onNavigateModule?.('indice-socioambiental')
                      }}
                    >
                      <ArrowRight size={13} />
                      Ver Índice
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Columna Derecha: Mapa Coroplético de Intensidad */}
        <div className="puntos-map-card">
          <div className="puntos-map-header">
            <div>
              <span className="neo-micro-tag">MAPA COROPLÉTICO DE SEVERIDAD</span>
              <h3>Intensidad de Alertas Territoriales</h3>
            </div>
            <span
              className="puntos-kpi-badge"
              style={{ background: 'rgba(2, 132, 199, 0.1)', color: '#0284C7' }}
            >
              {activeZone.name}
            </span>
          </div>

          {/* Wrapper Leaflet */}
          <div className="puntos-map-leaflet-wrapper">
            <div ref={mapContainerRef} className="puntos-map-instance" />
          </div>

          {/* Leyenda Coroplética Inferior */}
          <div className="puntos-map-legend">
            <div className="puntos-legend-scale">
              <span className="puntos-legend-step">
                <span className="puntos-legend-box" style={{ background: '#CBD5E1' }} />
                0 alertas
              </span>
              <span className="puntos-legend-step">
                <span className="puntos-legend-box" style={{ background: '#FACC15' }} />
                1–2
              </span>
              <span className="puntos-legend-step">
                <span className="puntos-legend-box" style={{ background: '#F97316' }} />
                3–4
              </span>
              <span className="puntos-legend-step">
                <span className="puntos-legend-box" style={{ background: '#DC2626' }} />
                5–6
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span
                style={{
                  width: 14,
                  height: 3,
                  background: '#0284C7',
                  borderRadius: 2,
                  display: 'inline-block',
                }}
              />
              <span style={{ fontWeight: 700, color: '#0284C7' }}>Río Rocha</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
