# PROYECTO DE MICROCLIMA — Especificación Integral de la Plataforma
**Laboratorio Inteligente de Microclimas Urbanos y Gestión Distrital de Cochabamba**
*Arquitectura Funcional, Rigor Científico y Experiencia de Usuario*

---

## 1. Declaración de Misión y Planteamiento del Problema

El municipio de Cochabamba se ubica en un valle interandino cerrado caracterizado por fenómenos marcados de inversión térmica, rápida expansión urbana hacia la periferia sur y una creciente disparidad en la distribución del arbolado urbano y la infraestructura de sombra.

El **proyecto de Microclima** aborda este desafío respondiendo de manera simultánea y sinérgica a los **dos retos de la convocatoria NASA Space Apps Challenge en articulación con el Gobierno Autónomo Municipal de Cochabamba (GAMC)**:

1. **Enfoque Local 1: Microclimas Urbanos con Inteligencia Artificial**  
   Aplicar modelos analíticos, ciencia de datos y observaciones satelitales de alta resolución espectral de la NASA y la ESA para desentrañar la física de la temperatura superficial, la salud vegetal y la calidad del aire en los 15 distritos de Cochabamba.

2. **Enfoque Local 2: Visualizador de Datos Satelitales para Gestión Distrital**  
   Traducir los datos geoespaciales complejos en una plataforma web interactiva de apoyo a la toma de decisiones que permita a las secretarías municipales comparar la calidad socioambiental distrital, simular obras urbanas y orientar la inversión pública hacia la resiliencia climática.

---

## 2. Los Dos Grandes Bloques de la Plataforma

Para ofrecer una experiencia de usuario clara, ejecutiva y sin fragmentación, todas las capacidades analíticas de la plataforma se estructuran en dos bloques de trabajo:

```
                            EL PROYECTO DE MICROCLIMA
                                        │
       ┌────────────────────────────────┴────────────────────────────────┐
       ▼                                                                 ▼
ENFOQUE LOCAL 1 (NASA × IA)                                     ENFOQUE LOCAL 2 (GAMC × GESTIÓN)
"Microclimas Urbanos con IA"                                   "Visualizador para Gestión Distrital"
       │                                                                 │
├── Diagnóstico y Radar de Alertas                             ├── Explorador, Rutas y Expansión
├── Inteligencia de la Vegetación y Huella Verde               ├── Gemelo Digital y Desigualdad Térmica
└── Correlaciones Ambientales y Red MÓNICA                     └── Centro de Datos y Auditoría Algorítmica
```

---

## 3. Especificación Funcional por Bloques y Pantallas

---

### BLOQUE: ENFOQUE LOCAL 1 — Microclimas Urbanos con Inteligencia Artificial

---

### Diagnóstico General y Radar de Alertas Climáticas
* **Propósito**: Proveer un resumen ejecutivo del estado biofísico de Cochabamba y operar como un radar de detección temprana de anomalías climáticas distritales.
* **Preguntas Guía**:
  * ¿Cuál es el promedio y el rango de temperatura superficial en Cochabamba hoy?
  * ¿Qué distritos se encuentran en situación de estrés térmico crítico?
  * ¿Qué anomalías recientes ameritan una intervención de salud preventiva o ambiental?
* **Capacidades Principales**:
  * Visualización de indicadores de cabecera con trazabilidad directa a su sensor de origen.
  * Matriz semafórica de alerta climática que clasifica los 15 distritos según umbrales de severidad térmica.
  * Mapa vectorial simplificado para lectura rápida del gradiente térmico de la ciudad.
  * Módulo «El Hallazgo del Día» para destacar el comportamiento bioclimático más inusual detectado.
* **Herramientas de IA y Efecto WOW**:
  * Asistente Orientador Climático que traduce anomalías complejas a recomendaciones operativas.
  * Animación de barrido orbital con iluminación de contornos de calor en los distritos en alerta.

---

### Inteligencia de la Vegetación y Huella Verde Urbana
* **Propósito**: Analizar la dinámica de la masa vegetal urbana, diferenciar pérdidas transitorias de talas o deforestaciones permanentes y calcular la Huella Verde necesaria para contrarrestar las islas de calor.
* **Preguntas Guía**:
  * ¿Cómo se distribuye el vigor fotosintético entre el norte y el sur de la ciudad?
  * ¿Qué sectores muestran una pérdida persistente de cobertura vegetal en los últimos años?
  * ¿Cuánta masa arbórea le falta a cada distrito para enfriar su entorno urbano?
