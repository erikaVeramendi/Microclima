import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import * as maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import {
  Box,
  Compass,
  Plus,
  Minus,
  Sparkles,
  HeartPulse,
  BookOpen,
  Trees,
  Bus,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Layers,
} from 'lucide-react'
import './MapLibreSimulador3D.css'

const { Map, Marker, Popup, NavigationControl, LngLatBounds } = maplibregl

// Generador de polígono circular exacto en metros para el halo de cobertura radial
function createGeoJsonCircle(center, radiusInMeters, points = 64) {
  if (!center || !radiusInMeters) return null
  const [lng, lat] = center
  const km = radiusInMeters / 1000
  const distanceX = km / (111.32 * Math.cos((lat * Math.PI) / 180))
  const distanceY = km / 110.574
  const ret = []
  for (let i = 0; i < points; i++) {
    const theta = (i / points) * (2 * Math.PI)
    const x = distanceX * Math.cos(theta)
    const y = distanceY * Math.sin(theta)
    ret.push([lng + x, lat + y])
  }
  ret.push(ret[0])
  return {
    type: 'Feature',
    geometry: {
      type: 'Polygon',
      coordinates: [ret],
    },
    properties: {},
  }
}

// Estilo Raster público limpio y sin restricciones (CartoDB Voyager / Dark Matter)
function getRasterStyle(isLight) {
  return {
    version: 8,
    name: isLight ? 'Carto Voyager Clean' : 'Carto Dark Clean',
    sources: {
      'carto-tiles': {
        type: 'raster',
        tiles: isLight
          ? [
              'https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
              'https://b.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
              'https://c.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
              'https://d.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
            ]
          : [
              'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
              'https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
              'https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
              'https://d.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
            ],
        tileSize: 256,
        attribution:
          '&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://openstreetmap.org">OpenStreetMap</a>',
      },
    },
    layers: [
      {
        id: 'carto-raster-layer',
        type: 'raster',
        source: 'carto-tiles',
        minzoom: 0,
        maxzoom: 20,
      },
    ],
  }
}

// Ilustración SVG 3D Isométrica para Hospital / Centro de Salud
function renderHospitalSvg() {
  return `
    <div class="sim-3d-model-marker">
      <div class="sim-3d-label" style="background:#DC2626; border-color:#EF4444;">
        🏥 CENTRO DE SALUD 1ER NIVEL
      </div>
      <svg width="84" height="84" viewBox="0 0 84 84" fill="none" xmlns="http://www.w3.org/2000/svg">
        <!-- Sombra proyectada volumétrica -->
        <ellipse cx="42" cy="72" rx="36" ry="10" fill="rgba(15, 23, 42, 0.28)" filter="blur(2px)"/>
        
        <!-- Bloque Principal Isométrico -->
        <!-- Fachada Izquierda (Luz) -->
        <polygon points="18,48 42,60 42,36 18,24" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1.2"/>
        <!-- Fachada Derecha (Sombra arquitectónica) -->
        <polygon points="42,60 66,48 66,24 42,36" fill="#F1F5F9" stroke="#94A3B8" stroke-width="1.2"/>
        <!-- Techo Moderno Coral -->
        <polygon points="18,24 42,12 66,24 42,36" fill="#DC2626" stroke="#B91C1C" stroke-width="1.2"/>
        
        <!-- Helipuerto en el techo -->
        <ellipse cx="42" cy="24" rx="14" ry="7" fill="#EF4444" stroke="#FFFFFF" stroke-width="1.2"/>
        <text x="42" y="27" font-size="9" font-weight="900" fill="#FFFFFF" text-anchor="middle" font-family="sans-serif">H</text>

        <!-- Ventanas frontales modernas -->
        <polygon points="23,43 31,47 31,39 23,35" fill="#38BDF8" opacity="0.85"/>
        <polygon points="33,48 39,51 39,43 33,40" fill="#38BDF8" opacity="0.85"/>
        <polygon points="45,51 51,48 51,40 45,43" fill="#0284C7" opacity="0.75"/>
        <polygon points="53,47 61,43 61,35 53,39" fill="#0284C7" opacity="0.75"/>

        <!-- Entrada principal con marquesina blanca -->
        <polygon points="36,57 42,60 48,57 42,54" fill="#FFFFFF" stroke="#DC2626" stroke-width="1"/>
        <rect x="40.5" y="58" width="3" height="4" fill="#0F172A"/>

        <!-- Cruz Médica Luminosa Flotante en la Cima -->
        <g style="filter: drop-shadow(0 0 6px #EF4444);">
          <circle cx="42" cy="6" r="8" fill="#FFFFFF" stroke="#DC2626" stroke-width="1.5"/>
          <path d="M40 3h4v6h-4z M37 6h10v2h-10z" fill="#DC2626"/>
        </g>
      </svg>
    </div>
  `
}

