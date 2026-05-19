import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { formatDate, formatCurrency } from '@/lib/utils'
import type { Subscription, SubscriptionStatus } from '@/types/admin'
import { Skeleton } from '@/components/ui/skeleton'
import { CreateSubscriptionModal } from '@/components/subscriptions/CreateSubscriptionModal'
import { ChangePlanModal } from '@/components/subscriptions/ChangePlanModal'
import { OrgAvatar, StatusPill, PlanBadge, PageHeader, Card, SearchInput, FilterChip, TableFooter } from '@/components/ui/ds'
import { useState } from 'react'

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

type StatusFilter = SubscriptionStatus | 'all'

function SubStatusPill({ status }: { status: SubscriptionStatus }) {
  if (status === 'ACTIVE')   return <StatusPill tone="ok">Ativa</StatusPill>
  if (status === 'TRIAL')    return <StatusPill tone="info">Trial</StatusPill>
  if (status === 'PAST_DUE') return <StatusPill tone="danger">Inadimplente</StatusPill>
  return <StatusPill tone="muted">Cancelada</StatusPill>
}

export function SubscriptionsPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [changingPlan, setChangingPlan] = useState<Subscription | null>(null)

  const { data: subscriptionsResp, isLoading, error } = useQuery<{ data: Subscription[]; total: number }>({
    queryKey: ['subscriptions'],
    queryFn: () => api.get('/subscriptions').then((r) => r.data),
  })
  const allSubs = subscriptionsResp?.data ?? []
  const total = subscriptionsResp?.total ?? 0

  const filtered = allSubs.filter(s => {
    if (statusFilter !== 'all' && s.status !== statusFilter) return false
    if (search) {
      const q = search.toLowerCase()
      return (
        s.organization?.name?.toLowerCase().includes(q) ||
        s.plan?.name?.toLowerCase().includes(q)
      )
    }
    return true
  })

  const counts = {
    all:       allSubs.length,
    ACTIVE:    allSubs.filter(s => s.status === 'ACTIVE').length,
    TRIAL:     allSubs.filter(s => s.status === 'TRIAL').length,
    PAST_DUE:  allSubs.filter(s => s.status === 'PAST_DUE').length,
    CANCELED:  allSubs.filter(s => s.status === 'CANCELED').length,
  }

  const activeMrr = allSubs.filter(s => s.status === 'ACTIVE').reduce((s, x) => s + Number(x.plan?.priceMonthly ?? 0), 0)

  if (error) {
    return (
      <div style={{ borderRadius: 8, background: 'var(--danger-soft)', padding: '12px 16px', fontSize: 13, color: 'var(--danger-ink)' }}>
        Falha ao carregar assinaturas. Tente novamente.
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <PageHeader
        title="Assinaturas"
        subtitle={
          <>
            <span className="num">{counts.ACTIVE}</span> assinaturas ativas · MRR recorrente{' '}
            <span className="num" style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-2)' }}>{formatCurrency(activeMrr)}</span>
          </>
        }
        actions={
          <>
            <button style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 32, padding: '0 12px', borderRadius: 8, border: '1px solid var(--ds-border)', background: 'var(--surface)', fontSize: 13, fontWeight: 500, cursor: 'pointer', color: 'var(--text)', fontFamily: 'var(--font-sans)' }}>
              <DownloadIcon />Exportar
            </button>
            <CreateSubscriptionModal />
          </>
        }
      />

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <FilterChip label="Todas"        count={counts.all}      active={statusFilter === 'all'}      onClick={() => setStatusFilter('all')} />
        <FilterChip label="Ativas"       count={counts.ACTIVE}   active={statusFilter === 'ACTIVE'}   onClick={() => setStatusFilter('ACTIVE')} />
        <FilterChip label="Trial"        count={counts.TRIAL}    active={statusFilter === 'TRIAL'}    onClick={() => setStatusFilter('TRIAL')} />
        <FilterChip label="Inadimplente" count={counts.PAST_DUE} active={statusFilter === 'PAST_DUE'} onClick={() => setStatusFilter('PAST_DUE')} />
        <FilterChip label="Canceladas"   count={counts.CANCELED} active={statusFilter === 'CANCELED'} onClick={() => setStatusFilter('CANCELED')} />
        <div style={{ flex: 1 }}/>
        <SearchInput value={search} onChange={setSearch} placeholder="Buscar por organização ou plano…" />
      </div>

      {changingPlan && (
        <ChangePlanModal
          subscription={changingPlan}
          open={!!changingPlan}
          onClose={() => setChangingPlan(null)}
        />
      )}

      <Card style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1, overflow: 'auto' }}>
          <table className="pa-tbl">
            <thead>
              <tr>
                <th>Organização</th>
                <th>Plano</th>
                <th style={{ textAlign: 'right' }}>Valor</th>
                <th>Status</th>
                <th>Início</th>
                <th>Trial até</th>
                <th style={{ width: 32 }}/>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j}><Skeleton className="h-4 w-full" /></td>
                    ))}
                  </tr>
                ))
              ) : filtered.map((sub) => (
                <tr key={sub.id}>
                  <td>
                    <div className="flex items-center gap-2">
                      <OrgAvatar name={sub.organization?.name ?? '?'} size={26} />
                      <span style={{ fontWeight: 500, color: 'var(--text)' }}>{sub.organization?.name ?? '—'}</span>
                    </div>
                  </td>
                  <td>
                    {sub.plan ? <PlanBadge name={sub.plan.name} /> : '—'}
                  </td>
                  <td className="num" style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                    {sub.plan ? (
                      <>{formatCurrency(sub.plan.priceMonthly)}<span style={{ color: 'var(--text-faint)' }}>/mês</span></>
                    ) : '—'}
                  </td>
                  <td><SubStatusPill status={sub.status} /></td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)' }}>
                    {formatDate(sub.startDate)}
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: sub.trialEndsAt ? 'var(--warn-ink)' : 'var(--text-faint)' }}>
                    {sub.trialEndsAt ? formatDate(sub.trialEndsAt) : '—'}
                  </td>
                  <td>
                    {(sub.status === 'ACTIVE' || sub.status === 'TRIAL') && (
                      <button
                        onClick={() => setChangingPlan(sub)}
                        style={{ width: 26, height: 26, display: 'grid', placeItems: 'center', border: 0, background: 'transparent', cursor: 'pointer', borderRadius: 6, color: 'var(--text-muted)' }}
                        title="Alterar plano"
                      >
                        <MoreIcon />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {!isLoading && filtered.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                    Nenhuma assinatura encontrada
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <TableFooter showing={filtered.length} total={total} />
      </Card>
    </div>
  )
}
