import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, Link } from 'react-router-dom'
import { api } from '@/lib/api'
import { formatDate, formatCNPJ, formatCurrency, getErrorMessage } from '@/lib/utils'
import type { Organization, OrgStatus, Subscription, Invoice } from '@/types/admin'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/contexts/ToastContext'
import { ClinicUsersSection } from '@/components/organizations/ClinicUsersSection'
import { OrgTimeline } from '@/components/organizations/OrgTimeline'
import { OrgAvatar, StatusPill, PlanBadge, Card, CardHeader } from '@/components/ui/ds'

const BackIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16 }}>
    <path d="m15 18-6-6 6-6"/>
  </svg>
)
const ExtIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" style={{ width: 13, height: 13 }}>
    <path d="M14 4h6v6M10 14 20 4M20 14v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h5"/>
  </svg>
)
const KeyIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14 }}>
    <circle cx="8" cy="15" r="4"/><path d="m10.8 12.2 9.2-9.2M16 6l3 3"/>
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

function FieldItem({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div style={{ fontSize: 11.5, color: 'var(--text-muted)', fontWeight: 500, marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 13, color: 'var(--text)', fontFamily: mono ? 'var(--font-mono)' : 'var(--font-sans)', fontWeight: mono ? 400 : 500 }}>
        {value}
      </div>
    </div>
  )
}

const statusLabel: Record<OrgStatus, { label: string; className: string }> = {
  ACTIVE:    { label: 'Ativa',     className: 'ok' },
  SUSPENDED: { label: 'Suspensa',  className: 'warn' },
  CANCELED:  { label: 'Cancelada', className: 'muted' },
}

