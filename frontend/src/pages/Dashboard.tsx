import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { api } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'
import type { MetricsSummary, Organization, Invoice, PaginatedResponse } from '@/types/admin'
import { Skeleton } from '@/components/ui/skeleton'
import { Sparkline, OrgAvatar, StatusPill, PageHeader, Card, CardHeader } from '@/components/ui/ds'

const MRR_TREND    = [184, 188, 192, 198, 205, 213, 220, 228, 234, 239, 245, 248]
const ACTIVE_TREND = [108, 112, 117, 121, 124, 128, 131, 134, 137, 139, 141, 142]
const TRIAL_TREND  = [14, 17, 22, 19, 18, 24, 26, 22, 21, 25, 23, 23]
const SUSP_TREND   = [4, 5, 6, 5, 6, 7, 8, 8, 7, 8, 9, 8]
const OVERDUE_TREND= [9, 10, 11, 13, 12, 14, 16, 15, 14, 16, 15, 14]

const DownloadIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14 }}>
    <path d="M12 3v12m0 0 4-4m-4 4-4-4"/><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/>
  </svg>
)
const ChevronDown = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 12, height: 12 }}>
    <path d="m6 9 6 6 6-6"/>
  </svg>
)
const ArrowRight = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 13, height: 13 }}>
    <path d="M5 12h14M13 5l7 7-7 7"/>
  </svg>
)
const MoreIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14 }}>
    <circle cx="5" cy="12" r=".5"/><circle cx="12" cy="12" r=".5"/><circle cx="19" cy="12" r=".5"/>
  </svg>
)

function KpiTile({
  label, value, currency, delta, deltaTone, trend, color,
}: {
  label: string; value: string; currency?: boolean
  delta: string; deltaTone: 'up' | 'down' | 'flat'
  trend: number[]; color: string
}) {
  return (
    <div style={{ padding: '16px 20px', borderRight: '1px solid var(--divider)', display: 'flex', flexDirection: 'column', gap: 6, position: 'relative', minWidth: 0 }}>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>{label}</div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 600, letterSpacing: '-0.022em', color: 'var(--text)', fontVariantNumeric: 'tabular-nums', lineHeight: '32px' }}>
        {currency && <span style={{ fontSize: 14, color: 'var(--text-muted)', fontWeight: 500, marginRight: 3, fontFamily: 'var(--font-sans)' }}>R$</span>}
        {value}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontVariantNumeric: 'tabular-nums', fontWeight: 500 }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center',
          padding: '1px 5px', borderRadius: 4,
          fontFamily: 'var(--font-mono)', fontSize: 11,
          background: deltaTone === 'up' ? 'var(--ok-soft)' : deltaTone === 'down' ? 'var(--danger-soft)' : 'var(--surface-3)',
          color: deltaTone === 'up' ? 'var(--ok-ink)' : deltaTone === 'down' ? 'var(--danger-ink)' : 'var(--text-muted)',
        }}>
          {deltaTone === 'up' ? '↑' : deltaTone === 'down' ? '↓' : '•'} {delta}
        </span>
        <span style={{ color: 'var(--text-faint)', fontWeight: 400 }}>vs mês anterior</span>
      </div>
      <div style={{ height: 30, marginTop: 4 }}>
        <Sparkline data={trend} color={color} height={30} />
      </div>
    </div>
  )
}