// Ilustración SVG 3D Isométrica para Colegio / Unidad Educativa
function renderColegioSvg() {
  return `
    <div class="sim-3d-model-marker">
      <div class="sim-3d-label" style="background:#2563EB; border-color:#3B82F6;">
        🎓 UNIDAD EDUCATIVA
      </div>
      <svg width="88" height="84" viewBox="0 0 88 84" fill="none" xmlns="http://www.w3.org/2000/svg">
        <!-- Sombra proyectada -->
        <ellipse cx="44" cy="72" rx="38" ry="10" fill="rgba(15, 23, 42, 0.28)" filter="blur(2px)"/>

        <!-- Cancha deportiva polifuncional exterior (futsal/básquet) -->
        <polygon points="12,56 36,68 54,58 30,46" fill="#10B981" stroke="#059669" stroke-width="1.2"/>
        <polygon points="14,56 36,67 52,58 30,47" fill="#059669" opacity="0.3"/>
        <!-- Líneas de la cancha -->
        <ellipse cx="33" cy="57" rx="6" ry="3" fill="none" stroke="#FFFFFF" stroke-width="0.8"/>
        <line x1="23" y1="51" x2="43" y2="63" stroke="#FFFFFF" stroke-width="0.8"/>

        <!-- Pabellón de aulas en 3D (Bloque Principal) -->
        <polygon points="34,44 58,56 58,32 34,20" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1.2"/>
        <polygon points="58,56 78,46 78,22 58,32" fill="#F1F5F9" stroke="#94A3B8" stroke-width="1.2"/>
        <polygon points="34,20 58,8 78,22 58,32" fill="#2563EB" stroke="#1D4ED8" stroke-width="1.2"/>

        <!-- Filas de ventanas de aulas -->
        <polygon points="38,40 45,43 45,35 38,32" fill="#60A5FA" opacity="0.9"/>
        <polygon points="48,45 55,48 55,40 48,37" fill="#60A5FA" opacity="0.9"/>
        <polygon points="61,47 67,44 67,36 61,39" fill="#1D4ED8" opacity="0.8"/>
        <polygon points="70,43 75,40 75,32 70,35" fill="#1D4ED8" opacity="0.8"/>

        <!-- Campanario / Torre del Reloj Escolar -->
        <polygon points="46,16 52,19 52,6 46,3" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1"/>
        <polygon points="52,19 56,17 56,4 52,6" fill="#E2E8F0" stroke="#94A3B8" stroke-width="1"/>
        <polygon points="46,3 49,0 56,4 52,6" fill="#EA580C"/>
        <circle cx="49" cy="8" r="2.2" fill="#2563EB"/>

        <!-- Asta con Bandera -->
        <line x1="28" y1="46" x2="28" y2="34" stroke="#64748B" stroke-width="1.5"/>
        <polygon points="28,34 35,36 28,39" fill="#EF4444"/>
      </svg>
    </div>
  `
}

