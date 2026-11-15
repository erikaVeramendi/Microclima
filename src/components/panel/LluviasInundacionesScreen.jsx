import { useState, useEffect, useMemo } from 'react'
import {
  CloudRain,
  CloudLightning,
  Building2,
  AlertTriangle,
  HelpCircle,
  Users,
  Mountain,
  Info,
} from 'lucide-react'
import GamcMap from './GamcMap'
import './LluviasInundacionesScreen.css'

/**
 * Formateador de números con coma decimal (es-BO) y máximo de decimales configurable
 */
function formatNum(val, maxDecimals = 2) {
  if (val === null || val === undefined || Number.isNaN(Number(val))) return '—'
  return Number(val).toLocaleString('es-BO', {
    minimumFractionDigits: 0,
    maximumFractionDigits: maxDecimals,
  })
}

/**
 * Componente de ayuda con tooltip flotante accesible y seguro
 */
function HelpTooltip({ text }) {
  const [open, setOpen] = useState(false)

  return (
    <span
      className="lluvias-tooltip-trigger"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onClick={(e) => {
        e.stopPropagation()
        setOpen((p) => !p)
      }}
      role="button"
      tabIndex={0}
      aria-label="Información adicional"
    >
      <HelpCircle size={14} strokeWidth={2} />
      {open && <div className="lluvias-tooltip-popup">{text}</div>}
    </span>
  )
}

/**
 * Paleta de colores para niveles de susceptibilidad
 */
const SUSCEPTIBILIDAD_COLORS = {
  Baja: '#7DD3FC', // celeste claro
  Media: '#0284C7', // azul medio
  Alta: '#1E3A8A', // azul oscuro
}

