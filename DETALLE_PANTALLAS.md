# PROYECTO DE MICROCLIMA — Documento Maestro de Pantallas y Arquitectura Funcional

> **Propósito de este documento**: Detallar la arquitectura funcional, visual, científica y tecnológica de las pantallas de la plataforma en **el proyecto de Microclima**, integrando de manera ordenada y coherente **los dos enfoques oficiales del desafío NASA Space Apps Challenge × Alcaldía de Cochabamba (GAMC)**:
> 1. **Enfoque Local 1**: Microclimas Urbanos con Inteligencia Artificial.
> 2. **Enfoque Local 2**: Visualizador de Datos Satelitales para Gestión Distrital.
> 
> Todas las capacidades analíticas, ideas de investigación, efectos interactivos (WOW), fuentes satelitales/municipales y asistentes de IA transversal se estructuran sin numeración rígida en dos grandes bloques sinérgicos.

---

## 1. Filosofía del Proyecto y Articulación de los Dos Enfoques

El proyecto no es un visor estático de mapas de calor ni un cuadro de mando decorativo: es un **laboratorio digital de inteligencia climática y gestión territorial** que une los datos de observación de la Tierra de la **NASA y la ESA** con las mediciones terrestres y la cartografía oficial del **Gobierno Autónomo Municipal de Cochabamba (GAMC)**.

### Matriz de Articulación de Enfoques

```
                              EL PROYECTO DE MICROCLIMA
                                          │
         ┌────────────────────────────────┴────────────────────────────────┐
         ▼                                                                 ▼
ENFOQUE LOCAL 1 (NASA × IA)                                       ENFOQUE LOCAL 2 (GAMC × GESTIÓN)
"Microclimas Urbanos con IA"                                     "Visualizador para Gestión Distrital"
         │                                                                 │
├── Diagnóstico y Radar de Alertas                               ├── Explorador, Rutas y Expansión
├── Inteligencia de la Vegetación y Huella Verde                 ├── Gemelo Digital y Desigualdad Térmica
└── Correlaciones Ambientales y Red MÓNICA                       └── Centro de Datos y Auditoría Algorítmica
```

### Reglas Metodológicas Fundamentales
1. **Diferenciación Radiativa (`LST ≠ Temperatura del Aire`)**: La Temperatura Superficial Terrestre (*LST*) mide la emisión infrarroja térmica de superficies (asfalto, techos, copas arbóreas y suelo) captada por satélites a 30 metros de resolución, mientras que la temperatura del aire se mide a 1.5–2 metros sobre el suelo en estaciones meteorológicas. La plataforma exhibe esta distinción técnica de manera permanente.
2. **Índice Biofísico (`NDVI ≠ Conteo Directo de Árboles`)**: El Índice de Vegetación de Diferencia Normalizada (*NDVI*) refleja vigor fotosintético y densidad espectral de clorofila. No equivale directamente a un inventario forestal individual sin métodos adicionales de calibración.
3. **Inferencia Estadística (`Correlación ≠ Causalidad`)**: Toda coincidencia espacial o correlación de Pearson/Spearman se presenta como evidencia estadística contrastable y reproducible, sin convertirla automáticamente en una afirmación causal sin diseño experimental que la soporte.
4. **Fidelidad Cartográfica Distrital**: Los límites de los 15 distritos de Cochabamba provienen de los polígonos vectoriales oficiales del GAMC.
5. **Transparencia en Vacíos de Observación**: No se interpolan datos ficticios en días con nubosidad densa sobre el Valle de Cochabamba ni se simulan telemetrías en tiempo real si el sensor opera con frecuencia de revisión periódica.

---

## 2. Especificación Detallada de Pantallas

---

### BLOQUE: ENFOQUE LOCAL 1 — Microclimas Urbanos con Inteligencia Artificial

---

### Pantalla: Diagnóstico General y Radar de Alertas Climáticas
*Punto de entrada ejecutivo y triaje bioclimático municipal.*

* **Concepto y Propósito:**
  Ofrece una lectura instantánea y comprensiva del estado térmico y ambiental del municipio de Cochabamba. Responde con rapidez a las preguntas: *«¿Cuál es la gravedad térmica actual del valle? ¿Qué distritos presentan anomalías críticas que demandan intervención inmediata?»*.
