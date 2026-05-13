import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { Plan } from '@/types/admin'
import { Skeleton } from '@/components/ui/skeleton'
import { PlanFormModal } from '@/components/plans/PlanFormModal'
import { StatusPill, PageHeader } from '@/components/ui/ds'

const CheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 10, height: 10 }}>
    <path d="M5 12.5 10 17.5l9-11"/>
  </svg>
)
const XIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 8, height: 8 }}>
    <path d="M6 6l12 12M18 6 6 18"/>
  </svg>
)
const ClockIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14 }}>
    <circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>
  </svg>
)
const PLAN_HIGHLIGHT = 'Pro'
const PLAN_COLORS: Record<string, { border: string; shadow?: string; accent: string }> = {
  Essential: { border: 'var(--ds-border)', accent: 'hsl(30 15% 45%)' },
  Pro:       { border: 'var(--p-border)', shadow: '0 6px 22px hsl(16 65% 44% / 0.10)', accent: 'var(--p)' },
  Scale:     { border: 'hsl(20 25% 28%)', accent: 'hsl(20 25% 18%)' },
}

function PlanCard({ plan, isHighlight }: { plan: Plan; isHighlight: boolean }) {
  const colors = PLAN_COLORS[plan.name] ?? PLAN_COLORS.Essential
  const maxUsers = plan.maxUsers >= 999 ? 'Ilimitado' : plan.maxUsers
  const maxPatients = plan.maxPatients >= 999999 ? 'Ilimitado' : plan.maxPatients.toLocaleString('pt-BR')

  return (
    <div
      style={{
        position: 'relative',
        background: 'var(--surface)',
        border: `1px solid ${colors.border}`,
        borderRadius: 12,
        overflow: 'hidden',
        boxShadow: colors.shadow ?? 'var(--shadow-xs)',
      }}
    >
      {isHighlight && (
        <div style={{
          position: 'absolute', top: -10, right: 14,
          fontSize: 10.5, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase',
          padding: '3px 9px', borderRadius: 999,
          background: 'var(--p)', color: 'white',
        }}>
          Mais contratado
        </div>
      )}

      {/* Price header */}
      <div style={{ padding: '22px 20px 18px', borderBottom: '1px solid var(--divider)' }}>
        <div className="flex items-start justify-between">
          <div>
            <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: '-0.012em', color: 'var(--text)', fontFamily: 'var(--font-display)' }}>
              {plan.name}
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 2 }}>
              {plan.maxPatients >= 999999
                ? 'Para grupos clínicos e redes multi-unidade.'
                : plan.maxUsers >= 15
                ? 'Para clínicas em operação consolidada.'
                : 'Para clínicas que estão começando.'}
            </div>
          </div>
          <StatusPill tone={plan.isActive ? 'ok' : 'muted'}>{plan.isActive ? 'Ativo' : 'Inativo'}</StatusPill>
        </div>
        <div style={{ marginTop: 18, display: 'flex', alignItems: 'baseline', gap: 4 }}>
          <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>R$</span>
          <span className="num" style={{ fontSize: 36, fontWeight: 600, letterSpacing: '-0.025em', lineHeight: 1, fontVariantNumeric: 'tabular-nums', fontFamily: 'var(--font-display)', color: 'var(--text)' }}>
            {plan.priceMonthly.toLocaleString('pt-BR')}
          </span>
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>,00 / mês</span>
        </div>
      </div>

      {/* Limits */}
      <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--divider)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <div>
          <div style={{ fontSize: 11.5, color: 'var(--text-muted)', fontWeight: 500 }}>Usuários</div>
          <div className="num" style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--text)', marginTop: 2 }}>{maxUsers}</div>
        </div>
        <div>
          <div style={{ fontSize: 11.5, color: 'var(--text-muted)', fontWeight: 500 }}>Pacientes</div>
          <div className="num" style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--text)', marginTop: 2 }}>{maxPatients}</div>
        </div>
      </div>

      {/* Features */}
      {plan.features && (
        <div style={{ padding: '12px 20px 16px' }}>
          <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-muted)', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 8 }}>
            Funcionalidades
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {Object.entries(plan.features).map(([key, enabled]) => (
              <div key={key} className="flex items-center gap-2" style={{ fontSize: 12.5, color: enabled ? 'var(--text)' : 'var(--text-faint)' }}>
                <span style={{
                  width: 16, height: 16, borderRadius: 4,
                  display: 'grid', placeItems: 'center', flexShrink: 0,
                  background: enabled ? 'var(--ok-soft)' : 'var(--surface-3)',
                  color: enabled ? 'var(--ok-ink)' : 'var(--text-faint)',
                }}>
                  {enabled ? <CheckIcon /> : <XIcon />}
                </span>
                {key}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div style={{ padding: '12px 20px', borderTop: '1px solid var(--divider)', display: 'flex', gap: 8 }}>
        <PlanFormModal plan={plan} />
        <button style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 28, padding: '0 10px', borderRadius: 6, border: '1px solid transparent', background: 'transparent', fontSize: 12.5, fontWeight: 500, cursor: 'pointer', color: 'var(--text-muted)', fontFamily: 'var(--font-sans)' }}>
          Histórico
        </button>
      </div>
    </div>
  )
}