export default function LluviasInundacionesScreen({
  selectedZoneId,
  onSelectZone,
}) {
  // Datos reales cargados desde JSON
  const [lluviasData, setLluviasData] = useState(null)
  const [distritosGeoJson, setDistritosGeoJson] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)

  // Tema activo
  const [isLight, setIsLight] = useState(() => {
    return document.documentElement.getAttribute('data-theme') === 'light'
  })

  // Sincronización de tema
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsLight(document.documentElement.getAttribute('data-theme') === 'light')
    })
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    })
    return () => observer.disconnect()
  }, [])

  // Carga de datos
  useEffect(() => {
    let isMounted = true
    setLoading(true)

    Promise.all([
      fetch('/data/lluvias_inundaciones.json').then((r) =>
        r.ok ? r.json() : Promise.reject('No existe lluvias_inundaciones.json')
      ),
      fetch('/data/distritos_indicadores_ambientales_2024.geojson').then((r) =>
        r.ok ? r.json() : null
      ),
    ])
      .then(([lluvias, geojson]) => {
        if (!isMounted) return
        setLluviasData(lluvias)
        setDistritosGeoJson(geojson)
        setLoading(false)
      })
      .catch((err) => {
        console.warn('LluviasInundacionesScreen: carga de datos fallida:', err)
        if (isMounted) {
          setLoadError(true)
          setLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [])

  // Extracción del ID numérico del distrito seleccionado
  const currentDistrictId = useMemo(() => {
    if (!selectedZoneId) return '1'
    const match = String(selectedZoneId).match(/\d+/)
    return match ? match[0] : '1'
  }, [selectedZoneId])

  const handleSelectDistrict = (id) => {
    const cleanId = String(id).replace('distrito-', '')
    if (onSelectZone) {
      onSelectZone(`distrito-${cleanId}`)
    }
  }

  // Distrito actualmente seleccionado en los datos
  const activeDistrict = useMemo(() => {
    if (!lluviasData?.distritos) return null
    return (
      lluviasData.distritos.find((d) => String(d.id) === currentDistrictId) ||
      lluviasData.distritos[0]
    )
  }, [lluviasData, currentDistrictId])

  // Cálculos de KPIs de la ciudad
  const ciudadKpis = useMemo(() => {
    if (!lluviasData?.ciudad?.anual) return null

    const anual = lluviasData.ciudad.anual
    const totalYears = anual.length

    // Promedio lluvia total
    const sumLluvia = anual.reduce((acc, row) => acc + (row.lluvia_total || 0), 0)
    const avgLluvia = totalYears > 0 ? sumLluvia / totalYears : 0

    // Promedio días lluvia fuerte
    const sumDias = anual.reduce((acc, row) => acc + (row.dias_lluvia_fuerte || 0), 0)
    const avgDias = totalYears > 0 ? sumDias / totalYears : 0

    const tLluvia = lluviasData.ciudad.tendencias?.lluvia_total
    const tDias = lluviasData.ciudad.tendencias?.dias_lluvia_fuerte

    return {
      avgLluvia,
      tLluvia,
      avgDias,
      tDias,
    }
  }, [lluviasData])

  // Cálculo de construcción del distrito (2000 → 2020)
  const construidoInfo = useMemo(() => {
    if (!activeDistrict?.construido) return null
    const c2000 = activeDistrict.construido.find((c) => c.anio === 2000)?.pct ?? 0
    const c2020 = activeDistrict.construido.find((c) => c.anio === 2020)?.pct ?? 0
    const diff = c2020 - c2000
    return {
      c2000,
      c2020,
      diff,
    }
  }, [activeDistrict])

  // Promedio de construcción de los 15 distritos por año (para Gráfico 2)
  const cityAvgConstruido = useMemo(() => {
    if (!lluviasData?.distritos) return []
    const years = [2000, 2005, 2010, 2015, 2020, 2025]
    return years.map((yr) => {
      const vals = lluviasData.distritos.map(
        (d) => d.construido?.find((c) => c.anio === yr)?.pct || 0
      )
      const avg = vals.reduce((a, b) => a + b, 0) / vals.length
      return { anio: yr, pct: Number(avg.toFixed(2)) }
    })
  }, [lluviasData])

  // GeoJSON enriquecido para GamcMap (Distritos + Río Rocha + Franja 200m)
  const combinedGeoJson = useMemo(() => {
    if (!distritosGeoJson?.features || !lluviasData?.distritos) return null

    // 1. Polígonos de distritos coloreados por nivel de susceptibilidad
    const districtFeatures = distritosGeoJson.features.map((f) => {
      const dId = String(f.properties?.codigo_distrito || '')
      const distInfo = lluviasData.distritos.find((d) => String(d.id) === dId)
      const nivel = distInfo?.susceptibilidad?.nivel || 'Media'
      const puntaje = distInfo?.susceptibilidad?.puntaje || 0
      const isSelected = dId === currentDistrictId
      const baseColor = SUSCEPTIBILIDAD_COLORS[nivel] || '#0284C7'

      return {
        ...f,
        properties: {
          ...f.properties,
          id: dId,
          codigo_distrito: dId,
          nombre: distInfo?.nombre || `Distrito ${dId}`,
          fillColor: baseColor,
          color: baseColor,
          borderColor: isSelected ? '#F59E0B' : (isLight ? '#475569' : '#0F172A'),
          borderWidth: isSelected ? 3.5 : 1.5,
          fillOpacity: isSelected ? 0.9 : 0.72,
          selected: isSelected,
          customTooltipHtml: `
            <div style="font-family: system-ui, sans-serif; font-size: 12px; line-height: 1.4; padding: 2px;">
              <div style="font-weight: 700; font-size: 13px; color: ${isSelected ? '#F59E0B' : 'var(--theme-accent, #38BDF8)'};">
                ${distInfo?.nombre || `Distrito ${dId}`}
              </div>
              <div style="margin-top: 2px;">Susceptibilidad: <b>${nivel}</b> (${formatNum(puntaje, 1)} / 100)</div>
              <div style="font-size: 11px; opacity: 0.85;">Suelo construido: ${formatNum(distInfo?.construido?.[4]?.pct ?? 0, 1)} %</div>
              ${distInfo?.personas_franja_rocha > 0 ? `<div style="font-size: 11px; color: #38BDF8; font-weight: 600; margin-top: 2px;">🌊 ${formatNum(distInfo.personas_franja_rocha)} personas junto al río</div>` : ''}
            </div>
          `,
        },
      }
    })

    // 2. Franja de amortiguamiento de 200 m a cada lado del río Rocha
    const bufferFeatures = (lluviasData.rio_rocha?.features || []).map((f, idx) => ({
      type: 'Feature',
      geometry: f.geometry,
      properties: {
        isRiverBuffer: true,
        id: `rio_buffer_${idx}`,
        borderColor: 'rgba(56, 189, 248, 0.45)', // Celeste translúcido
        borderWidth: 16,
        opacity: 0.45,
        fillColor: 'transparent',
        fillOpacity: 0,
        customTooltipHtml: '<div style="font-size:11px; font-weight:600;">Franja de 200 m del río Rocha</div>',
      },
    }))

    // 3. Eje principal del río Rocha
    const riverFeatures = (lluviasData.rio_rocha?.features || []).map((f, idx) => ({
      type: 'Feature',
      geometry: f.geometry,
      properties: {
        isRiver: true,
        id: `rio_canal_${idx}`,
        borderColor: '#0284C7',
        borderWidth: 3.5,
        opacity: 1,
        fillColor: 'transparent',
        fillOpacity: 0,
        customTooltipHtml: '<div style="font-size:12px; font-weight:700; color:#38BDF8;">Río Rocha</div>',
      },
    }))

    return {
      type: 'FeatureCollection',
      features: [...districtFeatures, ...bufferFeatures, ...riverFeatures],
    }
  }, [distritosGeoJson, lluviasData, currentDistrictId, isLight])

  // Estado para tooltips en los gráficos SVG
  const [hoveredRainYear, setHoveredRainYear] = useState(null)
  const [hoveredConstruidoYear, setHoveredConstruidoYear] = useState(null)

  // Si los datos aún están cargando o no existen
  if (loading) {
    return (
      <div className="lluvias-screen">
        <div className="lluvias-fallback">Cargando datos hidrometeorológicos y territoriales...</div>
      </div>
    )
  }

  if (loadError || !lluviasData) {
    return (
      <div className="lluvias-screen">
        <div className="lluvias-fallback">
          <h3>Datos en proceso</h3>
          <p>La información hidrometeorológica y de susceptibilidad a inundación se encuentra en procesamiento.</p>
        </div>
      </div>
    )
  }

  // Componentes de susceptibilidad del distrito seleccionado
  const comp = activeDistrict?.susceptibilidad?.componentes || {}
  const nivelActivo = activeDistrict?.susceptibilidad?.nivel || 'Media'
  const puntajeActivo = activeDistrict?.susceptibilidad?.puntaje || 0

  // Hectáreas en cota 2750 del distrito
  const ladera2020Ha =
    activeDistrict?.ladera?.construido_ha?.find((x) => x.anio === 2020)?.ha ?? 0
  const cambioLaderaHa = activeDistrict?.ladera?.cambio_2000_2020_ha ?? 0

  // Frase resumen de ladera Tunari total
  const laderaTotal = lluviasData.ciudad?.ladera_total
  const laderaHa2000 = laderaTotal?.serie?.find((s) => s.anio === 2000)?.ha ?? 121.51
  const laderaHa2020 = laderaTotal?.serie?.find((s) => s.anio === 2020)?.ha ?? 302.13
  const laderaDif = laderaHa2020 - laderaHa2000
  const laderaSen = laderaTotal?.tendencia?.sen_pendiente_anual ?? 8.82
  const laderaP = laderaTotal?.tendencia?.mk_p ?? 0.0085
  const laderaSig = laderaTotal?.tendencia?.significativa ?? true

  return (
    <div className="lluvias-screen">
      {/* Encabezado y Selector */}
      <header className="lluvias-header">
        <div className="lluvias-header-row">
          <div className="lluvias-title-group">
            <h2>
              <CloudRain size={24} color="var(--lluvias-icon-color)" strokeWidth={1.8} />
              Lluvias e inundaciones
            </h2>
            <p className="lluvias-subtitle">
              ¿Llueve más fuerte que antes? ¿Qué distritos son más propensos a anegarse?
            </p>
          </div>

          <div className="lluvias-district-select-wrap">
            <label htmlFor="select-distrito-lluvias">Distrito:</label>
            <select
              id="select-distrito-lluvias"
              className="lluvias-district-select"
              value={currentDistrictId}
              onChange={(e) => handleSelectDistrict(e.target.value)}
            >
              {(lluviasData.distritos || []).map((d) => (
                <option key={d.id} value={d.id}>
                  {d.nombre} ({d.susceptibilidad?.nivel})
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>

      {/* 4 Tarjetas KPI */}
      <section className="lluvias-kpi-grid">
        {/* KPI 1: Lluvia anual de la ciudad */}
        <article className="lluvias-kpi-card">
          <div className="lluvias-kpi-top">
            <div className="lluvias-kpi-label-row">
              <CloudRain size={16} color="var(--lluvias-icon-color)" />
              <span>Lluvia anual de la ciudad</span>
            </div>
          </div>
          <div>
            <div className="lluvias-kpi-val">
              {formatNum(ciudadKpis?.avgLluvia, 1)}
              <span className="lluvias-kpi-val-unit">mm/año</span>
            </div>
            <div style={{ color: 'var(--lluvias-muted)', fontSize: '0.74rem', lineHeight: 1.35, margin: '0.25rem 0 0.35rem' }}>
              Estimación satelital (GPM IMERG, celdas de ~10 km que incluyen la ladera del Tunari): puede ser mayor que lo medido en estaciones del valle. Lo confiable es la tendencia.
            </div>
            <div className="lluvias-kpi-subtext">
              Tendencia Sen:{' '}
              <b>
                {ciudadKpis?.tLluvia?.sen_pendiente_anual >= 0 ? '+' : ''}
                {formatNum(ciudadKpis?.tLluvia?.sen_pendiente_anual, 2)} mm/año
              </b>{' '}
              ·{' '}
              <span style={{ color: ciudadKpis?.tLluvia?.significativa ? '#10B981' : 'var(--lluvias-muted)' }}>
                {ciudadKpis?.tLluvia?.significativa ? 'Significativa' : 'No significativa'} (p ={' '}
                {formatNum(ciudadKpis?.tLluvia?.mk_p, 2)})
              </span>
            </div>
          </div>
        </article>

        {/* KPI 2: Días de lluvia fuerte */}
        <article className="lluvias-kpi-card">
          <div className="lluvias-kpi-top">
            <div className="lluvias-kpi-label-row">
              <CloudLightning size={16} color="var(--lluvias-icon-color)" />
              <span>Días de lluvia fuerte</span>
              <HelpTooltip text="Umbral del percentil 95 de lluvia diaria (18,8 mm). Por encima de este valor el sistema de drenaje pluvial se satura con facilidad." />
            </div>
          </div>
          <div>
            <div className="lluvias-kpi-val">
              {formatNum(ciudadKpis?.avgDias, 1)}
              <span className="lluvias-kpi-val-unit">días/año</span>
            </div>
            <div className="lluvias-kpi-subtext">
              Tendencia Sen: {formatNum(ciudadKpis?.tDias?.sen_pendiente_anual, 2)} días/año (p ={' '}
              {formatNum(ciudadKpis?.tDias?.mk_p, 2)})
              <div style={{ color: 'var(--lluvias-muted)', marginTop: '2px', fontSize: '0.74rem' }}>
                Lluvia fuerte = más de {formatNum(lluviasData.meta?.umbral_lluvia_fuerte_mm, 1)} mm en un día
              </div>
            </div>
          </div>
        </article>

        {/* KPI 3: Suelo construido del distrito */}
        <article className="lluvias-kpi-card">
          <div className="lluvias-kpi-top">
            <div className="lluvias-kpi-label-row">
              <Building2 size={16} color="var(--lluvias-icon-color)" />
              <span>Suelo construido ({activeDistrict?.nombre})</span>
            </div>
          </div>
          <div>
            <div className="lluvias-kpi-val">
              {formatNum(construidoInfo?.c2000, 1)} % → {formatNum(construidoInfo?.c2020, 1)} %
            </div>
            <div className="lluvias-kpi-subtext">
              Diferencia:{' '}
              <b style={{ color: construidoInfo?.diff >= 0 ? '#38BDF8' : '#10B981' }}>
                {construidoInfo?.diff >= 0 ? '+' : ''}
                {formatNum(construidoInfo?.diff, 2)} pp
              </b>{' '}
              (2000–2020 · JRC GHSL)
            </div>
          </div>
        </article>

        {/* KPI 4: Susceptibilidad a inundación */}
        <article className="lluvias-kpi-card">
          <div className="lluvias-kpi-top">
            <div className="lluvias-kpi-label-row">
              <AlertTriangle size={16} color="var(--lluvias-icon-color)" />
              <span>Susceptibilidad a inundación</span>
              <HelpTooltip text="Índice multivariable de 0 a 100 que evalúa terreno bajo (HAND), pendiente plana, sellado del suelo, cercanía al río Rocha y urbanización en ladera del Tunari." />
            </div>
            <span
              className="lluvias-kpi-badge"
              style={{
                backgroundColor:
                  nivelActivo === 'Alta'
                    ? 'rgba(30, 58, 138, 0.4)'
                    : nivelActivo === 'Media'
                    ? 'rgba(2, 132, 199, 0.3)'
                    : 'rgba(125, 211, 252, 0.3)',
                color:
                  nivelActivo === 'Alta'
                    ? '#93C5FD'
                    : nivelActivo === 'Media'
                    ? '#38BDF8'
                    : '#BAE6FD',
                border: `1px solid ${SUSCEPTIBILIDAD_COLORS[nivelActivo]}`,
              }}
            >
              {nivelActivo}
            </span>
          </div>
          <div>
            <div className="lluvias-kpi-val">
              {formatNum(puntajeActivo, 1)}
              <span className="lluvias-kpi-val-unit">/ 100 pts</span>
            </div>
            <div className="lluvias-kpi-subtext">
              Nivel relativo en el valle: <b>{nivelActivo}</b>
            </div>
          </div>
        </article>
      </section>

      {/* Centro: Mapa Leaflet WMS + Ficha del Distrito */}
      <section className="lluvias-center-split">
        {/* Mapa Leaflet */}
        <div className="lluvias-map-panel">
          <div className="lluvias-map-toolbar">
            <div className="lluvias-map-legend-pills">
              <span className="lluvias-legend-pill">
                <span className="lluvias-legend-dot" style={{ backgroundColor: '#7DD3FC' }} />
                Baja
              </span>
              <span className="lluvias-legend-pill">
                <span className="lluvias-legend-dot" style={{ backgroundColor: '#0284C7' }} />
                Media
              </span>
              <span className="lluvias-legend-pill">
                <span className="lluvias-legend-dot" style={{ backgroundColor: '#1E3A8A' }} />
                Alta
              </span>
              <span className="lluvias-legend-pill">
                <span className="lluvias-legend-dot" style={{ backgroundColor: '#38BDF8', opacity: 0.6 }} />
                Río Rocha (franja 200 m)
              </span>
            </div>
            <div style={{ fontSize: '0.76rem', color: 'var(--lluvias-muted)' }}>
              Cota 2750 GAMC encendida por defecto
            </div>
          </div>

          <GamcMap
            geojson={combinedGeoJson}
            capasDisponibles={['cota_2750', 'areas_verdes']}
            capasWms={['cota_2750']}
            onClickDistrito={(feature) => {
              const dId = feature?.properties?.codigo_distrito || feature?.properties?.id
              if (dId && !feature?.properties?.isRiver && !feature?.properties?.isRiverBuffer) {
                handleSelectDistrict(dId)
              }
            }}
            height="470px"
          />
        </div>

        {/* Ficha del Distrito */}
        <aside className="lluvias-district-profile">
          <div className="lluvias-profile-header">
            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--lluvias-muted)', textTransform: 'uppercase' }}>
                Ficha territorial
              </span>
              <h3 className="lluvias-profile-title">{activeDistrict?.nombre}</h3>
            </div>
            <span
              className="lluvias-kpi-badge"
              style={{
                backgroundColor:
                  nivelActivo === 'Alta'
                    ? 'rgba(30, 58, 138, 0.45)'
                    : nivelActivo === 'Media'
                    ? 'rgba(2, 132, 199, 0.35)'
                    : 'rgba(125, 211, 252, 0.35)',
                color:
                  nivelActivo === 'Alta'
                    ? '#93C5FD'
                    : nivelActivo === 'Media'
                    ? '#38BDF8'
                    : '#BAE6FD',
                border: `1px solid ${SUSCEPTIBILIDAD_COLORS[nivelActivo]}`,
              }}
            >
              Susceptibilidad {nivelActivo} ({formatNum(puntajeActivo, 1)} pts)
            </span>
          </div>

          {/* 6 Componentes de Susceptibilidad como barras de 0 a 100 */}
          <div className="lluvias-componentes-list">
            {/* 1. Terreno bajo respecto al drenaje */}
            <div className="lluvias-componente-row">
              <div className="lluvias-comp-header">
                <span className="lluvias-comp-name">
                  Terreno bajo respecto al drenaje
                  <HelpTooltip text="HAND (Height Above Nearest Drainage): mide la altura del terreno respecto al drenaje natural más cercano. Valores bajos (<15 m) indican zonas con alta propensión a anegamiento por escorrentía." />
                </span>
                <span className="lluvias-comp-value">
                  {formatNum(comp['Terreno bajo respecto al drenaje']?.valor, 1)} % sup. bajo drenaje
                </span>
              </div>
              <div className="lluvias-progress-track">
                <div
                  className="lluvias-progress-fill"
                  style={{
                    width: `${Math.min(100, Math.max(0, comp['Terreno bajo respecto al drenaje']?.puntaje || 0))}%`,
                    backgroundColor: '#38BDF8',
                  }}
                />
              </div>
            </div>

            {/* 2. Terreno plano */}
            <div className="lluvias-componente-row">
              <div className="lluvias-comp-header">
                <span className="lluvias-comp-name">Terreno plano (pendiente media)</span>
                <span className="lluvias-comp-value">
                  {formatNum(comp['Terreno plano']?.valor, 2)}° de pendiente
                </span>
              </div>
              <div className="lluvias-progress-track">
                <div
                  className="lluvias-progress-fill"
                  style={{
                    width: `${Math.min(100, Math.max(0, comp['Terreno plano']?.puntaje || 0))}%`,
                    backgroundColor: '#0284C7',
                  }}
                />
              </div>
            </div>

            {/* 3. Suelo construido */}
            <div className="lluvias-componente-row">
              <div className="lluvias-comp-header">
                <span className="lluvias-comp-name">Suelo construido</span>
                <span className="lluvias-comp-value">
                  {formatNum(comp['Suelo construido']?.valor, 1)} % urbanizado
                </span>
              </div>
              <div className="lluvias-progress-track">
                <div
                  className="lluvias-progress-fill"
                  style={{
                    width: `${Math.min(100, Math.max(0, comp['Suelo construido']?.puntaje || 0))}%`,
                    backgroundColor: '#60A5FA',
                  }}
                />
              </div>
            </div>

            {/* 4. Aumento de construcción 2000–2020 */}
            <div className="lluvias-componente-row">
              <div className="lluvias-comp-header">
                <span className="lluvias-comp-name">Aumento de construcción 2000–2020</span>
                <span className="lluvias-comp-value">
                  +{formatNum(comp['Aumento de construcción 2000–2020']?.valor, 2)} pp
                </span>
              </div>
              <div className="lluvias-progress-track">
                <div
                  className="lluvias-progress-fill"
                  style={{
                    width: `${Math.min(100, Math.max(0, comp['Aumento de construcción 2000–2020']?.puntaje || 0))}%`,
                    backgroundColor: '#818CF8',
                  }}
                />
              </div>
            </div>

            {/* 5. Cercanía al río Rocha */}
            <div className="lluvias-componente-row">
              <div className="lluvias-comp-header">
                <span className="lluvias-comp-name">Cercanía al río Rocha</span>
                <span className="lluvias-comp-value">
                  {formatNum(comp['Cercanía al río Rocha']?.valor, 1)} % en franja fluvial
                </span>
              </div>
              <div className="lluvias-progress-track">
                <div
                  className="lluvias-progress-fill"
                  style={{
                    width: `${Math.min(100, Math.max(0, comp['Cercanía al río Rocha']?.puntaje || 0))}%`,
                    backgroundColor: '#0EA5E9',
                  }}
                />
              </div>
            </div>

            {/* 6. Construcción en la ladera del Tunari (sobre la cota 2750) */}
            <div className="lluvias-componente-row">
              <div className="lluvias-comp-header">
                <span className="lluvias-comp-name">
                  Construcción ladera Tunari (&gt; cota 2750)
                  <HelpTooltip text="Cota 2750 m s.n.m.: límite altimétrico de urbanización del Parque Nacional Tunari (Ley 286 GAMC). La urbanización sobre esta cota incrementa la velocidad de escorrentía hacia la cuenca baja." />
                </span>
                <span className="lluvias-comp-value">
                  {formatNum(comp['Construcción en la ladera del Tunari (sobre la cota 2750)']?.valor, 2)} ha
                </span>
              </div>
              <div className="lluvias-progress-track">
                <div
                  className="lluvias-progress-fill"
                  style={{
                    width: `${Math.min(100, Math.max(0, comp['Construcción en la ladera del Tunari (sobre la cota 2750)']?.puntaje || 0))}%`,
                    backgroundColor: '#F59E0B',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Destacados del distrito: Río Rocha y Ladera Tunari */}
          <div className="lluvias-highlights-grid">
            <div className="lluvias-highlight-box">
              <Users size={18} className="lluvias-highlight-icon" />
              <div className="lluvias-highlight-content">
                <div className="lluvias-highlight-main">
                  {formatNum(activeDistrict?.personas_franja_rocha || 0)} personas
                </div>
                <div className="lluvias-highlight-sub">
                  viven a menos de 200 m del río Rocha
                </div>
              </div>
            </div>

            <div className="lluvias-highlight-box">
              <Mountain size={18} className="lluvias-highlight-icon" />
              <div className="lluvias-highlight-content">
                <div className="lluvias-highlight-main">
                  {formatNum(ladera2020Ha, 2)} ha construidas sobre la cota 2750
                </div>
                <div className="lluvias-highlight-sub">
                  {cambioLaderaHa > 0
                    ? `+${formatNum(cambioLaderaHa, 2)} ha nuevas entre 2000 y 2020`
                    : 'Sin incremento registrado sobre la cota en este distrito'}
                </div>
              </div>
            </div>
          </div>
        </aside>
      </section>

      {/* Abajo: Dos Gráficos */}
      <section className="lluvias-bottom-grid">
        {/* Gráfico 1: Barras lluvia anual + Línea días lluvia fuerte (2do eje) */}
        <article className="lluvias-chart-card">
          <div className="lluvias-chart-header">
            <div>
              <h4 className="lluvias-chart-title">Lluvia anual y días de lluvia fuerte (2001–2025)</h4>
              <p className="lluvias-chart-subtitle">
                NASA GPM IMERG V07 · Barras: precipitación total (mm) · Línea: días con más de 18,8 mm
              </p>
            </div>
            <div className="lluvias-chart-legend">
              <span className="lluvias-legend-item">
                <span className="lluvias-legend-line-sample" style={{ backgroundColor: '#0284C7' }} />
                Lluvia total (mm)
              </span>
              <span className="lluvias-legend-item">
                <span className="lluvias-legend-line-sample" style={{ backgroundColor: '#F59E0B' }} />
                Días lluvia fuerte
              </span>
            </div>
          </div>

          <div className="lluvias-svg-container">
            {(() => {
              const data = lluviasData.ciudad?.anual || []
              if (data.length === 0) return null

              const width = 640
              const height = 230
              const padLeft = 45
              const padRight = 40
              const padTop = 20
              const padBottom = 30
              const chartW = width - padLeft - padRight
              const chartH = height - padTop - padBottom

              const maxRain = 1350 // max lluvia total mm
              const maxDias = 15 // max días lluvia fuerte

              const barW = Math.max(8, (chartW / data.length) * 0.65)
              const stepX = chartW / (data.length - 1 || 1)

              // Coordenadas de la línea de días de lluvia fuerte
              const linePoints = data
                .map((d, i) => {
                  const x = padLeft + i * stepX
                  const y = padTop + chartH - (d.dias_lluvia_fuerte / maxDias) * chartH
                  return `${x},${y}`
                })
                .join(' ')

              return (
                <svg
                  viewBox={`0 0 ${width} ${height}`}
                  style={{ width: '100%', height: 'auto', overflow: 'visible' }}
                >
                  {/* Líneas horizontales de guía */}
                  {[0, 300, 600, 900, 1200].map((val) => {
                    const y = padTop + chartH - (val / maxRain) * chartH
                    const diasVal = Math.round((val / maxRain) * maxDias)
                    return (
                      <g key={val}>
                        <line
                          x1={padLeft}
                          y1={y}
                          x2={width - padRight}
                          y2={y}
                          stroke="rgba(148, 163, 184, 0.15)"
                          strokeDasharray="3 3"
                        />
                        <text
                          x={padLeft - 6}
                          y={y + 3}
                          fontSize="9"
                          fill="var(--lluvias-muted)"
                          textAnchor="end"
                        >
                          {val}
                        </text>
                        <text
                          x={width - padRight + 6}
                          y={y + 3}
                          fontSize="9"
                          fill="#F59E0B"
                          textAnchor="start"
                        >
                          {diasVal}d
                        </text>
                      </g>
                    )
                  })}

                  {/* Barras de lluvia total */}
                  {data.map((d, i) => {
                    const x = padLeft + i * stepX - barW / 2
                    const bH = (d.lluvia_total / maxRain) * chartH
                    const y = padTop + chartH - bH
                    const isHovered = hoveredRainYear === d.anio

                    return (
                      <g
                        key={d.anio}
                        onMouseEnter={() => setHoveredRainYear(d.anio)}
                        onMouseLeave={() => setHoveredRainYear(null)}
                        style={{ cursor: 'pointer' }}
                      >
                        <rect
                          x={x}
                          y={y}
                          width={barW}
                          height={bH}
                          rx="3"
                          fill={isHovered ? '#38BDF8' : '#0284C7'}
                          opacity={isHovered ? 1 : 0.85}
                          style={{ transition: 'all 0.15s ease' }}
                        />
                        {/* Etiquetas de años (mostrando cada 4 años y el último) */}
                        {(i % 4 === 0 || i === data.length - 1) && (
                          <text
                            x={padLeft + i * stepX}
                            y={height - 10}
                            fontSize="9"
                            fill="var(--lluvias-muted)"
                            textAnchor="middle"
                          >
                            {d.anio}
                          </text>
                        )}
                      </g>
                    )
                  })}

                  {/* Línea conectada para días de lluvia fuerte */}
                  <polyline
                    fill="none"
                    stroke="#F59E0B"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={linePoints}
                  />

                  {/* Puntos de días de lluvia fuerte */}
                  {data.map((d, i) => {
                    const cx = padLeft + i * stepX
                    const cy = padTop + chartH - (d.dias_lluvia_fuerte / maxDias) * chartH
                    const isHovered = hoveredRainYear === d.anio

                    return (
                      <circle
                        key={d.anio}
                        cx={cx}
                        cy={cy}
                        r={isHovered ? 5 : 3}
                        fill="#F59E0B"
                        stroke="#0F172A"
                        strokeWidth="1.5"
                      />
                    )
                  })}

                  {/* Tooltip dinámico al pasar el cursor */}
                  {hoveredRainYear && (() => {
                    const item = data.find((x) => x.anio === hoveredRainYear)
                    if (!item) return null
                    const idx = data.findIndex((x) => x.anio === hoveredRainYear)
                    const tipX = Math.min(width - 130, Math.max(padLeft, padLeft + idx * stepX - 60))
                    return (
                      <g transform={`translate(${tipX}, 8)`} pointerEvents="none">
                        <rect
                          width="125"
                          height="50"
                          rx="6"
                          fill="#0F172A"
                          stroke="rgba(56, 189, 248, 0.4)"
                          strokeWidth="1"
                        />
                        <text x="8" y="15" fill="#38BDF8" fontSize="10" fontWeight="700">
                          Año {item.anio}
                        </text>
                        <text x="8" y="29" fill="#F8FAFC" fontSize="9">
                          Lluvia: {formatNum(item.lluvia_total, 1)} mm
                        </text>
                        <text x="8" y="42" fill="#F59E0B" fontSize="9">
                          Días fuertes: {item.dias_lluvia_fuerte} días
                        </text>
                      </g>
                    )
                  })()}
                </svg>
              )
            })()}
          </div>
        </article>

        {/* Gráfico 2: Porcentaje construido 2000–2025 (Distrito vs Promedio) */}
        <article className="lluvias-chart-card">
          <div className="lluvias-chart-header">
            <div>
              <h4 className="lluvias-chart-title">
                Suelo construido: {activeDistrict?.nombre} vs. Promedio
              </h4>
              <p className="lluvias-chart-subtitle">
                JRC GHSL (2000–2025) · 2025 es estimado · En puntos porcentuales
              </p>
            </div>
            <div className="lluvias-chart-legend">
              <span className="lluvias-legend-item">
                <span className="lluvias-legend-line-sample" style={{ backgroundColor: '#006EFD' }} />
                {activeDistrict?.nombre}
              </span>
              <span className="lluvias-legend-item">
                <span
                  className="lluvias-legend-line-sample"
                  style={{ backgroundColor: '#94A3B8', borderTop: '1px dashed #94A3B8' }}
                />
                Promedio 15 dist.
              </span>
            </div>
          </div>

          <div className="lluvias-svg-container">
            {(() => {
              const distData = activeDistrict?.construido || []
              if (distData.length === 0) return null

              const width = 500
              const height = 230
              const padLeft = 40
              const padRight = 35
              const padTop = 20
              const padBottom = 30
              const chartW = width - padLeft - padRight
              const chartH = height - padTop - padBottom

              const maxPct = 50 // porcentaje máximo para escala
              const stepX = chartW / (distData.length - 1 || 1)

              // Puntos del distrito
              const distPoints = distData
                .map((d, i) => {
                  const x = padLeft + i * stepX
                  const y = padTop + chartH - (d.pct / maxPct) * chartH
                  return `${x},${y}`
                })
                .join(' ')

              // Puntos del promedio de la ciudad
              const avgPoints = cityAvgConstruido
                .map((d, i) => {
                  const x = padLeft + i * stepX
                  const y = padTop + chartH - (d.pct / maxPct) * chartH
                  return `${x},${y}`
                })
                .join(' ')

              return (
                <svg
                  viewBox={`0 0 ${width} ${height}`}
                  style={{ width: '100%', height: 'auto', overflow: 'visible' }}
                >
                  {/* Líneas horizontales de guía */}
                  {[0, 10, 20, 30, 40, 50].map((val) => {
                    const y = padTop + chartH - (val / maxPct) * chartH
                    return (
                      <g key={val}>
                        <line
                          x1={padLeft}
                          y1={y}
                          x2={width - padRight}
                          y2={y}
                          stroke="rgba(148, 163, 184, 0.15)"
                          strokeDasharray="3 3"
                        />
                        <text
                          x={padLeft - 6}
                          y={y + 3}
                          fontSize="9"
                          fill="var(--lluvias-muted)"
                          textAnchor="end"
                        >
                          {val}%
                        </text>
                      </g>
                    )
                  })}

                  {/* Línea del promedio de la ciudad (gris punteada) */}
                  <polyline
                    fill="none"
                    stroke="#94A3B8"
                    strokeWidth="2"
                    strokeDasharray="4 4"
                    strokeLinecap="round"
                    points={avgPoints}
                  />

                  {/* Línea del distrito (azul/celeste sólida) */}
                  <polyline
                    fill="none"
                    stroke="#006EFD"
                    strokeWidth="3"
                    strokeLinecap="round"
                    points={distPoints}
                  />

                  {/* Puntos y etiquetas de años */}
                  {distData.map((d, i) => {
                    const cx = padLeft + i * stepX
                    const cyDist = padTop + chartH - (d.pct / maxPct) * chartH
                    const avgItem = cityAvgConstruido.find((c) => c.anio === d.anio)
                    const cyAvg = avgItem ? padTop + chartH - (avgItem.pct / maxPct) * chartH : cyDist
                    const isHovered = hoveredConstruidoYear === d.anio
                    const is2025 = d.anio === 2025

                    return (
                      <g
                        key={d.anio}
                        onMouseEnter={() => setHoveredConstruidoYear(d.anio)}
                        onMouseLeave={() => setHoveredConstruidoYear(null)}
                        style={{ cursor: 'pointer' }}
                      >
                        {/* Punto del promedio */}
                        <circle cx={cx} cy={cyAvg} r="3" fill="#94A3B8" />

                        {/* Punto del distrito */}
                        <circle
                          cx={cx}
                          cy={cyDist}
                          r={isHovered ? 6 : 4}
                          fill="#006EFD"
                          stroke="#FFFFFF"
                          strokeWidth="1.5"
                        />

                        {/* Etiqueta del año en eje X */}
                        <text
                          x={cx}
                          y={height - 10}
                          fontSize="9"
                          fill={is2025 ? '#F59E0B' : 'var(--lluvias-muted)'}
                          fontWeight={is2025 ? '700' : '400'}
                          textAnchor="middle"
                        >
                          {d.anio} {is2025 ? '(est.)' : ''}
                        </text>
                      </g>
                    )
                  })}

                  {/* Tooltip dinámico de suelo construido */}
                  {hoveredConstruidoYear && (() => {
                    const dItem = distData.find((x) => x.anio === hoveredConstruidoYear)
                    const aItem = cityAvgConstruido.find((x) => x.anio === hoveredConstruidoYear)
                    if (!dItem) return null
                    const idx = distData.findIndex((x) => x.anio === hoveredConstruidoYear)
                    const tipX = Math.min(width - 140, Math.max(padLeft, padLeft + idx * stepX - 70))
                    return (
                      <g transform={`translate(${tipX}, 8)`} pointerEvents="none">
                        <rect
                          width="135"
                          height="50"
                          rx="6"
                          fill="#0F172A"
                          stroke="rgba(56, 189, 248, 0.4)"
                          strokeWidth="1"
                        />
                        <text x="8" y="15" fill="#38BDF8" fontSize="10" fontWeight="700">
                          {dItem.anio} {dItem.anio === 2025 ? '(Estimado)' : ''}
                        </text>
                        <text x="8" y="29" fill="#F8FAFC" fontSize="9">
                          {activeDistrict?.nombre}: {formatNum(dItem.pct, 2)} %
                        </text>
                        <text x="8" y="42" fill="#94A3B8" fontSize="9">
                          Promedio ciudad: {formatNum(aItem?.pct, 2)} %
                        </text>
                      </g>
                    )
                  })()}
                </svg>
              )
            })()}
          </div>
        </article>
      </section>

      {/* Frase destacada con datos de ciudad.ladera_total */}
      <section className="lluvias-tunari-banner">
        <Mountain size={22} color="var(--lluvias-highlight)" style={{ flexShrink: 0 }} />
        <div className="lluvias-tunari-text">
          Entre 2000 y 2020 se construyeron <strong>{formatNum(laderaDif, 2)} hectáreas nuevas</strong> por
          encima de la cota 2750 del Tunari (Tendencia: <strong>+{formatNum(laderaSen, 2)} ha/año</strong>,{' '}
          {laderaSig ? 'significativa' : 'no significativa'}, p = {formatNum(laderaP, 4)}).
        </div>
      </section>

      {/* Aviso único final (meta.nota) */}
      <footer className="lluvias-nota-footer">
        <Info size={16} color="var(--lluvias-icon-color)" style={{ flexShrink: 0, marginTop: '2px' }} />
        <div>
          <b>Nota metodológica:</b> {lluviasData.meta?.nota}
        </div>
      </footer>
    </div>
  )
}
