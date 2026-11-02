# TRAZA — Laboratorio Inteligente de Microclimas Urbanos de Cochabamba
**Propuesta integral de plataforma · Arquitectura funcional y experiencia de usuario**

---

## 0. Propósito y Preguntas Guía

La idea es que **TRAZA** no sea simplemente una plataforma que muestre mapas de calor, sino un **laboratorio de inteligencia territorial** capaz de investigar qué está cambiando en Cochabamba, dónde está ocurriendo, qué factores ambientales podrían estar relacionados, qué tan confiables son los resultados y qué decisiones podrían explorarse a partir de esa evidencia.

La incorporación de **«Huella verde de Cochabamba»** permite pasar de una pregunta básica («¿qué zonas son más calientes?») a preguntas de investigación profunda:
1. ¿Qué distritos están experimentando un calentamiento sostenido?
2. ¿En qué lugares la vegetación está disminuyendo, aumentando o permaneciendo estable?
3. ¿Hay zonas donde coinciden la pérdida de vegetación y el aumento de temperatura?
4. ¿Existen lugares donde la temperatura aumenta incluso cuando la vegetación se mantiene?
5. ¿Qué zonas necesitan más mediciones para confirmar lo que estamos observando?
6. ¿Dónde tendría sentido priorizar intervenciones urbanas?
7. ¿Qué podría ocurrir si se recupera vegetación o se modifica una superficie urbana?

Cada pantalla será una parte de una investigación más grande, no una herramienta aislada.

---

## 1. Visión General de TRAZA

**De los datos satelitales a los descubrimientos territoriales y la planificación urbana.**

### Pilares Principales
- **Inteligencia térmica**: Evolución, anomalías y transformaciones de temperatura.
- **Huella verde**: Conservación, pérdida y recuperación de vegetación.
- **Investigación científica**: Relaciones, patrones, hipótesis y evidencia.
- **Inteligencia territorial**: Priorización, escenarios y apoyo a decisiones.

### ¿Qué hace diferente a TRAZA?
- **Detecta**: identifica cambios térmicos, anomalías y transformaciones de vegetación.
- **Investiga**: busca relaciones entre temperatura, vegetación, urbanización y otras variables.
- **Contrasta**: compara hipótesis y patrones entre distritos.
- **Audita**: verifica calidad, incertidumbre y limitaciones de los datos.
- **Prioriza**: identifica lugares que merecen atención según criterios transparentes.
- **Simula**: permite explorar escenarios de intervención, diferenciando estimaciones de resultados comprobados.
- **Documenta**: convierte los hallazgos en informes reproducibles.

---

## 2. Organización General (8 Áreas y 21 Pantallas)

1. **01. Centro de inteligencia**: Inicio y panorama general de Cochabamba (Pantalla 1)
2. **02. Explorador territorial**: Mapa, distritos y capas geográficas (Pantalla 2)
3. **03. Huella verde**: Vegetación, pérdida, recuperación, relación térmica y comparación distrital (Pantallas 3, 4, 5, 6)
4. **04. Inteligencia térmica**: Radar, anomalías y puntos de inflexión (Pantallas 7, 8, 9)
5. **05. Laboratorio de investigación**: Causas posibles, descubrimientos inesperados y patrones entre zonas (Pantallas 10, 11, 12)
6. **06. Evidencia y validación**: Auditoría, vacíos de información y evaluación de modelos (Pantallas 13, 14, 15)
7. **07. Planificación urbana**: Priorización explicable y simulación de escenarios (Pantallas 16, 17)
8. **08. Gestión científica**: Informes, proyectos, datos/fuentes y procesamiento/modelos (Pantallas 18, 19, 20, 21)

---

### PARTE I. CENTRO DE INTELIGENCIA

#### Pantalla 1. Centro de inteligencia — El estado ambiental de Cochabamba
- **Objetivo**: ofrecer una visión general del comportamiento térmico y ambiental de Cochabamba, mostrando qué está sucediendo, qué ha cambiado recientemente y qué descubrimientos requieren atención.
- **Contenido**:
  1. **Indicadores generales de la ciudad** (con acceso directo a su origen): Temperatura superficial promedio del período seleccionado, variación térmica respecto al período comparable anterior, distritos con tendencias de calentamiento detectadas, superficie con cambios de vegetación detectados, zonas donde coinciden cambios de vegetación y temperatura, porcentaje de cobertura de datos válidos, última fecha de actualización de cada fuente.
  2. **Mapa central de Cochabamba**: 15 distritos municipales con capas térmicas, vegetación, anomalías, cobertura del suelo y calidad de información.
  3. **El hallazgo del día**: Hallazgos candidatos propuestos por el sistema (ej. pérdida de vegetación + aumento de temperatura superficial) con acciones: abrir zona en mapa, consultar imágenes satelitales, revisar serie histórica, evaluar calidad de datos, iniciar investigación. No presenta correlación como causalidad.
  4. **Alertas inteligentes**: Anomalía térmica a revisar, nuevo período satelital disponible, zona con información insuficiente, cambio importante de vegetación, modelo que necesita validación adicional.
  5. **Actividad reciente**: Investigaciones abiertas, informes generados, distritos analizados y cambios detectados.

