import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { api } from '@/lib/api'
import { formatDate, formatCNPJ, formatCurrency } from '@/lib/utils'
import type { Organization, OrgStatus, PaginatedResponse } from '@/types/admin'
import { useState } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { CreateOrganizationModal } from '@/components/organizations/CreateOrganizationModal'
import { OrgAvatar, StatusPill, PageHeader, Card, SearchInput, FilterChip, TableFooter } from '@/components/ui/ds'

const DownloadIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14 }}>
    <path d="M12 3v12m0 0 4-4m-4 4-4-4"/><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/>
  </svg>
)
const MoreIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14 }}>
    <circle cx="5" cy="12" r=".5"/><circle cx="12" cy="12" r=".5"/><circle cx="19" cy="12" r=".5"/>
  </svg>
)

type StatusFilter = OrgStatus | 'all'

export function OrganizationsPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')

  const { data, isLoading, error } = useQuery<PaginatedResponse<Organization>>({
    queryKey: ['organizations', search, statusFilter],
    queryFn: () =>
      api.get('/organizations', {
        params: {
          search: search || undefined,
          status: statusFilter !== 'all' ? statusFilter : undefined,
        },
      }).then((r) => r.data),
  })

  const orgs = data?.data ?? []
  const total = data?.total ?? 0

  const counts = {
    all:       total,
    ACTIVE:    orgs.filter(o => o.status === 'ACTIVE').length,
    SUSPENDED: orgs.filter(o => o.status === 'SUSPENDED').length,
    CANCELED:  orgs.filter(o => o.status === 'CANCELED').length,
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <PageHeader
        title="Organizações"
        subtitle={
          <>
            <span className="num">{total.toLocaleString('pt-BR')}</span> clínicas cadastradas
          </>
        }
        actions={
          <>
            <button style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 32, padding: '0 12px', borderRadius: 8, border: '1px solid var(--ds-border)', background: 'var(--surface)', fontSize: 13, fontWeight: 500, cursor: 'pointer', color: 'var(--text)', fontFamily: 'var(--font-sans)' }}>
              <DownloadIcon />Exportar CSV
            </button>
            <CreateOrganizationModal />
          </>
        }
      />

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <SearchInput value={search} onChange={setSearch} placeholder="Buscar por nome, CNPJ, cidade…" />
        <div className="flex items-center gap-1.5">
          <FilterChip label="Todas"     count={total}           active={statusFilter === 'all'}       onClick={() => setStatusFilter('all')} />
          <FilterChip label="Ativas"    count={counts.ACTIVE}   active={statusFilter === 'ACTIVE'}    onClick={() => setStatusFilter('ACTIVE')} />
          <FilterChip label="Suspensas" count={counts.SUSPENDED}active={statusFilter === 'SUSPENDED'} onClick={() => setStatusFilter('SUSPENDED')} />
          <FilterChip label="Canceladas"count={counts.CANCELED} active={statusFilter === 'CANCELED'}  onClick={() => setStatusFilter('CANCELED')} />
        </div>
      </div>

      {error && (
        <div style={{ borderRadius: 8, background: 'var(--danger-soft)', padding: '12px 16px', fontSize: 13, color: 'var(--danger-ink)' }}>
          Falha ao carregar organizações. Tente novamente.
        </div>
      )}

      <Card style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1, overflow: 'auto' }}>
          <table className="pa-tbl">
            <thead>
              <tr>
                <th style={{ width: 32 }}><input type="checkbox" style={{ accentColor: 'var(--p)' }} /></th>
                <th>Organização</th>
                <th>CNPJ</th>
                <th style={{ textAlign: 'right' }}>MRR</th>
                <th>Status</th>
                <th>Cliente desde</th>
                <th style={{ width: 32 }} />
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j}><Skeleton className="h-4 w-full" /></td>
                    ))}
                  </tr>
                ))
              ) : orgs.map((org) => (
                <tr key={org.id}>
                  <td><input type="checkbox" style={{ accentColor: 'var(--p)' }} /></td>
                  <td>
                    <div className="flex items-center gap-2">
                      <OrgAvatar name={org.name} size={28} />
                      <div>
                        <Link to={`/organizations/${org.id}`} style={{ fontWeight: 500, color: 'var(--text)', textDecoration: 'none' }}>
                          {org.name}
                        </Link>
                        <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{org.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)' }}>
                    {formatCNPJ(org.document)}
                  </td>
                  <td className="num" style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-2)' }}>
                    {org.mrr != null ? formatCurrency(org.mrr) : '—'}
                  </td>
                  <td>
                    {org.status === 'ACTIVE'    ? <StatusPill tone="ok">Ativa</StatusPill>
                      : org.status === 'SUSPENDED' ? <StatusPill tone="warn">Suspensa</StatusPill>
                      : <StatusPill tone="muted">Cancelada</StatusPill>}
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)' }}>
                    {formatDate(org.createdAt)}
                  </td>
                  <td>
                    <button style={{ width: 26, height: 26, display: 'grid', placeItems: 'center', border: 0, background: 'transparent', cursor: 'pointer', borderRadius: 6, color: 'var(--text-muted)' }}>
                      <MoreIcon />
                    </button>
                  </td>
                </tr>
              ))}
              {!isLoading && orgs.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                    Nenhuma organização encontrada
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <TableFooter showing={orgs.length} total={total} />
      </Card>
    </div>
  )
}