* **Componentes Visuales y Gráficos:**
  * **Tarjetas de Diagnóstico General:**
    * *Temperatura Superficial Terrestre Promedio Municipal*: 29.6 °C calculada sobre la mancha urbana.
    * *Gradiente Térmico Crítico*: Brecha de 7.9 °C entre el distrito más fresco y el más cálido.
    * *Distrito en Alerta Roja*: Distrito 9 en nivel crítico (33.1 °C promedio, con máximos que superan los 38 °C).
    * *Cobertura Vegetal Promedio*: Índice NDVI medio municipal de 0.21 (bajo vigor generalizado).
  * **Radar de Anomalías Distritales:**
    * Matriz de semaforización bioclimática (Verde: Estable; Amarillo: Precaución; Rojo: Alerta Crítica) que jerarquiza los 15 distritos según su índice de calor sostenido.
  * **Mapa de Triaje Bioclimático:**
    * Lienzo vectorial interactivo con los 15 distritos de Cochabamba coloreados según su clasificación de riesgo térmico para una lectura comprensible en menos de diez segundos.
  * **El Hallazgo del Día:**
    * Ficha analítica destacada que resalta la mayor anomalía multivariable detectada recientemente para evaluación humana inmediata.
* **Datos y Herramientas Científicas:**
  * Sensor térmico TIRS a bordo de Landsat 8/9 (resolución espacial de 30 metros) procesado con emisividad de banda fraccionaria.
  * Cartografía vectorial oficial de distritos provista por el GAMC.
* **Asistente de IA Contextual (Orientador Climático):**
  * Analiza el distrito seleccionado, describe si la anomalía proviene de falta de vegetación o de materiales de alta absorción calórica y sugiere los módulos de profundización pertinentes.
* **Efecto WOW:**
  * Animación de barrido orbital bioluminiscente que recorre la cuenca del valle destacando con contornos luminosos las zonas que exceden el umbral térmico de seguridad.
* **Utilidad para la Alcaldía (GAMC):**
  * Permite al Alcalde y directores de despacho emitir alertas preventivas a la población y priorizar recursos de atención de emergencias bioclimáticas.

---

### Pantalla: Inteligencia de la Vegetación y Huella Verde Urbana
*Estudio biofísico de la masa vegetal, memoria verde y déficit de arbolado.*
*Título conceptual: «El verde también cuenta la historia de una ciudad».*

* **Concepto y Propósito:**
  Monitorea la dinámica vegetal del municipio, detecta pérdidas o recuperaciones del dosel y calcula con rigor científico la **Huella Verde Urbana**: el volumen de arbolado y metros cuadrados necesarios para mitigar el calentamiento superficial. Responde a: *«¿Cómo cambia la actividad vegetal? ¿Dónde hay pérdidas permanentes? ¿Cuántos árboles le faltan a cada distrito para enfriar su entorno?»*.
* **Componentes Visuales y Gráficos:**
  * **Cálculo y Visualización de NDVI:**
    * Mapa de vigor vegetal con escala espectral continua de -1.0 a +1.0.
    * Identificación de contrastes: Distrito 12 (NDVI de 0.32, zona norte y parques) versus Distrito 9 (NDVI de 0.14, zona sur árida).
  * **Módulo de Detección de Cambios y Permanencia:**
    * Distinción analítica entre variaciones estacionales (época seca invernal) y pérdidas irreversibles debidas a consolidación urbana o pavimentación.
  * **Calculadora de Balance de Huella Verde:**
    * Selector distrital que calcula:
      1. Índice de metros cuadrados de área verde por habitante frente al estándar de la Organización Mundial de la Salud (OMS).
      2. Déficit específico de arbolado urbano.
      3. Meta de reforestación en hectáreas requerida para lograr un descenso térmico proyectado de 1 °C a 2 °C.
  * **Curva de Enfriamiento por Cobertura:**
    * Gráfico que muestra la relación entre incrementos marginales de cobertura vegetal y la reducción de la temperatura radiativa superficial.
* **Datos y Herramientas Científicas:**
  * Sentinel-2 (bandas Rojo y NIR a 10 metros de resolución espacial) con procesamiento de máscaras de nubes Cloud Score+.
  * Landsat 8/9 para series temporales ópticas históricas.