---

### PARTE II. EXPLORACIÓN TERRITORIAL

#### Pantalla 2. Explorador territorial — Cochabamba como un territorio de datos
- **Objetivo**: explorar geográficamente los cambios ambientales desde escala ciudad hasta zona específica.
- **Contenido**:
  1. **Mapa interactivo de los 15 distritos**: Límites distritales, selección simple/múltiple, zoom progresivo, resumen contextual, comparación de sectores.
  2. **Capas ambientales independientes**:
     - *Térmico*: Temperatura superficial, tendencias, anomalías.
     - *Vegetación*: NDVI, cambios de vegetación, pérdida y recuperación detectadas.
     - *Territorio*: Uso y cobertura del suelo, superficies construidas.
     - *Geografía*: Elevación, pendiente y relieve.
     - *Población*: Población y equipamientos (según disponibilidad).
     - *Evidencia*: Calidad, cobertura, incertidumbre y vacíos de información.
  3. **Línea de tiempo geográfica**: Cambio de año/mes/período para observar evolución espacial.
  4. **Comparador de mapas**: Vista dividida (izquierda: período anterior, derecha: posterior) con deslizador central, zoom sincronizado y tercera capa de diferencias.
  5. **Ficha territorial contextual**: Nombre del distrito/sector, temperatura superficial observada, tendencia histórica, estado de vegetación, cambios detectados, calidad de datos, investigaciones relacionadas.
- **Elemento innovador — «Viaje temporal por Cochabamba»**: Película geográfica a través de períodos disponibles sin interpolar períodos sin observaciones (identificados como vacíos).

---

### PARTE III. HUELLA VERDE DE COCHABAMBA

#### Pantalla 3. Huella verde — El patrimonio vegetal de la ciudad
- **Objetivo**: estudiar la evolución de la vegetación en los 15 distritos (conservación, aumento, disminución).
- **Contenido**:
  1. **Indicadores de huella verde**: Superficie con señales de vegetación, cambio estimado entre períodos, posibles pérdidas, posibles incrementos, zonas estables, distritos con mayores cambios, porcentaje de superficie con observaciones válidas. (Aclarando que NDVI no equivale directamente a hectáreas de áreas verdes ni distingue árboles/cultivos/jardines por sí solo).
  2. **Mapa de cobertura y comportamiento vegetal**: Vegetación detectada, incremento NDVI, disminución NDVI, condiciones estables, áreas sin evidencia suficiente.
  3. **Filtros de investigación**: Distrito, período, fuente satelital, índice utilizado, tipo de cambio, calidad de observación.
  4. **Comparación satelital histórica**: Comparación de dos períodos en respuesta espectral.
  5. **Ficha de cada zona verde**: Serie histórica NDVI, imágenes disponibles, cambios entre períodos, área analizada, calidad de observaciones, relación con variables térmicas, posibles explicaciones a investigar.
- **Elemento innovador — «Memoria verde»**: Línea de tiempo para reconstruir cambios graduales, repentinos o recuperaciones posteriores.

#### Pantalla 4. Detector de pérdida y recuperación vegetal
- **Objetivo**: identificar y cuantificar cambios en la respuesta espectral de la vegetación.
- **Contenido**:
  1. **Comparación entre períodos**: Período inicial vs. final sobre observaciones válidas.
  2. **Clasificación de cambios**: Posible disminución, posible incremento, comportamiento estable, cambio no concluyente.
  3. **Magnitud del cambio**: Mapa y gráficos de extensión espacial e intensidad.
  4. **Evolución temporal**: Progresiva, repentina, temporal o revertida.
  5. **Galería de evidencia satelital**: Imagen anterior, posterior, diferencia calculada, fechas de adquisición, sensor, % de píxeles válidos, observaciones de calidad.
  6. **Detección de transformaciones persistentes**: Niveles de persistencia a lo largo de varias observaciones comparables.
