import { useState, useEffect, useMemo } from 'react'
import {
  Printer,
  Download,
  FileText,
  AlertTriangle,
  Leaf,
  HeartPulse,
  BookOpen,
  Navigation,
  Clock,
  Layers,
  CheckCircle,
} from 'lucide-react'
import PopulationSourceSelector from './PopulationSourceSelector'
import { getIneFactor, formatNum } from './populationUtils'
import { COCHABAMBA_ZONES } from '../../data/internalPanelData'
import './InformeScreen.css'

function getAlertIcon(tipo) {
  const props = { size: 15, strokeWidth: 1.75 }
  switch (tipo) {
    case 'salud':
      return <HeartPulse {...props} color="#EF4444" />
    case 'ambiental':
      return <Leaf {...props} color="#10B981" />
    case 'educacion':
      return <BookOpen {...props} color="#F59E0B" />
    case 'transporte':
      return <Navigation {...props} color="#38BDF8" />
    case 'indice':
      return <AlertTriangle {...props} color="#EF4444" />
    case 'futura':
      return <Clock {...props} color="#8B5CF6" />
    default:
      return <AlertTriangle {...props} color="#F59E0B" />
  }
}

export default function InformeScreen({
  selectedZoneId,
  onSelectZone,
  _onNavigateModule,
}) {
  const [indiceData, setIndiceData] = useState(null)
  const [tendenciasData, setTendenciasData] = useState(null)
  const [sensadoVirtual, setSensadoVirtual] = useState(null)
  const [lluviasInundaciones, setLluviasInundaciones] = useState(null)
  const [basePoblacion, setBasePoblacion] = useState('ghsl') // 'ghsl' | 'ine'
  const [lightDocMode, setLightDocMode] = useState(false)
  const [downloadSuccess, setDownloadSuccess] = useState(false)

  // Carga de datos oficiales reales
  useEffect(() => {
    let isMounted = true

    fetch('/data/indice_distritos.json')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => isMounted && d && setIndiceData(d))
      .catch((err) => console.error('Error cargando indice_distritos.json:', err))

    fetch('/data/tendencias_distritos.json')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => isMounted && d && setTendenciasData(d))
      .catch((err) => console.error('Error cargando tendencias_distritos.json:', err))

    // Archivos opcionales: si no existen, su sección mostrará "Datos en proceso"
    fetch('/data/sensado_virtual.json')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => isMounted && d && setSensadoVirtual(d))
      .catch(() => {})

    fetch('/data/lluvias_inundaciones.json')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => isMounted && d && setLluviasInundaciones(d))
      .catch(() => {})

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

  const distritoInfo = useMemo(() => {
    if (!indiceData?.distritos) return null
    return (
      indiceData.distritos.find((d) => parseInt(String(d.id), 10) === distNum) ||
      indiceData.distritos[0]
    )
  }, [indiceData, distNum])

  const trendInfo = useMemo(() => {
    if (!tendenciasData?.distritos) return null
    return (
      tendenciasData.distritos.find((d) => parseInt(String(d.id), 10) === distNum) ||
      null
    )
  }, [tendenciasData, distNum])

  // Factor de ajuste Censo INE 2024
  const ineFactor = useMemo(() => getIneFactor(indiceData), [indiceData])
  const pobFactor = basePoblacion === 'ine' ? ineFactor : 1

  // Cálculos dinámicos de población y servicios
  const indicadores = distritoInfo?.indicadores || {}
  const rawPersonas = indicadores.personas || 0
  const personasAjustadas = Math.round(rawPersonas * pobFactor)

  const salud1er = indicadores.salud_1er || 0
  const habPorCentroSalud = salud1er > 0 ? Math.round(personasAjustadas / salud1er) : null

  const colegios = indicadores.colegios || 0
  const habPorColegio = colegios > 0 ? Math.round(personasAjustadas / colegios) : null

  const areaVerdeM2 = indicadores.area_verde_m2 || 0
  const verdePorHab =
    personasAjustadas > 0 && areaVerdeM2 > 0
      ? areaVerdeM2 / personasAjustadas
      : indicadores.verde_por_hab || 0

  const rawPersonas2030 = indicadores.personas_2030 || 0
  const personas2030Ajustadas = Math.round(rawPersonas2030 * pobFactor)
  const crecimientoAbs = personas2030Ajustadas - personasAjustadas
  const crecimientoPct = personasAjustadas > 0 ? (crecimientoAbs / personasAjustadas) * 100 : 0

  // Datos ambientales
  const lstVal = distritoInfo?.componentes?.['Calor del suelo']?.valor ?? activeZone.lstMean ?? 24
  const ndviVal = distritoInfo?.componentes?.['Vegetación']?.valor ?? activeZone.ndviIllustrative ?? 0.18

  const ndviTrend = trendInfo?.tendencias?.ndvi
  const lstTrend = trendInfo?.tendencias?.lst

  // 1. Resumen de 3 líneas generado con los datos
  const semColor =
    distritoInfo?.semaforo === 'verde'
      ? '#22C55E'
      : distritoInfo?.semaforo === 'amarillo'
      ? '#F59E0B'
      : '#EF4444'

  const linea1Indice = `Índice socio-ambiental de ${distritoInfo?.indice ?? '—'}/100 (Semáforo ${
    distritoInfo?.semaforo ? distritoInfo.semaforo.toUpperCase() : 'AMARILLO'
  }), ocupando el puesto ${distritoInfo?.ranking ?? '—'} de los 15 distritos municipales.`

  let linea2Tendencia = ''
  if (ndviTrend?.significativa) {
    const direccion = ndviTrend.sen_pendiente_anual > 0 ? 'ganancia' : 'pérdida'
    linea2Tendencia = `Tendencia de vegetación (2001–2025): ${direccion} estadísticamente significativa de cobertura vegetal (${formatNum(
      ndviTrend.sen_pendiente_anual,
      4
    )} NDVI/año; p = ${formatNum(ndviTrend.mk_p, 4)}).`
  } else if (lstTrend?.significativa) {
    const direccion = lstTrend.sen_pendiente_anual > 0 ? 'aumento' : 'disminución'
    linea2Tendencia = `Tendencia térmica (2001–2019): ${direccion} significativo en la temperatura superficial medida por satélite (${formatNum(
      lstTrend.sen_pendiente_anual,
      3
    )} °C/año; p = ${formatNum(lstTrend.mk_p, 4)}).`
  } else {
    linea2Tendencia = `Sin tendencia de vegetación estadísticamente significativa en el periodo 2001–2025 (pendiente de Sen cercana a cero: ${formatNum(
      ndviTrend?.sen_pendiente_anual ?? 0,
      4
    )}/año; p = ${formatNum(ndviTrend?.mk_p ?? 1, 2)}).`
  }

  let linea3Alerta = ''
  if (distritoInfo?.alertas && distritoInfo.alertas.length > 0) {
    linea3Alerta = `Principal alerta prioritaria: ${distritoInfo.alertas[0].texto}`
  } else {
    linea3Alerta = 'Sin alertas críticas vigentes según los umbrales socio-ambientales municipales.'
  }

  // Exportar datos JSON oficial del distrito
  const handleDownloadJson = () => {
    const exportData = {
      metadata: {
        titulo: `Informe socio-ambiental · ${distritoInfo?.nombre || activeZone.name}`,
        municipio: 'Cochabamba, Bolivia',
        iniciativa: 'LlajtaLab · NASA Space Apps Challenge 2026',
        fecha_generacion: new Date().toISOString(),
        distrito_id: distritoInfo?.id || String(distNum),
        distrito_nombre: distritoInfo?.nombre || activeZone.name,
        fuente_poblacion_utilizada:
          basePoblacion === 'ine'
            ? 'Ajustada al Censo INE 2024'
            : 'Estimación satelital GHSL 2025',
        factor_ajuste_ine: basePoblacion === 'ine' ? ineFactor : 1,
      },
      resumen: {
        indice: distritoInfo?.indice,
        semaforo: distritoInfo?.semaforo,
        ranking: distritoInfo?.ranking,
        dimension_ambiental: distritoInfo?.dimension_ambiental,
        dimension_servicios: distritoInfo?.dimension_servicios,
        sintesis_lineas: [linea1Indice, linea2Tendencia, linea3Alerta],
      },
      ambiente: {
        lst_media_2024_celsius: Number(formatNum(lstVal, 2).replace(',', '.')),
        ndvi_medio_2024: Number(formatNum(ndviVal, 2).replace(',', '.')),
        tendencia_vegetacion_2001_2025: ndviTrend || null,
        tendencia_lst_2001_2019: lstTrend || null,
        pm10_estimado: sensadoVirtual?.pm10 || 'Datos en proceso',
        susceptibilidad_inundacion: lluviasInundaciones?.susceptibilidad || 'Datos en proceso',
      },
      servicios: {
        personas: personasAjustadas,
        centros_salud_1er_nivel: salud1er,
        habitantes_por_centro_salud: habPorCentroSalud,
        unidades_educativas: colegios,
        habitantes_por_unidad_educativa: habPorColegio,
        cobertura_salud_pct: indicadores.cobertura_salud,
        cobertura_colegio_pct: indicadores.cobertura_colegio,
        cobertura_transporte_pct: indicadores.cobertura_transporte,
        superficie_area_verde_m2: areaVerdeM2,
        area_verde_por_habitante_m2: Number(formatNum(verdePorHab, 1).replace(',', '.')),
      },
      alertas: distritoInfo?.alertas || [],
      mirada_2030: {
        tipo: 'Estimación',
        personas_2030: personas2030Ajustadas,
        crecimiento_porcentaje: Number(formatNum(crecimientoPct, 1).replace(',', '.')),
        cobertura_salud_2030_pct: indicadores.cobertura_salud_2030,
        nota: 'Estimación proyectada con grilla satelital JRC GHSL bajo escenario tendencial',
      },
      fuentes_y_limitaciones: {
        fuentes: indiceData?.meta?.fuentes || [
          'GAMC: centros de salud, unidades educativas, áreas verdes, transporte, equipamiento',
          'NASA MODIS: NDVI 2001–2025 y LST 2001–2019',
          'Landsat 8/9 y Sentinel-2: LST y NDVI 2024',
          'JRC GHSL: grilla de población 2025 y 2030',
        ],
        limitaciones: indiceData?.meta?.notas || [],
        nota_poblacion:
          indiceData?.meta?.poblacion ||
          'La población del municipio es un dato en discusión: el Censo INE 2024 registró 665.505 habitantes y la Alcaldía estimó 910.267. La grilla satelital GHSL estima unos 926 mil para 2025.',
      },
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `informe-socioambiental-distrito-${distNum}.json`
    a.click()
    URL.revokeObjectURL(url)
    setDownloadSuccess(true)
    setTimeout(() => setDownloadSuccess(false), 3000)
  }

  const [fechaHoy] = useState(() => {
    return new Date().toLocaleDateString('es-BO', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  })

  return (
    <div className="neo-screen informe-screen">
      {/* BARRA DE HERRAMIENTAS Y BOTONES (Se oculta al imprimir con @media print) */}
      <div className="informe-toolbar no-print">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--theme-text-muted)', fontWeight: 600 }}>
              Distrito del informe:
            </span>
            <select
              value={selectedZoneId}
              onChange={(e) => onSelectZone && onSelectZone(e.target.value)}
              className="mon-shared-select"
              style={{
                fontSize: '0.82rem',
                padding: '0.25rem 0.5rem',
                borderRadius: '6px',
                background: 'var(--theme-card-bg-subtle, rgba(255,255,255,0.05))',
                color: 'var(--theme-text-primary)',
                border: '1px solid var(--theme-border)',
                fontWeight: 600,
              }}
            >
              {COCHABAMBA_ZONES.map((z) => (
                <option key={z.id} value={z.id} style={{ background: 'var(--theme-card-bg, #0b1329)' }}>
                  {z.name}
                </option>
              ))}
            </select>
          </div>

          <PopulationSourceSelector value={basePoblacion} onChange={setBasePoblacion} />
        </div>

        <div className="informe-actions">
          <button
            type="button"
            className="informe-btn"
            onClick={() => setLightDocMode((prev) => !prev)}
            title="Alternar apariencia entre hoja documental blanca y vista de plataforma"
          >
            <FileText size={15} />
            {lightDocMode ? 'Vista HUD' : 'Modo Documental Claro'}
          </button>

          <button
            type="button"
            className="informe-btn"
            onClick={handleDownloadJson}
            title="Descargar datos del distrito en archivo JSON estructurado"
          >
            <Download size={15} />
            {downloadSuccess ? '¡Descargado!' : 'Descargar datos (JSON)'}
          </button>

          <button
            type="button"
            className="informe-btn informe-btn-primary"
            onClick={() => window.print()}
            title="Imprimir informe en papel o exportar como PDF limpio"
          >
            <Printer size={15} />
            Imprimir / Guardar PDF
          </button>
        </div>
      </div>

      {/* HOJA DE INFORME TÉCNICO OFICIAL */}
      <article
        className={`informe-doc-sheet ${lightDocMode ? 'is-light-doc' : ''}`}
        id="informe-documento-oficial"
      >
        {/* =========================================================================
            SECCIÓN 1. ENCABEZADO OFICIAL
           ========================================================================= */}
        <header className="informe-section">
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              gap: '1rem',
              flexWrap: 'wrap',
            }}
          >
            <div>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: 'var(--theme-accent, #38BDF8)',
                  display: 'block',
                  marginBottom: '0.2rem',
                }}
              >
                LlajtaLab · NASA Space Apps Challenge 2026 · Cochabamba
              </span>
              <h1
                style={{
                  margin: 0,
                  fontSize: '1.65rem',
                  fontWeight: 800,
                  letterSpacing: '-0.02em',
                  lineHeight: 1.2,
                }}
              >
                Informe socio-ambiental · {distritoInfo?.nombre || activeZone.name}
              </h1>
              <p
                className="informe-text-muted"
                style={{ margin: '0.35rem 0 0 0', fontSize: '0.84rem' }}
              >
                Fecha de emisión: {fechaHoy} · Municipio de Cochabamba · Sistema MICROCLIMA
              </p>
            </div>

            <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              <span
                className="informe-badge"
                style={{
                  background: `${semColor}18`,
                  color: semColor,
                  borderColor: `${semColor}55`,
                  alignSelf: 'flex-end',
                }}
              >
                Semáforo {distritoInfo?.semaforo ? distritoInfo.semaforo.toUpperCase() : 'AMARILLO'} (Nota: {distritoInfo?.indice ?? '—'}/100)
              </span>
              <span
                className="informe-text-muted"
                style={{ fontSize: '0.73rem', fontStyle: 'italic' }}
              >
                Población base: {basePoblacion === 'ine' ? 'Ajustada Censo INE 2024' : 'Estimación satelital GHSL 2025'}
              </span>
            </div>
          </div>
        </header>

        {/* =========================================================================
            SECCIÓN 2. RESUMEN DE 3 LÍNEAS GENERADO CON LOS DATOS
           ========================================================================= */}
        <section className="informe-section">
          <h2 className="informe-sec-title">
            <CheckCircle size={18} />
            2. Resumen ejecutivo del distrito
          </h2>
          <div className="informe-callout">
            <ol style={{ margin: 0, paddingLeft: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
              <li>
                <strong>Evaluación general:</strong> {linea1Indice}
              </li>
              <li>
                <strong>Dinámica ambiental:</strong> {linea2Tendencia}
              </li>
              <li>
                <strong>Prioridad de gestión:</strong> {linea3Alerta}
              </li>
            </ol>
          </div>
        </section>

        {/* =========================================================================
            SECCIÓN 3. AMBIENTE
           ========================================================================= */}
        <section className="informe-section">
          <h2 className="informe-sec-title">
            <Leaf size={18} />
            3. Diagnóstico ambiental y biofísico
          </h2>

          <table className="informe-table">
            <thead>
              <tr>
                <th style={{ width: '40%' }}>Indicador ambiental</th>
                <th style={{ width: '30%' }}>Valor observado</th>
                <th style={{ width: '30%' }}>Referencia metodológica</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Temperatura superficial diurna (LST 2024)</td>
                <td>
                  <strong>{formatNum(lstVal, 2)} °C</strong>
                </td>
                <td className="informe-text-muted">Landsat 8/9 y Sentinel-2 (media anual 2024)</td>
              </tr>
              <tr>
                <td>Vigor y cobertura vegetal (NDVI 2024)</td>
                <td>
                  <strong>{formatNum(ndviVal, 2)}</strong>
                </td>
                <td className="informe-text-muted">Sentinel-2 / MODIS (escala 0 a 1)</td>
              </tr>
              <tr>
                <td>Tendencia de vegetación (2001–2025)</td>
                <td>
                  <strong>
                    Sen: {ndviTrend ? formatNum(ndviTrend.sen_pendiente_anual, 4) : '0,0000'} / año
                  </strong>
                  <div style={{ fontSize: '0.74rem' }}>
                    Mann-Kendall p = {ndviTrend ? formatNum(ndviTrend.mk_p, 4) : '—'}{' '}
                    <span
                      style={{
                        color: ndviTrend?.significativa ? (ndviTrend.sen_pendiente_anual < 0 ? '#EF4444' : '#10B981') : 'var(--theme-text-muted)',
                        fontWeight: 600,
                      }}
                    >
                      ({ndviTrend?.significativa ? 'Significativa al 95%' : 'No significativa'})
                    </span>
                  </div>
                </td>
                <td className="informe-text-muted">MODIS MOD13Q1 (300 meses continuos 2001–2025)</td>
              </tr>
              <tr>
                <td>Calidad de aire estimada (PM10) y confianza</td>
                <td>
                  {sensadoVirtual ? (
                    <strong>{formatNum(sensadoVirtual.pm10, 2)} µg/m³ (Confianza: {sensadoVirtual.confianza})</strong>
                  ) : (
                    <span className="informe-badge" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#F59E0B', borderColor: 'rgba(245, 158, 11, 0.3)' }}>
                      Datos en proceso
                    </span>
                  )}
                </td>
                <td className="informe-text-muted">Sensado virtual satélite-terrestre Red MÓNICA</td>
              </tr>
              <tr>
                <td>Susceptibilidad a inundación y río Rocha</td>
                <td>
                  {lluviasInundaciones ? (
                    <strong>{lluviasInundaciones.susceptibilidad} · {formatNum(lluviasInundaciones.personas_rocha, 0)} hab.</strong>
                  ) : (
                    <span className="informe-badge" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#F59E0B', borderColor: 'rgba(245, 158, 11, 0.3)' }}>
                      Datos en proceso
                    </span>
                  )}
                </td>
                <td className="informe-text-muted">Modelo hidrológico y cota ribereña municipal</td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* =========================================================================
            SECCIÓN 4. SERVICIOS Y EQUIPAMIENTOS (GESTIÓN MUNICIPAL)
           ========================================================================= */}
        <section className="informe-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
            <h2 className="informe-sec-title" style={{ margin: 0 }}>
              <Navigation size={18} />
              4. Servicios básicos y equipamiento urbano
            </h2>
            <span style={{ fontSize: '0.74rem', color: 'var(--theme-text-muted)', fontStyle: 'italic' }}>
              Base poblacional: {basePoblacion === 'ine' ? 'Censo INE 2024' : 'GHSL satelital 2025'}
            </span>
          </div>

          <table className="informe-table">
            <thead>
              <tr>
                <th style={{ width: '42%' }}>Indicador de servicio / equipamiento</th>
                <th style={{ width: '28%' }}>Dato del distrito</th>
                <th style={{ width: '30%' }}>Referencia / Cobertura</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Población distrital analizada</td>
                <td>
                  <strong>{formatNum(personasAjustadas, 0)} personas</strong>
                </td>
                <td className="informe-text-muted">
                  Fuente: {basePoblacion === 'ine' ? 'Ajustada al Censo INE 2024 (F = 0,72)' : 'Grilla GHSL JRC (Comisión Europea)'}
                </td>
              </tr>
              <tr>
                <td>Centros de salud de 1er nivel</td>
                <td>
                  <strong>{salud1er} centros</strong>
                  {habPorCentroSalud !== null && (
                    <div style={{ fontSize: '0.74rem', color: habPorCentroSalud > 30000 ? '#EF4444' : 'inherit' }}>
                      {formatNum(habPorCentroSalud, 0)} hab./centro
                    </div>
                  )}
                </td>
                <td className="informe-text-muted">
                  Cobertura caminable (1.000 m): <strong>{formatNum(indicadores.cobertura_salud, 1)} %</strong>
                </td>
              </tr>
              <tr>
                <td>Unidades educativas oficiales</td>
                <td>
                  <strong>{colegios} colegios</strong>
                  {habPorColegio !== null && (
                    <div style={{ fontSize: '0.74rem' }}>
                      {formatNum(habPorColegio, 0)} hab./colegio
                    </div>
                  )}
                </td>
                <td className="informe-text-muted">
                  Cobertura caminable (1.000 m): <strong>{formatNum(indicadores.cobertura_colegio, 1)} %</strong>
                </td>
              </tr>
              <tr>
                <td>Acceso a transporte público (300 m)</td>
                <td>
                  <strong>{formatNum(indicadores.cobertura_transporte, 1)} %</strong> de vecinos
                </td>
                <td className="informe-text-muted">Rutas y paradas del GAMC a menos de 300 m</td>
              </tr>
              <tr>
                <td>Superficie de áreas verdes y plazas</td>
                <td>
                  <strong>{formatNum(areaVerdeM2 / 10000, 2)} ha</strong> ({formatNum(areaVerdeM2, 0)} m²)
                </td>
                <td className="informe-text-muted">
                  Área verde por hab.:{' '}
                  <strong style={{ color: verdePorHab < 9 ? '#EF4444' : '#10B981' }}>
                    {formatNum(verdePorHab, 1)} m²/hab.
                  </strong>{' '}
                  (OMS: ≥ 9 m²)
                </td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* =========================================================================
            SECCIÓN 5. ALERTAS DEL DISTRITO CON SUS TEXTOS
           ========================================================================= */}
        <section className="informe-section">
          <h2 className="informe-sec-title">
            <AlertTriangle size={18} />
            5. Alertas socio-ambientales identificadas
          </h2>

          {distritoInfo?.alertas && distritoInfo.alertas.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.4rem' }}>
              {distritoInfo.alertas.map((al, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.65rem',
                    padding: '0.55rem 0.85rem',
                    borderRadius: '6px',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--theme-border, rgba(255, 255, 255, 0.08))',
                    fontSize: '0.84rem',
                  }}
                >
                  <span style={{ display: 'inline-flex', flexShrink: 0 }}>
                    {getAlertIcon(al.tipo)}
                  </span>
                  <div style={{ flex: 1 }}>
                    <span
                      style={{
                        textTransform: 'uppercase',
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        letterSpacing: '0.04em',
                        color: 'var(--theme-text-muted)',
                        display: 'inline-block',
                        marginRight: '0.4rem',
                      }}
                    >
                      [{al.tipo}]
                    </span>
                    <span>{al.texto}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div
              style={{
                padding: '0.75rem 1rem',
                borderRadius: '6px',
                background: 'rgba(34, 197, 94, 0.08)',
                border: '1px solid rgba(34, 197, 94, 0.25)',
                color: '#10B981',
                fontSize: '0.84rem',
              }}
            >
              ✔ No se registran alertas socio-ambientales críticas vigentes para este distrito.
            </div>
          )}
        </section>

        {/* =========================================================================
            SECCIÓN 6. MIRADA AL 2030 (ESTIMACIÓN)
           ========================================================================= */}
        <section className="informe-section">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
            <h2 className="informe-sec-title" style={{ margin: 0 }}>
              <Clock size={18} />
              6. Mirada al 2030: Proyección y presión futura
            </h2>
            <span
              className="informe-badge"
              style={{
                background: 'rgba(139, 92, 246, 0.15)',
                color: '#A78BFA',
                borderColor: 'rgba(139, 92, 246, 0.35)',
              }}
            >
              ESTIMACIÓN
            </span>
          </div>

          <p className="informe-text-muted" style={{ fontSize: '0.8rem', margin: '0 0 0.75rem 0' }}>
            Proyección del crecimiento habitacional y su impacto en la cobertura de salud de 1er nivel si no se construyen nuevos centros:
          </p>

          <div className="informe-grid-2col">
            <div className="informe-stat-box">
              <span className="informe-text-muted" style={{ fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 600 }}>
                Expansión demográfica estimada (2025 → 2030)
              </span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginTop: '0.25rem' }}>
                <span style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                  {formatNum(personasAjustadas, 0)}
                </span>
                <span style={{ color: 'var(--color-icon)' }}>→</span>
                <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--theme-accent, #38BDF8)' }}>
                  {formatNum(personas2030Ajustadas, 0)} hab.
                </span>
              </div>
              <span style={{ fontSize: '0.76rem', color: '#10B981', display: 'block', marginTop: '0.2rem' }}>
                +{formatNum(crecimientoPct, 1)} % (+{formatNum(crecimientoAbs, 0)} personas esperadas)
              </span>
            </div>

            <div className="informe-stat-box">
              <span className="informe-text-muted" style={{ fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 600 }}>
                Cobertura salud 1er nivel sin ampliación
              </span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginTop: '0.25rem' }}>
                <span style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                  {formatNum(indicadores.cobertura_salud, 1)} %
                </span>
                <span style={{ color: 'var(--color-icon)' }}>→</span>
                <span
                  style={{
                    fontSize: '1.25rem',
                    fontWeight: 700,
                    color: (indicadores.cobertura_salud_2030 || 0) < (indicadores.cobertura_salud || 0) ? '#EF4444' : '#10B981',
                  }}
                >
                  {formatNum(indicadores.cobertura_salud_2030, 1)} %
                </span>
              </div>
              <span className="informe-text-muted" style={{ fontSize: '0.74rem', display: 'block', marginTop: '0.2rem' }}>
                Cálculo sobre grilla poblacional JRC GHSL 2030 (círculo de radio 1.000 m).
              </span>
            </div>
          </div>
        </section>

        {/* =========================================================================
            SECCIÓN 7. FUENTES Y LIMITACIONES METODOLÓGICAS
           ========================================================================= */}
        <footer className="informe-section">
          <h2 className="informe-sec-title">
            <Layers size={18} />
            7. Fuentes oficiales, metadatos y limitaciones
          </h2>

          <div style={{ fontSize: '0.78rem', lineHeight: 1.55, display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            <div>
              <strong>Fuentes de datos oficiales:</strong>
              <ul style={{ margin: '0.25rem 0 0 0', paddingLeft: '1.2rem' }} className="informe-text-muted">
                <li>
                  <strong>GAMC:</strong> Capas oficiales WMS de distritos, centros de salud de 1er nivel, unidades educativas, áreas verdes y red vial de transporte público.
                </li>
                <li>
                  <strong>NASA MODIS:</strong> Serie temporal mensual de vegetación (NDVI, 250 m) 2001–2025 y calor superficial (LST, 1 km) 2001–2019.
                </li>
                <li>
                  <strong>Landsat 8/9 y Sentinel-2:</strong> Análisis térmico y biofísico de alta resolución espacial (armonizado a 100 m) para el año 2024.
                </li>
                <li>
                  <strong>JRC GHSL (Comisión Europea):</strong> Estimación y proyección de población espacializada en grilla territorial para 2025 y 2030.
                </li>
              </ul>
            </div>

            <div>
              <strong>Limitaciones metodológicas del análisis:</strong>
              <ul style={{ margin: '0.25rem 0 0 0', paddingLeft: '1.2rem' }} className="informe-text-muted">
                <li>
                  <strong>Cobertura por proximidad:</strong> Mide distancia caminable radial haversine (1.000 m en equipamientos, 300 m en transporte). No considera horarios de atención, dotación de personal médico ni elecciones individuales del usuario.
                </li>
                <li>
                  <strong>Movilidad escolar:</strong> La cobertura de colegios es aproximada; un porcentaje significativo de estudiantes asiste a establecimientos fuera de su distrito de residencia.
                </li>
                <li>
                  <strong>Deriva orbital satelital:</strong> Desde 2020 la órbita de Terra se desplazó y pasa más temprano, lo que enfría artificialmente la temperatura medida; por ello la tendencia LST multianual solo se computa hasta 2019.
                </li>
                <li>
                  <strong>Discusión de población municipal:</strong>{' '}
                  <span style={{ fontStyle: 'italic' }}>
                    {indiceData?.meta?.poblacion ||
                      'El Censo INE 2024 registró 665.505 habitantes y la Alcaldía estimó 910.267. La grilla satelital GHSL estima unos 926 mil para 2025. El informe permite alternar dinámicamente entre ambas bases.'}
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </footer>
      </article>
    </div>
  )
}
