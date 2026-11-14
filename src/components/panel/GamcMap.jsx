import { useState, useEffect, useRef, useCallback } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import {
  Layers,
  ChevronDown,
  ChevronUp,
  AlertCircle,
} from 'lucide-react'
import './GamcMap.css'

// Catálogo maestro de capas oficiales del Geoportal GAMC (Alcaldía de Cochabamba)
const GAMC_WMS_LAYERS = [
  {
    id: 'centros_salud',
    name: 'Centros de salud',
    service_id: 'e40fa280-f649-4614-9526-1b3dcce596b3',
    keyEnvVar: 'VITE_GAMC_KEY',
    defaultVisible: true, // "Prueba con la capa de centros de salud encendida"
    color: '#EF4444',
    category: 'Equipamiento',
  },
  {
    id: 'unidades_educativas',
    name: 'Unidades educativas',
    service_id: '7655ba3d-5d9e-44ff-bf65-26f81f83d7ec',
    keyEnvVar: 'VITE_GAMC_KEY',
    defaultVisible: false,
    color: '#F59E0B',
    category: 'Equipamiento',
  },
  {
    id: 'areas_verdes',
    name: 'Áreas verdes',
    service_id: '47360ddc-e35f-4ece-a995-59e90eb79cc6',
    keyEnvVar: 'VITE_GAMC_KEY',
    defaultVisible: false,
    color: '#10B981',
    category: 'Medio Ambiente',
  },
  {
    id: 'areas_equipamiento',
    name: 'Áreas de equipamiento',
    service_id: '97a589fe-595e-45dd-91d4-38524877f1ed',
    keyEnvVar: 'VITE_GAMC_KEY',
    defaultVisible: false,
    color: '#8B5CF6',
    category: 'Planificación',
  },
  {
    id: 'limite_distritos',
    name: 'Límite de distritos',
    service_id: '7eb13092-bf0e-493b-aae6-03c43eedda2c',
    keyEnvVar: 'VITE_GAMC_KEY',
    defaultVisible: false,
    color: '#06B6D4',
    category: 'Límites',
  },
  {
    id: 'limite_urbano',
    name: 'Límite urbano',
    service_id: 'fd77d463-9729-4c66-b686-23dccbb4ab8f',
    keyEnvVar: 'VITE_GAMC_KEY',
    defaultVisible: false,
    color: '#94A3B8',
    category: 'Límites',
  },
  {
    id: 'poblacion_manzanas',
    name: 'Población por manzanas',
    service_id: '194a02a0-a73a-48c1-a260-82847c5c905d',
    keyEnvVar: 'VITE_GAMC_KEY',
    defaultVisible: false,
    color: '#EC4899',
    category: 'Demografía',
  },
  {
    id: 'cota_2750',
    name: 'Cota 2750 (Parque Tunari)',
    service_id: '297cefa4-0832-42bb-a98e-2cbea989fd9d',
    keyEnvVar: 'VITE_GAMC_KEY_P01', // Proyecto 01 según especificación oficial
    defaultVisible: false,
    color: '#38BDF8',
    category: 'Área Protegida',
  },
]

const DEFAULT_CENTER = [-17.39, -66.16]
const DEFAULT_ZOOM = 12

/**
 * Obtiene la clave de autenticación para cada capa según el proyecto del GAMC.
 * Todas usan VITE_GAMC_KEY excepto Cota 2750 que usa VITE_GAMC_KEY_P01.
 */
function getLayerApiKey(layer) {
  if (layer.keyEnvVar === 'VITE_GAMC_KEY_P01') {
    return (
      import.meta.env.VITE_GAMC_KEY_P01 ||
      import.meta.env.VITE_GAMC_KEY ||
      ''
    )
  }
  return import.meta.env.VITE_GAMC_KEY || ''
}

/**
 * Componente de Mapa Reutilizable con capas oficiales WMS del GAMC y soporte
 * de respaldo offline (equipamientos.geojson) para la hackathon NASA Space Apps.
 */
