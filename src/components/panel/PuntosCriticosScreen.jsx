import { useState, useEffect, useMemo } from 'react'
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
} from 'lucide-react'
import GamcMap from './GamcMap'
import { COCHABAMBA_ZONES } from '../../data/internalPanelData'
import './IndiceScreen.css'

const FILTER_OPTIONS = [
  { id: 'todas', label: 'Todas', key: null },
  { id: 'ambiental', label: 'Ambiental', key: 'ambiental' },
  { id: 'salud', label: 'Salud', key: 'salud' },
  { id: 'educacion', label: 'Educación', key: 'educacion' },
  { id: 'transporte', label: 'Transporte', key: 'transporte' },
  { id: 'indice', label: 'Índice', key: 'indice' },
  { id: 'futuro', label: 'Futuro (2030)', key: 'futura' },
]

function getAlertIcon(tipo) {
  const props = { size: 15, strokeWidth: 1.75, color: 'var(--color-icon, #8A94A6)' }
  switch (tipo) {
    case 'salud':
      return <HeartPulse {...props} />
    case 'ambiental':
      return <Leaf {...props} />
    case 'educacion':
      return <BookOpen {...props} />
    case 'transporte':
      return <Navigation {...props} />
    case 'indice':
      return <AlertTriangle {...props} />
    case 'futura':
      return <Clock {...props} />
    default:
      return <AlertTriangle {...props} />
  }
}

function getAlertIntensityColor(count) {
  if (count >= 5) return '#EF4444' // Rojo intenso
  if (count >= 3) return '#FB923C' // Naranja
  if (count >= 1) return '#F59E0B' // Amarillo
  return '#64748B' // Gris claro
}