// Ilustración SVG 3D Isométrica para Parque / Área Verde Urbana
function renderParqueSvg() {
  return `
    <div class="sim-3d-model-marker">
      <div class="sim-3d-label" style="background:#059669; border-color:#10B981;">
        🌳 PARQUE URBANO MULTIDISTRITAL
      </div>
      <svg width="88" height="86" viewBox="0 0 88 86" fill="none" xmlns="http://www.w3.org/2000/svg">
        <!-- Sombra proyectada del parque -->
        <ellipse cx="44" cy="74" rx="38" ry="10" fill="rgba(15, 23, 42, 0.28)" filter="blur(2px)"/>

        <!-- Plataforma de Césped Isométrica -->
        <polygon points="12,48 44,66 76,48 44,30" fill="#10B981" stroke="#059669" stroke-width="1.5"/>
        <polygon points="12,48 44,66 44,70 12,52" fill="#047857"/>
        <polygon points="44,66 76,48 76,52 44,70" fill="#065F46"/>

        <!-- Senderos peatonales curvos dentro del parque -->
        <path d="M18 50 Q44 62 70 46" stroke="#FDE68A" stroke-width="3" stroke-linecap="round" fill="none" opacity="0.9"/>
        <path d="M44 32 Q46 48 44 66" stroke="#FDE68A" stroke-width="2.2" stroke-linecap="round" fill="none" opacity="0.8"/>

        <!-- Estanque de agua central con reflejos -->
        <ellipse cx="44" cy="48" rx="9" ry="5" fill="#38BDF8" stroke="#0284C7" stroke-width="1"/>
        <ellipse cx="44" cy="48" rx="4" ry="2" fill="#BAE6FD" opacity="0.7"/>

        <!-- Árbol 1 (Copa grande Verde Esmeralda) -->
        <g>
          <ellipse cx="28" cy="48" rx="8" ry="4" fill="rgba(0,0,0,0.25)"/>
          <line x1="28" y1="48" x2="28" y2="40" stroke="#78350F" stroke-width="2.5" stroke-linecap="round"/>
          <circle cx="28" cy="36" r="10" fill="#059669"/>
          <circle cx="26" cy="33" r="6" fill="#34D399" opacity="0.85"/>
        </g>

        <!-- Árbol 2 (Pino cónico verde oscuro) -->
        <g>
          <ellipse cx="58" cy="44" rx="7" ry="3.5" fill="rgba(0,0,0,0.25)"/>
          <line x1="58" y1="44" x2="58" y2="38" stroke="#78350F" stroke-width="2" stroke-linecap="round"/>
          <polygon points="58,22 52,38 64,38" fill="#047857"/>
          <polygon points="58,26 53,34 63,34" fill="#10B981" opacity="0.75"/>
        </g>

        <!-- Árbol 3 (Copa frondosa Verde Lima) -->
        <g>
          <ellipse cx="40" cy="36" rx="6" ry="3" fill="rgba(0,0,0,0.25)"/>
          <line x1="40" y1="36" x2="40" y2="30" stroke="#78350F" stroke-width="1.8" stroke-linecap="round"/>
          <circle cx="40" cy="27" r="8" fill="#10B981"/>
          <circle cx="38" cy="25" r="4.5" fill="#6EE7B7"/>
        </g>

        <!-- Brisa fresca / Partículas de aire puro flotantes -->
        <path d="M22 28 Q34 22 46 26" stroke="#38BDF8" stroke-width="1.4" stroke-linecap="round" fill="none" stroke-dasharray="3 3"/>
        <circle cx="48" cy="26" r="1.5" fill="#38BDF8"/>
        <circle cx="56" cy="23" r="1.2" fill="#34D399"/>
      </svg>
    </div>
  `
}