export function OrganizationDetailPage() {
  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const { data: org } = useQuery<Organization>({
    queryKey: ['organization', id],
    queryFn: () => api.get(`/organizations/${id}`).then((r) => r.data),
  })

  const { data: subscriptionsResp } = useQuery<{ data: Subscription[]; total: number }>({
    queryKey: ['subscriptions', id],
    queryFn: () => api.get('/subscriptions', { params: { orgId: id } }).then((r) => r.data),
    enabled: !!id,
  })
  const subscriptions = subscriptionsResp?.data
  const activeSubscription = subscriptions?.find(
    (s) => s.status === 'ACTIVE' || s.status === 'TRIAL',
  )

  const { data: invoicesResp } = useQuery<{ data: Invoice[]; total: number }>({
    queryKey: ['invoices', activeSubscription?.id],
    queryFn: () =>
      api.get('/invoices', { params: { subscriptionId: activeSubscription!.id } }).then((r) => r.data),
    enabled: !!activeSubscription,
  })
  const invoices = invoicesResp?.data

  const changeStatus = useMutation({
    mutationFn: (status: OrgStatus) => api.patch(`/organizations/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization', id] })
      queryClient.invalidateQueries({ queryKey: ['organizations'] })
      toast.success('Status da organização atualizado')
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  if (!org) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-8 w-64" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: 16 }}>
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    )
  }

  const statusTone = statusLabel[org.status].className as 'ok' | 'warn' | 'muted'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <Link
            to="/organizations"
            style={{ width: 32, height: 32, display: 'grid', placeItems: 'center', borderRadius: 8, border: '1px solid var(--ds-border)', background: 'var(--surface)', color: 'var(--text-muted)', textDecoration: 'none' }}
          >
            <BackIcon />
          </Link>
          <OrgAvatar name={org.name} size={48} />
          <div>
            <div className="flex items-center gap-2.5">
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 600, letterSpacing: '-0.018em', color: 'var(--text)', lineHeight: '32px', margin: 0 }}>
                {org.name}
              </h1>
              <StatusPill tone={statusTone}>{statusLabel[org.status].label}</StatusPill>
              {activeSubscription?.plan && <PlanBadge name={activeSubscription.plan.name} />}
            </div>
            <div className="flex items-center gap-3 flex-wrap" style={{ marginTop: 6, fontSize: 12.5, color: 'var(--text-muted)' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{formatCNPJ(org.document)}</span>
              <span>·</span>
              <span>{org.email}</span>
              <span>·</span>
              <span>Cliente desde {formatDate(org.createdAt)}</span>
              {org.clinicExternalId && (
                <>
                  <span>·</span>
                  <span className="flex items-center gap-1" style={{ color: 'var(--text-2)' }}>
                    <ExtIcon />
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>clinic / {org.clinicExternalId}</span>
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 32, padding: '0 12px', borderRadius: 8, border: '1px solid var(--ds-border)', background: 'var(--surface)', fontSize: 13, fontWeight: 500, cursor: 'pointer', color: 'var(--text)', fontFamily: 'var(--font-sans)' }}>
            <KeyIcon />Resetar senha
          </button>
          {org.status === 'ACTIVE' && (
            <button
              onClick={() => changeStatus.mutate('SUSPENDED')}
              disabled={changeStatus.isPending}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 32, padding: '0 12px', borderRadius: 8, border: '1px solid var(--ds-border)', background: 'var(--surface)', fontSize: 13, fontWeight: 500, cursor: 'pointer', color: 'var(--text)', fontFamily: 'var(--font-sans)', opacity: changeStatus.isPending ? 0.5 : 1 }}
            >
              Suspender
            </button>
          )}
          {org.status === 'SUSPENDED' && (
            <button
              onClick={() => changeStatus.mutate('ACTIVE')}
              disabled={changeStatus.isPending}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 32, padding: '0 12px', borderRadius: 8, border: '1px solid var(--p)', background: 'var(--p)', color: 'white', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--font-sans)', boxShadow: 'var(--shadow-brand)', opacity: changeStatus.isPending ? 0.5 : 1 }}
            >
              Reativar
            </button>
          )}
        </div>
      </div>

      {/* Stat strip */}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${org.userCount != null ? 5 : 4}, 1fr)`, background: 'var(--surface)', border: '1px solid var(--ds-border)', borderRadius: 12, overflow: 'hidden' }}>
        {activeSubscription && (
          <div style={{ padding: '16px 20px', borderRight: '1px solid var(--divider)' }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500, marginBottom: 6 }}>MRR contratado</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 600, letterSpacing: '-0.02em', color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>
              <span style={{ fontSize: 14, color: 'var(--text-muted)', fontWeight: 500, marginRight: 2 }}>R$</span>
              {activeSubscription.plan ? Number(activeSubscription.plan.priceMonthly).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—'}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
              Recorrência mensal · plano {activeSubscription.plan?.name}
            </div>
          </div>
        )}
        <div style={{ padding: '16px 20px', borderRight: '1px solid var(--divider)' }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500, marginBottom: 6 }}>Status</div>
          <div style={{ marginTop: 8 }}>
            <StatusPill tone={statusTone}>{statusLabel[org.status].label}</StatusPill>
          </div>
        </div>
        {activeSubscription?.trialEndsAt && (
          <div style={{ padding: '16px 20px', borderRight: '1px solid var(--divider)' }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500, marginBottom: 6 }}>Trial até</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600, color: 'var(--warn-ink)' }}>
              {formatDate(activeSubscription.trialEndsAt)}
            </div>
          </div>
        )}
        <div style={{ padding: '16px 20px', borderRight: org.userCount != null ? '1px solid var(--divider)' : undefined }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500, marginBottom: 6 }}>Cadastro</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 600, color: 'var(--text)' }}>
            {formatDate(org.createdAt)}
          </div>
        </div>
        {org.userCount != null && (
          <div style={{ padding: '16px 20px' }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500, marginBottom: 6 }}>Usuários</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 600, letterSpacing: '-0.02em', color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>
              {org.userCount}
              {activeSubscription?.plan?.maxUsers != null && (
                <span style={{ fontSize: 14, color: 'var(--text-muted)', fontWeight: 500, marginLeft: 4 }}>/ {activeSubscription.plan.maxUsers}</span>
              )}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Usuários ativos na clínica</div>
          </div>
        )}
      </div>

      {/* Two-col layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: 16 }}>
        {/* Left: org info + users */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Card>
            <CardHeader
              title="Dados da organização"
              actions={
                <button style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 28, padding: '0 10px', borderRadius: 6, border: '1px solid transparent', background: 'transparent', fontSize: 12.5, fontWeight: 500, cursor: 'pointer', color: 'var(--text-muted)', fontFamily: 'var(--font-sans)' }}>
                  Editar
                </button>
              }
            />
            <div style={{ padding: 18, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <FieldItem label="Razão social" value={org.name} />
              <FieldItem label="CNPJ" value={formatCNPJ(org.document)} mono />
              <FieldItem label="E-mail" value={org.email} />
              <FieldItem label="Telefone" value={org.phone ?? '—'} mono />
              {org.clinicExternalId && (
                <FieldItem label="ID externo (clínica)" value={org.clinicExternalId} mono />
              )}
            </div>
          </Card>

          {org.clinicExternalId && <ClinicUsersSection organizationId={org.id} />}
        </div>

        {/* Right: timeline + invoice history */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <OrgTimeline organizationId={org.id} />
          {invoices && invoices.length > 0 && (
            <Card>
              <CardHeader
                title="Histórico de faturas"
                actions={
                  <Link to="/invoices" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 28, padding: '0 10px', borderRadius: 6, fontSize: 12.5, fontWeight: 500, color: 'var(--p)', background: 'transparent', border: '1px solid transparent', textDecoration: 'none' }}>
                    Ver todas <ArrowRight />
                  </Link>
                }
              />
              <table className="pa-tbl">
                <thead>
                  <tr>
                    <th>Ref.</th>
                    <th>Vencimento</th>
                    <th style={{ textAlign: 'right' }}>Valor</th>
                    <th>Status</th>
                    <th>Pago em</th>
                    <th style={{ width: 32 }} />
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv) => (
                    <tr key={inv.id}>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5 }}>
                        {inv.externalReference ?? `INV-${inv.id.slice(0, 8).toUpperCase()}`}
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)' }}>
                        {formatDate(inv.dueDate)}
                      </td>
                      <td className="num" style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                        {formatCurrency(inv.amount)}
                      </td>
                      <td>
                        {inv.status === 'PAID'    ? <StatusPill tone="ok">Paga</StatusPill>
                          : inv.status === 'PENDING' ? <StatusPill tone="warn">Pendente</StatusPill>
                          : inv.status === 'OVERDUE' ? <StatusPill tone="danger">Vencida</StatusPill>
                          : <StatusPill tone="muted">Cancelada</StatusPill>}
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)' }}>
                        {inv.paidAt ? formatDate(inv.paidAt) : '—'}
                      </td>
                      <td>
                        <button style={{ width: 26, height: 26, display: 'grid', placeItems: 'center', border: 0, background: 'transparent', cursor: 'pointer', borderRadius: 6, color: 'var(--text-muted)' }}>
                          <MoreIcon />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          )}

          {activeSubscription && (
            <Card>
              <CardHeader title="Assinatura atual" />
              <div style={{ padding: 18, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <FieldItem label="Plano" value={activeSubscription.plan?.name ?? '—'} />
                <FieldItem label="Valor" value={activeSubscription.plan ? `${formatCurrency(activeSubscription.plan.priceMonthly)}/mês` : '—'} mono />
                <FieldItem label="Início" value={formatDate(activeSubscription.startDate)} mono />
                <FieldItem label="Status" value={activeSubscription.status} />
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