- **Elemento innovador — «Expediente de transformación verde»**: Caso digital con ubicación exacta, evidencia antes/después, evolución temporal, magnitud, calidad, variables relacionadas y estado de revisión.
- **Precaución científica**: Una reducción de NDVI no confirma tala automáticamente (puede ser sequía, estacionalidad, cosechas, humedad o calidad).

#### Pantalla 5. Analizador de relación vegetación-temperatura
- **Objetivo**: investigar si las zonas con cambios en vegetación muestran cambios en temperatura superficial.
- **Contenido**:
  1. **Mapa de coincidencias ambientales**:
     - *Disminución de vegetación + aumento térmico*: Coincidencia que merece investigación.
     - *Incremento de vegetación + disminución térmica*: Posible relación favorable.
     - *Vegetación estable + aumento térmico*: Investigar otros factores.
     - *Disminución de vegetación + temperatura estable*: No se observa coincidencia térmica en el período.
     - *Datos insuficientes*: No se puede evaluar con confianza.
  2. **Gráfico de relación entre variables**: Dispersión vegetación vs. LST, correlaciones Pearson o Spearman y modelos exploratorios.
  3. **Comparación por distrito**: Evaluar si la relación se repite o varía entre distritos.
  4. **Análisis temporal**: Evaluar si los cambios vegetales ocurren antes, durante o después de los cambios térmicos.
  5. **Control de factores adicionales**: Elevación, cobertura del suelo, superficies construidas, estacionalidad, humedad/precipitación.
- **Elemento innovador — «Detector de coincidencias ambientales»**: Búsqueda de sectores concretos donde coincidan transformaciones vegetales y térmicas, verificable a distintas escalas.

#### Pantalla 6. Comparador ambiental de los 15 distritos
- **Objetivo**: comparar el comportamiento ambiental de los 15 distritos de Cochabamba.
- **Contenido**:
  1. **Tabla comparativa**: Tendencia térmica, vegetación, cambio vegetal, anomalías, coincidencia ambiental, calidad de datos.
  2. **Ranking configurable**: Ordenar por mayor tendencia térmica, mayor disminución vegetal, mayor coincidencia vegetal-térmica, mayor cantidad de anomalías, o mayor necesidad de nuevas mediciones (sin mezclar todo en un ranking opaco).
  3. **Perfil ambiental de cada distrito**: Evolución térmica y vegetal, cambios detectados, comparación distrital, calidad de datos, investigaciones relacionadas.
- **Elemento innovador — «Distritos con comportamientos inesperados»**: Señalar distritos que se desvían del patrón general (ej. aumento térmico con vegetación estable).

---

### PARTE IV. INTELIGENCIA TÉRMICA

#### Pantalla 7. Radar de transformaciones térmicas
- **Objetivo**: distinguir zonas que ya son cálidas de aquellas que experimentan calentamiento sostenido.
- **Contenido**:
  1. **Mapa histórico térmico**: LST por período, distrito y sector.
  2. **Indicadores de tendencia**: LST media, magnitud de cambio, pendiente, significancia estadística, cantidad de observaciones válidas.
  3. **Análisis estadístico**: Mann-Kendall (tendencias monotónicas), Sen's slope (magnitud de tendencia), comparaciones temporales.
  4. **Clasificación de comportamiento térmico**:
     - Caliente y con tendencia creciente.
     - Caliente sin tendencia creciente demostrada.
     - Tendencia creciente aunque no sea de las zonas más calientes.
     - Sin tendencia concluyente.
     - Evidencia insuficiente.
  5. **Evolución por distrito**: Series históricas y mapas de tendencia.
- **Elemento innovador — «Radar de cambio, no solo de calor»**: Destacar zonas que cambian más rápido aunque no sean las más calientes hoy.

#### Pantalla 8. Detector de anomalías térmicas
- **Objetivo**: detectar comportamientos térmicos que se apartan de la referencia histórica estacional de cada zona.
- **Contenido**:
  1. **Análisis del comportamiento esperado**: Línea base histórica por sector considerando estacionalidad.
  2. **Identificación de anomalías**: LST inusualmente elevada, cambios abruptos, desviaciones entre períodos comparables, divergencia respecto al entorno.
  3. **Mapa de anomalías**: Geolocalización con magnitud, fecha y nivel de confianza.
  4. **Línea de tiempo**: Clasificación en puntual, repetida o persistente.
  5. **Investigación de anomalías**: Valor observado vs. esperado, diferencia, observaciones cercanas, calidad y variables ambientales.
- **Elemento innovador — «Anomalía contextual»**: Evaluar si una zona es inusual respecto a su propio historial y sectores comparables.