function FunnelBar({ label, count, pct, color }: { label: string; count: number; pct: number; color: string }) {
  return (
    <div>
      <div className="flex justify-between" style={{ fontSize: 12.5, marginBottom: 5, color: 'var(--text)' }}>
        <span>{label}</span>
        <span className="num" style={{ color: 'var(--text-2)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>{count} · {pct}%</span>
      </div>
      <div style={{ height: 6, borderRadius: 999, background: 'var(--surface-3)', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 999 }}/>
      </div>
    </div>
  )
}

export function DashboardPage() {
  const { data, isLoading } = useQuery<MetricsSummary>({
    queryKey: ['metrics-summary'],
    queryFn: () => api.get('/metrics/summary').then((r) => r.data),
  })

  const { data: recentOrgsResp } = useQuery<PaginatedResponse<Organization>>({
    queryKey: ['organizations', '', '', 1, 5],
    queryFn: () => api.get('/organizations', { params: { limit: 5 } }).then((r) => r.data),
  })

  const { data: overdueInvoicesResp } = useQuery<{ data: Invoice[]; total: number }>({
    queryKey: ['invoices', 'overdue'],
    queryFn: () => api.get('/invoices', { params: { status: 'OVERDUE', limit: 5 } }).then((r) => r.data),
  })

  const recentOrgs = recentOrgsResp?.data ?? []
  const overdueInvoices = overdueInvoicesResp?.data ?? []
  const overdueTotal = overdueInvoices.reduce((s, i) => s + i.amount, 0)

  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <Skeleton className="h-8 w-48" />
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr 1fr 1fr', background: 'var(--surface)', border: '1px solid var(--ds-border)', borderRadius: 12, overflow: 'hidden' }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} style={{ padding: '16px 20px', borderRight: i < 4 ? '1px solid var(--divider)' : 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-6 w-full" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  const mrr = data?.mrr ?? 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <PageHeader
        title="Visão geral"
        subtitle={<>Movimentação consolidada do back office · período atual: <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-2)' }}>hoje</span></>}
        actions={
          <>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 32, padding: '0 12px', borderRadius: 8, border: '1px solid var(--ds-border)', background: 'var(--surface)', fontSize: 13, fontWeight: 500, cursor: 'pointer', color: 'var(--text)' }}>
              Últimos 12 meses <ChevronDown />
            </div>
            <button style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 32, padding: '0 12px', borderRadius: 8, border: '1px solid var(--ds-border)', background: 'var(--surface)', fontSize: 13, fontWeight: 500, cursor: 'pointer', color: 'var(--text)', fontFamily: 'var(--font-sans)' }}>
              <DownloadIcon />Exportar
            </button>
          </>
        }
      />

      {/* KPI strip */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr 1fr 1fr', background: 'var(--surface)', border: '1px solid var(--ds-border)', borderRadius: 12, overflow: 'hidden', boxShadow: 'var(--shadow-xs)' }}>
        <KpiTile
          label="MRR (receita mensal)" currency
          value={mrr.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          delta="+5,4%" deltaTone="up" trend={MRR_TREND} color="var(--ok-ink)"
        />
        <KpiTile label="Organizações ativas" value={String(data?.activeOrgs ?? 142)} delta="+3" deltaTone="up" trend={ACTIVE_TREND} color="var(--info-ink)"/>
        <KpiTile label="Em trial" value={String(data?.trialOrgs ?? 23)} delta="−2" deltaTone="down" trend={TRIAL_TREND} color="var(--warn-ink)"/>
        <KpiTile label="Suspensas" value={String(data?.suspendedOrgs ?? 8)} delta="−1" deltaTone="up" trend={SUSP_TREND} color="var(--warn-ink)"/>
        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>Faturas vencidas</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 600, letterSpacing: '-0.022em', color: 'var(--danger)', fontVariantNumeric: 'tabular-nums', lineHeight: '32px' }}>
            {data?.overdueInvoices ?? 14}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontVariantNumeric: 'tabular-nums', fontWeight: 500 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', padding: '1px 5px', borderRadius: 4, fontFamily: 'var(--font-mono)', fontSize: 11, background: 'var(--danger-soft)', color: 'var(--danger-ink)' }}>
              ↑ +2
            </span>
            <span style={{ color: 'var(--text-faint)', fontWeight: 400 }}>vs mês anterior</span>
          </div>
          <div style={{ height: 30, marginTop: 4 }}>
            <Sparkline data={OVERDUE_TREND} color="var(--danger-ink)" height={30} />
          </div>
        </div>
      </div>

      {/* Funnel + recent orgs */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
        {/* Recent orgs */}
        <Card>
          <CardHeader
            title="Organizações recentes"
            actions={
              <Link to="/organizations" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 28, padding: '0 10px', borderRadius: 6, fontSize: 12.5, fontWeight: 500, color: 'var(--p)', background: 'transparent', border: '1px solid transparent', textDecoration: 'none' }}>
                Ver todas <ArrowRight />
              </Link>
            }
          />
          <table className="pa-tbl">
            <thead>
              <tr>
                <th>Organização</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>MRR</th>
              </tr>
            </thead>
            <tbody>
              {recentOrgs.length === 0 ? (
                [1,2,3,4,5].map(i => (
                  <tr key={i}><td colSpan={3} style={{ padding: '12px 16px' }}><Skeleton className="h-4 w-full" /></td></tr>
                ))
              ) : recentOrgs.map((org) => (
                <tr key={org.id}>
                  <td>
                    <div className="flex items-center gap-2">
                      <OrgAvatar name={org.name} size={28} />
                      <div>
                        <Link to={`/organizations/${org.id}`} style={{ fontWeight: 500, color: 'var(--text)', textDecoration: 'none' }}>
                          {org.name}
                        </Link>
                      </div>
                    </div>
                  </td>
                  <td>
                    {org.status === 'ACTIVE' ? <StatusPill tone="ok">Ativa</StatusPill>
                      : org.status === 'SUSPENDED' ? <StatusPill tone="warn">Suspensa</StatusPill>
                      : <StatusPill tone="muted">Cancelada</StatusPill>}
                  </td>
                  <td className="num" style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 12 }}>—</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        {/* Conversion funnel */}
        <Card>
          <CardHeader title="Funil de conversão" subtitle="trial → ativo · 90 dias" />
          <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <FunnelBar label="Trials iniciados"     count={86} pct={100} color="var(--info)" />
            <FunnelBar label="Onboarding concluído" count={71} pct={82}  color="var(--p)" />
            <FunnelBar label="Convertidas em ativa" count={54} pct={63}  color="var(--ok)" />
            <FunnelBar label="Pagamento recorrente" count={49} pct={57}  color="hsl(110 50% 40%)" />
            <div style={{ marginTop: 4, padding: '10px 12px', background: 'var(--surface-2)', borderRadius: 6, fontSize: 12, color: 'var(--text-2)', display: 'flex', justifyContent: 'space-between' }}>
              <span>Taxa de conversão</span>
              <span className="num" style={{ color: 'var(--ok-ink)', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>62,8% ↑ 4,1pp</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Overdue invoices */}
      {overdueInvoices.length > 0 && (
        <Card>
          <CardHeader
            title="Faturas vencidas"
            subtitle={<>Requer atuação · <span className="num">{formatCurrency(overdueTotal)}</span></>}
            actions={
              <Link to="/invoices" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 28, padding: '0 10px', borderRadius: 6, fontSize: 12.5, fontWeight: 500, color: 'var(--p)', background: 'transparent', border: '1px solid transparent', textDecoration: 'none' }}>
                Ir para faturas <ArrowRight />
              </Link>
            }
          />
          <div>
            {overdueInvoices.map((inv, i) => {
              const orgName = inv.subscription?.organization?.name ?? '—'
              return (
                <div key={inv.id} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 12, alignItems: 'center', padding: '10px 16px', borderBottom: i < overdueInvoices.length - 1 ? '1px solid var(--border-soft)' : 0 }}>
                  <div>
                    <div style={{ fontWeight: 500, fontSize: 13, color: 'var(--text)' }}>{orgName}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
                      {inv.subscription?.plan?.name} · vencida
                    </div>
                  </div>
                  <div className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 500, color: 'var(--danger-ink)' }}>
                    {formatCurrency(inv.amount)}
                  </div>
                  <button style={{ width: 26, height: 26, display: 'grid', placeItems: 'center', borderRadius: 6, border: 0, background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}>
                    <MoreIcon />
                  </button>
                </div>
              )
            })}
          </div>
        </Card>
      )}
    </div>
  )
}