* **Capacidades Principales**:
  * Procesamiento espectral de NDVI a 10 metros de resolución espacial con eliminación rigurosa de nubosidad.
  * Análisis de permanencia que evita confundir la sequía estacional de invierno con la pérdida permanente de suelo permeable.
  * **Calculadora de Huella Verde Urbana**: Modelo que cuantifica el déficit de metros cuadrados de vegetación por habitante frente a estándares internacionales de la OMS y estima la superficie de plantación requerida para lograr descensos térmicos específicos.
  * Curvas empíricas de enfriamiento por cobertura verde.
* **Herramientas de IA y Efecto WOW**:
  * Asistente Botánico Espectral que asesora sobre especies nativas recomendables para reforestación.
  * Deslizador interactivo de comparación temporal que permite observar visualmente la transformación del dosel verde.

---

### Correlaciones Ambientales y Red MÓNICA Terrestre
* **Propósito**: Integrar los sensores en órbita con los datos físicos terrestres de Cochabamba, validando de forma cuantitativa la relación entre cobertura vegetal, calor superficial y material particulado atmosférico.
* **Preguntas Guía**:
  * ¿Existe una correlación estadísticamente significativa entre la falta de vegetación y el incremento de calor en el municipio?
  * ¿Cómo se comporta la calidad del aire a lo largo de las 24 horas del día en las estaciones oficiales del GAMC?
  * ¿Qué tan confiables y generalizables son estas observaciones matemáticas?
* **Capacidades Principales**:
  * Diagramas de dispersión bivariados (NDVI frente a LST) con ajuste de regresión y cálculo de coeficientes de Pearson y Spearman.
  * Visualizador cronológico del perfil de 24 horas de la Red MÓNICA (material particulado fino PM10 y PM2.5) en estaciones clave como Parque Kanata y SEMAPA.
  * Validación estadística con control de tasa de falsos descubrimientos (Benjamini-Hochberg) para certificar solidez metodológica.
* **Herramientas de IA y Efecto WOW**:
  * Asistente Analista Estadístico que formula advertencias explícitas sobre correlación frente a causalidad.
  * Grafo dinámico interactivo que conecta variables ambientales mostrando tamaño de muestra y nivel de evidencia.

---

### BLOQUE: ENFOQUE LOCAL 2 — Visualizador de Datos Satelitales para Gestión Distrital

---

### Explorador Cartográfico, Rutas Térmicas y Expansión Urbana
* **Propósito**: Transformar la cartografía satelital en un instrumento operativo de ordenamiento del territorio, movilidad sustentable y monitoreo de la urbanización.
* **Preguntas Guía**:
  * ¿Cómo ha avanzado la frontera urbana en la periferia de Cochabamba y cómo ha transformado su clima local?
  * ¿Cuáles son las rutas de transporte público más expuestas a estrés calórico extremo?
  * ¿Por dónde pueden circular peatones y ciclistas aprovechando corredores de mayor confort bioclimático?
* **Capacidades Principales**:
  * Lienzo geoespacial interactivo con límites distritales oficiales del GAMC y control de opacidad de capas ráster.
  * **Observatorio de Expansión Urbana Multitemporal**: Comparador de series temporales que documenta la sustitución de suelos agrícolas por asfalto y techumbres calientes.
  * **Simulador de Rutas Térmicamente Favorables**: Algoritmo de ruteo urbano que compara trayectos convencionales de alta radiación contra itinerarios bioclimáticos de sombra y arbolado.
  * Integración de la red de transporte público municipal (+100 líneas) y capas del Geoportal WMS de la Alcaldía.
* **Herramientas de IA y Efecto WOW**:
  * Asistente Geoespacial para optimización de capas temáticas y transectos altitudinales.
  * Modo de pantalla completa con sombreado de relieve y cortina deslizante de comparación histórica.

---

### Gemelo Digital y Detector de Desigualdad en Exposición al Calor
* **Propósito**: Evaluar la equidad bioclimática del municipio cruzando el clima con la infraestructura social, y brindar un laboratorio de simulación de intervenciones urbanas antes de su ejecución.
* **Preguntas Guía**:
  * ¿Qué escuelas, postas sanitarias y hospitales se encuentran inmersos en islas de calor críticas?
  * ¿Cuál es la disparidad en exposición térmica entre los distritos del norte y los del sur?
  * ¿Qué reducción térmica estimada se obtendría al plantar arbolado o colocar techos reflectantes en un sector específico?
* **Capacidades Principales**:
  * **Detector de Desigualdad en Exposición al Calor**: Análisis espacial que cruza focos térmicos con recintos educativos, centros de salud y densidad de viviendas.
  * **Laboratorio de Escenarios Contrafactuales («¿Qué pasaría si...?»)**: Simulador paramétrico para proyectar el impacto de intervenciones de reforestación urbana o albedo en techos.
  * **Sistema de Priorización Multicriterio Explicable**: Jerarquización transparente de distritos que justifica por qué una zona debe recibir fondos prioritarios de mitigación.