#### Pantalla 9. Detector de puntos de inflexión
- **Objetivo**: detectar momentos en los que el comportamiento térmico cambia significativamente.
- **Contenido**:
  1. **Serie histórica con eventos**: Evolución térmica marcando puntos de cambio.
  2. **Comparación antes y después**: Promedios, variabilidad, pendientes, frecuencia de anomalías, número de observaciones.
  3. **Detección estadística**: Algoritmos de detección de cambios (ej. *ruptures*) con control de calidad.
  4. **Ficha del punto de inflexión**: Fecha/intervalo estimado, magnitud, método, confianza, observaciones y factores a investigar.
- **Elemento innovador — «Historia de transformación»**: Mostrar cuándo comenzó a cambiar el comportamiento de una zona y si se mantuvo.

---

### PARTE V. LABORATORIO DE INVESTIGACIÓN

#### Pantalla 10. Investigador de posibles causas
- **Objetivo**: investigar qué variables ambientales y territoriales podrían relacionarse con los cambios térmicos observados.
- **Contenido**:
  1. **Constructor de investigaciones**: Selección de zona/distrito, variable objetivo, período y variables a contrastar.
  2. **Variables disponibles**: NDVI, cobertura/uso de suelo, superficies construidas, elevación/pendiente, LST, precipitación/humedad, población/equipamientos.
  3. **Análisis de relaciones**: Correlaciones, comparación entre grupos, regresiones, análisis multivariado, comparaciones temporales.
  4. **Panel de hipótesis**: Variables utilizadas, evidencia a favor, evidencia en contra, limitaciones y próximo análisis recomendado.
- **Elemento innovador — «Investigación guiada»**: Sugerencia transparente del procedimiento estadístico según pregunta, escala y calidad de datos.

#### Pantalla 11. Motor de descubrimientos inesperados
- **Objetivo**: encontrar patrones, relaciones o comportamientos que el investigador no estaba buscando activamente.
- **Contenido**:
  1. **Exploración automática de patrones**: Tendencias similares, cambios vegetales persistentes, anomalías repetidas, contradicciones entre variables.
  2. **Hallazgos candidatos**: Tarjetas investigables con ubicación, comparación con sectores cercanos, análisis de otras variables, verificación de evidencia y guardado como investigación.
  3. **Clasificación de descubrimientos**: Térmicos, vegetales, coincidencias ambientales, patrones distritales, cambios inesperados, contradicciones.
  4. **Exploración de relaciones no evidentes**: Sectores alejados con comportamiento similar pese a diferencias territoriales.
  5. **Historial de descubrimientos**: Estados: *Nuevo*, *En revisión*, *Verificado*, *No confirmado*, *Descartado*, *Documentado*.
- **Elemento innovador — «¿Qué no estamos viendo?»**: Propuesta automática de preguntas nuevas basadas en datos (tratadas como pistas para investigar, no verdades absolutas).

#### Pantalla 12. Investigador de patrones entre zonas
- **Objetivo**: estudiar la distribución espacial y detectar agrupaciones geográficas (clústeres).
- **Contenido**:
  1. **Detección de agrupaciones**: Zonas cálidas agrupadas, tendencias crecientes agrupadas, pérdida vegetal cercana, zonas atípicas respecto a su entorno.
  2. **Estadística espacial**: Moran's I global (autocorrelación espacial), LISA (patrones locales), clustering espacial.
  3. **Mapa de clústeres**: Alto-alto, Bajo-bajo, Alto-bajo, Bajo-alto, Sin patrón estadísticamente significativo.
  4. **Comparación entre períodos**: Persistencia, desaparición o desplazamiento de clústeres.
  5. **Perfil de cada agrupación**: Ubicación, distritos involucrados, variable, período, método, significancia y calidad.
- **Elemento innovador — «Fronteras térmicas»**: Estudio de zonas de transición entre sectores con comportamientos distintos que suelen ocultarse en promedios distritales.

---

### PARTE VI. EVIDENCIA CIENTÍFICA Y VALIDACIÓN

#### Pantalla 13. Auditor de evidencia científica
- **Objetivo**: evaluar la confiabilidad de cada análisis, datos usados, limitaciones y solidez de la evidencia.
- **Contenido**:
  1. **Ficha de calidad de cada análisis**: Fuente, sensor, fecha de adquisición, resolución espacial, cobertura disponible, píxeles descartados, nubes/sombras, período, método.
  2. **Indicadores de calidad independientes**: Cobertura espacial, completitud temporal, calidad radiométrica, consistencia entre períodos, disponibilidad de observaciones, incertidumbre.
  3. **Semáforo de evidencia** (basado en reglas transparentes):
     - *Alta*: Evidencia suficientemente consistente.
     - *Moderada*: Evidencia con limitaciones (vacíos o restricciones a considerar).
     - *Baja*: Evidencia insuficiente (no recomendable emitir conclusión sólida).
  4. **Trazabilidad científica**: Datos, filtros, método, parámetros y versión de procesamiento.
  5. **Limitaciones automáticas**: Advertencias por pocas observaciones, períodos no comparables, nubosidad alta, resoluciones distintas o variable inadecuada.
