import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  HeartPulse,
  BookOpen,
  Trees,
  MapPin,
  Save,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Thermometer,
  Wind,
  Droplets,
  Bus,
  Maximize2,
  RotateCcw,
  Sparkles,
  Info,
  Box,
} from 'lucide-react'
import MapLibreSimulador3D from './MapLibreSimulador3D'
import './SimuladorEquipamientosScreen.css'

// Cálculo de distancia ortodrómica en metros (fórmula de Haversine)
function haversineMeters(lon1, lat1, lon2, lat2) {
  const R = 6371000
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

// Distancia de un punto a un segmento de línea en metros
function distToSegmentMeters(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1
  const dy = y2 - y1
  if (dx === 0 && dy === 0) return haversineMeters(px, py, x1, y1)
  const t = Math.max(
    0,
    Math.min(1, ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy))
  )
  const projX = x1 + t * dx
  const projY = y1 + t * dy
  return haversineMeters(px, py, projX, projY)
}

// Distancia mínima de un punto a un LineString en metros
function distToLineStringMeters(lng, lat, coords) {
  if (!coords || coords.length < 2) return Infinity
  let minDist = Infinity
  for (let i = 0; i < coords.length - 1; i++) {
    const d = distToSegmentMeters(
      lng,
      lat,
      coords[i][0],
      coords[i][1],
      coords[i + 1][0],
      coords[i + 1][1]
    )
    if (d < minDist) minDist = d
  }
  return minDist
}

// Ray-casting point-in-polygon para verificar si cae dentro de terreno municipal
function pointInPolygon(point, vs) {
  const x = point[0]
  const y = point[1]
  let inside = false
  for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
    const xi = vs[i][0]
    const yi = vs[i][1]
    const xj = vs[j][0]
    const yj = vs[j][1]
    const intersect =
      yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi
    if (intersect) inside = !inside
  }
  return inside
}

// Top 10 candidatos curados para parques urbanos en distritos con déficit de áreas verdes
const CANDIDATOS_PARQUES = [
  {
    tipo: 'parque',
    distrito: 9,
    nombre: 'Parque Metropolitano Tamborada Sur',
    area_terreno_m2: 45000,
    lat: -17.431596,
    lon: -66.196682,
    poblacion_nueva_cubierta_2030: 22800,
    enfriamiento_lst: -3.0,
  },
  {
    tipo: 'parque',
    distrito: 8,
    nombre: 'Parque Lineal Uspha Uspha',
    area_terreno_m2: 24500,
    lat: -17.46821,
    lon: -66.10423,
    poblacion_nueva_cubierta_2030: 19400,
    enfriamiento_lst: -2.8,
  },
  {
    tipo: 'parque',
    distrito: 14,
    nombre: 'Bosque Urbano Valle Hermoso',
    area_terreno_m2: 32000,
    lat: -17.45291,
    lon: -66.12874,
    poblacion_nueva_cubierta_2030: 18200,
    enfriamiento_lst: -2.9,
  },
  {
    tipo: 'parque',
    distrito: 15,
    nombre: 'Parque de Integración K\'ara K\'ara',
    area_terreno_m2: 28000,
    lat: -17.4695,
    lon: -66.1345,
    poblacion_nueva_cubierta_2030: 16900,
    enfriamiento_lst: -2.7,
  },
  {
    tipo: 'parque',
    distrito: 5,
    nombre: 'Corredor Verde Alalay Sur',
    area_terreno_m2: 18500,
    lat: -17.4184,
    lon: -66.1482,
    poblacion_nueva_cubierta_2030: 15400,
    enfriamiento_lst: -2.4,
  },
  {
    tipo: 'parque',
    distrito: 4,
    nombre: 'Parque Barrial La Chimba',
    area_terreno_m2: 14200,
    lat: -17.3985,
    lon: -66.2081,
    poblacion_nueva_cubierta_2030: 13800,
    enfriamiento_lst: -2.2,
  },
  {
    tipo: 'parque',
    distrito: 3,
    nombre: 'Parque Ecológico Sarco Central',
    area_terreno_m2: 11800,
    lat: -17.3789,
    lon: -66.1824,
    poblacion_nueva_cubierta_2030: 11900,
    enfriamiento_lst: -2.0,
  },
  {
    tipo: 'parque',
    distrito: 6,
    nombre: 'Parque Deportivo Jaihuayco',
    area_terreno_m2: 9500,
    lat: -17.4241,
    lon: -66.1623,
    poblacion_nueva_cubierta_2030: 10400,
    enfriamiento_lst: -1.8,
  },
  {
    tipo: 'parque',
    distrito: 2,
    nombre: 'Espacio Verde Cala Cala Norte',
    area_terreno_m2: 7800,
    lat: -17.3621,
    lon: -66.1685,
    poblacion_nueva_cubierta_2030: 8900,
    enfriamiento_lst: -1.6,
  },
  {
    tipo: 'parque',
    distrito: 1,
    nombre: 'Parque Tupuraya - Muyurina',
    area_terreno_m2: 6500,
    lat: -17.3725,
    lon: -66.1362,
    poblacion_nueva_cubierta_2030: 7800,
    enfriamiento_lst: -1.5,
  },
]

