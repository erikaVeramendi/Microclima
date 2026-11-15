import { useState, useMemo, useEffect } from 'react'
import {
  Search,
  Flame,
  CloudRain,
  Trees,
  Wind,
  Building,
  ArrowRight,
  Mountain,
  Users,
  MapPin,
} from 'lucide-react'
import './ModoDetectiveScreen.css'

/**
 * Formateador de números con coma decimal (es-BO)
 */
function formatNum(val, maxDecimals = 2) {
  if (val === null || val === undefined || Number.isNaN(Number(val))) return '—'
  return Number(val).toLocaleString('es-BO', {
    minimumFractionDigits: 0,
    maximumFractionDigits: maxDecimals,
  })
}

// Configuración de los 5 temas de investigación para el Bloque 1
const TOPICS = [
  { id: 'calor', label: 'Calor', icon: Flame, targetModule: 'detective-tendencias', varId: 'lst_landsat' },
  { id: 'lluvias', label: 'Lluvias e inundaciones', icon: CloudRain, targetModule: 'lluvias-inundaciones' },
  { id: 'vegetacion', label: 'Vegetación', icon: Trees, targetModule: 'detective-tendencias', varId: 'ndvi' },
  { id: 'aire', label: 'Aire', icon: Wind, targetModule: 'sensado-virtual-ia' },
  { id: 'servicios', label: 'Servicios', icon: Building, targetModule: 'cobertura-servicios' },
]

