import { useState, useEffect, useRef } from 'react'
import './FloatingAiAvatar.css'
import PachaAvatarSvg from './PachaAvatarSvg'
import { COCHABAMBA_ZONES } from '../../data/internalPanelData'

// Calcula el estado de ánimo climático de Pacha según la zona o módulo activo
function getPachaMood(moduleId, zone) {
  if (moduleId === 'relaciones-ambientales') return 'smoky'
  if (zone && zone.lstMean >= 31.0) return 'hot'
  if (zone && (zone.ndviMean >= 0.27 || zone.lstMean <= 27.2)) return 'fresh'
  return 'curious'
}

// Síntesis explicativa en la voz directa y concreta de Pacha
function generateContextualExplanation(moduleId, zone, mood) {
  const zoneName = zone ? zone.name : 'Cochabamba'
  const lst = zone ? zone.lstMean : 29.6
  const ndvi = zone ? zone.ndviMean : 0.21

  if (mood === 'hot') {
    return `¡Uff, cómo quema ${zoneName}! La superficie de asfalto y calaminas alcanza ${lst} °C (LST Landsat). Faltan árboles nativos (molle y jacarandá) para absorber la radiación. Su NDVI es de apenas ${ndvi}.`
  }

  if (mood === 'fresh') {
    return `¡Qué alivio en ${zoneName}! La vegetación del pie de monte del Tunari mantiene la temperatura superficial en ${lst} °C con un vigor NDVI de ${ndvi}. Los árboles funcionan como acondicionadores de aire biológicos.`
  }

  if (mood === 'smoky') {
    return `¡Atención al aire! La Red MÓNICA del GAMC registra picos de PM10 de 61.9 µg/m³ a las 8 AM y 9 PM en la estación Kanata. La cuenca cerrada del valle genera inversión térmica y atrapa las emisiones del transporte.`
  }

  switch (moduleId) {
    case 'monitoreo-general':
    case 'centro-inteligencia':
      return `Estoy monitoreando el pulso térmico de ${zoneName}. Registra ${lst} °C de temperatura superficial terrestre. En Cochabamba tenemos una brecha de 7.9 °C entre el norte fresco y el sur árido.`

    case 'inteligencia-vegetacion':
      return `Aquí evalúo la Huella Verde y vigor fotosintético de ${zoneName} con Sentinel-2 (NDVI: ${ndvi}). Recuerda: el NDVI mide densidad de clorofila viva, no un conteo directo de árboles.`

    case 'inteligencia-termica':
      return `Este mapa muestra la temperatura de techumbres y calzada (${lst} °C LST). No es la temperatura del aire (que suele estar de 5 °C a 8 °C más baja).`

    case 'explorador-territorial':
      return `Aquí puedes explorar las más de 100 líneas de micros y trufis del GAMC. En ${zoneName}, la urbanización acelerada reemplazó suelo natural por cemento, creando nuevas islas de calor.`

    case 'planificacion-escenarios':
      return `Aquí detecto colegios y postas de salud expuestos a calor extremo en ${zoneName}. Si simulamos reforestar un 15% con molles, la temperatura bajará de 1 °C a 2 °C.`

    case 'gestion-datos':
    case 'evidencia-validacion':
      return `Auditoría científica transparente: combinamos satélites de la NASA (Landsat/Sentinel) con datos reales del GAMC. No inventamos cifras ni ocultamos vacíos por nubes del Tunari.`

    case 'investigaciones-informes':
      return `Compilo los hallazgos de ${zoneName} en un informe técnico claro y fundamentado para las autoridades municipales.`

    default:
      return `Monitoreando ${zoneName}: LST superficial ${lst} °C | NDVI de vegetación ${ndvi}.`
  }
}

