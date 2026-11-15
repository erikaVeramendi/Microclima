import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import * as maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import {
  Box,
  Compass,
  Plus,
  Minus,
  HeartPulse,
  BookOpen,
  Trees,
  Bus,
  Layers,
  Thermometer,
  Wind,
  Droplets,
  Building2,
  MapPin,
} from 'lucide-react'
import './MapLibreSimulador3D.css'

const { Map, Marker, Popup } = maplibregl

// ─── Centroides aproximados de los 15 distritos de Cochabamba ────────────────
const DISTRICT_CENTROIDS = {
  1:  { lat: -17.364, lng: -66.128, label: 'D1' },
  2:  { lat: -17.352, lng: -66.174, label: 'D2' },
  3:  { lat: -17.373, lng: -66.184, label: 'D3' },
  4:  { lat: -17.396, lng: -66.189, label: 'D4' },
  5:  { lat: -17.425, lng: -66.168, label: 'D5' },
  6:  { lat: -17.410, lng: -66.140, label: 'D6' },
  7:  { lat: -17.378, lng: -66.212, label: 'D7' },
  8:  { lat: -17.455, lng: -66.112, label: 'D8' },
  9:  { lat: -17.430, lng: -66.185, label: 'D9' },
  10: { lat: -17.396, lng: -66.158, label: 'D10' },
  11: { lat: -17.387, lng: -66.140, label: 'D11' },
  12: { lat: -17.380, lng: -66.166, label: 'D12' },
  13: { lat: -17.323, lng: -66.151, label: 'D13' },
  14: { lat: -17.441, lng: -66.110, label: 'D14' },
  15: { lat: -17.486, lng: -66.128, label: 'D15' },
}

// Distritos con alta susceptibilidad a anegamiento / desborde del Río Rocha
const FLOOD_RISK_DISTRICTS = new Set([1, 4, 5, 8, 9, 13, 15])

// ─── Estilo Base 100% Público (OSM / Esri) — Prohibido CartoDB ────────────────
function getBaseStyle(isDark) {
  return {
    version: 8,
    name: isDark ? 'Esri Dark Gray' : 'OpenStreetMap Official',
    sources: {
      osm: {
        type: 'raster',
        tiles: [
          isDark
            ? 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}'
            : 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
        ],
        tileSize: 256,
        attribution: isDark
          ? '© Esri, OpenStreetMap'
          : '© OpenStreetMap contributors',
        maxzoom: 19,
      },
    },
    layers: [
      {
        id: 'osm-tiles',
        type: 'raster',
        source: 'osm',
        minzoom: 0,
        maxzoom: 22,
      },
    ],
  }
}

// ─── Generación de polígono circular exacto en metros ─────────────────────────
function createCircleGeoJSON(center, radiusMeters, points = 64) {
  if (!center || !radiusMeters) return null
  const [lng, lat] = center
  const km = radiusMeters / 1000
  const dX = km / (111.32 * Math.cos((lat * Math.PI) / 180))
  const dY = km / 110.574
  const coords = []
  for (let i = 0; i < points; i++) {
    const theta = (i / points) * 2 * Math.PI
    coords.push([lng + dX * Math.cos(theta), lat + dY * Math.sin(theta)])
  }
  coords.push(coords[0])
  return {
    type: 'Feature',
    geometry: { type: 'Polygon', coordinates: [coords] },
    properties: {},
  }
}