export function PlansPage() {
  const { data: plans, isLoading } = useQuery<Plan[]>({
    queryKey: ['plans'],
    queryFn: () => api.get('/plans').then((r) => r.data),
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <PageHeader
        title="Planos"
        subtitle="Catálogo comercial vigente · alterações afetam apenas novas assinaturas"
        actions={
          <>
            <button style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 32, padding: '0 12px', borderRadius: 8, border: '1px solid var(--ds-border)', background: 'var(--surface)', fontSize: 13, fontWeight: 500, cursor: 'pointer', color: 'var(--text)', fontFamily: 'var(--font-sans)' }}>
              <ClockIcon />Histórico de preços
            </button>
            <PlanFormModal />
          </>
        }
      />

      {isLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} style={{ background: 'var(--surface)', border: '1px solid var(--ds-border)', borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ padding: '22px 20px 18px', borderBottom: '1px solid var(--divider)', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-9 w-28" />
              </div>
              <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {Array.from({ length: 4 }).map((_, j) => <Skeleton key={j} className="h-4 w-full" />)}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {plans?.map((plan) => (
            <PlanCard key={plan.id} plan={plan} isHighlight={plan.name === PLAN_HIGHLIGHT} />
          ))}
        </div>
      )}

      {/* Distribution bar */}
      {plans && plans.length > 0 && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--ds-border)', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--divider)' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 600, letterSpacing: '-0.005em', color: 'var(--text)' }}>
              Distribuição da base
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 2 }}>
              Planos ativos cadastrados
            </div>
          </div>
          <div style={{ padding: 18 }}>
            <div style={{ height: 14, display: 'flex', overflow: 'hidden', borderRadius: 999, background: 'var(--surface-3)', gap: 2 }}>
              {plans.map((plan, i) => {
                const colors = ['hsl(30 18% 72%)', 'var(--p)', 'hsl(20 25% 28%)']
                return (
                  <div
                    key={plan.id}
                    style={{ flex: 1, background: colors[i % colors.length], borderRadius: i === 0 ? '999px 0 0 999px' : i === plans.length - 1 ? '0 999px 999px 0' : 0 }}
                  />
                )
              })}
            </div>
            <div className="flex items-center gap-5" style={{ marginTop: 10, fontSize: 12, color: 'var(--text-2)', flexWrap: 'wrap' }}>
              {plans.map((plan, i) => {
                const colors = ['hsl(30 18% 72%)', 'var(--p)', 'hsl(20 25% 28%)']
                return (
                  <span key={plan.id} className="flex items-center gap-1.5">
                    <span style={{ width: 8, height: 8, borderRadius: 2, background: colors[i % colors.length], flexShrink: 0 }}/>
                    {plan.name}
                    <span className="num" style={{ color: 'var(--text-muted)' }}>· {plan.isActive ? 'ativo' : 'inativo'}</span>
                  </span>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
