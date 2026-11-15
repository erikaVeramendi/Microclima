import { useState, useEffect, useMemo } from 'react'
import {
  GitCompare,
  TrendingUp,
  Grid,
  Sparkles,
  Award,
  Filter,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Thermometer,
  TreePine,
  ArrowUpRight,
  Hospital,
  GraduationCap,
  Bus,
  Users,
} from 'lucide-react'
import { COCHABAMBA_ZONES } from '../../data/internalPanelData'
import './ComparadorScreen.css'
import './IndiceScreen.css'

// Columnas del Heatmap 15x7
const HEATMAP_COLUMNS = [
  { key: 'Calor del suelo', short: 'Calor LST' },
  { key: 'Vegetación', short: 'NDVI' },
  { key: 'Tendencia de vegetación', short: 'Tendencia' },
  { key: 'Área verde por habitante', short: 'Área verde' },
  { key: 'Habitantes por centro de salud de 1er nivel', short: 'Salud 1er' },
  { key: 'Habitantes por unidad educativa', short: 'Colegios' },
  { key: 'Población cerca del transporte', short: 'Transporte' },
]

// Identidad de color vibrante solicitada:
// Distrito A: Azul Cian (#0284C7)
// Distrito B: Magenta / Violeta (#C026D3)
// Distrito C: Ámbar (#D97706)
const PALETTE = [
  '#0284C7', // Azul Cian
  '#C026D3', // Magenta / Violeta
  '#D97706', // Ámbar
]

// Colores sólidos de semáforo para el Mapa de Calor
function getHeatmapBgColor(val) {
  if (val >= 67) return '#10B981' // Verde esmeralda
  if (val >= 34) return '#F59E0B' // Ámbar intenso
  return '#EF4444' // Rojo coral
}