// ─── Marcador SVG 3D Ilustrado del Equipamiento Simulado ──────────────────────
function getSvgMarkerHTML(tipo) {
  const configs = {
    salud: {
      bg: '#DC2626', border: '#EF4444',
      label: '🏥 Centro de Salud 1er Nivel',
      svg: `<svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="24" cy="24" r="22" fill="#DC2626" stroke="#FFFFFF" stroke-width="2.5" filter="drop-shadow(0 4px 10px rgba(220,38,38,0.5))"/>
        <rect x="21" y="12" width="6" height="24" rx="2" fill="#FFFFFF"/>
        <rect x="12" y="21" width="24" height="6" rx="2" fill="#FFFFFF"/>
      </svg>`,
    },
    educacion: {
      bg: '#2563EB', border: '#3B82F6',
      label: '🎓 Unidad Educativa / Colegio',
      svg: `<svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="24" cy="24" r="22" fill="#2563EB" stroke="#FFFFFF" stroke-width="2.5" filter="drop-shadow(0 4px 10px rgba(37,99,235,0.5))"/>
        <text x="24" y="32" font-size="20" font-weight="900" fill="#FFFFFF" text-anchor="middle" font-family="sans-serif">🎓</text>
      </svg>`,
    },
    parque: {
      bg: '#059669', border: '#10B981',
      label: '🌳 Parque Urbano Distrital',
      svg: `<svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="24" cy="24" r="22" fill="#059669" stroke="#FFFFFF" stroke-width="2.5" filter="drop-shadow(0 4px 10px rgba(5,150,105,0.5))"/>
        <text x="24" y="32" font-size="20" font-weight="900" fill="#FFFFFF" text-anchor="middle" font-family="sans-serif">🌳</text>
      </svg>`,
    },
  }
  const c = configs[tipo] || configs.salud
  return `
    <div class="sim-3d-model-marker">
      <div class="sim-3d-label" style="background:${c.bg};border-color:${c.border};">${c.label}</div>
      ${c.svg}
    </div>`
}

const TIPO_COLORS = { salud: '#DC2626', educacion: '#2563EB', parque: '#059669' }

