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
} from 'lucide-react'
import GamcMap from './GamcMap'
import PopulationSourceSelector from './PopulationSourceSelector'
import { getIneFactor } from './populationUtils'
import { COCHABAMBA_ZONES } from '../../data/internalPanelData'
import './IndiceScreen.css'

// Definiciones explicativas sencillas para cada componente
const COMPONENT_DEFINITIONS = {
  'Calor del suelo': {
    label: 'Calor superficial diurno',
    unit: '°C',
    dimension: 'ambiental',
    altoEsMejor: false,
    format: (v) => `${Number(v).toFixed(2).replace('.', ',')} °C`,
    help: 'Temperatura superficial diurna promedio (LST). Menor calor da mayor puntaje.',
  },
  'Vegetación': {
    label: 'Cobertura y vigor vegetal',
    unit: 'NDVI',
    dimension: 'ambiental',
    altoEsMejor: true,
    format: (v) => `${Number(v).toFixed(2).replace('.', ',')} NDVI`,
    help: 'Índice de verdor vegetal (NDVI). Mayor presencia de vegetación da mayor puntaje.',
  },
  'Tendencia de vegetación': {
    label: 'Tendencia vegetal 2001–2025',
    unit: '/año',
    dimension: 'ambiental',
    altoEsMejor: true,
    format: (v) => (v === 0 ? 'Sin cambio sign.' : `${Number(v).toFixed(4).replace('.', ',')} / año`),
    help: 'Evolución de la vegetación en 25 años (pendiente de Sen). Distritos que ganan verdor obtienen mayor puntaje.',
  },
  'Área verde por habitante': {
    label: 'Áreas verdes por persona',
    unit: 'm²/hab',
    dimension: 'ambiental',
    altoEsMejor: true,
    format: (v) => `${Number(v).toFixed(1).replace('.', ',')} m²/hab`,
    help: 'Metros cuadrados de plazas y parques por vecino. La OMS recomienda al menos 9 m² por habitante.',
  },
  'Habitantes por centro de salud de 1er nivel': {
    label: 'Habitantes por centro de salud (1er nivel)',
    unit: 'hab./centro',
    dimension: 'servicios',
    altoEsMejor: false,
    format: (v) => `${Math.round(Number(v)).toLocaleString('es-BO')} hab./centro`,
    help: 'Población dividida entre los centros de atención primaria. Menor saturación da mayor puntaje.',
  },
  'Habitantes por unidad educativa': {
    label: 'Habitantes por unidad educativa',
    unit: 'hab./colegio',
    dimension: 'servicios',
    altoEsMejor: false,
    format: (v) => `${Math.round(Number(v)).toLocaleString('es-BO')} hab./colegio`,
    help: 'Población dividida entre los colegios del distrito. Menor concentración da mayor puntaje.',
  },
  'Población cerca del transporte': {
    label: 'Población cerca del transporte',
    unit: '%',
    dimension: 'servicios',
    altoEsMejor: true,
    format: (v) => `${Number(v).toFixed(1).replace('.', ',')} %`,
    help: 'Porcentaje de población que vive a menos de 300 metros de una ruta de transporte público.',
  },
}

function getSemaphoreColor(val) {
  if (val >= 67) return '#22C55E'
  if (val >= 34) return '#F59E0B'
  return '#EF4444'
}

