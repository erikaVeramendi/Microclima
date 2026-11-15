import { useState, useEffect } from 'react';
import { CONCEPTUAL_ZONES } from '../data/publicSiteData';
import MapLibreSimulador3D from './panel/MapLibreSimulador3D';

export function TerritorialExplorerSection() {
  const [activeLayer, setActiveLayer] = useState('combinada');
  const [activePeriod, setActivePeriod] = useState('Reciente comparable (Ilustrativo)');
  const [selectedZoneId, setSelectedZoneId] = useState(CONCEPTUAL_ZONES[0].id);
  const [zoomLevel, setZoomLevel] = useState(1);

  const activeZone = CONCEPTUAL_ZONES.find(z => z.id === selectedZoneId) || CONCEPTUAL_ZONES[0];

  const zoneVisualMetrics = {
    'ladera-norte': {
      gamcSubalcaldia: 'Subalcaldía Tunari · Distrito 1, 2, 13',
      nasaPass: 'Landsat-9 TIRS + Sentinel-2B + NASADEM',
      ndviBar: 78,
      lstBar: 38,
      elev: '2,750 – 3,400 m',
      accent: '#5CEA00',
    },
    'corredor-ripario': {
      gamcSubalcaldia: 'Eje Río Rocha · Subalcaldías Molle / Adela Zamudio',
      nasaPass: 'Sentinel-2 MSI (10m) + ISS ECOSTRESS',
      ndviBar: 84,
      lstBar: 44,
      elev: '2,555 – 2,580 m',
      accent: '#8BCB9A',
    },
    'trama-densa': {
      gamcSubalcaldia: 'Centro Histórico / Calatayud · Distritos 10, 11, 12',
      nasaPass: 'Landsat 8/9 Banda 10 TIR + MODIS Diurno/Nocturno',
      ndviBar: 26,
      lstBar: 88,
      elev: '2,548 – 2,570 m',
      accent: '#F28B50',
    },
    'expansion-sur': {
      gamcSubalcaldia: 'Valle Hermoso / Itocta · Distritos 6, 7, 8, 9, 14, 15',
      nasaPass: 'Landsat 8/9 TIRS + Sentinel-2 + Catastro GAMC',
      ndviBar: 34,
      lstBar: 82,
      elev: '2,520 – 2,640 m',
      accent: '#FFCB73',
    },
  };

  const currentMetric = zoneVisualMetrics[selectedZoneId] || zoneVisualMetrics['ladera-norte'];

  // Helper to detect dark mode (Tailwind applies `dark` class on <html>)
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    setIsDark(document.documentElement.classList.contains('dark'));
    return () => observer.disconnect();
  }, []);

  const kpis = [
    { label: 'Cobertura Territorial', value: '15 / 15 Distritos' },
    { label: 'Serie Histórica', value: '25 Años (2001–2025)' },
    { label: 'Brecha Térmica Norte/Sur', value: '+16,3 °C' },
    { label: 'Tendencia Vegetación', value: '8 Pierden / 5 Ganan' },
    { label: 'Calidad del Aire Sur', value: '67,1 µg/m³ PM10' },
    { label: 'Zonas Críticas', value: '2 Estaciones Físicas' },
  ];

  const hallazgos = [
    { id: 'HC-01', title: "Isla de calor extrema en el Sur (D15 K'ara K'ara: hasta 35,3°C vs 19,0°C en el Norte)", color: 'red-500' },
    { id: 'HC-02', title: "El Distrito 13 (Tunari) conserva cobertura vegetal y regula la temperatura del valle", color: 'emerald-500' },
    { id: 'HC-03', title: "Disparidad Norte‑Sur confirmada por Red MÓNICA: 67,1 µg/m³ PM10 en el sur", color: 'purple-500' },
    { id: 'HC-04', title: "8 distritos perdieron vegetación significativamente y 5 la ganaron (2001–2025)", color: 'amber-500' },
  ];

  const focusDistrict = (code) => {
    // Simple wrapper to call the map component via a custom event
    const ev = new CustomEvent('focusDistrict', { detail: code });
    window.dispatchEvent(ev);
  };

  return (
    <section id="territorio" className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
      {/* Banner superior */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-4">
        <h1 className="text-slate-900 dark:text-white font-bold text-lg">
          Datos NASA (2001–2025) + Alcaldía GAMC
        </h1>
        <p className="text-slate-600 dark:text-slate-300 text-sm mt-1">
          Centro de inteligencia
        </p>
      </header>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm p-3 rounded"
          >
            <p className="text-slate-600 dark:text-slate-400 text-xs">{kpi.label}</p>
            <p className="text-slate-900 dark:text-white font-bold text-sm mt-1">{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-2 px-4 py-2 items-center">
        <div className="flex gap-1">
          {[
            { id: 'combinada', label: '◆ Fusión NASA + GAMC' },
            { id: 'vegetacion', label: '● Huella Verde (Sentinel‑2 NDVI)' },
            { id: 'termica', label: '▲ Infrarrojo Térmico (Landsat LST)' },
            { id: 'relieve', label: '◆ Topografía 3D (NASADEM)' },
          ].map((layer) => (
            <button
              key={layer.id}
              type="button"
              className={`px-2 py-1 rounded text-xs ${{
                'bg-slate-200 dark:bg-slate-700': activeLayer === layer.id,
                'bg-slate-100 dark:bg-slate-800': activeLayer !== layer.id,
              }[true]}`}
              onClick={() => setActiveLayer(layer.id)}
            >
              {layer.label}
            </button>
          ))}
        </div>
        <label htmlFor="period-select" className="text-xs text-slate-600 dark:text-slate-300">
          Ventana:
        </label>
        <select
          id="period-select"
          value={activePeriod}
          onChange={(e) => setActivePeriod(e.target.value)}
          className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-600 rounded px-2 py-1 text-xs"
        >
          <option value="Histórico base (Ilustrativo)">Histórico base (Ilustrativo)</option>
          <option value="Intermedio (Ilustrativo)">Intermedio (Ilustrativo)</option>
          <option value="Reciente comparable (Ilustrativo)">Reciente comparable (Ilustrativo)</option>
        </select>
        <div className="flex items-center gap-1">
          <button
            type="button"
            className="px-2 py-1 bg-slate-200 dark:bg-slate-700 rounded"
            onClick={() => setZoomLevel(z => Math.max(1, +(z - 0.15).toFixed(2)))}
          >‑</button>
          <span className="text-xs text-slate-800 dark:text-slate-200">{Math.round(zoomLevel * 100)}%</span>
          <button
            type="button"
            className="px-2 py-1 bg-slate-200 dark:bg-slate-700 rounded"
            onClick={() => setZoomLevel(z => Math.min(1.45, +(z + 0.15).toFixed(2)))}
          >+</button>
        </div>
      </div>

      {/* Main map and sidebar */}
      <div className="flex flex-col lg:flex-row gap-4 p-4">
        <div className="flex-1 min-w-0 h-[480px]">
          {/* Interactive map – OpenStreetMap in light, Esri Dark Gray in dark */}
          <MapLibreSimulador3D
            activeLayer={activeLayer}
            zoomLevel={zoomLevel}
            selectedZoneId={selectedZoneId}
            onZoneSelect={setSelectedZoneId}
            darkMode={isDark}
          />
        </div>
        <aside className="w-full lg:w-80 space-y-4">
          {/* Selector de unidades territoriales */}
          <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 rounded">
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-2">SELECCIÓN DE UNIDAD TERRITORIAL</h2>
            <div className="grid grid-cols-1 gap-1">
              {CONCEPTUAL_ZONES.map((z) => (
                <button
                  key={z.id}
                  type="button"
                  className={`text-left px-2 py-1 rounded text-xs ${{
                    'bg-slate-200 dark:bg-slate-700': selectedZoneId === z.id,
                    'bg-slate-100 dark:bg-slate-900': selectedZoneId !== z.id,
                  }[true]}`}
                  onClick={() => setSelectedZoneId(z.id)}
                >
                  {z.label}
                </button>
              ))}
            </div>
          </div>

          {/* Panel de telemetría del distrito */}
          <div
            style={{
              backgroundColor: isDark ? 'rgba(10,15,28,0.92)' : 'rgba(255,255,255,0.95)',
              border: `1px solid ${currentMetric.accent}66`,
            }}
            className="rounded p-3"
          >
            <div className="flex justify-between items-center mb-2">
              <span className="font-mono text-sm" style={{ color: currentMetric.accent }}>{activeZone.coords}</span>
              <span className="font-mono text-xs text-slate-500">ALT: {currentMetric.elev}</span>
            </div>
            <h3 className="text-base font-semibold mb-2 text-slate-900 dark:text-white">{activeZone.label}</h3>
            <div className="space-y-2">
              <div>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span className="text-emerald-600">Respuesta Vegetal (NDVI)</span>
                  <span className="text-emerald-600">Nivel Ilustrativo</span>
                </div>
                <div className="h-1 bg-slate-200 dark:bg-slate-700 rounded">
                  <div style={{ width: `${currentMetric.ndviBar}%` }} className="h-full bg-emerald-500 rounded" />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span className="text-amber-600">Emisión Térmica (LST)</span>
                  <span className="text-amber-600">Nivel Ilustrativo</span>
                </div>
                <div className="h-1 bg-slate-200 dark:bg-slate-700 rounded">
                  <div style={{ width: `${currentMetric.lstBar}%` }} className="h-full bg-gradient-to-r from-amber-400 to-rose-600 rounded" />
                </div>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-600 text-xs text-slate-600 dark:text-slate-300">
              <p><strong className="text-emerald-600">API Alcaldía:</strong> {currentMetric.gamcSubalcaldia}</p>
              <p><strong className="text-amber-600">Sensores NASA/EO:</strong> {currentMetric.nasaPass}</p>
            </div>
          </div>
        </aside>
      </div>

      {/* Hallazgos inferiores */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4">
        {hallazgos.map((h) => (
          <div
            key={h.id}
            className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm pt-2 rounded ${
              h.id === 'HC-01' ? 'border-t-4 border-red-500' :
              h.id === 'HC-02' ? 'border-t-4 border-emerald-500' :
              h.id === 'HC-03' ? 'border-t-4 border-purple-500' :
              'border-t-4 border-amber-500'
            }`}
          >
            <h4 className="px-3 text-slate-900 dark:text-white font-bold text-sm mb-1">{h.title}</h4>
            <button
              className="ml-3 mb-2 text-sm text-blue-600 hover:underline"
              onClick={() => focusDistrict(h.id.replace('HC-', 'D'))}
            >
              Ver en el mapa →
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
