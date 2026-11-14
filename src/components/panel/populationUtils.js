/**
 * Utilidades para ajuste de fuentes de población en el Enfoque 2
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
