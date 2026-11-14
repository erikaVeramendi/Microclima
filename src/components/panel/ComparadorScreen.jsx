import { useState, useEffect, useMemo } from 'react'
import {
  GitCompare,
  TrendingUp,
  Grid,
} from 'lucide-react'
import { COCHABAMBA_ZONES } from '../../data/internalPanelData'
import './IndiceScreen.css'

const HEATMAP_COLUMNS = [
  { key: 'Calor del suelo', short: 'Calor LST' },
  { key: 'Vegetación', short: 'NDVI' },
  { key: 'Tendencia de vegetación', short: 'Tendencia' },
  { key: 'Área verde por habitante', short: 'Área verde' },
  { key: 'Habitantes por centro de salud de 1er nivel', short: 'Salud 1er' },
  { key: 'Habitantes por unidad educativa', short: 'Colegios' },
  { key: 'Población cerca del transporte', short: 'Transporte' },
]

const PALETTE = [
  '#38BDF8', // Celeste
  '#22C55E', // Verde esmeralda
  '#F59E0B', // Ámbar
]

function getScoreColor(val) {
  if (val >= 67) return 'rgba(34, 197, 94, 0.28)'
  if (val >= 34) return 'rgba(245, 158, 11, 0.28)'
  return 'rgba(239, 68, 68, 0.28)'
}

function getScoreTextColor(val) {
  if (val >= 67) return '#22C55E'
  if (val >= 34) return '#F59E0B'
  return '#EF4444'
}