* **Asistente de IA Contextual (Especialista en Vegetación):**
  * Interpreta descensos de NDVI distinguiendo observaciones de hipótesis, advierte sobre factores de sequía transitoria y propone especies nativas recomendadas para cada piso ecológico del valle (molle, jacarandá, tipa).
* **Efecto WOW:**
  * Visualización temporal interactiva con comparador tipo cortina deslizante que revela la evolución del verdor urbano año tras año.
* **Utilidad para la Alcaldía (GAMC):**
  * Provee a la Empresa Municipal de Áreas Verdes y Recreación Alternativa (EMAGRA) y a la Dirección de Medio Ambiente (DIMA) la justificación técnica de hectáreas y especies requeridas para optimizar el plan anual de forestación.

---

### Pantalla: Correlaciones Ambientales y Red MÓNICA Terrestre
*Validación cruzada entre datos orbitales de la NASA y la red municipal de calidad del aire.*

* **Concepto y Propósito:**
  Investiga las relaciones estadísticas entre calor, vegetación y contaminación atmosférica, integrando las mediciones de los sensores físicos terrestres del GAMC. Responde a: *«¿Existe un acoplamiento real entre la ausencia de árboles, las islas de calor y el material particulado en Cochabamba?»*.
* **Componentes Visuales y Gráficos:**
  * **Gráfico de Dispersión Espectral (Scatter Plot):**
    * Relación bivariada pixel a pixel entre NDVI y LST con línea de tendencia ajustada, demostrando la correlación inversa negativa de manera cuantitativa.
  * **Perfil Diurno de la Red MÓNICA de Calidad del Aire (24 Horas):**
    * Gráfico cronológico de 00:00 a 23:00 con concentraciones reales de material particulado (PM10 y PM2.5) registradas en las estaciones de Parque Kanata (zona sur) y SEMAPA (zona norte).
    * Visualización de los picos matutinos y nocturnos asociados al tráfico vehicular y fenómenos de inversión térmica propios de la cuenca cerrada de Cochabamba.
  * **Matriz de Validación Estadística y Significancia:**
    * Cuadros de coeficientes de correlación de Pearson y Spearman, valores de significancia y control de tasa de falsos descubrimientos (Benjamini-Hochberg) para garantizar rigor científico.
* **Datos y Herramientas Científicas:**
  * Base de datos histórica de la Red MÓNICA del GAMC (más de 125.000 registros horarios reales de calidad del aire).
  * Estadísticas de regresión biofísica calculadas en cuadernos de ciencia de datos del proyecto.
* **Asistente de IA Contextual (Analista Estadístico Ambiental):**
  * Explica los coeficientes de correlación en términos accesibles para tomadores de decisiones, recordando la estricta separación entre correlación matemática y causalidad fáctica.
* **Efecto WOW:**
  * Constructor visual de relaciones con grafo dinámico donde las variables seleccionadas se interconectan mostrando el nivel de evidencia y el tamaño de muestra de respaldo.
* **Utilidad para la Alcaldía (GAMC):**
  * Facilita a la Dirección de Medio Ambiente y a la Secretaría de Salud la evidencia requerida para respaldar normativas de contingencia ambiental y control de emisiones vehiculares en temporadas de alta concentración de partículas.

---

### BLOQUE: ENFOQUE LOCAL 2 — Visualizador de Datos Satelitales para Gestión Distrital

---

### Pantalla: Explorador Cartográfico, Rutas Térmicas y Expansión Urbana
*Plataforma cartográfica interactiva, simulación de movilidad bioclimática y memoria de crecimiento urbano.*

* **Concepto y Propósito:**
  Herramienta geoespacial avanzada para planificar el territorio a escala de distrito, manzana y vía de transporte. Integra el **Observatorio de Expansión Urbana** y el **Simulador de Rutas Térmicamente Favorables** para orientar la movilidad sostenible y el ordenamiento territorial. Responde a: *«¿Cómo ha crecido la mancha urbana y qué impacto térmico generó? ¿Cómo pueden los ciudadanos y el transporte desplazarse con menor exposición al calor?»*.
