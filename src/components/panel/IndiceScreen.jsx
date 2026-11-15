import { useState, useEffect, useMemo } from 'react'
import {
  HelpCircle,
  RotateCcw,
  SlidersHorizontal,
  TrendingUp,
  MapPin,
  CheckSquare,
  Square,
  Activity,
  Layers,
  Thermometer,
  TreePine,
  ArrowUpRight,
  Sparkles,
  Hospital,
  GraduationCap,
  Bus,
  Filter,
} from 'lucide-react'
import GamcMap from './GamcMap'
import PopulationSourceSelector from './PopulationSourceSelector'
import { getIneFactor } from './populationUtils'
import { COCHABAMBA_ZONES } from '../../data/internalPanelData'
import './IndiceScreen.css'

// Definiciones completas con íconos temáticos para cada uno de los 7 componentes
const COMPONENT_DEFINITIONS = {
  'Calor del suelo': {
    label: 'Calor superficial diurno',
    unit: '°C',
    dimension: 'ambiental',
    altoEsMejor: false,
    icon: Thermometer,
    format: (v) => `${Number(v).toFixed(2).replace('.', ',')} °C`,
    help: 'Temperatura superficial diurna promedio (LST). Menor calor da mayor puntaje.',
  },
  'Vegetación': {
    label: 'Cobertura y vigor vegetal',
    unit: 'NDVI',
    dimension: 'ambiental',
    altoEsMejor: true,
    icon: TreePine,
    format: (v) => `${Number(v).toFixed(2).replace('.', ',')} NDVI`,
    help: 'Índice de verdor vegetal (NDVI). Mayor presencia de vegetación da mayor puntaje.',
  },
  'Tendencia de vegetación': {
    label: 'Tendencia vegetal 2001–2025',
    unit: '/año',
    dimension: 'ambiental',
    altoEsMejor: true,
    icon: ArrowUpRight,
    format: (v) => (v === 0 ? 'Sin cambio sign.' : `${Number(v).toFixed(4).replace('.', ',')} / año`),
    help: 'Evolución de la vegetación en 25 años (pendiente de Sen). Distritos que ganan verdor obtienen mayor puntaje.',
  },
  'Área verde por habitante': {
    label: 'Áreas verdes por persona',
    unit: 'm²/hab',
    dimension: 'ambiental',
    altoEsMejor: true,
    icon: Sparkles,
    format: (v) => `${Number(v).toFixed(1).replace('.', ',')} m²/hab`,
    help: 'Metros cuadrados de plazas y parques por vecino. La OMS recomienda al menos 9 m² por habitante.',
  },
  'Habitantes por centro de salud de 1er nivel': {
    label: 'Habitantes por centro de salud (1er nivel)',
    unit: 'hab./centro',
    dimension: 'servicios',
    altoEsMejor: false,
    icon: Hospital,
    format: (v) => `${Math.round(Number(v)).toLocaleString('es-BO')} hab./centro`,
    help: 'Población dividida entre los centros de atención primaria. Menor saturación da mayor puntaje.',
  },
  'Habitantes por unidad educativa': {
    label: 'Habitantes por unidad educativa',
    unit: 'hab./colegio',
    dimension: 'servicios',
    altoEsMejor: false,
    icon: GraduationCap,
    format: (v) => `${Math.round(Number(v)).toLocaleString('es-BO')} hab./colegio`,
    help: 'Población dividida entre los colegios del distrito. Menor concentración da mayor puntaje.',
  },
  'Población cerca del transporte': {
    label: 'Población cerca del transporte',
    unit: '%',
    dimension: 'servicios',
    altoEsMejor: true,
    icon: Bus,
    format: (v) => `${Number(v).toFixed(1).replace('.', ',')} %`,
    help: 'Porcentaje de población que vive a menos de 300 metros de una ruta de transporte público.',
  },
}

// Colores vibrantes de alto contraste y legibilidad
function getSemaphoreColor(val) {
  if (val >= 67) return '#10B981' // Verde esmeralda vibrante
  if (val >= 34) return '#F59E0B' // Ámbar intenso
  return '#EF4444' // Rojo coral
}

function getSemaphoreText(val) {
  if (val >= 67) return 'Óptimo (Verde)'
  if (val >= 34) return 'Alerta (Amarillo)'
  return 'Crítico (Rojo)'
}

function getSemaforoCategory(val) {
  if (val >= 67) return 'verde'
  if (val >= 34) return 'amarillo'
  return 'rojo'
}

