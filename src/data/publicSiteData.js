export const NAV_LINKS = [
  { id: 'inicio', label: 'Inicio' },
  { id: 'plataforma', label: 'La plataforma' },
  { id: 'capacidades', label: 'Capacidades' },
  { id: 'metodologia', label: 'Metodología' },
  { id: 'territorio', label: 'Territorio' },
  { id: 'acerca', label: 'Acerca de' },
]

export const CHALLENGE_QUESTIONS = [
  {
    code: '01',
    category: 'Transformación térmica',
    question:
      '¿Cómo evolucionan las condiciones térmicas superficiales en los distintos sectores de la ciudad?',
    detail:
      'Distinguir zonas que históricamente son cálidas de aquellas que experimentan una tendencia de cambio sostenido entre periodos comparables.',
    icon: 'thermal',
  },
  {
    code: '02',
    category: 'Transformación vegetal',
    question:
      '¿Dónde se observan señales de pérdida, estabilidad o recuperación de vegetación?',
    detail:
      'Analizar la respuesta espectral a lo largo del tiempo para reconstruir la memoria ambiental de los corredores y espacios verdes.',
    icon: 'vegetation',
  },
  {
    code: '03',
    category: 'Relaciones ambientales',
    question:
      '¿Qué coincidencias o relaciones existen entre los cambios de vegetación y el comportamiento térmico?',
    detail:
      'Cruzar variables espaciales y temporales para identificar tanto coincidencias esperadas como comportamientos territoriales inesperados.',
    icon: 'relation',
  },
  {
    code: '04',
    category: 'Evidencia territorial',
    question:
      '¿Qué zonas requieren mayor investigación, información adicional o mediciones en campo?',
    detail:
      'Hacer visible la incertidumbre, la cobertura real de observaciones y los vacíos donde nuevas mediciones aportarían mayor valor.',
    icon: 'evidence',
  },
]

export const CAPABILITIES = [
  {
    number: '01',
    title: 'Exploración territorial',
    description:
      'Explora Cochabamba desde una perspectiva geoespacial, compara territorios y analiza la distribución de distintas variables ambientales.',
    quote: 'Cada zona tiene una historia que contar.',
    accent: 'cyan',
    icon: 'map',
  },
  {
    number: '02',
    title: 'Huella Verde',
    description:
      'Estudia la evolución de la vegetación urbana mediante índices espectrales, series temporales y comparación de observaciones satelitales.',
    quote: 'Comprender cómo cambia el patrimonio vegetal.',
    accent: 'green',
    icon: 'leaf',
  },
  {
    number: '03',
    title: 'Inteligencia térmica',
    description:
      'Investiga tendencias de temperatura superficial, identifica anomalías y analiza transformaciones térmicas a lo largo del tiempo.',
    quote: 'Detectar cambios más allá de una imagen.',
    accent: 'thermal',
    icon: 'thermometer',
  },
  {
    number: '04',
    title: 'Investigación ambiental',
    description:
      'Explora posibles relaciones entre variables ambientales, descubre patrones y formula nuevas preguntas de investigación.',
    quote: 'Conectar variables para descubrir relaciones.',
    accent: 'purple',
    icon: 'network',
  },
  {
    number: '05',
    title: 'Evidencia científica',
    description:
      'Examina fuentes, métodos, cobertura, calidad de datos, incertidumbre y limitaciones de los resultados.',
    quote: 'Cada hallazgo debe poder explicarse.',
    accent: 'cyan',
    icon: 'shield',
  },
  {
    number: '06',
    title: 'Planificación urbana',
    description:
      'Explora prioridades territoriales y escenarios hipotéticos de intervención para apoyar la reflexión y planificación ambiental.',
    quote: 'Investigar posibilidades para el futuro.',
    accent: 'slate',
    icon: 'layers',
  },
]

export const DATA_TO_UNDERSTANDING = [
  {
    step: '01',
    title: 'Fuentes de información',
    description: 'Observaciones satelitales, datos geográficos y variables ambientales.',
  },
  {
    step: '02',
    title: 'Procesamiento',
    description: 'Preparación, corrección, organización e integración de información.',
  },
  {
    step: '03',
    title: 'Análisis',
    description: 'Estadística, análisis espacial y modelos de aprendizaje automático.',
  },
  {
    step: '04',
    title: 'Validación',
    description: 'Contraste de resultados, revisión de incertidumbre y calidad de evidencia.',
  },
  {
    step: '05',
    title: 'Interpretación',
    description: 'Hallazgos documentados y conocimiento territorial.',
  },
]