export default function ComparadorScreen({
  selectedZoneId,
  onSelectZone,
}) {
  const [indiceData, setIndiceData] = useState(null)
  const [tendenciasData, setTendenciasData] = useState(null)
  const [loading, setLoading] = useState(true)

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
  const [distId2, setDistId2] = useState(distNum1 === 9 ? 1 : 9)
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
        ndvi2024: dist.componentes?.['Vegetación']?.valor || 0,
        senSlope: tendNdvi.sen_pendiente_anual ?? 0,
        senSignificativa: tendNdvi.significativa ?? false,
        serieAnual,
        componentes: dist.componentes || {},
      }
    })
  }, [indiceData, tendenciasData, selectedDistIds])

  // Determinar el mejor valor en cada métrica entre los distritos seleccionados
  const mejoresValores = useMemo(() => {
    if (distritosSeleccionados.length === 0) return {}

    const max = (arr, key) => Math.max(...arr.map((d) => d[key]))

    return {
      indice: max(distritosSeleccionados, 'indice'),
      salud1er: max(distritosSeleccionados, 'salud1er'),
      colegios: max(distritosSeleccionados, 'colegios'),
      coberturaSalud: max(distritosSeleccionados, 'coberturaSalud'),
      coberturaColegio: max(distritosSeleccionados, 'coberturaColegio'),
      coberturaTransporte: max(distritosSeleccionados, 'coberturaTransporte'),
      areaVerdeHab: max(distritosSeleccionados, 'areaVerdeHab'),
      ndvi2024: max(distritosSeleccionados, 'ndvi2024'),
      senSlope: max(distritosSeleccionados, 'senSlope'),
    }
  }, [distritosSeleccionados])

  if (loading && !indiceData) {
    return (
      <div className="neo-screen" style={{ padding: '2rem', textAlign: 'center' }}>
        <p style={{ color: 'var(--theme-text-muted)' }}>Cargando comparador de distritos...</p>
      </div>
    )
  }

  const allDistricts = indiceData?.distritos || []

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
          Compara 2 o 3 distritos lado a lado.
        </p>
      </div>

      {/* 2. Barra Superior de Selectores */}
      <section
        className="hud-card"
        style={{
          padding: '0.65rem 0.85rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <span
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontSize: '0.78rem',
              fontWeight: 600,
              color: 'var(--theme-text-primary)',
            }}
          >
            <GitCompare size={16} color="var(--theme-accent, #38BDF8)" />
            Distritos a comparar:
          </span>

          {/* Selector 1 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: PALETTE[0],
                display: 'inline-block',
              }}
            />
            <select
              value={distId1}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10)
                setDistId1(val)
                if (onSelectZone) onSelectZone(`distrito-${val}`)
              }}
              className="gamc-btn-secondary"
              style={{ padding: '0.3rem 0.5rem', fontSize: '0.78rem', fontWeight: 600 }}
            >
              {allDistricts.map((d) => (
                <option key={d.id} value={parseInt(String(d.id), 10)}>
                  {d.nombre} ({d.indice} pts)
                </option>
              ))}
            </select>
          </div>

          <span style={{ color: 'var(--theme-text-muted)', fontSize: '0.8rem' }}>vs</span>

          {/* Selector 2 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: PALETTE[1],
                display: 'inline-block',
              }}
            />
            <select
              value={distId2}
              onChange={(e) => setDistId2(parseInt(e.target.value, 10))}
              className="gamc-btn-secondary"
              style={{ padding: '0.3rem 0.5rem', fontSize: '0.78rem', fontWeight: 600 }}
            >
              {allDistricts.map((d) => (
                <option key={d.id} value={parseInt(String(d.id), 10)}>
                  {d.nombre} ({d.indice} pts)
                </option>
              ))}
            </select>
          </div>

          {/* Selector 3 (opcional) */}
          {distId3 !== null ? (
            <>
              <span style={{ color: 'var(--theme-text-muted)', fontSize: '0.8rem' }}>vs</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    background: PALETTE[2],
                    display: 'inline-block',
                  }}
                />
                <select
                  value={distId3}
                  onChange={(e) => setDistId3(parseInt(e.target.value, 10))}
                  className="gamc-btn-secondary"
                  style={{ padding: '0.3rem 0.5rem', fontSize: '0.78rem', fontWeight: 600 }}
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
                  style={{ padding: '0.25rem 0.45rem', fontSize: '0.7rem' }}
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
              style={{ padding: '0.25rem 0.55rem', fontSize: '0.72rem' }}
            >
              + Agregar 3er distrito
            </button>
          )}
        </div>
      </section>

      {/* 3. Centro: Fichas lado a lado con resaltado del mejor valor */}
      <section
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${distritosSeleccionados.length}, 1fr)`,
          gap: '0.75rem',
        }}
      >
        {distritosSeleccionados.map((d) => {
          const semColor =
            d.indice >= 67 ? '#22C55E' : d.indice >= 34 ? '#F59E0B' : '#EF4444'

          return (
            <div
              key={d.id}
              className="hud-card"
              style={{
                padding: '0.85rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.65rem',
                borderTop: `3px solid ${d.color}`,
              }}
            >
              {/* Encabezado del distrito */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderBottom: '1px solid var(--theme-border)',
                  paddingBottom: '0.5rem',
                }}
              >
                <div>
                  <h3
                    style={{
                      margin: 0,
                      fontSize: '1rem',
                      fontWeight: 700,
                      color: d.color,
                    }}
                  >
                    {d.nombre}
                  </h3>
                  <span style={{ fontSize: '0.72rem', color: 'var(--theme-text-muted)' }}>
                    Puesto {d.ranking} de 15 municipal
                  </span>
                </div>

                <div
                  style={{
                    padding: '0.2rem 0.55rem',
                    borderRadius: '6px',
                    background: `${semColor}20`,
                    border: `1px solid ${semColor}50`,
                    textAlign: 'right',
                  }}
                >
                  <strong style={{ fontSize: '1rem', color: semColor }}>
                    {d.indice}
                  </strong>
                  <span style={{ fontSize: '0.68rem', color: 'var(--theme-text-muted)' }}>
                    /100
                  </span>
                </div>
              </div>

              {/* Filas de Indicadores con resaltado verde del mejor */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', fontSize: '0.76rem' }}>
                {/* 1. Población */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '4px 6px',
                    borderRadius: '4px',
                    background: 'var(--theme-card-bg-subtle, rgba(255,255,255,0.02))',
                  }}
                >
                  <span style={{ color: 'var(--color-icon)' }}>Población (GHSL 2025)</span>
                  <strong>{Math.round(d.personas).toLocaleString('es-BO')} hab.</strong>
                </div>

                {/* 2. Centros de salud de 1er nivel */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '4px 6px',
                    borderRadius: '4px',
                    background:
                      d.salud1er === mejoresValores.salud1er && distritosSeleccionados.length > 1
                        ? 'rgba(34, 197, 94, 0.12)'
                        : 'var(--theme-card-bg-subtle, rgba(255,255,255,0.02))',
                  }}
                >
                  <span style={{ color: 'var(--color-icon)' }}>Centros de salud (1er nivel)</span>
                  <span
                    style={{
                      fontWeight: d.salud1er === mejoresValores.salud1er ? 700 : 500,
                      color:
                        d.salud1er === mejoresValores.salud1er && distritosSeleccionados.length > 1
                          ? '#22C55E'
                          : 'var(--theme-text-primary)',
                    }}
                  >
                    {d.salud1er} {d.salud1er === 1 ? 'centro' : 'centros'}
                  </span>
                </div>

                {/* 3. Unidades educativas */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '4px 6px',
                    borderRadius: '4px',
                    background:
                      d.colegios === mejoresValores.colegios && distritosSeleccionados.length > 1
                        ? 'rgba(34, 197, 94, 0.12)'
                        : 'var(--theme-card-bg-subtle, rgba(255,255,255,0.02))',
                  }}
                >
                  <span style={{ color: 'var(--color-icon)' }}>Colegios (unid. educativas)</span>
                  <span
                    style={{
                      fontWeight: d.colegios === mejoresValores.colegios ? 700 : 500,
                      color:
                        d.colegios === mejoresValores.colegios && distritosSeleccionados.length > 1
                          ? '#22C55E'
                          : 'var(--theme-text-primary)',
                    }}
                  >
                    {d.colegios} colegios
                  </span>
                </div>

                {/* 4. Cobertura de salud */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '4px 6px',
                    borderRadius: '4px',
                    background:
                      d.coberturaSalud === mejoresValores.coberturaSalud && distritosSeleccionados.length > 1
                        ? 'rgba(34, 197, 94, 0.12)'
                        : 'var(--theme-card-bg-subtle, rgba(255,255,255,0.02))',
                  }}
                >
                  <span style={{ color: 'var(--color-icon)' }}>Cobertura de salud (1.000 m)</span>
                  <span
                    style={{
                      fontWeight: d.coberturaSalud === mejoresValores.coberturaSalud ? 700 : 500,
                      color:
                        d.coberturaSalud === mejoresValores.coberturaSalud && distritosSeleccionados.length > 1
                          ? '#22C55E'
                          : 'var(--theme-text-primary)',
                    }}
                  >
                    {d.coberturaSalud.toFixed(1).replace('.', ',')} %
                  </span>
                </div>

                {/* 5. Cobertura de colegios */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '4px 6px',
                    borderRadius: '4px',
                    background:
                      d.coberturaColegio === mejoresValores.coberturaColegio && distritosSeleccionados.length > 1
                        ? 'rgba(34, 197, 94, 0.12)'
                        : 'var(--theme-card-bg-subtle, rgba(255,255,255,0.02))',
                  }}
                >
                  <span style={{ color: 'var(--color-icon)' }}>Cobertura colegios (1.000 m)</span>
                  <span
                    style={{
                      fontWeight: d.coberturaColegio === mejoresValores.coberturaColegio ? 700 : 500,
                      color:
                        d.coberturaColegio === mejoresValores.coberturaColegio && distritosSeleccionados.length > 1
                          ? '#22C55E'
                          : 'var(--theme-text-primary)',
                    }}
                  >
                    {d.coberturaColegio.toFixed(1).replace('.', ',')} %
                  </span>
                </div>

                {/* 6. Cobertura de transporte */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '4px 6px',
                    borderRadius: '4px',
                    background:
                      d.coberturaTransporte === mejoresValores.coberturaTransporte && distritosSeleccionados.length > 1
                        ? 'rgba(34, 197, 94, 0.12)'
                        : 'var(--theme-card-bg-subtle, rgba(255,255,255,0.02))',
                  }}
                >
                  <span style={{ color: 'var(--color-icon)' }}>Cobertura transporte (300 m)</span>
                  <span
                    style={{
                      fontWeight: d.coberturaTransporte === mejoresValores.coberturaTransporte ? 700 : 500,
                      color:
                        d.coberturaTransporte === mejoresValores.coberturaTransporte && distritosSeleccionados.length > 1
                          ? '#22C55E'
                          : 'var(--theme-text-primary)',
                    }}
                  >
                    {d.coberturaTransporte.toFixed(1).replace('.', ',')} %
                  </span>
                </div>

                {/* 7. Área verde por habitante */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '4px 6px',
                    borderRadius: '4px',
                    background:
                      d.areaVerdeHab === mejoresValores.areaVerdeHab && distritosSeleccionados.length > 1
                        ? 'rgba(34, 197, 94, 0.12)'
                        : 'var(--theme-card-bg-subtle, rgba(255,255,255,0.02))',
                  }}
                >
                  <span style={{ color: 'var(--color-icon)' }}>Áreas verdes por persona</span>
                  <span
                    style={{
                      fontWeight: d.areaVerdeHab === mejoresValores.areaVerdeHab ? 700 : 500,
                      color:
                        d.areaVerdeHab === mejoresValores.areaVerdeHab && distritosSeleccionados.length > 1
                          ? '#22C55E'
                          : 'var(--theme-text-primary)',
                    }}
                  >
                    {d.areaVerdeHab.toFixed(1).replace('.', ',')} m²/hab
                  </span>
                </div>

                {/* 8. NDVI 2024 */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '4px 6px',
                    borderRadius: '4px',
                    background:
                      d.ndvi2024 === mejoresValores.ndvi2024 && distritosSeleccionados.length > 1
                        ? 'rgba(34, 197, 94, 0.12)'
                        : 'var(--theme-card-bg-subtle, rgba(255,255,255,0.02))',
                  }}
                >
                  <span style={{ color: 'var(--color-icon)' }}>NDVI medio 2024</span>
                  <span
                    style={{
                      fontWeight: d.ndvi2024 === mejoresValores.ndvi2024 ? 700 : 500,
                      color:
                        d.ndvi2024 === mejoresValores.ndvi2024 && distritosSeleccionados.length > 1
                          ? '#22C55E'
                          : 'var(--theme-text-primary)',
                    }}
                  >
                    {d.ndvi2024.toFixed(2).replace('.', ',')} NDVI
                  </span>
                </div>

                {/* 9. Tendencia de vegetación (Sen) */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '4px 6px',
                    borderRadius: '4px',
                    background:
                      d.senSlope === mejoresValores.senSlope && distritosSeleccionados.length > 1
                        ? 'rgba(34, 197, 94, 0.12)'
                        : 'var(--theme-card-bg-subtle, rgba(255,255,255,0.02))',
                  }}
                >
                  <span style={{ color: 'var(--color-icon)' }}>Tendencia vegetación 2001–2025</span>
                  <span
                    style={{
                      fontWeight: d.senSlope === mejoresValores.senSlope ? 700 : 500,
                      color:
                        d.senSlope === mejoresValores.senSlope && distritosSeleccionados.length > 1
                          ? '#22C55E'
                          : 'var(--theme-text-primary)',
                    }}
                  >
                    {d.senSlope.toFixed(4).replace('.', ',')} / año (
                    {d.senSignificativa ? 'Significativa' : 'No sign.'})
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </section>

      {/* 4. Abajo: (1) Líneas superpuestas NDVI anual · (2) Mapa de calor 15x7 */}
      <section
        style={{
          display: 'grid',
          gridTemplateColumns: '1.15fr 1fr',
          gap: '0.75rem',
          alignItems: 'start',
        }}
      >
        {/* Gráfico de líneas superpuestas NDVI anual 2001–2025 */}
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
                Promedio Anual de NDVI (2001–2025)
              </h3>
            </div>
            <span style={{ fontSize: '0.7rem', color: 'var(--theme-text-muted)' }}>
              MODIS MOD13Q1 (250m)
            </span>
          </div>

          {/* Gráfico SVG de líneas superpuestas */}
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
                      stroke="var(--theme-border)"
                      strokeDasharray="3,3"
                      strokeWidth="1"
                    />
                    <text
                      x="38"
                      y={y + 3}
                      fill="var(--theme-text-muted)"
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
                    fill="var(--theme-text-muted)"
                    fontSize="9"
                    textAnchor="middle"
                  >
                    {anio}
                  </text>
                )
              })}

              {/* Curvas de cada distrito seleccionado */}
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
                      strokeWidth="2.5"
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
                          r="3"
                          fill={d.color}
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
              gap: '1rem',
              fontSize: '0.74rem',
              borderTop: '1px solid var(--theme-border)',
              paddingTop: '0.45rem',
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
                    height: 3,
                    background: d.color,
                    display: 'inline-block',
                    borderRadius: '2px',
                  }}
                />
                <strong>{d.nombre}</strong> (
                {d.serieAnual?.[d.serieAnual.length - 1]?.ndvi || 0} en 2025)
              </span>
            ))}
          </div>
        </div>

        {/* Mapa de Calor: 15 distritos x 7 componentes */}
        <div
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
              <Grid size={18} strokeWidth={1.75} color="var(--color-icon)" />
              <h3 style={{ margin: 0, fontSize: '0.88rem', fontWeight: 600 }}>
                Mapa de Calor: 15 Distritos × 7 Componentes
              </h3>
            </div>
            <span style={{ fontSize: '0.68rem', color: 'var(--theme-text-muted)' }}>
              Puntaje 0–100
            </span>
          </div>

          <div
            style={{
              maxHeight: '275px',
              overflowY: 'auto',
              border: '1px solid var(--theme-border)',
              borderRadius: '6px',
            }}
          >
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '0.7rem',
                textAlign: 'center',
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
                  <th style={{ padding: '4px', textAlign: 'left', minWidth: '70px' }}>
                    Distrito
                  </th>
                  {HEATMAP_COLUMNS.map((col) => (
                    <th key={col.key} style={{ padding: '4px 2px', minWidth: '45px' }}>
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
                        // Al hacer clic, asigna como 2do distrito si es diferente al 1ro
                        if (numId !== distId1) {
                          setDistId2(numId)
                        }
                      }}
                      style={{
                        cursor: 'pointer',
                        borderBottom: '1px solid var(--theme-border)',
                        background: isSelected
                          ? `${activeColor}15`
                          : 'transparent',
                        fontWeight: isSelected ? 700 : 400,
                      }}
                    >
                      <td
                        style={{
                          padding: '3px 6px',
                          textAlign: 'left',
                          color: isSelected ? activeColor : 'var(--theme-text-primary)',
                        }}
                      >
                        {isSelected && (
                          <span
                            style={{
                              display: 'inline-block',
                              width: 6,
                              height: 6,
                              borderRadius: '50%',
                              background: activeColor,
                              marginRight: 4,
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
                            style={{
                              padding: '2px 3px',
                              background: getScoreColor(score),
                              color: getScoreTextColor(score),
                              fontWeight: 700,
                              borderRight: '1px solid rgba(0,0,0,0.1)',
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
              fontSize: '0.68rem',
              color: 'var(--theme-text-muted)',
              fontStyle: 'italic',
            }}
          >
            Distritos elegidos resaltados con su color. Haz clic sobre cualquier fila para sumarlo a la comparación.
          </span>
        </div>
      </section>
    </div>
  )
}