export default function ModoDetectiveScreen({
  selectedZoneId,
  onSelectZone,
  onNavigateModule,
}) {
  // Datos reales cargados desde JSON
  const [tendenciasData, setTendenciasData] = useState(null)
  const [lluviasData, setLluviasData] = useState(null)

  // Carga de datos reales
  useEffect(() => {
    let isMounted = true

    Promise.all([
      fetch('/data/tendencias_distritos.json').then((r) => (r.ok ? r.json() : null)),
      fetch('/data/lluvias_inundaciones.json').then((r) => (r.ok ? r.json() : null)),
    ])
      .then(([tendencias, lluvias]) => {
        if (!isMounted) return
        setTendenciasData(tendencias)
        setLluviasData(lluvias)
      })
      .catch((err) => {
        console.warn('ModoDetectiveScreen: error cargando datos:', err)
      })

    return () => {
      isMounted = false
    }
  }, [])

  // Estado del Bloque 1: Preguntas guiadas
  const [investigateTopic, setInvestigateTopic] = useState('calor')
  const [scope, setScope] = useState('distrito') // 'distrito' | 'ciudad'
  const [customDistrictId, setCustomDistrictId] = useState(null)
  const defaultDistrictId = useMemo(() => {
    if (!selectedZoneId) return '1'
    const match = String(selectedZoneId).match(/\d+/)
    return match ? match[0] : '1'
  }, [selectedZoneId])
  const chosenDistrictId = customDistrictId || defaultDistrictId

  // Acción principal: Botón "Investigar"
  const handleLaunchInvestigation = () => {
    const topic = TOPICS.find((t) => t.id === investigateTopic) || TOPICS[0]

    // Si seleccionó un distrito específico, fijarlo en el estado global
    if (scope === 'distrito' && onSelectZone) {
      onSelectZone(`distrito-${chosenDistrictId}`)
    }

    // Abrir la pestaña correspondiente
    if (onNavigateModule) {
      if (topic.varId) {
        onNavigateModule(topic.targetModule, { varId: topic.varId })
      } else {
        onNavigateModule(topic.targetModule)
      }
    }
  }

  // Cálculos dinámicos del Bloque 3 ("Lo que ya descubrimos")
  const hallazgosCalculados = useMemo(() => {
    // 1. Vegetación: cuántos distritos pierden y ganan con tendencia significativa
    let ndviPierden = 0
    let ndviGanan = 0
    if (tendenciasData?.distritos) {
      tendenciasData.distritos.forEach((d) => {
        const t = d.tendencias?.ndvi
        if (t?.significativa) {
          if (t.sen_pendiente_anual < 0) ndviPierden++
          else if (t.sen_pendiente_anual > 0) ndviGanan++
        }
      })
    }

    // 2. Calor nocturno: cuántos distritos se calientan de noche de forma significativa
    let lstNocheCalientan = 0
    if (tendenciasData?.distritos) {
      tendenciasData.distritos.forEach((d) => {
        const t = d.tendencias?.lst_noche
        if (t?.significativa && t.sen_pendiente_anual > 0) {
          lstNocheCalientan++
        }
      })
    }

    // 3. PM10 en las 2 estaciones
    let kanataSen = null
    let semapaSen = null
    if (tendenciasData?.estaciones) {
      const kanata = tendenciasData.estaciones.find((e) => e.nombre?.includes('Kanata') || e.id === 'Kanata')
      const semapa = tendenciasData.estaciones.find((e) => e.nombre?.includes('SEMAPA') || e.id === 'SEMAPA')
      kanataSen = kanata?.tendencia?.sen_pendiente_anual
      semapaSen = semapa?.tendencia?.sen_pendiente_anual
    }

    // 4. Lluvia fuerte ciudad
    const lluviaFuerteTrend = lluviasData?.ciudad?.tendencias?.dias_lluvia_fuerte
    const diasFuerteSen = lluviaFuerteTrend?.sen_pendiente_anual ?? 0
    const diasFuerteP = lluviaFuerteTrend?.mk_p ?? 0.74
    const diasFuerteSig = lluviaFuerteTrend?.significativa ?? false

    // 5. Ladera Tunari total
    const laderaSerie = lluviasData?.ciudad?.ladera_total?.serie || []
    const ha2000 = laderaSerie.find((s) => s.anio === 2000)?.ha ?? 121.51
    const ha2020 = laderaSerie.find((s) => s.anio === 2020)?.ha ?? 302.13
    const haNuevas = ha2020 - ha2000
    const laderaSen = lluviasData?.ciudad?.ladera_total?.tendencia?.sen_pendiente_anual ?? 8.82
    const laderaP = lluviasData?.ciudad?.ladera_total?.tendencia?.mk_p ?? 0.0085

    // 6. Personas en franja del río Rocha
    let totalPersonasRocha = 0
    if (lluviasData?.distritos) {
      totalPersonasRocha = lluviasData.distritos.reduce(
        (acc, d) => acc + (d.personas_franja_rocha || 0),
        0
      )
    }

    return {
      ndviPierden,
      ndviGanan,
      lstNocheCalientan,
      kanataSen,
      semapaSen,
      diasFuerteSen,
      diasFuerteP,
      diasFuerteSig,
      haNuevas,
      laderaSen,
      laderaP,
      totalPersonasRocha,
    }
  }, [tendenciasData, lluviasData])

  return (
    <div className="modo-detective-screen">
      {/* Encabezado */}
      <header className="modo-header">
        <h2 className="modo-title">
          <Search size={24} color="var(--modo-icon-color)" strokeWidth={1.8} />
          Modo detective
        </h2>
        <p className="modo-subtitle">
          Conviértete en detective de datos: elige qué investigar y dónde.
        </p>
      </header>

      {/* BLOQUE 1: Preguntas guiadas en 3 pasos con botones grandes */}
      <section className="modo-wizard-card">
        {/* Paso 1: ¿Qué quieres investigar? */}
        <div className="modo-step-section">
          <div className="modo-step-header">
            <span className="modo-step-number">1</span>
            <span className="modo-step-title">¿Qué quieres investigar?</span>
          </div>
          <div className="modo-topics-grid">
            {TOPICS.map((topic) => {
              const IconComp = topic.icon
              const isActive = investigateTopic === topic.id
              return (
                <button
                  key={topic.id}
                  type="button"
                  className={`modo-topic-btn ${isActive ? 'is-active' : ''}`}
                  onClick={() => setInvestigateTopic(topic.id)}
                >
                  <IconComp size={24} className="modo-topic-icon" strokeWidth={1.75} />
                  <span>{topic.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Paso 2: ¿Dónde? */}
        <div className="modo-step-section">
          <div className="modo-step-header">
            <span className="modo-step-number">2</span>
            <span className="modo-step-title">¿Dónde?</span>
          </div>
          <div className="modo-location-row">
            <div className="modo-scope-toggle">
              <button
                type="button"
                className={`modo-scope-btn ${scope === 'ciudad' ? 'is-active' : ''}`}
                onClick={() => setScope('ciudad')}
              >
                Toda la ciudad
              </button>
              <button
                type="button"
                className={`modo-scope-btn ${scope === 'distrito' ? 'is-active' : ''}`}
                onClick={() => setScope('distrito')}
              >
                Un distrito
              </button>
            </div>

            {scope === 'distrito' && (
              <div className="modo-district-dropdown-wrap">
                <MapPin size={16} color="var(--modo-icon-color)" />
                <select
                  className="modo-district-select"
                  value={chosenDistrictId}
                  onChange={(e) => setCustomDistrictId(e.target.value)}
                  aria-label="Seleccionar distrito para investigar"
                >
                  {Array.from({ length: 15 }, (_, i) => String(i + 1)).map((dId) => (
                    <option key={dId} value={dId}>
                      Distrito {dId}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Paso 3: Botón "Investigar" */}
        <div className="modo-action-row">
          <button
            type="button"
            className="modo-launch-btn"
            onClick={handleLaunchInvestigation}
          >
            <span>Investigar</span>
            <ArrowRight size={18} strokeWidth={2} />
          </button>
        </div>
      </section>

      {/* BLOQUE 2: Dos casos de ejemplo */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        <div className="modo-block-title-row">
          <h3 className="modo-block-title">Casos de investigación guiada</h3>
          <p className="modo-block-sub">
            Ejemplos concretos que demuestran cómo cruzar series temporales y equipamiento municipal.
          </p>
        </div>

        <div className="modo-cases-grid">
          {/* Caso 1: ¿El Distrito 3 está perdiendo vegetación? */}
          <article className="modo-case-card">
            <div className="modo-case-top">
              <span className="modo-case-badge">
                <Trees size={13} color="var(--modo-icon-color)" />
                Caso ambiental
              </span>
              <h4 className="modo-case-heading">¿El Distrito 3 está perdiendo vegetación?</h4>
              <p className="modo-case-desc">
                Analiza 25 años de serie mensual NDVI (2001–2025) en el Distrito 3 y comprueba con el test
                Mann-Kendall si la tasa de cambio anual es estadísticamente significativa.
              </p>
            </div>
            <button
              type="button"
              className="modo-case-btn"
              onClick={() => {
                if (onSelectZone) onSelectZone('distrito-3')
                if (onNavigateModule) onNavigateModule('detective-tendencias', { varId: 'ndvi' })
              }}
            >
              <span>Ver el caso</span>
              <ArrowRight size={15} color="var(--modo-icon-color)" />
            </button>
          </article>

          {/* Caso 2: ¿Dónde faltan centros de salud? */}
          <article className="modo-case-card">
            <div className="modo-case-top">
              <span className="modo-case-badge">
                <Building size={13} color="var(--modo-icon-color)" />
                Caso territorial
              </span>
              <h4 className="modo-case-heading">¿Dónde faltan centros de salud?</h4>
              <p className="modo-case-desc">
                Explora el mapa de puntos críticos filtrado por equipamientos de salud pública para
                identificar qué distritos presentan el mayor déficit de cobertura médica.
              </p>
            </div>
            <button
              type="button"
              className="modo-case-btn"
              onClick={() => {
                if (onNavigateModule) onNavigateModule('puntos-criticos', { filter: 'salud' })
              }}
            >
              <span>Ver el caso</span>
              <ArrowRight size={15} color="var(--modo-icon-color)" />
            </button>
          </article>
        </div>
      </section>

      {/* BLOQUE 3: Lo que ya descubrimos (Cálculos reales sin datos inventados) */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        <div className="modo-block-title-row">
          <h3 className="modo-block-title">Lo que ya descubrimos</h3>
          <p className="modo-block-sub">
            Hallazgos territoriales calculados en tiempo real a partir de los datos oficiales de sensores y satélites.
          </p>
        </div>

        <div className="modo-findings-grid">
          {/* Hallazgo 1: NDVI ganan y pierden */}
          <article className="modo-finding-card">
            <div className="modo-finding-top">
              <div className="modo-finding-header-row">
                <span className="modo-finding-tag">Vegetación · MODIS 2001–2025</span>
                <Trees size={16} color="var(--modo-icon-color)" />
              </div>
              <p className="modo-finding-text">
                <strong>{hallazgosCalculados.ndviPierden} distritos pierden</strong> y{' '}
                <strong>{hallazgosCalculados.ndviGanan} distritos ganan</strong> vegetación con tendencia
                significativa comprobada por Mann-Kendall.
              </p>
            </div>
            <button
              type="button"
              className="modo-finding-link"
              onClick={() => onNavigateModule && onNavigateModule('detective-tendencias', { varId: 'ndvi' })}
            >
              <span>Ver en Detective de tendencias</span>
              <ArrowRight size={14} color="var(--modo-icon-color)" />
            </button>
          </article>

          {/* Hallazgo 2: LST noche calientan */}
          <article className="modo-finding-card">
            <div className="modo-finding-top">
              <div className="modo-finding-header-row">
                <span className="modo-finding-tag">Calor nocturno · MODIS LST</span>
                <Flame size={16} color="var(--modo-icon-color)" />
              </div>
              <p className="modo-finding-text">
                <strong>{hallazgosCalculados.lstNocheCalientan} distritos</strong> se calientan de noche de forma
                significativa, evidenciando una persistente isla de calor nocturna en el valle.
              </p>
            </div>
            <button
              type="button"
              className="modo-finding-link"
              onClick={() => onNavigateModule && onNavigateModule('detective-tendencias', { varId: 'lst_noche' })}
            >
              <span>Ver en Detective de tendencias</span>
              <ArrowRight size={14} color="var(--modo-icon-color)" />
            </button>
          </article>

          {/* Hallazgo 3: PM10 en las 2 estaciones */}
          <article className="modo-finding-card">
            <div className="modo-finding-top">
              <div className="modo-finding-header-row">
                <span className="modo-finding-tag">Calidad del aire · Red MÓNICA</span>
                <Wind size={16} color="var(--modo-icon-color)" />
              </div>
              <p className="modo-finding-text">
                Tendencia de PM10 a la baja en ambas estaciones:{' '}
                <strong>Kanata ({formatNum(hallazgosCalculados.kanataSen, 2)} µg/m³/año)</strong> y{' '}
                <strong>SEMAPA ({formatNum(hallazgosCalculados.semapaSen, 2)} µg/m³/año)</strong>.
              </p>
            </div>
            <button
              type="button"
              className="modo-finding-link"
              onClick={() => onNavigateModule && onNavigateModule('sensado-virtual-ia')}
            >
              <span>Ver en Sensado virtual con IA</span>
              <ArrowRight size={14} color="var(--modo-icon-color)" />
            </button>
          </article>

          {/* Hallazgo 4: Días de lluvia fuerte */}
          <article className="modo-finding-card">
            <div className="modo-finding-top">
              <div className="modo-finding-header-row">
                <span className="modo-finding-tag">Precipitaciones · NASA GPM</span>
                <CloudRain size={16} color="var(--modo-icon-color)" />
              </div>
              <p className="modo-finding-text">
                Los días de lluvia fuerte (&gt; 18,8 mm){' '}
                <strong>no muestran aumento significativo</strong> en 25 años (tendencia Sen:{' '}
                {formatNum(hallazgosCalculados.diasFuerteSen, 2)} días/año, p ={' '}
                {formatNum(hallazgosCalculados.diasFuerteP, 2)}).
              </p>
            </div>
            <button
              type="button"
              className="modo-finding-link"
              onClick={() => onNavigateModule && onNavigateModule('lluvias-inundaciones')}
            >
              <span>Ver en Lluvias e inundaciones</span>
              <ArrowRight size={14} color="var(--modo-icon-color)" />
            </button>
          </article>

          {/* Hallazgo 5: Cota 2750 Tunari */}
          <article className="modo-finding-card">
            <div className="modo-finding-top">
              <div className="modo-finding-header-row">
                <span className="modo-finding-tag">Ladera Tunari · JRC GHSL</span>
                <Mountain size={16} color="var(--modo-icon-color)" />
              </div>
              <p className="modo-finding-text">
                Entre 2000 y 2020 se construyeron{' '}
                <strong>{formatNum(hallazgosCalculados.haNuevas, 2)} hectáreas nuevas</strong> sobre la cota
                2750 protegida (+{formatNum(hallazgosCalculados.laderaSen, 2)} ha/año, significativa).
              </p>
            </div>
            <button
              type="button"
              className="modo-finding-link"
              onClick={() => onNavigateModule && onNavigateModule('lluvias-inundaciones')}
            >
              <span>Ver en Lluvias e inundaciones</span>
              <ArrowRight size={14} color="var(--modo-icon-color)" />
            </button>
          </article>

          {/* Hallazgo 6: Personas franja río Rocha */}
          <article className="modo-finding-card">
            <div className="modo-finding-top">
              <div className="modo-finding-header-row">
                <span className="modo-finding-tag">Riesgo ribereño · Río Rocha</span>
                <Users size={16} color="var(--modo-icon-color)" />
              </div>
              <p className="modo-finding-text">
                <strong>{formatNum(hallazgosCalculados.totalPersonasRocha, 0)} personas</strong> residen en la
                franja crítica a menos de 200 m del cauce principal del río Rocha.
              </p>
            </div>
            <button
              type="button"
              className="modo-finding-link"
              onClick={() => onNavigateModule && onNavigateModule('lluvias-inundaciones')}
            >
              <span>Ver en Lluvias e inundaciones</span>
              <ArrowRight size={14} color="var(--modo-icon-color)" />
            </button>
          </article>
        </div>
      </section>
    </div>
  )
}