export const METHODOLOGY_PRINCIPLES = [
  {
    id: '01',
    title: 'Trazabilidad de fuentes',
    desc: 'Cada mapa, serie o indicador conserva el registro del sensor, periodo y parámetros utilizados.',
  },
  {
    id: '02',
    title: 'Comparación temporal',
    desc: 'Los análisis contrastan temporadas equivalentes para evitar confundir cambios estacionales con tendencias.',
  },
  {
    id: '03',
    title: 'Análisis espacial',
    desc: 'Estudio de patrones locales, transiciones y agrupaciones territoriales más allá de promedios generales.',
  },
  {
    id: '04',
    title: 'Evaluación de incertidumbre',
    desc: 'Identificación explícita de nubosidad, vacíos de observación y niveles de confianza de cada resultado.',
  },
  {
    id: '05',
    title: 'Validación y reproducibilidad',
    desc: 'Procedimientos documentados que permiten auditar, repetir o actualizar una investigación.',
  },
]

export const DATA_SOURCES = [
  {
    name: 'Landsat 8 y 9',
    provider: 'NASA / USGS',
    status: 'Fuente pública disponible',
    statusType: 'public',
    variable: ' Reflectancia y banda térmica (LST)',
    description:
      'Observación terrestre y datos térmicos para estudiar la temperatura superficial y otras características de la superficie.',
  },
  {
    name: 'Sentinel-2',
    provider: 'Copernicus / ESA',
    status: 'Fuente pública disponible',
    statusType: 'public',
    variable: 'Bandas ópticas multiespectrales (NDVI)',
    description:
      'Observación óptica de alta resolución para estudiar características de la cobertura terrestre y vegetación.',
  },
  {
    name: 'MODIS / VIIRS',
    provider: 'NASA / NOAA',
    status: 'Fuente pública disponible',
    statusType: 'public',
    variable: 'Observación regional diurna y nocturna',
    description:
      'Observaciones de escala regional y temporal que complementan el análisis.',
  },
  {
    name: 'ERA5-Land',
    provider: 'ECMWF / Copernicus',
    status: 'Fuente pública disponible',
    statusType: 'public',
    variable: 'Reanálisis climático y suelo',
    description:
      'Información meteorológica y variables terrestres de reanálisis.',
  },
  {
    name: 'NASADEM',
    provider: 'NASA',
    status: 'Fuente pública disponible',
    statusType: 'public',
    variable: 'Modelo digital de elevación',
    description:
      'Información de elevación y relieve para contextualizar pendientes y topografía del valle.',
  },
  {
    name: 'OpenStreetMap',
    provider: 'Comunidad OSM',
    status: 'Fuente pública abierta',
    statusType: 'public',
    variable: 'Cartografía vectorial base',
    description:
      'Información geográfica de referencia, como calles y elementos urbanos.',
  },
  {
    name: 'Google Earth Engine',
    provider: 'Infraestructura geoespacial',
    status: 'Herramienta de procesamiento prevista',
    statusType: 'tool',
    variable: 'Catálogo y cómputo en la nube',
    description:
      'Infraestructura para procesamiento y análisis de información geoespacial.',
  },
  {
    name: 'GAMC y mediciones terrestres',
    provider: 'Institucional / Local',
    status: 'Sujeto a disponibilidad y acceso',
    statusType: 'pending',
    variable: 'Cartografía local y estaciones en campo',
    description:
      'Posibles fuentes de información institucional y mediciones locales, sujetas a disponibilidad, acceso y validación.',
  },
]

export const CONCEPTUAL_ZONES = [
  {
    id: 'ladera-norte',
    label: 'Sector de Ladera y Pie de Monte (Ilustrativo)',
    relief: 'Pendiente pronunciada y transición hacia cordillera',
    surfaceNote: 'Mayor presencia relativa de cobertura vegetal estacional y quebradas.',
    observationFocus: 'Estudio de regeneración vegetal, escorrentía y gradiente térmico altitudinal.',
    coords: 'Referencia conceptual: Ladera Norte',
  },
  {
    id: 'trama-densa',
    label: 'Sector de Trama Urbana Consolidada (Ilustrativo)',
    relief: 'Planicie central del valle',
    surfaceNote: 'Predominio de superficies impermeables, edificaciones y ejes viales.',
    observationFocus: 'Investigación de inercia térmica superficial y oportunidades de arborización.',
    coords: 'Referencia conceptual: Área Central',
  },
  {
    id: 'corredor-ripario',
    label: 'Corredor Fluvial y Áreas Verdes (Ilustrativo)',
    relief: 'Depresión longitudinal e influencia hídrica',
    surfaceNote: 'Franjas de vegetación arbórea y parques urbanos dentro de la matriz construida.',
    observationFocus: 'Análisis del efecto regulador de corredores verdes sobre su entorno inmediato.',
    coords: 'Referencia conceptual: Eje Ambiental',
  },
  {
    id: 'expansion-sur',
    label: 'Sector de Expansión Periurbana (Ilustrativo)',
    relief: 'Terreno semiárido y colinas bajas',
    surfaceNote: 'Transición rápida de suelo desnudo o agrícola hacia urbanización.',
    observationFocus: 'Detección temprana de cambios de cobertura y vacíos de medición en campo.',
    coords: 'Referencia conceptual: Eje de Expansión',
  },
]