// Generador de respuestas directas y concretas de Pacha (Fallback si Ollama está offline)
function answerLocally(query, zone, moduleId) {
  const q = query.toLowerCase()
  const zoneName = zone ? zone.name : 'Cochabamba'
  const lst = zone ? zone.lstMean : 29.6
  const ndvi = zone ? zone.ndviMean : 0.21

  if (q.includes('lst') || q.includes('aire') || q.includes('temperatura')) {
    return `LST es la temperatura de la superficie terrestre (asfalto, techos de calamina y suelo) captada por los sensores infrarrojos térmicos de Landsat 8/9 a 30m. No es la temperatura del aire a la sombra: en Cochabamba la superficie suele estar entre 5 °C y 10 °C más caliente que el aire debido a la radiación solar directa.`
  }

  if (q.includes('ndvi') || q.includes('vegetacion') || q.includes('arbol') || q.includes('verde')) {
    return `El NDVI se calcula con Sentinel-2 a 10m de resolución (de -1 a +1). En Cochabamba el promedio es 0.21. Un índice bajo como el de ${zoneName} (${ndvi}) indica suelo seco o edificado. No equivale al número exacto de árboles, sino al vigor fotosintético de las plantas.`
  }

  if (q.includes('monica') || q.includes('aire') || q.includes('contaminacion') || q.includes('pm10') || q.includes('pm2.5')) {
    return `La Red MÓNICA es la red de calidad del aire del GAMC. En el proyecto procesamos más de 125.000 mediciones horarias de Parque Kanata y SEMAPA. Los picos más altos ocurren de 07:00 a 09:00 y de 20:00 a 22:00 porque la inversión térmica del valle impide que los contaminantes del tráfico se dispersen.`
  }

  if (q.includes('distrito 9') || q.includes('d9') || q.includes('sur') || q.includes('caliente')) {
    return `El Distrito 9 es el sector más crítico: registra 33.1 °C de LST promedio con picos mayores a 38 °C, y un NDVI mínimo de 0.14. Se debe a calles sin arbolado, suelos áridos y techos de calamina que absorben calor todo el día.`
  }

  if (q.includes('tunari') || q.includes('norte') || q.includes('distrito 12') || q.includes('cota')) {
    return `El pie de monte del Parque Nacional Tunari (como el Distrito 12) tiene el mayor verdor (NDVI 0.32) y temperaturas superficiales más frescas (25.2 °C). La Cota 2750 es el límite ecológico vital que regula el clima de todo el valle.`
  }

  if (q.includes('escuela') || q.includes('hospital') || q.includes('desigualdad') || q.includes('vulnerab')) {
    return `El Detector de Desigualdad cruza el calor con equipamiento sensible: detectamos escuelas en los distritos 8 y 9 donde los niños juegan en patios a más de 35 °C en superficie por falta de árboles y cubiertas de sombra.`
  }

  return `En ${zoneName} tenemos ${lst} °C de temperatura superficial y un NDVI de ${ndvi}. El equilibrio microclimático depende de sustituir superficies de calamina y asfalto por corredores de árboles nativos.`
}

