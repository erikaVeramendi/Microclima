import { useState, useEffect, useMemo, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import {
  HeartPulse,
  GraduationCap,
  Bus,
  Trees,
  Search,
  RotateCcw,
  Layers,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  MapPin,
  Compass,
} from 'lucide-react'
import PopulationSourceSelector from './PopulationSourceSelector'
import { getIneFactor } from './populationUtils'
import { COCHABAMBA_ZONES } from '../../data/internalPanelData'
import './CoberturaServiciosScreen.css'

function haversineMeters(lon1, lat1, lon2, lat2) {
  const R = 6371000 // metros
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

export default function CoberturaServiciosScreen({
  selectedZoneId,
  onSelectZone,
}) {
  // Datos oficiales
  const [indiceData, setIndiceData] = useState(null)
  const [equipamientosData, setEquipamientosData] = useState(null)
  const [areasVerdesData, setAreasVerdesData] = useState(null)
  const [transporteData, setTransporteData] = useState(null)
  const [referenciasData, setReferenciasData] = useState(null)
  const [distritosGeoJson, setDistritosGeoJson] = useState(null)
  const [grillaData, setGrillaData] = useState(null)

  // Configuración de visualización
  const [basePoblacion, setBasePoblacion] = useState('ghsl')
  const [radioSalud, setRadioSalud] = useState(1000)
  const [radioColegios, setRadioColegios] = useState(1000)
  const [mostrarDeficit, setMostrarDeficit] = useState(false)
  const [rankingMetrica, setRankingMetrica] = useState('salud') // 'salud' | 'colegio' | 'transporte' | 'verde'

  // Interruptores de capas oficiales GAMC
  const [capasVisibles, setCapasVisibles] = useState({
    salud: true, // 67 centros (44 de 1er nivel) #DC2626
    colegios: true, // 264 colegios #2563EB
    verdes: true, // 2.353 espacios #059669
    transporte: true, // 143 líneas #7C3AED
    distritos: true, // 15 límites distritales
    referencias: true, // Río Rocha y Cota 2750 #0891B2
  })

  // Detección de tema actual (Light Mode por defecto)
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

  // Carga de fuentes GeoJSON y datos oficiales
  useEffect(() => {
    let isMounted = true

    fetch('/data/indice_distritos.json')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => isMounted && d && setIndiceData(d))
      .catch((err) => console.error('Error indice_distritos.json:', err))

    fetch('/data/equipamientos.geojson')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => isMounted && d && setEquipamientosData(d))
      .catch((err) => console.error('Error equipamientos.geojson:', err))

    fetch('/data/areas_equipamiento.geojson')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => isMounted && d && setAreasVerdesData(d))
      .catch((err) => console.error('Error areas_equipamiento.geojson:', err))

    fetch('/data/transporte_lineas_143.geojson')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => isMounted && d && setTransporteData(d))
      .catch((err) => console.error('Error transporte_lineas_143.geojson:', err))

    fetch('/data/referencias_geograficas.geojson')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => isMounted && d && setReferenciasData(d))
      .catch((err) => console.error('Error referencias_geograficas.geojson:', err))

    fetch('/data/distritos_indicadores_ambientales_2024.geojson')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => isMounted && d && setDistritosGeoJson(d))
      .catch((err) => console.error('Error distritos.geojson:', err))

    fetch('/data/poblacion_grilla.json')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => isMounted && d && setGrillaData(d))
      .catch((err) => console.error('Error poblacion_grilla.json:', err))

    return () => {
      isMounted = false
    }
  }, [])

  // Zona activa
  const activeZone = useMemo(() => {
    return (
      COCHABAMBA_ZONES.find((z) => z.id === selectedZoneId) ||
      COCHABAMBA_ZONES[0]
    )
  }, [selectedZoneId])

  const distNum = parseInt(
    String(activeZone.number || activeZone.id.replace('distrito-', '')),
    10
  )

  const distritoInfo = useMemo(() => {
    if (!indiceData?.distritos) return null
    return (
      indiceData.distritos.find((d) => parseInt(String(d.id), 10) === distNum) ||
      indiceData.distritos[0]
    )
  }, [indiceData, distNum])

  const indicadores = distritoInfo?.indicadores

  const ineFactor = useMemo(() => getIneFactor(indiceData), [indiceData])
  const pobFactor = basePoblacion === 'ine' ? ineFactor : 1

  // Promedios municipales oficiales
  const municipalAvg = useMemo(() => {
    if (!indiceData?.distritos || indiceData.distritos.length === 0) {
      return { salud: 61.9, colegio: 85.6, transporte: 94.6, verde: 14.75 }
    }
    const dists = indiceData.distritos
    const sumS = dists.reduce(
      (acc, d) => acc + (d.indicadores?.cobertura_salud || 0),
      0
    )
    const sumC = dists.reduce(
      (acc, d) => acc + (d.indicadores?.cobertura_colegio || 0),
      0
    )
    const sumT = dists.reduce(
      (acc, d) => acc + (d.indicadores?.cobertura_transporte || 0),
      0
    )
    const sumV = dists.reduce(
      (acc, d) => acc + (d.indicadores?.verde_por_hab || 0),
      0
    )
    return {
      salud: sumS / dists.length,
      colegio: sumC / dists.length,
      transporte: sumT / dists.length,
      verde: sumV / dists.length,
    }
  }, [indiceData])

  // Centros de salud de 1er nivel y colegios
  const saludPts = useMemo(() => {
    if (!equipamientosData?.features) return []
    return equipamientosData.features
      .filter((f) => {
        const p = f.properties
        return (
          p &&
          p.tipo === 'salud' &&
          p.nivel &&
          String(p.nivel).includes('1') &&
          f.geometry?.coordinates
        )
      })
      .map((f) => ({
        lng: f.geometry.coordinates[0],
        lat: f.geometry.coordinates[1],
        nombre: f.properties.nombre || 'Centro de Salud 1er nivel',
        nivel: f.properties.nivel || '1er nivel',
        distrito: f.properties.codigo_distrito || '',
      }))
  }, [equipamientosData])

  const colegioPts = useMemo(() => {
    if (!equipamientosData?.features) return []
    return equipamientosData.features
      .filter((f) => {
        const p = f.properties
        return p && p.tipo === 'educacion' && f.geometry?.coordinates
      })
      .map((f) => ({
        lng: f.geometry.coordinates[0],
        lat: f.geometry.coordinates[1],
        nombre: f.properties.nombre || 'Unidad Educativa',
        nivel: f.properties.nivel || 'Oficial',
        distrito: f.properties.codigo_distrito || '',
      }))
  }, [equipamientosData])

  // Recálculo dinámico de cobertura en base a los radios y celdas del distrito
  const calculoCobertura = useMemo(() => {
    const defaultRes = {
      salud: indicadores?.cobertura_salud ?? 61.9,
      colegio: indicadores?.cobertura_colegio ?? 85.6,
      pobTotal: Math.round((indicadores?.personas || 60000) * pobFactor),
      pobCubiertaSalud: Math.round(
        (indicadores?.personas || 60000) *
          pobFactor *
          ((indicadores?.cobertura_salud || 61.9) / 100)
      ),
      pobCubiertaColegio: Math.round(
        (indicadores?.personas || 60000) *
          pobFactor *
          ((indicadores?.cobertura_colegio || 85.6) / 100)
      ),
      celdasDeficitSalud: [],
    }

    if (!grillaData?.celdas || !distNum) return defaultRes

    const celdasDistrito = grillaData.celdas.filter(
      (c) => Math.round(c[4]) === distNum && c[2] > 0
    )
    if (celdasDistrito.length === 0) return defaultRes

    let totalPob = 0
    let coveredPobSalud = 0
    let coveredPobColegio = 0
    const celdasDeficitSalud = []

    const degBoxSalud = radioSalud / 100000
    const degBoxColegio = radioColegios / 100000

    for (let i = 0; i < celdasDistrito.length; i++) {
      const c = celdasDistrito[i]
      const cLon = c[0]
      const cLat = c[1]
      const cPob = Math.round(c[2] * pobFactor)
      totalPob += cPob

      // Verificación de cobertura de salud
      let isCoveredSalud = false
      for (let j = 0; j < saludPts.length; j++) {
        const sp = saludPts[j]
        if (
          Math.abs(cLat - sp.lat) <= degBoxSalud &&
          Math.abs(cLon - sp.lng) <= degBoxSalud
        ) {
          if (haversineMeters(cLon, cLat, sp.lng, sp.lat) <= radioSalud) {
            isCoveredSalud = true
            break
          }
        }
      }

      if (isCoveredSalud) {
        coveredPobSalud += cPob
      } else {
        celdasDeficitSalud.push({
          lon: cLon,
          lat: cLat,
          pob: cPob,
        })
      }

      // Verificación de cobertura escolar
      let isCoveredColegio = false
      for (let k = 0; k < colegioPts.length; k++) {
        const cp = colegioPts[k]
        if (
          Math.abs(cLat - cp.lat) <= degBoxColegio &&
          Math.abs(cLon - cp.lng) <= degBoxColegio
        ) {
          if (haversineMeters(cLon, cLat, cp.lng, cp.lat) <= radioColegios) {
            isCoveredColegio = true
            break
          }
        }
      }
      if (isCoveredColegio) coveredPobColegio += cPob
    }

    const pctSalud = totalPob > 0 ? (coveredPobSalud / totalPob) * 100 : 0
    const pctColegio = totalPob > 0 ? (coveredPobColegio / totalPob) * 100 : 0

    return {
      salud: Number(pctSalud.toFixed(1)),
      colegio: Number(pctColegio.toFixed(1)),
      pobTotal: totalPob,
      pobCubiertaSalud: coveredPobSalud,
      pobCubiertaColegio: coveredPobColegio,
      celdasDeficitSalud,
    }
  }, [
    grillaData,
    distNum,
    indicadores,
    pobFactor,
    radioSalud,
    radioColegios,
    saludPts,
    colegioPts,
  ])

  // Referencias DOM y Leaflet
  const mapContainerRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const baseTileRef = useRef(null)

  // Capas Leaflet administradas
  const distritosLayerRef = useRef(null)
  const saludMarkersRef = useRef(null)
  const saludRadiosRef = useRef(null)
  const colegiosMarkersRef = useRef(null)
  const colegiosRadiosRef = useRef(null)
  const areasVerdesLayerRef = useRef(null)
  const transporteLayerRef = useRef(null)
  const referenciasLayerRef = useRef(null)
  const deficitLayerRef = useRef(null)

  // 1. Inicialización del Mapa
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

  // 2. Basemap dinámico: CartoDB Positron (Modo Claro) / Dark Matter (Modo Oscuro)
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

  // 3. Renderizado de Límites Distritales
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map) return

    if (distritosLayerRef.current) {
      map.removeLayer(distritosLayerRef.current)
      distritosLayerRef.current = null
    }

    if (capasVisibles.distritos && distritosGeoJson?.features) {
      const isLight = theme === 'light'
      const layer = L.geoJSON(distritosGeoJson, {
        style: (feature) => {
          const cod = parseInt(String(feature.properties?.codigo_distrito), 10)
          const isSelected = cod === distNum
          return {
            color: isSelected
              ? '#0284C7'
              : isLight
              ? '#64748B'
              : 'rgba(56, 189, 248, 0.4)',
            weight: isSelected ? 3.5 : 1.5,
            fillColor: isSelected ? '#0284C7' : '#000000',
            fillOpacity: isSelected ? (isLight ? 0.12 : 0.22) : 0.02,
            dashArray: isSelected ? null : '3, 3',
          }
        },
        onEachFeature: (feature, l) => {
          const cod = feature.properties?.codigo_distrito
          const nom = feature.properties?.nombre || `Distrito ${cod}`

          l.bindTooltip(`<strong>${nom}</strong><br/>Clic para seleccionar`, {
            sticky: true,
            direction: 'top',
          })

          l.on('click', () => {
            if (cod) onSelectZone?.(`distrito-${cod}`)
          })
        },
      })

      layer.addTo(map)
      distritosLayerRef.current = layer
    }
  }, [distritosGeoJson, distNum, capasVisibles.distritos, theme, onSelectZone])

  // 4. Centrado suave al cambiar de distrito activo
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map || !distritosGeoJson?.features || !distNum) return

    const targetFeat = distritosGeoJson.features.find(
      (f) => parseInt(String(f.properties?.codigo_distrito), 10) === distNum
    )
    if (targetFeat) {
      try {
        const bounds = L.geoJSON(targetFeat).getBounds()
        if (bounds.isValid()) {
          map.fitBounds(bounds, { padding: [25, 25], maxZoom: 14 })
        }
      } catch (err) {
        // fallback
      }
    }
  }, [distNum, distritosGeoJson])

  // 5. Capa: Áreas Verdes y Parques GAMC (2.353 polígonos oficiales en #059669)
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map) return

    if (areasVerdesLayerRef.current) {
      map.removeLayer(areasVerdesLayerRef.current)
      areasVerdesLayerRef.current = null
    }

    if (capasVisibles.verdes && areasVerdesData?.features) {
      const layer = L.geoJSON(areasVerdesData, {
        style: {
          color: '#059669',
          weight: 1,
          fillColor: '#059669',
          fillOpacity: 0.6,
        },
        onEachFeature: (feature, l) => {
          const m2 = feature.properties?.area_m2
          l.bindTooltip(
            `<strong>Área Verde / Parque GAMC</strong><br/>Superficie: ${
              m2 ? m2.toLocaleString() + ' m²' : 'Registrado GAMC'
            }`,
            { sticky: true }
          )
        },
      })
      layer.addTo(map)
      areasVerdesLayerRef.current = layer
    }
  }, [areasVerdesData, capasVisibles.verdes])

  // 6. Capa: Líneas de Transporte GAMC (143 líneas oficiales en #7C3AED)
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map) return

    if (transporteLayerRef.current) {
      map.removeLayer(transporteLayerRef.current)
      transporteLayerRef.current = null
    }

    if (capasVisibles.transporte && transporteData?.features) {
      const layer = L.geoJSON(transporteData, {
        style: {
          color: '#7C3AED',
          weight: 2.2,
          opacity: 0.75,
        },
        onEachFeature: (feature, l) => {
          const nom = feature.properties?.nombre || 'Línea de Transporte'
          const tip = feature.properties?.tipo || 'Transporte'
          l.bindTooltip(
            `<strong>${nom}</strong><br/>Tipo: ${tip} · Red Oficial GAMC (300 m buffer)`,
            { sticky: true }
          )
        },
      })
      layer.addTo(map)
      transporteLayerRef.current = layer
    }
  }, [transporteData, capasVisibles.transporte])

  // 7. Capa: Referencias Geográficas (Río Rocha & Cota 2750 en #0891B2)
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map) return

    if (referenciasLayerRef.current) {
      map.removeLayer(referenciasLayerRef.current)
      referenciasLayerRef.current = null
    }

    if (capasVisibles.referencias && referenciasData?.features) {
      const layer = L.geoJSON(referenciasData, {
        style: (feature) => ({
          color: feature.properties?.color || '#0891B2',
          weight: feature.properties?.weight || 3,
          opacity: 0.85,
          dashArray: feature.properties?.dashArray || null,
        }),
        onEachFeature: (feature, l) => {
          l.bindTooltip(
            `<strong>${feature.properties?.nombre}</strong><br/>Referencia Territorial Cochabamba`,
            { sticky: true }
          )
        },
      })
      layer.addTo(map)
      referenciasLayerRef.current = layer
    }
  }, [referenciasData, capasVisibles.referencias])

  // 8. Capa: Centros de Salud 1er Nivel (#DC2626) con Marcadores Cruz Médica y Radios Translúcidos
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map) return

    if (saludMarkersRef.current) {
      map.removeLayer(saludMarkersRef.current)
      saludMarkersRef.current = null
    }
    if (saludRadiosRef.current) {
      map.removeLayer(saludRadiosRef.current)
      saludRadiosRef.current = null
    }

    if (capasVisibles.salud && saludPts.length > 0) {
      const markersGroup = L.layerGroup()
      const radiosGroup = L.layerGroup()

      saludPts.forEach((sp) => {
        // Marcador con ícono de cruz médica blanca sobre fondo #DC2626
        const iconHtml = `
          <div class="gamc-marker gamc-marker--salud">
            <svg viewBox="0 0 24 24" width="13" height="13" fill="white">
              <path d="M19 10.5h-5.5V5c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v5.5H5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5h5.5V19c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5v-5.5H19c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5z"/>
            </svg>
          </div>
        `
        const icon = L.divIcon({
          className: 'custom-leaflet-icon',
          html: iconHtml,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        })

        const marker = L.marker([sp.lat, sp.lng], { icon })
        marker.bindPopup(`
          <div class="cobertura-popup">
            <span class="cobertura-popup-badge salud">Salud 1er Nivel</span>
            <strong>${sp.nombre}</strong>
            <div class="cobertura-popup-sub">Distrito ${sp.distrito || 'Cochabamba'} · Radio activo: ${radioSalud} m</div>
          </div>
        `)
        marker.addTo(markersGroup)

        // Radio translúcido con borde punteado rojo
        const circle = L.circle([sp.lat, sp.lng], {
          radius: radioSalud,
          color: '#DC2626',
          weight: 1.5,
          dashArray: '4, 4',
          fillColor: '#DC2626',
          fillOpacity: 0.18,
        })
        circle.addTo(radiosGroup)
      })

      radiosGroup.addTo(map)
      markersGroup.addTo(map)
      saludRadiosRef.current = radiosGroup
      saludMarkersRef.current = markersGroup
    }
  }, [saludPts, capasVisibles.salud, radioSalud])

  // 9. Capa: Unidades Educativas (#2563EB) con Marcadores Escolares y Radios Translúcidos
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map) return

    if (colegiosMarkersRef.current) {
      map.removeLayer(colegiosMarkersRef.current)
      colegiosMarkersRef.current = null
    }
    if (colegiosRadiosRef.current) {
      map.removeLayer(colegiosRadiosRef.current)
      colegiosRadiosRef.current = null
    }

    if (capasVisibles.colegios && colegioPts.length > 0) {
      const markersGroup = L.layerGroup()
      const radiosGroup = L.layerGroup()

      colegioPts.forEach((cp) => {
        // Marcador con birrete/libro escolar blanco sobre fondo #2563EB
        const iconHtml = `
          <div class="gamc-marker gamc-marker--colegio">
            <svg viewBox="0 0 24 24" width="12" height="12" fill="white">
              <path d="M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82zM12 3L1 9l11 6 9-4.91V17h2V9L12 3z"/>
            </svg>
          </div>
        `
        const icon = L.divIcon({
          className: 'custom-leaflet-icon',
          html: iconHtml,
          iconSize: [22, 22],
          iconAnchor: [11, 11],
        })

        const marker = L.marker([cp.lat, cp.lng], { icon })
        marker.bindPopup(`
          <div class="cobertura-popup">
            <span class="cobertura-popup-badge colegio">Unidad Educativa</span>
            <strong>${cp.nombre}</strong>
            <div class="cobertura-popup-sub">Distrito ${cp.distrito || 'Cochabamba'} · Radio activo: ${radioColegios} m</div>
          </div>
        `)
        marker.addTo(markersGroup)

        // Radio translúcido con borde punteado azul
        const circle = L.circle([cp.lat, cp.lng], {
          radius: radioColegios,
          color: '#2563EB',
          weight: 1.5,
          dashArray: '4, 4',
          fillColor: '#2563EB',
          fillOpacity: 0.14,
        })
        circle.addTo(radiosGroup)
      })

      radiosGroup.addTo(map)
      markersGroup.addTo(map)
      colegiosRadiosRef.current = radiosGroup
      colegiosMarkersRef.current = markersGroup
    }
  }, [colegioPts, capasVisibles.colegios, radioColegios])

  // 10. Capa: Modo Zonas Desatendidas (Déficit) en Rojo Intenso (#EF4444)
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map) return

    if (deficitLayerRef.current) {
      map.removeLayer(deficitLayerRef.current)
      deficitLayerRef.current = null
    }

    if (mostrarDeficit && calculoCobertura.celdasDeficitSalud?.length > 0) {
      const group = L.layerGroup()

      calculoCobertura.celdasDeficitSalud.forEach((celda) => {
        const markerHtml = `<div class="gamc-marker--deficit" style="width: 10px; height: 10px;"></div>`
        const icon = L.divIcon({
          className: 'custom-deficit-icon',
          html: markerHtml,
          iconSize: [10, 10],
          iconAnchor: [5, 5],
        })

        const m = L.marker([celda.lat, celda.lon], { icon })
        m.bindTooltip(
          `<strong>⚠️ Zona sin cobertura inmediata de salud</strong><br/>Población estimada: ~${celda.pob.toLocaleString()} hab.<br/>Distancia > ${radioSalud} m del centro más cercano`,
          { sticky: true }
        )
        m.addTo(group)
      })

      group.addTo(map)
      deficitLayerRef.current = group
    }
  }, [mostrarDeficit, calculoCobertura.celdasDeficitSalud, radioSalud])

  const toggleCapa = (key) => {
    setCapasVisibles((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  // Delta cálculos
  const deltaSalud = calculoCobertura.salud - municipalAvg.salud
  const deltaColegio = calculoCobertura.colegio - municipalAvg.colegio
  const cobTransporte = indicadores?.cobertura_transporte ?? municipalAvg.transporte
  const deltaTransporte = cobTransporte - municipalAvg.transporte
  const verdeVal = indicadores?.verde_por_hab ?? municipalAvg.verde
  const verdeDeficit = verdeVal < 9 ? 9 - verdeVal : 0

  return (
    <div className="cobertura-screen-container">
      {/* 1. Barra superior: Título descriptivo + Selector Población GHSL vs INE */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.6rem',
        }}
      >
        <div>
          <span className="neo-micro-tag" style={{ color: '#0284C7' }}>
            ENFOQUE 2 · CIUDAD Y SERVICIOS PÚBLICOS
          </span>
          <h2 style={{ margin: '0.15rem 0 0', fontSize: '1.18rem', fontWeight: 800 }}>
            Cobertura de Servicios y Equipamiento Municipal
          </h2>
          <p
            style={{
              margin: '0.15rem 0 0',
              fontSize: '0.84rem',
              color: 'var(--theme-text-muted, #475569)',
            }}
          >
            Auditoría espacial de salud, educación, transporte y áreas verdes con datos oficiales del GAMC.
          </p>
        </div>

        <PopulationSourceSelector
          value={basePoblacion}
          onChange={setBasePoblacion}
        />
      </div>

      {/* 2. 4 Tarjetas KPI Superiores con borde de color y comparativa municipal */}
      <section className="cobertura-kpis-grid">
        {/* KPI 1: Salud 1er nivel */}
        <div className="cobertura-kpi-card kpi-salud">
          <div className="cobertura-kpi-header">
            <span className="cobertura-kpi-label">COBERTURA SALUD 1ER NIVEL</span>
            <span className="cobertura-kpi-badge badge-salud">
              Radio {radioSalud} m
            </span>
          </div>
          <div className="cobertura-kpi-val-row">
            <span className="cobertura-kpi-val">
              {calculoCobertura.salud.toFixed(1)}%
            </span>
            <span className="cobertura-kpi-unit">población</span>
          </div>
          <div className="cobertura-progress-track">
            <div
              className="cobertura-progress-fill"
              style={{
                width: `${Math.min(100, Math.max(0, calculoCobertura.salud))}%`,
                background: '#DC2626',
              }}
            />
          </div>
          <div className="cobertura-kpi-footer">
            <span>Promedio: {municipalAvg.salud.toFixed(1)}%</span>
            <span
              style={{
                fontWeight: 700,
                color: deltaSalud >= 0 ? '#10B981' : '#EF4444',
              }}
            >
              {deltaSalud >= 0 ? `+${deltaSalud.toFixed(1)}%` : `${deltaSalud.toFixed(1)}%`}
            </span>
          </div>
        </div>

        {/* KPI 2: Colegios */}
        <div className="cobertura-kpi-card kpi-colegios">
          <div className="cobertura-kpi-header">
            <span className="cobertura-kpi-label">COBERTURA COLEGIOS</span>
            <span className="cobertura-kpi-badge badge-colegios">
              Radio {radioColegios} m
            </span>
          </div>
          <div className="cobertura-kpi-val-row">
            <span className="cobertura-kpi-val">
              {calculoCobertura.colegio.toFixed(1)}%
            </span>
            <span className="cobertura-kpi-unit">población</span>
          </div>
          <div className="cobertura-progress-track">
            <div
              className="cobertura-progress-fill"
              style={{
                width: `${Math.min(100, Math.max(0, calculoCobertura.colegio))}%`,
                background: '#2563EB',
              }}
            />
          </div>
          <div className="cobertura-kpi-footer">
            <span>Promedio: {municipalAvg.colegio.toFixed(1)}%</span>
            <span
              style={{
                fontWeight: 700,
                color: deltaColegio >= 0 ? '#10B981' : '#EF4444',
              }}
            >
              {deltaColegio >= 0 ? `+${deltaColegio.toFixed(1)}%` : `${deltaColegio.toFixed(1)}%`}
            </span>
          </div>
        </div>

        {/* KPI 3: Transporte */}
        <div className="cobertura-kpi-card kpi-transporte">
          <div className="cobertura-kpi-header">
            <span className="cobertura-kpi-label">COBERTURA TRANSPORTE</span>
            <span className="cobertura-kpi-badge badge-transporte">
              Estándar 300 m
            </span>
          </div>
          <div className="cobertura-kpi-val-row">
            <span className="cobertura-kpi-val">
              {cobTransporte.toFixed(1)}%
            </span>
            <span className="cobertura-kpi-unit">caminable</span>
          </div>
          <div className="cobertura-progress-track">
            <div
              className="cobertura-progress-fill"
              style={{
                width: `${Math.min(100, Math.max(0, cobTransporte))}%`,
                background: '#7C3AED',
              }}
            />
          </div>
          <div className="cobertura-kpi-footer">
            <span>Promedio: {municipalAvg.transporte.toFixed(1)}%</span>
            <span
              style={{
                fontWeight: 700,
                color: deltaTransporte >= 0 ? '#10B981' : '#EF4444',
              }}
            >
              {deltaTransporte >= 0 ? `+${deltaTransporte.toFixed(1)}%` : `${deltaTransporte.toFixed(1)}%`}
            </span>
          </div>
        </div>

        {/* KPI 4: Áreas Verdes */}
        <div className="cobertura-kpi-card kpi-verde">
          <div className="cobertura-kpi-header">
            <span className="cobertura-kpi-label">ÁREAS VERDES / HAB.</span>
            <span className="cobertura-kpi-badge badge-verde">
              Meta OMS ≥ 9 m²
            </span>
          </div>
          <div className="cobertura-kpi-val-row">
            <span className="cobertura-kpi-val">
              {verdeVal.toFixed(1)}
            </span>
            <span className="cobertura-kpi-unit">m²/hab.</span>
          </div>
          <div className="cobertura-progress-track">
            <div
              className="cobertura-progress-fill"
              style={{
                width: `${Math.min(100, (verdeVal / 25) * 100)}%`,
                background: verdeVal >= 9 ? '#059669' : '#EF4444',
              }}
            />
          </div>
          <div className="cobertura-kpi-footer">
            <span>{verdeVal >= 9 ? 'Cumple estándar' : `Déficit: -${verdeDeficit.toFixed(1)} m²`}</span>
            <span
              style={{
                fontWeight: 700,
                color: verdeVal >= 9 ? '#059669' : '#EF4444',
              }}
            >
              {verdeVal >= 9 ? 'Óptimo' : 'Crítico'}
            </span>
          </div>
        </div>
      </section>

      {/* 3. Centro: Mapa Multicapa Leaflet (7) + Panel de Control y Simulación (5) */}
      <section className="cobertura-main-grid">
        {/* Mapa Leaflet */}
        <div className="cobertura-map-card">
          <div className="cobertura-map-header">
            <div className="cobertura-map-title-box">
              <span className="neo-micro-tag">MAPA CARTOGRÁFICO MULTICAPA</span>
              <h3>Capas Oficiales GAMC · {activeZone.name}</h3>
            </div>

            {/* Selector rápido de los 15 distritos */}
            <div className="cobertura-districts-pill-bar">
              {Array.from({ length: 15 }, (_, i) => i + 1).map((num) => {
                const isCurrent = num === distNum
                return (
                  <button
                    key={num}
                    type="button"
                    className={`cobertura-dist-btn ${isCurrent ? 'is-active' : ''}`}
                    onClick={() => onSelectZone?.(`distrito-${num}`)}
                    title={`Ver Distrito ${num}`}
                  >
                    D{num}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Contenedor del Mapa */}
          <div className="cobertura-leaflet-wrapper">
            <div ref={mapContainerRef} className="cobertura-leaflet-instance" />
          </div>

          {/* Leyenda interactiva inferior */}
          <div className="cobertura-map-legend">
            <span className="cobertura-legend-item">
              <span className="cobertura-legend-dot" style={{ background: '#DC2626' }} />
              Salud 1er nivel ({radioSalud} m)
            </span>
            <span className="cobertura-legend-item">
              <span className="cobertura-legend-dot" style={{ background: '#2563EB' }} />
              Colegios ({radioColegios} m)
            </span>
            <span className="cobertura-legend-item">
              <span className="cobertura-legend-dot" style={{ background: '#059669' }} />
              Áreas verdes (2.353)
            </span>
            <span className="cobertura-legend-item">
              <span className="cobertura-legend-dot" style={{ background: '#7C3AED' }} />
              Transporte (143 líneas)
            </span>
            <span className="cobertura-legend-item">
              <span className="cobertura-legend-dot" style={{ background: '#0891B2' }} />
              Río Rocha & Cota 2750
            </span>
            {mostrarDeficit && (
              <span className="cobertura-legend-item" style={{ color: '#DC2626', fontWeight: 700 }}>
                <span className="cobertura-legend-dot" style={{ background: '#EF4444' }} />
                Zonas sin cobertura directa
              </span>
            )}
          </div>
        </div>

        {/* Panel derecho: Controles, Toggles y Radios */}
        <div className="cobertura-control-card">
          {/* Botón destacado: Resaltar Zonas Desatendidas */}
          <div>
            <button
              type="button"
              className={`cobertura-btn-deficit ${mostrarDeficit ? 'is-active' : ''}`}
              onClick={() => setMostrarDeficit(!mostrarDeficit)}
            >
              <Search size={16} />
              <span>🔍 Resaltar Zonas Desatendidas (Déficit)</span>
              {mostrarDeficit && <span className="cobertura-pulse-dot" />}
            </button>

            {mostrarDeficit && (
              <div className="cobertura-deficit-alert" style={{ marginTop: '0.45rem' }}>
                <strong>⚠️ Auditoría de Déficit Territorial:</strong>
                <div>
                  En el <strong>{activeZone.name}</strong>, aproximadamente{' '}
                  <strong>
                    {(
                      calculoCobertura.pobTotal - calculoCobertura.pobCubiertaSalud
                    ).toLocaleString()}{' '}
                    habitantes ({(100 - calculoCobertura.salud).toFixed(1)}%)
                  </strong>{' '}
                  habitan en celdas a más de {radioSalud} m de un centro de salud de 1er nivel.
                </div>
              </div>
            )}
          </div>

          {/* Interruptores de Capas Oficiales */}
          <div className="cobertura-layers-group">
            <div
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                color: 'var(--theme-text-muted, #64748B)',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                marginBottom: '0.1rem',
              }}
            >
              Capas Oficiales de la Alcaldía (GAMC)
            </div>

            {/* Toggle Salud */}
            <div
              className="cobertura-layer-toggle"
              onClick={() => toggleCapa('salud')}
            >
              <div className="cobertura-layer-info">
                <span
                  className="cobertura-layer-badge"
                  style={{ background: '#DC2626' }}
                >
                  ✚
                </span>
                <div>
                  <span className="cobertura-layer-name">Salud 1er Nivel</span>
                  <span className="cobertura-layer-count"> · 44 centros (67 totales)</span>
                </div>
              </div>
              <div className={`cobertura-switch-pill ${capasVisibles.salud ? 'is-active' : ''}`}>
                <div className="cobertura-switch-knob" />
              </div>
            </div>

            {/* Toggle Colegios */}
            <div
              className="cobertura-layer-toggle"
              onClick={() => toggleCapa('colegios')}
            >
              <div className="cobertura-layer-info">
                <span
                  className="cobertura-layer-badge"
                  style={{ background: '#2563EB' }}
                >
                  🎓
                </span>
                <div>
                  <span className="cobertura-layer-name">Unidades Educativas</span>
                  <span className="cobertura-layer-count"> · 264 colegios</span>
                </div>
              </div>
              <div className={`cobertura-switch-pill ${capasVisibles.colegios ? 'is-active' : ''}`}>
                <div className="cobertura-switch-knob" />
              </div>
            </div>

            {/* Toggle Áreas Verdes */}
            <div
              className="cobertura-layer-toggle"
              onClick={() => toggleCapa('verdes')}
            >
              <div className="cobertura-layer-info">
                <span
                  className="cobertura-layer-badge"
                  style={{ background: '#059669' }}
                >
                  🌲
                </span>
                <div>
                  <span className="cobertura-layer-name">Parques y Áreas Verdes</span>
                  <span className="cobertura-layer-count"> · 2.353 espacios</span>
                </div>
              </div>
              <div className={`cobertura-switch-pill ${capasVisibles.verdes ? 'is-active' : ''}`}>
                <div className="cobertura-switch-knob" />
              </div>
            </div>

            {/* Toggle Transporte */}
            <div
              className="cobertura-layer-toggle"
              onClick={() => toggleCapa('transporte')}
            >
              <div className="cobertura-layer-info">
                <span
                  className="cobertura-layer-badge"
                  style={{ background: '#7C3AED' }}
                >
                  🚌
                </span>
                <div>
                  <span className="cobertura-layer-name">Líneas de Transporte</span>
                  <span className="cobertura-layer-count"> · 143 rutas oficiales</span>
                </div>
              </div>
              <div className={`cobertura-switch-pill ${capasVisibles.transporte ? 'is-active' : ''}`}>
                <div className="cobertura-switch-knob" />
              </div>
            </div>

            {/* Toggle Límites Distritales */}
            <div
              className="cobertura-layer-toggle"
              onClick={() => toggleCapa('distritos')}
            >
              <div className="cobertura-layer-info">
                <span
                  className="cobertura-layer-badge"
                  style={{ background: '#0891B2' }}
                >
                  🗺️
                </span>
                <div>
                  <span className="cobertura-layer-name">Límites Distritales</span>
                  <span className="cobertura-layer-count"> · 15 distritos</span>
                </div>
              </div>
              <div className={`cobertura-switch-pill ${capasVisibles.distritos ? 'is-active' : ''}`}>
                <div className="cobertura-switch-knob" />
              </div>
            </div>

            {/* Toggle Río Rocha & Cota 2750 */}
            <div
              className="cobertura-layer-toggle"
              onClick={() => toggleCapa('referencias')}
            >
              <div className="cobertura-layer-info">
                <span
                  className="cobertura-layer-badge"
                  style={{ background: '#0284C7' }}
                >
                  💧
                </span>
                <div>
                  <span className="cobertura-layer-name">Río Rocha & Cota 2750</span>
                  <span className="cobertura-layer-count"> · Ejes ecológicos</span>
                </div>
              </div>
              <div className={`cobertura-switch-pill ${capasVisibles.referencias ? 'is-active' : ''}`}>
                <div className="cobertura-switch-knob" />
              </div>
            </div>
          </div>

          {/* Sliders de Radios de Cobertura */}
          <div className="cobertura-radios-box">
            <div
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                color: 'var(--theme-text-muted, #64748B)',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
              }}
            >
              Simulador de Radios Caminables
            </div>

            {/* Slider Salud */}
            <div className="cobertura-slider-item">
              <div className="cobertura-slider-top">
                <span className="cobertura-slider-label">Radio de Salud (1er Nivel):</span>
                <span className="cobertura-slider-val" style={{ color: '#DC2626' }}>
                  {radioSalud} m
                </span>
              </div>
              <input
                type="range"
                min="500"
                max="2000"
                step="50"
                value={radioSalud}
                onChange={(e) => setRadioSalud(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#DC2626' }}
              />
              <div className="cobertura-slider-sub">
                <span>500 m (6 min a pie)</span>
                <span>2.000 m (24 min)</span>
              </div>
            </div>

            {/* Slider Colegios */}
            <div className="cobertura-slider-item">
              <div className="cobertura-slider-top">
                <span className="cobertura-slider-label">Radio Escolar:</span>
                <span className="cobertura-slider-val" style={{ color: '#2563EB' }}>
                  {radioColegios} m
                </span>
              </div>
              <input
                type="range"
                min="500"
                max="2000"
                step="50"
                value={radioColegios}
                onChange={(e) => setRadioColegios(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#2563EB' }}
              />
              <div className="cobertura-slider-sub">
                <span>500 m (6 min a pie)</span>
                <span>2.000 m (24 min)</span>
              </div>
            </div>

            <button
              type="button"
              className="cobertura-btn-reset"
              onClick={() => {
                setRadioSalud(1000)
                setRadioColegios(1000)
              }}
            >
              Restablecer radios estándar (1.000 m)
            </button>
          </div>
        </div>
      </section>

      {/* 4. Sección Inferior: Comparativa Municipal (Ranking 15 Distritos) + Ficha Territorial */}
      <section className="cobertura-bottom-grid">
        {/* Tarjeta Izquierda: Ranking Comparativo de Cobertura */}
        <div className="cobertura-ranking-card">
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '0.4rem',
            }}
          >
            <div>
              <span className="neo-micro-tag">BENCHMARKING MUNICIPAL</span>
              <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700 }}>
                Comparativa de los 15 Distritos
              </h3>
            </div>

            {/* Filtros de Métrica para Ranking */}
            <div style={{ display: 'flex', gap: '0.25rem' }}>
              <button
                type="button"
                className={`indice-pill-btn ${rankingMetrica === 'salud' ? 'is-active' : ''}`}
                onClick={() => setRankingMetrica('salud')}
                style={{ fontSize: '0.68rem', padding: '0.2rem 0.5rem' }}
              >
                Salud
              </button>
              <button
                type="button"
                className={`indice-pill-btn ${rankingMetrica === 'colegio' ? 'is-active' : ''}`}
                onClick={() => setRankingMetrica('colegio')}
                style={{ fontSize: '0.68rem', padding: '0.2rem 0.5rem' }}
              >
                Colegios
              </button>
              <button
                type="button"
                className={`indice-pill-btn ${rankingMetrica === 'transporte' ? 'is-active' : ''}`}
                onClick={() => setRankingMetrica('transporte')}
                style={{ fontSize: '0.68rem', padding: '0.2rem 0.5rem' }}
              >
                Transporte
              </button>
              <button
                type="button"
                className={`indice-pill-btn ${rankingMetrica === 'verde' ? 'is-active' : ''}`}
                onClick={() => setRankingMetrica('verde')}
                style={{ fontSize: '0.68rem', padding: '0.2rem 0.5rem' }}
              >
                Área Verde
              </button>
            </div>
          </div>

          <div className="cobertura-ranking-list">
            {(indiceData?.distritos || [])
              .map((d) => {
                let val = 0
                let color = '#DC2626'
                let unit = '%'

                if (rankingMetrica === 'salud') {
                  val = d.indicadores?.cobertura_salud || 0
                  color = '#DC2626'
                } else if (rankingMetrica === 'colegio') {
                  val = d.indicadores?.cobertura_colegio || 0
                  color = '#2563EB'
                } else if (rankingMetrica === 'transporte') {
                  val = d.indicadores?.cobertura_transporte || 0
                  color = '#7C3AED'
                } else {
                  val = d.indicadores?.verde_por_hab || 0
                  color = '#059669'
                  unit = ' m²'
                }

                return {
                  id: d.id,
                  nombre: d.nombre,
                  val,
                  color,
                  unit,
                }
              })
              .sort((a, b) => b.val - a.val)
              .map((d, idx) => {
                const isSelected = parseInt(String(d.id), 10) === distNum
                const maxVal = rankingMetrica === 'verde' ? 30 : 100
                const pctWidth = Math.min(100, Math.max(5, (d.val / maxVal) * 100))

                return (
                  <div
                    key={d.id}
                    className={`cobertura-ranking-row ${isSelected ? 'is-selected' : ''}`}
                    onClick={() => onSelectZone?.(`distrito-${d.id}`)}
                    title={`Ver ${d.nombre}`}
                  >
                    <span style={{ fontSize: '0.74rem', fontWeight: isSelected ? 800 : 600 }}>
                      #{idx + 1} D{d.id}
                    </span>
                    <div className="cobertura-ranking-bar-bg">
                      <div
                        className="cobertura-ranking-bar-fill"
                        style={{
                          width: `${pctWidth}%`,
                          background: d.color,
                        }}
                      />
                    </div>
                    <span
                      style={{
                        fontSize: '0.72rem',
                        fontFamily: 'var(--font-mono, monospace)',
                        fontWeight: 700,
                        textAlign: 'right',
                        color: isSelected ? d.color : 'inherit',
                      }}
                    >
                      {d.val.toFixed(1)}
                      {d.unit}
                    </span>
                  </div>
                )
              })}
          </div>
        </div>

        {/* Tarjeta Derecha: Ficha Territorial del Distrito Activo */}
        <div className="cobertura-ficha-card">
          <div className="neo-card-header" style={{ marginBottom: '0.35rem' }}>
            <div>
              <span className="neo-micro-tag">DIAGNÓSTICO Y ALERTAS GAMC</span>
              <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700 }}>
                {activeZone.name} · Ficha Territorial
              </h3>
            </div>
            <span
              className="cobertura-kpi-badge badge-salud"
              style={{ fontSize: '0.7rem' }}
            >
              {Math.round((indicadores?.personas || 60000) * pobFactor).toLocaleString()} hab.
            </span>
          </div>

          <p
            style={{
              fontSize: '0.78rem',
              color: 'var(--theme-text-muted, #475569)',
              margin: '0.1rem 0 0.4rem',
              lineHeight: 1.4,
            }}
          >
            Inventario registrado en el Geoportal GAMC:{' '}
            <strong>{indicadores?.salud_1er || 0}</strong> centros de salud de primer nivel,{' '}
            <strong>{indicadores?.colegios || 0}</strong> unidades educativas y{' '}
            <strong>
              {(
                (indicadores?.area_verde_m2 || 0) / 10000
              ).toFixed(1)}{' '}
              hectáreas
            </strong>{' '}
            de espacios verdes públicos.
          </p>

          <div className="cobertura-alerts-list">
            {(distritoInfo?.alertas || []).length > 0 ? (
              distritoInfo.alertas.map((a, i) => (
                <div key={i} className="cobertura-alert-item">
                  <AlertTriangle
                    size={15}
                    style={{
                      color: a.tipo === 'salud' ? '#DC2626' : '#F59E0B',
                      flexShrink: 0,
                      marginTop: '2px',
                    }}
                  />
                  <span>{a.texto}</span>
                </div>
              ))
            ) : (
              <div className="cobertura-alert-item">
                <CheckCircle2 size={15} style={{ color: '#10B981', flexShrink: 0 }} />
                <span>
                  El distrito cuenta con una red de cobertura equilibrada según los parámetros de la Alcaldía.
                </span>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