function getSemaphoreText(val) {
  if (val >= 67) return 'Verde (Favorable)'
  if (val >= 34) return 'Amarillo (Medio)'
  return 'Rojo (Crítico)'
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

      return {
        id: d.id,
        nombre: d.nombre,
        indiceOriginal: d.indice,
        rankingOriginal: d.ranking,
        nuevoIndice: nuevoIndiceRound,
        nuevoIndiceFloat: nuevoIndice,
        dimAmbCalc: Number(dimAmbCalc.toFixed(1)),
        dimServCalc: Number(dimServCalc.toFixed(1)),
        semaforo:
          nuevoIndiceRound >= 67
            ? 'verde'
            : nuevoIndiceRound >= 34
            ? 'amarillo'
            : 'rojo',
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

  // GeoJSON con polígonos coloreados por semáforo y etiqueta de índice
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
        const score = item ? item.nuevoIndice : 50
        const color = getSemaphoreColor(score)

        return {
          ...f,
          properties: {
            ...f.properties,
            selected: isSelected,
            color: isSelected ? 'var(--theme-accent, #38BDF8)' : color,
            fillColor: color,
            labelPermanent: `D${cod}: ${score}`,
            nombre: `${f.properties?.nombre || 'Distrito ' + cod} · Índice: ${score} pts`,
          },
        }
      }),
    }
  }, [distritosGeoJson, indiceData, distritosRecalculados, distNum])

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
    <div className="neo-screen">
      {/* 1. Línea bajo el título y selector de población */}
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
          Una nota de 1 a 100 para cada distrito: cómo está su ambiente y cuántos servicios tiene.
        </p>

        <PopulationSourceSelector
          value={basePoblacion}
          onChange={setBasePoblacion}
        />
      </div>

      {/* 2. Tarjetas (4): Índice · Ranking · Dimensión Ambiental · Dimensión Servicios */}
      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '0.75rem',
        }}
      >
        {/* Tarjeta 1: Índice del distrito con semáforo */}
        <div className="hud-kpi-card" style={{ '--kpi-accent': semColor }}>
          <div className="hud-kpi-top">
            <span className="hud-kpi-label">ÍNDICE SOCIO-AMBIENTAL</span>
            <span
              className="hud-kpi-delta"
              style={{
                color: semColor,
                borderColor: `${semColor}66`,
                background: `${semColor}18`,
              }}
            >
              {getSemaphoreText(activeDistrito.indice)}
            </span>
          </div>
          <div className="hud-kpi-val-row">
            <strong className="hud-kpi-value" style={{ color: semColor }}>
              {activeDistrito.indice}
            </strong>
            <span style={{ fontSize: '0.9rem', color: 'var(--theme-text-muted)', fontWeight: 600 }}>
              / 100
            </span>
          </div>
          <span
            style={{
              fontSize: '0.74rem',
              color: 'var(--theme-text-muted)',
              marginTop: '0.2rem',
              display: 'block',
            }}
          >
            {activeDistrito.nombre}
          </span>
        </div>

        {/* Tarjeta 2: Posición en el ranking */}
        <div className="hud-kpi-card" style={{ '--kpi-accent': 'var(--theme-accent, #38BDF8)' }}>
          <div className="hud-kpi-top">
            <span className="hud-kpi-label">POSICIÓN EN EL RANKING</span>
            <span
              className="hud-kpi-delta"
              style={{
                color: 'var(--theme-accent, #38BDF8)',
                borderColor: 'var(--theme-border)',
              }}
            >
              Oficial GAMC
            </span>
          </div>
          <div className="hud-kpi-val-row">
            <strong className="hud-kpi-value">
              {activeDistrito.ranking}{' '}
              <span style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--theme-text-muted)' }}>
                de 15
              </span>
            </strong>
          </div>
          <span
            style={{
              fontSize: '0.74rem',
              color: 'var(--theme-text-muted)',
              marginTop: '0.2rem',
              display: 'block',
            }}
          >
            Promedio municipal: 51 pts
          </span>
        </div>

        {/* Tarjeta 3: Dimensión ambiental */}
        <div className="hud-kpi-card" style={{ '--kpi-accent': '#22C55E' }}>
          <div className="hud-kpi-top">
            <span className="hud-kpi-label">DIMENSIÓN AMBIENTAL</span>
            <span
              className="hud-kpi-delta"
              style={{ color: '#22C55E', borderColor: 'rgba(34, 197, 94, 0.44)' }}
            >
              4 componentes
            </span>
          </div>
          <div className="hud-kpi-val-row">
            <strong className="hud-kpi-value">
              {activeDistrito.dimension_ambiental.toFixed(1).replace('.', ',')}
            </strong>
            <span style={{ fontSize: '0.9rem', color: 'var(--theme-text-muted)', fontWeight: 600 }}>
              pts
            </span>
          </div>
          <span
            style={{
              fontSize: '0.74rem',
              color: 'var(--theme-text-muted)',
              marginTop: '0.2rem',
              display: 'block',
            }}
          >
            Calor, verdor, tendencia y áreas verdes
          </span>
        </div>

        {/* Tarjeta 4: Dimensión servicios */}
        <div className="hud-kpi-card" style={{ '--kpi-accent': '#F59E0B' }}>
          <div className="hud-kpi-top">
            <span className="hud-kpi-label">DIMENSIÓN SERVICIOS</span>
            <span
              className="hud-kpi-delta"
              style={{ color: '#F59E0B', borderColor: 'rgba(245, 158, 11, 0.44)' }}
            >
              3 componentes
            </span>
          </div>
          <div className="hud-kpi-val-row">
            <strong className="hud-kpi-value">
              {activeDistrito.dimension_servicios.toFixed(1).replace('.', ',')}
            </strong>
            <span style={{ fontSize: '0.9rem', color: 'var(--theme-text-muted)', fontWeight: 600 }}>
              pts
            </span>
          </div>
          <span
            style={{
              fontSize: '0.74rem',
              color: 'var(--theme-text-muted)',
              marginTop: '0.2rem',
              display: 'block',
            }}
          >
            Salud 1er nivel, colegios y transporte
          </span>
        </div>
      </section>

      {/* 3. Centro: GamcMap a la izquierda + Desglose de los 7 componentes a la derecha */}
      <section
        style={{
          display: 'grid',
          gridTemplateColumns: '1.25fr 1fr',
          gap: '0.75rem',
          alignItems: 'start',
        }}
      >
        {/* Mapa con polígonos coloreados por semáforo */}
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
                Mapa de Distritos por Semáforo
              </h3>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.72rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    background: '#22C55E',
                    display: 'inline-block',
                  }}
                />
                Verde (67–100)
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    background: '#F59E0B',
                    display: 'inline-block',
                  }}
                />
                Amarillo (34–66)
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    background: '#EF4444',
                    display: 'inline-block',
                  }}
                />
                Rojo (1–33)
              </span>
            </div>
          </div>

          <GamcMap
            geojson={distritosGeoJsonStyled}
            onClickDistrito={(feat) => {
              const dNum = feat.properties?.codigo_distrito
              if (dNum && onSelectZone) {
                onSelectZone(`distrito-${dNum}`)
              }
            }}
            capasWms={['limite_distritos']}
            height="440px"
          />

          <span
            style={{
              fontSize: '0.72rem',
              color: 'var(--theme-text-muted)',
              fontStyle: 'italic',
            }}
          >
            Haz clic sobre cualquier distrito para seleccionarlo y auditar sus 7 componentes.
          </span>
        </div>

        {/* Desglose de los 7 componentes del distrito */}
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <Activity size={18} strokeWidth={1.75} color="var(--color-icon)" />
              <h3 style={{ margin: 0, fontSize: '0.88rem', fontWeight: 600 }}>
                7 Componentes · {activeDistrito.nombre}
              </h3>
            </div>
            <span
              style={{
                fontSize: '0.7rem',
                color: 'var(--theme-text-muted)',
              }}
            >
              Puntaje 0 a 100
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.65rem',
            }}
          >
            {Object.entries(COMPONENT_DEFINITIONS).map(([key, def]) => {
              const comp = activeDistrito.componentes[key] || { valor: 0, puntaje: 0 }
              let compValor = comp.valor
              if (
                key === 'Habitantes por centro de salud de 1er nivel' ||
                key === 'Habitantes por unidad educativa'
              ) {
                compValor = comp.valor * pobFactor
              }
              const puntajeRound = Math.round(comp.puntaje)
              const barColor = getSemaphoreColor(puntajeRound)

              return (
                <div
                  key={key}
                  style={{
                    background: 'var(--theme-card-bg-subtle, rgba(255,255,255,0.02))',
                    border: '1px solid var(--theme-border)',
                    borderRadius: '8px',
                    padding: '0.55rem 0.65rem',
                    position: 'relative',
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
                        gap: '0.35rem',
                      }}
                    >
                      <span
                        style={{
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          color: 'var(--theme-text-primary)',
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
                              ? 'var(--theme-accent)'
                              : 'var(--color-icon)'
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
                          color: 'var(--theme-text-muted)',
                        }}
                      >
                        {def.format(compValor)}
                      </span>
                      <strong
                        style={{
                          fontSize: '0.82rem',
                          color: barColor,
                          fontWeight: 700,
                        }}
                      >
                        {puntajeRound}
                        <span
                          style={{
                            fontSize: '0.68rem',
                            color: 'var(--theme-text-muted)',
                            fontWeight: 500,
                          }}
                        >
                          /100
                        </span>
                      </strong>
                    </div>
                  </div>

                  {/* Barra horizontal 0 a 100 */}
                  <div
                    style={{
                      width: '100%',
                      height: '6px',
                      background: 'rgba(148, 163, 184, 0.2)',
                      borderRadius: '3px',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        width: `${Math.max(2, Math.min(100, comp.puntaje))}%`,
                        height: '100%',
                        background: barColor,
                        borderRadius: '3px',
                        transition: 'width 0.3s ease',
                      }}
                    />
                  </div>

                  {/* Explicación desplegable cuando se hace clic en "?" */}
                  {activeTooltip === key && (
                    <div
                      style={{
                        marginTop: '0.4rem',
                        padding: '0.35rem 0.5rem',
                        borderRadius: '6px',
                        background: 'var(--theme-card-bg)',
                        border: '1px solid var(--theme-border)',
                        fontSize: '0.72rem',
                        color: 'var(--theme-text-muted)',
                        lineHeight: 1.35,
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

      {/* 4. Abajo: (1) Línea del índice ambiental histórico · (2) "Ajusta los pesos" */}
      <section
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1.15fr',
          gap: '0.75rem',
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
              <TrendingUp size={18} strokeWidth={1.75} color="var(--color-icon)" />
              <h3 style={{ margin: 0, fontSize: '0.88rem', fontWeight: 600 }}>
                Índice Ambiental Histórico (2001–2025)
              </h3>
            </div>
            <span
              style={{
                fontSize: '0.7rem',
                color: 'var(--theme-text-muted)',
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
                      stroke="var(--theme-border)"
                      strokeDasharray="3,3"
                      strokeWidth="1"
                    />
                    <text
                      x="32"
                      y={y + 3}
                      fill="var(--theme-text-muted)"
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
                    fill="var(--theme-text-muted)"
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
                    stroke="#8A94A6"
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
                      stroke="var(--theme-accent, #38BDF8)"
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
                          r="3"
                          fill="var(--theme-accent, #38BDF8)"
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
              borderTop: '1px solid var(--theme-border)',
              paddingTop: '0.45rem',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span
                style={{
                  width: 14,
                  height: 3,
                  background: 'var(--theme-accent, #38BDF8)',
                  display: 'inline-block',
                }}
              />
              <strong>{activeDistrito.nombre}</strong> (
              {activeDistrito.historico?.[activeDistrito.historico.length - 1]?.indice_ambiental || 0} pts en 2025)
            </span>
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                color: 'var(--theme-text-muted)',
              }}
            >
              <span
                style={{
                  width: 14,
                  height: 2,
                  background: '#8A94A6',
                  display: 'inline-block',
                  borderTop: '1px dashed #8A94A6',
                }}
              />
              Promedio de los 15 distritos (
              {promedioHistoricoMunicipal[promedioHistoricoMunicipal.length - 1]?.promedio || 0} pts en 2025)
            </span>
          </div>
        </div>

        {/* Panel 2: "Ajusta los pesos" y ranking interactivo */}
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
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <SlidersHorizontal size={18} strokeWidth={1.75} color="var(--color-icon)" />
              <h3 style={{ margin: 0, fontSize: '0.88rem', fontWeight: 600 }}>
                Ajusta los pesos de ponderación
              </h3>
            </div>
            <button
              type="button"
              onClick={resetWeights}
              className="gamc-btn-secondary"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontSize: '0.72rem',
                padding: '0.25rem 0.6rem',
              }}
              title="Restablecer al balance oficial 50% / 50%"
            >
              <RotateCcw size={13} />
              Volver a los pesos originales
            </button>
          </div>

          {/* Deslizador Ambiente ↔ Servicios */}
          <div
            style={{
              background: 'var(--theme-card-bg-subtle, rgba(255,255,255,0.02))',
              border: '1px solid var(--theme-border)',
              borderRadius: '8px',
              padding: '0.6rem 0.75rem',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '0.78rem',
                fontWeight: 600,
                marginBottom: '0.4rem',
              }}
            >
              <span style={{ color: '#22C55E' }}>
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
                accentColor: 'var(--theme-accent, #38BDF8)',
                cursor: 'pointer',
              }}
            />
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '0.68rem',
                color: 'var(--theme-text-muted)',
                marginTop: '0.2rem',
              }}
            >
              <span>100% Ambiente</span>
              <span>Balance Oficial (50/50)</span>
              <span>100% Servicios</span>
            </div>
          </div>

          {/* Casillas de selección de componentes */}
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
                      ? 'var(--theme-text-primary)'
                      : 'var(--theme-text-muted)',
                    textAlign: 'left',
                  }}
                >
                  {isChecked ? (
                    <CheckSquare size={14} color="var(--theme-accent, #38BDF8)" />
                  ) : (
                    <Square size={14} color="var(--color-icon)" />
                  )}
                  <span style={{ textDecoration: isChecked ? 'none' : 'line-through' }}>
                    {def.label}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Tabla de Ranking recalculada */}
          <div
            style={{
              maxHeight: '160px',
              overflowY: 'auto',
              border: '1px solid var(--theme-border)',
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
                    background: 'var(--theme-card-bg-subtle, rgba(255,255,255,0.04))',
                    borderBottom: '1px solid var(--theme-border)',
                    color: 'var(--color-icon)',
                    textAlign: 'left',
                  }}
                >
                  <th style={{ padding: '4px 6px' }}>#</th>
                  <th style={{ padding: '4px 6px' }}>Distrito</th>
                  <th style={{ padding: '4px 6px', textAlign: 'right' }}>Amb.</th>
                  <th style={{ padding: '4px 6px', textAlign: 'right' }}>Serv.</th>
                  <th style={{ padding: '4px 6px', textAlign: 'right' }}>Nota</th>
                  <th style={{ padding: '4px 6px', textAlign: 'center' }}>Var.</th>
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
                        borderBottom: '1px solid var(--theme-border)',
                        background: isCurrent
                          ? 'var(--theme-accent-subtle, rgba(56, 189, 248, 0.12))'
                          : 'transparent',
                        fontWeight: isCurrent ? 700 : 400,
                      }}
                    >
                      <td style={{ padding: '3px 6px' }}>{d.nuevoRanking}</td>
                      <td style={{ padding: '3px 6px' }}>
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
                      <td style={{ padding: '3px 6px', textAlign: 'right' }}>
                        {d.dimAmbCalc}
                      </td>
                      <td style={{ padding: '3px 6px', textAlign: 'right' }}>
                        {d.dimServCalc}
                      </td>
                      <td
                        style={{
                          padding: '3px 6px',
                          textAlign: 'right',
                          fontWeight: 700,
                          color: dotColor,
                        }}
                      >
                        {d.nuevoIndice}
                      </td>
                      <td
                        style={{
                          padding: '3px 6px',
                          textAlign: 'center',
                          fontSize: '0.68rem',
                          color:
                            d.deltaRanking > 0
                              ? '#22C55E'
                              : d.deltaRanking < 0
                              ? '#EF4444'
                              : 'var(--theme-text-muted)',
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
                fontSize: '0.7rem',
                color: 'var(--theme-text-muted)',
                fontStyle: 'italic',
              }}
            >
              Con esta configuración, {rankingItem.nombre} queda en el puesto {rankingItem.nuevoRanking} de 15 ({rankingItem.nuevoIndice} pts).
            </span>
          )}
        </div>
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
          Cada componente compara a los 15 distritos entre sí: 100 es el mejor distrito y 0 el peor.
        </p>
      </footer>
    </div>
  )
}
