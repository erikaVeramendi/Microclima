/**
 * Utilidades para ajuste de fuentes de población y formatos en el Enfoque 2
 * Factor de ajuste INE 2024: 665.505 / suma_poblacion_ghsl
 */
export function getIneFactor(indiceData) {
  if (!indiceData?.distritos || indiceData.distritos.length === 0) return 1
  const sum = indiceData.distritos.reduce(
    (acc, d) => acc + (d.indicadores?.personas || 0),
    0
  )
  return sum > 0 ? 665505 / sum : 1
}

/**
 * Formatea cualquier valor numérico a un máximo de decimales con coma decimal es-BO
 * Elimina problemas como "24.0899999999998 °C" -> "24,09 °C"
 */
export function formatNum(val, maxDecimals = 2) {
  if (val === null || val === undefined || isNaN(val)) return '—'
  const num = Number(val)
  const factor = Math.pow(10, maxDecimals)
  const rounded = Math.round(num * factor) / factor
  return rounded.toLocaleString('es-BO', {
    minimumFractionDigits: 0,
    maximumFractionDigits: maxDecimals,
  })
}