* **Componentes Visuales y Gráficos:**
  * **Lienzo Cartográfico Dominante:**
    * Visualizador vectorial con límites precisos de los 15 distritos de Cochabamba y soporte para capas ráster superpuestas con control de opacidad.
  * **Gestor de Capas Multiespectrales y Municipales:**
    * Capas satelitales de temperatura superficial y cobertura vegetal.
    * Conexión a servicios de mapas web (WMS) oficiales del GAMC (zonificación, cota 2750 del Parque Nacional Tunari, curvas de nivel).
    * Capa de transporte público urbano con más de 100 líneas de micros y trufis georreferenciadas.
  * **Observatorio de Expansión Urbana Multitemporal:**
    * Comparador satelital de crecimiento urbano que evidencia la conversión progresiva de suelo agrícola o permeable en superficies impermeabilizadas de alta inercia térmica en el sector sur de la ciudad.
  * **Simulador de Rutas Térmicamente Favorables:**
    * Herramienta de ruteo que evalúa dos alternativas entre un origen y destino:
      1. *Ruta Convencional de Alta Exposición*: Trayecto directo por vías desprovistas de arbolado con temperaturas superficiales de 34 °C a 37 °C.
      2. *Ruta de Confort Bioclimático*: Trayecto que aprovecha corredores verdes, vías arboladas y plazas, con una reducción térmica de hasta 4 °C a 6 °C en superficie.
* **Datos y Herramientas Científicas:**
  * Red de rutas de transporte público del GAMC.
  * Modelos de elevación digital NASADEM (30 metros) para perfiles topográficos.
  * Series históricas de sensores Landsat y Sentinel.
* **Asistente de IA Contextual (Asistente Geoespacial):**
  * Sugiere combinaciones de capas temáticas según el objetivo del planificador (infraestructura, áreas verdes o movilidad) y evalúa los perfiles de elevación hacia el Tunari.
* **Efecto WOW:**
  * Modo de pantalla completa inmersivo con selección territorial luminosa y cortina interactiva de comparación temporal suave.
* **Utilidad para la Alcaldía (GAMC):**
  * Instrumento esencial para la Dirección de Movilidad Urbana y la Secretaría de Planificación en el diseño de ciclovías arboladas, ubicación estratégica de paradas de transporte con refugio solar y control de loteamientos periurbanos.

---

### Pantalla: Gemelo Digital y Detector de Desigualdad en Exposición al Calor
*Diagnóstico de justicia bioclimática y laboratorio de simulación urbana contrafactual.*
*Título conceptual: «¿Qué pasaría si transformamos una zona?».*

* **Concepto y Propósito:**
  Conecta la física del microclima con la vulnerabilidad social de la población. Permite visibilizar la **desigualdad en la exposición al calor** sobre equipamientos sensibles y actúa como un **Gemelo Digital y Laboratorio de Escenarios («¿Qué pasaría si...?»)** para simular el impacto bioclimático de intervenciones urbanas antes de ejecutar obras públicas. Responde a: *«¿Qué escuelas y hospitales sufren mayor calor extremo? ¿Cuánto bajaría la temperatura si reforestamos un sector o instalamos techos reflectantes?»*.
* **Componentes Visuales y Gráficos:**
  * **Detector de Desigualdad en Exposición al Calor:**
    * Cruce geoespacial de calor superficial (*LST*) con la localización de escuelas públicas, postas de salud, hospitales y densidad habitacional.
    * Semáforo de vulnerabilidad térmica por equipamiento que destaca recintos educativos con patios expuestos a radiación extrema sin sombra arbórea.
    * Indicador de brecha bioclimática norte-sur de Cochabamba.
  * **Laboratorio de Escenarios Contrafactuales:**
    * Controles deslizantes para parametrizar proyectos:
      * Porcentaje de incremento en cobertura de árboles.
      * Implementación de corredores biológicos continuos.
      * Modificación de albedo en techos de edificaciones (superficies frías/reflectantes).
    * Simulación inmediata del mapa térmico proyectado y cálculo de la reducción estimada de temperatura en el entorno inmediato.
  * **Matriz de Priorización Territorial Multicriterio Explicable:**
    * Clasificación distrital transparente calculada a partir de severidad térmica, déficit de vegetación, densidad demográfica y concentración de población vulnerable.
