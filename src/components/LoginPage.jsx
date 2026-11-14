import { useState } from 'react'
import './LoginPage.css'
import { InteractiveOrbitalValleyCanvas } from './InteractiveOrbitalValleyCanvas'

function AbstractGeoSymbol() {
  return (
    <svg width="28" height="28" viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <circle cx="16" cy="16" r="11" stroke="#43A875" strokeWidth="1.6" strokeDasharray="4 3" />
      <path
        d="M6 17.5C10 12.5 14 20 18 14.5C21 10.5 23.5 16 26.5 13"
        stroke="#FFCB73"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <circle cx="18" cy="14.5" r="2.6" fill="#8875D8" />
      <circle cx="10" cy="15" r="2" fill="#43A875" />
      <circle cx="25" cy="13.5" r="2" fill="#F28B50" />
    </svg>
  )
}

export function LoginPage({ onNavigateBack, onLoginSuccess }) {
  const [identifier, setIdentifier] = useState('investigador@cochabamba.bo')
  const [password, setPassword] = useState('llajtalab2026')
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [serviceNotice, setServiceNotice] = useState(null)

  const validateForm = () => {
    const nextErrors = {}
    if (!identifier.trim()) {
      nextErrors.identifier = 'Ingresa tu usuario o correo electrónico.'
    }
    if (!password || password.length < 6) {
      nextErrors.password = 'La contraseña requiere mínimo 6 caracteres.'
    }
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setServiceNotice(null)
    if (!validateForm()) return

    setIsSubmitting(true)
    setTimeout(() => {
      setIsSubmitting(false)
      if (onLoginSuccess) {
        onLoginSuccess({ identifier: identifier.trim(), role: 'ai' })
      }
    }, 500)
  }

  return (
    <div className="login-viewport">
      {/* Fondo animado 3D en pantalla completa como protagonista */}
      <InteractiveOrbitalValleyCanvas mode="login" activeLayer="dual" />
      <div className="login-vignette" aria-hidden="true" />

      {/* Botón discreto para volver */}
      <header className="login-topbar">
        <button type="button" className="login-back-link" onClick={onNavigateBack}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          <span>Volver</span>
        </button>
      </header>

      {/* Autenticador centrado en medio de la pantalla */}
      <main className="login-center-stage">
        <section className="login-card" aria-labelledby="login-heading">
          <div className="login-portal-header">
            <div className="portal-ring-avatar">
              <AbstractGeoSymbol />
            </div>
            <h1 id="login-heading" className="login-title">
              LlajtaLab
            </h1>
            <p className="login-subtitle">
              Laboratorio climático urbano de Cochabamba
            </p>
          </div>

          <form className="login-form" onSubmit={handleSubmit} noValidate>
            <div className="form-field">
              <label htmlFor="login-identifier" className="form-label">
                Usuario o correo electrónico
              </label>
              <div className="input-wrapper">
                <input
                  id="login-identifier"
                  name="identifier"
                  type="text"
                  autoComplete="username"
                  placeholder="usuario@dominio.bo"
                  value={identifier}
                  onChange={(e) => {
                    setIdentifier(e.target.value)
                    if (errors.identifier) setErrors((p) => ({ ...p, identifier: undefined }))
                  }}
                  className={`form-input ${errors.identifier ? 'has-error' : ''}`}
                />
              </div>
              {errors.identifier && (
                <span className="field-error-msg" role="alert">
                  {errors.identifier}
                </span>
              )}
            </div>

            <div className="form-field">
              <label htmlFor="login-password" className="form-label">
                Contraseña
              </label>
              <div className="input-wrapper">
                <input
                  id="login-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    if (errors.password) setErrors((p) => ({ ...p, password: undefined }))
                  }}
                  className={`form-input ${errors.password ? 'has-error' : ''}`}
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? '🙈' : '👁'}
                </button>
              </div>
              {errors.password && (
                <span className="field-error-msg" role="alert">
                  {errors.password}
                </span>
              )}
            </div>

            <div className="login-aux-row">
              <button
                type="button"
                className="forgot-password-btn"
                onClick={() =>
                  setServiceNotice('Contacta al administrador para restablecer tu acceso.')
                }
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>

            <button type="submit" className="login-submit-btn" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <span className="spinner-ring" aria-hidden="true" />
                  <span>Ingresando...</span>
                </>
              ) : (
                <span>Iniciar sesión</span>
              )}
            </button>
          </form>

          {serviceNotice && (
            <div className="service-status-banner" role="status">
              {serviceNotice}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