- **Elemento innovador — «No sabemos todavía»**: Capacidad explícita de declarar evidencia insuficiente sin inventar conclusiones.

#### Pantalla 14. Mapa de vacíos de información
- **Objetivo**: identificar dónde y cuándo faltan datos en Cochabamba.
- **Contenido**:
  1. **Mapa de cobertura de datos**: Observaciones suficientes, cobertura parcial, poca información, sin observaciones útiles, necesidad potencial de medición terrestre.
  2. **Vacíos temporales**: Períodos sin observaciones comparables.
  3. **Vacíos por variable**: Diferenciación de disponibilidad entre LST, vegetación, mediciones terrestres y uso de suelo.
  4. **Recomendaciones de medición**: Lugares óptimos para instalar sensores o realizar campañas.
  5. **Planificador de nuevas observaciones**: Ubicación propuesta, variable, motivo, instrumento sugerido, frecuencia, responsable, estado.
- **Elemento innovador — «Dónde medir para aprender más»**: Priorización de sensores donde más reduzcan incertidumbre (manteniendo separada la temperatura del aire terrestre de la temperatura superficial satelital LST).

#### Pantalla 15. Sistema de validación y mejora continua
- **Objetivo**: evaluar modelos y procedimientos de TRAZA, medir su desempeño y documentar su evolución.
- **Contenido**:
  1. **Registro de modelos**: Nombre, variable estimada, datos y período de entrenamiento, variables, resolución, versión, fecha.
  2. **Comparación entre estimaciones y observaciones**: MAE, RMSE, sesgo, errores por zona y por período.
  3. **Validación espacial y temporal**: Separación estricta entre entrenamiento y validación.
  4. **Comparación de versiones**: Modelo anterior vs. actualizado, impacto de nuevas variables.
  5. **Alertas de degradación**: Aviso cuando un modelo pierde precisión o representatividad.
- **Elemento innovador — «Historial de confianza»**: Trayectoria auditable del desempeño de cada modelo.

---

### PARTE VII. PLANIFICACIÓN URBANA

#### Pantalla 16. Sistema de priorización territorial explicable
- **Objetivo**: identificar sectores que requieren mayor atención ambiental mediante criterios transparentes y configurables.
- **Contenido**:
  1. **Mapa de prioridades**: Basado en tendencia de calentamiento, anomalías persistentes, disminución vegetal, coincidencia térmico-vegetal, población expuesta y cercanía a equipamientos (escuelas, salud).
  2. **Constructor de criterios**: Selección de variables y asignación interactiva de pesos/ponderaciones.
  3. **Explicación de cada prioridad**: Desglose transparente de los factores que clasificaron a una zona como prioritaria.
  4. **Comparación de escenarios de priorización**: Cambio dinámico del mapa según ajustes de pesos.
  5. **Exportación de prioridades**: Lista accionable para inspección o planificación.
- **Elemento innovador — «Prioridad explicable»**: Distinción explícita entre *prioridad ambiental*, *necesidad de medición* y *posible exposición de población*.

#### Pantalla 17. Laboratorio de escenarios urbanos
- **Objetivo**: explorar escenarios hipotéticos de intervención urbana diferenciando simulaciones exploratorias de predicciones validadas.
- **Contenido**:
  1. **Selección de territorio**: Distrito, sector, polígono dibujado o zona proveniente de otra investigación.
  2. **Biblioteca de intervenciones**: Incremento de vegetación, recuperación de espacios verdes, arbolado urbano, techos verdes, materiales de menor absorción térmica (albedo alto), recuperación de áreas degradadas, combinación de intervenciones.
  3. **Constructor de escenarios**: Tipo de intervención, área aproximada, % de superficie modificada, ubicación, distribución espacial, supuestos.
  4. **Comparación antes/después**: Situación observada vs. escenario hipotético, cambios territoriales, indicadores modificables y nivel de confianza.
  5. **Comparador de alternativas**: Escenario A vs. B vs. C (superficie, distribución, costos estimados si existen, beneficios esperados y limitaciones).
  6. **Escenarios sin predicción térmica**: Si no hay modelo validado para grados exactos, muestra superficies modificadas, evidencia de respaldo y mediciones necesarias para evaluar impacto.
