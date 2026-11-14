import { COCHABAMBA_ZONES } from '../../data/internalPanelData'

export function IndiceScreen({
  selectedZoneId,
  onSelectZone,
  selectedPeriod,
  onPeriodChange,
  onNavigateModule,
  onOpenAssistantWithPrompt,
}) {
  const activeZone =
    COCHABAMBA_ZONES.find((z) => z.id === selectedZoneId) || COCHABAMBA_ZONES[0]

  return (
    <div className="neo-screen">
      <div className="neo-glass-card" style={{ maxWidth: '800px', margin: '0 auto', width: '100%' }}>
        <div className="neo-card-header">
          <div>
            <span className="neo-micro-tag">ENFOQUE 2 · CIUDAD Y SERVICIOS</span>
            <h3 style={{ fontSize: '1.25rem', marginTop: '0.25rem' }}>6. Índice socio-ambiental</h3>
          </div>
          <span className="neo-pill-badge" style={{ background: 'rgba(234, 179, 8, 0.15)', color: '#EAB308', borderColor: 'rgba(234, 179, 8, 0.3)' }}>
            En construcción
          </span>
        </div>

        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.88rem', margin: '0.5rem 0 1rem' }}>
          Evaluación sintética de vulnerabilidad socio-ambiental y calidad de vida para {activeZone.name}.
        </p>

        <div style={{
          padding: '2rem 1.5rem',
          textAlign: 'center',
          border: '1px dashed var(--color-border)',
          borderRadius: '10px',
          background: 'var(--color-surface-subtle, rgba(255, 255, 255, 0.02))'
        }}>
          <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>🚧</div>
          <strong style={{ display: 'block', color: 'var(--color-text)', marginBottom: '0.25rem' }}>
            Módulo en construcción
          </strong>
          <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
            Próximamente se integrarán las métricas ponderadas de calidad de vida socio-ambiental para los 15 distritos de Cochabamba.
          </span>
        </div>
      </div>
    </div>
  )
}