export default function IndiceScreen({
  selectedZoneId,
  onSelectZone,
}) {
  const [indiceData, setIndiceData] = useState(null)
  const [distritosGeoJson, setDistritosGeoJson] = useState(null)
  const [basePoblacion, setBasePoblacion] = useState('ghsl') // 'ghsl' | 'ine'
  const [loading, setLoading] = useState(true)
  const [activeTooltip, setActiveTooltip] = useState(null)

  // Filtros rápidos del mapa (Pills interactivos)
  const [filtroDimension, setFiltroDimension] = useState('general') // 'general' | 'ambiente' | 'servicios'
  const [filtroSemaforo, setFiltroSemaforo] = useState('todos') // 'todos' | 'rojo' | 'amarillo' | 'verde'

  // Factor de ajuste al Censo INE 2024
  const ineFactor = useMemo(() => getIneFactor(indiceData), [indiceData])
  const pobFactor = basePoblacion === 'ine' ? ineFactor : 1

  // Estados interactivos para "Ajusta los pesos"
  const [pesoAmbiente, setPesoAmbiente] = useState(50) // 0 a 100%
  const [activeComponents, setActiveComponents] = useState(() => ({
    'Calor del suelo': true,
    'Vegetación': true,
    'Tendencia de vegetación': true,
    'Área verde por habitante': true,
    'Habitantes por centro de salud de 1er nivel': true,
    'Habitantes por unidad educativa': true,
    'Población cerca del transporte': true,
  }))

  // Carga de datos reales
  useEffect(() => {
    let isMounted = true

    Promise.all([
      fetch('/data/indice_distritos.json').then((r) => (r.ok ? r.json() : null)),
      fetch('/data/distritos_indicadores_ambientales_2024.geojson').then((r) =>
        r.ok ? r.json() : null
      ),
    ])
      .then(([idxData, geoData]) => {
        if (!isMounted) return
        if (idxData) setIndiceData(idxData)
        if (geoData) setDistritosGeoJson(geoData)
        setLoading(false)
      })
      .catch((err) => {
        console.error('Error cargando datos de IndiceScreen:', err)
        if (isMounted) setLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [])

  // Distrito activo
  const activeZone =
    COCHABAMBA_ZONES.find((z) => z.id === selectedZoneId) || COCHABAMBA_ZONES[0]
  const distNum = parseInt(
    String(activeZone.number || activeZone.id.replace('distrito-', '')),
    10
  )

  const activeDistrito = useMemo(() => {
    if (!indiceData?.distritos) return null
    return (
      indiceData.distritos.find((d) => parseInt(String(d.id), 10) === distNum) ||
      indiceData.distritos[0]
    )
  }, [indiceData, distNum])

  // Promedios históricos municipales anuales (2001–2025)
  const promedioHistoricoMunicipal = useMemo(() => {
    if (!indiceData?.distritos || indiceData.distritos.length === 0) return []
    const dists = indiceData.distritos
    const anios = dists[0]?.historico?.map((h) => h.anio) || []

    return anios.map((anio) => {
      let suma = 0
      let conteo = 0
      dists.forEach((d) => {
        const item = d.historico?.find((h) => h.anio === anio)
        if (item) {
          suma += item.indice_ambiental
          conteo++
        }
      })
      return {
        anio,
        promedio: conteo > 0 ? Number((suma / conteo).toFixed(1)) : 0,
      }
    })
  }, [indiceData])

  // Recálculo interactivo de ponderación y reordenamiento de ranking
  const distritosRecalculados = useMemo(() => {
    if (!indiceData?.distritos) return []

    const pAmb = pesoAmbiente / 100
    const pServ = (100 - pesoAmbiente) / 100

    const list = indiceData.distritos.map((d) => {
      // 1. Dimensión ambiental con componentes activos
      const ambKeys = [
        'Calor del suelo',
        'Vegetación',
        'Tendencia de vegetación',
        'Área verde por habitante',
      ].filter((k) => activeComponents[k])

      let dimAmbCalc = 0
      if (ambKeys.length > 0) {
        const sumAmb = ambKeys.reduce(
          (acc, k) => acc + (d.componentes[k]?.puntaje || 0),
          0
        )
        dimAmbCalc = sumAmb / ambKeys.length
      }

      // 2. Dimensión servicios con componentes activos
      const servKeys = [
        'Habitantes por centro de salud de 1er nivel',
        'Habitantes por unidad educativa',
        'Población cerca del transporte',
      ].filter((k) => activeComponents[k])

      let dimServCalc = 0
      if (servKeys.length > 0) {
        const sumServ = servKeys.reduce(
          (acc, k) => acc + (d.componentes[k]?.puntaje || 0),
          0
        )
        dimServCalc = sumServ / servKeys.length
      }

      // 3. Índice ponderado
      let nuevoIndice = 0
      if (ambKeys.length > 0 && servKeys.length > 0) {
        if (pAmb + pServ > 0) {
          nuevoIndice = (pAmb * dimAmbCalc + pServ * dimServCalc) / (pAmb + pServ)
        }
      } else if (ambKeys.length > 0) {
        nuevoIndice = dimAmbCalc
      } else if (servKeys.length > 0) {
        nuevoIndice = dimServCalc
      }

      const nuevoIndiceRound = Math.round(nuevoIndice)
      const semaforoOriginal = getSemaforoCategory(d.indice)
      const semaforoNuevo = getSemaforoCategory(nuevoIndiceRound)
      const cambioSemaforo = semaforoOriginal !== semaforoNuevo

      return {
        id: d.id,
        nombre: d.nombre,
        indiceOriginal: d.indice,
        rankingOriginal: d.ranking,
        nuevoIndice: nuevoIndiceRound,
        nuevoIndiceFloat: nuevoIndice,
        dimAmbCalc: Number(dimAmbCalc.toFixed(1)),
        dimServCalc: Number(dimServCalc.toFixed(1)),
        semaforo: semaforoNuevo,
        semaforoOriginal,
        cambioSemaforo,
      }
    })

    // Ordenar de mayor a menor nuevoIndice
    list.sort((a, b) => b.nuevoIndiceFloat - a.nuevoIndiceFloat)

    // Asignar nueva posición y diferencia
    return list.map((item, idx) => {
      const nuevoRanking = idx + 1
      const deltaRanking = item.rankingOriginal - nuevoRanking // positivo = subió
      return {
        ...item,
        nuevoRanking,
        deltaRanking,
      }
    })
  }, [indiceData, pesoAmbiente, activeComponents])

  // Cantidad de distritos que cambian de color en el semáforo con los pesos actuales
  const distritosQueCambian = useMemo(() => {
    return distritosRecalculados.filter((d) => d.cambioSemaforo).length
  }, [distritosRecalculados])

  // GeoJSON con polígonos coloreados y filtros aplicados (dimensión + semáforo)
  const distritosGeoJsonStyled = useMemo(() => {
    if (!distritosGeoJson?.features || !indiceData?.distritos) return null

    // Diccionario de índices recalculados por id
    const recMap = {}
    distritosRecalculados.forEach((item) => {
      recMap[String(item.id)] = item
    })

    return {
      ...distritosGeoJson,
      features: distritosGeoJson.features.map((f) => {
        const cod = String(f.properties?.codigo_distrito || '')
        const item = recMap[cod] || null
        const isSelected = parseInt(cod, 10) === distNum

        // Puntaje a visualizar según dimensión seleccionada
        let displayScore = item ? item.nuevoIndice : 50
        if (filtroDimension === 'ambiente' && item) {
          displayScore = Math.round(item.dimAmbCalc)
        } else if (filtroDimension === 'servicios' && item) {
          displayScore = Math.round(item.dimServCalc)
        }

        const color = getSemaphoreColor(displayScore)
        const semCategory = getSemaforoCategory(displayScore)

        // Filtro de semáforo (rojo/amarillo/verde/todos)
        const matchesFilter =
          filtroSemaforo === 'todos' || filtroSemaforo === semCategory

        // Opacidad viva en Modo Claro (0.75) y resaltado fuerte si coincide con filtro
        const fillOpacity = matchesFilter
          ? isSelected
            ? 0.88
            : 0.75
          : 0.15

        // Borde oscuro nítido (#1E293B, 2px) y grueso (#0284C7, 4px) para el seleccionado
        const borderColor = isSelected ? '#0284C7' : matchesFilter ? '#1E293B' : '#94A3B8'
        const borderWidth = isSelected ? 4 : matchesFilter ? 2 : 1

        // Tooltip enriquecido flotante con toda la telemetría solicitada
        const customTooltipHtml = `
          <div style="font-family: inherit; font-size: 12px; min-width: 190px; line-height: 1.45;">
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #E2E8F0; padding-bottom: 4px; margin-bottom: 6px;">
              <strong style="font-size: 13px; color: #0F172A;">${f.properties?.nombre || 'Distrito ' + cod}</strong>
              <span style="font-size: 10px; font-weight: 700; padding: 1px 6px; border-radius: 4px; background: ${color}20; color: ${color}; border: 1px solid ${color};">
                ${getSemaphoreText(displayScore)}
              </span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
              <span style="color: #64748B;">Puntaje Total:</span>
              <strong style="color: ${color}; font-size: 13px;">${item ? item.nuevoIndice : '--'}/100</strong>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 3px; font-size: 11px;">
              <span style="color: #64748B;">Ambiente (50%):</span>
              <strong style="color: #10B981;">${item ? item.dimAmbCalc : '--'} pts</strong>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 11px;">
              <span style="color: #64748B;">Servicios (50%):</span>
              <strong style="color: #F59E0B;">${item ? item.dimServCalc : '--'} pts</strong>
            </div>
          </div>
        `

        return {
          ...f,
          properties: {
            ...f.properties,
            selected: isSelected,
            color: borderColor,
            borderColor,
            borderWidth,
            fillColor: color,
            fillOpacity,
            labelPermanent: `D${cod}: ${displayScore}`,
            customTooltipHtml,
            nombre: `${f.properties?.nombre || 'Distrito ' + cod} · Índice: ${displayScore} pts`,
          },
        }
      }),
    }
  }, [distritosGeoJson, indiceData, distritosRecalculados, distNum, filtroDimension, filtroSemaforo])

  // Componentes del distrito ordenados de PEOR A MEJOR puntaje (para auditar rápido qué falla)
  const componentesOrdenados = useMemo(() => {
    if (!activeDistrito?.componentes) return []

    const list = Object.entries(COMPONENT_DEFINITIONS).map(([key, def]) => {
      const comp = activeDistrito.componentes[key] || { valor: 0, puntaje: 0 }
      let compValor = comp.valor
      if (
        key === 'Habitantes por centro de salud de 1er nivel' ||
        key === 'Habitantes por unidad educativa'
      ) {
        compValor = comp.valor * pobFactor
      }
      const puntajeRound = Math.round(comp.puntaje)
      return {
        key,
        def,
        valor: compValor,
        puntaje: comp.puntaje,
        puntajeRound,
        barColor: getSemaphoreColor(puntajeRound),
      }
    })

    // Orden ascendente: peor puntaje primero
    list.sort((a, b) => a.puntajeRound - b.puntajeRound)
    return list
  }, [activeDistrito, pobFactor])

  const toggleComponent = (key) => {
    setActiveComponents((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  const resetWeights = () => {
    setPesoAmbiente(50)
    setActiveComponents({
      'Calor del suelo': true,
      'Vegetación': true,
      'Tendencia de vegetación': true,
      'Área verde por habitante': true,
      'Habitantes por centro de salud de 1er nivel': true,
      'Habitantes por unidad educativa': true,
      'Población cerca del transporte': true,
    })
  }

  if (loading && !indiceData) {
    return (
      <div className="neo-screen" style={{ padding: '2rem', textAlign: 'center' }}>
        <p style={{ color: 'var(--theme-text-muted)' }}>Datos en proceso...</p>
      </div>
    )
  }

  if (!activeDistrito) {
    return (
      <div className="neo-screen" style={{ padding: '2rem', textAlign: 'center' }}>
        <p style={{ color: 'var(--theme-text-muted)' }}>Datos en proceso</p>
      </div>
    )
  }

  const semColor = getSemaphoreColor(activeDistrito.indice)
  const rankingItem = distritosRecalculados.find(
    (d) => parseInt(String(d.id), 10) === distNum
  )

  return (
    <div className="indice-screen-container neo-screen">
      {/* 1. Header de Sección con Selector de Base Poblacional */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.65rem',
          background: 'var(--theme-card-bg, #FFFFFF)',
          border: '1px solid var(--theme-border, #E2E8F0)',
          borderRadius: '10px',
          padding: '0.65rem 1rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
          <h2
            style={{
              margin: 0,
              fontSize: '1.05rem',
              fontWeight: 700,
              color: 'var(--theme-text-primary, #0F172A)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <Activity size={20} strokeWidth={2.2} color="var(--theme-accent, #0284C7)" />
            6 · Índice Socio-Ambiental Distrital
          </h2>
          <p
            style={{
              margin: 0,
              fontSize: '0.82rem',
              color: 'var(--theme-text-muted, #475569)',
              lineHeight: 1.4,
            }}
          >
            Evaluación diagnóstica ponderada de 1 a 100 puntos: balance ambiental satelital (50%) y cobertura de servicios urbanos GAMC (50%).
          </p>
        </div>

        {/* Selector claro de base poblacional */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span
            style={{
              fontSize: '0.74rem',
              fontWeight: 600,
              color: 'var(--theme-text-muted, #475569)',
            }}
          >
            Base Poblacional:
          </span>
          <PopulationSourceSelector
            value={basePoblacion}
            onChange={setBasePoblacion}
          />
        </div>
      </div>

      {/* 2. Tarjetas KPI Principales (4) */}
      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '0.75rem',
        }}
      >
        {/* Tarjeta 1: Índice del distrito con semáforo */}
        <div
          className="hud-kpi-card"
          style={{
            '--kpi-accent': semColor,
            background: 'var(--theme-card-bg, #FFFFFF)',
            border: '1px solid var(--theme-border, #E2E8F0)',
            borderRadius: '10px',
            padding: '0.85rem 1rem',
          }}
        >
          <div className="hud-kpi-top" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="hud-kpi-label" style={{ fontSize: '0.73rem', fontWeight: 700, letterSpacing: '0.04em', color: 'var(--theme-text-muted, #475569)' }}>
              ÍNDICE SOCIO-AMBIENTAL
            </span>
            <span
              className="hud-kpi-delta"
              style={{
                color: semColor,
                borderColor: `${semColor}55`,
                background: `${semColor}15`,
                fontWeight: 700,
                fontSize: '0.7rem',
                padding: '2px 8px',
                borderRadius: '6px',
              }}
            >
              {getSemaphoreText(activeDistrito.indice)}
            </span>
          </div>
          <div className="hud-kpi-val-row" style={{ display: 'flex', alignItems: 'baseline', gap: '0.35rem', marginTop: '0.35rem' }}>
            <strong className="hud-kpi-value" style={{ color: semColor, fontSize: '1.9rem', fontWeight: 800 }}>
              {activeDistrito.indice}
            </strong>
            <span style={{ fontSize: '0.9rem', color: 'var(--theme-text-muted, #64748B)', fontWeight: 600 }}>
              / 100
            </span>
          </div>
          <span
            className="hud-kpi-sub"
            style={{
              fontSize: '0.76rem',
              color: 'var(--theme-text-muted, #64748B)',
              marginTop: '0.2rem',
              display: 'block',
              fontWeight: 500,
            }}
          >
            {activeDistrito.nombre}
          </span>
        </div>

        {/* Tarjeta 2: Posición en el ranking */}
        <div
          className="hud-kpi-card"
          style={{
            '--kpi-accent': 'var(--theme-accent, #0284C7)',
            background: 'var(--theme-card-bg, #FFFFFF)',
            border: '1px solid var(--theme-border, #E2E8F0)',
            borderRadius: '10px',
            padding: '0.85rem 1rem',
          }}
        >
          <div className="hud-kpi-top" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="hud-kpi-label" style={{ fontSize: '0.73rem', fontWeight: 700, letterSpacing: '0.04em', color: 'var(--theme-text-muted, #475569)' }}>
              POSICIÓN EN EL RANKING
            </span>
            <span
              className="hud-kpi-delta"
              style={{
                color: 'var(--theme-accent, #0284C7)',
                borderColor: 'var(--theme-border, #E2E8F0)',
                background: 'rgba(2, 132, 199, 0.08)',
                fontWeight: 600,
                fontSize: '0.7rem',
                padding: '2px 8px',
                borderRadius: '6px',
              }}
            >
              Oficial GAMC
            </span>
          </div>
          <div className="hud-kpi-val-row" style={{ display: 'flex', alignItems: 'baseline', gap: '0.35rem', marginTop: '0.35rem' }}>
            <strong className="hud-kpi-value" style={{ color: 'var(--theme-text-primary, #0F172A)', fontSize: '1.9rem', fontWeight: 800 }}>
              {activeDistrito.ranking}{' '}
              <span style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--theme-text-muted, #64748B)' }}>
                de 15
              </span>
            </strong>
          </div>
          <span
            className="hud-kpi-sub"
            style={{
              fontSize: '0.76rem',
              color: 'var(--theme-text-muted, #64748B)',
              marginTop: '0.2rem',
              display: 'block',
            }}
          >
            Promedio municipal: 51 pts
          </span>
        </div>

        {/* Tarjeta 3: Dimensión ambiental */}
        <div
          className="hud-kpi-card"
          style={{
            '--kpi-accent': '#10B981',
            background: 'var(--theme-card-bg, #FFFFFF)',
            border: '1px solid var(--theme-border, #E2E8F0)',
            borderRadius: '10px',
            padding: '0.85rem 1rem',
          }}
        >
          <div className="hud-kpi-top" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="hud-kpi-label" style={{ fontSize: '0.73rem', fontWeight: 700, letterSpacing: '0.04em', color: 'var(--theme-text-muted, #475569)' }}>
              DIMENSIÓN AMBIENTAL
            </span>
            <span
              className="hud-kpi-delta"
              style={{
                color: '#10B981',
                borderColor: '#10B98155',
                background: '#10B98115',
                fontWeight: 600,
                fontSize: '0.7rem',
                padding: '2px 8px',
                borderRadius: '6px',
              }}
            >
              4 componentes
            </span>
          </div>
          <div className="hud-kpi-val-row" style={{ display: 'flex', alignItems: 'baseline', gap: '0.35rem', marginTop: '0.35rem' }}>
            <strong className="hud-kpi-value" style={{ color: '#10B981', fontSize: '1.9rem', fontWeight: 800 }}>
              {activeDistrito.dimension_ambiental.toFixed(1).replace('.', ',')}
            </strong>
            <span style={{ fontSize: '0.9rem', color: 'var(--theme-text-muted, #64748B)', fontWeight: 600 }}>
              pts
            </span>
          </div>
          <span
            className="hud-kpi-sub"
            style={{
              fontSize: '0.76rem',
              color: 'var(--theme-text-muted, #64748B)',
              marginTop: '0.2rem',
              display: 'block',
            }}
          >
            Calor, verdor, tendencia y áreas verdes
          </span>
        </div>

        {/* Tarjeta 4: Dimensión servicios */}
        <div
          className="hud-kpi-card"
          style={{
            '--kpi-accent': '#F59E0B',
            background: 'var(--theme-card-bg, #FFFFFF)',
            border: '1px solid var(--theme-border, #E2E8F0)',
            borderRadius: '10px',
            padding: '0.85rem 1rem',
          }}
        >
          <div className="hud-kpi-top" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="hud-kpi-label" style={{ fontSize: '0.73rem', fontWeight: 700, letterSpacing: '0.04em', color: 'var(--theme-text-muted, #475569)' }}>
              DIMENSIÓN SERVICIOS
            </span>
            <span
              className="hud-kpi-delta"
              style={{
                color: '#F59E0B',
                borderColor: '#F59E0B55',
                background: '#F59E0B15',
                fontWeight: 600,
                fontSize: '0.7rem',
                padding: '2px 8px',
                borderRadius: '6px',
              }}
            >
              3 componentes
            </span>
          </div>
          <div className="hud-kpi-val-row" style={{ display: 'flex', alignItems: 'baseline', gap: '0.35rem', marginTop: '0.35rem' }}>
            <strong className="hud-kpi-value" style={{ color: '#F59E0B', fontSize: '1.9rem', fontWeight: 800 }}>
              {activeDistrito.dimension_servicios.toFixed(1).replace('.', ',')}
            </strong>
            <span style={{ fontSize: '0.9rem', color: 'var(--theme-text-muted, #64748B)', fontWeight: 600 }}>
              pts
            </span>
          </div>
          <span
            className="hud-kpi-sub"
            style={{
              fontSize: '0.76rem',
              color: 'var(--theme-text-muted, #64748B)',
              marginTop: '0.2rem',
              display: 'block',
            }}
          >
            Salud 1er nivel, colegios y transporte
          </span>
        </div>
      </section>

      {/* 3. Centro: Mapa de Alta Claridad a la izquierda + Desglose de 7 componentes a la derecha */}
      <section
        style={{
          display: 'grid',
          gridTemplateColumns: '1.25fr 1fr',
          gap: '0.85rem',
          alignItems: 'start',
        }}
      >
        {/* Mapa con CartoDB Positron / Dark Matter y Filtros tipo Pills */}
        <div
          className="hud-card"
          style={{
            padding: '0.85rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.65rem',
            background: 'var(--theme-card-bg, #FFFFFF)',
            border: '1px solid var(--theme-border, #E2E8F0)',
            borderRadius: '10px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}
        >
          {/* Fila 1 de Filtros: Filtro de Dimensión + Leyenda de Semáforo */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '0.5rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <MapPin size={18} strokeWidth={2.2} color="var(--theme-accent, #0284C7)" />
              <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: 'var(--theme-text-primary, #0F172A)' }}>
                Mapa de Distritos · Semáforo Geoespacial
              </h3>
            </div>

            {/* Pills de dimensión */}
            <div className="indice-pills-row">
              <button
                type="button"
                className={`indice-pill-btn ${filtroDimension === 'general' ? 'is-active' : ''}`}
                onClick={() => setFiltroDimension('general')}
              >
                Vista General (1–100)
              </button>
              <button
                type="button"
                className={`indice-pill-btn ${filtroDimension === 'ambiente' ? 'is-active' : ''}`}
                onClick={() => setFiltroDimension('ambiente')}
              >
                Solo Ambiente (50%)
              </button>
              <button
                type="button"
                className={`indice-pill-btn ${filtroDimension === 'servicios' ? 'is-active' : ''}`}
                onClick={() => setFiltroDimension('servicios')}
              >
                Solo Servicios (50%)
              </button>
            </div>
          </div>

          {/* Fila 2 de Filtros: Filtro por Estado de Semáforo */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'var(--theme-card-bg-subtle, #F8FAFC)',
              padding: '0.35rem 0.65rem',
              borderRadius: '8px',
              border: '1px solid var(--theme-border, #E2E8F0)',
              flexWrap: 'wrap',
              gap: '0.4rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.74rem', color: 'var(--theme-text-muted, #475569)', fontWeight: 600 }}>
              <Filter size={13} />
              <span>Filtrar semáforo:</span>
            </div>

            <div className="indice-pills-row">
              <button
                type="button"
                className={`indice-pill-btn ${filtroSemaforo === 'todos' ? 'is-active' : ''}`}
                onClick={() => setFiltroSemaforo('todos')}
              >
                Todos (15)
              </button>
              <button
                type="button"
                className={`indice-pill-btn pill-rojo ${filtroSemaforo === 'rojo' ? 'is-active' : ''}`}
                onClick={() => setFiltroSemaforo('rojo')}
              >
                Críticos en Rojo (1–33)
              </button>
              <button
                type="button"
                className={`indice-pill-btn pill-amarillo ${filtroSemaforo === 'amarillo' ? 'is-active' : ''}`}
                onClick={() => setFiltroSemaforo('amarillo')}
              >
                Alerta Amarilla (34–66)
              </button>
              <button
                type="button"
                className={`indice-pill-btn pill-verde ${filtroSemaforo === 'verde' ? 'is-active' : ''}`}
                onClick={() => setFiltroSemaforo('verde')}
              >
                Óptimos en Verde (67–100)
              </button>
            </div>
          </div>

          {/* Contenedor del Mapa Leaflet (CartoDB Positron / Dark Matter limpio sin marcas) */}
          <GamcMap
            geojson={distritosGeoJsonStyled}
            onClickDistrito={(feat) => {
              const dNum = feat.properties?.codigo_distrito
              if (dNum && onSelectZone) {
                onSelectZone(`distrito-${dNum}`)
              }
            }}
            capasWms={[]}
            height="440px"
          />

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '0.73rem',
              color: 'var(--theme-text-muted, #64748B)',
            }}
          >
            <span>
              ℹ️ Haz clic sobre cualquier distrito para seleccionarlo y auditar sus 7 componentes.
            </span>
            <span>
              Distrito seleccionado: <strong style={{ color: 'var(--theme-text-primary, #0F172A)' }}>{activeDistrito.nombre}</strong>
            </span>
          </div>
        </div>

        {/* Panel Derecho: 7 Componentes Ordenados de PEOR a MEJOR puntaje */}
        <div
          className="hud-card"
          style={{
            padding: '0.85rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.65rem',
            background: 'var(--theme-card-bg, #FFFFFF)',
            border: '1px solid var(--theme-border, #E2E8F0)',
            borderRadius: '10px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '1px solid var(--theme-border, #E2E8F0)',
              paddingBottom: '0.5rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <Layers size={18} strokeWidth={2.2} color="var(--theme-accent, #0284C7)" />
              <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: 'var(--theme-text-primary, #0F172A)' }}>
                7 Componentes · {activeDistrito.nombre}
              </h3>
            </div>
            <span
              style={{
                fontSize: '0.7rem',
                fontWeight: 600,
                color: 'var(--theme-text-muted, #475569)',
                background: 'var(--theme-card-bg-subtle, #F8FAFC)',
                padding: '2px 8px',
                borderRadius: '6px',
                border: '1px solid var(--theme-border, #E2E8F0)',
              }}
            >
              Orden: Peor → Mejor
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              maxHeight: '430px',
              overflowY: 'auto',
              paddingRight: '2px',
            }}
          >
            {componentesOrdenados.map(({ key, def, valor, puntajeRound, barColor }) => {
              const CompIcon = def.icon || Activity
              return (
                <div
                  key={key}
                  className="indice-comp-row"
                  style={{
                    background: 'var(--theme-card-bg-subtle, #F8FAFC)',
                    border: '1px solid var(--theme-border, #E2E8F0)',
                    borderRadius: '8px',
                    padding: '0.55rem 0.75rem',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '0.3rem',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                      }}
                    >
                      <div
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: '5px',
                          display: 'grid',
                          placeItems: 'center',
                          background: `${barColor}18`,
                          color: barColor,
                          flexShrink: 0,
                        }}
                      >
                        <CompIcon size={13} strokeWidth={2.2} />
                      </div>
                      <span
                        style={{
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          color: 'var(--theme-text-primary, #0F172A)',
                        }}
                      >
                        {def.label}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setActiveTooltip(activeTooltip === key ? null : key)
                        }
                        title={def.help}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          padding: 0,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                        }}
                      >
                        <HelpCircle
                          size={13}
                          color={
                            activeTooltip === key
                              ? 'var(--theme-accent, #0284C7)'
                              : '#94A3B8'
                          }
                        />
                      </button>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'baseline',
                        gap: '0.45rem',
                      }}
                    >
                      <span
                        style={{
                          fontSize: '0.75rem',
                          color: 'var(--theme-text-muted, #475569)',
                          fontWeight: 500,
                        }}
                      >
                        {def.format(valor)}
                      </span>
                      <strong
                        style={{
                          fontSize: '0.84rem',
                          color: barColor,
                          fontWeight: 800,
                        }}
                      >
                        {puntajeRound}
                        <span
                          style={{
                            fontSize: '0.68rem',
                            color: 'var(--theme-text-muted, #64748B)',
                            fontWeight: 500,
                          }}
                        >
                          /100
                        </span>
                      </strong>
                    </div>
                  </div>

                  {/* Barra horizontal con alta nitidez en modo claro/oscuro */}
                  <div
                    style={{
                      width: '100%',
                      height: '7px',
                      background: 'var(--theme-border, #E2E8F0)',
                      borderRadius: '4px',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        width: `${Math.max(3, Math.min(100, puntajeRound))}%`,
                        height: '100%',
                        background: barColor,
                        borderRadius: '4px',
                        transition: 'width 0.3s ease',
                      }}
                    />
                  </div>

                  {/* Explicación desplegable cuando se hace clic en "?" */}
                  {activeTooltip === key && (
                    <div
                      style={{
                        marginTop: '0.4rem',
                        padding: '0.4rem 0.55rem',
                        borderRadius: '6px',
                        background: 'var(--theme-card-bg, #FFFFFF)',
                        border: '1px solid var(--theme-border, #CBD5E1)',
                        fontSize: '0.72rem',
                        color: 'var(--theme-text-muted, #475569)',
                        lineHeight: 1.4,
                      }}
                    >
                      {def.help}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* 4. Abajo: (1) Gráfico Histórico 2001–2025 · (2) "Ajusta los pesos" con Presets y Badge Dinámico */}
      <section
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1.15fr',
          gap: '0.85rem',
          alignItems: 'start',
        }}
      >
        {/* Panel 1: Gráfico histórico ambiental 2001–2025 */}
        <div
          className="hud-card"
          style={{
            padding: '0.85rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.6rem',
            background: 'var(--theme-card-bg, #FFFFFF)',
            border: '1px solid var(--theme-border, #E2E8F0)',
            borderRadius: '10px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
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
              <TrendingUp size={18} strokeWidth={2.2} color="var(--theme-accent, #0284C7)" />
              <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: 'var(--theme-text-primary, #0F172A)' }}>
                Índice Ambiental Histórico (2001–2025)
              </h3>
            </div>
            <span
              style={{
                fontSize: '0.7rem',
                color: 'var(--theme-text-muted, #475569)',
                fontWeight: 600,
              }}
            >
              Serie anual NASA MODIS
            </span>
          </div>

          {/* Gráfico SVG de líneas */}
          <div style={{ position: 'relative', width: '100%', height: '220px' }}>
            <svg
              viewBox="0 0 500 220"
              style={{ width: '100%', height: '100%', overflow: 'visible' }}
            >
              {/* Líneas guía horizontales: 20, 40, 60, 80 */}
              {[20, 40, 60, 80].map((val) => {
                const y = 200 - (val / 100) * 180
                return (
                  <g key={val}>
                    <line
                      x1="40"
                      y1={y}
                      x2="480"
                      y2={y}
                      stroke="var(--theme-border, #E2E8F0)"
                      strokeDasharray="3,3"
                      strokeWidth="1"
                    />
                    <text
                      x="32"
                      y={y + 3}
                      fill="var(--theme-text-muted, #94A3B8)"
                      fontSize="9"
                      textAnchor="end"
                    >
                      {val}
                    </text>
                  </g>
                )
              })}

              {/* Eje X: años clave */}
              {[2001, 2005, 2010, 2015, 2020, 2025].map((anio) => {
                const x = 40 + ((anio - 2001) / 24) * 440
                return (
                  <text
                    key={anio}
                    x={x}
                    y="215"
                    fill="var(--theme-text-muted, #94A3B8)"
                    fontSize="9"
                    textAnchor="middle"
                  >
                    {anio}
                  </text>
                )
              })}

              {/* Línea del promedio municipal en gris */}
              {promedioHistoricoMunicipal.length > 0 && (() => {
                const points = promedioHistoricoMunicipal
                  .map((p) => {
                    const x = 40 + ((p.anio - 2001) / 24) * 440
                    const y = 200 - (p.promedio / 100) * 180
                    return `${x},${y}`
                  })
                  .join(' ')
                return (
                  <polyline
                    fill="none"
                    stroke="#94A3B8"
                    strokeWidth="2"
                    strokeDasharray="4,4"
                    points={points}
                  />
                )
              })()}

              {/* Línea del distrito seleccionado */}
              {activeDistrito.historico && (() => {
                const points = activeDistrito.historico
                  .map((h) => {
                    const x = 40 + ((h.anio - 2001) / 24) * 440
                    const y = 200 - (h.indice_ambiental / 100) * 180
                    return `${x},${y}`
                  })
                  .join(' ')
                return (
                  <>
                    <polyline
                      fill="none"
                      stroke="var(--theme-accent, #0284C7)"
                      strokeWidth="2.5"
                      points={points}
                    />
                    {activeDistrito.historico.map((h) => {
                      const x = 40 + ((h.anio - 2001) / 24) * 440
                      const y = 200 - (h.indice_ambiental / 100) * 180
                      return (
                        <circle
                          key={h.anio}
                          cx={x}
                          cy={y}
                          r="3.5"
                          fill="var(--theme-accent, #0284C7)"
                        >
                          <title>
                            {`Año ${h.anio}: ${h.indice_ambiental} pts (${activeDistrito.nombre})`}
                          </title>
                        </circle>
                      )
                    })}
                  </>
                )
              })()}
            </svg>
          </div>

          {/* Leyenda */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '1.2rem',
              fontSize: '0.74rem',
              borderTop: '1px solid var(--theme-border, #E2E8F0)',
              paddingTop: '0.45rem',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span
                style={{
                  width: 14,
                  height: 3,
                  background: 'var(--theme-accent, #0284C7)',
                  display: 'inline-block',
                }}
              />
              <strong style={{ color: 'var(--theme-text-primary, #0F172A)' }}>{activeDistrito.nombre}</strong> (
              {activeDistrito.historico?.[activeDistrito.historico.length - 1]?.indice_ambiental || 0} pts en 2025)
            </span>
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                color: 'var(--theme-text-muted, #64748B)',
              }}
            >
              <span
                style={{
                  width: 14,
                  height: 2,
                  background: '#94A3B8',
                  display: 'inline-block',
                  borderTop: '1px dashed #94A3B8',
                }}
              />
              Promedio de los 15 distritos (
              {promedioHistoricoMunicipal[promedioHistoricoMunicipal.length - 1]?.promedio || 0} pts en 2025)
            </span>
          </div>
        </div>

        {/* Panel 2: "Ajusta los pesos" con Botones Rápidos y Badge Dinámico */}
        <div
          className="hud-card"
          style={{
            padding: '0.85rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.65rem',
            background: 'var(--theme-card-bg, #FFFFFF)',
            border: '1px solid var(--theme-border, #E2E8F0)',
            borderRadius: '10px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '0.5rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <SlidersHorizontal size={18} strokeWidth={2.2} color="var(--theme-accent, #0284C7)" />
              <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: 'var(--theme-text-primary, #0F172A)' }}>
                Ajusta los pesos de ponderación
              </h3>
            </div>

            {/* Badge dinámico de distritos que cambian de color */}
            {distritosQueCambian > 0 ? (
              <span className="indice-shift-badge">
                ⚠️ {distritosQueCambian} distritos cambian de semáforo
              </span>
            ) : (
              <span
                style={{
                  fontSize: '0.7rem',
                  color: 'var(--theme-text-muted, #64748B)',
                  fontWeight: 600,
                }}
              >
                Semáforo estable (0 cambios)
              </span>
            )}
          </div>

          {/* Botones de configuración rápida (Presets) */}
          <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              className={`indice-preset-btn ${pesoAmbiente === 50 ? 'is-active' : ''}`}
              onClick={() => setPesoAmbiente(50)}
            >
              Equilibrado (50/50)
            </button>
            <button
              type="button"
              className={`indice-preset-btn ${pesoAmbiente === 70 ? 'is-active' : ''}`}
              onClick={() => setPesoAmbiente(70)}
            >
              Prioridad Climática (70/30)
            </button>
            <button
              type="button"
              className={`indice-preset-btn ${pesoAmbiente === 30 ? 'is-active' : ''}`}
              onClick={() => setPesoAmbiente(30)}
            >
              Prioridad Servicios (30/70)
            </button>
            <button
              type="button"
              onClick={resetWeights}
              className="gamc-btn-secondary"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontSize: '0.72rem',
                padding: '0.3rem 0.6rem',
                marginLeft: 'auto',
              }}
              title="Restablecer al balance oficial 50% / 50%"
            >
              <RotateCcw size={12} />
              Resetear
            </button>
          </div>

          {/* Deslizador Ambiente ↔ Servicios */}
          <div
            style={{
              background: 'var(--theme-card-bg-subtle, #F8FAFC)',
              border: '1px solid var(--theme-border, #E2E8F0)',
              borderRadius: '8px',
              padding: '0.6rem 0.75rem',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '0.78rem',
                fontWeight: 700,
                marginBottom: '0.4rem',
              }}
            >
              <span style={{ color: '#10B981' }}>
                Ambiente: {pesoAmbiente}%
              </span>
              <span style={{ color: '#F59E0B' }}>
                Servicios: {100 - pesoAmbiente}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={pesoAmbiente}
              onChange={(e) => setPesoAmbiente(parseInt(e.target.value, 10))}
              style={{
                width: '100%',
                accentColor: 'var(--theme-accent, #0284C7)',
                cursor: 'pointer',
              }}
            />
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '0.68rem',
                color: 'var(--theme-text-muted, #64748B)',
                marginTop: '0.2rem',
              }}
            >
              <span>100% Ambiente</span>
              <span>Balance Oficial (50/50)</span>
              <span>100% Servicios</span>
            </div>
          </div>

          {/* Casillas de selección de componentes individuales */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '0.35rem 0.6rem',
              fontSize: '0.74rem',
            }}
          >
            {Object.keys(COMPONENT_DEFINITIONS).map((key) => {
              const isChecked = activeComponents[key]
              const def = COMPONENT_DEFINITIONS[key]
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => toggleComponent(key)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    background: 'transparent',
                    border: 'none',
                    padding: '2px 0',
                    cursor: 'pointer',
                    color: isChecked
                      ? 'var(--theme-text-primary, #0F172A)'
                      : 'var(--theme-text-muted, #94A3B8)',
                    textAlign: 'left',
                  }}
                >
                  {isChecked ? (
                    <CheckSquare size={14} color="var(--theme-accent, #0284C7)" />
                  ) : (
                    <Square size={14} color="#94A3B8" />
                  )}
                  <span style={{ textDecoration: isChecked ? 'none' : 'line-through' }}>
                    {def.label}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Tabla de Ranking recalculada en tiempo real */}
          <div
            style={{
              maxHeight: '160px',
              overflowY: 'auto',
              border: '1px solid var(--theme-border, #E2E8F0)',
              borderRadius: '6px',
            }}
          >
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '0.74rem',
              }}
            >
              <thead>
                <tr
                  style={{
                    background: 'var(--theme-card-bg-subtle, #F8FAFC)',
                    borderBottom: '1px solid var(--theme-border, #E2E8F0)',
                    color: 'var(--theme-text-muted, #475569)',
                    textAlign: 'left',
                    fontWeight: 700,
                  }}
                >
                  <th style={{ padding: '5px 7px' }}>#</th>
                  <th style={{ padding: '5px 7px' }}>Distrito</th>
                  <th style={{ padding: '5px 7px', textAlign: 'right' }}>Amb.</th>
                  <th style={{ padding: '5px 7px', textAlign: 'right' }}>Serv.</th>
                  <th style={{ padding: '5px 7px', textAlign: 'right' }}>Nota</th>
                  <th style={{ padding: '5px 7px', textAlign: 'center' }}>Var.</th>
                </tr>
              </thead>
              <tbody>
                {distritosRecalculados.map((d) => {
                  const isCurrent = parseInt(String(d.id), 10) === distNum
                  const dotColor = getSemaphoreColor(d.nuevoIndice)

                  return (
                    <tr
                      key={d.id}
                      onClick={() => onSelectZone && onSelectZone(`distrito-${d.id}`)}
                      style={{
                        cursor: 'pointer',
                        borderBottom: '1px solid var(--theme-border, #E2E8F0)',
                        background: isCurrent
                          ? 'rgba(2, 132, 199, 0.1)'
                          : 'transparent',
                        fontWeight: isCurrent ? 700 : 400,
                      }}
                    >
                      <td style={{ padding: '4px 7px' }}>{d.nuevoRanking}</td>
                      <td style={{ padding: '4px 7px' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            background: dotColor,
                            marginRight: 6,
                          }}
                        />
                        {d.nombre}
                      </td>
                      <td style={{ padding: '4px 7px', textAlign: 'right' }}>
                        {d.dimAmbCalc}
                      </td>
                      <td style={{ padding: '4px 7px', textAlign: 'right' }}>
                        {d.dimServCalc}
                      </td>
                      <td
                        style={{
                          padding: '4px 7px',
                          textAlign: 'right',
                          fontWeight: 800,
                          color: dotColor,
                        }}
                      >
                        {d.nuevoIndice}
                      </td>
                      <td
                        style={{
                          padding: '4px 7px',
                          textAlign: 'center',
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          color:
                            d.deltaRanking > 0
                              ? '#10B981'
                              : d.deltaRanking < 0
                              ? '#EF4444'
                              : 'var(--theme-text-muted, #64748B)',
                        }}
                      >
                        {d.deltaRanking > 0
                          ? `▲ +${d.deltaRanking}`
                          : d.deltaRanking < 0
                          ? `▼ ${d.deltaRanking}`
                          : '='}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {rankingItem && (
            <span
              style={{
                fontSize: '0.72rem',
                color: 'var(--theme-text-muted, #64748B)',
                fontStyle: 'italic',
              }}
            >
              Con esta ponderación, {rankingItem.nombre} queda en el puesto {rankingItem.nuevoRanking} de 15 ({rankingItem.nuevoIndice} pts).
            </span>
          )}
        </div>
      </section>

      {/* 5. Aviso metodológico */}
      <footer style={{ marginTop: '0.4rem', textAlign: 'center' }}>
        <p
          style={{
            margin: 0,
            fontSize: '0.78rem',
            color: 'var(--theme-text-muted, #64748B)',
            fontStyle: 'italic',
          }}
        >
          Cada componente normaliza a los 15 distritos entre sí (0 a 100). Fuente: NASA MODIS LST/NDVI (2001–2025) y Cartografía GAMC 2024.
        </p>
      </footer>
    </div>
  )
}