- **Elementos innovadores**:
  - **«Ciudad contrafactual»**: Comparación entre ciudad observada y versión hipotética intervenida.
  - **«¿Qué pasaría si...?»**: Traductor de preguntas en configuraciones de escenario respaldadas por datos.

---

### PARTE VIII. GESTIÓN CIENTÍFICA Y HERRAMIENTAS TRANSVERSALES

#### Pantalla 18. Generador automático de informes científicos
- **Objetivo**: convertir análisis en documentos técnicos reproducibles para investigadores, estudiantes y autoridades municipales (GAMC).
- **Contenido**:
  1. **Constructor de informes**: Térmico, Huella Verde, Relación vegetación-temperatura, Distrital, Anomalías, Patrones espaciales, Priorización, Escenarios urbanos.
  2. **Selección de contenido**: Mapas, gráficos, tablas, indicadores, imágenes satelitales, resultados estadísticos, métodos, fuentes, limitaciones, conclusiones.
  3. **Estructura técnica automática**: Título/resumen, Objetivo, Área de estudio, Fuentes, Metodología, Resultados, Interpretación, Limitaciones, Conclusiones, Referencias/anexos.
  4. **Exportación**: PDF, CSV, imágenes de mapas, tablas, ficha técnica.
  5. **Trazabilidad**: ID único, versión de datos, método y parámetros.
- **Elemento innovador — «Informe vivo»**: Re-ejecución automática con nuevos datos mostrando qué resultados cambiaron respecto a versiones previas.

#### Pantalla 19. Centro de investigaciones y proyectos
- **Objetivo**: organizar investigaciones colaborativas y reproducibles dentro de TRAZA.
- **Contenido**:
  1. **Proyectos de investigación**: Espacios temáticos (evolución térmica, huella verde distrital, etc.).
  2. **Espacio de trabajo por proyecto**: Pregunta de investigación, área geográfica, período, variables, análisis ejecutados, hallazgos, mapas, informes, integrantes.
  3. **Historial de actividad**: Registro de autoría y modificaciones.
  4. **Colaboración**: Consulta, observaciones, revisión de hallazgos, validación.
  5. **Biblioteca de investigaciones**: Antecedentes reutilizables.
- **Elemento innovador — «Una investigación nunca empieza desde cero»**: Reutilización trazable de análisis, filtros y variables previas.

#### Pantalla 20. Centro de datos y fuentes
- **Objetivo**: centralizar y auditar las fuentes de información de TRAZA.
- **Contenido**:
  1. **Catálogo de fuentes**: Landsat 8 y 9, Sentinel-2, MODIS, VIIRS, ERA5-Land, NASADEM, OpenStreetMap, WorldPop, Datos municipales (GAMC), Estaciones terrestres.
  2. **Ficha de cada fuente**: Institución, variable, resolución espacial, frecuencia temporal, cobertura, formato, licencia, fecha de actualización, limitaciones conocidas.
  3. **Disponibilidad de datos**: Matriz de períodos y sectores disponibles.
  4. **Estado de conexión**: Disponible, Actualización pendiente, Error de descarga, Procesamiento incompleto, Fuente desconectada.
  5. **Registro de datos municipales (GAMC)**: Documentación de procedencia, unidades, frecuencia, calidad y acceso.
- **Elemento innovador — «Pasaporte de datos»**: Ficha adjunta a cada dataset durante todo el pipeline para garantizar trazabilidad de origen y transformaciones.

#### Pantalla 21. Centro de procesamiento y modelos
- **Objetivo**: administrar los pipelines técnicos que procesan datos satelitales y ejecutan modelos.
- **Contenido**:
  1. **Procesos**: Descarga de imágenes, filtrado de nubes/sombras, cálculo de índices vegetales, procesamiento LST, reproyección/normalización, recorte por límites municipales, composiciones temporales, cálculo de indicadores.
  2. **Ejecuciones de modelos**: Anomalías, tendencias, detección de cambios, clustering espacial, relaciones ambientales, validación.
  3. **Estados**: Pendiente, En proceso, Finalizada, Finalizada con advertencias, Error.
  4. **Registro de errores y advertencias**: Diagnóstico de fallos y observaciones descartadas.
  5. **Versionado**: Asociación estricta entre resultados, código, modelo, parámetros y datos.
- **Elemento innovador — «Reproducir análisis»**: Re-ejecución exacta de análisis históricos o comparación contra nuevos lotes de datos.

---

## 3. Herramientas Inteligentes Transversales

