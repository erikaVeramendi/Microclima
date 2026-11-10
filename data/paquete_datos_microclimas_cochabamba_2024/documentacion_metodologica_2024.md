
# LABORATORIO DE INTELIGENCIA DE MICROCLIMAS DE COCHABAMBA
## Documentación del conjunto de datos ambientales – 2024

### 1. Objetivo
Caracterizar las condiciones ambientales de los 15 distritos de
Cochabamba mediante indicadores de temperatura superficial terrestre
(LST) y vegetación (NDVI).

### 2. Datos y productos

- lst_cochabamba_2024_100m.tif:
  Raster de temperatura superficial terrestre, expresada en °C.

- ndvi_cochabamba_2024_100m.tif:
  Raster del índice de vegetación NDVI.

- indicadores_ambientales_distritales_2024.csv:
  Estadísticas de LST y NDVI calculadas para cada distrito.

- correlaciones_NDVI_LST_distritales_2024.csv:
  Correlaciones de Pearson entre NDVI y LST por distrito,
  con valores p y ajuste FDR de Benjamini-Hochberg.

- base_ambiental_consolidada_2024.csv:
  Tabla que integra indicadores ambientales y correlaciones.

- distritos_indicadores_ambientales_2024.geojson:
  Geometrías distritales asociadas a los indicadores ambientales.

- mapa_lst_distrital_2024.png:
  Mapa de temperatura superficial media por distrito.

- mapa_ndvi_distrital_2024.png:
  Mapa de NDVI medio por distrito.

### 3. Características espaciales

- Sistema de referencia de los rásteres: EPSG:32719.
- Resolución de análisis: 100 metros.
- Dimensiones de los rásteres: 227 × 284 píxeles.
- Distritos analizados: 15.
- Los GeoTIFF de LST y NDVI comparten extensión, resolución y
  transformación espacial.

### 4. Indicadores calculados

Para cada distrito se calcularon:

- LST media, mediana, mínima, máxima y desviación estándar.
- NDVI medio, mediana, mínimo, máximo y desviación estándar.
- Número de píxeles válidos.
- Correlación de Pearson entre NDVI y LST.
- Valor p original.
- Valor p ajustado mediante FDR.
- Indicador de significancia estadística con umbral 0.05.

### 5. Consideraciones metodológicas

- LST representa la temperatura de la superficie terrestre,
  no la temperatura del aire a dos metros de altura.
- La resolución de análisis de 100 metros corresponde a una
  cuadrícula armonizada. No implica que el sensor térmico original
  tenga una resolución nativa de 100 metros.
- NDVI es un indicador espectral de vegetación; no constituye
  un inventario exacto de árboles ni de áreas verdes.
- La correlación entre NDVI y LST no demuestra causalidad.
- Los valores p de Pearson no consideran explícitamente la
  autocorrelación espacial entre píxeles. El ajuste FDR controla
  comparaciones múltiples, pero no corrige esa dependencia espacial.
- Los límites distritales proceden de una capa geográfica pública
  utilizada en el análisis y no deben presentarse como límites
  oficiales validados por el GAMC.

### 6. Uso recomendado

Estos productos permiten explorar diferencias territoriales,
identificar patrones ambientales y orientar análisis posteriores.
Deben complementarse con mediciones de temperatura del aire,
datos municipales de áreas verdes y validación en campo antes
de utilizarlos como fundamento de intervenciones específicas.

### 7. Año de referencia

2024.
