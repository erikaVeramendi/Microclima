import { useState, useEffect, useRef } from 'react'
import './FloatingAiAvatar.css'
import { COCHABAMBA_ZONES } from '../../data/internalPanelData'

// Síntesis explicativa biofísica por módulo y distrito (Datos 100% reales)
function generateContextualExplanation(moduleId, zone) {
  const zoneName = zone ? zone.name : 'Cochabamba General'
  const lst = zone ? zone.lstMean : 29.6
  const ndvi = zone ? zone.ndviMean : 0.21

  switch (moduleId) {
    case 'monitoreo-general':
    case 'centro-inteligencia':
      return `Estás viendo el triaje bioclimático de ${zoneName}. Registra ${lst} °C de temperatura superficial terrestre (LST). En Cochabamba existe una brecha de 7.9 °C entre los distritos más frescos del norte y los más calientes del sur (Distrito 9 alcanza 33.1 °C promedio).`

    case 'inteligencia-vegetacion':
      return `Aquí se evalúa el vigor vegetal de ${zoneName} con Sentinel-2 (NDVI: ${ndvi}). Recuerda: NDVI mide densidad de clorofila viva, no conteo directo de árboles. Con un índice de ${ndvi}, esta zona presenta un déficit de cobertura verde para mitigar su isla de calor.`

    case 'inteligencia-termica':
      return `El mapa térmico muestra la emisión radiativa de techos de calamina, asfalto y suelo (LST: ${lst} °C medido por Landsat 8/9 TIRS a 30m). Es temperatura superficial, no temperatura del aire (que suele ser de 4 a 8 °C menor).`

    case 'relaciones-ambientales':
      return `Este módulo cruza la NASA con la Red MÓNICA de Cochabamba. La correlación espacial de Pearson es inversa y estadísticamente significativa (r = -0.413, p < 10⁻⁵⁰): a menor vegetación, mayor calor superficial. La estación Kanata en el sur registra picos de PM10 de 61.9 µg/m³ a las 8 AM y 9 PM por tráfico e inversión térmica.`

    case 'explorador-territorial':
      return `En ${zoneName} puedes auditar las líneas de transporte municipal y la expansión urbana. En los últimos años, el crecimiento hacia el sur reemplazó suelo permeable por superficies impermeables, intensificando las islas de calor a lo largo de las avenidas principales.`

    case 'planificacion-escenarios':
      return `Aquí se analiza la desigualdad térmica y la simulación contrafactual. En ${zoneName} se evalúa la exposición al calor en recintos sensibles (escuelas y centros de salud). Al simular reforestación urbana con especies nativas (molle, jacarandá), el modelo proyecta un descenso térmico en superficie de 1 °C a 2 °C.`

    case 'gestion-datos':
      return `Catálogo de 12 fuentes: Sentinel-2 (10m para vegetación), Landsat 8/9 (30m para calor), NASADEM (30m de relieve), Red MÓNICA del GAMC (125.000+ registros horarios de calidad de aire) y capas WMS municipales.`

    case 'evidencia-validacion':
      return `Auditoría científica: cada métrica cuenta con nivel de evidencia documentado. Los vacíos de observación responden a la nubosidad estacional del Tunari en época húmeda, sin interpolar datos falsos.`

    case 'investigaciones-informes':
      return `Espacio de gobernanza y exportación: compila los hallazgos de ${zoneName} en reportes ejecutivos listos para el Concejo Municipal o financiamiento internacional.`

    default:
      return `Monitoreo activo sobre ${zoneName}. LST superficial: ${lst} °C | NDVI vegetal: ${ndvi}.`
  }
}

// Generador de respuesta local con datos científicos reales (Fallback de Ollama)
function answerLocally(query, zone, moduleId) {
  const q = query.toLowerCase()
  const zoneName = zone ? zone.name : 'Cochabamba'
  const lst = zone ? zone.lstMean : 29.6
  const ndvi = zone ? zone.ndviMean : 0.21

  if (q.includes('lst') || q.includes('aire') || q.includes('temperatura')) {
    return `LST (Land Surface Temperature) es la temperatura superficial del suelo, asfalto y techumbres medida desde el espacio por los sensores infrarrojos térmicos de Landsat 8/9 a 30 metros de resolución. No es la temperatura del aire medida por termómetros a 2 metros de altura: en Cochabamba la superficie suele estar entre 5 °C y 10 °C más caliente que el aire debido a la radiación solar y la inercia térmica de los materiales urbanos.`
  }

  if (q.includes('ndvi') || q.includes('vegetacion') || q.includes('arbol') || q.includes('verde')) {
    return `El NDVI (Normalized Difference Vegetation Index) se calcula con las bandas Infrarrojo Cercano (NIR) y Rojo de Sentinel-2 a 10 metros de resolución. Varía de -1 a +1. En Cochabamba el promedio es 0.21. Un NDVI bajo como el de ${zoneName} (${ndvi}) indica escasez de vegetación densa. No equivale directamente a número de árboles, sino al vigor fotosintético del dosel.`
  }

  if (q.includes('monica') || q.includes('aire') || q.includes('contaminacion') || q.includes('pm10') || q.includes('pm2.5')) {
    return `La Red MÓNICA es la red oficial de monitoreo de calidad del aire del GAMC. En el proyecto procesamos más de 125.000 mediciones horarias de las estaciones Parque Kanata (sur) y SEMAPA (norte). El material particulado (PM10) presenta dos picos diarios críticos: entre 07:00 y 09:00 (tráfico matutino) y entre 20:00 y 22:00 (congestión e inversión térmica que atrapa los contaminantes en el fondo del valle).`
  }

  if (q.includes('distrito 9') || q.includes('d9') || q.includes('sur') || q.includes('caliente')) {
    return `El Distrito 9 es el sector más crítico de Cochabamba: registra un promedio de 33.1 °C de LST con picos que superan los 38 °C, frente a un NDVI mínimo de 0.14. Esto se debe a la rápida expansión sobre suelos áridos, calles sin pavimentar o sin arbolado de sombra, y techos de calamina de alta absorción solar.`
  }

  if (q.includes('tunari') || q.includes('norte') || q.includes('distrito 12') || q.includes('cota')) {
    return `La zona norte y el pie de monte del Parque Nacional Tunari (como el Distrito 12) presentan el mayor vigor vegetal de la ciudad (NDVI hasta 0.32) y temperaturas superficiales significativamente menores (25.2 °C promedio). La Cota 2750 actúa como límite de protección ecológica fundamental para regular el microclima del valle.`
  }

  if (q.includes('escuela') || q.includes('hospital') || q.includes('desigualdad') || q.includes('vulnerab')) {
    return `El Detector de Desigualdad cruza los puntos de calor con equipamientos sensibles. Identificamos escuelas públicas en los distritos 8 y 9 donde los patios carecen de sombra vegetal, exponiendo a niños a temperaturas superficiales de más de 35 °C en horas de recreo.`
  }

  // Respuesta general contextual
  return `Análisis para ${zoneName}: Presenta una temperatura de superficie de ${lst} °C y un NDVI de ${ndvi}. El factor determinante de su microclima es el balance entre superficies impermeables (calamina/asfalto) y cobertura arbórea nativa. En este módulo puedes examinar las métricas precisas y auditar la trazabilidad satelital.`
}