- **A. Asistente de investigación TRAZA**: Interfaz en lenguaje natural que interpreta consultas, identifica el módulo adecuado, ejecuta el análisis y responde con mapas/gráficos/tablas, citando fuentes, explicando métodos y declarando cuando falta evidencia.
- **B. Búsqueda global inteligente**: Búsqueda unificada de distritos, sectores, variables, hallazgos, investigaciones, informes y fuentes.
- **C. Comparador universal**: Comparación lado a lado (manteniendo escalas y unidades) de dos distritos, dos períodos, dos variables, dos imágenes satelitales, dos escenarios urbanos o dos versiones de un modelo.
- **D. Notificaciones inteligentes**: Alertas con motivo verificable (nuevas observaciones, anomalías, evidencia insuficiente, procesos completados, validación requerida).
- **E. Glosario científico contextual**: Explicación interactiva in-situ de términos técnicos (*NDVI*, *LST*, *Moran's I*, *Sen's slope*, *Mann-Kendall*, *LISA*, *RMSE*, *MAE*).
- **F. Fichas de evidencia compartibles**: Enlaces/IDs únicos por hallazgo que preservan mapa, período, variables, metodología y calidad.
- **G. Línea de investigación conectada (Ciclo TRAZA)**:
  `Detectar` → `Investigar` → `Contrastar` → `Verificar` → `Interpretar` → `Documentar` (conservando siempre el contexto: distrito, sector, períodos, variables y filtros al cambiar de pantalla).

---

## 4. Fuentes de Información y Consideraciones Científicas

| Fuente | Información | Uso dentro de TRAZA |
| :--- | :--- | :--- |
| **Landsat 8/9** | Temperatura superficial (LST) y bandas ópticas | Evolución térmica y análisis de vegetación |
| **Sentinel-2** | Bandas ópticas e índices de vegetación | Huella Verde y cambios vegetales de mayor resolución |
| **MODIS** | Información térmica y ambiental regional | Contexto temporal y regional |
| **VIIRS** | Observaciones térmicas y nocturnas | Complemento de análisis térmico |
| **ERA5-Land** | Variables meteorológicas y del suelo | Contexto climático |
| **NASADEM** | Elevación del terreno | Análisis topográfico (elevación, pendiente) |
| **OpenStreetMap** | Calles, edificios y equipamientos | Contexto urbano |
| **WorldPop** | Distribución poblacional estimada | Análisis territorial y exposición potencial |
| **Datos GAMC** | Mediciones terrestres y cartografía municipal | Validación, límites de los 15 distritos, áreas verdes y equipamientos |

**Reglas metodológicas clave**:
- Landsat mide *temperatura superficial (LST)*, no temperatura del aire.
- Sentinel-2 mide respuesta espectral vegetal (*NDVI*), no temperatura superficial.
- Comparaciones históricas deben hacerse entre temporadas equivalentes.
- Datos terrestres y satelitales se mantienen separados como magnitudes distintas.

---

## 5. Funcionalidades "WOW" Destacadas

1. **Atlas de memoria ambiental de Cochabamba**: Archivo histórico interactivo de vegetación, temperatura y uso de suelo por sector.
2. **Detector de contradicciones ambientales**: Destaca casos contraintuitivos (ej. vegetación en aumento + temperatura en aumento, o vegetación estable + calentamiento) para impulsar nuevas hipótesis.
3. **Índice de confianza territorial**: Perfil multidimensional (Cobertura de observaciones, Completitud histórica, Calidad de fuentes, Validación disponible, Incertidumbre) sin reducirlo a un número opaco.
4. **Mapa de oportunidades verdes**: Cruza pérdida vegetal persistente, calentamiento, cercanía a equipamientos y conectividad ecológica para sugerir corredores y recuperación verde (sin asumir disponibilidad legal del predio sin verificación).
5. **Gemelo ambiental de Cochabamba**: Evolución de 2D avanzado hacia representación 3D (relieve, edificaciones, LST, vegetación y escenarios).
6. **Preguntas científicas sugeridas**: Generación activa de preguntas de investigación basadas en anomalías o vacíos detectados.

---

## 6. Experiencia de Usuario (UX/UI) e Identidad Visual Oficial

El diseño debe transmitir innovación tecnológica, inteligencia artificial, investigación científica, análisis geoespacial y sostenibilidad ambiental, incorporando sutilmente los colores institucionales de la Alcaldía de Cochabamba (celeste, morado y blanco) dentro de una identidad tecnológica propia.

### 6.1. Paleta de Colores Principal