export default function FloatingAiAvatar({ activeModuleId, activeZone }) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [inputValue, setInputValue] = useState('')
  const [isThinking, setIsThinking] = useState(false)
  const [ollamaConnected, setOllamaConnected] = useState(false)
  const [ollamaModel, setOllamaModel] = useState(null)
  const bodyRef = useRef(null)

  const mood = getPachaMood(activeModuleId, activeZone)

  // 1. Probar conectividad real con Ollama en el puerto 11434 (vía proxy Vite)
  useEffect(() => {
    let isMounted = true
    async function checkOllama() {
      try {
        const res = await fetch('/api/ollama/api/tags', { method: 'GET' })
        if (res.ok) {
          const data = await res.json()
          if (isMounted && data.models && data.models.length > 0) {
            setOllamaConnected(true)
            setOllamaModel(data.models[0].name)
          }
        }
      } catch {
        if (isMounted) setOllamaConnected(false)
      }
    }
    checkOllama()
    return () => {
      isMounted = false
    }
  }, [])

  // Auto-scroll al final cuando llegan mensajes
  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight
    }
  }, [messages, isThinking])

  // Manejar envío de preguntas por el usuario
  const handleSend = async (e) => {
    e.preventDefault()
    const query = inputValue.trim()
    if (!query || isThinking) return

    setInputValue('')
    const userMsg = { id: Date.now(), sender: 'user', text: query }
    setMessages((prev) => [...prev, userMsg])
    setIsThinking(true)

    // Si Ollama está conectado en vivo, consultarlo
    if (ollamaConnected && ollamaModel) {
      try {
        const prompt = `Eres Pacha, el guardián del microclima de Cochabamba (Bolivia).
Tienes los datos reales del municipio:
- Zona activa: ${activeZone ? activeZone.name : 'Cochabamba'}
- LST superficial: ${activeZone ? activeZone.lstMean : 29.6} °C
- NDVI vegetal: ${activeZone ? activeZone.ndviMean : 0.21}
- Módulo: ${activeModuleId}
- Red MÓNICA GAMC: más de 125.000 mediciones de PM10 en Kanata y SEMAPA.

Instrucción: Responde en español con tono amable, directo, científico y sin rodeos. Pregunta: "${query}"`

        const response = await fetch('/api/ollama/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: ollamaModel,
            prompt: prompt,
            stream: false,
          }),
        })

        if (response.ok) {
          const data = await response.json()
          setMessages((prev) => [
            ...prev,
            { id: Date.now() + 1, sender: 'bot', text: data.response },
          ])
          setIsThinking(false)
          return
        }
      } catch {
        // Fallback al motor local
      }
    }

    // Fallback con motor de datos reales locales
    setTimeout(() => {
      const localAnswer = answerLocally(query, activeZone, activeModuleId)
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, sender: 'bot', text: localAnswer },
      ])
      setIsThinking(false)
    }, 320)
  }

  const currentExplanation = generateContextualExplanation(activeModuleId, activeZone, mood)

  // Etiqueta de humor de Pacha
  const moodLabel =
    mood === 'hot'
      ? '¡Uf, mucho calor!'
      : mood === 'fresh'
      ? '¡Brisa fresca!'
      : mood === 'smoky'
      ? '¡Humo en el valle!'
      : 'Guardián del Valle'

  return (
    <div className="floating-avatar-container" aria-label="Pacha, Copiloto del Microclima">
      {!isOpen ? (
        // Estado Minimizado: Pacha Flotando con su Chullito (limpio, sin etiquetas innecesarias)
        <button
          type="button"
          className="floating-avatar-trigger"
          onClick={() => setIsOpen(true)}
          title="Hablar con Pacha, guardián del microclima"
        >
          <div className="wayrita-sprite-wrap">
            <PachaAvatarSvg mood={mood} size={48} />
          </div>
          <div className="floating-avatar-label-box">
            <div className="floating-avatar-name-row">
              <span className="floating-avatar-name">Pacha</span>
            </div>
            <span className="floating-avatar-mood-pill">
              <span className={`floating-status-dot dot-${mood}`} />
              {moodLabel}
            </span>
          </div>
        </button>
      ) : (
        // Estado Expandido: Tarjeta Holográfica de Pacha
        <div className="floating-avatar-panel" role="dialog" aria-modal="false">
          {/* Cabecera */}
          <div className="avatar-panel-header">
            <div className="avatar-header-left">
              <div className="avatar-header-sprite">
                <PachaAvatarSvg mood={mood} size={44} />
              </div>
              <div className="avatar-header-title-box">
                <div className="avatar-header-title">Pacha · Guardián del Valle</div>
                <div className="avatar-header-subtitle">
                  <span>Microclimas de Cochabamba</span>
                  <span className={`avatar-backend-badge ${ollamaConnected ? 'is-ollama' : ''}`}>
                    {ollamaConnected ? `Ollama (${ollamaModel})` : 'Datos NASA / GAMC'}
                  </span>
                </div>
              </div>
            </div>
            <button
              type="button"
              className="avatar-close-btn"
              onClick={() => setIsOpen(false)}
              aria-label="Minimizar a Pacha"
            >
              ✕
            </button>
          </div>

          {/* Barra de Contexto Activo */}
          <div className="avatar-context-bar">
            <span>Zona: <strong className="avatar-context-zone">{activeZone ? activeZone.name : 'Valle Central'}</strong></span>
            <span>LST: <strong>{activeZone ? activeZone.lstMean : '29.6'} °C</strong></span>
            <span>NDVI: <strong>{activeZone ? activeZone.ndviMean : '0.21'}</strong></span>
          </div>

          {/* Cuerpo */}
          <div className="avatar-panel-body" ref={bodyRef}>
            {/* Explicación contextual de Pacha de lo que está en pantalla */}
            <div className={`avatar-explanation-card card-${mood}`}>
              <div className="avatar-card-tag">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 2a10 10 0 1 0 10 10H12V2z" />
                </svg>
                {mood === 'hot' ? '¡Alerta de calor de Pacha!' : mood === 'fresh' ? '¡Diagnóstico verde de Pacha!' : 'Diagnóstico de Pacha:'}
              </div>
              <div className="avatar-card-text">{currentExplanation}</div>
            </div>

            {/* Historial de Preguntas y Respuestas */}
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={msg.sender === 'user' ? 'avatar-user-query' : 'avatar-llm-response'}
              >
                {msg.text}
              </div>
            ))}

            {isThinking && (
              <div className="avatar-thinking-dots">
                <span></span>
                <span></span>
                <span></span>
                <span style={{ fontSize: '0.72rem', marginLeft: '6px' }}>Pacha está pensando...</span>
              </div>
            )}
          </div>

          {/* Pie: Formulario de Pregunta Libre */}
          <form onSubmit={handleSend} className="avatar-panel-footer">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Pregúntale a Pacha sobre el calor, árboles o este distrito..."
              className="avatar-input-field"
              disabled={isThinking}
            />
            <button
              type="submit"
              className="avatar-send-btn"
              disabled={!inputValue.trim() || isThinking}
            >
              Consultar
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
