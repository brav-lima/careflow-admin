import { useLocation } from 'react-router-dom'
import { useState } from 'react'
import { useAdminAuth } from '@/contexts/AdminAuthContext'
import { ChangePasswordModal } from '@/components/auth/ChangePasswordModal'

const ROUTE_LABELS: Record<string, string> = {
  dashboard:     'Visão geral',
  organizations: 'Organizações',
  plans:         'Planos',
  subscriptions: 'Assinaturas',
  invoices:      'Faturas',
}

const SearchIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14, color: 'var(--text-muted)', flexShrink: 0 }}>
    <circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>
  </svg>
)
const BellIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" style={{ width: 18, height: 18 }}>
    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10 21a2 2 0 0 0 4 0"/>
  </svg>
)
const KeyIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" style={{ width: 15, height: 15 }}>
    <circle cx="8" cy="15" r="4"/><path d="m10.8 12.2 9.2-9.2M16 6l3 3"/>
  </svg>
)
const LogOutIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" style={{ width: 15, height: 15 }}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
)

export function AdminTopBar() {
  const { logout } = useAdminAuth()
  const [changePasswordOpen, setChangePasswordOpen] = useState(false)
  const location = useLocation()

  // Build breadcrumbs from path segments
  const segments = location.pathname.split('/').filter(Boolean)
  const crumbs = segments.map((seg, i) => {
    const label = ROUTE_LABELS[seg] ?? seg
    const isLast = i === segments.length - 1
    const isUUID = /^[0-9a-f-]{36}$/.test(seg)
    return { label: isUUID ? '…' : label, isLast }
  })

  return (
    <header
      className="flex items-center gap-3.5"
      style={{
        height: 56, flexShrink: 0,
        borderBottom: '1px solid var(--ds-border)',
        padding: '0 24px',
        background: 'var(--surface)',
      }}
    >
      {/* Breadcrumbs */}
      <div className="flex items-center gap-1.5" style={{ fontSize: 13, color: 'var(--text-muted)' }}>
        {crumbs.map((c, i) => (
          <span key={i} className="flex items-center gap-1.5">
            {i > 0 && <span style={{ color: 'var(--text-faint)' }}>/</span>}
            {c.isLast
              ? <strong style={{ color: 'var(--text)', fontWeight: 500 }}>{c.label}</strong>
              : <span>{c.label}</span>
            }
          </span>
        ))}
      </div>

      {/* Search */}
      <div
        className="flex items-center gap-2"
        style={{
          marginLeft: 'auto',
          height: 32, padding: '0 12px',
          borderRadius: 8,
          background: 'var(--bg)',
          border: '1px solid var(--ds-border)',
          fontSize: 13, color: 'var(--text-muted)',
          minWidth: 280, cursor: 'text',
        }}
      >
        <SearchIcon />
        <span style={{ flex: 1 }}>Buscar organizações, faturas…</span>
        <kbd style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, padding: '1px 6px', borderRadius: 4, background: 'var(--surface)', border: '1px solid var(--ds-border)', color: 'var(--text-muted)' }}>⌘K</kbd>
      </div>

      {/* Bell */}
      <button
        style={{ width: 32, height: 32, display: 'grid', placeItems: 'center', borderRadius: 8, color: 'var(--text-muted)', background: 'transparent', border: 'none', cursor: 'pointer' }}
        onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-2)'; e.currentTarget.style.color = 'var(--text)' }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)' }}
      >
        <BellIcon />
      </button>

      {/* User actions */}
      <div className="flex items-center gap-2" style={{ borderLeft: '1px solid var(--ds-border)', paddingLeft: 12, marginLeft: 4 }}>
        <button
          onClick={() => setChangePasswordOpen(true)}
          className="flex items-center gap-1.5"
          style={{ fontSize: 12.5, color: 'var(--text-muted)', background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px 8px', borderRadius: 6 }}
          onMouseEnter={e => { e.currentTarget.style.color = 'var(--text)'; e.currentTarget.style.background = 'var(--surface-2)' }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent' }}
        >
          <KeyIcon />
          Senha
        </button>
        <button
          onClick={logout}
          className="flex items-center gap-1.5"
          style={{ fontSize: 12.5, color: 'var(--text-muted)', background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px 8px', borderRadius: 6 }}
          onMouseEnter={e => { e.currentTarget.style.color = 'var(--text)'; e.currentTarget.style.background = 'var(--surface-2)' }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent' }}
        >
          <LogOutIcon />
          Sair
        </button>
      </div>

      <ChangePasswordModal open={changePasswordOpen} onOpenChange={setChangePasswordOpen} />
    </header>
  )
}