| Color | Código HEX | Uso | Proporción Visual |
| :--- | :--- | :--- | :--- |
| **Azul noche** | `#111B32` | Color principal, fondos oscuros, sidebar y navegación | ~45% |
| **Azul pizarra** | `#263B59` | Tarjetas, paneles secundarios y superficies | ~20% |
| **Blanco nube** | `#F5F7FC` | Fondos claros, superficies y documentos | ~20% |
| **Celeste tecnológico** | `#65C8F2` | Botones principales, enlaces, selecciones y elementos interactivos | ~10% |
| **Morado digital** | `#8875D8` | Funciones de IA, asistente inteligente y descubrimientos | ~5% |
| **Gris azulado** | `#A9B8CC` | Texto secundario, bordes, divisores y elementos discretos | Soporte |

**Reglas de jerarquía visual:**
- El **azul noche (`#111B32`)** domina la identidad.
- El **celeste (`#65C8F2`)** es el acento principal y el color más reconocible de las interacciones (ej. elementos activos con fondo azul pizarra e indicador celeste).
- El **morado (`#8875D8`)** se usa con moderación, exclusivamente para funciones especiales, IA, asistente inteligente y descubrimientos.
- El **blanco nube (`#F5F7FC`)** aporta limpieza, contraste y legibilidad.
- **Restricciones**: Evitar grandes superficies moradas o celestes, gradientes excesivos, efectos de neón exagerados, sombras muy fuertes, bordes luminosos innecesarios o emojis en lugar de iconografía lineal minimalista.

### 6.2. Colores Semánticos para Visualizaciones Científicas

Separados de los colores de interfaz, aplicados en mapas, leyendas, gráficos y resultados (siempre acompañados de etiquetas/leyendas):

- **Vegetación – Huella Verde**:
  - `#D9F0DC` → `#8BCB9A` → `#43A875` → `#237B5B`
- **Temperatura superficial (LST)**:
  - `#FFF0B3` → `#FFCB73` → `#F28B50` → `#D95757` → `#963D63`
- **Calidad de evidencia**:
  - Alta: `#43A875`
  - Moderada: `#E6B85C`
  - Insuficiente: `#D95757`

### 6.3. Modos Claro y Oscuro
- **Modo oscuro (Investigación, Mapas y Análisis)**: Fondo principal `#111B32`, paneles `#263B59`, texto `#F5F7FC` y `#A9B8CC`, interacciones `#65C8F2`, acento IA/descubrimiento `#8875D8`.
- **Modo claro (Informes, Tablas y Lectura)**: Fondo `#F5F7FC`, paneles `#FFFFFF`, textos `#111B32`, con `#65C8F2` y `#8875D8` utilizados con moderación.

### 6.4. Estructura de Interfaz
- **Barra lateral**: Navegación por las 8 áreas principales (discreta, fondo `#111B32`, ítem activo con superficie `#263B59` e indicador `#65C8F2`).
- **Barra superior**: Búsqueda global, período activo, contexto territorial seleccionado, asistente TRAZA, notificaciones y selector de modo claro/oscuro.
- **Área central**: Lienzo adaptable (mapa interactivo amplio, comparador dividido, matrices o laboratorio).
- **Panel lateral contextual**: Filtros, fichas territoriales, glosario y trazabilidad de evidencia.

---

## 7. Hoja de Ruta de Implementación (Fases)

- **Fase 1 — MVP Demostrable (Prioridad Máxima)**:
  - Pantalla 1 (Centro de inteligencia)
  - Pantalla 2 (Explorador territorial)
  - Pantalla 7 (Radar de transformaciones térmicas)
  - Pantalla 3 (Huella Verde)
  - Pantalla 4 (Detector de cambios vegetales)
  - Pantalla 5 (Relación vegetación-temperatura)
  - Pantalla 13 (Auditoría básica de evidencia)
  - Pantalla 18 (Informes básicos)
- **Fase 2 — Inteligencia Avanzada**:
  - Pantallas 8 (Anomalías), 9 (Puntos de inflexión), 10 (Posibles causas), 11 (Motor de descubrimientos), 12 (Patrones espaciales), 6 (Comparador de distritos) y 14 (Mapa de vacíos).
- **Fase 3 — Planificación Urbana**:
  - Pantallas 16 (Priorización explicable), 17 (Laboratorio de escenarios), Mapa de oportunidades verdes, mediciones terrestres y Pantalla 15 (Validación de modelos).
- **Fase 4 — Plataforma Inteligente Ampliada**:
  - Asistente científico avanzado, Informes vivos, Pantalla 19 (Colaboración/Proyectos), Pantalla 20 (Pasaporte de datos), Pantalla 21 (Procesamiento), Atlas histórico y Gemelo 3D.

