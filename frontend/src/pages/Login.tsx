import { useState, FormEvent, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAdminAuth } from '@/contexts/AdminAuthContext'

type ApiStatus = 'checking' | 'operational' | 'degraded'

const STATUS_LABEL: Record<ApiStatus, string> = {
  checking: 'verificando…',
  operational: 'operational',
  degraded: 'degraded',
}

const STATUS_COLOR: Record<ApiStatus, string> = {
  checking: 'rgba(255,255,255,0.3)',
  operational: 'hsl(142 71% 45%)',
  degraded: 'hsl(0 72% 51%)',
}

export function LoginPage() {
  const { login } = useAdminAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(true)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [apiStatus, setApiStatus] = useState<ApiStatus>('checking')

  useEffect(() => {
    fetch('/api/admin/health', { signal: AbortSignal.timeout(5000) })
      .then(r => setApiStatus(r.ok ? 'operational' : 'degraded'))
      .catch(() => setApiStatus('degraded'))
  }, [])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate('/dashboard')
    } catch {
      setError('E-mail ou senha inválidos')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'grid', gridTemplateColumns: '1fr 1fr', background: 'var(--bg)' }}>
      {/* Left brand panel */}
      <div
        style={{
          background: 'linear-gradient(160deg, hsl(16 65% 34%) 0%, hsl(20 22% 12%) 100%)',
          color: 'white',
          padding: 40,
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Logo + name */}
        <div className="flex items-center gap-3">
          <div
            style={{
              width: 36, height: 36, borderRadius: 9,
              background: 'rgba(255,255,255,0.10)',
              boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.18)',
              display: 'grid', placeItems: 'center',
              color: 'white', fontWeight: 700, fontSize: 16,
              fontFamily: 'var(--font-display)',
            }}
          >
            P
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: '-0.005em' }}>Pelvi Admin</div>
            <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.04em', textTransform: 'uppercase', marginTop: 2, fontWeight: 500 }}>
              Back office
            </div>
          </div>
        </div>

        <div style={{ flex: 1 }} />

        {/* Hero copy */}
        <div style={{ maxWidth: 440 }}>
          <div style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.45)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>
            // Operação interna
          </div>
          <div style={{ fontSize: 26, fontWeight: 600, lineHeight: 1.15, letterSpacing: '-0.018em', fontFamily: 'var(--font-display)' }}>
            Controle de contratos, planos e cobrança das clínicas do ecossistema Pelvi.
          </div>
          <div style={{ marginTop: 14, fontSize: 13.5, color: 'rgba(255,255,255,0.65)', lineHeight: 1.55 }}>
            Acesso restrito a operadores autorizados. Toda ação é registrada em log de auditoria.
          </div>
        </div>

        {/* Footer */}
        <div style={{ marginTop: 28, paddingTop: 18, borderTop: '1px solid rgba(255,255,255,0.10)', display: 'flex', gap: 24, fontSize: 11.5, color: 'rgba(255,255,255,0.45)' }}>
          <span>Pelvi Admin · v1</span>
          <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{
              width: 6, height: 6, borderRadius: '50%',
              background: STATUS_COLOR[apiStatus],
              flexShrink: 0,
              boxShadow: apiStatus === 'operational' ? '0 0 5px hsl(142 71% 45% / 0.7)' : undefined,
            }} />
            API · {STATUS_LABEL[apiStatus]}
          </span>
        </div>

        {/* Decorative grid */}
        <svg
          style={{ position: 'absolute', inset: 0, opacity: 0.06, pointerEvents: 'none' }}
          width="100%" height="100%"
        >
          <defs>
            <pattern id="login-grid" width="32" height="32" patternUnits="userSpaceOnUse">
              <path d="M 32 0 L 0 0 0 32" fill="none" stroke="white" strokeWidth="0.4"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#login-grid)"/>
        </svg>
      </div>

      {/* Right form */}
      <div style={{ display: 'grid', placeItems: 'center', padding: 36, background: 'var(--surface)' }}>
        <div style={{ width: 380, display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 600, letterSpacing: '-0.015em', fontFamily: 'var(--font-display)', color: 'var(--text)' }}>
              Entrar no back office
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
              Use sua conta corporativa Pelvi.
            </div>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-2)', letterSpacing: '0.005em', marginBottom: 6 }}>
                E-mail corporativo
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu.nome@pelvi.com.br"
                required
                style={{
                  width: '100%', height: 38, padding: '0 12px',
                  borderRadius: 8, border: '1px solid var(--ds-border)',
                  background: 'var(--surface)', color: 'var(--text)',
                  fontFamily: 'var(--font-sans)', fontSize: 13.5,
                  outline: 'none',
                }}
                onFocus={e => { e.target.style.borderColor = 'var(--p)'; e.target.style.boxShadow = '0 0 0 3px var(--p-soft)' }}
                onBlur={e => { e.target.style.borderColor = 'var(--ds-border)'; e.target.style.boxShadow = 'none' }}
              />
            </div>

            <div>
              <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 500, color: 'var(--text-2)', letterSpacing: '0.005em', marginBottom: 6 }}>
                <span>Senha</span>
                <a href="#" style={{ color: 'var(--p)', textDecoration: 'none', fontWeight: 500 }}>Esqueceu a senha?</a>
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{
                  width: '100%', height: 38, padding: '0 12px',
                  borderRadius: 8, border: '1px solid var(--ds-border)',
                  background: 'var(--surface)', color: 'var(--text)',
                  fontFamily: 'var(--font-sans)', fontSize: 13.5,
                  outline: 'none',
                }}
                onFocus={e => { e.target.style.borderColor = 'var(--p)'; e.target.style.boxShadow = '0 0 0 3px var(--p-soft)' }}
                onBlur={e => { e.target.style.borderColor = 'var(--ds-border)'; e.target.style.boxShadow = 'none' }}
              />
            </div>

            <label className="flex items-center gap-2" style={{ fontSize: 12.5, color: 'var(--text-2)', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{ accentColor: 'var(--p)' }}
              />
              Manter sessão neste dispositivo por 7 dias
            </label>

            {error && (
              <p style={{ fontSize: 13, color: 'var(--danger)', margin: 0 }}>{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                height: 38, width: '100%',
                borderRadius: 8,
                background: loading ? 'var(--p-hover)' : 'var(--p)',
                color: 'white', border: 'none',
                fontSize: 13.5, fontWeight: 500,
                fontFamily: 'var(--font-sans)',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.8 : 1,
                boxShadow: 'var(--shadow-brand), inset 0 1px 0 rgba(255,255,255,0.16)',
                transition: 'background 80ms',
              }}
            >
              {loading ? 'Entrando…' : 'Entrar →'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