* **Datos y Herramientas Científicas:**
  * Cartografía municipal de equipamientos de salud y educación del GAMC.
  * Estimaciones de densidad poblacional de WorldPop / Censo municipal.
  * Modelo analítico calibrado de sensibilidad térmica superficial.
* **Asistente de IA Contextual (Asesor de Planificación Urbana):**
  * Ayuda a configurar escenarios balanceados de inversión, advierte sobre la incertidumbre de las estimaciones y redacta justificaciones técnicas orientadas a la captación de fondos internacionales para resiliencia climática.
* **Efecto WOW:**
  * Laboratorio interactivo que actualiza el mapa con una transición visual inmediata al desplazar los parámetros de intervención, mostrando cómo la "isla de calor" retrocede conceptualmente ante la vegetación proyectada.
* **Utilidad para la Alcaldía (GAMC):**
  * Permite a la Secretaría de Infraestructura y a Desarrollo Humano fundamentar presupuestos participativos, priorizar la climatización pasiva de escuelas en el Distrito 9 y justificar ante el Concejo Municipal planes integrales de arborización.

---

### Pantalla: Centro de Datos, Auditoría Algorítmica y Reportes Ejecutivos
*Transparencia técnica, pasaporte de evidencia científica y generador de documentación oficial.*

* **Concepto y Propósito:**
  Es el centro de confianza y gobernanza de la plataforma. Asegura que toda afirmación, mapa o prioridad generada sea reproducible, transparente y auditable, proveyendo al mismo tiempo un canal directo para la emisión de informes técnicos oficiales. Responde a: *«¿De dónde salió cada dato? ¿Qué nivel de incertidumbre tiene este modelo? ¿Cómo genero un informe listo para firma ejecutiva?»*.
* **Componentes Visuales y Gráficos:**
  * **Catálogo de Fuentes y Pasaporte de Trazabilidad:**
    * Ficha completa por cada capa satelital y municipal: satélite, sensor, fecha de captura, porcentaje de nubosidad, resolución espacial y licencia de uso.
  * **Auditoría de Algoritmos y Validación de Modelos:**
    * Métricas de precisión estadística (error absoluto medio, raíz del error cuadrático medio y coeficiente de determinación $R^2$) para los modelos utilizados.
    * Mapa de vacíos de observación e incertidumbre espectral.
  * **Generador de Reportes Ejecutivos Distritales:**
    * Módulo de exportación automatizada de informes formales (resumen ejecutivo, diagnóstico de calor, huella verde, gráficos de calidad del aire y recomendaciones de acción).
  * **Centro de Descarga de Datos Abiertos:**
    * Exportación directa de capas procesadas en formatos estándar de la industria geoespacial (GeoJSON y CSV) para su empleo en QGIS, ArcGIS o bases de datos municipales.
* **Datos y Herramientas Científicas:**
  * Metadatos estandarizados de misiones NASA/USGS Landsat y Copernicus Sentinel.
  * Registros históricos consolidados del paquete metodológico de microclimas Cochabamba 2024.
* **Asistente de IA Contextual (Auditor Científico y Redactor):**
  * Revisa la consistencia técnica de los análisis, advierte sobre límites de resolución y redacta síntesis ejecutivas adaptadas al lenguaje institucional del municipio.
* **Efecto WOW:**
  * «Pasaporte Científico Interactivo»: diagrama de flujo de trazabilidad donde el usuario puede recorrer visualmente cada dato desde el píxel captado en órbita hasta la decisión territorial recomendada.
* **Utilidad para la Alcaldía (GAMC):**
  * Aporta a los equipos técnicos y jurídicos del municipio la solvencia documental necesaria para sostener proyectos de ley municipal, responder minutas de comunicación y respaldar auditorías de gestión ambiental.

---

## 3. Sistema de Inteligencia Artificial Transversal

La inteligencia artificial no opera como un asistente flotante aislado, sino como una **capa de razonamiento transversal** integrada en la barra de herramientas y sincronizada con el estado de la plataforma.

### Estructura de Asistencia
1. **Asistente Principal de Barra Superior:**
   * Orienta sobre las capacidades globales del proyecto, guía la navegación metodológica y resuelve dudas conceptuales generales.