* **Herramientas de IA y Efecto WOW**:
  * Asistente de Planificación Urbana que asesora en la elaboración de carpetas de financiamiento climático.
  * Recálculo interactivo del mapa térmico en tiempo real al manipular los controles de reforestación del escenario.

---

### Centro de Datos, Auditoría Algorítmica y Reportes Ejecutivos
* **Propósito**: Respaldar la credibilidad científica de los resultados, garantizar la reproducibilidad técnica y automatizar la generación de reportes oficiales para la Alcaldía.
* **Preguntas Guía**:
  * ¿De qué satélites y sensores específicos proviene cada capa?
  * ¿Cuáles son las limitaciones, resolución espacial e incertidumbre de cada modelo?
  * ¿Cómo exportar un informe técnico formal para el Alcalde o el Concejo Municipal?
* **Capacidades Principales**:
  * Catálogo unificado de fuentes satelitales (NASA Landsat 8/9, Copernicus Sentinel-2, NASADEM, WorldPop) y municipales (GAMC, Red MÓNICA).
  * Fichas de auditoría algorítmica y métricas de ajuste estadístico ($R^2$, MAE, RMSE).
  * **Generador de Reportes Ejecutivos Distritales**: Compilación automatizada de informes técnicos con mapas, curvas horarias y recomendaciones de mitigación.
  * Repositorio de descarga de datos geoespaciales abiertos en formatos estándar (GeoJSON y CSV) para uso directo en QGIS/ArcGIS.
* **Herramientas de IA y Efecto WOW**:
  * Asistente de Auditoría Científica y Redacción Institucional.
  * «Pasaporte Científico»: Esquema de trazabilidad interactivo que ilustra el ciclo de vida del dato desde la captura orbital hasta la recomendación distrital.

---

## 4. Capacidades Transversales del Sistema

### 1. Sistema de Inteligencia Artificial Contextual
La inteligencia artificial de la plataforma opera mediante un esquema contextualizado:
* No inventa cifras ni simula sensores ausentes.
* Adopta un rol analítico específico según la pantalla activa (especialista espectral, analista estadístico, asesor de movilidad o auditor de datos).
* Mantiene la trazabilidad del distrito o zona en estudio a lo largo de toda la navegación.

### 2. Contexto Territorial Compartido
La selección de un distrito en cualquiera de los módulos permanece fijada en las demás pantallas, permitiendo al investigador o técnico municipal revisar la temperatura, la vegetación, la calidad del aire y la simulación contrafactual del mismo distrito sin reconfigurar filtros.

### 3. Buscador y Glosario Científico
* Búsqueda ágil de distritos, establecimientos educativos, hospitales y capas temáticas.
* Glosario integrado que clarifica con exactitud términos biofísicos (*LST, NDVI, PM10, inversión térmica, emisividad de superficie*).

---

## 5. Tabla de Cobertura y Cumplimiento de Requerimientos

| Requerimiento / Idea Solicitada | Pantalla donde está Implementada | Rol en la Toma de Decisiones |
| :--- | :--- | :--- |
| **Detector de Desigualdad en Exposición al Calor** | Gemelo Digital y Detector de Desigualdad | Identifica escuelas y hospitales en islas de calor críticas. |
| **Simulador de Rutas Térmicamente Favorables** | Explorador Cartográfico, Rutas y Expansión | Planifica traslados seguros y confortables para peatones y ciclovías. |
| **Observatorio de Expansión Urbana Multitemporal** | Explorador Cartográfico, Rutas y Expansión | Controla la pérdida de suelo permeable por urbanización acelerada. |
| **Huella Verde Urbana y Déficit de Arbolado** | Inteligencia de la Vegetación y Huella Verde | Calcula las hectáreas de reforestación necesarias para bajar la temperatura. |
| **Radar Térmico y Triaje Municipal** | Diagnóstico General y Radar de Alertas | Emite alertas tempranas ante olas de calor extremo. |
| **Cruce Satelital con Sensores de la Red MÓNICA** | Correlaciones Ambientales y Red MÓNICA | Vincula la contaminación de partículas finas con las islas de calor. |
| **Laboratorio Contrafactual («¿Qué pasaría si...?»)** | Gemelo Digital y Detector de Desigualdad | Simula el impacto térmico de intervenciones antes de gastar presupuesto. |
| **Priorización Explicable Distrital** | Gemelo Digital y Detector de Desigualdad | Asigna presupuestos participativos de manera transparente y fundamentada. |
| **Auditoría Científica y Pasaporte de Datos** | Centro de Datos, Auditoría y Reportes | Certifica la trazabilidad metodológica de los datos de la NASA y GAMC. |
| **Generador de Reportes Ejecutivos** | Centro de Datos, Auditoría y Reportes | Genera informes formales listos para el Concejo Municipal y cooperación externa. |