export default function SimuladorEquipamientosScreen({
  selectedZoneId: _selectedZoneId,
  onSelectZone: _onSelectZone,
}) {
  const [candidatosRaw, setCandidatosRaw] = useState(null)
  const [equipamientosData, setEquipamientosData] = useState(null)
  const [grillaData, setGrillaData] = useState(null)
  const [areasEquipData, setAreasEquipData] = useState(null)
  const [indiceData, setIndiceData] = useState(null)
  const [referenciasGeo, setReferenciasGeo] = useState(null)
  const [transporteGeo, setTransporteGeo] = useState(null)
  const [distritosGeoJson, setDistritosGeoJson] = useState(null)
  const [loading, setLoading] = useState(true)

  // Controles principales del simulador
  const [tipo, setTipo] = useState('salud') // 'salud' | 'educacion' | 'parque'
  const [radio, setRadio] = useState(1000) // 500 a 2000 m
  const [anio, setAnio] = useState(2025) // 2025 | 2030 | 2035
  const [modoUbicacion, setModoUbicacion] = useState('candidato') // 'candidato' | 'manual'
  const [climateMode, setClimateMode] = useState('none') // 'none' | 'lst' | 'pm10' | 'flood'

  // Punto activo simulado: { lat, lng, isFromCandidate, candidateIdx, areaTerreno, nombre }
  const [activePoint, setActivePoint] = useState(null)

  // Escenarios guardados para comparar (hasta 3)
  const [savedScenarios, setSavedScenarios] = useState([])

  // Ajuste automático de radio sugerido según tipo
  useEffect(() => {
    if (tipo === 'parque') {
      setRadio(500)
    } else if (tipo === 'salud') {
      setRadio(1000)
    } else if (tipo === 'educacion') {
      setRadio(800)
    }
  }, [tipo])

  // Carga paralela de fuentes de datos geoespaciales y censales
  useEffect(() => {
    let isMounted = true

    Promise.all([
      fetch('/data/candidatos_equipamiento.json').then((r) =>
        r.ok ? r.json() : null
      ),
      fetch('/data/equipamientos.geojson').then((r) =>
        r.ok ? r.json() : null
      ),
      fetch('/data/poblacion_grilla.json').then((r) =>
        r.ok ? r.json() : null
      ),
      fetch('/data/areas_equipamiento.geojson').then((r) =>
        r.ok ? r.json() : null
      ),
      fetch('/data/indice_distritos.json').then((r) =>
        r.ok ? r.json() : null
      ),
      fetch('/data/referencias_geograficas.geojson').then((r) =>
        r.ok ? r.json() : null
      ),
      fetch('/data/transporte_lineas_143.geojson').then((r) =>
        r.ok ? r.json() : null
      ),
      fetch('/data/distritos_indicadores_ambientales_2024.geojson').then((r) =>
        r.ok ? r.json() : null
      ),
    ])
      .then(([cand, equip, grilla, areas, idx, refs, transp, distritos]) => {
        if (!isMounted) return
        if (cand) setCandidatosRaw(cand)
        if (equip) setEquipamientosData(equip)
        if (grilla) setGrillaData(grilla)
        if (areas) setAreasEquipData(areas)
        if (idx) setIndiceData(idx)
        if (refs) setReferenciasGeo(refs)
        if (transp) setTransporteGeo(transp)
        if (distritos) setDistritosGeoJson(distritos)
        setLoading(false)
      })
      .catch((err) => {
        console.error('Error cargando datos en SimuladorEquipamientosScreen:', err)
        if (isMounted) setLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [])

  // Geometría del Río Rocha para auditoría de riesgo hídrico
  const rioRochaCoords = useMemo(() => {
    if (!referenciasGeo?.features) return null
    const rocha = referenciasGeo.features.find(
      (f) => f.properties?.id === 'rio_rocha'
    )
    return rocha?.geometry?.coordinates || null
  }, [referenciasGeo])

  // Geometrías de las líneas de transporte para auditoría de accesibilidad
  const transporteCoordsList = useMemo(() => {
    if (!transporteGeo?.features) return []
    return transporteGeo.features
      .filter((f) => f.geometry?.type === 'LineString')
      .map((f) => f.geometry.coordinates)
  }, [transporteGeo])

  // Equipamientos existentes según tipo seleccionado
  const existingPoints = useMemo(() => {
    if (!equipamientosData?.features) return []
    return equipamientosData.features
      .filter((f) => {
        const p = f.properties
        if (!p || !f.geometry?.coordinates) return false
        if (tipo === 'salud') {
          return p.tipo === 'salud' && String(p.nivel || '').includes('1')
        }
        if (tipo === 'educacion') {
          return p.tipo === 'educacion'
        }
        if (tipo === 'parque') {
          return p.tipo === 'area_verde' || p.tipo === 'parque'
        }
        return false
      })
      .map((f) => ({
        lat: f.geometry.coordinates[1],
        lng: f.geometry.coordinates[0],
        nombre: f.properties.nombre || 'Equipamiento',
      }))
  }, [equipamientosData, tipo])

  // Top 10 candidatos según tipo seleccionado
  const top10Candidatos = useMemo(() => {
    if (tipo === 'parque') {
      return CANDIDATOS_PARQUES.map((c, idx) => ({
        ...c,
        num: idx + 1,
      }))
    }

    if (!candidatosRaw) return []
    const list = Array.isArray(candidatosRaw)
      ? candidatosRaw
      : candidatosRaw.candidatos || []

    return list
      .filter((c) => c.tipo === tipo)
      .sort(
        (a, b) =>
          (b.poblacion_nueva_cubierta_2030 || 0) -
          (a.poblacion_nueva_cubierta_2030 || 0)
      )
      .slice(0, 10)
      .map((c, idx) => ({
        ...c,
        num: idx + 1,
      }))
  }, [candidatosRaw, tipo])

  // Punto efectivo seleccionado
  const effectivePoint = useMemo(() => {
    if (activePoint) return activePoint
    if (top10Candidatos.length > 0) {
      const c0 = top10Candidatos[0]
      return {
        lat: c0.lat,
        lng: c0.lon,
        isFromCandidate: true,
        candidateNum: c0.num,
        distrito: c0.distrito,
        areaTerreno: c0.area_terreno_m2,
        nombre: c0.nombre || `Candidato #${c0.num}`,
      }
    }
    return null
  }, [activePoint, top10Candidatos])

  // Precomputar cajas delimitadoras de las áreas de equipamiento municipal
  const areasBoundingBoxes = useMemo(() => {
    if (!areasEquipData?.features) return []
    return areasEquipData.features
      .map((f) => {
        const geom = f.geometry
        if (!geom?.coordinates) return null
        const coords = geom.coordinates
        const allPts = []
        if (geom.type === 'Polygon') {
          if (coords[0]) allPts.push(...coords[0])
        } else if (geom.type === 'MultiPolygon') {
          coords.forEach((poly) => {
            if (poly[0]) allPts.push(...poly[0])
          })
        }
        if (allPts.length === 0) return null
        const lons = allPts.map((p) => p[0])
        const lats = allPts.map((p) => p[1])
        return {
          minLon: Math.min(...lons),
          maxLon: Math.max(...lons),
          minLat: Math.min(...lats),
          maxLat: Math.max(...lats),
          feature: f,
        }
      })
      .filter(Boolean)
  }, [areasEquipData])

  // Comprobar si el punto activo cae dentro de un terreno municipal GAMC
  const isInsideMunicipal = useMemo(() => {
    if (!effectivePoint) return false
    if (effectivePoint.isFromCandidate) return true

    const { lat, lng } = effectivePoint
    const candidateBoxes = areasBoundingBoxes.filter(
      (b) =>
        b.minLon <= lng &&
        lng <= b.maxLon &&
        b.minLat <= lat &&
        lat <= b.maxLat
    )

    if (candidateBoxes.length === 0) return false

    for (const box of candidateBoxes) {
      const geom = box.feature.geometry
      if (geom.type === 'Polygon') {
        if (pointInPolygon([lng, lat], geom.coordinates[0])) return true
      } else if (geom.type === 'MultiPolygon') {
        for (const poly of geom.coordinates) {
          if (pointInPolygon([lng, lat], poly[0])) return true
        }
      }
    }
    return false
  }, [effectivePoint, areasBoundingBoxes])

  // Distancia calculada al Río Rocha (m)
  const distRochaMeters = useMemo(() => {
    if (!effectivePoint || !rioRochaCoords) return null
    return Math.round(
      distToLineStringMeters(
        effectivePoint.lng,
        effectivePoint.lat,
        rioRochaCoords
      )
    )
  }, [effectivePoint, rioRochaCoords])

  // Distancia calculada a la línea de transporte más cercana (m)
  const distTranspMeters = useMemo(() => {
    if (!effectivePoint || transporteCoordsList.length === 0) return null
    let minDist = Infinity
    for (const lineCoords of transporteCoordsList) {
      const d = distToLineStringMeters(
        effectivePoint.lng,
        effectivePoint.lat,
        lineCoords
      )
      if (d < minDist) minDist = d
      if (minDist < 50) break
    }
    return Math.round(minDist)
  }, [effectivePoint, transporteCoordsList])

  // Cálculo demográfico en el cliente con poblacion_grilla.json
  const calculationResult = useMemo(() => {
    if (!effectivePoint || !grillaData?.celdas) {
      return {
        personasGanan: 0,
        distritoId: effectivePoint?.distrito || 1,
        distritoNombre: 'Distrito 1',
        cobAntes: 50,
        cobDespues: 50,
        habCentroAntes: 0,
        habCentroDespues: 0,
        areaVerdeAntes: 3.5,
        areaVerdeDespues: 3.8,
        enfriamientoLst: -2.1,
      }
    }

    const { lat: newLat, lng: newLng } = effectivePoint
    const degBox = (radio + 150) / 111320 // Grados aproximados

    let personasGananTotal = 0
    const districtVotes = {}

    const celdas = grillaData.celdas
    for (let i = 0; i < celdas.length; i++) {
      const c = celdas[i]
      const cLon = c[0]
      const cLat = c[1]

      // Población proyectada según año
      let cPop = c[2] // 2025
      if (anio === 2030) {
        cPop = c[3] // 2030
      } else if (anio === 2035) {
        // Crecimiento compuesto a 10 años
        const growthRate = c[2] > 0 ? c[3] / c[2] : 1.04
        cPop = Math.round(c[3] * growthRate)
      }

      const cDist = c[4]

      if (
        Math.abs(cLat - newLat) <= degBox &&
        Math.abs(cLon - newLng) <= degBox
      ) {
        if (haversineMeters(cLon, cLat, newLng, newLat) <= radio) {
          districtVotes[cDist] = (districtVotes[cDist] || 0) + 1

          // Verificar si ya estaba cubierta por equipamientos existentes
          let coveredBefore = false
          for (let j = 0; j < existingPoints.length; j++) {
            const ep = existingPoints[j]
            if (
              Math.abs(cLat - ep.lat) <= degBox &&
              Math.abs(cLon - ep.lng) <= degBox
            ) {
              if (haversineMeters(cLon, cLat, ep.lng, ep.lat) <= radio) {
                coveredBefore = true
                break
              }
            }
          }

          if (!coveredBefore) {
            personasGananTotal += cPop
          }
        }
      }
    }

    // Determinar distrito principal
    let targetDistId = effectivePoint.distrito
    if (!targetDistId) {
      let maxVotes = 0
      Object.entries(districtVotes).forEach(([dId, v]) => {
        if (v > maxVotes) {
          maxVotes = v
          targetDistId = parseInt(dId, 10)
        }
      })
      if (!targetDistId) targetDistId = 1
    }

    // Métricas del distrito desde indice_distritos.json
    const distInfo = indiceData?.distritos?.find(
      (d) => parseInt(String(d.id), 10) === targetDistId
    )
    const ind = distInfo?.indicadores || {}
    let pobDist = ind.personas || 40000
    if (anio === 2030) {
      pobDist = ind.personas_2030 || Math.round(pobDist * 1.05)
    } else if (anio === 2035) {
      const g = ind.personas_2030 && ind.personas ? ind.personas_2030 / ind.personas : 1.05
      pobDist = Math.round((ind.personas_2030 || pobDist) * g)
    }

    let cobAntes = 50
    if (tipo === 'salud') {
      cobAntes =
        anio >= 2030
          ? ind.cobertura_salud_2030 || ind.cobertura_salud || 45
          : ind.cobertura_salud || 48
    } else if (tipo === 'educacion') {
      cobAntes = ind.cobertura_colegio || 72
    } else {
      cobAntes = ind.cobertura_transporte || 80
    }

    const pctGanancia = pobDist > 0 ? (personasGananTotal / pobDist) * 100 : 0
    const cobDespues = Math.min(100, Number((cobAntes + pctGanancia).toFixed(1)))

    const centrosAntes =
      tipo === 'salud'
        ? ind.salud_1er || 1
        : tipo === 'educacion'
        ? ind.colegios || 5
        : ind.areas_verdes_conteo || 20
    const centrosDespues = centrosAntes + 1
    const habCentroAntes =
      centrosAntes > 0 ? Math.round(pobDist / centrosAntes) : null
    const habCentroDespues = Math.round(pobDist / centrosDespues)

    // Métricas específicas para Parque
    const areaTerreno = effectivePoint.areaTerreno || 12000
    const areaVerdeAntes = Number((ind.areas_verdes_m2_hab || 3.5).toFixed(2))
    const m2Incremento = pobDist > 0 ? areaTerreno / pobDist : 0
    const areaVerdeDespues = Number((areaVerdeAntes + m2Incremento).toFixed(2))

    // Enfriamiento LST estimado según tamaño de parque
    let enfriamientoLst = -1.5
    if (areaTerreno >= 25000) {
      enfriamientoLst = -3.0
    } else if (areaTerreno >= 10000) {
      enfriamientoLst = -2.2
    } else if (areaTerreno >= 5000) {
      enfriamientoLst = -1.8
    }

    return {
      personasGanan: Math.round(personasGananTotal),
      distritoId: targetDistId,
      distritoNombre: distInfo?.nombre || `Distrito ${targetDistId}`,
      cobAntes: Number(cobAntes.toFixed(1)),
      cobDespues,
      habCentroAntes,
      habCentroDespues,
      areaVerdeAntes,
      areaVerdeDespues,
      m2Incremento: Number(m2Incremento.toFixed(2)),
      enfriamientoLst,
      areaTerreno,
    }
  }, [
    effectivePoint,
    grillaData,
    existingPoints,
    radio,
    anio,
    tipo,
    indiceData,
  ])

  // Estimación de PM10 de Red MÓNICA según localización geográfica
  const pm10Estimado = useMemo(() => {
    if (!effectivePoint) return { val: 58.2, status: 'Moderada', badge: 'badge-warn' }
    const lat = effectivePoint.lat
    if (lat < -17.41) {
      // Zona Sur (cuenca baja, Parque Kanata, alta sedimentación)
      return { val: 68.4, status: 'Regular (Alta Carga)', badge: 'badge-danger' }
    }
    if (lat > -17.375) {
      // Zona Norte (Cala Cala, Tupuraya, Cota 2750)
      return { val: 49.1, status: 'Buena / Aceptable', badge: 'badge-safe' }
    }
    // Zona Central
    return { val: 58.2, status: 'Moderada', badge: 'badge-warn' }
  }, [effectivePoint])

  // Temperatura superficial promedio LST estimada
  const lstEstimada = useMemo(() => {
    if (!effectivePoint) return 29.5
    const lat = effectivePoint.lat
    if (lat < -17.41) return 32.4 // Zona Sur calurosa
    if (lat > -17.375) return 26.8 // Zona Norte arbolada
    return 30.2 // Zona Central
  }, [effectivePoint])

  // Veredicto Integral de Viabilidad según Capa Climática e Infraestructura
  const viabilityVerdict = useMemo(() => {
    if (!effectivePoint) return null

    const distRocha = distRochaMeters ?? 9999
    const isFloodDistrict = [1, 4, 5, 8, 9, 13, 15].includes(calculationResult?.distritoId)
    const isHighHeat = lstEstimada > 31
    const isBadAir = pm10Estimado.val > 65

    if (climateMode === 'flood') {
      if (distRocha < 200) {
        return {
          level: 'red',
          badge: '🔴 NO RECOMENDADO',
          title: 'Alto Riesgo Hídrico — Franja Inundable Río Rocha',
          desc: `Ubicado a solo ${distRocha} m del eje del Río Rocha. Se desaconseja ubicar infraestructura crítica en zona con recurrencia de desbordes pluviales.`,
        }
      }
      if (isFloodDistrict) {
        return {
          level: 'yellow',
          badge: '🟡 VIABLE CON MITIGACIÓN',
          title: 'Distrito con Susceptibilidad de Anegamiento',
          desc: `Distrito ${calculationResult?.distritoId} requiere rasante de piso elevada (+40 cm) y drenaje pluvial conectado a colectores secundarios.`,
        }
      }
      return {
        level: 'green',
        badge: '🟢 UBICACIÓN ÓPTIMA',
        title: 'Cota Segura ante Inundaciones',
        desc: `A ${distRocha} m del cauce, emplazado sobre cota segura sin antecedentes de anegamiento estructural.`,
      }
    }

    if (climateMode === 'lst') {
      if (tipo === 'parque') {
        return {
          level: 'green',
          badge: '🟢 UBICACIÓN ESTRATÉGICA ÓPTIMA',
          title: 'Máximo Beneficio de Refrescamiento Urbano',
          desc: `El parque aportará una reducción estimada de ${Math.abs(calculationResult?.enfriamientoLst || 2.0)} °C en la isla de calor local.`,
        }
      }
      if (isHighHeat) {
        return {
          level: 'yellow',
          badge: '🟡 VIABLE CON MITIGACIÓN TÉRMICA',
          title: 'Severa Isla de Calor Superficial (LST)',
          desc: `Temperatura superficial de ${lstEstimada} °C. Se exige incorporar techos reflectivos, arbolado exterior y ventilación cruzada.`,
        }
      }
      return {
        level: 'green',
        badge: '🟢 UBICACIÓN ÓPTIMA',
        title: 'Confort Térmico Adecuado',
        desc: `LST moderada (${lstEstimada} °C). Emplazamiento apto para desarrollo de servicios públicos.`,
      }
    }

    if (climateMode === 'pm10') {
      if (isBadAir) {
        return {
          level: 'yellow',
          badge: '🟡 VIABLE CON MITIGACIÓN AMBIENTAL',
          title: 'Carga de Partículas en Suspensión Elevada',
          desc: `Nivel PM10 de ${pm10Estimado.val} µg/m³. Es mandatorio proyectar cortinas arbóreas densas como filtro contra polución.`,
        }
      }
      return {
        level: 'green',
        badge: '🟢 UBICACIÓN ÓPTIMA',
        title: 'Buena Dispersión Atmosférica',
        desc: `Nivel PM10 aceptable (${pm10Estimado.val} µg/m³). Ambiente saludable para usuarios permanentes.`,
      }
    }

    // Modo Normal / General
    if (distRocha < 200) {
      return {
        level: 'red',
        badge: '🔴 NO RECOMENDADO',
        title: 'Proximidad Crítica a Cauce de Río (<200m)',
        desc: `Distancia de ${distRocha} m al Río Rocha presenta vulnerabilidad pluvial no mitigable para equipamiento prioritario.`,
      }
    }
    if (isInsideMunicipal && calculationResult?.personasGanan > 0) {
      return {
        level: 'green',
        badge: '🟢 UBICACIÓN ÓPTIMA',
        title: 'Suelo Municipal GAMC y Alta Cobertura',
        desc: `Predio público verificado sin costo de expropiación (+${calculationResult.personasGanan.toLocaleString('es-BO')} habitantes beneficiados).`,
      }
    }
    return {
      level: 'yellow',
      badge: '🟡 VIABLE CON MITIGACIÓN',
      title: isInsideMunicipal ? 'Viabilidad Técnica Favorable' : 'Requiere Gestión Predial',
      desc: isInsideMunicipal
        ? 'Suelo público disponible; verificar acometidas de agua potable y red de alcantarillado.'
        : 'Predio privado; requiere proceso de declaratoria de utilidad pública y expropiación.',
    }
  }, [effectivePoint, distRochaMeters, calculationResult, lstEstimada, pm10Estimado, climateMode, tipo, isInsideMunicipal])

  // Manejo de clic en el mapa para posicionar manualmente el equipamiento
  const handleMapClick = useCallback((coords) => {
    setModoUbicacion('manual')
    setActivePoint({
      lat: coords.lat,
      lng: coords.lng,
      isFromCandidate: false,
      candidateNum: null,
      distrito: null,
      areaTerreno: tipo === 'parque' ? 10000 : 2500,
      nombre: 'Ubicación Manual (Clic)',
    })
  }, [tipo])

  // Selección de un candidato del Top 10
  const handleSelectCandidate = (c) => {
    setModoUbicacion('candidato')
    setActivePoint({
      lat: c.lat,
      lng: c.lon,
      isFromCandidate: true,
      candidateNum: c.num,
      distrito: c.distrito,
      areaTerreno: c.area_terreno_m2,
      nombre: c.nombre || `Candidato #${c.num}`,
    })
  }

  // Guardar escenario actual para comparación
  const handleSaveScenario = () => {
    if (!effectivePoint) return

    const newScenario = {
      id: `scen-${Date.now()}`,
      tipo,
      anio,
      radio,
      punto: { ...effectivePoint },
      isInsideMunicipal,
      distritoNombre: calculationResult.distritoNombre,
      distritoId: calculationResult.distritoId,
      personasGanan: calculationResult.personasGanan,
      cobAntes: calculationResult.cobAntes,
      cobDespues: calculationResult.cobDespues,
      areaTerreno: calculationResult.areaTerreno,
      distRocha: distRochaMeters,
      distTransp: distTranspMeters,
      pm10: pm10Estimado.val,
      lstImpact:
        tipo === 'parque'
          ? `${calculationResult.enfriamientoLst} °C`
          : `${lstEstimada} °C LST`,
    }

    setSavedScenarios((prev) => {
      if (prev.length >= 3) {
        // Reemplazar el más antiguo si ya hay 3
        return [...prev.slice(1), newScenario]
      }
      return [...prev, newScenario]
    })
  }

  // Eliminar un escenario
  const handleRemoveScenario = (id) => {
    setSavedScenarios((prev) => prev.filter((s) => s.id !== id))
  }

  // Cargar un escenario guardado en el simulador
  const handleLoadScenario = (s) => {
    setTipo(s.tipo)
    setAnio(s.anio)
    setRadio(s.radio)
    setActivePoint(s.punto)
  }

  // Identidad visual según tipo
  const tipoColor =
    tipo === 'salud' ? '#DC2626' : tipo === 'educacion' ? '#2563EB' : '#059669'


  if (loading) {
    return (
      <div className="simulador-screen-container">
        <div className="sim-card" style={{ padding: '2rem', textAlign: 'center' }}>
          <Sparkles
            className="animate-spin"
            size={24}
            style={{ margin: '0 auto 0.5rem', color: '#0284C7' }}
          />
          <h3 style={{ margin: 0, fontSize: '0.95rem', color: '#0F172A' }}>
            Inicializando simulador urbano y cargando grilla censal...
          </h3>
          <p style={{ margin: '0.35rem 0 0', fontSize: '0.75rem', color: '#64748B' }}>
            Consultando áreas de equipamiento municipal y datos de la Red MÓNICA.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="simulador-screen-container">
      {/* BARRA DE CONTROLES PRINCIPALES */}
      <section className="sim-controls-toolbar">
        {/* Selector de Tipo de Equipamiento */}
        <div className="sim-control-group">
          <span className="sim-control-title">Equipamiento:</span>
          <div className="sim-type-pills">
            <button
              type="button"
              className={`sim-type-btn type-salud ${
                tipo === 'salud' ? 'is-active' : ''
              }`}
              style={tipo === 'salud' ? { color: '#FFFFFF', backgroundColor: '#DC2626', borderColor: '#B91C1C' } : {}}
              onClick={() => setTipo('salud')}
            >
              <HeartPulse size={14} style={tipo === 'salud' ? { color: '#FFFFFF', stroke: '#FFFFFF' } : {}} />
              <span style={tipo === 'salud' ? { color: '#FFFFFF', fontWeight: 800 } : {}} className={tipo === 'salud' ? 'font-bold' : ''}>
                Centro de Salud 1er Nivel
              </span>
            </button>
            <button
              type="button"
              className={`sim-type-btn type-colegio ${
                tipo === 'educacion' ? 'is-active' : ''
              }`}
              style={tipo === 'educacion' ? { color: '#FFFFFF', backgroundColor: '#2563EB', borderColor: '#1D4ED8' } : {}}
              onClick={() => setTipo('educacion')}
            >
              <BookOpen size={14} style={tipo === 'educacion' ? { color: '#FFFFFF', stroke: '#FFFFFF' } : {}} />
              <span style={tipo === 'educacion' ? { color: '#FFFFFF', fontWeight: 800 } : {}} className={tipo === 'educacion' ? 'font-bold' : ''}>
                Unidad Educativa
              </span>
            </button>
            <button
              type="button"
              className={`sim-type-btn type-parque ${
                tipo === 'parque' ? 'is-active' : ''
              }`}
              style={tipo === 'parque' ? { color: '#FFFFFF', backgroundColor: '#059669', borderColor: '#047857' } : {}}
              onClick={() => setTipo('parque')}
            >
              <Trees size={14} style={tipo === 'parque' ? { color: '#FFFFFF', stroke: '#FFFFFF' } : {}} />
              <span style={tipo === 'parque' ? { color: '#FFFFFF', fontWeight: 800 } : {}} className={tipo === 'parque' ? 'font-bold' : ''}>
                Parque Urbano
              </span>
            </button>
          </div>
        </div>

        {/* Selector de Año Demográfico */}
        <div className="sim-control-group">
          <span className="sim-control-title">Horizonte:</span>
          <div className="sim-year-pills">
            <button
              type="button"
              className={`sim-year-btn ${anio === 2025 ? 'is-active' : ''}`}
              style={anio === 2025 ? { color: '#FFFFFF', backgroundColor: '#0284C7', fontWeight: 800 } : {}}
              onClick={() => setAnio(2025)}
            >
              <span style={anio === 2025 ? { color: '#FFFFFF', fontWeight: 800 } : {}}>Hoy (2025)</span>
            </button>
            <button
              type="button"
              className={`sim-year-btn ${anio === 2030 ? 'is-active' : ''}`}
              style={anio === 2030 ? { color: '#FFFFFF', backgroundColor: '#0284C7', fontWeight: 800 } : {}}
              onClick={() => setAnio(2030)}
            >
              <span style={anio === 2030 ? { color: '#FFFFFF', fontWeight: 800 } : {}}>En 5 años (2030)</span>
            </button>
            <button
              type="button"
              className={`sim-year-btn ${anio === 2035 ? 'is-active' : ''}`}
              style={anio === 2035 ? { color: '#FFFFFF', backgroundColor: '#0284C7', fontWeight: 800 } : {}}
              onClick={() => setAnio(2035)}
            >
              <span style={anio === 2035 ? { color: '#FFFFFF', fontWeight: 800 } : {}}>En 10 años (2035)</span>
            </button>
          </div>
        </div>

        {/* Radio de Influencia */}
        <div className="sim-control-group">
          <span className="sim-control-title">Radio:</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            {[500, 800, 1000, 1500].map((rVal) => (
              <button
                key={rVal}
                type="button"
                className={`sim-candidate-pill ${
                  radio === rVal ? 'is-active' : ''
                }`}
                style={{
                  fontSize: '0.72rem',
                  padding: '0.2rem 0.5rem',
                  borderRadius: 6,
                }}
                onClick={() => setRadio(rVal)}
              >
                {rVal < 1000 ? `${rVal}m` : `${rVal / 1000}km`}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* GRID PRINCIPAL: MAPA (IZQ) Y PANEL DE IMPACTO + AUDITORÍA (DER) */}
      <div className="sim-main-grid">
        {/* COLUMNA IZQUIERDA: MAPA INTERACTIVO 3D */}
        <div className="sim-map-card">
          <div className="sim-map-header">
            <div className="sim-map-title-box">
              <span className="neo-micro-tag">MAPA 3D ISOMÉTRICO (MAPLIBRE GL JS)</span>
              <h3>Maqueta Urbana e Impacto Espacial</h3>
            </div>

            {/* Badges de estado del terreno activo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              {isInsideMunicipal ? (
                <span className="sim-audit-badge badge-safe">
                  ✓ Suelo Público GAMC
                </span>
              ) : (
                <span className="sim-audit-badge badge-warn">
                  ⚠️ Suelo Privado / Requiere Expropiación
                </span>
              )}

              {distTranspMeters !== null && distTranspMeters <= 300 && (
                <span
                  className="sim-audit-badge badge-safe"
                  style={{
                    background: 'rgba(124, 58, 237, 0.12)',
                    color: '#7C3AED',
                  }}
                >
                  <Bus size={10} style={{ display: 'inline', marginRight: 2 }} />
                  Bus a {distTranspMeters}m
                </span>
              )}
            </div>
          </div>

          {/* Selector de Candidatos Top 10 vs Clic Libre */}
          <div className="sim-candidates-bar">
            <span
              style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                color: '#64748B',
                marginRight: '0.2rem',
              }}
            >
              Top 10 Candidatos:
            </span>

            {top10Candidatos.map((c) => {
              const isSelected =
                modoUbicacion === 'candidato' &&
                effectivePoint?.lat === c.lat &&
                effectivePoint?.lng === c.lon

              return (
                <button
                  key={c.num}
                  type="button"
                  className={`sim-candidate-pill ${isSelected ? 'is-active' : ''}`}
                  style={isSelected ? { color: '#FFFFFF', backgroundColor: '#0284C7', borderColor: '#0284C7', fontWeight: 800 } : {}}
                  onClick={() => handleSelectCandidate(c)}
                  title={`D${c.distrito} · ${c.area_terreno_m2} m²`}
                >
                  <span style={isSelected ? { color: '#FFFFFF', fontWeight: 800 } : {}}>#{c.num}</span>
                </button>
              )
            })}

            <button
              type="button"
              className={`sim-candidate-pill ${
                modoUbicacion === 'manual' ? 'is-active' : ''
              }`}
              style={{
                marginLeft: 'auto',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
                ...(modoUbicacion === 'manual' ? { color: '#FFFFFF', backgroundColor: '#0284C7', borderColor: '#0284C7', fontWeight: 800 } : {}),
              }}
              onClick={() => setModoUbicacion('manual')}
            >
              <MapPin size={11} style={modoUbicacion === 'manual' ? { color: '#FFFFFF' } : {}} />
              <span style={modoUbicacion === 'manual' ? { color: '#FFFFFF', fontWeight: 800 } : {}}>Clic Libre</span>
            </button>
          </div>

          {/* Maqueta 3D Interactiva con MapLibre GL JS */}
          <MapLibreSimulador3D
            tipo={tipo}
            radio={radio}
            candidatos={top10Candidatos}
            activePoint={effectivePoint}
            onSelectCandidate={handleSelectCandidate}
            onMapClick={handleMapClick}
            areasEquipData={areasEquipData}
            referenciasGeo={referenciasGeo}
            transporteGeo={transporteGeo}
            equipamientosData={equipamientosData}
            existingPoints={existingPoints}
            calculationResult={calculationResult}
            isInsideMunicipal={isInsideMunicipal}
            distTranspMeters={distTranspMeters}
            distRochaMeters={distRochaMeters}
            distritosGeoData={distritosGeoJson}
            climateMode={climateMode}
            onClimateModeChange={setClimateMode}
          />

          {/* Leyenda y Datos del Punto Activo */}
          <div className="sim-map-legend">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', flexWrap: 'wrap' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                <span
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 2,
                    background: '#A7F3D0',
                    border: '1px dashed #059669',
                    display: 'inline-block',
                  }}
                />
                <span>Terrenos GAMC ({areasEquipData?.features?.length || 1141})</span>
              </span>

              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                <span
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    background: tipoColor,
                    display: 'inline-block',
                  }}
                />
                <span>Ilustración 3D + Halo ({radio}m)</span>
              </span>

              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                <span
                  style={{
                    width: 12,
                    height: 3,
                    background: '#0EA5E9',
                    borderRadius: 2,
                    display: 'inline-block',
                  }}
                />
                <span>Río Rocha (Buffer 200m)</span>
              </span>
            </div>

            <div style={{ fontSize: '0.68rem', color: '#64748B', fontFamily: 'monospace' }}>
              Lat: {effectivePoint?.lat?.toFixed(4)}, Lon: {effectivePoint?.lng?.toFixed(4)}
            </div>
          </div>
        </div>

        {/* COLUMNA DERECHA: PANEL DE IMPACTO & AUDITORÍA CLIMÁTICA */}
        <div className="sim-impact-card">
          <div className="sim-impact-header">
            <div>
              <span className="neo-micro-tag">EVALUACIÓN MULTICRITERIO</span>
              <h3 style={{ margin: 0, fontSize: '0.9rem', color: '#0F172A' }}>
                Impacto Socio-Ambiental
              </h3>
            </div>
            <span
              className="puntos-kpi-badge"
              style={{
                background: 'rgba(2, 132, 199, 0.1)',
                color: '#0284C7',
                fontWeight: 700,
                fontSize: '0.72rem',
              }}
            >
              {calculationResult.distritoNombre}
            </span>
          </div>

          {/* BANNER DESTACADO DE VEREDICTO DE VIABILIDAD DECISIONAL */}
          {viabilityVerdict && (
            <div className={`sim-verdict-banner verdict-${viabilityVerdict.level}`} style={{ margin: '0.4rem 0 0.55rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                <strong style={{ fontSize: '0.8rem', letterSpacing: '0.02em' }}>{viabilityVerdict.badge}</strong>
                <span style={{ fontSize: '0.67rem', opacity: 0.9, fontWeight: 700 }}>
                  Filtro: {climateMode === 'none' ? 'General' : climateMode === 'lst' ? 'Calor LST' : climateMode === 'pm10' ? 'Aire PM10' : 'Riesgo Inundación'}
                </span>
              </div>
              <div style={{ fontSize: '0.76rem', fontWeight: 800, marginBottom: 2 }}>{viabilityVerdict.title}</div>
              <p style={{ margin: 0, fontSize: '0.7rem', lineHeight: 1.35 }}>{viabilityVerdict.desc}</p>
            </div>
          )}

          {/* KPI Principal: Población Beneficiada */}
          <div className="sim-kpi-main-box">
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#0369A1' }}>
              POBLACIÓN QUE GANA COBERTURA DIRECTA ({anio}):
            </span>
            <div className="sim-kpi-main-val">
              +{calculationResult.personasGanan.toLocaleString('es-BO')}
              <span style={{ fontSize: '0.85rem', fontWeight: 600, marginLeft: '0.3rem', color: '#64748B' }}>
                habitantes
              </span>
            </div>
            <span style={{ fontSize: '0.68rem', color: '#0369A1' }}>
              Personas sin acceso previo dentro del radio de {radio} m
            </span>
          </div>

          {/* Métricas Detalladas de Cobertura */}
          <div className="sim-impact-metrics-list">
            <div className="sim-metric-row">
              <span style={{ color: '#64748B' }}>Cobertura territorial distrital:</span>
              <strong>
                {calculationResult.cobAntes}% →{' '}
                <span style={{ color: '#059669' }}>{calculationResult.cobDespues}%</span>{' '}
                <span style={{ fontSize: '0.68rem', color: '#059669' }}>
                  (+{(calculationResult.cobDespues - calculationResult.cobAntes).toFixed(1)}%)
                </span>
              </strong>
            </div>

            {tipo === 'parque' ? (
              <>
                <div className="sim-metric-row">
                  <span style={{ color: '#64748B' }}>Espacio verde per cápita:</span>
                  <strong>
                    {calculationResult.areaVerdeAntes} m²/hab →{' '}
                    <span style={{ color: '#059669' }}>
                      {calculationResult.areaVerdeDespues} m²/hab
                    </span>
                  </strong>
                </div>
                <div className="sim-metric-row">
                  <span style={{ color: '#64748B' }}>Superficie arbolada proyectada:</span>
                  <strong style={{ color: '#059669' }}>
                    {calculationResult.areaTerreno.toLocaleString('es-BO')} m²
                  </strong>
                </div>
              </>
            ) : (
              <div className="sim-metric-row">
                <span style={{ color: '#64748B' }}>
                  Presión por centro ({tipo === 'salud' ? 'Salud 1er nivel' : 'Colegio'}):
                </span>
                <strong>
                  {calculationResult.habCentroAntes?.toLocaleString('es-BO') || 'N/A'} hab →{' '}
                  <span style={{ color: '#0284C7' }}>
                    {calculationResult.habCentroDespues.toLocaleString('es-BO')} hab
                  </span>
                </strong>
              </div>
            )}

            <div className="sim-metric-row">
              <span style={{ color: '#64748B' }}>Régimen de propiedad de suelo:</span>
              <strong style={{ color: isInsideMunicipal ? '#059669' : '#D97706' }}>
                {isInsideMunicipal ? 'Municipal Disponible (Sin coste)' : 'Requiere Expropiación'}
              </strong>
            </div>
          </div>

          {/* SECCIÓN AUDITORÍA CLIMÁTICA Y DE RIESGO */}
          <div className="sim-audit-card">
            <div className="sim-audit-title">
              <Sparkles size={13} style={{ color: '#0284C7' }} />
              <span>Auditoría de Resiliencia Climática</span>
            </div>

            {/* 1. Riesgo Hídrico y Río Rocha */}
            <div className="sim-audit-item">
              <Droplets
                size={14}
                style={{
                  color:
                    distRochaMeters !== null && distRochaMeters < 200
                      ? '#DC2626'
                      : '#0284C7',
                  flexShrink: 0,
                  marginTop: 2,
                }}
              />
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: 2 }}>
                  <strong style={{ color: '#0F172A', fontSize: '0.73rem' }}>
                    Riesgo Hídrico / Río Rocha:
                  </strong>
                  {distRochaMeters !== null && distRochaMeters < 200 ? (
                    <span className="sim-audit-badge badge-danger">Alerta &lt;200m</span>
                  ) : (
                    <span className="sim-audit-badge badge-safe">Zona Segura</span>
                  )}
                </div>
                <p style={{ margin: 0, color: '#64748B', fontSize: '0.69rem' }}>
                  {distRochaMeters !== null && distRochaMeters < 200
                    ? `A ${distRochaMeters} m del cauce. Requiere diseño con cota de fundación elevada y drenaje pluvial reforzado.`
                    : `A ${distRochaMeters || 650} m del Río Rocha. Sin afectación directa por desbordes riparios.`}
                </p>
              </div>
            </div>

            {/* 2. Calidad del Aire (Red MÓNICA) */}
            <div className="sim-audit-item">
              <Wind
                size={14}
                style={{
                  color: pm10Estimado.val > 65 ? '#DC2626' : '#059669',
                  flexShrink: 0,
                  marginTop: 2,
                }}
              />
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: 2 }}>
                  <strong style={{ color: '#0F172A', fontSize: '0.73rem' }}>
                    Calidad del Aire (Red MÓNICA):
                  </strong>
                  <span className={`sim-audit-badge ${pm10Estimado.badge}`}>
                    {pm10Estimado.val} µg/m³ PM10
                  </span>
                </div>
                <p style={{ margin: 0, color: '#64748B', fontSize: '0.69rem' }}>
                  {pm10Estimado.val > 65
                    ? 'Cuenca sur con alta concentración de partículas. Se recomienda cortina vegetal perimetral.'
                    : 'Niveles aceptables de ventilación atmosférica.'}
                </p>
              </div>
            </div>

            {/* 3. Isla de Calor Superficial (LST) */}
            <div className="sim-audit-item">
              <Thermometer
                size={14}
                style={{
                  color: tipo === 'parque' ? '#059669' : '#F97316',
                  flexShrink: 0,
                  marginTop: 2,
                }}
              />
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: 2 }}>
                  <strong style={{ color: '#0F172A', fontSize: '0.73rem' }}>
                    Isla de Calor Superficial (LST):
                  </strong>
                  {tipo === 'parque' ? (
                    <span className="sim-audit-badge badge-safe">
                      Refrescamiento {calculationResult.enfriamientoLst} °C
                    </span>
                  ) : lstEstimada > 30 ? (
                    <span className="sim-audit-badge badge-warn">
                      LST Alta ({lstEstimada} °C)
                    </span>
                  ) : (
                    <span className="sim-audit-badge badge-safe">
                      LST Confort ({lstEstimada} °C)
                    </span>
                  )}
                </div>
                <p style={{ margin: 0, color: '#64748B', fontSize: '0.69rem' }}>
                  {tipo === 'parque'
                    ? `Mitigación climática local: reducción de hasta ${Math.abs(
                        calculationResult.enfriamientoLst
                      )} °C por sombra y evapotranspiración vegetal.`
                    : lstEstimada > 30
                    ? 'Temperatura superficial elevada. Incorporar techos frescos y jardines perimetrales.'
                    : 'Microclima térmico moderado.'}
                </p>
              </div>
            </div>
          </div>

          {/* Botón para Guardar en Escenarios */}
          <button
            type="button"
            className="sim-btn-save font-bold"
            style={{
              color: '#FFFFFF',
              backgroundColor: '#0284C7',
              borderColor: '#0284C7',
              fontWeight: 800,
            }}
            onClick={handleSaveScenario}
          >
            <Save size={14} style={{ color: '#FFFFFF', stroke: '#FFFFFF' }} />
            <span style={{ color: '#FFFFFF', fontWeight: 800 }} className="font-bold">
              Guardar en Escenarios ({savedScenarios.length}/3)
            </span>
          </button>
        </div>
      </div>

      {/* SECCIÓN INFERIOR: COMPARADOR DE ESCENARIOS GUARDADOS */}
      <section className="sim-scenarios-section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span className="neo-micro-tag">PLANIFICACIÓN URBANA COMPARATIVA</span>
            <h3 style={{ margin: 0, fontSize: '0.92rem', color: '#0F172A' }}>
              Comparador de Escenarios Simulados ({savedScenarios.length}/3)
            </h3>
          </div>

          {savedScenarios.length > 0 && (
            <button
              type="button"
              className="sim-candidate-pill"
              style={{ color: '#DC2626', borderColor: '#FCA5A5' }}
              onClick={() => setSavedScenarios([])}
            >
              <Trash2 size={11} style={{ display: 'inline', marginRight: 3 }} />
              Limpiar todos
            </button>
          )}
        </div>

        {savedScenarios.length === 0 ? (
          <div
            style={{
              padding: '1.5rem',
              textAlign: 'center',
              border: '1.5px dashed #CBD5E1',
              borderRadius: 10,
              background: '#F8FAFC',
              color: '#64748B',
            }}
          >
            <Info size={20} style={{ margin: '0 auto 0.35rem', color: '#0284C7' }} />
            <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: 600 }}>
              No has guardado escenarios aún.
            </p>
            <p style={{ margin: '0.2rem 0 0', fontSize: '0.72rem' }}>
              Prueba cambiando de tipo de equipamiento (Salud, Educación, Parques), selecciona diferentes candidatos o haz clic libre en el mapa y presiona "Guardar en Escenarios" para comparar alternativas lado a lado.
            </p>
          </div>
        ) : (
          <div className="sim-scenarios-grid">
            {savedScenarios.map((scen, idx) => {
              const borderTopColor =
                scen.tipo === 'salud'
                  ? '#DC2626'
                  : scen.tipo === 'educacion'
                  ? '#2563EB'
                  : '#059669'

              return (
                <div
                  key={scen.id}
                  className="sim-scenario-box"
                  style={{ borderTopColor: borderTopColor }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ fontSize: '0.82rem', color: '#0F172A' }}>
                      Escenario {String.fromCharCode(65 + idx)}:{' '}
                      {scen.tipo === 'salud'
                        ? 'Salud'
                        : scen.tipo === 'educacion'
                        ? 'Colegio'
                        : 'Parque'}
                    </strong>
                    <span
                      style={{
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        padding: '1px 6px',
                        borderRadius: 4,
                        background: `${borderTopColor}15`,
                        color: borderTopColor,
                      }}
                    >
                      {scen.distritoNombre}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.72rem', color: '#64748B' }}>
                    Año {scen.anio} · Radio {scen.radio}m ·{' '}
                    <span style={{ color: scen.isInsideMunicipal ? '#059669' : '#D97706', fontWeight: 600 }}>
                      {scen.isInsideMunicipal ? 'Municipal GAMC' : 'Suelo Privado'}
                    </span>
                  </div>

                  {/* Impacto Poblacional */}
                  <div
                    style={{
                      background: '#F1F5F9',
                      padding: '0.4rem 0.6rem',
                      borderRadius: 6,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <span style={{ fontSize: '0.7rem', color: '#475569' }}>Beneficiarios:</span>
                    <strong style={{ fontSize: '0.95rem', color: '#0284C7' }}>
                      +{scen.personasGanan.toLocaleString('es-BO')} hab
                    </strong>
                  </div>

                  {/* Resumen Ambiental */}
                  <div style={{ fontSize: '0.68rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748B' }}>Río Rocha:</span>
                      <strong style={{ color: scen.distRocha < 200 ? '#DC2626' : '#059669' }}>
                        {scen.distRocha < 200 ? '⚠️ <200m (Inundable)' : '✓ Seguro (>200m)'}
                      </strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748B' }}>Calidad del Aire:</span>
                      <strong>{scen.pm10} µg/m³ PM10</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748B' }}>Impacto Térmico:</span>
                      <strong style={{ color: scen.tipo === 'parque' ? '#059669' : '#0F172A' }}>
                        {scen.lstImpact}
                      </strong>
                    </div>
                  </div>

                  {/* Botones de acción */}
                  <div style={{ display: 'flex', gap: '0.35rem', marginTop: '0.3rem' }}>
                    <button
                      type="button"
                      className="sim-candidate-pill"
                      style={{
                        flex: 1,
                        fontSize: '0.68rem',
                        padding: '0.3rem',
                        textAlign: 'center',
                        color: '#0284C7',
                        borderColor: '#0284C7',
                      }}
                      onClick={() => handleLoadScenario(scen)}
                    >
                      <RotateCcw size={10} style={{ display: 'inline', marginRight: 3 }} />
                      Cargar en Mapa
                    </button>
                    <button
                      type="button"
                      className="sim-candidate-pill"
                      style={{
                        color: '#DC2626',
                        borderColor: '#FCA5A5',
                        padding: '0.3rem 0.5rem',
                      }}
                      onClick={() => handleRemoveScenario(scen.id)}
                      title="Eliminar escenario"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}