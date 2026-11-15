/**
 * src/components/panel/DetectiveTendenciasScreen.jsx
 * Pestaña 2 · Detective de tendencias
 * Corazón del reto de la NASA: qué cambia, dónde, cuánto y si es significativo.
 * Usa datos reales de tendencias_distritos.json y cálculo estadístico de tendencias.js
 */

import { useState, useMemo } from 'react'
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Info,
  Calendar,
  MapPin,
  Sliders,
  Layers,
  AlertCircle,
  CheckCircle2,
  XCircle,
} from 'lucide-react'
import { useJSON } from '../../lib/datos'
import { resumenTendencia } from '../../lib/tendencias'
import { COCHABAMBA_DISTRICT_SVGS } from '../../data/cochabambaDistrictsSvg'
import { COCHABAMBA_ZONES } from '../../data/internalPanelData'
import './DetectiveTendenciasScreen.css'

// Configuración completa de variables agrupadas por temas
const VARIABLES_CONFIG = {
  // --- GRUPO CALOR ---
  lst_landsat: {
    id: 'lst_landsat',
    nombre: 'Calor del suelo de día · Landsat 2013–2025',
    grupo: 'calor',
    tipo: 'anual',
    key: 'lst_landsat',
    minYear: 2013,
    maxYear: 2025,
    unidad: '°C/año',
    unidadTotal: '°C',
    decimals: 2,
    avisoKey: 'nota_lst_landsat',
  },
  lst: {
    id: 'lst',
    nombre: 'Calor del suelo de día · MODIS 2001–2019',
    grupo: 'calor',
    tipo: 'mensual',
    key: 'lst',
    minYear: 2001,
    maxYear: 2019,
    unidad: '°C/año',
    unidadTotal: '°C',
    decimals: 2,
    avisoKey: 'nota_lst',
  },
  lst_noche: {
    id: 'lst_noche',
    nombre: 'Calor del suelo de noche · MODIS Aqua 2003–2021',
    grupo: 'calor',
    tipo: 'mensual',
    key: 'lst_noche',
    minYear: 2003,
    maxYear: 2021,
    unidad: '°C/año',
    unidadTotal: '°C',
    decimals: 2,
    avisoKey: 'nota_lst_noche',
  },
  dias_calor_extremo: {
    id: 'dias_calor_extremo',
    nombre: 'Días de calor extremo por año (regional)',
    grupo: 'calor',
    tipo: 'ciudad_anual',
    key: 'dias_calor_extremo',
    minYear: 2001,
    maxYear: 2025,
    unidad: 'días/año',
    unidadTotal: 'días',
    decimals: 2,
    avisoKey: 'nota_ciudad',
    hideMap: true,
    hideBars: true,
  },
  t2m: {
    id: 't2m',
    nombre: 'Temperatura del aire',
    grupo: 'calor',
    tipo: 'mensual',
    key: 't2m',
    minYear: 2001,
    maxYear: 2025,
    unidad: '°C/año',
    unidadTotal: '°C',
    decimals: 2,
    avisoKey: 'nota_t2m',
    hideMap: true,
    hideBars: true,
  },

  // --- GRUPO AGUA ---
  lluvia: {
    id: 'lluvia',
    nombre: 'Lluvia mensual',
    grupo: 'agua',
    tipo: 'mensual',
    key: 'lluvia',
    minYear: 2001,
    maxYear: 2025,
    unidad: 'mm/año',
    unidadTotal: 'mm',
    decimals: 2,
    avisoKey: 'nota_lluvia',
  },
  dias_lluvia_fuerte: {
    id: 'dias_lluvia_fuerte',
    nombre: 'Días de lluvia fuerte por año',
    grupo: 'agua',
    tipo: 'ciudad_anual',
    key: 'dias_lluvia_fuerte',
    minYear: 2001,
    maxYear: 2025,
    unidad: 'días/año',
    unidadTotal: 'días',
    decimals: 2,
    avisoKey: 'nota_ciudad',
    hideMap: true,
    hideBars: true,
  },
  lluvia_max_dia: {
    id: 'lluvia_max_dia',
    nombre: 'Lluvia máxima en un día por año',
    grupo: 'agua',
    tipo: 'ciudad_anual',
    key: 'lluvia_max_dia',
    minYear: 2001,
    maxYear: 2025,
    unidad: 'mm/año',
    unidadTotal: 'mm',
    decimals: 2,
    avisoKey: 'nota_ciudad',
    hideMap: true,
    hideBars: true,
  },
  construido_pct: {
    id: 'construido_pct',
    nombre: 'Superficie construida (%)',
    grupo: 'agua',
    tipo: 'anual',
    key: 'construido_pct',
    minYear: 2000,
    maxYear: 2025,
    unidad: 'puntos porcentuales/año',
    unidadTotal: 'puntos',
    decimals: 2,
    avisoKey: 'fuente_construido',
  },

  // --- GRUPO VEGETACIÓN Y AIRE ---
  ndvi: {
    id: 'ndvi',
    nombre: 'NDVI (vegetación)',
    grupo: 'veg_aire',
    tipo: 'mensual',
    key: 'ndvi',
    minYear: 2001,
    maxYear: 2025,
    unidad: 'índice/año',
    unidadTotal: 'en índice',
    decimals: 4,
    avisoKey: null,
  },
  aod: {
    id: 'aod',
    nombre: 'AOD (polvo y humo en el aire)',
    grupo: 'veg_aire',
    tipo: 'mensual',
    key: 'aod',
    minYear: 2001,
    maxYear: 2025,
    unidad: 'por año',
    unidadTotal: 'en AOD',
    decimals: 4,
    avisoKey: 'nota_aod',
  },
  pm10: {
    id: 'pm10',
    nombre: 'PM10 en estaciones',
    grupo: 'veg_aire',
    tipo: 'estacion',
    key: 'pm10',
    minYear: 2022,
    maxYear: 2026,
    unidad: 'µg/m³ por año',
    unidadTotal: 'µg/m³',
    decimals: 2,
    avisoKey: 'nota_pm10',
    hideMap: true,
    hideBars: true,
  },
  focos_incendio: {
    id: 'focos_incendio',
    nombre: 'Focos de incendio · Parque Tunari (NASA FIRMS)',
    grupo: 'veg_aire',
    tipo: 'ciudad_focos',
    key: 'tunari',
    minYear: 2001,
    maxYear: 2026,
    unidad: 'focos/año',
    unidadTotal: 'focos',
    decimals: 2,
    avisoKey: 'nota_focos',
    hideMap: true,
    hideBars: true,
  },
  focos_region: {
    id: 'focos_region',
    nombre: 'Focos de incendio · Región 150 km (NASA FIRMS)',
    grupo: 'veg_aire',
    tipo: 'ciudad_focos',
    key: 'region_150km',
    minYear: 2001,
    maxYear: 2026,
    unidad: 'focos/año',
    unidadTotal: 'focos',
    decimals: 2,
    avisoKey: 'nota_focos',
    hideMap: true,
    hideBars: true,
  },
}