export default function FloatingAiAvatar({ activeModuleId, activeZone }) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [inputValue, setInputValue] = useState('')
  const [isThinking, setIsThinking] = useState(false)
  const [ollamaConnected, setOllamaConnected] = useState(false)
  const [ollamaModel, setOllamaModel] = useState(null)
  const bodyRef = useRef(null)

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
        if (isMounted) {
          setOllamaConnected(false)
        }
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
        const prompt = `Eres el Asistente Científico de Microclimas de Cochabamba.
Contexto real actual:
- Zona activa: ${activeZone ? activeZone.name : 'Cochabamba'}
- Temperatura superficial (LST): ${activeZone ? activeZone.lstMean : 29.6} °C
- Índice de vegetación (NDVI): ${activeZone ? activeZone.ndviMean : 0.21}
- Módulo actual: ${activeModuleId}
- Red MÓNICA GAMC: más de 125.000 mediciones horarias de PM10 (estaciones Kanata y SEMAPA).

Instrucción: Responde en español de forma directa, concreta, con rigor científico y sin rodeos. No inventes datos. Pregunta del usuario: "${query}"`

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
        // Fallback a motor local si Ollama falla
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
    }, 350)
  }

  const currentExplanation = generateContextualExplanation(activeModuleId, activeZone)

  return (
    <div className="floating-avatar-container" aria-label="Copiloto Científico de Microclimas">
      {!isOpen ? (
        // Estado Minimizado: Orbe Holográfico
        <button
          type="button"
          className="floating-avatar-trigger"
          onClick={() => setIsOpen(true)}
          title="Abrir Copiloto Científico de Microclimas"
        >
          <div className="floating-avatar-orb">
            <svg viewBox="0 0 24 24" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </div>
          <div className="floating-avatar-label-box">
            <span className="floating-avatar-name">Copiloto Científico</span>
            <span className="floating-avatar-status-line">
              <span className="floating-status-dot" />
              {ollamaConnected ? 'Ollama LLM' : 'Datos Satelitales'}
            </span>
          </div>
        </button>
      ) : (
        // Estado Expandido: Panel Flotante
        <div className="floating-avatar-panel" role="dialog" aria-modal="false">
          {/* Cabecera */}
          <div className="avatar-panel-header">
            <div className="avatar-header-left">
              <div className="floating-avatar-orb" style={{ width: '24px', height: '24px' }}>
                <svg viewBox="0 0 24 24" strokeWidth="2.4" style={{ width: '13px', height: '13px' }}>
                  <circle cx="12" cy="12" r="3" />
                  <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
                </svg>
              </div>
              <div>
                <div className="avatar-header-title">Copiloto de Microclimas</div>
                <span className={`avatar-backend-badge ${ollamaConnected ? 'is-ollama' : ''}`}>
                  {ollamaConnected ? `Ollama (${ollamaModel})` : 'Motor Biofísico NASA/GAMC'}
                </span>
              </div>
            </div>
            <button
              type="button"
              className="avatar-close-btn"
              onClick={() => setIsOpen(false)}
              aria-label="Minimizar copiloto"
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
            {/* Explicación contextual de lo que está en pantalla */}
            <div className="avatar-explanation-card">
              <div className="avatar-card-tag">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
                ¿Qué estás viendo en esta pantalla?
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
                <span style={{ fontSize: '0.68rem', marginLeft: '6px' }}>Procesando consulta...</span>
              </div>
            )}
          </div>

          {/* Pie: Input directo sin botones inútiles */}
          <form onSubmit={handleSend} className="avatar-panel-footer">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Pregunta sobre LST, NDVI, Red MÓNICA o este distrito..."
              className="avatar-input-field"
              disabled={isThinking}
            />
            <button
              type="submit"
              className="avatar-send-btn"
              disabled={!inputValue.trim() || isThinking}
            >
              Enviar
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