export default function MapLibreSimulador3D({
  tipo = 'salud',
  radio = 1000,
  candidatos = [],
  activePoint = null,
  onSelectCandidate,
  onMapClick,
  areasEquipData = null,
  referenciasGeo = null,
  transporteGeo = null,
  existingPoints = [],
  calculationResult = null,
  isInsideMunicipal = false,
  distTranspMeters = null,
  distRochaMeters = null,
}) {
  const mapContainerRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const simulatedMarkerRef = useRef(null)
  const candidateMarkersRef = useRef([])
  const existingMarkersRef = useRef([])

  // Tema de la interfaz
  const [theme, setTheme] = useState(() => {
    return document.documentElement.getAttribute('data-theme') || 'light'
  })

  // Modo de cámara (3D Isométrico vs 2D Aéreo)
  const [cameraMode, setCameraMode] = useState('3d') // '3d' | '2d'

  // Motor de estilo: siempre 'carto-raster' (raster público, sin API key, carga garantizada)
  const [styleMode, setStyleMode] = useState('carto-raster')

  // Color de identidad
  const tipoColor = useMemo(() => {
    if (tipo === 'salud') return '#DC2626'
    if (tipo === 'educacion') return '#2563EB'
    return '#059669'
  }, [tipo])

  // Escuchar cambios de tema (Modo Claro vs Modo Oscuro)
  useEffect(() => {
    const observer = new MutationObserver(() => {
      const cur = document.documentElement.getAttribute('data-theme') || 'light'
      setTheme(cur)
    })
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    })
    return () => observer.disconnect()
  }, [])

  // Inicialización de MapLibre GL — CartoDB Raster como estilo base garantizado
  useEffect(() => {
    if (!mapContainerRef.current) return
    if (mapInstanceRef.current) return

    const isLight = theme === 'light'
    const initialCenter = activePoint
      ? [activePoint.lng, activePoint.lat]
      : [-66.158, -17.408]

    // Estilo raster válido version:8 — carga instantánea sin API key ni CDN externa
    const map = new Map({
      container: mapContainerRef.current,
      style: getRasterStyle(isLight),
      center: initialCenter,
      zoom: 13.5,
      pitch: cameraMode === '3d' ? 48 : 0,
      bearing: cameraMode === '3d' ? -15 : 0,
      maxPitch: 75,
      attributionControl: false,
    })

    map.on('style.load', () => {
      setupLayers(map, isLight)
    })

    // Manejo de clic sobre el mapa
    map.on('click', (e) => {
      onMapClick?.({ lat: e.lngLat.lat, lng: e.lngLat.lng })
    })

    mapInstanceRef.current = map

    // Auto-ajuste de tamaño con ResizeObserver
    const ro = new ResizeObserver(() => {
      map.resize()
    })
    ro.observe(mapContainerRef.current)

    return () => {
      ro.disconnect()
      map.remove()
      mapInstanceRef.current = null
    }
  }, [])

  // Cambio de tema dinámico (Light / Dark) — siempre usa CartoDB Raster
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map) return

    const isLight = theme === 'light'
    map.setStyle(getRasterStyle(isLight))
    map.once('style.load', () => {
      setupLayers(map, isLight)
      updateCoverageCircle(map)
    })
  }, [theme])

  // Configuración de capas 3D y contextuales del GAMC
  const setupLayers = useCallback(
    (map, isLight) => {
      if (!map) return

      // 1. Capa de Edificios 3D (fill-extrusion) si OpenFreeMap está activo
      if (map.getSource('openmaptiles') && !map.getLayer('3d-buildings-openmaptiles')) {
        map.addLayer({
          id: '3d-buildings-openmaptiles',
          source: 'openmaptiles',
          'source-layer': 'building',
          type: 'fill-extrusion',
          minzoom: 13,
          paint: {
            'fill-extrusion-color': isLight ? '#E2E8F0' : '#1E293B',
            'fill-extrusion-height': [
              'interpolate',
              ['linear'],
              ['zoom'],
              13,
              0,
              15.5,
              ['coalesce', ['get', 'render_height'], ['get', 'height'], 12],
            ],
            'fill-extrusion-base': [
              'interpolate',
              ['linear'],
              ['zoom'],
              13,
              0,
              15.5,
              ['coalesce', ['get', 'render_min_height'], ['get', 'min_height'], 0],
            ],
            'fill-extrusion-opacity': isLight ? 0.88 : 0.72,
          },
        })
      }

      // 2. Terrenos Municipales GAMC disponibles (áreas de equipamiento)
      if (areasEquipData?.features && !map.getSource('gamc-terrenos-source')) {
        map.addSource('gamc-terrenos-source', {
          type: 'geojson',
          data: areasEquipData,
        })

        // Relleno verde menta translúcido
        map.addLayer({
          id: 'gamc-terrenos-fill',
          type: 'fill',
          source: 'gamc-terrenos-source',
          paint: {
            'fill-color': '#A7F3D0',
            'fill-opacity': isLight ? 0.38 : 0.25,
          },
        })

        // Borde verde punteado
        map.addLayer({
          id: 'gamc-terrenos-line',
          type: 'line',
          source: 'gamc-terrenos-source',
          paint: {
            'line-color': '#059669',
            'line-width': 1.8,
            'line-dasharray': [2, 2],
          },
        })

        // Extrusión 3D sutil para parcelas públicas
        map.addLayer({
          id: 'gamc-terrenos-extrusion',
          type: 'fill-extrusion',
          source: 'gamc-terrenos-source',
          paint: {
            'fill-extrusion-color': isLight ? '#D1FAE5' : '#064E3B',
            'fill-extrusion-height': 6,
            'fill-extrusion-opacity': 0.35,
          },
        })
      }

      // 3. Río Rocha y Franja de Seguridad de 200m
      if (referenciasGeo?.features && !map.getSource('referencias-geo-source')) {
        map.addSource('referencias-geo-source', {
          type: 'geojson',
          data: referenciasGeo,
        })

        // Buffer de seguridad 200m (halo azul agua tenue)
        map.addLayer({
          id: 'rio-rocha-buffer-200m',
          type: 'line',
          source: 'referencias-geo-source',
          filter: ['==', ['get', 'id'], 'rio_rocha'],
          paint: {
            'line-color': '#38BDF8',
            'line-width': 22,
            'line-opacity': 0.16,
          },
        })

        // Trazado del Río Rocha
        map.addLayer({
          id: 'rio-rocha-main-line',
          type: 'line',
          source: 'referencias-geo-source',
          filter: ['==', ['get', 'id'], 'rio_rocha'],
          paint: {
            'line-color': '#0EA5E9',
            'line-width': 4.5,
            'line-opacity': 0.95,
          },
        })
      }

      // 4. Líneas de Transporte Público
      if (transporteGeo?.features && !map.getSource('transporte-lines-source')) {
        map.addSource('transporte-lines-source', {
          type: 'geojson',
          data: transporteGeo,
        })

        map.addLayer({
          id: 'transporte-lines-layer',
          type: 'line',
          source: 'transporte-lines-source',
          paint: {
            'line-color': '#C4B5FD',
            'line-width': 1.4,
            'line-opacity': isLight ? 0.32 : 0.22,
          },
        })
      }

      // 5. Fuente y Capa de Halo de Cobertura Radial
      if (!map.getSource('sim-coverage-circle-source')) {
        map.addSource('sim-coverage-circle-source', {
          type: 'geojson',
          data: { type: 'FeatureCollection', features: [] },
        })

        // Relleno degradado del halo
        map.addLayer({
          id: 'sim-coverage-circle-fill',
          type: 'fill',
          source: 'sim-coverage-circle-source',
          paint: {
            'fill-color': tipoColor,
            'fill-opacity': 0.18,
          },
        })

        // Borde circular nítido
        map.addLayer({
          id: 'sim-coverage-circle-stroke',
          type: 'line',
          source: 'sim-coverage-circle-source',
          paint: {
            'line-color': tipoColor,
            'line-width': 2.5,
            'line-dasharray': [3, 2],
          },
        })
      }
    },
    [areasEquipData, referenciasGeo, transporteGeo, tipoColor]
  )

  // Actualización del círculo de cobertura radial
  const updateCoverageCircle = useCallback(
    (map) => {
      if (!map || !map.getSource('sim-coverage-circle-source')) return

      if (activePoint && activePoint.lat && activePoint.lng) {
        const circleFeat = createGeoJsonCircle(
          [activePoint.lng, activePoint.lat],
          radio
        )

        map
          .getSource('sim-coverage-circle-source')
          .setData({ type: 'FeatureCollection', features: [circleFeat] })

        if (map.getLayer('sim-coverage-circle-fill')) {
          map.setPaintProperty('sim-coverage-circle-fill', 'fill-color', tipoColor)
        }
        if (map.getLayer('sim-coverage-circle-stroke')) {
          map.setPaintProperty(
            'sim-coverage-circle-stroke',
            'line-color',
            tipoColor
          )
        }
      } else {
        map
          .getSource('sim-coverage-circle-source')
          .setData({ type: 'FeatureCollection', features: [] })
      }
    },
    [activePoint, radio, tipoColor]
  )

  useEffect(() => {
    const map = mapInstanceRef.current
    if (map && map.isStyleLoaded()) {
      updateCoverageCircle(map)
    }
  }, [updateCoverageCircle])

  // Actualización del Marcador 3D Ilustrado del Equipamiento Simulado
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map) return

    // Limpiar marcador anterior
    if (simulatedMarkerRef.current) {
      simulatedMarkerRef.current.remove()
      simulatedMarkerRef.current = null
    }

    if (!activePoint) return

    const el = document.createElement('div')
    if (tipo === 'salud') {
      el.innerHTML = renderHospitalSvg()
    } else if (tipo === 'educacion') {
      el.innerHTML = renderColegioSvg()
    } else {
      el.innerHTML = renderParqueSvg()
    }

    const marker = new Marker({
      element: el,
      anchor: 'bottom',
    })
      .setLngLat([activePoint.lng, activePoint.lat])
      .addTo(map)

    simulatedMarkerRef.current = marker

    // Pan suave de la cámara al nuevo equipamiento
    map.flyTo({
      center: [activePoint.lng, activePoint.lat],
      zoom: 14.5,
      pitch: cameraMode === '3d' ? 48 : 0,
      duration: 850,
      essential: true,
    })
  }, [activePoint, tipo, cameraMode])

  // Actualización de los Pines Flotantes 3D Numerados (Top 10 Candidatos)
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map) return

    // Limpiar pines anteriores
    candidateMarkersRef.current.forEach((m) => m.remove())
    candidateMarkersRef.current = []

    candidatos.forEach((c) => {
      const isSelected =
        activePoint?.lat === c.lat && activePoint?.lng === c.lon

      const el = document.createElement('div')
      el.className = `sim-candidate-3d-pin ${isSelected ? 'is-active' : ''}`
      el.innerHTML = `
        <div class="sim-pin-badge" style="background: ${tipoColor};">
          ${c.num}
        </div>
        <div class="sim-pin-stem"></div>
      `

      el.addEventListener('click', (e) => {
        e.stopPropagation()
        onSelectCandidate?.(c)
      })

      const marker = new Marker({
        element: el,
        anchor: 'bottom',
      })
        .setLngLat([c.lon, c.lat])
        .addTo(map)

      candidateMarkersRef.current.push(marker)
    })
  }, [candidatos, activePoint, tipoColor, onSelectCandidate])

  // Actualización de micro-íconos discretos de equipamientos existentes
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map) return

    existingMarkersRef.current.forEach((m) => m.remove())
    existingMarkersRef.current = []

    // Mostrar una muestra representativa (máx 60) para no saturar
    existingPoints.slice(0, 60).forEach((ep) => {
      const el = document.createElement('div')
      el.className = 'sim-existing-dot'
      el.style.backgroundColor =
        tipo === 'salud'
          ? '#EF4444'
          : tipo === 'educacion'
          ? '#3B82F6'
          : '#10B981'
      el.title = `${ep.nombre} (Existente)`

      const marker = new Marker({
        element: el,
        anchor: 'center',
      })
        .setLngLat([ep.lng, ep.lat])
        .addTo(map)

      existingMarkersRef.current.push(marker)
    })
  }, [existingPoints, tipo])

  // Alternar vista de cámara 3D vs 2D
  const toggleCameraMode = (mode) => {
    const map = mapInstanceRef.current
    if (!map) return
    setCameraMode(mode)
    if (mode === '3d') {
      map.easeTo({ pitch: 48, bearing: -15, duration: 1000 })
    } else {
      map.easeTo({ pitch: 0, bearing: 0, duration: 1000 })
    }
  }

  // Controles de navegación
  const handleZoomIn = () => mapInstanceRef.current?.zoomIn()
  const handleZoomOut = () => mapInstanceRef.current?.zoomOut()
  const handleResetNorth = () =>
    mapInstanceRef.current?.easeTo({ bearing: 0, duration: 600 })

  return (
    <div className="maplibre-sim-wrapper">
      {/* Contenedor Canvas WebGL de MapLibre */}
      <div ref={mapContainerRef} className="maplibre-sim-canvas" />

      {/* CONTROLES FLOTANTES EN LA ESQUINA SUPERIOR DERECHA */}
      <div className="maplibre-floating-controls">
        {/* Toggle Vista 3D Inclinada / Vista 2D Aérea */}
        <div className="maplibre-view-toggle-group">
          <button
            type="button"
            className={`maplibre-view-btn ${cameraMode === '3d' ? 'is-active' : ''}`}
            onClick={() => toggleCameraMode('3d')}
            title="Vista Isométrica 3D con extrusión de edificios"
          >
            <Box size={13} />
            <span>Vista 3D</span>
          </button>
          <button
            type="button"
            className={`maplibre-view-btn ${cameraMode === '2d' ? 'is-active' : ''}`}
            onClick={() => toggleCameraMode('2d')}
            title="Vista cenital 2D tradicional"
          >
            <span>Vista 2D</span>
          </button>
        </div>

        {/* Botones de Navegación (Zoom y Compás) */}
        <div className="maplibre-nav-buttons">
          <button
            type="button"
            className="maplibre-icon-btn"
            onClick={handleZoomIn}
            title="Acercar mapa"
          >
            <Plus size={15} />
          </button>
          <button
            type="button"
            className="maplibre-icon-btn"
            onClick={handleZoomOut}
            title="Alejar mapa"
          >
            <Minus size={15} />
          </button>
          <button
            type="button"
            className="maplibre-icon-btn"
            onClick={handleResetNorth}
            title="Restablecer orientación al Norte"
          >
            <Compass size={15} />
          </button>
        </div>
      </div>

      {/* TARJETA FLOTANTE COMPACTA EN LA ESQUINA INFERIOR IZQUIERDA */}
      {activePoint && (
        <div className="maplibre-floating-summary">
          <div className="maplibre-summary-badge-row">
            <span className="maplibre-summary-title">
              {tipo === 'salud' && '🏥 Nuevo Centro de Salud 1er Nivel'}
              {tipo === 'educacion' && '🎓 Nueva Unidad Educativa'}
              {tipo === 'parque' && '🌳 Nuevo Parque Urbano Distrital'}
            </span>
            <span
              style={{
                fontSize: '0.66rem',
                fontWeight: 800,
                color: tipoColor,
                background: `${tipoColor}18`,
                padding: '2px 6px',
                borderRadius: 4,
              }}
            >
              Radio {radio}m
            </span>
          </div>

          <div className="maplibre-summary-kpis">
            <span className="maplibre-summary-pill pill-beneficiarios">
              +{calculationResult?.personasGanan?.toLocaleString('es-BO') || '0'}{' '}
              hab. beneficiados
            </span>

            {isInsideMunicipal ? (
              <span className="maplibre-summary-pill pill-municipal">
                ✓ Terreno GAMC
              </span>
            ) : (
              <span className="maplibre-summary-pill pill-privado">
                ⚠️ Suelo Privado
              </span>
            )}

            {distTranspMeters !== null && distTranspMeters <= 300 && (
              <span className="maplibre-summary-pill pill-transporte">
                <Bus size={10} />
                Bus a {distTranspMeters}m
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