export default function ComparadorScreen({
  selectedZoneId,
  onSelectZone,
}) {
  const [indiceData, setIndiceData] = useState(null)
  const [tendenciasData, setTendenciasData] = useState(null)
  const [loading, setLoading] = useState(true)

  // Filtro de indicadores: [Todos los indicadores] | [Solo Brechas de Servicios] | [Solo Indicadores Climáticos]
  const [filtroCategoria, setFiltroCategoria] = useState('todos') // 'todos' | 'servicios' | 'clima'

  // Distrito 1 por defecto tomado de selectedZoneId
  const activeZone =
    COCHABAMBA_ZONES.find((z) => z.id === selectedZoneId) || COCHABAMBA_ZONES[0]
  const distNum1 = parseInt(
    String(activeZone.number || activeZone.id.replace('distrito-', '')),
    10
  )

  // Distritos a comparar (2 o 3)
  const [distId1, setDistId1] = useState(distNum1)
  const [prevDistNum1, setPrevDistNum1] = useState(distNum1)
  const [distId2, setDistId2] = useState(distNum1 === 9 ? 2 : 9)
  const [distId3, setDistId3] = useState(null) // null o número de distrito

  // Sincronizar distrito 1 cuando cambie en la barra superior
  if (prevDistNum1 !== distNum1) {
    setPrevDistNum1(distNum1)
    setDistId1(distNum1)
  }

  useEffect(() => {
    let isMounted = true

    Promise.all([
      fetch('/data/indice_distritos.json').then((r) => (r.ok ? r.json() : null)),
      fetch('/data/tendencias_distritos.json').then((r) => (r.ok ? r.json() : null)),
    ])
      .then(([idx, tend]) => {
        if (!isMounted) return
        if (idx) setIndiceData(idx)
        if (tend) setTendenciasData(tend)
        setLoading(false)
      })
      .catch((err) => {
        console.error('Error cargando datos en ComparadorScreen:', err)
        if (isMounted) setLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [])

  // Lista de IDs seleccionados
  const selectedDistIds = useMemo(() => {
    const ids = [distId1, distId2]
    if (distId3) ids.push(distId3)
    return ids
  }, [distId1, distId2, distId3])

  // Datos consolidados de los distritos seleccionados
  const distritosSeleccionados = useMemo(() => {
    if (!indiceData?.distritos) return []

    return selectedDistIds.map((id, index) => {
      const dist =
        indiceData.distritos.find((d) => parseInt(String(d.id), 10) === id) ||
        indiceData.distritos[0]

      // Buscar en tendencias_distritos.json
      const tendItem = tendenciasData?.distritos?.find(
        (t) => parseInt(String(t.id), 10) === id
      )

      // Calcular serie anual NDVI 2001–2025
      const anualMap = {}
      if (tendItem?.serie) {
        tendItem.serie.forEach((s) => {
          const y = s.fecha.substring(0, 4)
          if (!anualMap[y]) anualMap[y] = []
          anualMap[y].push(s.ndvi)
        })
      }
      const serieAnual = Object.keys(anualMap)
        .sort()
        .map((y) => ({
          anio: parseInt(y, 10),
          ndvi: Number(
            (anualMap[y].reduce((a, b) => a + b, 0) / anualMap[y].length).toFixed(4)
          ),
        }))

      const tendNdvi = tendItem?.tendencias?.ndvi || {}
      const ind = dist.indicadores || {}

      return {
        id,
        nombre: dist.nombre,
        color: PALETTE[index % PALETTE.length],
        labelLetra: index === 0 ? 'A' : index === 1 ? 'B' : 'C',
        indice: dist.indice,
        semaforo: dist.semaforo,
        ranking: dist.ranking,
        personas: ind.personas || 0,
        salud1er: ind.salud_1er || 0,
        colegios: ind.colegios || 0,
        coberturaSalud: ind.cobertura_salud || 0,
        coberturaColegio: ind.cobertura_colegio || 0,
        coberturaTransporte: ind.cobertura_transporte || 0,
        areaVerdeHab: ind.verde_por_hab || 0,
        calorLst: dist.componentes?.['Calor del suelo']?.valor || 28.5,
        ndvi2024: dist.componentes?.['Vegetación']?.valor || 0,
        senSlope: tendNdvi.sen_pendiente_anual ?? (dist.componentes?.['Tendencia de vegetación']?.valor || 0),
        senSignificativa: tendNdvi.significativa ?? false,
        serieAnual,
        componentes: dist.componentes || {},
      }
    })
  }, [indiceData, tendenciasData, selectedDistIds])

  // Determinar el mejor valor en cada métrica entre los distritos seleccionados
  // (Nota: para Calor LST, menor temperatura es mejor)
  const mejoresValores = useMemo(() => {
    if (distritosSeleccionados.length === 0) return {}

    const max = (arr, key) => Math.max(...arr.map((d) => d[key]))
    const min = (arr, key) => Math.min(...arr.map((d) => d[key]))

    return {
      indice: max(distritosSeleccionados, 'indice'),
      personas: max(distritosSeleccionados, 'personas'),
      salud1er: max(distritosSeleccionados, 'salud1er'),
      colegios: max(distritosSeleccionados, 'colegios'),
      coberturaSalud: max(distritosSeleccionados, 'coberturaSalud'),
      coberturaColegio: max(distritosSeleccionados, 'coberturaColegio'),
      coberturaTransporte: max(distritosSeleccionados, 'coberturaTransporte'),
      areaVerdeHab: max(distritosSeleccionados, 'areaVerdeHab'),
      calorLst: min(distritosSeleccionados, 'calorLst'), // Menor calor es mejor
      ndvi2024: max(distritosSeleccionados, 'ndvi2024'),
      senSlope: max(distritosSeleccionados, 'senSlope'),
    }
  }, [distritosSeleccionados])

  // Generador de Veredicto Automático comparando Distrito A vs Distrito B
  const veredictoAutomatico = useMemo(() => {
    if (distritosSeleccionados.length < 2) return null

    const dA = distritosSeleccionados[0]
    const dB = distritosSeleccionados[1]

    const ratioPob = (dA.personas / (dB.personas || 1)).toFixed(1)
    const difSalud = Math.round(dA.coberturaSalud - dB.coberturaSalud)
    const difVerde = (dA.areaVerdeHab - dB.areaVerdeHab).toFixed(1)

    let textoPoblacion = ''
    if (dA.personas > dB.personas * 1.5) {
      textoPoblacion = `${dA.nombre} tiene ${ratioPob}x más población que ${dB.nombre} (${Math.round(dA.personas).toLocaleString('es-BO')} vs. ${Math.round(dB.personas).toLocaleString('es-BO')} hab.)`
    } else if (dB.personas > dA.personas * 1.5) {
      const ratioInv = (dB.personas / (dA.personas || 1)).toFixed(1)
      textoPoblacion = `${dB.nombre} concentra ${ratioInv}x más población que ${dA.nombre} (${Math.round(dB.personas).toLocaleString('es-BO')} vs. ${Math.round(dA.personas).toLocaleString('es-BO')} hab.)`
    } else {
      textoPoblacion = `${dA.nombre} y ${dB.nombre} tienen poblaciones comparables (~${Math.round(dA.personas).toLocaleString('es-BO')} hab.)`
    }

    let textoServicios = ''
    if (Math.abs(difSalud) >= 10) {
      const liderSalud = difSalud > 0 ? dA.nombre : dB.nombre
      const brecha = Math.abs(difSalud)
      textoServicios = `, con una brecha de cobertura de salud del ${brecha}% a favor de ${liderSalud}`
    } else {
      textoServicios = ', con coberturas de salud primarias similares'
    }

    let textoAmbiental = ''
    if (dA.senSlope < 0 && dB.senSlope >= 0) {
      textoAmbiental = `, mientras que ${dA.nombre} pierde vegetación de forma persistente (-${Math.abs(dA.senSlope).toFixed(4)}/año).`
    } else if (dB.senSlope < 0 && dA.senSlope >= 0) {
      textoAmbiental = `, mientras que ${dB.nombre} sufre degradación de vegetación (-${Math.abs(dB.senSlope).toFixed(4)}/año).`
    } else if (Math.abs(Number(difVerde)) >= 3) {
      const masVerde = difVerde > 0 ? dA.nombre : dB.nombre
      textoAmbiental = `, y ${masVerde} cuenta con ${Math.abs(Number(difVerde))} m²/hab más de áreas verdes.`
    } else {
      textoAmbiental = '.'
    }

    return `${textoPoblacion}${textoServicios}${textoAmbiental}`
  }, [distritosSeleccionados])

  // Catálogo de Indicadores Comparativos con metadatos para barras y filtros
  const LISTA_INDICADORES = useMemo(() => {
    return [
      {
        id: 'personas',
        nombre: 'Población (GHSL 2025)',
        categoria: 'servicios',
        icon: Users,
        maxReference: 180000,
        format: (val) => `${Math.round(val).toLocaleString('es-BO')} hab.`,
        keyMejor: 'personas',
      },
      {
        id: 'salud1er',
        nombre: 'Centros de salud (1er nivel)',
        categoria: 'servicios',
        icon: Hospital,
        maxReference: 6,
        format: (val) => `${val} ${val === 1 ? 'centro' : 'centros'}`,
        keyMejor: 'salud1er',
      },
      {
        id: 'colegios',
        nombre: 'Colegios (unid. educativas)',
        categoria: 'servicios',
        icon: GraduationCap,
        maxReference: 45,
        format: (val) => `${val} colegios`,
        keyMejor: 'colegios',
      },
      {
        id: 'coberturaSalud',
        nombre: 'Cobertura de salud (1 km)',
        categoria: 'servicios',
        icon: CheckCircle2,
        maxReference: 100,
        format: (val) => `${val.toFixed(1).replace('.', ',')} %`,
        keyMejor: 'coberturaSalud',
      },
      {
        id: 'coberturaColegio',
        nombre: 'Cobertura de colegios (1 km)',
        categoria: 'servicios',
        icon: CheckCircle2,
        maxReference: 100,
        format: (val) => `${val.toFixed(1).replace('.', ',')} %`,
        keyMejor: 'coberturaColegio',
      },
      {
        id: 'coberturaTransporte',
        nombre: 'Cobertura de transporte (300 m)',
        categoria: 'servicios',
        icon: Bus,
        maxReference: 100,
        format: (val) => `${val.toFixed(1).replace('.', ',')} %`,
        keyMejor: 'coberturaTransporte',
      },
      {
        id: 'areaVerdeHab',
        nombre: 'Áreas verdes por persona',
        categoria: 'clima',
        icon: TreePine,
        maxReference: 25,
        format: (val) => `${val.toFixed(1).replace('.', ',')} m²/hab`,
        keyMejor: 'areaVerdeHab',
      },
      {
        id: 'calorLst',
        nombre: 'Calor superficial diurno (LST)',
        categoria: 'clima',
        icon: Thermometer,
        maxReference: 38,
        format: (val) => `${val.toFixed(2).replace('.', ',')} °C`,
        keyMejor: 'calorLst', // Menor es mejor
      },
      {
        id: 'ndvi2024',
        nombre: 'Vegetación (NDVI medio 2024)',
        categoria: 'clima',
        icon: Sparkles,
        maxReference: 0.5,
        format: (val) => `${val.toFixed(2).replace('.', ',')} NDVI`,
        keyMejor: 'ndvi2024',
      },
      {
        id: 'senSlope',
        nombre: 'Tendencia vegetación (25 años)',
        categoria: 'clima',
        icon: ArrowUpRight,
        maxReference: 0.008,
        format: (val, d) =>
          `${val.toFixed(4).replace('.', ',')} / año (${d.senSignificativa ? 'Significativa' : 'No sign.'})`,
        keyMejor: 'senSlope',
      },
    ]
  }, [])

  // Filtrado de indicadores según la píldora activa
  const indicadoresFiltrados = useMemo(() => {
    if (filtroCategoria === 'servicios') {
      return LISTA_INDICADORES.filter((ind) => ind.categoria === 'servicios')
    }
    if (filtroCategoria === 'clima') {
      return LISTA_INDICADORES.filter((ind) => ind.categoria === 'clima')
    }
    return LISTA_INDICADORES
  }, [LISTA_INDICADORES, filtroCategoria])

  if (loading && !indiceData) {
    return (
      <div className="neo-screen" style={{ padding: '2rem', textAlign: 'center' }}>
        <p style={{ color: 'var(--theme-text-muted)' }}>Cargando comparador de distritos...</p>
      </div>
    )
  }

  const allDistricts = indiceData?.distritos || []

  return (
    <div className="comparador-screen-container neo-screen">
      {/* 1. Header con Selectores de Distritos */}
      <section
        className="hud-card"
        style={{
          padding: '0.75rem 1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          flexWrap: 'wrap',
          background: 'var(--theme-card-bg, #FFFFFF)',
          border: '1px solid var(--theme-border, #E2E8F0)',
          borderRadius: '10px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
          <span
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: '0.86rem',
              fontWeight: 700,
              color: 'var(--theme-text-primary, #0F172A)',
            }}
          >
            <GitCompare size={18} strokeWidth={2.2} color="var(--theme-accent, #0284C7)" />
            7 · Comparador de Distritos:
          </span>

          {/* Selector Distrito A */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span
              style={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                background: PALETTE[0],
                boxShadow: `0 0 8px ${PALETTE[0]}88`,
                display: 'inline-block',
              }}
            />
            <span style={{ fontSize: '0.74rem', fontWeight: 700, color: PALETTE[0] }}>Distrito A:</span>
            <select
              value={distId1}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10)
                setDistId1(val)
                if (onSelectZone) onSelectZone(`distrito-${val}`)
              }}
              className="gamc-btn-secondary"
              style={{
                padding: '0.35rem 0.65rem',
                fontSize: '0.78rem',
                fontWeight: 700,
                borderColor: `${PALETTE[0]}66`,
              }}
            >
              {allDistricts.map((d) => (
                <option key={d.id} value={parseInt(String(d.id), 10)}>
                  {d.nombre} ({d.indice} pts)
                </option>
              ))}
            </select>
          </div>

          <span style={{ color: 'var(--theme-text-muted, #94A3B8)', fontSize: '0.85rem', fontWeight: 600 }}>vs</span>

          {/* Selector Distrito B */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span
              style={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                background: PALETTE[1],
                boxShadow: `0 0 8px ${PALETTE[1]}88`,
                display: 'inline-block',
              }}
            />
            <span style={{ fontSize: '0.74rem', fontWeight: 700, color: PALETTE[1] }}>Distrito B:</span>
            <select
              value={distId2}
              onChange={(e) => setDistId2(parseInt(e.target.value, 10))}
              className="gamc-btn-secondary"
              style={{
                padding: '0.35rem 0.65rem',
                fontSize: '0.78rem',
                fontWeight: 700,
                borderColor: `${PALETTE[1]}66`,
              }}
            >
              {allDistricts.map((d) => (
                <option key={d.id} value={parseInt(String(d.id), 10)}>
                  {d.nombre} ({d.indice} pts)
                </option>
              ))}
            </select>
          </div>

          {/* Selector Distrito C (opcional) */}
          {distId3 !== null ? (
            <>
              <span style={{ color: 'var(--theme-text-muted, #94A3B8)', fontSize: '0.85rem', fontWeight: 600 }}>vs</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    background: PALETTE[2],
                    boxShadow: `0 0 8px ${PALETTE[2]}88`,
                    display: 'inline-block',
                  }}
                />
                <span style={{ fontSize: '0.74rem', fontWeight: 700, color: PALETTE[2] }}>Distrito C:</span>
                <select
                  value={distId3}
                  onChange={(e) => setDistId3(parseInt(e.target.value, 10))}
                  className="gamc-btn-secondary"
                  style={{
                    padding: '0.35rem 0.65rem',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    borderColor: `${PALETTE[2]}66`,
                  }}
                >
                  {allDistricts.map((d) => (
                    <option key={d.id} value={parseInt(String(d.id), 10)}>
                      {d.nombre} ({d.indice} pts)
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setDistId3(null)}
                  className="gamc-btn-secondary"
                  style={{ padding: '0.3rem 0.55rem', fontSize: '0.72rem', color: '#EF4444' }}
                  title="Quitar 3er distrito"
                >
                  ✕ Quitar
                </button>
              </div>
            </>
          ) : (
            <button
              type="button"
              onClick={() => {
                const available = allDistricts.find(
                  (d) =>
                    parseInt(String(d.id), 10) !== distId1 &&
                    parseInt(String(d.id), 10) !== distId2
                )
                if (available) setDistId3(parseInt(String(available.id), 10))
              }}
              className="gamc-btn-secondary"
              style={{
                padding: '0.35rem 0.75rem',
                fontSize: '0.74rem',
                fontWeight: 600,
                borderColor: `${PALETTE[2]}77`,
                color: PALETTE[2],
              }}
            >
              + Agregar Distrito C
            </button>
          )}
        </div>

        {/* Píldoras de Filtro de Indicadores */}
        <div className="comparador-pills-row">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.73rem', color: 'var(--theme-text-muted, #64748B)', fontWeight: 600 }}>
            <Filter size={13} />
            <span>Ver:</span>
          </div>
          <button
            type="button"
            className={`comparador-pill-btn ${filtroCategoria === 'todos' ? 'is-active' : ''}`}
            onClick={() => setFiltroCategoria('todos')}
          >
            Todos los indicadores (10)
          </button>
          <button
            type="button"
            className={`comparador-pill-btn ${filtroCategoria === 'servicios' ? 'is-active' : ''}`}
            onClick={() => setFiltroCategoria('servicios')}
          >
            Solo Brechas de Servicios
          </button>
          <button
            type="button"
            className={`comparador-pill-btn ${filtroCategoria === 'clima' ? 'is-active' : ''}`}
            onClick={() => setFiltroCategoria('clima')}
          >
            Solo Indicadores Climáticos
          </button>
        </div>
      </section>

      {/* 2. Banner de Veredicto Automático ("Diagnóstico Comparativo Rápido") */}
      {veredictoAutomatico && (
        <section className="comparador-veredicto-banner">
          <Award size={22} color="#0284C7" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
            <span
              style={{
                fontSize: '0.73rem',
                fontWeight: 800,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                color: '#0284C7',
              }}
            >
              Diagnóstico Comparativo Rápido (IA Territorial)
            </span>
            <p
              style={{
                margin: 0,
                fontSize: '0.86rem',
                fontWeight: 600,
                color: 'var(--theme-text-primary, #0F172A)',
                lineHeight: 1.45,
              }}
            >
              {veredictoAutomatico}
            </p>
          </div>
        </section>
      )}

      {/* 3. Encabezados de Tarjetas de Distritos con Nota General */}
      <section
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${distritosSeleccionados.length}, 1fr)`,
          gap: '0.85rem',
        }}
      >
        {distritosSeleccionados.map((d) => {
          const semColor =
            d.indice >= 67 ? '#10B981' : d.indice >= 34 ? '#F59E0B' : '#EF4444'

          return (
            <div
              key={d.id}
              className="hud-card"
              style={{
                padding: '0.85rem 1rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'var(--theme-card-bg, #FFFFFF)',
                border: '1px solid var(--theme-border, #E2E8F0)',
                borderTop: `4px solid ${d.color}`,
                borderRadius: '10px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              }}
            >
              <div>
                <span
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: 800,
                    color: d.color,
                    letterSpacing: '0.05em',
                  }}
                >
                  DISTRITO {d.labelLetra}
                </span>
                <h3
                  style={{
                    margin: '2px 0 0',
                    fontSize: '1.1rem',
                    fontWeight: 800,
                    color: 'var(--theme-text-primary, #0F172A)',
                  }}
                >
                  {d.nombre}
                </h3>
                <span style={{ fontSize: '0.74rem', color: 'var(--theme-text-muted, #64748B)' }}>
                  Puesto {d.ranking} de 15 municipal
                </span>
              </div>

              <div
                style={{
                  padding: '0.35rem 0.75rem',
                  borderRadius: '8px',
                  background: `${semColor}15`,
                  border: `1.5px solid ${semColor}66`,
                  textAlign: 'right',
                }}
              >
                <strong style={{ fontSize: '1.25rem', color: semColor, fontWeight: 800 }}>
                  {d.indice}
                </strong>
                <span style={{ fontSize: '0.74rem', color: 'var(--theme-text-muted, #64748B)', fontWeight: 600 }}>
                  /100
                </span>
                <div style={{ fontSize: '0.66rem', fontWeight: 700, color: semColor, textTransform: 'uppercase' }}>
                  {d.indice >= 67 ? 'Óptimo' : d.indice >= 34 ? 'Alerta' : 'Crítico'}
                </div>
              </div>
            </div>
          )
        })}
      </section>

      {/* 4. Tabla Central Comparativa con Barras de Progreso Horizontales y Badges "Mejor" */}
      <section
        className="hud-card"
        style={{
          padding: '0.85rem 1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.55rem',
          background: 'var(--theme-card-bg, #FFFFFF)',
          border: '1px solid var(--theme-border, #E2E8F0)',
          borderRadius: '10px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
          <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: 'var(--theme-text-primary, #0F172A)' }}>
            Matriz Detallada de Indicadores y Brechas
          </h3>
          <span style={{ fontSize: '0.72rem', color: 'var(--theme-text-muted, #64748B)' }}>
            El badge <span className="comparador-best-badge">✓ Mejor</span> resalta el valor más favorable
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
          {indicadoresFiltrados.map((ind) => {
            const Icono = ind.icon || Activity
            return (
              <div key={ind.id} className="comparador-row-card">
                {/* Nombre de la fila */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <Icono size={15} color="var(--theme-accent, #0284C7)" />
                  <strong style={{ fontSize: '0.8rem', color: 'var(--theme-text-primary, #0F172A)' }}>
                    {ind.nombre}
                  </strong>
                </div>

                {/* Grid con las columnas de cada distrito */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: `repeat(${distritosSeleccionados.length}, 1fr)`,
                    gap: '0.85rem',
                  }}
                >
                  {distritosSeleccionados.map((d) => {
                    const val = d[ind.id]
                    const esMejor =
                      distritosSeleccionados.length > 1 &&
                      val === mejoresValores[ind.keyMejor]

                    // Cálculo del ancho de la barra horizontal (0 a 100%)
                    let pct = 0
                    if (ind.id === 'calorLst') {
                      // Para calor: 20°C a 38°C invertido (menor es mejor)
                      pct = Math.max(5, Math.min(100, ((38 - val) / (38 - 20)) * 100))
                    } else if (ind.id === 'senSlope') {
                      // Para tendencia: normalizado de -0.005 a +0.005
                      pct = Math.max(5, Math.min(100, ((val + 0.005) / 0.01) * 100))
                    } else {
                      pct = Math.max(5, Math.min(100, (val / ind.maxReference) * 100))
                    }

                    return (
                      <div key={d.id} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                          <span style={{ fontSize: '0.78rem', fontWeight: esMejor ? 800 : 600, color: esMejor ? d.color : 'var(--theme-text-primary, #0F172A)' }}>
                            {ind.format(val, d)}
                          </span>

                          {esMejor && (
                            <span className="comparador-best-badge">
                              ✓ Mejor
                            </span>
                          )}
                        </div>

                        {/* Barra horizontal con el color propio del distrito */}
                        <div className="comparador-bar-track">
                          <div
                            style={{
                              width: `${pct}%`,
                              height: '100%',
                              background: d.color,
                              borderRadius: '3px',
                              transition: 'width 0.3s ease',
                            }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* 5. Gráficos Inferiores: Líneas Superpuestas NDVI + Mapa de Calor 15x7 */}
      <section
        style={{
          display: 'grid',
          gridTemplateColumns: '1.15fr 1fr',
          gap: '0.85rem',
          alignItems: 'start',
        }}
      >
        {/* Gráfico de líneas superpuestas NDVI anual 2001–2025 */}
        <div
          className="hud-card"
          style={{
            padding: '0.85rem 1rem',
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
                Promedio Anual de NDVI (2001–2025)
              </h3>
            </div>
            <span style={{ fontSize: '0.7rem', color: 'var(--theme-text-muted, #64748B)', fontWeight: 600 }}>
              MODIS MOD13Q1 (250m)
            </span>
          </div>

          {/* Gráfico SVG de líneas superpuestas con cuadrícula adaptada */}
          <div style={{ position: 'relative', width: '100%', height: '230px' }}>
            <svg
              viewBox="0 0 500 230"
              style={{ width: '100%', height: '100%', overflow: 'visible' }}
            >
              {/* Líneas guía horizontales: 0.15, 0.20, 0.25, 0.30, 0.35 */}
              {[0.15, 0.2, 0.25, 0.3, 0.35].map((val) => {
                const y = 200 - ((val - 0.12) / 0.26) * 170
                return (
                  <g key={val}>
                    <line
                      x1="45"
                      y1={y}
                      x2="485"
                      y2={y}
                      stroke="var(--theme-border, #E2E8F0)"
                      strokeDasharray="3,3"
                      strokeWidth="1"
                    />
                    <text
                      x="38"
                      y={y + 3}
                      fill="var(--theme-text-muted, #94A3B8)"
                      fontSize="9"
                      textAnchor="end"
                    >
                      {val.toFixed(2)}
                    </text>
                  </g>
                )
              })}

              {/* Eje X: años */}
              {[2001, 2005, 2010, 2015, 2020, 2025].map((anio) => {
                const x = 45 + ((anio - 2001) / 24) * 440
                return (
                  <text
                    key={anio}
                    x={x}
                    y="220"
                    fill="var(--theme-text-muted, #94A3B8)"
                    fontSize="9"
                    textAnchor="middle"
                  >
                    {anio}
                  </text>
                )
              })}

              {/* Curvas de cada distrito seleccionado con colores asignados */}
              {distritosSeleccionados.map((d) => {
                if (!d.serieAnual || d.serieAnual.length === 0) return null
                const points = d.serieAnual
                  .map((p) => {
                    const x = 45 + ((p.anio - 2001) / 24) * 440
                    const y = 200 - ((p.ndvi - 0.12) / 0.26) * 170
                    return `${x},${y}`
                  })
                  .join(' ')

                return (
                  <g key={d.id}>
                    <polyline
                      fill="none"
                      stroke={d.color}
                      strokeWidth="2.8"
                      points={points}
                    />
                    {d.serieAnual.map((p) => {
                      const x = 45 + ((p.anio - 2001) / 24) * 440
                      const y = 200 - ((p.ndvi - 0.12) / 0.26) * 170
                      return (
                        <circle
                          key={p.anio}
                          cx={x}
                          cy={y}
                          r="3.5"
                          fill={d.color}
                          stroke="#FFFFFF"
                          strokeWidth="1"
                        >
                          <title>{`${d.nombre} · ${p.anio}: ${p.ndvi} NDVI`}</title>
                        </circle>
                      )
                    })}
                  </g>
                )
              })}
            </svg>
          </div>

          {/* Leyenda con colores por distrito */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '1.2rem',
              fontSize: '0.76rem',
              borderTop: '1px solid var(--theme-border, #E2E8F0)',
              paddingTop: '0.5rem',
              flexWrap: 'wrap',
            }}
          >
            {distritosSeleccionados.map((d) => (
              <span
                key={d.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span
                  style={{
                    width: 14,
                    height: 4,
                    background: d.color,
                    display: 'inline-block',
                    borderRadius: '2px',
                  }}
                />
                <strong style={{ color: d.color }}>{d.nombre}</strong> (
                {d.serieAnual?.[d.serieAnual.length - 1]?.ndvi || 0} en 2025)
              </span>
            ))}
          </div>
        </div>

        {/* Mapa de Calor: 15 distritos x 7 componentes con Celdas Semáforo Vivas */}
        <div
          className="hud-card"
          style={{
            padding: '0.85rem 1rem',
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
              <Grid size={18} strokeWidth={2.2} color="var(--theme-accent, #0284C7)" />
              <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: 'var(--theme-text-primary, #0F172A)' }}>
                Mapa de Calor: 15 Distritos × 7 Componentes
              </h3>
            </div>
            <span style={{ fontSize: '0.7rem', color: 'var(--theme-text-muted, #64748B)', fontWeight: 600 }}>
              Puntaje 0–100
            </span>
          </div>

          <div
            style={{
              maxHeight: '275px',
              overflowY: 'auto',
              border: '1px solid var(--theme-border, #E2E8F0)',
              borderRadius: '8px',
            }}
          >
            <table
              style={{
                width: '100%',
                borderCollapse: 'separate',
                borderSpacing: '2px',
                fontSize: '0.72rem',
                textAlign: 'center',
              }}
            >
              <thead>
                <tr
                  style={{
                    background: 'var(--theme-card-bg-subtle, #F8FAFC)',
                    color: 'var(--theme-text-muted, #475569)',
                    fontWeight: 700,
                  }}
                >
                  <th style={{ padding: '6px 8px', textAlign: 'left', minWidth: '75px' }}>
                    Distrito
                  </th>
                  {HEATMAP_COLUMNS.map((col) => (
                    <th key={col.key} style={{ padding: '6px 4px', minWidth: '45px' }}>
                      {col.short}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {allDistricts.map((d) => {
                  const numId = parseInt(String(d.id), 10)
                  const isSelected = selectedDistIds.includes(numId)
                  const selectedIdx = selectedDistIds.indexOf(numId)
                  const activeColor = isSelected ? PALETTE[selectedIdx] : null

                  return (
                    <tr
                      key={d.id}
                      onClick={() => {
                        // Al hacer clic, carga como 2do distrito si es diferente al 1ro
                        if (numId !== distId1) {
                          setDistId2(numId)
                        }
                      }}
                      style={{
                        cursor: 'pointer',
                        background: isSelected
                          ? `${activeColor}15`
                          : 'transparent',
                        fontWeight: isSelected ? 800 : 500,
                      }}
                    >
                      <td
                        style={{
                          padding: '3px 6px',
                          textAlign: 'left',
                          color: isSelected ? activeColor : 'var(--theme-text-primary, #0F172A)',
                          fontWeight: isSelected ? 800 : 600,
                        }}
                      >
                        {isSelected && (
                          <span
                            style={{
                              display: 'inline-block',
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              background: activeColor,
                              marginRight: 5,
                            }}
                          />
                        )}
                        {d.nombre}
                      </td>
                      {HEATMAP_COLUMNS.map((col) => {
                        const score = Math.round(d.componentes?.[col.key]?.puntaje ?? 50)
                        return (
                          <td
                            key={col.key}
                            className="comparador-heatmap-cell"
                            style={{
                              backgroundColor: getHeatmapBgColor(score),
                            }}
                          >
                            {score}
                          </td>
                        )
                      })}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <span
            style={{
              fontSize: '0.7rem',
              color: 'var(--theme-text-muted, #64748B)',
              fontStyle: 'italic',
            }}
          >
            💡 Haz clic en cualquier fila para cargar ese distrito en la comparación superior.
          </span>
        </div>
      </section>
    </div>
  )
}