export default function GamcMap({
  capasWms, // Array opcional de IDs de capas a mostrar/habilitar
  geojson, // Capas vectoriales propias (ej. distritos coloreados o puntos)
  radios, // Array de círculos de cobertura [{ lat, lng, radius, color, label }]
  onClickDistrito, // Callback(feature, layer)
  onClickMapa, // Callback({ lat, lng })
  height = '500px',
  className = '',
  style = {},
}) {
  const mapContainerRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const baseTileRef = useRef(null)
  const wmsLayerInstancesRef = useRef({})
  const localFallbackLayerRef = useRef(null)
  const customGeoJsonLayerRef = useRef(null)
  const radiosLayerRef = useRef(null)

  // Estado del tema de la aplicación (claro / oscuro)
  const [theme, setTheme] = useState(() => {
    return document.documentElement.getAttribute('data-theme') || 'dark'
  })

  // Panel de capas colapsable
  const [panelOpen, setPanelOpen] = useState(false)
  const [legendOpenId, setLegendOpenId] = useState(null)

  // Verificación de clave configurada
  const rawKey = import.meta.env.VITE_GAMC_KEY
  const hasValidKey = Boolean(
    rawKey &&
      rawKey.trim() !== '' &&
      !rawKey.startsWith('(') &&
      !rawKey.includes('clave del Proyecto')
  )

  // Estado de visibilidad de capas
  const [visibleLayers, setVisibleLayers] = useState(() => {
    const initialState = {}
    GAMC_WMS_LAYERS.forEach((l) => {
      // Si se especificó una lista en capasWms, seguirla; si no, usar defaultVisible
      if (Array.isArray(capasWms) && capasWms.length > 0) {
        initialState[l.id] =
          capasWms.includes(l.id) || capasWms.includes(l.name)
      } else {
        initialState[l.id] = l.defaultVisible
      }
    })
    return initialState
  })

  // Datos locales de respaldo para la presentación offline (equipamientos.geojson)
  const [localEquipamientos, setLocalEquipamientos] = useState(null)

  // Carga de datos de respaldo offline en segundo plano
  useEffect(() => {
    let isMounted = true
    fetch('/data/equipamientos.geojson')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (isMounted && data) {
          setLocalEquipamientos(data)
        }
      })
      .catch((err) => {
        console.warn('No se pudo cargar equipamientos.geojson local:', err)
      })
    return () => {
      isMounted = false
    }
  }, [])

  // Observador de cambios de tema en document.documentElement ([data-theme="light"])
  useEffect(() => {
    const observer = new MutationObserver(() => {
      const currentTheme =
        document.documentElement.getAttribute('data-theme') || 'dark'
      setTheme(currentTheme)
    })
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    })
    return () => observer.disconnect()
  }, [])

  // Inicialización del mapa Leaflet
  useEffect(() => {
    if (!mapContainerRef.current) return
    if (mapInstanceRef.current) return

    const map = L.map(mapContainerRef.current, {
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      zoomControl: false,
    })

    // Control de zoom posicionado en la esquina superior izquierda
    L.control.zoom({ position: 'topleft' }).addTo(map)

    mapInstanceRef.current = map

    return () => {
      map.remove()
      mapInstanceRef.current = null
    }
  }, [])

  // Conmutación de capa base CartoDB Light / CartoDB Dark según tema
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
      maxZoom: 20,
    })

    newBase.addTo(map)
    baseTileRef.current = newBase
  }, [theme])

  // Manejo de clic en el mapa y GetFeatureInfo WMS
  const handleMapClick = useCallback(
    (e) => {
      const map = mapInstanceRef.current
      if (!map) return

      onClickMapa?.({ lat: e.latlng.lat, lng: e.latlng.lng })

      // Verificar capas activas
      const activeLayers = GAMC_WMS_LAYERS.filter((l) => visibleLayers[l.id])
      if (activeLayers.length === 0) return

      const wmsUrl =
        import.meta.env.VITE_GAMC_WMS ||
        'https://serviciosgamc.cochabamba.bo/api/gs/wms'

      const size = map.getSize()
      const point = map.latLngToContainerPoint(e.latlng)
      const bounds = map.getBounds()
      const sw = bounds.getSouthWest()
      const ne = bounds.getNorthEast()
      const crs = map.options.crs || L.CRS.EPSG3857
      const pSw = crs.project(sw)
      const pNe = crs.project(ne)
      const bbox = `${pSw.x},${pSw.y},${pNe.x},${pNe.y}`

      // Si no hay clave válida, consultar los datos locales de respaldo
      if (!hasValidKey && localEquipamientos?.features) {
        // Buscar equipamiento cercano (~150m)
        const radiusMeters = 0.003
        const nearby = localEquipamientos.features.filter((f) => {
          if (!f.geometry || f.geometry.type !== 'Point') return false
          const [lng, lat] = f.geometry.coordinates
          return (
            Math.abs(lat - e.latlng.lat) < radiusMeters &&
            Math.abs(lng - e.latlng.lng) < radiusMeters
          )
        })

        if (nearby.length > 0) {
          const item = nearby[0].properties
          const html = `
            <div style="font-family: system-ui, sans-serif; font-size: 12px; min-width: 180px;">
              <div style="display:flex; align-items:center; gap:4px; margin-bottom:4px;">
                <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:#EF4444;"></span>
                <strong style="color:var(--theme-accent, #38bdf8);">${item.nombre || 'Equipamiento Municipal'}</strong>
              </div>
              <table class="gamc-popup-table">
                ${item.tipo ? `<tr><th>Tipo</th><td>${item.tipo}</td></tr>` : ''}
                ${item.nivel ? `<tr><th>Nivel</th><td>${item.nivel}</td></tr>` : ''}
                ${item.codigo_distrito ? `<tr><th>Distrito</th><td>Distrito ${item.codigo_distrito}</td></tr>` : ''}
              </table>
              <div style="font-size:10px; color:#8A94A6; margin-top:4px;">Datos locales verificados (GAMC)</div>
            </div>
          `
          L.popup().setLatLng(e.latlng).setContent(html).openOn(map)
          return
        }
      }

      // Si hay clave, consultar GetFeatureInfo a la capa activa prioritaria
      const targetLayer = activeLayers[0]
      const key = getLayerApiKey(targetLayer)
      if (!key) return

      const params = new URLSearchParams({
        SERVICE: 'WMS',
        VERSION: '1.1.1',
        REQUEST: 'GetFeatureInfo',
        LAYERS: '',
        QUERY_LAYERS: '',
        INFO_FORMAT: 'application/json',
        FEATURE_COUNT: '5',
        SRS: 'EPSG:3857',
        BBOX: bbox,
        WIDTH: String(Math.round(size.x)),
        HEIGHT: String(Math.round(size.y)),
        X: String(Math.round(point.x)),
        Y: String(Math.round(point.y)),
        key: key,
        service_id: targetLayer.service_id,
      })

      fetch(`${wmsUrl}?${params.toString()}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (data?.features && data.features.length > 0) {
            const props = data.features[0].properties || {}
            let rows = ''
            for (const [k, v] of Object.entries(props)) {
              if (v !== null && v !== '') {
                rows += `<tr><th>${k}</th><td>${v}</td></tr>`
              }
            }
            const html = `
              <div style="font-family: system-ui, sans-serif; font-size: 12px; min-width: 200px;">
                <div style="display:flex; align-items:center; gap:4px; margin-bottom:4px;">
                  <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:${targetLayer.color};"></span>
                  <strong style="color:var(--theme-accent, #38bdf8);">${targetLayer.name}</strong>
                </div>
                <table class="gamc-popup-table">
                  ${rows || '<tr><td colspan="2">Sin atributos adicionales</td></tr>'}
                </table>
                <div style="font-size:10px; color:#8A94A6; margin-top:4px;">WMS GAMC Oficial</div>
              </div>
            `
            L.popup().setLatLng(e.latlng).setContent(html).openOn(map)
          }
        })
        .catch(() => {
          // Si falla la consulta WMS por red o rate limit, buscar en equipamientos locales
          if (localEquipamientos?.features) {
            const radiusMeters = 0.003
            const nearby = localEquipamientos.features.filter((f) => {
              if (!f.geometry || f.geometry.type !== 'Point') return false
              const [lng, lat] = f.geometry.coordinates
              return (
                Math.abs(lat - e.latlng.lat) < radiusMeters &&
                Math.abs(lng - e.latlng.lng) < radiusMeters
              )
            })

            if (nearby.length > 0) {
              const item = nearby[0].properties
              const html = `
                <div style="font-family: system-ui, sans-serif; font-size: 12px; min-width: 180px;">
                  <strong style="color:var(--theme-accent, #38bdf8); display:block; margin-bottom:4px;">
                    ${item.nombre || 'Equipamiento Municipal'}
                  </strong>
                  <table class="gamc-popup-table">
                    ${item.tipo ? `<tr><th>Tipo</th><td>${item.tipo}</td></tr>` : ''}
                    ${item.nivel ? `<tr><th>Nivel</th><td>${item.nivel}</td></tr>` : ''}
                    ${item.codigo_distrito ? `<tr><th>Distrito</th><td>Distrito ${item.codigo_distrito}</td></tr>` : ''}
                  </table>
                  <div style="font-size:10px; color:#8A94A6; margin-top:4px;">Datos locales verificados (GAMC)</div>
                </div>
              `
              L.popup().setLatLng(e.latlng).setContent(html).openOn(map)
            }
          }
        })
    },
    [visibleLayers, hasValidKey, localEquipamientos, onClickMapa]
  )

  // Suscribir evento click del mapa
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map) return
    map.on('click', handleMapClick)
    return () => {
      map.off('click', handleMapClick)
    }
  }, [handleMapClick])

  // Actualización de capas WMS y capas de respaldo local
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map) return

    const wmsUrl =
      import.meta.env.VITE_GAMC_WMS ||
      'https://serviciosgamc.cochabamba.bo/api/gs/wms'

    // 1. Gestionar cada capa WMS del catálogo
    GAMC_WMS_LAYERS.forEach((layerDef) => {
      const isVisible = visibleLayers[layerDef.id]
      const existing = wmsLayerInstancesRef.current[layerDef.id]
      const key = getLayerApiKey(layerDef)

      // Si la capa debe estar visible y tenemos clave configurada
      if (isVisible && hasValidKey && key) {
        if (!existing) {
          const wmsLayer = L.tileLayer.wms(wmsUrl, {
            key: key,
            service_id: layerDef.service_id,
            layers: '',
            format: 'image/png',
            transparent: true,
            version: '1.1.1',
            maxZoom: 19,
          })
          wmsLayer.addTo(map)
          wmsLayerInstancesRef.current[layerDef.id] = wmsLayer
        }
      } else {
        // Remover si está apagada o sin clave
        if (existing) {
          map.removeLayer(existing)
          delete wmsLayerInstancesRef.current[layerDef.id]
        }
      }
    })

    // 2. Respaldo offline / Local: Si la clave WMS no está disponible o para garantizar visualización
    // si centros_salud o unidades_educativas están activos pero WMS no está configurado
    if (!hasValidKey && localEquipamientos) {
      if (localFallbackLayerRef.current) {
        map.removeLayer(localFallbackLayerRef.current)
        localFallbackLayerRef.current = null
      }

      const showHealth = visibleLayers['centros_salud']
      const showEdu = visibleLayers['unidades_educativas']

      if (showHealth || showEdu) {
        const filteredFeatures = localEquipamientos.features.filter((f) => {
          const tipo = f.properties?.tipo
          if (tipo === 'salud' && showHealth) return true
          if (tipo === 'educacion' && showEdu) return true
          return false
        })

        const fallbackGeoJson = L.geoJSON(
          { type: 'FeatureCollection', features: filteredFeatures },
          {
            pointToLayer: (feature, latlng) => {
              const isSalud = feature.properties?.tipo === 'salud'
              const color = isSalud ? '#EF4444' : '#F59E0B'
              return L.circleMarker(latlng, {
                radius: isSalud ? 6 : 5,
                fillColor: color,
                color: '#ffffff',
                weight: 1.5,
                opacity: 1,
                fillOpacity: 0.85,
              })
            },
            onEachFeature: (feature, layer) => {
              const p = feature.properties || {}
              layer.bindPopup(`
                <div style="font-family: system-ui, sans-serif; font-size: 12px; min-width: 170px;">
                  <strong style="color:var(--theme-accent, #38bdf8);">${p.nombre || 'Equipamiento GAMC'}</strong>
                  <div style="font-size:11px; color:#94A3B8; margin-top:2px;">
                    ${p.tipo === 'salud' ? 'Centro de Salud' : 'Unidad Educativa'} · ${p.nivel || 'Oficial'}
                  </div>
                  ${p.codigo_distrito ? `<div style="font-size:11px; margin-top:2px;">Distrito ${p.codigo_distrito}</div>` : ''}
                </div>
              `)
            },
          }
        )

        fallbackGeoJson.addTo(map)
        localFallbackLayerRef.current = fallbackGeoJson
      }
    }
  }, [visibleLayers, hasValidKey, localEquipamientos])

  // Renderizado de capas vectoriales propias (prop `geojson`)
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map) return

    if (customGeoJsonLayerRef.current) {
      map.removeLayer(customGeoJsonLayerRef.current)
      customGeoJsonLayerRef.current = null
    }

    if (geojson) {
      const vectorLayer = L.geoJSON(geojson, {
        pointToLayer: (feature, latlng) => {
          if (feature.properties?.isCandidate) {
            const num = feature.properties?.candidateNumber || ''
            const icon = L.divIcon({
              className: 'candidate-marker',
              html: `<div style="background:#8B5CF6; color:#fff; border-radius:50%; width:22px; height:22px; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:11px; border:2px solid #fff; box-shadow:0 2px 8px rgba(0,0,0,0.4);">${num}</div>`,
              iconSize: [22, 22],
              iconAnchor: [11, 11],
            })
            return L.marker(latlng, { icon })
          }
          if (feature.properties?.isNewSimulated) {
            const icon = L.divIcon({
              className: 'new-simulated-marker',
              html: `<div style="background:#EF4444; color:#fff; border-radius:50%; width:26px; height:26px; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:14px; border:2px solid #fff; box-shadow:0 0 12px #EF4444;">★</div>`,
              iconSize: [26, 26],
              iconAnchor: [13, 13],
            })
            return L.marker(latlng, { icon })
          }
          return L.circleMarker(latlng, {
            radius: 5,
            fillColor: feature.properties?.fillColor || '#EF4444',
            color: '#ffffff',
            weight: 1.5,
            fillOpacity: 0.85,
          })
        },
        style: (feature) => {
          const isSelected = feature?.properties?.selected
          const fillColor =
            feature?.properties?.fillColor ||
            feature?.properties?.color ||
            '#06B6D4'
          return {
            color: isSelected ? '#38BDF8' : '#64748B',
            weight: isSelected ? 2.5 : 1.2,
            opacity: 0.8,
            fillColor: fillColor,
            fillOpacity: isSelected ? 0.45 : 0.25,
          }
        },
        onEachFeature: (feature, layer) => {
          if (onClickDistrito) {
            layer.on('click', (e) => {
              L.DomEvent.stopPropagation(e)
              onClickDistrito(feature, layer)
            })
          }
          if (feature.properties?.labelPermanent) {
            layer.bindTooltip(
              String(feature.properties.labelPermanent),
              { permanent: true, direction: 'center', className: 'district-index-badge' }
            )
          } else if (feature.properties?.nombre || feature.properties?.name) {
            layer.bindTooltip(
              feature.properties.nombre || feature.properties.name,
              { sticky: true, direction: 'top' }
            )
          }
        },
      })

      vectorLayer.addTo(map)
      customGeoJsonLayerRef.current = vectorLayer
    }
  }, [geojson, onClickDistrito])

  // Renderizado de círculos de cobertura / radios (prop `radios`)
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map) return

    if (radiosLayerRef.current) {
      map.removeLayer(radiosLayerRef.current)
      radiosLayerRef.current = null
    }

    if (Array.isArray(radios) && radios.length > 0) {
      const group = L.layerGroup()
      radios.forEach((r) => {
        if (r.lat && r.lng) {
          const circle = L.circle([r.lat, r.lng], {
            radius: r.radius || 500,
            color: r.color || '#38BDF8',
            weight: 1.5,
            fillColor: r.fillColor || r.color || '#38BDF8',
            fillOpacity: r.fillOpacity ?? 0.18,
          })
          if (r.label) {
            circle.bindTooltip(r.label, { sticky: true })
          }
          circle.addTo(group)
        }
      })
      group.addTo(map)
      radiosLayerRef.current = group
    }
  }, [radios])

  const toggleLayer = (layerId) => {
    setVisibleLayers((prev) => ({
      ...prev,
      [layerId]: !prev[layerId],
    }))
  }

  const toggleLegend = (layerId, e) => {
    e.stopPropagation()
    setLegendOpenId((prev) => (prev === layerId ? null : layerId))
  }

  const activeCount = Object.values(visibleLayers).filter(Boolean).length
  const wmsUrl =
    import.meta.env.VITE_GAMC_WMS ||
    'https://serviciosgamc.cochabamba.bo/api/gs/wms'

  return (
    <div
      className={`gamc-map-container ${className}`}
      style={{ height, ...style }}
    >
      {/* Contenedor del mapa Leaflet */}
      <div ref={mapContainerRef} className="gamc-map-instance" />

      {/* Aviso discreto si la clave WMS de la Alcaldía no está configurada */}
      {!hasValidKey && (
        <div className="gamc-no-key-badge">
          <AlertCircle size={14} strokeWidth={1.75} />
          <span>Capas de la Alcaldía no configuradas (usando respaldo local)</span>
        </div>
      )}

      {/* Panel flotante de capas oficiales GAMC */}
      <div className="gamc-layers-panel">
        <button
          type="button"
          className="gamc-layers-toggle-btn"
          onClick={() => setPanelOpen((p) => !p)}
          aria-expanded={panelOpen}
          title="Ver y configurar capas oficiales del GAMC"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Layers size={16} strokeWidth={1.75} color="var(--color-icon)" />
            <span>Capas GAMC</span>
            <span className="gamc-layers-badge">{activeCount} activas</span>
          </div>
          {panelOpen ? (
            <ChevronUp size={16} strokeWidth={1.75} color="var(--color-icon)" />
          ) : (
            <ChevronDown size={16} strokeWidth={1.75} color="var(--color-icon)" />
          )}
        </button>

        {panelOpen && (
          <div className="gamc-layers-content">
            {GAMC_WMS_LAYERS.map((layer) => {
              const isChecked = Boolean(visibleLayers[layer.id])
              const isLegendOpen = legendOpenId === layer.id
              const key = getLayerApiKey(layer)
              const legendUrl = `${wmsUrl}?REQUEST=GetLegendGraphic&VERSION=1.0.0&FORMAT=image/png&key=${key}&service_id=${layer.service_id}&LAYER=`

              return (
                <div key={layer.id} className="gamc-layer-row">
                  <div className="gamc-layer-main">
                    <input
                      type="checkbox"
                      id={`gamc-layer-${layer.id}`}
                      className="gamc-layer-checkbox"
                      checked={isChecked}
                      onChange={() => toggleLayer(layer.id)}
                    />
                    <span
                      className="gamc-layer-dot"
                      style={{ backgroundColor: layer.color }}
                    />
                    <label
                      htmlFor={`gamc-layer-${layer.id}`}
                      className="gamc-layer-title"
                    >
                      {layer.name}
                    </label>
                    <button
                      type="button"
                      className="gamc-legend-toggle"
                      onClick={(e) => toggleLegend(layer.id, e)}
                      title="Ver leyenda de la capa"
                    >
                      Leyenda
                    </button>
                  </div>

                  {/* Leyenda WMS desplegable */}
                  {isLegendOpen && (
                    <div className="gamc-legend-box">
                      {hasValidKey && key ? (
                        <img
                          src={legendUrl}
                          alt={`Leyenda de ${layer.name}`}
                          onError={(e) => {
                            e.currentTarget.style.display = 'none'
                            const fallback = e.currentTarget.nextSibling
                            if (fallback) fallback.style.display = 'block'
                          }}
                        />
                      ) : null}
                      <div
                        style={{
                          display: hasValidKey && key ? 'none' : 'block',
                          fontSize: '0.7rem',
                          color: 'var(--theme-text-muted)',
                        }}
                      >
                        <span
                          style={{
                            display: 'inline-block',
                            width: '10px',
                            height: '10px',
                            backgroundColor: layer.color,
                            marginRight: '6px',
                            borderRadius: '2px',
                          }}
                        />
                        {layer.name} ({layer.category})
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