function getLSTColor(lst) {
  if (lst >= 30) return '#DC2626'
  if (lst >= 27) return '#F97316'
  if (lst >= 24) return '#FACC15'
  return '#38BDF8'
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
  equipamientosData = null,
  existingPoints = [],
  calculationResult = null,
  isInsideMunicipal = false,
  distTranspMeters = null,
  distRochaMeters = null,
  distritosGeoData = null,
  climateMode = 'none',
  onClimateModeChange,
}) {
  const mapContainerRef = useRef(null)
  const mapRef = useRef(null)
  const popupRef = useRef(new Popup({ closeButton: false, closeOnClick: false, offset: 12 }))
  const simulatedMarkerRef = useRef(null)
  const candidateMarkersRef = useRef([])
  const districtLabelMarkersRef = useRef([])
  const isLoadedRef = useRef(false)

  // Respaldo de datos locales para garantizar que NUNCA falte ninguna capa
  const [localDistritos, setLocalDistritos] = useState(null)
  const [localEquipamientos, setLocalEquipamientos] = useState(null)
  const [localAreas, setLocalAreas] = useState(null)
  const [localRefs, setLocalRefs] = useState(null)
  const [localTransp, setLocalTransp] = useState(null)

  const [theme, setTheme] = useState(
    () => document.documentElement.getAttribute('data-theme') || 'light'
  )
  const [cameraMode, setCameraMode] = useState('3d')

  // Interruptores de capas visibles encima del mapa
  const [visLayers, setVisLayers] = useState({
    distritos: true,
    salud: true,
    colegios: true,
    parques: true,
    transporte: true,
    terrenos: true,
  })

  const isDark = theme === 'dark'
  const tipoColor = TIPO_COLORS[tipo] || '#DC2626'

  // Carga interna de respaldo de GeoJSON si el componente padre no los pasó de inmediato
  useEffect(() => {
    let active = true
    if (!distritosGeoData) {
      fetch('/data/distritos_indicadores_ambientales_2024.geojson')
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => active && d && setLocalDistritos(d))
        .catch(() => {})
    }
    if (!equipamientosData) {
      fetch('/data/equipamientos.geojson')
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => active && d && setLocalEquipamientos(d))
        .catch(() => {})
    }
    if (!areasEquipData) {
      fetch('/data/areas_equipamiento.geojson')
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => active && d && setLocalAreas(d))
        .catch(() => {})
    }
    if (!referenciasGeo) {
      fetch('/data/referencias_geograficas.geojson')
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => active && d && setLocalRefs(d))
        .catch(() => {})
    }
    if (!transporteGeo) {
      fetch('/data/transporte_lineas_143.geojson')
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => active && d && setLocalTransp(d))
        .catch(() => {})
    }
    return () => { active = false }
  }, [distritosGeoData, equipamientosData, areasEquipData, referenciasGeo, transporteGeo])

  const effectiveDistritos = distritosGeoData || localDistritos
  const effectiveEquip = equipamientosData || localEquipamientos
  const effectiveAreas = areasEquipData || localAreas
  const effectiveRefs = referenciasGeo || localRefs
  const effectiveTransp = transporteGeo || localTransp

  // Escuchar cambios de tema (Modo Claro vs Modo Oscuro)
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setTheme(document.documentElement.getAttribute('data-theme') || 'light')
    })
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    return () => observer.disconnect()
  }, [])

  // ── Preparar datos de distritos con atributos climáticos ────────────────────
  const distritosEnriquecidos = useMemo(() => {
    if (!effectiveDistritos?.features) return null
    const activeDistId = calculationResult?.distritoId

    const features = effectiveDistritos.features.map((f) => {
      const cod = parseInt(String(f.properties?.codigo_distrito || '0'), 10)
      const lst = parseFloat(f.properties?.LST_C_mean || '26')
      const isSelected = cod === activeDistId

      let color = isSelected ? '#0284C7' : '#94A3B8'
      let opacity = isSelected ? 0.22 : 0.08

      if (climateMode === 'lst') {
        color = getLSTColor(lst)
        opacity = isSelected ? 0.6 : 0.45
      } else if (climateMode === 'pm10') {
        const lat = f.properties?.latitud || -17.4
        color = lat < -17.41 ? '#EF4444' : lat > -17.375 ? '#10B981' : '#F59E0B'
        opacity = isSelected ? 0.55 : 0.42
      } else if (climateMode === 'flood') {
        const hasRisk = FLOOD_RISK_DISTRICTS.has(cod)
        color = hasRisk ? '#0284C7' : '#94A3B8'
        opacity = hasRisk ? (isSelected ? 0.6 : 0.42) : 0.04
      }

      return {
        ...f,
        properties: {
          ...f.properties,
          _color: color,
          _opacity: opacity,
          _selected: isSelected,
        },
      }
    })

    return { type: 'FeatureCollection', features }
  }, [effectiveDistritos, climateMode, calculationResult])

  // Separar salud y educación desde el GeoJSON de equipamientos oficiales
  const saludGeoJson = useMemo(() => {
    if (!effectiveEquip?.features) return { type: 'FeatureCollection', features: [] }
    return {
      type: 'FeatureCollection',
      features: effectiveEquip.features.filter(
        (f) => f.properties?.tipo === 'salud' && f.geometry?.coordinates
      ),
    }
  }, [effectiveEquip])

  const colegiosGeoJson = useMemo(() => {
    if (!effectiveEquip?.features) return { type: 'FeatureCollection', features: [] }
    return {
      type: 'FeatureCollection',
      features: effectiveEquip.features.filter(
        (f) => f.properties?.tipo === 'educacion' && f.geometry?.coordinates
      ),
    }
  }, [effectiveEquip])

  // ── Sincronizar fuentes y capas sobre MapLibre ──────────────────────────────
  const syncLayers = useCallback(() => {
    const map = mapRef.current
    if (!map || !map.isStyleLoaded()) return

    const safeSource = (id, data) => {
      if (map.getSource(id)) {
        if (data) map.getSource(id).setData(data)
      } else if (data) {
        map.addSource(id, { type: 'geojson', data })
      }
    }

    const safeLayer = (layerSpec, beforeId) => {
      if (!map.getLayer(layerSpec.id)) {
        if (beforeId && map.getLayer(beforeId)) {
          map.addLayer(layerSpec, beforeId)
        } else {
          map.addLayer(layerSpec)
        }
      }
    }

    // 1. Distritos
    if (distritosEnriquecidos) {
      safeSource('distritos-src', distritosEnriquecidos)

      safeLayer({
        id: 'distritos-fill',
        type: 'fill',
        source: 'distritos-src',
        paint: {
          'fill-color': ['get', '_color'],
          'fill-opacity': ['get', '_opacity'],
        },
      })

      safeLayer({
        id: 'distritos-line',
        type: 'line',
        source: 'distritos-src',
        paint: {
          'line-color': '#1E293B',
          'line-width': ['case', ['get', '_selected'], 3.2, 1.8],
          'line-opacity': 0.85,
        },
      })
    }

    // 2. Parques y Áreas Verdes (2.353 espacios en verde esmeralda #10B981, opacidad 55%)
    if (effectiveAreas) {
      safeSource('parques-src', effectiveAreas)

      safeLayer({
        id: 'parques-fill',
        type: 'fill',
        source: 'parques-src',
        paint: {
          'fill-color': '#10B981',
          'fill-opacity': 0.55,
        },
      })

      safeLayer({
        id: 'parques-line',
        type: 'line',
        source: 'parques-src',
        paint: {
          'line-color': '#059669',
          'line-width': 1.2,
        },
      })
    }

    // 3. Terrenos Municipales GAMC (verde menta con borde punteado)
    if (effectiveAreas) {
      safeSource('terrenos-src', effectiveAreas)

      safeLayer({
        id: 'terrenos-fill',
        type: 'fill',
        source: 'terrenos-src',
        paint: {
          'fill-color': '#A7F3D0',
          'fill-opacity': 0.35,
        },
      })

      safeLayer({
        id: 'terrenos-line',
        type: 'line',
        source: 'terrenos-src',
        paint: {
          'line-color': '#059669',
          'line-width': 1.8,
          'line-dasharray': [2, 2],
        },
      })
    }

    // 4. Río Rocha (línea azul brillante #0EA5E9 con franja de alerta de 200m)
    if (effectiveRefs) {
      safeSource('rocha-src', effectiveRefs)

      safeLayer({
        id: 'rocha-buffer-line',
        type: 'line',
        source: 'rocha-src',
        filter: ['==', ['get', 'id'], 'rio_rocha'],
        paint: {
          'line-color': '#38BDF8',
          'line-width': 28,
          'line-opacity': 0.22,
        },
      })

      safeLayer({
        id: 'rocha-main-line',
        type: 'line',
        source: 'rocha-src',
        filter: ['==', ['get', 'id'], 'rio_rocha'],
        paint: {
          'line-color': '#0EA5E9',
          'line-width': 4.5,
          'line-opacity': 0.95,
        },
      })
    }

    // 5. Líneas de Transporte (143 líneas)
    if (effectiveTransp) {
      safeSource('transporte-src', effectiveTransp)

      safeLayer({
        id: 'transporte-lines',
        type: 'line',
        source: 'transporte-src',
        paint: {
          'line-color': '#8B5CF6',
          'line-width': 1.4,
          'line-opacity': 0.38,
        },
      })
    }

    // 6. Colegios existentes (264 puntos en azul #2563EB)
    if (colegiosGeoJson) {
      safeSource('colegios-src', colegiosGeoJson)

      safeLayer({
        id: 'colegios-circle',
        type: 'circle',
        source: 'colegios-src',
        paint: {
          'circle-radius': 5.5,
          'circle-color': '#2563EB',
          'circle-stroke-width': 1.8,
          'circle-stroke-color': '#FFFFFF',
        },
      })
    }

    // 7. Hospitales y Centros de Salud (67 puntos en rojo coral #DC2626)
    if (saludGeoJson) {
      safeSource('salud-src', saludGeoJson)

      safeLayer({
        id: 'salud-circle',
        type: 'circle',
        source: 'salud-src',
        paint: {
          'circle-radius': 6.5,
          'circle-color': '#DC2626',
          'circle-stroke-width': 2,
          'circle-stroke-color': '#FFFFFF',
        },
      })
    }

    // 8. Círculo de cobertura radial
    const circleData = activePoint
      ? createCircleGeoJSON([activePoint.lng, activePoint.lat], radio)
      : { type: 'FeatureCollection', features: [] }

    safeSource('coverage-src', circleData)

    safeLayer({
      id: 'coverage-fill',
      type: 'fill',
      source: 'coverage-src',
      paint: {
        'fill-color': tipoColor,
        'fill-opacity': 0.22,
      },
    })

    safeLayer({
      id: 'coverage-line',
      type: 'line',
      source: 'coverage-src',
      paint: {
        'line-color': tipoColor,
        'line-width': 2.5,
        'line-dasharray': [3, 2],
      },
    })

    // Actualizar propiedades de visibilidad según estado de botones
    const setVis = (id, show) => {
      if (map.getLayer(id)) {
        map.setLayoutProperty(id, 'visibility', show ? 'visible' : 'none')
      }
    }
    setVis('distritos-fill', visLayers.distritos)
    setVis('distritos-line', visLayers.distritos)
    setVis('parques-fill', visLayers.parques)
    setVis('parques-line', visLayers.parques)
    setVis('terrenos-fill', visLayers.terrenos)
    setVis('terrenos-line', visLayers.terrenos)
    setVis('rocha-buffer-line', visLayers.distritos)
    setVis('rocha-main-line', visLayers.distritos)
    setVis('transporte-lines', visLayers.transporte)
    setVis('salud-circle', visLayers.salud)
    setVis('colegios-circle', visLayers.colegios)

    // Tooltips interactivos al posar el cursor sobre salud y colegios
    const setupHover = (layerId, icon, label) => {
      map.off('mouseenter', layerId)
      map.off('mouseleave', layerId)
      map.on('mouseenter', layerId, (e) => {
        map.getCanvas().style.cursor = 'pointer'
        const p = e.features?.[0]?.properties || {}
        popupRef.current
          .setLngLat(e.lngLat)
          .setHTML(`
            <div style="font-family: system-ui, sans-serif; font-size: 11px; padding: 2px 4px; min-width: 140px;">
              <strong style="color:#0F172A; display:block; margin-bottom: 2px;">${icon} ${p.nombre || label}</strong>
              <span style="color:#64748B; font-size: 10px;">${p.nivel ? p.nivel + ' · ' : ''}Distrito ${p.codigo_distrito || 'Cochabamba'}</span>
            </div>
          `)
          .addTo(map)
      })
      map.on('mouseleave', layerId, () => {
        map.getCanvas().style.cursor = ''
        popupRef.current.remove()
      })
    }

    setupHover('salud-circle', '🏥', 'Centro de Salud')
    setupHover('colegios-circle', '🎓', 'Unidad Educativa')
  }, [
    distritosEnriquecidos,
    effectiveAreas,
    effectiveRefs,
    effectiveTransp,
    saludGeoJson,
    colegiosGeoJson,
    activePoint,
    radio,
    tipoColor,
    visLayers,
  ])

  // ── Inicialización del Mapa MapLibre GL JS ──────────────────────────────────
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return

    const initialCenter = activePoint
      ? [activePoint.lng, activePoint.lat]
      : [-66.158, -17.408]

    const map = new Map({
      container: mapContainerRef.current,
      style: getBaseStyle(isDark),
      center: initialCenter,
      zoom: 13,
      pitch: 45,
      bearing: -15,
      maxPitch: 65,
      attributionControl: false,
    })

    map.on('load', () => {
      isLoadedRef.current = true
      syncLayers()
    })

    map.on('click', (e) => {
      onMapClick?.({ lat: e.lngLat.lat, lng: e.lngLat.lng })
    })

    mapRef.current = map

    const ro = new ResizeObserver(() => map.resize())
    ro.observe(mapContainerRef.current)

    return () => {
      ro.disconnect()
      map.remove()
      mapRef.current = null
      isLoadedRef.current = false
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Cambio dinámico de estilo al alternar Tema Claro / Oscuro
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    map.setStyle(getBaseStyle(isDark))
    map.once('style.load', () => {
      syncLayers()
    })
  }, [isDark]) // eslint-disable-line react-hooks/exhaustive-deps

  // Re-sincronizar capas ante cualquier cambio de datos, visibilidad, punto o radio
  useEffect(() => {
    if (mapRef.current && mapRef.current.isStyleLoaded()) {
      syncLayers()
    }
  }, [syncLayers])

  // ── Actualizar Etiquetas D1..D15 de los distritos ──────────────────────────
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    districtLabelMarkersRef.current.forEach((m) => m.remove())
    districtLabelMarkersRef.current = []

    if (!visLayers.distritos) return

    const activeDistId = calculationResult?.distritoId

    Object.entries(DISTRICT_CENTROIDS).forEach(([numStr, pos]) => {
      const num = parseInt(numStr, 10)
      const isSelected = num === activeDistId

      const el = document.createElement('div')
      el.className = `sim-district-label ${isSelected ? 'is-selected' : ''}`
      el.textContent = pos.label

      const marker = new Marker({ element: el, anchor: 'center' })
        .setLngLat([pos.lng, pos.lat])
        .addTo(map)

      districtLabelMarkersRef.current.push(marker)
    })
  }, [visLayers.distritos, calculationResult?.distritoId])

  // ── Actualizar Marcador 3D Ilustrado del Equipamiento Simulado ───────────────
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    simulatedMarkerRef.current?.remove()
    simulatedMarkerRef.current = null

    if (!activePoint) return

    const el = document.createElement('div')
    el.innerHTML = getSvgMarkerHTML(tipo)

    const marker = new Marker({ element: el, anchor: 'bottom' })
      .setLngLat([activePoint.lng, activePoint.lat])
      .addTo(map)

    simulatedMarkerRef.current = marker

    map.flyTo({
      center: [activePoint.lng, activePoint.lat],
      zoom: 14.5,
      pitch: 45,
      duration: 800,
    })
  }, [activePoint, tipo])

  // ── Actualizar Pines 3D de Candidatos (#1 a #10) ───────────────────────────
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    candidateMarkersRef.current.forEach((m) => m.remove())
    candidateMarkersRef.current = []

    candidatos.forEach((c) => {
      const isSelected = activePoint?.lat === c.lat && activePoint?.lng === c.lon

      const el = document.createElement('div')
      el.className = `sim-candidate-3d-pin ${isSelected ? 'is-active' : ''}`
      el.innerHTML = `
        <div class="sim-pin-badge" style="background:${tipoColor};color:#FFFFFF;font-weight:800;">
          ${c.num}
        </div>
        <div class="sim-pin-stem"></div>
      `

      el.addEventListener('click', (e) => {
        e.stopPropagation()
        onSelectCandidate?.(c)
      })

      const marker = new Marker({ element: el, anchor: 'bottom' })
        .setLngLat([c.lon, c.lat])
        .addTo(map)

      candidateMarkersRef.current.push(marker)
    })
  }, [candidatos, activePoint, tipoColor, onSelectCandidate])

  // Alternar vista de cámara 3D inclinada vs 2D aérea
  const toggleCamera = (mode) => {
    const map = mapRef.current
    if (!map) return
    setCameraMode(mode)
    map.easeTo({
      pitch: mode === '3d' ? 45 : 0,
      bearing: mode === '3d' ? -15 : 0,
      duration: 900,
    })
  }

  const toggleLayer = (key) => {
    setVisLayers((p) => ({ ...p, [key]: !p[key] }))
  }

  const handleClimateSelect = (mode) => {
    onClimateModeChange?.(mode)
  }

  return (
    <div className="maplibre-sim-wrapper">
      {/* Contenedor Canvas WebGL MapLibre */}
      <div ref={mapContainerRef} className="maplibre-sim-canvas" />

      {/* BARRA SUPERIOR DE CAPAS E INFRAESTRUCTURA + SELECTOR CLIMÁTICO */}
      <div className="mls-top-bar">
        {/* Interruptores de Capas Oficiales */}
        <div className="mls-layer-pills">
          <button
            type="button"
            className={`mls-layer-pill ${visLayers.distritos ? 'is-on' : ''}`}
            onClick={() => toggleLayer('distritos')}
          >
            <MapPin size={11} />
            <span>Distritos</span>
          </button>
          <button
            type="button"
            className={`mls-layer-pill ${visLayers.salud ? 'is-on' : ''}`}
            onClick={() => toggleLayer('salud')}
          >
            <span>🏥 Salud ({saludGeoJson.features.length || 67})</span>
          </button>
          <button
            type="button"
            className={`mls-layer-pill ${visLayers.colegios ? 'is-on' : ''}`}
            onClick={() => toggleLayer('colegios')}
          >
            <span>🎓 Colegios ({colegiosGeoJson.features.length || 264})</span>
          </button>
          <button
            type="button"
            className={`mls-layer-pill ${visLayers.parques ? 'is-on' : ''}`}
            onClick={() => toggleLayer('parques')}
          >
            <span>🌳 Parques (2.353)</span>
          </button>
          <button
            type="button"
            className={`mls-layer-pill ${visLayers.transporte ? 'is-on' : ''}`}
            onClick={() => toggleLayer('transporte')}
          >
            <span>🚌 Transporte</span>
          </button>
          <button
            type="button"
            className={`mls-layer-pill ${visLayers.terrenos ? 'is-on' : ''}`}
            onClick={() => toggleLayer('terrenos')}
          >
            <span>🏛️ Terrenos GAMC</span>
          </button>
        </div>

        {/* Selector Climático Socio-Ambiental */}
        <div className="mls-climate-pills">
          <span style={{ fontSize: '0.66rem', fontWeight: 800, color: '#64748B', marginRight: 2 }}>
            CLIMA:
          </span>
          <button
            type="button"
            className={`mls-climate-pill ${climateMode === 'none' ? 'is-on' : ''}`}
            onClick={() => handleClimateSelect('none')}
          >
            <span>Normal</span>
          </button>
          <button
            type="button"
            className={`mls-climate-pill ${climateMode === 'lst' ? 'is-on' : ''}`}
            onClick={() => handleClimateSelect('lst')}
          >
            <span>🌡️ Calor LST</span>
          </button>
          <button
            type="button"
            className={`mls-climate-pill ${climateMode === 'pm10' ? 'is-on' : ''}`}
            onClick={() => handleClimateSelect('pm10')}
          >
            <span>💨 Aire PM10</span>
          </button>
          <button
            type="button"
            className={`mls-climate-pill ${climateMode === 'flood' ? 'is-on' : ''}`}
            onClick={() => handleClimateSelect('flood')}
          >
            <span>🌊 Inundación</span>
          </button>
        </div>
      </div>

      {/* CONTROLES DE CÁMARA Y NAVEGACIÓN (SUPERIOR DERECHA) */}
      <div className="maplibre-floating-controls">
        <div className="maplibre-view-toggle-group">
          <button
            type="button"
            className={`maplibre-view-btn ${cameraMode === '3d' ? 'is-active' : ''}`}
            onClick={() => toggleCamera('3d')}
            title="Vista 3D Isométrica"
          >
            <Box size={13} />
            <span>3D</span>
          </button>
          <button
            type="button"
            className={`maplibre-view-btn ${cameraMode === '2d' ? 'is-active' : ''}`}
            onClick={() => toggleCamera('2d')}
            title="Vista 2D Cenital"
          >
            <span>2D</span>
          </button>
        </div>
        <div className="maplibre-nav-buttons">
          <button
            type="button"
            className="maplibre-icon-btn"
            onClick={() => mapRef.current?.zoomIn()}
            title="Acercar"
          >
            <Plus size={14} />
          </button>
          <button
            type="button"
            className="maplibre-icon-btn"
            onClick={() => mapRef.current?.zoomOut()}
            title="Alejar"
          >
            <Minus size={14} />
          </button>
          <button
            type="button"
            className="maplibre-icon-btn"
            onClick={() => mapRef.current?.easeTo({ bearing: 0, pitch: 0, duration: 600 })}
            title="Orientar al Norte"
          >
            <Compass size={14} />
          </button>
        </div>
      </div>

      {/* HUD COMPACTO INFERIOR IZQUIERDO */}
      {activePoint && (
        <div className="maplibre-floating-summary">
          <div className="maplibre-summary-badge-row">
            <span className="maplibre-summary-title">
              {tipo === 'salud' && '🏥 Centro de Salud 1er Nivel'}
              {tipo === 'educacion' && '🎓 Unidad Educativa'}
              {tipo === 'parque' && '🌳 Parque Urbano Distrital'}
            </span>
            <span
              style={{
                fontSize: '0.66rem',
                fontWeight: 800,
                color: '#FFFFFF',
                background: tipoColor,
                padding: '2px 8px',
                borderRadius: 5,
              }}
            >
              Radio {radio}m
            </span>
          </div>

          <div className="maplibre-summary-kpis">
            <span className="maplibre-summary-pill pill-beneficiarios">
              +{calculationResult?.personasGanan?.toLocaleString('es-BO') || '0'} hab. cubiertos
            </span>
            {isInsideMunicipal ? (
              <span className="maplibre-summary-pill pill-municipal">
                ✓ Suelo Municipal GAMC
              </span>
            ) : (
              <span className="maplibre-summary-pill pill-privado">
                ⚠️ Suelo Privado
              </span>
            )}
            {distTranspMeters !== null && distTranspMeters <= 300 && (
              <span className="maplibre-summary-pill pill-transporte">
                <Bus size={10} /> Bus a {distTranspMeters}m
              </span>
            )}
            {distRochaMeters !== null && distRochaMeters < 200 && (
              <span
                className="maplibre-summary-pill"
                style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FCA5A5' }}
              >
                ⚠️ Río Rocha a {distRochaMeters}m
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
