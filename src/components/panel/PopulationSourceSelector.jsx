import { useState } from 'react'
import { HelpCircle } from 'lucide-react'

export default function PopulationSourceSelector({ value, onChange }) {
  const [showTooltip, setShowTooltip] = useState(false)

  const tooltipText =
    'La población del municipio es un dato en discusión: el Censo INE 2024 registró 665.505 habitantes y la Alcaldía estimó 910.267. La grilla satelital GHSL estima unos 926 mil para 2025. Puedes ver los resultados con cualquiera de las dos bases.'

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.45rem',
        background: 'var(--theme-card-bg-subtle, rgba(255,255,255,0.02))',
        border: '1px solid var(--theme-border)',
        borderRadius: '6px',
        padding: '0.22rem 0.55rem',
        fontSize: '0.74rem',
        position: 'relative',
      }}
    >
      <span style={{ color: 'var(--color-icon)', fontWeight: 600 }}>Población:</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          background: 'transparent',
          border: 'none',
          color: 'var(--theme-text-primary)',
          fontSize: '0.74rem',
          fontWeight: 600,
          cursor: 'pointer',
          outline: 'none',
        }}
      >
        <option
          value="ghsl"
          style={{
            background: 'var(--theme-card-bg, #0b1329)',
            color: 'var(--theme-text-primary)',
          }}
        >
          Estimación satelital GHSL
        </option>
        <option
          value="ine"
          style={{
            background: 'var(--theme-card-bg, #0b1329)',
            color: 'var(--theme-text-primary)',
          }}
        >
          Ajustada al Censo INE 2024
        </option>
      </select>
      <button
        type="button"
        onClick={() => setShowTooltip((v) => !v)}
        title={tooltipText}
        style={{
          background: 'transparent',
          border: 'none',
          padding: 0,
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          color: showTooltip ? 'var(--theme-accent, #38BDF8)' : 'var(--color-icon)',
        }}
        aria-label="Información metodológica sobre población"
      >
        <HelpCircle size={14} />
      </button>

      {showTooltip && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            right: 0,
            zIndex: 1000,
            width: '310px',
            padding: '0.65rem 0.75rem',
            background: 'var(--theme-card-bg, #0b1329)',
            border: '1px solid var(--theme-border)',
            borderRadius: '8px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
            fontSize: '0.72rem',
            color: 'var(--theme-text-muted)',
            lineHeight: 1.4,
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '4px',
            }}
          >
            <strong style={{ color: 'var(--theme-text-primary)' }}>
              Discusión poblacional
            </strong>
            <button
              type="button"
              onClick={() => setShowTooltip(false)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--theme-text-muted)',
                cursor: 'pointer',
                fontSize: '11px',
                padding: '2px',
              }}
            >
              ✕
            </button>
          </div>
          {tooltipText}
        </div>
      )}
    </div>
  )
}
