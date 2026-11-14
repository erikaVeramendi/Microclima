/**
 * src/lib/tendencias.js
 * Funciones puras en JavaScript (sin librerías externas) para el análisis de tendencias
 * en series temporales climáticas de Cochabamba (mensuales y anuales).
 *
 * Formato esperado de entrada:
 * - Mensual: Array de objetos [{ fecha: "YYYY-MM", valor: number | null }, ...]
 * - Anual:   Array de objetos [{ fecha: "YYYY", valor: number | null }, ...]
 * Ignora los null y valores no numéricos.
 */

// Utilidad interna: Aproximación de la función de error erf(x) de Abramowitz y Stegun (7.1.26)
function erf(x) {
  if (x === 0) return 0
  const sign = x >= 0 ? 1 : -1
  const absX = Math.abs(x)
  const a1 = 0.254829592
  const a2 = -0.284496736
  const a3 = 1.421413741
  const a4 = -1.453152027
  const a5 = 1.061405429
  const p = 0.3275911
  const t = 1.0 / (1.0 + p * absX)
  const y = 1.0 - (((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t) * Math.exp(-absX * absX)
  return sign * Math.min(1, Math.max(0, y))
}

// Utilidad interna: Función de distribución acumulada de la normal estándar Φ(z)
function normalCdf(z) {
  return 0.5 * (1 + erf(z / Math.SQRT2))
}

// Utilidad interna: Calcular mediana de un arreglo numérico
function calcularMediana(arr) {
  if (!arr || arr.length === 0) return 0
  const ordenados = [...arr].sort((a, b) => a - b)
  const mid = Math.floor(ordenados.length / 2)
  if (ordenados.length % 2 !== 0) {
    return ordenados[mid]
  }
  return (ordenados[mid - 1] + ordenados[mid]) / 2
}

// Utilidad interna: Parsear y filtrar serie mensual ignorando nulls
function parseSerieMensual(serie) {
  if (!Array.isArray(serie)) return []
  const validos = []
  for (const item of serie) {
    if (!item || item.valor === null || item.valor === undefined) continue
    const val = Number(item.valor)
    if (isNaN(val)) continue
    const fStr = String(item.fecha || '').trim()
    const parts = fStr.split('-')
    if (parts.length < 2) continue
    const anio = parseInt(parts[0], 10)
    const mes = parseInt(parts[1], 10)
    if (isNaN(anio) || isNaN(mes) || mes < 1 || mes > 12) continue
    validos.push({ fecha: `${anio}-${String(mes).padStart(2, '0')}`, anio, mes, valor: val })
  }
  return validos
}

// Utilidad interna: Parsear y filtrar serie anual ignorando nulls
function parseSerieAnual(serie) {
  if (!Array.isArray(serie)) return []
  const validos = []
  for (const item of serie) {
    if (!item || item.valor === null || item.valor === undefined) continue
    const val = Number(item.valor)
    if (isNaN(val)) continue
    let anio = NaN
    if (item.fecha !== undefined && item.fecha !== null) {
      const fStr = String(item.fecha).trim()
      anio = parseInt(fStr.split('-')[0], 10)
    } else if (item.año !== undefined) {
      anio = parseInt(item.año, 10)
    } else if (item.anio !== undefined) {
      anio = parseInt(item.anio, 10)
    }
    if (isNaN(anio)) continue
    validos.push({ fecha: String(anio), anio, valor: val })
  }
  return validos
}

// Utilidad interna: Detectar si una serie es mensual ("YYYY-MM") o anual ("YYYY")
export function detectarTipoSerie(serie) {
  if (!Array.isArray(serie)) return 'mensual'
  for (const item of serie) {
    if (!item || item.valor === null || item.valor === undefined) continue
    const fStr = String(item.fecha || '').trim()
    if (fStr.includes('-')) {
      const parts = fStr.split('-')
      if (parts.length >= 2 && parts[1].length > 0) {
        return 'mensual'
      }
    }
  }
  return 'anual'
}

/**
 * 1. senEstacional(serie):
 * Pendiente de Sen estacional en unidades por año.
 * Para cada mes del año toma todos los pares de años (i < j) con valor y calcula (valor_j - valor_i) / (año_j - año_i).
 * La pendiente es la mediana de todos esos cocientes juntos.
 */
export function senEstacional(serie) {
  const validos = parseSerieMensual(serie)
  if (validos.length === 0) return 0

  const meses = {}
  for (let m = 1; m <= 12; m++) meses[m] = []
  for (const d of validos) {
    meses[d.mes].push(d)
  }

  const cocientes = []
  for (let m = 1; m <= 12; m++) {
    const obs = meses[m]
    obs.sort((a, b) => a.anio - b.anio)
    const n = obs.length
    for (let i = 0; i < n - 1; i++) {
      for (let j = i + 1; j < n; j++) {
        const dy = obs[j].valor - obs[i].valor
        const dt = obs[j].anio - obs[i].anio
        if (dt > 0) {
          cocientes.push(dy / dt)
        }
      }
    }
  }

  if (cocientes.length === 0) return 0
  return calcularMediana(cocientes)
}

/**
 * 2. mannKendallEstacional(serie):
 * Para cada mes, S_mes = suma de signo(valor_j - valor_i) para todos los pares de años i < j;
 * Var_mes = n(n-1)(2n+5)/18 con n = cantidad de años con dato en ese mes.
 * S = suma de S_mes; Var = suma de Var_mes.
 * Z = (S-1)/raíz(Var) si S > 0, (S+1)/raíz(Var) si S < 0, 0 si S = 0.
 * p = 2 × (1 - Φ(|Z|)), con Φ la normal estándar.
 * Devuelve { S, Z, p, tendencia: "aumenta" | "disminuye" | "sin tendencia" } usando p < 0,05.
 */
export function mannKendallEstacional(serie) {
  const validos = parseSerieMensual(serie)
  if (validos.length === 0) {
    return { S: 0, Z: 0, p: 1, tendencia: 'sin tendencia' }
  }

  const meses = {}
  for (let m = 1; m <= 12; m++) meses[m] = []
  for (const d of validos) {
    meses[d.mes].push(d)
  }

  let S = 0
  let Var = 0

  for (let m = 1; m <= 12; m++) {
    const obs = meses[m]
    obs.sort((a, b) => a.anio - b.anio)
    const n = obs.length
    if (n < 2) continue

    let S_mes = 0
    for (let i = 0; i < n - 1; i++) {
      for (let j = i + 1; j < n; j++) {
        const diff = obs[j].valor - obs[i].valor
        if (diff > 0) S_mes += 1
        else if (diff < 0) S_mes -= 1
      }
    }
    const Var_mes = (n * (n - 1) * (2 * n + 5)) / 18
    S += S_mes
    Var += Var_mes
  }

  let Z = 0
  if (Var > 0) {
    if (S > 0) Z = (S - 1) / Math.sqrt(Var)
    else if (S < 0) Z = (S + 1) / Math.sqrt(Var)
    else Z = 0
  }

  const absZ = Math.abs(Z)
  const phiAbsZ = normalCdf(absZ)
  let p = 2 * (1 - phiAbsZ)
  p = Math.max(0, Math.min(1, p))

  let tendencia = 'sin tendencia'
  if (p < 0.05) {
    if (S > 0) tendencia = 'aumenta'
    else if (S < 0) tendencia = 'disminuye'
  }

  return { S, Z, p, tendencia }
}

/**
 * 3. regresionAnomalias(serie):
 * Resta a cada valor el promedio de su mes (anomalía), y calcula la regresión lineal
 * de la anomalía contra el tiempo en años decimales (año + (mes-1)/12).
 * Devuelve { pendiente, ic95: [min, max], p }.
 * Para el IC usa error estándar de la pendiente × 1,96 si n > 30.
 */
export function regresionAnomalias(serie) {
  const validos = parseSerieMensual(serie)
  if (validos.length < 3) {
    return { pendiente: 0, ic95: [0, 0], p: 1 }
  }

  // Promedio histórico por mes
  const mesesValores = {}
  for (let m = 1; m <= 12; m++) mesesValores[m] = []
  for (const d of validos) {
    mesesValores[d.mes].push(d.valor)
  }

  const promediosMes = {}
  for (let m = 1; m <= 12; m++) {
    const vals = mesesValores[m]
    promediosMes[m] = vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0
  }

  // Puntos: t en años decimales, anom = valor - promedioMes
  const pts = validos.map((d) => {
    const t = d.anio + (d.mes - 1) / 12
    const anom = d.valor - promediosMes[d.mes]
    return { t, anom }
  })

  const n = pts.length
  let sumT = 0
  let sumA = 0
  for (const p of pts) {
    sumT += p.t
    sumA += p.anom
  }
  const meanT = sumT / n
  const meanA = sumA / n

  let SStt = 0
  let SSta = 0
  for (const p of pts) {
    const dt = p.t - meanT
    const da = p.anom - meanA
    SStt += dt * dt
    SSta += dt * da
  }

  if (SStt === 0) {
    return { pendiente: 0, ic95: [0, 0], p: 1 }
  }

  const pendiente = SSta / SStt
  const intercepto = meanA - pendiente * meanT

  let SSres = 0
  for (const p of pts) {
    const pred = intercepto + pendiente * p.t
    const res = p.anom - pred
    SSres += res * res
  }

  const df = Math.max(1, n - 2)
  const s2 = SSres / df
  const sePendiente = Math.sqrt(s2 / SStt)

  const tCritico = n > 30 ? 1.96 : (df === 1 ? 12.7 : df === 2 ? 4.3 : df <= 10 ? 2.23 : 2.0)
  const margen = sePendiente * tCritico
  const ic95 = [pendiente - margen, pendiente + margen]

  const tStat = sePendiente > 0 ? Math.abs(pendiente / sePendiente) : 0
  let p = 2 * (1 - normalCdf(tStat))
  p = Math.max(0, Math.min(1, p))

  return { pendiente, ic95, p }
}

/**
 * 5. promediosAnuales(serie):
 * Devuelve [{ año, valor }] con el promedio de cada año que tenga al menos 6 meses con dato.
 */
export function promediosAnuales(serie) {
  const validos = parseSerieMensual(serie)
  const aniosMap = {}

  for (const d of validos) {
    if (!aniosMap[d.anio]) aniosMap[d.anio] = []
    aniosMap[d.anio].push(d.valor)
  }

  const resultado = []
  const aniosOrdenados = Object.keys(aniosMap)
    .map(Number)
    .sort((a, b) => a - b)

  for (const a of aniosOrdenados) {
    const vals = aniosMap[a]
    if (vals.length >= 6) {
      const promedio = vals.reduce((acc, curr) => acc + curr, 0) / vals.length
      resultado.push({ año: a, valor: promedio })
    }
  }

  return resultado
}

/**
 * 6. SERIES ANUALES:
 * senAnual(serie): Mediana de (valor_j - valor_i) / (año_j - año_i) para todos los pares i < j.
 */
export function senAnual(serie) {
  const validos = parseSerieAnual(serie)
  if (validos.length < 2) return 0

  validos.sort((a, b) => a.anio - b.anio)
  const cocientes = []
  const n = validos.length

  for (let i = 0; i < n - 1; i++) {
    for (let j = i + 1; j < n; j++) {
      const dy = validos[j].valor - validos[i].valor
      const dt = validos[j].anio - validos[i].anio
      if (dt > 0) {
        cocientes.push(dy / dt)
      }
    }
  }

  if (cocientes.length === 0) return 0
  return calcularMediana(cocientes)
}

/**
 * 6. mannKendallAnual(serie):
 * Igual que el estacional pero con un solo grupo (todos los años juntos).
 */
export function mannKendallAnual(serie) {
  const validos = parseSerieAnual(serie)
  const n = validos.length
  if (n < 2) {
    return { S: 0, Z: 0, p: 1, tendencia: 'sin tendencia' }
  }

  validos.sort((a, b) => a.anio - b.anio)

  let S = 0
  for (let i = 0; i < n - 1; i++) {
    for (let j = i + 1; j < n; j++) {
      const diff = validos[j].valor - validos[i].valor
      if (diff > 0) S += 1
      else if (diff < 0) S -= 1
    }
  }

  const Var = (n * (n - 1) * (2 * n + 5)) / 18

  let Z = 0
  if (Var > 0) {
    if (S > 0) Z = (S - 1) / Math.sqrt(Var)
    else if (S < 0) Z = (S + 1) / Math.sqrt(Var)
    else Z = 0
  }

  const absZ = Math.abs(Z)
  const phiAbsZ = normalCdf(absZ)
  let p = 2 * (1 - phiAbsZ)
  p = Math.max(0, Math.min(1, p))

  let tendencia = 'sin tendencia'
  if (p < 0.05) {
    if (S > 0) tendencia = 'aumenta'
    else if (S < 0) tendencia = 'disminuye'
  }

  return { S, Z, p, tendencia }
}

/**
 * Regresión lineal simple para series anuales (valor vs año)
 */
export function regresionLinealAnual(serie) {
  const validos = parseSerieAnual(serie)
  const n = validos.length
  if (n < 3) {
    return { pendiente: 0, ic95: [0, 0], p: 1 }
  }

  let sumT = 0
  let sumY = 0
  for (const d of validos) {
    sumT += d.anio
    sumY += d.valor
  }
  const meanT = sumT / n
  const meanY = sumY / n

  let SStt = 0
  let SSty = 0
  for (const d of validos) {
    const dt = d.anio - meanT
    const dy = d.valor - meanY
    SStt += dt * dt
    SSty += dt * dy
  }

  if (SStt === 0) {
    return { pendiente: 0, ic95: [0, 0], p: 1 }
  }

  const pendiente = SSty / SStt
  const intercepto = meanY - pendiente * meanT

  let SSres = 0
  for (const d of validos) {
    const pred = intercepto + pendiente * d.anio
    const res = d.valor - pred
    SSres += res * res
  }

  const df = Math.max(1, n - 2)
  const s2 = SSres / df
  const sePendiente = Math.sqrt(s2 / SStt)

  const tCritico = n > 30 ? 1.96 : (df === 1 ? 12.7 : df === 2 ? 4.3 : df <= 10 ? 2.23 : 2.0)
  const margen = sePendiente * tCritico
  const ic95 = [pendiente - margen, pendiente + margen]

  const tStat = sePendiente > 0 ? Math.abs(pendiente / sePendiente) : 0
  let p = 2 * (1 - normalCdf(tStat))
  p = Math.max(0, Math.min(1, p))

  return { pendiente, ic95, p }
}

/**
 * 4. resumenTendencia(serie, desdeAño, hastaAño):
 * Detecta si la serie es mensual ("YYYY-MM") o anual ("YYYY") y usa las funciones que correspondan.
 * Filtra la serie por años y devuelve:
 * { sen, mk: {...}, lineal: {...}, cambioTotal: sen × (hastaAño - desdeAño + 1), mesesValidos }
 */
export function resumenTendencia(serie, desdeAño, hastaAño) {
  const tipo = detectarTipoSerie(serie)

  if (tipo === 'anual') {
    const validos = parseSerieAnual(serie)
    const filtrados = validos.filter((d) => d.anio >= desdeAño && d.anio <= hastaAño)
    const sen = senAnual(filtrados)
    const mk = mannKendallAnual(filtrados)
    const lineal = regresionLinealAnual(filtrados)
    const cambioTotal = sen * (hastaAño - desdeAño + 1)
    const mesesValidos = filtrados.length // cantidad de observaciones válidas en el rango

    return {
      sen,
      mk,
      lineal,
      cambioTotal,
      mesesValidos,
    }
  }

  // Tipo mensual
  const validos = parseSerieMensual(serie)
  const filtrados = validos.filter((d) => d.anio >= desdeAño && d.anio <= hastaAño)

  const sen = senEstacional(filtrados)
  const mk = mannKendallEstacional(filtrados)
  const lineal = regresionAnomalias(filtrados)
  const cambioTotal = sen * (hastaAño - desdeAño + 1)
  const mesesValidos = filtrados.length

  return {
    sen,
    mk,
    lineal,
    cambioTotal,
    mesesValidos,
  }
}

// =========================================================================
// PRUEBA SIMPLE AL FINAL DEL ARCHIVO:
// Una serie inventada que sube exactamente 0,1 por año durante 20 años
// debe dar sen = 0,1 y p < 0,05.
// =========================================================================
export function ejecutarPruebaSimple() {
  console.log('=== PRUEBA DE VALIDACIÓN 1: SERIE MENSUAL (20 años, +0.1/año) ===')
  const serieMensualPrueba = []
  for (let y = 2001; y <= 2020; y++) {
    for (let m = 1; m <= 12; m++) {
      const fecha = `${y}-${String(m).padStart(2, '0')}`
      const valor = (y - 2001) * 0.1
      serieMensualPrueba.push({ fecha, valor })
    }
  }

  const resM = resumenTendencia(serieMensualPrueba, 2001, 2020)
  const anuales = promediosAnuales(serieMensualPrueba)

  console.log(`1. Pendiente de Sen Estacional: ${resM.sen} (Esperado: 0.1)`)
  console.log(`2. Mann-Kendall S: ${resM.mk.S}, Z: ${resM.mk.Z.toFixed(4)}`)
  console.log(`3. Mann-Kendall p-valor: ${resM.mk.p.toExponential(4)} (Esperado: < 0.05)`)
  console.log(`4. Mann-Kendall Tendencia: "${resM.mk.tendencia}" (Esperado: "aumenta")`)
  console.log(`5. Regresión de Anomalías: pendiente = ${resM.lineal.pendiente.toFixed(4)}, IC95 = [${resM.lineal.ic95.map((v) => v.toFixed(4)).join(', ')}], p = ${resM.lineal.p.toExponential(4)}`)
  console.log(`6. Cambio Total en 20 años: ${resM.cambioTotal.toFixed(2)} unidades`)
  console.log(`7. Meses válidos: ${resM.mesesValidos} (Esperado: 240)`)
  console.log(`8. Promedios Anuales calculados: ${anuales.length} años`)

  console.log('\n=== PRUEBA DE VALIDACIÓN 2: SERIE ANUAL (20 años, +0.1/año) ===')
  const serieAnualPrueba = []
  for (let y = 2001; y <= 2020; y++) {
    serieAnualPrueba.push({ fecha: String(y), valor: (y - 2001) * 0.1 })
  }

  const resA = resumenTendencia(serieAnualPrueba, 2001, 2020)
  console.log(`1. Pendiente de Sen Anual: ${resA.sen} (Esperado: 0.1)`)
  console.log(`2. Mann-Kendall S: ${resA.mk.S}, Z: ${resA.mk.Z.toFixed(4)}`)
  console.log(`3. Mann-Kendall p-valor: ${resA.mk.p.toExponential(4)} (Esperado: < 0.05)`)
  console.log(`4. Mann-Kendall Tendencia: "${resA.mk.tendencia}" (Esperado: "aumenta")`)
  console.log(`5. Regresión Lineal Anual: pendiente = ${resA.lineal.pendiente.toFixed(4)}, IC95 = [${resA.lineal.ic95.map((v) => v.toFixed(4)).join(', ')}], p = ${resA.lineal.p.toExponential(4)}`)
  console.log(`6. Cambio Total en 20 años: ${resA.cambioTotal.toFixed(2)} unidades`)
  console.log(`7. Observaciones válidas: ${resA.mesesValidos} (Esperado: 20)`)

  return { mensual: resM, anual: resA }
}

// Ejecución directa en Node.js
if (
  typeof process !== 'undefined' &&
  process.argv &&
  process.argv[1] &&
  process.argv[1].replace(/\\/g, '/').includes('src/lib/tendencias.js')
) {
  ejecutarPruebaSimple()
}
