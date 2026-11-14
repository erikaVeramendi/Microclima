import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  HeartPulse,
  BookOpen,
  MapPin,
  Save,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Layers,
} from 'lucide-react'
import GamcMap from './GamcMap'
import './IndiceScreen.css'

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

// Ray-casting point-in-polygon
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

export default function SimuladorEquipamientosScreen({
  selectedZoneId: _selectedZoneId,
  onSelectZone,
}) {
  const [candidatosRaw, setCandidatosRaw] = useState(null)
  const [equipamientosData, setEquipamientosData] = useState(null)
  const [grillaData, setGrillaData] = useState(null)
  const [areasEquipData, setAreasEquipData] = useState(null)
  const [indiceData, setIndiceData] = useState(null)
  const [loading, setLoading] = useState(true)

  // Controles del simulador
  const [tipo, setTipo] = useState('salud') // 'salud' | 'educacion'
  const [radio, setRadio] = useState(1000) // 500 a 2000 m
  const [anio, setAnio] = useState(2025) // 2025 | 2030

  // Punto activo simulado: { lat, lng, isFromCandidate, candidateIdx, areaTerreno }
  const [activePoint, setActivePoint] = useState(null)

  // Escenarios guardados (hasta 3)
  const [savedScenarios, setSavedScenarios] = useState([])

  // Carga de las 5 fuentes reales
  useEffect(() => {
    let isMounted = true

    Promise.all([
      fetch('/data/candidatos_equipamiento.json').then((r) => (r.ok ? r.json() : null)),
      fetch('/data/equipamientos.geojson').then((r) => (r.ok ? r.json() : null)),
      fetch('/data/poblacion_grilla.json').then((r) => (r.ok ? r.json() : null)),
      fetch('/data/areas_equipamiento.geojson').then((r) => (r.ok ? r.json() : null)),
      fetch('/data/indice_distritos.json').then((r) => (r.ok ? r.json() : null)),
    ])
      .then(([cand, equip, grilla, areas, idx]) => {
        if (!isMounted) return
        if (cand) setCandidatosRaw(cand)
        if (equip) setEquipamientosData(equip)
        if (grilla) setGrillaData(grilla)
        if (areas) setAreasEquipData(areas)
        if (idx) setIndiceData(idx)
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

  // Equipamientos existentes del tipo elegido
  const existingPoints = useMemo(() => {
    if (!equipamientosData?.features) return []
    return equipamientosData.features
      .filter((f) => {
        const p = f.properties
        if (!p || !f.geometry?.coordinates) return false
        if (tipo === 'salud') {
          return p.tipo === 'salud' && String(p.nivel || '').includes('1')
        }
        return p.tipo === 'educacion'
      })
      .map((f) => ({
        lat: f.geometry.coordinates[1],
        lng: f.geometry.coordinates[0],
        nombre: f.properties.nombre || 'Equipamiento',
      }))
  }, [equipamientosData, tipo])

  // Top 10 candidatos del tipo elegido
  const top10Candidatos = useMemo(() => {
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

  // Por defecto, seleccionar el candidato #1 del tipo elegido
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

  // Comprobar si el punto activo está dentro de un terreno municipal
  const isInsideMunicipal = useMemo(() => {
    if (!effectivePoint) return false
    if (effectivePoint.isFromCandidate) return true // Los candidatos sugeridos provienen de terrenos municipales oficiales

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

  // Cálculo en el navegador con poblacion_grilla.json
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
      }
    }

    const { lat: newLat, lng: newLng } = effectivePoint
    const degBox = (radio + 150) / 111320 // Grados aproximados
    const popColIdx = anio === 2030 ? 3 : 2

    let personasGananTotal = 0
    const districtVotes = {}

    const celdas = grillaData.celdas
    for (let i = 0; i < celdas.length; i++) {
      const c = celdas[i]
      const cLon = c[0]
      const cLat = c[1]
      const cPop = c[popColIdx]
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

    // Determinar distrito afectado
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
    const pobDist = anio === 2030 ? ind.personas_2030 || ind.personas : ind.personas || 40000

    let cobAntes = 50
    if (tipo === 'salud') {
      cobAntes = anio === 2030 ? ind.cobertura_salud_2030 || ind.cobertura_salud : ind.cobertura_salud
    } else {
      cobAntes = ind.cobertura_colegio || 75
    }

    const pctGanancia = pobDist > 0 ? (personasGananTotal / pobDist) * 100 : 0
    const cobDespues = Math.min(100, Number((cobAntes + pctGanancia).toFixed(1)))

    const centrosAntes = tipo === 'salud' ? ind.salud_1er || 0 : ind.colegios || 0
    const centrosDespues = centrosAntes + 1
    const habCentroAntes = centrosAntes > 0 ? Math.round(pobDist / centrosAntes) : null
    const habCentroDespues = Math.round(pobDist / centrosDespues)

    return {
      personasGanan: Math.round(personasGananTotal),
      distritoId: targetDistId,
      distritoNombre: distInfo?.nombre || `Distrito ${targetDistId}`,
      cobAntes: Number(cobAntes.toFixed(1)),
      cobDespues,
      habCentroAntes,
      habCentroDespues,
    }
  }, [effectivePoint, grillaData, existingPoints, radio, anio, tipo, indiceData])

  // Manejo de clic sobre el mapa para colocar equipamiento
  const handleMapClick = useCallback((coords) => {
    setActivePoint({
      lat: coords.lat,
      lng: coords.lng,
      isFromCandidate: false,
      candidateNum: null,
      distrito: null,
      areaTerreno: null,
    })
  }, [])

  // Círculos de cobertura para GamcMap
  const mapRadios = useMemo(() => {
    const list = []

    // Círculos tenues para equipamientos existentes
    existingPoints.forEach((p) => {
      list.push({
        lat: p.lat,
        lng: p.lng,
        radius: radio,
        color: tipo === 'salud' ? '#EF4444' : '#F59E0B',
        fillColor: tipo === 'salud' ? '#EF4444' : '#F59E0B',
        fillOpacity: 0.05,
        label: p.nombre,
      })
    })

    // Círculo destacado del nuevo punto simulado
    if (effectivePoint) {
      list.push({
        lat: effectivePoint.lat,
        lng: effectivePoint.lng,
        radius: radio,
        color: '#8B5CF6',
        fillColor: '#8B5CF6',
        fillOpacity: 0.22,
        label: `Nuevo ${tipo === 'salud' ? 'Centro de Salud' : 'Colegio'} (Radio ${radio} m)`,
      })
    }

    return list
  }, [existingPoints, effectivePoint, radio, tipo])

  // GeoJSON para GamcMap (polígonos de equipamiento municipal + marcadores candidatos y nuevo punto)
  const simulatorGeoJson = useMemo(() => {
    const features = []

    // 1. Áreas de equipamiento municipal (polígonos tenues violetas)
    if (areasEquipData?.features) {
      features.push(
        ...areasEquipData.features.slice(0, 1500).map((f) => ({
          ...f,
          properties: {
            ...f.properties,
            fillColor: '#8B5CF6',
            color: '#A78BFA',
          },
        }))
      )
    }

    // 2. Top 10 candidatos como marcadores numerados
    top10Candidatos.forEach((c) => {
      features.push({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [c.lon, c.lat],
        },
        properties: {
          isCandidate: true,
          candidateNumber: c.num,
          nombre: `Candidato #${c.num} (${c.distrito ? 'Distrito ' + c.distrito : ''}) · Terreno: ${c.area_terreno_m2} m²`,
        },
      })
    })

    // 3. Marcador del nuevo punto simulado (estrella)
    if (effectivePoint) {
      features.push({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [effectivePoint.lng, effectivePoint.lat],
        },
        properties: {
          isNewSimulated: true,
          nombre: `Ubicación Simulada (${isInsideMunicipal ? 'Terreno Municipal' : 'Fuera de terreno'})`,
        },
      })
    }

    return {
      type: 'FeatureCollection',
      features,
    }
  }, [areasEquipData, top10Candidatos, effectivePoint, isInsideMunicipal])

  // Guardar escenario (máximo 3)
  const handleSaveScenario = () => {
    if (!effectivePoint) return
    if (savedScenarios.length >= 3) {
      alert('Has alcanzado el límite de 3 escenarios guardados. Borra uno para guardar otro.')
      return
    }

    const newScenario = {
      id: Date.now(),
      num: savedScenarios.length + 1,
      tipo,
      radio,
      anio,
      lat: effectivePoint.lat,
      lng: effectivePoint.lng,
      isInsideMunicipal,
      distritoNombre: calculationResult.distritoNombre,
      personasGanan: calculationResult.personasGanan,
      cobAntes: calculationResult.cobAntes,
      cobDespues: calculationResult.cobDespues,
    }

    setSavedScenarios((prev) => [...prev, newScenario])
  }

  const handleDeleteScenario = (id) => {
    setSavedScenarios((prev) => prev.filter((s) => s.id !== id))
  }

  const handleClearAllScenarios = () => {
    setSavedScenarios([])
  }

  const handleLoadScenario = (scen) => {
    setTipo(scen.tipo)
    setRadio(scen.radio)
    setAnio(scen.anio)
    setActivePoint({
      lat: scen.lat,
      lng: scen.lng,
      isFromCandidate: false,
      candidateNum: null,
      distrito: null,
      areaTerreno: null,
    })
  }

  if (loading && !candidatosRaw) {
    return (
      <div className="neo-screen" style={{ padding: '2rem', textAlign: 'center' }}>
        <p style={{ color: 'var(--theme-text-muted)' }}>Cargando simulador de equipamientos...</p>
      </div>
    )
  }

  return (
    <div className="neo-screen">
      {/* 1. Línea bajo el título con badge de Estimación */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '0.1rem',
          flexWrap: 'wrap',
          gap: '0.5rem',
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: '0.86rem',
            color: 'var(--theme-text-muted)',
            lineHeight: 1.45,
          }}
        >
          Prueba dónde ubicar un nuevo centro de salud o colegio y mira a cuántas personas ayudaría.
        </p>

        <span
          style={{
            fontSize: '0.7rem',
            padding: '0.15rem 0.55rem',
            borderRadius: '99px',
            background: 'var(--theme-accent-subtle, rgba(56, 189, 248, 0.15))',
            color: 'var(--theme-accent, #38BDF8)',
            fontWeight: 700,
            border: '1px solid var(--theme-border)',
          }}
        >
          Estimación Geoespacial
        </span>
      </div>

      {/* 2. Controles: Tipo · Radio · Año */}
      <section
        className="hud-card"
        style={{
          padding: '0.65rem 0.85rem',
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '1rem',
          alignItems: 'center',
        }}
      >
        {/* Control 1: Tipo de Equipamiento */}
        <div>
          <span
            style={{
              fontSize: '0.74rem',
              color: 'var(--color-icon)',
              fontWeight: 600,
              display: 'block',
              marginBottom: '0.35rem',
            }}
          >
            Tipo de equipamiento:
          </span>
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            <button
              type="button"
              onClick={() => {
                setTipo('salud')
                setActivePoint(null)
              }}
              className="gamc-btn-secondary"
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.35rem',
                fontSize: '0.74rem',
                padding: '0.35rem 0.5rem',
                background: tipo === 'salud' ? 'rgba(239, 68, 68, 0.18)' : undefined,
                color: tipo === 'salud' ? '#EF4444' : undefined,
                borderColor: tipo === 'salud' ? '#EF4444' : undefined,
                fontWeight: tipo === 'salud' ? 700 : 500,
              }}
            >
              <HeartPulse size={14} />
              Salud 1er nivel
            </button>
            <button
              type="button"
              onClick={() => {
                setTipo('educacion')
                setActivePoint(null)
              }}
              className="gamc-btn-secondary"
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.35rem',
                fontSize: '0.74rem',
                padding: '0.35rem 0.5rem',
                background: tipo === 'educacion' ? 'rgba(245, 158, 11, 0.18)' : undefined,
                color: tipo === 'educacion' ? '#F59E0B' : undefined,
                borderColor: tipo === 'educacion' ? '#F59E0B' : undefined,
                fontWeight: tipo === 'educacion' ? 700 : 500,
              }}
            >
              <BookOpen size={14} />
              Unidad educativa
            </button>
          </div>
        </div>

        {/* Control 2: Radio de cobertura (500 a 2000m) */}
        <div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '0.74rem',
              fontWeight: 600,
              marginBottom: '0.35rem',
            }}
          >
            <span style={{ color: 'var(--color-icon)' }}>Radio de cobertura:</span>
            <strong style={{ color: 'var(--theme-accent, #38BDF8)' }}>{radio} metros</strong>
          </div>
          <input
            type="range"
            min="500"
            max="2000"
            step="100"
            value={radio}
            onChange={(e) => setRadio(parseInt(e.target.value, 10))}
            style={{
              width: '100%',
              accentColor: 'var(--theme-accent, #38BDF8)',
              cursor: 'pointer',
            }}
          />
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '0.66rem',
              color: 'var(--theme-text-muted)',
              marginTop: '0.15rem',
            }}
          >
            <span>500 m</span>
            <span>1.000 m (estándar)</span>
            <span>2.000 m</span>
          </div>
        </div>

        {/* Control 3: Año de población (2025 o 2030) */}
        <div>
          <span
            style={{
              fontSize: '0.74rem',
              color: 'var(--color-icon)',
              fontWeight: 600,
              display: 'block',
              marginBottom: '0.35rem',
            }}
          >
            Año de cálculo demográfico:
          </span>
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            <button
              type="button"
              onClick={() => setAnio(2025)}
              className="gamc-btn-secondary"
              style={{
                flex: 1,
                fontSize: '0.75rem',
                padding: '0.35rem 0.5rem',
                background: anio === 2025 ? 'var(--theme-accent, #38BDF8)' : undefined,
                color: anio === 2025 ? '#0f172a' : undefined,
                fontWeight: anio === 2025 ? 700 : 500,
              }}
            >
              2025 (Población hoy)
            </button>
            <button
              type="button"
              onClick={() => setAnio(2030)}
              className="gamc-btn-secondary"
              style={{
                flex: 1,
                fontSize: '0.75rem',
                padding: '0.35rem 0.5rem',
                background: anio === 2030 ? 'var(--theme-accent, #38BDF8)' : undefined,
                color: anio === 2030 ? '#0f172a' : undefined,
                fontWeight: anio === 2030 ? 700 : 500,
              }}
            >
              2030 (Proyección)
            </button>
          </div>
        </div>
      </section>

      {/* Tira de 10 candidatos sugeridos */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.45rem',
          overflowX: 'auto',
          paddingBottom: '0.2rem',
        }}
      >
        <span
          style={{
            fontSize: '0.72rem',
            color: 'var(--color-icon)',
            fontWeight: 600,
            whiteSpace: 'nowrap',
          }}
        >
          Top 10 candidatos:
        </span>
        {top10Candidatos.map((c) => {
          const isSelected =
            effectivePoint?.isFromCandidate && effectivePoint?.candidateNum === c.num

          return (
            <button
              key={c.num}
              type="button"
              onClick={() => {
                setActivePoint({
                  lat: c.lat,
                  lng: c.lon,
                  isFromCandidate: true,
                  candidateNum: c.num,
                  distrito: c.distrito,
                  areaTerreno: c.area_terreno_m2,
                })
                if (c.distrito && onSelectZone) {
                  onSelectZone(`distrito-${c.distrito}`)
                }
              }}
              className="gamc-btn-secondary"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
                padding: '0.2rem 0.55rem',
                fontSize: '0.72rem',
                borderRadius: '6px',
                whiteSpace: 'nowrap',
                background: isSelected ? 'rgba(139, 92, 246, 0.22)' : undefined,
                borderColor: isSelected ? '#8B5CF6' : undefined,
                color: isSelected ? '#A78BFA' : undefined,
                fontWeight: isSelected ? 700 : 500,
              }}
            >
              <span
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  background: isSelected ? '#8B5CF6' : 'var(--theme-border)',
                  color: '#fff',
                  fontSize: '0.65rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                }}
              >
                {c.num}
              </span>
              <span>D{c.distrito}</span>
              <span style={{ color: 'var(--theme-text-muted)', fontSize: '0.66rem' }}>
                ({c.area_terreno_m2} m²)
              </span>
            </button>
          )
        })}
      </div>

      {/* 3. Centro: GamcMap a la izquierda + Panel de Resultados a la derecha */}
      <section
        style={{
          display: 'grid',
          gridTemplateColumns: '1.25fr 1fr',
          gap: '0.75rem',
          alignItems: 'start',
        }}
      >
        {/* Mapa */}
        <div
          className="hud-card"
          style={{
            padding: '0.75rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <MapPin size={18} strokeWidth={1.75} color="var(--color-icon)" />
              <h3 style={{ margin: 0, fontSize: '0.88rem', fontWeight: 600 }}>
                Mapa de Simulación y Terrenos de Equipamiento
              </h3>
            </div>
            <div style={{ display: 'flex', gap: '0.65rem', fontSize: '0.68rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '2px',
                    background: 'rgba(139, 92, 246, 0.45)',
                    display: 'inline-block',
                    border: '1px solid #A78BFA',
                  }}
                />
                Terrenos equipamiento GAMC
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: '#8B5CF6',
                    display: 'inline-block',
                  }}
                />
                Candidatos sugeridos (1-10)
              </span>
            </div>
          </div>

          <GamcMap
            geojson={simulatorGeoJson}
            radios={mapRadios}
            onClickMapa={handleMapClick}
            capasWms={['areas_equipamiento', 'limite_distritos']}
            height="430px"
          />

          <span
            style={{
              fontSize: '0.72rem',
              color: 'var(--theme-text-muted)',
              fontStyle: 'italic',
            }}
          >
            Haz clic en un candidato numerado o en cualquier punto del mapa para calcular la nueva cobertura poblacional.
          </span>
        </div>

        {/* Panel de Resultado a la derecha */}
        <div
          className="hud-card"
          style={{
            padding: '0.85rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.65rem',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '1px solid var(--theme-border)',
              paddingBottom: '0.45rem',
            }}
          >
            <div>
              <h3 style={{ margin: 0, fontSize: '0.96rem', fontWeight: 700, color: 'var(--theme-text-primary)' }}>
                Impacto Estimado
              </h3>
              <span style={{ fontSize: '0.72rem', color: 'var(--theme-text-muted)' }}>
                {calculationResult.distritoNombre} · Año {anio}
              </span>
            </div>

            {/* Etiqueta de terreno */}
            <span
              style={{
                fontSize: '0.72rem',
                padding: '0.15rem 0.55rem',
                borderRadius: '4px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
                background: isInsideMunicipal
                  ? 'rgba(34, 197, 94, 0.15)'
                  : 'rgba(239, 68, 68, 0.15)',
                color: isInsideMunicipal ? '#22C55E' : '#EF4444',
                fontWeight: 700,
                border: `1px solid ${isInsideMunicipal ? 'rgba(34, 197, 94, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`,
              }}
            >
              {isInsideMunicipal ? (
                <>
                  <CheckCircle2 size={13} />
                  Terreno municipal
                </>
              ) : (
                <>
                  <AlertCircle size={13} />
                  Fuera de terreno municipal
                </>
              )}
            </span>
          </div>

          {/* Tarjeta 1: Personas que ganan cobertura */}
          <div
            style={{
              background: 'var(--theme-card-bg-subtle, rgba(255,255,255,0.02))',
              border: '1px solid var(--theme-border)',
              borderRadius: '8px',
              padding: '0.65rem 0.75rem',
            }}
          >
            <span
              style={{
                fontSize: '0.72rem',
                color: 'var(--color-icon)',
                fontWeight: 600,
                display: 'block',
                marginBottom: '0.2rem',
              }}
            >
              PERSONAS QUE GANAN COBERTURA
            </span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem' }}>
              <strong style={{ fontSize: '1.6rem', color: '#22C55E', fontWeight: 800 }}>
                +{calculationResult.personasGanan.toLocaleString('es-BO')}
              </strong>
              <span style={{ fontSize: '0.85rem', color: 'var(--theme-text-muted)' }}>
                habitantes
              </span>
            </div>
            <span style={{ fontSize: '0.7rem', color: 'var(--theme-text-muted)', marginTop: '0.2rem', display: 'block' }}>
              Población dentro del radio de {radio} m que hoy no tenía {tipo === 'salud' ? 'salud primaria' : 'colegio'}
            </span>
          </div>

          {/* Tarjeta 2: Nueva cobertura del distrito (antes -> después) */}
          <div
            style={{
              background: 'var(--theme-card-bg-subtle, rgba(255,255,255,0.02))',
              border: '1px solid var(--theme-border)',
              borderRadius: '8px',
              padding: '0.65rem 0.75rem',
            }}
          >
            <span
              style={{
                fontSize: '0.72rem',
                color: 'var(--color-icon)',
                fontWeight: 600,
                display: 'block',
                marginBottom: '0.2rem',
              }}
            >
              COBERTURA DEL DISTRITO ({calculationResult.distritoNombre})
            </span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
              <span style={{ fontSize: '1.15rem', color: 'var(--theme-text-muted)', fontWeight: 600 }}>
                {calculationResult.cobAntes.toFixed(1).replace('.', ',')} %
              </span>
              <span style={{ color: 'var(--color-icon)' }}>→</span>
              <strong style={{ fontSize: '1.35rem', color: 'var(--theme-accent, #38BDF8)' }}>
                {calculationResult.cobDespues.toFixed(1).replace('.', ',')} %
              </strong>
              <span style={{ fontSize: '0.74rem', color: '#22C55E', fontWeight: 700 }}>
                (+{(calculationResult.cobDespues - calculationResult.cobAntes).toFixed(1).replace('.', ',')} %)
              </span>
            </div>
            <span style={{ fontSize: '0.7rem', color: 'var(--theme-text-muted)', marginTop: '0.2rem', display: 'block' }}>
              Porcentaje de vecinos cubiertos a menos de {radio} metros
            </span>
          </div>

          {/* Tarjeta 3: Habitantes por centro (antes -> después) */}
          <div
            style={{
              background: 'var(--theme-card-bg-subtle, rgba(255,255,255,0.02))',
              border: '1px solid var(--theme-border)',
              borderRadius: '8px',
              padding: '0.65rem 0.75rem',
            }}
          >
            <span
              style={{
                fontSize: '0.72rem',
                color: 'var(--color-icon)',
                fontWeight: 600,
                display: 'block',
                marginBottom: '0.2rem',
              }}
            >
              HABITANTES POR CENTRO EN EL DISTRITO
            </span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
              <span style={{ fontSize: '1.05rem', color: 'var(--theme-text-muted)', fontWeight: 600 }}>
                {calculationResult.habCentroAntes
                  ? `${calculationResult.habCentroAntes.toLocaleString('es-BO')}`
                  : 'Sin centros'}
              </span>
              <span style={{ color: 'var(--color-icon)' }}>→</span>
              <strong style={{ fontSize: '1.25rem', color: '#10B981' }}>
                {calculationResult.habCentroDespues.toLocaleString('es-BO')}
              </strong>
              <span style={{ fontSize: '0.72rem', color: 'var(--theme-text-muted)' }}>
                hab./centro
              </span>
            </div>
            <span style={{ fontSize: '0.7rem', color: 'var(--theme-text-muted)', marginTop: '0.2rem', display: 'block' }}>
              Descongestiona la demanda asistencial del sector
            </span>
          </div>

          {/* Botón Guardar escenario */}
          <button
            type="button"
            onClick={handleSaveScenario}
            className="gamc-btn-secondary"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
              padding: '0.5rem',
              fontSize: '0.78rem',
              fontWeight: 700,
              background: 'var(--theme-accent, #38BDF8)',
              color: '#0f172a',
              border: 'none',
              borderRadius: '6px',
              marginTop: '0.2rem',
            }}
          >
            <Save size={15} />
            Guardar este escenario ({savedScenarios.length}/3)
          </button>
        </div>
      </section>

      {/* 4. Abajo: Tabla de Escenarios guardados */}
      <section
        className="hud-card"
        style={{
          padding: '0.85rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.55rem',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <Layers size={18} strokeWidth={1.75} color="var(--color-icon)" />
            <h3 style={{ margin: 0, fontSize: '0.88rem', fontWeight: 600 }}>
              Escenarios Guardados para Comparación
            </h3>
            <span style={{ fontSize: '0.7rem', color: 'var(--theme-text-muted)' }}>
              ({savedScenarios.length} de 3 posibles)
            </span>
          </div>

          {savedScenarios.length > 0 && (
            <button
              type="button"
              onClick={handleClearAllScenarios}
              className="gamc-btn-secondary"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
                fontSize: '0.7rem',
                padding: '0.2rem 0.5rem',
                color: '#EF4444',
              }}
            >
              <Trash2 size={13} />
              Borrar todos
            </button>
          )}
        </div>

        {savedScenarios.length === 0 ? (
          <div
            style={{
              padding: '1.25rem',
              textAlign: 'center',
              color: 'var(--theme-text-muted)',
              fontSize: '0.76rem',
              fontStyle: 'italic',
            }}
          >
            Aún no has guardado escenarios. Prueba diferentes ubicaciones en el mapa y haz clic en «Guardar este escenario» para contrastar su impacto.
          </div>
        ) : (
          <div
            style={{
              overflowX: 'auto',
              border: '1px solid var(--theme-border)',
              borderRadius: '6px',
            }}
          >
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '0.74rem',
                textAlign: 'left',
              }}
            >
              <thead>
                <tr
                  style={{
                    background: 'var(--theme-card-bg-subtle, rgba(255,255,255,0.04))',
                    borderBottom: '1px solid var(--theme-border)',
                    color: 'var(--color-icon)',
                  }}
                >
                  <th style={{ padding: '6px 8px' }}>#</th>
                  <th style={{ padding: '6px 8px' }}>Tipo</th>
                  <th style={{ padding: '6px 8px' }}>Distrito</th>
                  <th style={{ padding: '6px 8px' }}>Radio / Año</th>
                  <th style={{ padding: '6px 8px' }}>Terreno Municipal</th>
                  <th style={{ padding: '6px 8px', textAlign: 'right' }}>Ganan Cobertura</th>
                  <th style={{ padding: '6px 8px', textAlign: 'right' }}>Cobertura Resultante</th>
                  <th style={{ padding: '6px 8px', textAlign: 'center' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {savedScenarios.map((s) => (
                  <tr
                    key={s.id}
                    style={{
                      borderBottom: '1px solid var(--theme-border)',
                    }}
                  >
                    <td style={{ padding: '5px 8px', fontWeight: 700 }}>
                      Escenario {s.num}
                    </td>
                    <td style={{ padding: '5px 8px' }}>
                      {s.tipo === 'salud' ? 'Salud 1er nivel' : 'Unidad educativa'}
                    </td>
                    <td style={{ padding: '5px 8px' }}>{s.distritoNombre}</td>
                    <td style={{ padding: '5px 8px' }}>
                      {s.radio} m · {s.anio}
                    </td>
                    <td style={{ padding: '5px 8px' }}>
                      <span
                        style={{
                          color: s.isInsideMunicipal ? '#22C55E' : '#EF4444',
                          fontWeight: 600,
                        }}
                      >
                        {s.isInsideMunicipal ? 'Sí (GAMC)' : 'Fuera de terreno'}
                      </span>
                    </td>
                    <td
                      style={{
                        padding: '5px 8px',
                        textAlign: 'right',
                        fontWeight: 700,
                        color: '#22C55E',
                      }}
                    >
                      +{s.personasGanan.toLocaleString('es-BO')} hab.
                    </td>
                    <td style={{ padding: '5px 8px', textAlign: 'right' }}>
                      {s.cobAntes.toFixed(1).replace('.', ',')} % →{' '}
                      <strong style={{ color: 'var(--theme-accent, #38BDF8)' }}>
                        {s.cobDespues.toFixed(1).replace('.', ',')} %
                      </strong>
                    </td>
                    <td style={{ padding: '5px 8px', textAlign: 'center' }}>
                      <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                        <button
                          type="button"
                          onClick={() => handleLoadScenario(s)}
                          className="gamc-btn-secondary"
                          style={{
                            padding: '0.2rem 0.5rem',
                            fontSize: '0.68rem',
                          }}
                        >
                          Cargar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteScenario(s.id)}
                          className="gamc-btn-secondary"
                          style={{
                            padding: '0.2rem 0.45rem',
                            fontSize: '0.68rem',
                            color: '#EF4444',
                          }}
                          title="Eliminar este escenario"
                        >
                          ✕
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* 5. Aviso metodológico único */}
      <footer style={{ marginTop: '0.4rem', textAlign: 'center' }}>
        <p
          style={{
            margin: 0,
            fontSize: '0.78rem',
            color: 'var(--theme-text-muted)',
            fontStyle: 'italic',
          }}
        >
          El simulador mide cercanía. No considera costos, capacidad del centro ni dónde prefiere atenderse la gente.
        </p>
      </footer>
    </div>
  )
}
