/**
 * scripts/procesar_red_monica.mjs
 * Procesa los registros continuos de las dos estaciones de la Red MÓNICA (GAMC)
 * Filtra valores inválidos (<= 0 o >= 1000) y genera public/data/red_monica_resumen.json
 */

import fs from 'fs'
import path from 'path'

const DIR_CSV = 'data/datos_municipales_gamc/red_monica'
const OUT_FILE = 'public/data/red_monica_resumen.json'

const STATIONS_CONFIG = [
  {
    id: 'kanata',
    filePattern: 'kanata',
    nombre: 'Estación Parque Kanata',
    ubicacion: 'Av. 6 de Agosto / Parque Kanata (Zona Sur)',
    coords: { lat: -17.4132, lng: -66.1554 },
    distritoRef: 'Distrito 5',
  },
  {
    id: 'semapa',
    filePattern: 'semapa',
    nombre: 'Estación SEMAPA',
    ubicacion: 'Av. Circunvalación / Planta de Tratamiento SEMAPA (Zona Norte)',
    coords: { lat: -17.3712, lng: -66.1472 },
    distritoRef: 'Distrito 2',
  },
]

function parseCsvFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8')
  const lines = content.split('\n')
  const records = []

  let headerPassed = false

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i].trim()
    if (!rawLine) continue

    // Detectar encabezado
    if (!headerPassed && (rawLine.includes('fecha_medicion') || rawLine.includes('pm10'))) {
      headerPassed = true
      continue
    }

    // Dividir columnas respetando comillas
    const cols = rawLine.split(',').map((c) => c.replace(/^["']|["']$/g, '').trim())
    if (cols.length < 3) continue

    // Formato común: estacion, pm10, fecha_medicion
    const pm10Val = parseFloat(cols[1])
    const fechaStr = cols[2]

    if (isNaN(pm10Val) || pm10Val <= 0 || pm10Val >= 1000) continue
    if (!fechaStr || fechaStr.length < 10) continue

    // Extraer componentes de fecha y hora
    // Formato: 2022-07-06 17:30:00.000 o ISO
    const datePart = fechaStr.substring(0, 10) // YYYY-MM-DD
    const monthPart = fechaStr.substring(0, 7) // YYYY-MM

    let hour = 0
    if (fechaStr.length >= 13) {
      const timePart = fechaStr.substring(11, 13)
      const parsedHour = parseInt(timePart, 10)
      if (!isNaN(parsedHour) && parsedHour >= 0 && parsedHour <= 23) {
        hour = parsedHour
      }
    }

    records.push({
      pm10: pm10Val,
      fechaStr,
      datePart,
      monthPart,
      hour,
    })
  }

  return records
}

function processStation(config) {
  const dirFiles = fs.readdirSync(DIR_CSV)
  const targetFileName = dirFiles.find((f) => f.toLowerCase().includes(config.filePattern.toLowerCase()))

  if (!targetFileName) {
    throw new Error(`No se encontró archivo para la estación ${config.id} en ${DIR_CSV}`)
  }

  const fullPath = path.join(DIR_CSV, targetFileName)
  console.log(`Procesando ${config.nombre} desde ${targetFileName}...`)

  const records = parseCsvFile(fullPath)
  if (records.length === 0) {
    throw new Error(`No se encontraron registros válidos para ${config.nombre}`)
  }

  records.sort((a, b) => (a.fechaStr > b.fechaStr ? 1 : -1))

  const fechaInicial = records[0].fechaStr.substring(0, 10)
  const fechaFinal = records[records.length - 1].fechaStr.substring(0, 10)

  // Promedio general
  const sumPm10 = records.reduce((acc, r) => acc + r.pm10, 0)
  const promedioGeneral = +(sumPm10 / records.length).toFixed(2)

  // Perfil horario (0 a 23)
  const hourSums = Array(24).fill(0)
  const hourCounts = Array(24).fill(0)

  for (const r of records) {
    hourSums[r.hour] += r.pm10
    hourCounts[r.hour] += 1
  }

  const perfilHorario = []
  for (let h = 0; h < 24; h++) {
    const avg = hourCounts[h] > 0 ? +(hourSums[h] / hourCounts[h]).toFixed(2) : 0
    perfilHorario.push({
      hora: h,
      etiqueta: `${String(h).padStart(2, '0')}:00`,
      pm10: avg,
      registros: hourCounts[h],
    })
  }

  // Agrupación por días para evaluar la guía OMS (45 µg/m³ en 24h)
  const dayGroups = {}
  for (const r of records) {
    if (!dayGroups[r.datePart]) dayGroups[r.datePart] = []
    dayGroups[r.datePart].push(r.pm10)
  }

  let diasValidos = 0
  let diasSobreGuia = 0
  const daysByMonth = {}

  for (const [day, values] of Object.entries(dayGroups)) {
    // Consideramos día válido si tiene al menos 12 mediciones (ej. semi-horarias o horarias representativas)
    if (values.length >= 8) {
      diasValidos++
      const dayMean = values.reduce((a, b) => a + b, 0) / values.length
      if (dayMean > 45) {
        diasSobreGuia++
      }

      const m = day.substring(0, 7)
      if (!daysByMonth[m]) daysByMonth[m] = []
      daysByMonth[m].push(dayMean)
    }
  }

  const pctDiasSobreGuia = diasValidos > 0 ? +((diasSobreGuia / diasValidos) * 100).toFixed(1) : 0

  // Serie de promedios mensuales (solo meses con al menos 15 días válidos)
  const serieMensual = []
  const sortedMonths = Object.keys(daysByMonth).sort()

  for (const m of sortedMonths) {
    const dailyMeans = daysByMonth[m]
    if (dailyMeans.length >= 15) {
      const monthMean = +(dailyMeans.reduce((a, b) => a + b, 0) / dailyMeans.length).toFixed(2)
      serieMensual.push({
        mes: m,
        pm10: monthMean,
        diasValidos: dailyMeans.length,
      })
    }
  }

  return {
    id: config.id,
    nombre: config.nombre,
    ubicacion: config.ubicacion,
    coords: config.coords,
    distritoRef: config.distritoRef,
    registros_validos: records.length,
    fecha_inicial: fechaInicial,
    fecha_final: fechaFinal,
    promedio_general: promedioGeneral,
    dias_validos_totales: diasValidos,
    dias_sobre_guia_oms: diasSobreGuia,
    pct_dias_sobre_guia_oms: pctDiasSobreGuia,
    perfil_horario: perfilHorario,
    serie_mensual: serieMensual,
  }
}

function main() {
  console.log('=== PROCESAMIENTO RED MÓNICA COCHABAMBA ===')
  const resumen = {
    meta: {
      fuente: 'Red de Monitoreo de la Calidad del Aire (Red MÓNICA) · GAMC',
      guia_oms_24h_pm10: 45,
      unidad: 'µg/m³',
      metodologia:
        'Filtrado de datos espurios (0 < PM10 < 1000 µg/m³). Promedios mensuales calculados para meses con al menos 15 días con cobertura diaria representativa.',
      generado: new Date().toISOString(),
    },
    estaciones: {},
  }

  for (const cfg of STATIONS_CONFIG) {
    const estResult = processStation(cfg)
    resumen.estaciones[cfg.id] = estResult

    console.log(`\n--- RESUMEN: ${estResult.nombre} ---`)
    console.log(`Registros válidos: ${estResult.registros_validos.toLocaleString('es-BO')}`)
    console.log(`Periodo: ${estResult.fecha_inicial} a ${estResult.fecha_final}`)
    console.log(`Promedio general: ${estResult.promedio_general} µg/m³`)
    console.log(
      `Días sobre guía OMS (45 µg/m³): ${estResult.dias_sobre_guia_oms} de ${estResult.dias_validos_totales} (${estResult.pct_dias_sobre_guia_oms} %)`
    )
    console.log(`Meses válidos (>= 15 días): ${estResult.serie_mensual.length}`)
  }

  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true })
  fs.writeFileSync(OUT_FILE, JSON.stringify(resumen, null, 2), 'utf8')
  console.log(`\nArchivo generado exitosamente en ${OUT_FILE}`)
}

main()