2. **Asistentes Contextuales por Pantalla:**
   * *Orientador Climático*: en Diagnóstico y Radar.
   * *Especialista en Vegetación*: en Inteligencia de la Vegetación y Huella Verde.
   * *Analista Estadístico Ambiental*: en Correlaciones Ambientales y Red MÓNICA.
   * *Asistente Geoespacial*: en Explorador Cartográfico, Rutas y Expansión.
   * *Asesor de Planificación Urbana*: en Gemelo Digital y Desigualdad Térmica.
   * *Auditor Científico y Redactor*: en Centro de Datos y Reportes.

### Reglas Éticas y Científicas de la IA
* No inventa valores ni fuentes no existentes.
* Distingue con claridad entre un dato medido directamente, una estimación matemática y una hipótesis de trabajo.
* Cita siempre la resolución y el sensor de referencia.
* Requiere confirmación explícita del usuario antes de exportar o modificar configuraciones.

---

## 4. Funciones Transversales Avanzadas

1. **Contexto Territorial Compartido:**
   * Al seleccionar un distrito de interés en una pantalla, dicha selección se preserva activamente al cambiar a cualquier otra pantalla, garantizando continuidad en la investigación.
2. **Buscador Global Inteligente:**
   * Barra de búsqueda omnicanal capaz de indexar distritos, equipamientos (hospitales, colegios), variables ambientales, capas satelitales y reportes guardados.
3. **Comparador Universal:**
   * Mecanismo para confrontar en paralelo dos distritos, dos ventanas temporales o dos escenarios de intervención urbana.
4. **Glosario Científico Integrado:**
   * Definiciones claras y fórmulas al seleccionar conceptos técnicos clave (*LST, NDVI, PM10, Correlación de Pearson, Inversión Térmica*).
5. **Notificaciones de Calidad y Nuevas Observaciones:**
   * Indicador discreto sobre nuevas imágenes satelitales procesadas, alertas térmicas o cambios en la calidad del aire.

---

## 5. Resumen de Mapeo de Capacidades Clave

| Capacidad Clave Integrada | Pantalla donde Reside | Enfoque Oficial al que Contribuye |
| :--- | :--- | :--- |
| **Diagnóstico y Alertas Térmicas** | Diagnóstico General y Radar de Alertas Climáticas | Enfoque 1 (IA y Microclimas) |
| **Huella Verde Urbana** | Inteligencia de la Vegetación y Huella Verde Urbana | Enfoque 1 (IA y Microclimas) |
| **Detección de Cambios Vegetales y Permanencia** | Inteligencia de la Vegetación y Huella Verde Urbana | Enfoque 1 (IA y Microclimas) |
| **Cruce Satelital con Red MÓNICA Terrestre** | Correlaciones Ambientales y Red MÓNICA Terrestre | Enfoque 1 (IA y Microclimas) |
| **Validación de Significancia Estadística** | Correlaciones Ambientales y Red MÓNICA Terrestre | Enfoque 1 (IA y Microclimas) |
| **Simulador de Rutas Térmicamente Favorables** | Explorador Cartográfico, Rutas Térmicas y Expansión Urbana | Enfoque 2 (Gestión Distrital GAMC) |
| **Observatorio de Expansión Urbana Multitemporal** | Explorador Cartográfico, Rutas Térmicas y Expansión Urbana | Enfoque 2 (Gestión Distrital GAMC) |
| **Capas de Transporte GAMC y Geoportal WMS** | Explorador Cartográfico, Rutas Térmicas y Expansión Urbana | Enfoque 2 (Gestión Distrital GAMC) |
| **Detector de Desigualdad en Exposición al Calor** | Gemelo Digital y Detector de Desigualdad en Exposición al Calor | Enfoque 2 (Gestión Distrital GAMC) |
| **Laboratorio de Escenarios Contrafactuales** | Gemelo Digital y Detector de Desigualdad en Exposición al Calor | Enfoque 2 (Gestión Distrital GAMC) |
| **Priorización Multicriterio Explicable** | Gemelo Digital y Detector de Desigualdad en Exposición al Calor | Enfoque 2 (Gestión Distrital GAMC) |
| **Auditoría Científica, Pasaporte de Datos e Informes** | Centro de Datos, Auditoría Algorítmica y Reportes Ejecutivos | Enfoque 2 (Gestión Distrital GAMC) |