export default function PuntosCriticosScreen({
  selectedZoneId,
  onSelectZone,
  onNavigateModule,
}) {
  const [indiceData, setIndiceData] = useState(null)
  const [distritosGeoJson, setDistritosGeoJson] = useState(null)
  const [activeFilter, setActiveFilter] = useState('todas')
  const [loading, setLoading] = useState(true)

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

  // Métricas para las 4 tarjetas superiores
  const stats = useMemo(() => {
    if (!indiceData?.distritos) {
      return { distritosConAlerta: 0, salud: 0, ambiental: 0, futura: 0 }
    }

    let conAlerta = 0
    let countSalud = 0
    let countAmb = 0
    let countFutura = 0

    indiceData.distritos.forEach((d) => {
      const alertas = d.alertas || []
      if (alertas.length > 0) conAlerta++
      alertas.forEach((a) => {
        if (a.tipo === 'salud') countSalud++
        if (a.tipo === 'ambiental') countAmb++
        if (a.tipo === 'futura') countFutura++
      })
    })

    return {
      distritosConAlerta: conAlerta,
      salud: countSalud,
      ambiental: countAmb,
      futura: countFutura,
    }
  }, [indiceData])

  // Lista de distritos ordenada por cantidad de alertas (y luego índice más bajo)
  const distritosOrdenados = useMemo(() => {
    if (!indiceData?.distritos) return []

    const currentFilterObj = FILTER_OPTIONS.find((f) => f.id === activeFilter)
    const targetKey = currentFilterObj?.key

    return indiceData.distritos
      .map((d) => {
        const todasAlertas = d.alertas || []
        const alertasFiltradas = targetKey
          ? todasAlertas.filter((a) => a.tipo === targetKey)
          : todasAlertas

        return {
          id: d.id,
          nombre: d.nombre,
          indice: d.indice,
          semaforo: d.semaforo,
          ranking: d.ranking,
          todasAlertas,
          alertas: alertasFiltradas,
          alertCount: alertasFiltradas.length,
          totalAlertCount: todasAlertas.length,
        }
      })
      .filter((d) => (activeFilter === 'todas' ? true : d.alertCount > 0))
      .sort((a, b) => {
        // Primero por cantidad de alertas del filtro descendente
        if (b.alertCount !== a.alertCount) {
          return b.alertCount - a.alertCount
        }
        // Luego por índice socio-ambiental más bajo (más crítico primero)
        return a.indice - b.indice
      })
  }, [indiceData, activeFilter])

  // GeoJSON con polígonos coloreados por intensidad de alertas
  const distritosGeoJsonIntensity = useMemo(() => {
    if (!distritosGeoJson?.features || !indiceData?.distritos) return null

    const alertMap = {}
    indiceData.distritos.forEach((d) => {
      alertMap[String(d.id)] = d.alertas?.length || 0
    })

    return {
      ...distritosGeoJson,
      features: distritosGeoJson.features.map((f) => {
        const cod = String(f.properties?.codigo_distrito || '')
        const count = alertMap[cod] || 0
        const isSelected = parseInt(cod, 10) === distNum
        const color = getAlertIntensityColor(count)

        return {
          ...f,
          properties: {
            ...f.properties,
            selected: isSelected,
            color: isSelected ? 'var(--theme-accent, #38BDF8)' : color,
            fillColor: color,
            labelPermanent: `D${cod}: ${count} ${count === 1 ? 'alerta' : 'alertas'}`,
            nombre: `${f.properties?.nombre || 'Distrito ' + cod} · ${count} ${count === 1 ? 'alerta registrada' : 'alertas registradas'}`,
          },
        }
      }),
    }
  }, [distritosGeoJson, indiceData, distNum])

  if (loading && !indiceData) {
    return (
      <div className="neo-screen" style={{ padding: '2rem', textAlign: 'center' }}>
        <p style={{ color: 'var(--theme-text-muted)' }}>Cargando puntos críticos...</p>
      </div>
    )
  }

  return (
    <div className="neo-screen">
      {/* 1. Línea bajo el título */}
      <div style={{ marginBottom: '0.1rem' }}>
        <p
          style={{
            margin: 0,
            fontSize: '0.86rem',
            color: 'var(--theme-text-muted)',
            lineHeight: 1.45,
          }}
        >
          Los distritos que necesitan atención primero, y por qué.
        </p>
      </div>

      {/* 2. Tarjetas (4): Con alertas · Salud · Ambientales · Futuras */}
      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '0.75rem',
        }}
      >
        <div className="hud-kpi-card" style={{ '--kpi-accent': '#EF4444' }}>
          <div className="hud-kpi-top">
            <span className="hud-kpi-label">DISTRITOS CON ALERTAS</span>
            <span
              className="hud-kpi-delta"
              style={{ color: '#EF4444', borderColor: 'rgba(239, 68, 68, 0.44)' }}
            >
              Prioridad territorial
            </span>
          </div>
          <div className="hud-kpi-val-row">
            <strong className="hud-kpi-value" style={{ color: '#EF4444' }}>
              {stats.distritosConAlerta}
            </strong>
            <span style={{ fontSize: '0.9rem', color: 'var(--theme-text-muted)', fontWeight: 600 }}>
              de 15
            </span>
          </div>
          <span style={{ fontSize: '0.74rem', color: 'var(--theme-text-muted)', marginTop: '0.2rem', display: 'block' }}>
            Requieren intervención prioritaria
          </span>
        </div>

        <div className="hud-kpi-card" style={{ '--kpi-accent': '#F59E0B' }}>
          <div className="hud-kpi-top">
            <span className="hud-kpi-label">ALERTAS DE SALUD</span>
            <span
              className="hud-kpi-delta"
              style={{ color: '#F59E0B', borderColor: 'rgba(245, 158, 11, 0.44)' }}
            >
              1er nivel
            </span>
          </div>
          <div className="hud-kpi-val-row">
            <strong className="hud-kpi-value">{stats.salud}</strong>
            <span style={{ fontSize: '0.9rem', color: 'var(--theme-text-muted)', fontWeight: 600 }}>
              alertas
            </span>
          </div>
          <span style={{ fontSize: '0.74rem', color: 'var(--theme-text-muted)', marginTop: '0.2rem', display: 'block' }}>
            Saturación o falta de cobertura
          </span>
        </div>

        <div className="hud-kpi-card" style={{ '--kpi-accent': '#22C55E' }}>
          <div className="hud-kpi-top">
            <span className="hud-kpi-label">ALERTAS AMBIENTALES</span>
            <span
              className="hud-kpi-delta"
              style={{ color: '#22C55E', borderColor: 'rgba(34, 197, 94, 0.44)' }}
            >
              NDVI 2001–2025
            </span>
          </div>
          <div className="hud-kpi-val-row">
            <strong className="hud-kpi-value">{stats.ambiental}</strong>
            <span style={{ fontSize: '0.9rem', color: 'var(--theme-text-muted)', fontWeight: 600 }}>
              alertas
            </span>
          </div>
          <span style={{ fontSize: '0.74rem', color: 'var(--theme-text-muted)', marginTop: '0.2rem', display: 'block' }}>
            Pérdida de vegetación significativa
          </span>
        </div>

        <div className="hud-kpi-card" style={{ '--kpi-accent': '#38BDF8' }}>
          <div className="hud-kpi-top">
            <span className="hud-kpi-label">ALERTAS A FUTURO</span>
            <span
              className="hud-kpi-delta"
              style={{ color: '#38BDF8', borderColor: 'rgba(56, 189, 248, 0.44)' }}
            >
              Proyección 2030
            </span>
          </div>
          <div className="hud-kpi-val-row">
            <strong className="hud-kpi-value">{stats.futura}</strong>
            <span style={{ fontSize: '0.9rem', color: 'var(--theme-text-muted)', fontWeight: 600 }}>
              alertas
            </span>
          </div>
          <span style={{ fontSize: '0.74rem', color: 'var(--theme-text-muted)', marginTop: '0.2rem', display: 'block' }}>
            Crecimiento alto con baja cobertura
          </span>
        </div>
      </section>

      {/* 3. Barra de Filtros */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          flexWrap: 'wrap',
          background: 'var(--theme-card-bg-subtle, rgba(255,255,255,0.02))',
          padding: '0.5rem 0.75rem',
          borderRadius: '8px',
          border: '1px solid var(--theme-border)',
        }}
      >
        <span
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            fontSize: '0.75rem',
            color: 'var(--color-icon)',
            fontWeight: 600,
            marginRight: '0.25rem',
          }}
        >
          <Filter size={15} strokeWidth={1.75} />
          Filtrar por:
        </span>
        {FILTER_OPTIONS.map((f) => {
          const isActive = activeFilter === f.id
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => setActiveFilter(f.id)}
              className="gamc-btn-secondary"
              style={{
                fontSize: '0.74rem',
                padding: '0.25rem 0.65rem',
                borderRadius: '6px',
                background: isActive
                  ? 'var(--theme-accent, #38BDF8)'
                  : undefined,
                color: isActive ? '#0f172a' : undefined,
                fontWeight: isActive ? 700 : 500,
                borderColor: isActive ? 'var(--theme-accent)' : undefined,
              }}
            >
              {f.label}
            </button>
          )
        })}
      </div>

      {/* 4. Centro: Lista de distritos a la izquierda + Mapa de intensidad a la derecha */}
      <section
        style={{
          display: 'grid',
          gridTemplateColumns: '1.2fr 1fr',
          gap: '0.75rem',
          alignItems: 'start',
        }}
      >
        {/* Lista ordenada de distritos */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.65rem',
            maxHeight: '520px',
            overflowY: 'auto',
            paddingRight: '0.35rem',
          }}
        >
          {distritosOrdenados.length === 0 ? (
            <div
              className="hud-card"
              style={{ padding: '2rem', textAlign: 'center', color: 'var(--theme-text-muted)' }}
            >
              No hay distritos con alertas para el filtro seleccionado.
            </div>
          ) : (
            distritosOrdenados.map((d) => {
              const isSelected = parseInt(String(d.id), 10) === distNum
              const badgeBg =
                d.indice >= 67
                  ? 'rgba(34, 197, 94, 0.15)'
                  : d.indice >= 34
                  ? 'rgba(245, 158, 11, 0.15)'
                  : 'rgba(239, 68, 68, 0.15)'
              const badgeColor =
                d.indice >= 67 ? '#22C55E' : d.indice >= 34 ? '#F59E0B' : '#EF4444'

              return (
                <div
                  key={d.id}
                  className="hud-card"
                  style={{
                    padding: '0.75rem 0.85rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.55rem',
                    border: isSelected
                      ? '1px solid var(--theme-accent, #38BDF8)'
                      : '1px solid var(--theme-border)',
                    boxShadow: isSelected
                      ? '0 0 16px -4px var(--theme-accent-subtle)'
                      : undefined,
                  }}
                >
                  {/* Encabezado del distrito */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <strong style={{ fontSize: '0.88rem', color: 'var(--theme-text-primary)' }}>
                        {d.nombre}
                      </strong>
                      <span
                        style={{
                          fontSize: '0.7rem',
                          padding: '0.1rem 0.45rem',
                          borderRadius: '4px',
                          background: badgeBg,
                          color: badgeColor,
                          fontWeight: 700,
                        }}
                      >
                        Índice {d.indice} · Semáforo {d.semaforo}
                      </span>
                    </div>

                    <span
                      style={{
                        fontSize: '0.72rem',
                        padding: '0.15rem 0.5rem',
                        borderRadius: '99px',
                        background:
                          d.totalAlertCount >= 4
                            ? 'rgba(239, 68, 68, 0.15)'
                            : 'rgba(148, 163, 184, 0.15)',
                        color:
                          d.totalAlertCount >= 4
                            ? '#EF4444'
                            : 'var(--color-icon)',
                        fontWeight: 700,
                      }}
                    >
                      {d.totalAlertCount} {d.totalAlertCount === 1 ? 'alerta' : 'alertas'}
                    </span>
                  </div>

                  {/* Alertas del distrito */}
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.35rem',
                    }}
                  >
                    {d.alertas.map((a, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '0.45rem',
                          fontSize: '0.76rem',
                          color: 'var(--theme-text-primary)',
                          background: 'var(--theme-card-bg-subtle, rgba(255,255,255,0.02))',
                          padding: '0.4rem 0.55rem',
                          borderRadius: '6px',
                          border: '1px solid var(--theme-border)',
                          lineHeight: 1.35,
                        }}
                      >
                        <span style={{ marginTop: '2px', flexShrink: 0 }}>
                          {getAlertIcon(a.tipo)}
                        </span>
                        <span>{a.texto}</span>
                      </div>
                    ))}
                  </div>

                  {/* Acciones */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'flex-end',
                      gap: '0.5rem',
                      marginTop: '0.2rem',
                      borderTop: '1px solid var(--theme-border)',
                      paddingTop: '0.45rem',
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        if (onSelectZone) onSelectZone(`distrito-${d.id}`)
                        if (onNavigateModule) onNavigateModule('explorador-territorial')
                      }}
                      className="gamc-btn-secondary"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        fontSize: '0.72rem',
                        padding: '0.25rem 0.6rem',
                      }}
                    >
                      Ver en el mapa
                      <ArrowRight size={13} />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (onSelectZone) onSelectZone(`distrito-${d.id}`)
                        if (onNavigateModule) onNavigateModule('indice-socioambiental')
                      }}
                      className="gamc-btn-secondary"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        fontSize: '0.72rem',
                        padding: '0.25rem 0.6rem',
                      }}
                    >
                      Ver índice
                      <ArrowRight size={13} />
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Mapa a la derecha coloreado por intensidad de alertas */}
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
              <Layers size={18} strokeWidth={1.75} color="var(--color-icon)" />
              <h3 style={{ margin: 0, fontSize: '0.88rem', fontWeight: 600 }}>
                Intensidad de Alertas por Distrito
              </h3>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.68rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: '#64748B',
                    display: 'inline-block',
                  }}
                />
                0
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: '#F59E0B',
                    display: 'inline-block',
                  }}
                />
                1–2
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: '#FB923C',
                    display: 'inline-block',
                  }}
                />
                3–4
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: '#EF4444',
                    display: 'inline-block',
                  }}
                />
                5–6
              </span>
            </div>
          </div>

          <GamcMap
            geojson={distritosGeoJsonIntensity}
            onClickDistrito={(feat) => {
              const dNum = feat.properties?.codigo_distrito
              if (dNum && onSelectZone) {
                onSelectZone(`distrito-${dNum}`)
              }
            }}
            capasWms={['limite_distritos']}
            height="460px"
          />

          <span
            style={{
              fontSize: '0.72rem',
              color: 'var(--theme-text-muted)',
              fontStyle: 'italic',
            }}
          >
            Haz clic sobre cualquier distrito para enfocarlo en la lista y revisar sus alertas específicas.
          </span>
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
          Las alertas se calculan con reglas fijas comparando cada distrito con el promedio municipal. Las reglas están en Métodos.
        </p>
      </footer>
    </div>
  )
}