// Estaciones de monitoreo continuo Red MÓNICA
const ESTACIONES_MONICA = [
  { id: 'Kanata', nombre: 'Kanata (Av. 6 de Agosto / Zona Sur)' },
  { id: 'SEMAPA', nombre: 'SEMAPA (Av. Circunvalación / Zona Norte)' },
]

function formatNum(val, decimals = 2) {
  if (val === null || val === undefined || isNaN(val)) return '—'
  return Number(val).toLocaleString('es-BO', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  })
}

function formatSigned(val, decimals = 2) {
  if (val === null || val === undefined || isNaN(val)) return '—'
  const prefix = val > 0 ? '+' : ''
  return prefix + formatNum(val, decimals)
}

export function DetectiveTendenciasScreen({
  selectedZoneId = 'distrito-1',
  onSelectZone,
}) {
  const { datos: tj, cargando, error } = useJSON('tendencias_distritos.json')

  // Variable seleccionada (NDVI por defecto para toda la pantalla)
  const [selectedVarId, setSelectedVarId] = useState('ndvi')
  const varConfig = VARIABLES_CONFIG[selectedVarId] || VARIABLES_CONFIG.ndvi

  // Rango de años activo personalizado (si es null, usa minYear y maxYear de la variable)
  const [customRange, setCustomRange] = useState(null)

  const desdeAnio = customRange
    ? Math.max(varConfig.minYear, Math.min(varConfig.maxYear, customRange.desde))
    : varConfig.minYear
  const hastaAnio = customRange
    ? Math.max(desdeAnio, Math.min(varConfig.maxYear, customRange.hasta))
    : varConfig.maxYear

  // Interruptor Quitar ciclo estacional (anomalías)
  const [quitarEstacional, setQuitarEstacional] = useState(false)

  // Selector de estación para PM10
  const [selectedStation, setSelectedStation] = useState('Kanata')

  // Estado hover interactivo para el gráfico SVG
  const [hoveredPoint, setHoveredPoint] = useState(null)

  // Obtener número de distrito (1 a 15)
  const districtNum = useMemo(() => {
    const num = parseInt(String(selectedZoneId || '').replace('distrito-', ''), 10)
    return isNaN(num) || num < 1 || num > 15 ? 1 : num
  }, [selectedZoneId])

  const districtData = useMemo(() => {
    if (!tj || !tj.distritos) return null
    return tj.distritos.find((d) => d.id === districtNum) || tj.distritos[0]
  }, [tj, districtNum])

  const activeZoneInfo = useMemo(() => {
    return (
      COCHABAMBA_ZONES.find((z) => z.id === `distrito-${districtNum}`) || {
        name: `Distrito ${districtNum}`,
        shortName: `D${districtNum}`,
      }
    )
  }, [districtNum])

  // Extraer serie objetivo según el tipo de variable
  const rawTargetSeries = useMemo(() => {
    if (!tj) return []

    if (varConfig.tipo === 'estacion') {
      const est = tj.estaciones?.find((e) => e.nombre.toLowerCase().includes(selectedStation.toLowerCase()))
      if (!est || !est.serie) return []
      return est.serie.map((item) => ({ fecha: item.fecha, valor: item.pm10 }))
    }

    if (varConfig.tipo === 'ciudad_anual') {
      if (!tj.ciudad || !tj.ciudad.anual) return []
      return tj.ciudad.anual.map((item) => ({
        fecha: String(item.anio),
        valor: item[varConfig.key],
      }))
    }

    if (varConfig.tipo === 'ciudad_focos') {
      if (!tj.ciudad || !tj.ciudad.focos_mensual) return []
      return tj.ciudad.focos_mensual.map((item) => ({
        fecha: item.fecha,
        valor: item[varConfig.key],
      }))
    }

    if (varConfig.tipo === 'anual') {
      if (!districtData || !districtData.anual) return []
      return districtData.anual
        .filter((item) => item[varConfig.key] !== undefined && item[varConfig.key] !== null)
        .map((item) => ({ fecha: String(item.anio), valor: item[varConfig.key] }))
    }

    // Mensual distrital
    if (!districtData || !districtData.serie) return []
    return districtData.serie.map((item) => ({
      fecha: item.fecha,
      valor: item[varConfig.key],
    }))
  }, [tj, districtData, varConfig, selectedStation])

  // Serie filtrada por rango de años
  const filteredSeries = useMemo(() => {
    if (!rawTargetSeries || rawTargetSeries.length === 0) return []
    return rawTargetSeries.filter((d) => {
      const y = parseInt(String(d.fecha).split('-')[0], 10)
      return y >= desdeAnio && y <= hastaAnio
    })
  }, [rawTargetSeries, desdeAnio, hastaAnio])

  // Cálculo de anomalías si está activo el interruptor y la variable es mensual
  const seriesToDisplay = useMemo(() => {
    if (!quitarEstacional || varConfig.tipo === 'anual' || varConfig.tipo === 'ciudad_anual') {
      return filteredSeries
    }

    const validos = filteredSeries.filter(
      (d) => d && d.valor !== null && d.valor !== undefined && !isNaN(Number(d.valor))
    )
    const mesSum = Array(13).fill(0)
    const mesCount = Array(13).fill(0)

    for (const d of validos) {
      const mes = parseInt(String(d.fecha).split('-')[1], 10)
      if (!isNaN(mes) && mes >= 1 && mes <= 12) {
        mesSum[mes] += Number(d.valor)
        mesCount[mes] += 1
      }
    }

    const mesMean = mesSum.map((s, m) => (mesCount[m] > 0 ? s / mesCount[m] : 0))

    return filteredSeries.map((d) => {
      if (!d || d.valor === null || d.valor === undefined || isNaN(Number(d.valor))) {
        return { ...d, valor: null }
      }
      const mes = parseInt(String(d.fecha).split('-')[1], 10)
      const mMean = !isNaN(mes) && mes >= 1 && mes <= 12 ? mesMean[mes] : 0
      return {
        ...d,
        valor: +(d.valor - mMean).toFixed(varConfig.decimals),
        valorOriginal: d.valor,
      }
    })
  }, [filteredSeries, quitarEstacional, varConfig])

  // Cálculo estadístico con tendencias.js
  const statResult = useMemo(() => {
    if (!filteredSeries || filteredSeries.length < 2) {
      return {
        sen: 0,
        mk: { S: 0, Z: 0, p: 1, tendencia: 'sin tendencia' },
        lineal: { pendiente: 0, ic95: [0, 0], p: 1 },
        cambioTotal: 0,
        mesesValidos: 0,
      }
    }
    return resumenTendencia(filteredSeries, desdeAnio, hastaAnio)
  }, [filteredSeries, desdeAnio, hastaAnio])

  // Cálculo de tendencias para los 15 distritos (para el mapa y las barras)
  const allDistrictsStats = useMemo(() => {
    if (!tj || !tj.distritos || varConfig.hideMap) return []

    return tj.distritos.map((dist) => {
      let s = []
      if (varConfig.tipo === 'anual') {
        s = (dist.anual || [])
          .filter((item) => item[varConfig.key] !== undefined && item[varConfig.key] !== null)
          .map((item) => ({ fecha: String(item.anio), valor: item[varConfig.key] }))
      } else {
        s = (dist.serie || []).map((item) => ({
          fecha: item.fecha,
          valor: item[varConfig.key],
        }))
      }

      const res = resumenTendencia(s, desdeAnio, hastaAnio)
      const isSig = res.mk.p < 0.05
      let colorClass = 'gray'
      let hexColor = '#64748B' // Gris si no es significativa

      if (isSig) {
        if (res.sen > 0) {
          colorClass = 'red'
          hexColor = '#EF4444' // Rojo si sube
        } else if (res.sen < 0) {
          colorClass = 'blue'
          hexColor = '#38BDF8' // Azul si baja
        }
      }

      return {
        id: dist.id,
        nombre: dist.nombre || `Distrito ${dist.id}`,
        shortLabel: `D${dist.id}`,
        sen: res.sen,
        mk: res.mk,
        lineal: res.lineal,
        cambioTotal: res.cambioTotal,
        isSig,
        colorClass,
        hexColor,
      }
    })
  }, [tj, varConfig, desdeAnio, hastaAnio])

  // Lista ordenada para las barras horizontales
  const sortedDistricts = useMemo(() => {
    return [...allDistrictsStats].sort((a, b) => b.sen - a.sen)
  }, [allDistrictsStats])

  // Máximo absoluto de Sen para escalar el ancho de las barras
  const maxAbsSen = useMemo(() => {
    if (sortedDistricts.length === 0) return 1
    const maxVal = Math.max(...sortedDistricts.map((d) => Math.abs(d.sen)))
    return maxVal > 0 ? maxVal : 1
  }, [sortedDistricts])

  // Aviso metodológico contextual
  const avisoMetodologico = useMemo(() => {
    if (!tj || !tj.meta) return null

    if (varConfig.id === 'lst') return tj.meta.nota_lst
    if (varConfig.id === 't2m') return tj.meta.nota_t2m
    if (varConfig.id === 'aod') return tj.meta.nota_aod
    if (varConfig.id === 'lluvia') return tj.meta.nota_lluvia
    if (varConfig.id === 'lst_landsat') return tj.meta.nota_lst_landsat
    if (varConfig.id === 'lst_noche') return tj.meta.nota_lst_noche
    if (varConfig.avisoKey === 'nota_focos') return tj.meta.nota_focos
    if (varConfig.tipo === 'ciudad_anual') return tj.meta.nota_ciudad
    if (varConfig.id === 'pm10') {
      return 'Datos continuos de las estaciones de calidad del aire GAMC (Red MÓNICA). La guía de la OMS recomienda no superar 45 µg/m³ en 24 horas.'
    }
    if (varConfig.id === 'construido_pct') {
      return 'Superficie construida a partir de la grilla satelital GHSL (100 m) de la Comisión Europea (2000–2025).'
    }

    return 'Datos de vegetación MODIS (250 m) procesados mensualmente. La tendencia se evalúa mediante Mann-Kendall estacional y pendiente de Sen.'
  }, [tj, varConfig])

  // Lista de años posibles para los selectores
  const availableYears = useMemo(() => {
    const list = []
    for (let y = varConfig.minYear; y <= varConfig.maxYear; y++) {
      list.push(y)
    }
    return list
  }, [varConfig.minYear, varConfig.maxYear])

  // Geometría y cálculo del gráfico SVG
  const chartLayout = useMemo(() => {
    const W = 640
    const H = 270
    const padL = 52
    const padR = 20
    const padT = 24
    const padB = 34

    const validPoints = seriesToDisplay.filter(
      (d) => d && d.valor !== null && d.valor !== undefined && !isNaN(d.valor)
    )

    if (validPoints.length === 0) {
      return { W, H, padL, padR, padT, padB, points: [], trendLine: null, yMin: 0, yMax: 1, yTicks: [] }
    }

    const values = validPoints.map((p) => p.valor)
    let yMin = Math.min(...values)
    let yMax = Math.max(...values)

    // Margen holgado vertical
    const range = yMax - yMin || 0.1
    yMin -= range * 0.08
    yMax += range * 0.08

    const plotW = W - padL - padR
    const plotH = H - padT - padB

    const points = validPoints.map((p, idx) => {
      const x = padL + (idx / Math.max(1, validPoints.length - 1)) * plotW
      const y = padT + plotH - ((p.valor - yMin) / (yMax - yMin)) * plotH
      return { ...p, x, y, idx }
    })

    // Construcción de la línea de tendencia basada en la regresión lineal
    let trendLine = null
    if (points.length >= 2 && statResult && statResult.lineal) {
      const n = points.length
      const meanT = (n - 1) / 2
      const meanY = values.reduce((a, b) => a + b, 0) / n
      // Pendiente por punto
      const mStep = (statResult.sen / (varConfig.tipo === 'anual' || varConfig.tipo === 'ciudad_anual' ? 1 : 12)) || 0

      const yStartVal = meanY - mStep * meanT
      const yEndVal = meanY + mStep * (n - 1 - meanT)

      const startY = padT + plotH - ((yStartVal - yMin) / (yMax - yMin)) * plotH
      const endY = padT + plotH - ((yEndVal - yMin) / (yMax - yMin)) * plotH

      trendLine = {
        x1: points[0].x,
        y1: Math.max(padT - 10, Math.min(H - padB + 10, startY)),
        x2: points[points.length - 1].x,
        y2: Math.max(padT - 10, Math.min(H - padB + 10, endY)),
        yStartVal,
        yEndVal,
      }
    }

    // Ticks para el eje Y (4 niveles)
    const yTicks = [0, 0.33, 0.66, 1].map((ratio) => {
      const val = yMin + ratio * (yMax - yMin)
      const y = padT + plotH - ratio * plotH
      return { val, y }
    })

    // Ticks para el eje X (Años)
    const yearSpan = hastaAnio - desdeAnio
    const step = yearSpan > 15 ? 5 : yearSpan > 7 ? 2 : 1
    const xTicks = []
    for (let y = desdeAnio; y <= hastaAnio; y += step) {
      const matchIdx = points.findIndex((pt) => pt.fecha.startsWith(String(y)))
      if (matchIdx !== -1) {
        xTicks.push({ year: y, x: points[matchIdx].x })
      }
    }

    return { W, H, padL, padR, padT, padB, points, trendLine, yMin, yMax, yTicks, xTicks }
  }, [seriesToDisplay, statResult, desdeAnio, hastaAnio, varConfig])

  if (cargando) {
    return (
      <div className="neo-screen">
        <div className="detective-screen">
          <div className="detective-controls-card">
            <span style={{ color: 'var(--theme-text-secondary)', fontSize: '0.9rem' }}>
              Cargando series multitemporales de tendencias...
            </span>
          </div>
        </div>
      </div>
    )
  }

  if (error || !tj) {
    return (
      <div className="neo-screen">
        <div className="detective-screen">
          <div className="detective-notice-bar">
            <AlertCircle size={18} color="#D95757" />
            <span>Datos en proceso: {error || 'No se pudo cargar tendencias_distritos.json'}</span>
          </div>
        </div>
      </div>
    )
  }

  const isSignificativo = statResult.mk.p < 0.05
  const isAnnualVar = varConfig.tipo === 'anual' || varConfig.tipo === 'ciudad_anual'

  // Frase automática de resumen
  let verboCambio = 'se mantuvo estable'
  if (statResult.cambioTotal > 0.00001) verboCambio = 'aumentó'
  else if (statResult.cambioTotal < -0.00001) verboCambio = 'disminuyó'

  const targetEntityName =
    varConfig.tipo === 'estacion'
      ? `la Estación ${selectedStation}`
      : varConfig.tipo === 'ciudad_focos'
      ? 'la cuenca del Tunari y Cochabamba'
      : varConfig.tipo === 'ciudad_anual'
      ? 'la ciudad de Cochabamba'
      : activeZoneInfo.name

  return (
    <div className="neo-screen">
      <div className="detective-screen">
        {/* Encabezado */}
        <div className="detective-header">
          <div className="detective-title-row">
            <h2 className="detective-title">
              <TrendingUp size={22} color="var(--color-icon)" strokeWidth={1.75} />
              Detective de tendencias
            </h2>
          </div>
          <p className="detective-subtitle">
            Descubre si una variable está cambiando en tu distrito y si el cambio es real.
          </p>
        </div>

        {/* Barra de Controles */}
        <div className="detective-controls-card">
          <div className="detective-controls-group">
            {/* Selector de Variable agrupada en 3 temas */}
            <div className="detective-control-field">
              <label htmlFor="select-variable" className="detective-control-label">
                <Layers size={13} color="var(--color-icon)" />
                Variable
              </label>
              <select
                id="select-variable"
                className="detective-select"
                value={selectedVarId}
                onChange={(e) => {
                  setSelectedVarId(e.target.value)
                  setCustomRange(null)
                  setQuitarEstacional(false)
                }}
              >
                <optgroup label="Calor">
                  <option value="lst_landsat">Calor del suelo de día · Landsat 2013–2025</option>
                  <option value="lst">Calor del suelo de día · MODIS 2001–2019</option>
                  <option value="lst_noche">Calor del suelo de noche · MODIS Aqua 2003–2021</option>
                  <option value="dias_calor_extremo">Días de calor extremo por año (regional)</option>
                  <option value="t2m">Temperatura del aire</option>
                </optgroup>
                <optgroup label="Agua">
                  <option value="lluvia">Lluvia mensual</option>
                  <option value="dias_lluvia_fuerte">Días de lluvia fuerte por año</option>
                  <option value="lluvia_max_dia">Lluvia máxima en un día por año</option>
                  <option value="construido_pct">Superficie construida (%)</option>
                </optgroup>
                <optgroup label="Vegetación y aire">
                  <option value="ndvi">NDVI (vegetación)</option>
                  <option value="aod">AOD (polvo y humo en el aire)</option>
                  <option value="pm10">PM10 en estaciones</option>
                  <option value="focos_incendio">Focos de incendio · Parque Tunari</option>
                  <option value="focos_region">Focos de incendio · Región 150 km</option>
                </optgroup>
              </select>
            </div>

            {/* Selector de Distrito o Estación */}
            {varConfig.id === 'pm10' ? (
              <div className="detective-control-field">
                <label htmlFor="select-station" className="detective-control-label">
                  <MapPin size={13} color="var(--color-icon)" />
                  Estación
                </label>
                <select
                  id="select-station"
                  className="detective-select"
                  value={selectedStation}
                  onChange={(e) => setSelectedStation(e.target.value)}
                >
                  {ESTACIONES_MONICA.map((est) => (
                    <option key={est.id} value={est.id}>
                      {est.nombre}
                    </option>
                  ))}
                </select>
              </div>
            ) : varConfig.tipo === 'ciudad_anual' || varConfig.tipo === 'ciudad_focos' ? (
              <div className="detective-control-field">
                <span className="detective-control-label">
                  <MapPin size={13} color="var(--color-icon)" />
                  Ámbito
                </span>
                <span className="detective-select" style={{ cursor: 'default', opacity: 0.85 }}>
                  Toda la ciudad (Regional)
                </span>
              </div>
            ) : (
              <div className="detective-control-field">
                <label htmlFor="select-district" className="detective-control-label">
                  <MapPin size={13} color="var(--color-icon)" />
                  Distrito
                </label>
                <select
                  id="select-district"
                  className="detective-select"
                  value={selectedZoneId}
                  onChange={(e) => onSelectZone && onSelectZone(e.target.value)}
                >
                  {COCHABAMBA_ZONES.map((z) => (
                    <option key={z.id} value={z.id}>
                      {z.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Selector de Rango de Años: Desde y Hasta */}
            <div className="detective-control-field">
              <span className="detective-control-label">
                <Calendar size={13} color="var(--color-icon)" />
                Periodo
              </span>
              <div className="detective-years-row">
                <select
                  aria-label="Año de inicio"
                  className="detective-select"
                  style={{ minWidth: '78px' }}
                  value={desdeAnio}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10)
                    setCustomRange({ desde: val, hasta: Math.max(val, hastaAnio) })
                  }}
                >
                  {availableYears.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
                <span className="detective-years-sep">a</span>
                <select
                  aria-label="Año de fin"
                  className="detective-select"
                  style={{ minWidth: '78px' }}
                  value={hastaAnio}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10)
                    setCustomRange({ desde: Math.min(desdeAnio, val), hasta: val })
                  }}
                >
                  {availableYears.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Interruptor: Quitar ciclo estacional (solo si es mensual) */}
          {!isAnnualVar && (
            <label className="detective-toggle-field">
              <input
                type="checkbox"
                className="detective-toggle-checkbox"
                checked={quitarEstacional}
                onChange={(e) => setQuitarEstacional(e.target.checked)}
              />
              <span className="detective-toggle-text">Quitar ciclo estacional (anomalías)</span>
            </label>
          )}
        </div>

        {/* Tarjetas (4) */}
        <div className="detective-kpi-grid">
          {/* Tarjeta 1: Cambio por año (Sen) */}
          <div className="detective-kpi-card">
            <div className="detective-kpi-head">
              <span className="detective-kpi-label">Cambio por año (Sen)</span>
              {statResult.sen > 0 ? (
                <TrendingUp size={16} color="#EF4444" strokeWidth={1.75} />
              ) : statResult.sen < 0 ? (
                <TrendingDown size={16} color="#38BDF8" strokeWidth={1.75} />
              ) : (
                <Minus size={16} color="var(--color-icon)" strokeWidth={1.75} />
              )}
            </div>
            <div className="detective-kpi-val">
              {formatSigned(statResult.sen, varConfig.decimals)}
              <span className="detective-kpi-unit">{varConfig.unidad}</span>
            </div>
            <div className="detective-kpi-sub">
              Pendiente robusta mediana calculada con el estimador de Theil-Sen
            </div>
          </div>

          {/* Tarjeta 2: ¿Es significativo? */}
          <div className="detective-kpi-card">
            <div className="detective-kpi-head">
              <span className="detective-kpi-label">¿Es significativo?</span>
              {isSignificativo ? (
                <CheckCircle2 size={16} color="#10B981" strokeWidth={1.75} />
              ) : (
                <XCircle size={16} color="var(--color-icon)" strokeWidth={1.75} />
              )}
            </div>
            <div className="detective-kpi-val">
              {isSignificativo ? (
                <span className="badge-sig-yes">Sí</span>
              ) : (
                <span className="badge-sig-no">No</span>
              )}
              <span className="detective-kpi-unit">
                {statResult.mk.p < 0.001
                  ? 'p < 0,001'
                  : `p = ${formatNum(statResult.mk.p, 3)}`}
              </span>
            </div>
            <div className="detective-kpi-sub">
              {isSignificativo
                ? 'Tendencia real confirmada por prueba Mann-Kendall (p < 0,05)'
                : 'La variación observada puede deberse al azar o ruido interanual'}
            </div>
          </div>

          {/* Tarjeta 3: Rango probable (IC 95 %) */}
          <div className="detective-kpi-card">
            <div className="detective-kpi-head">
              <span className="detective-kpi-label">Rango probable (IC 95 %)</span>
              <Sliders size={16} color="var(--color-icon)" strokeWidth={1.75} />
            </div>
            <div className="detective-kpi-val" style={{ fontSize: '1.2rem' }}>
              [{formatSigned(statResult.lineal.ic95[0], varConfig.decimals)},{' '}
              {formatSigned(statResult.lineal.ic95[1], varConfig.decimals)}]
            </div>
            <div className="detective-kpi-sub">
              Regresión lineal: {formatSigned(statResult.lineal.pendiente, varConfig.decimals)}{' '}
              {varConfig.unidad} (p ={' '}
              {statResult.lineal.p < 0.001 ? '< 0,001' : formatNum(statResult.lineal.p, 3)})
            </div>
          </div>

          {/* Tarjeta 4: Cambio total del periodo */}
          <div className="detective-kpi-card">
            <div className="detective-kpi-head">
              <span className="detective-kpi-label">Cambio total del periodo</span>
              <Calendar size={16} color="var(--color-icon)" strokeWidth={1.75} />
            </div>
            <div className="detective-kpi-val">
              {formatSigned(statResult.cambioTotal, varConfig.decimals)}
              <span className="detective-kpi-unit">{varConfig.unidadTotal}</span>
            </div>
            <div className="detective-kpi-sub">
              Impacto acumulado entre {desdeAnio} y {hastaAnio} ({hastaAnio - desdeAnio + 1} años)
            </div>
          </div>
        </div>

        {/* Centro: Gráfico temporal + Mapa */}
        <div
          className={`detective-center-grid ${
            varConfig.hideMap ? 'is-fullwidth' : ''
          }`}
        >
          {/* Panel Izquierdo: Gráfico de línea */}
          <div className="detective-panel-box">
            <div className="detective-panel-head">
              <h3 className="detective-panel-title">
                <TrendingUp size={16} color="var(--color-icon)" />
                {varConfig.nombre} · {quitarEstacional ? 'Anomalías' : 'Serie temporal'}
              </h3>
              <div className="detective-chart-legend">
                <span>
                  <span
                    className="detective-legend-dot"
                    style={{ background: '#38BDF8' }}
                  />{' '}
                  {quitarEstacional ? 'Anomalía' : 'Observación'}
                </span>
                <span>
                  <span
                    className="detective-legend-line"
                    style={{ background: '#F59E0B' }}
                  />{' '}
                  Línea de tendencia
                </span>
              </div>
            </div>

            <div className="detective-svg-chart-container">
              <svg
                viewBox={`0 0 ${chartLayout.W} ${chartLayout.H}`}
                className="detective-svg-chart"
                onMouseLeave={() => setHoveredPoint(null)}
              >
                {/* Cuadrícula horizontal */}
                {chartLayout.yTicks.map((tick, i) => (
                  <g key={i}>
                    <line
                      x1={chartLayout.padL}
                      y1={tick.y}
                      x2={chartLayout.W - chartLayout.padR}
                      y2={tick.y}
                      stroke="var(--theme-border-subtle)"
                      strokeDasharray="3 3"
                    />
                    <text
                      x={chartLayout.padL - 8}
                      y={tick.y + 4}
                      fill="var(--theme-text-muted)"
                      fontSize="10"
                      textAnchor="end"
                      fontFamily="inherit"
                    >
                      {formatNum(tick.val, varConfig.decimals > 2 ? 3 : 1)}
                    </text>
                  </g>
                ))}

                {/* Eje X (Años) */}
                {chartLayout.xTicks.map((tick) => (
                  <g key={tick.year}>
                    <line
                      x1={tick.x}
                      y1={chartLayout.H - chartLayout.padB}
                      x2={tick.x}
                      y2={chartLayout.H - chartLayout.padB + 4}
                      stroke="var(--theme-border)"
                    />
                    <text
                      x={tick.x}
                      y={chartLayout.H - chartLayout.padB + 16}
                      fill="var(--theme-text-muted)"
                      fontSize="10"
                      textAnchor="middle"
                      fontFamily="inherit"
                    >
                      {tick.year}
                    </text>
                  </g>
                ))}

                {/* Línea de tendencia lineal */}
                {chartLayout.trendLine && (
                  <line
                    x1={chartLayout.trendLine.x1}
                    y1={chartLayout.trendLine.y1}
                    x2={chartLayout.trendLine.x2}
                    y2={chartLayout.trendLine.y2}
                    stroke="#F59E0B"
                    strokeWidth="2.5"
                    strokeDasharray="4 3"
                  />
                )}

                {/* Línea principal de la serie */}
                {chartLayout.points.length > 1 && (
                  <path
                    d={chartLayout.points
                      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
                      .join(' ')}
                    fill="none"
                    stroke="#38BDF8"
                    strokeWidth={isAnnualVar ? 2.5 : 1.7}
                  />
                )}

                {/* Puntos (si es anual o pocos meses) */}
                {(isAnnualVar || chartLayout.points.length < 50) &&
                  chartLayout.points.map((p) => (
                    <circle
                      key={p.fecha}
                      cx={p.x}
                      cy={p.y}
                      r={isAnnualVar ? 4 : 2.5}
                      fill="#38BDF8"
                      stroke="var(--theme-card-bg)"
                      strokeWidth="1.5"
                    />
                  ))}

                {/* Zonas interactivas invisibles para hover */}
                {chartLayout.points.map((p) => (
                  <rect
                    key={`hit-${p.fecha}`}
                    x={p.x - 4}
                    y={chartLayout.padT}
                    width={8}
                    height={chartLayout.H - chartLayout.padT - chartLayout.padB}
                    fill="transparent"
                    style={{ cursor: 'crosshair' }}
                    onMouseEnter={() => setHoveredPoint(p)}
                  />
                ))}

                {/* Tooltip interactivo al pasar el cursor */}
                {hoveredPoint && (
                  <g>
                    <line
                      x1={hoveredPoint.x}
                      y1={chartLayout.padT}
                      x2={hoveredPoint.x}
                      y2={chartLayout.H - chartLayout.padB}
                      stroke="var(--theme-accent)"
                      strokeWidth="1"
                      strokeDasharray="2 2"
                    />
                    <circle
                      cx={hoveredPoint.x}
                      cy={hoveredPoint.y}
                      r="5"
                      fill="#F59E0B"
                      stroke="#FFFFFF"
                      strokeWidth="2"
                    />
                    <g
                      transform={`translate(${Math.min(
                        chartLayout.W - 130,
                        Math.max(chartLayout.padL + 10, hoveredPoint.x - 60)
                      )}, ${chartLayout.padT + 10})`}
                    >
                      <rect
                        width="120"
                        height="40"
                        rx="6"
                        fill="var(--theme-surface)"
                        stroke="var(--theme-border)"
                        filter="drop-shadow(0 2px 6px rgba(0,0,0,0.25))"
                      />
                      <text
                        x="60"
                        y="15"
                        fill="var(--theme-text-muted)"
                        fontSize="9.5"
                        textAnchor="middle"
                        fontFamily="inherit"
                      >
                        {hoveredPoint.fecha}
                      </text>
                      <text
                        x="60"
                        y="30"
                        fill="var(--theme-text)"
                        fontSize="11"
                        fontWeight="700"
                        textAnchor="middle"
                        fontFamily="inherit"
                      >
                        {formatNum(hoveredPoint.valor, varConfig.decimals)} {varConfig.unidadTotal}
                      </text>
                    </g>
                  </g>
                )}
              </svg>
            </div>
          </div>

          {/* Panel Derecho: Mapa de los 15 distritos (si corresponde) */}
          {!varConfig.hideMap && (
            <div className="detective-panel-box">
              <div className="detective-panel-head">
                <h3 className="detective-panel-title">
                  <MapPin size={16} color="var(--color-icon)" />
                  Valle de Cochabamba · 15 Distritos
                </h3>
                <span style={{ fontSize: '0.74rem', color: 'var(--theme-text-muted)' }}>
                  Clic para seleccionar distrito
                </span>
              </div>

              <div className="detective-svg-map-container">
                <svg viewBox="0 0 740 560" className="detective-svg-map">
                  {allDistrictsStats.map((dist) => {
                    const zoneKey = `distrito-${dist.id}`
                    const shape = COCHABAMBA_DISTRICT_SVGS[zoneKey]
                    if (!shape) return null

                    const isSelected = zoneKey === selectedZoneId

                    return (
                      <g
                        key={zoneKey}
                        className="detective-map-district"
                        onClick={() => onSelectZone && onSelectZone(zoneKey)}
                      >
                        <path
                          d={shape.path}
                          fill={dist.hexColor}
                          fillOpacity={isSelected ? 0.9 : 0.65}
                          stroke={isSelected ? '#F59E0B' : 'rgba(255, 255, 255, 0.45)'}
                          strokeWidth={isSelected ? 3.5 : 1.2}
                        />
                        <text
                          x={shape.cx}
                          y={shape.cy}
                          fill="#FFFFFF"
                          fontSize="13"
                          fontWeight="700"
                          textAnchor="middle"
                          dominantBaseline="central"
                          style={{
                            pointerEvents: 'none',
                            textShadow: '0 1px 4px rgba(0,0,0,0.85)',
                          }}
                        >
                          D{dist.id}
                        </text>
                      </g>
                    )
                  })}
                </svg>

                <div className="detective-map-legend">
                  <span>
                    <span
                      className="detective-legend-dot"
                      style={{ background: '#EF4444' }}
                    />{' '}
                    Sube (p &lt; 0,05)
                  </span>
                  <span>
                    <span
                      className="detective-legend-dot"
                      style={{ background: '#38BDF8' }}
                    />{' '}
                    Baja (p &lt; 0,05)
                  </span>
                  <span>
                    <span
                      className="detective-legend-dot"
                      style={{ background: '#64748B' }}
                    />{' '}
                    No significativo
                  </span>
                  <span>
                    <span
                      className="detective-legend-dot"
                      style={{
                        background: 'transparent',
                        border: '2px solid #F59E0B',
                      }}
                    />{' '}
                    Seleccionado
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sección Inferior: Barras "Mismo valle, tendencias distintas" y Frase */}
        {!varConfig.hideBars && sortedDistricts.length > 0 && (
          <div className="detective-bottom-card">
            <div className="detective-panel-head">
              <h3 className="detective-panel-title">
                <Layers size={16} color="var(--color-icon)" />
                Mismo valle, tendencias distintas
              </h3>
              <span style={{ fontSize: '0.74rem', color: 'var(--theme-text-muted)' }}>
                15 distritos ordenados por cambio anual (Sen)
              </span>
            </div>

            <div className="detective-bars-grid">
              {sortedDistricts.map((item) => {
                const zoneKey = `distrito-${item.id}`
                const isSelected = zoneKey === selectedZoneId
                const barWidthPct = Math.min(
                  100,
                  Math.max(6, Math.round((Math.abs(item.sen) / maxAbsSen) * 100))
                )

                return (
                  <div
                    key={zoneKey}
                    className={`detective-bar-item ${isSelected ? 'is-selected' : ''}`}
                    onClick={() => onSelectZone && onSelectZone(zoneKey)}
                  >
                    <div className="detective-bar-row">
                      <span className="detective-bar-name">
                        {item.shortLabel} · {item.nombre}
                      </span>
                      <span
                        className="detective-bar-val"
                        style={{ color: item.hexColor }}
                      >
                        {formatSigned(item.sen, varConfig.decimals)} {varConfig.unidad}
                      </span>
                    </div>
                    <div className="detective-bar-track">
                      <div
                        className="detective-bar-fill"
                        style={{
                          width: `${barWidthPct}%`,
                          backgroundColor: item.hexColor,
                        }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Frase explicativa automática */}
            <div className="detective-sentence-card">
              <Info size={18} color="var(--theme-accent)" style={{ flexShrink: 0, marginTop: 2 }} />
              <p className="detective-sentence-text">
                En el <strong>{targetEntityName}</strong>, la variable{' '}
                <strong>{varConfig.nombre}</strong> {verboCambio}{' '}
                <strong>
                  {formatNum(Math.abs(statResult.cambioTotal), varConfig.decimals)}{' '}
                  {varConfig.unidadTotal}
                </strong>{' '}
                entre {desdeAnio} y {hastaAnio}. Este cambio{' '}
                <strong>
                  {isSignificativo
                    ? 'es estadísticamente significativo (p < 0,05)'
                    : 'no es estadísticamente significativo (p ≥ 0,05)'}
                </strong>
                .
              </p>
            </div>
          </div>
        )}

        {/* Frase automática si las barras están ocultas (ej: PM10 o regional) */}
        {varConfig.hideBars && (
          <div className="detective-sentence-card">
            <Info size={18} color="var(--theme-accent)" style={{ flexShrink: 0, marginTop: 2 }} />
            <p className="detective-sentence-text">
              En <strong>{targetEntityName}</strong>, la variable{' '}
              <strong>{varConfig.nombre}</strong> {verboCambio}{' '}
              <strong>
                {formatNum(Math.abs(statResult.cambioTotal), varConfig.decimals)}{' '}
                {varConfig.unidadTotal}
              </strong>{' '}
              entre {desdeAnio} y {hastaAnio}. Este cambio{' '}
              <strong>
                {isSignificativo
                  ? 'es estadísticamente significativo (p < 0,05)'
                  : 'no es estadísticamente significativo (p ≥ 0,05)'}
              </strong>
              .
            </p>
          </div>
        )}

        {/* Aviso metodológico único por pantalla */}
        {avisoMetodologico && (
          <div className="detective-notice-bar">
            <Info size={16} color="var(--color-icon)" />
            <span>{avisoMetodologico}</span>
          </div>
        )}
      </div>
    </div>
  )
}
