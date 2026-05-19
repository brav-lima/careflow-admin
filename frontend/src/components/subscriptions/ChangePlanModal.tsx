import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { formatCurrency, getErrorMessage } from '@/lib/utils'
import { useToast } from '@/contexts/ToastContext'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import type { Plan, Subscription } from '@/types/admin'

interface Props {
  subscription: Subscription
  open: boolean
  onClose: () => void
}

export function ChangePlanModal({ subscription, open, onClose }: Props) {
  const [selectedPlanId, setSelectedPlanId] = useState(subscription.planId)
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const { data: plans } = useQuery<Plan[]>({
    queryKey: ['plans'],
    queryFn: () => api.get('/plans').then((r) => r.data),
    enabled: open,
  })

  const activePlans = plans?.filter((p) => p.isActive) ?? []
  const dirty = selectedPlanId !== subscription.planId

  const changePlan = useMutation({
    mutationFn: (planId: string) =>
      api.patch(`/organizations/${subscription.organizationId}/subscription/plan`, { planId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] })
      toast.success('Plano alterado com sucesso')
      onClose()
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  function handleOpenChange(v: boolean) {
    if (!v) {
      setSelectedPlanId(subscription.planId)
      onClose()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent title={`Alterar plano · ${subscription.organization?.name ?? '—'}`}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
            Plano atual: <strong style={{ color: 'var(--text)' }}>{subscription.plan?.name ?? '—'}</strong>
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {activePlans.map((plan) => (
              <label
                key={plan.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8,
                  border: `1px solid ${selectedPlanId === plan.id ? 'var(--p-border)' : 'var(--ds-border)'}`,
                  background: selectedPlanId === plan.id ? 'hsl(16 65% 44% / 0.05)' : 'var(--surface)',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="radio"
                  name="plan-select"
                  value={plan.id}
                  checked={selectedPlanId === plan.id}
                  onChange={() => setSelectedPlanId(plan.id)}
                  style={{ accentColor: 'var(--p)', flexShrink: 0 }}
                />
                <div style={{ flex: 1 }}>
                  <div className="flex items-center gap-2">
                    <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text)' }}>{plan.name}</span>
                    {!plan.visibleToClinic && (
                      <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', padding: '1px 6px', borderRadius: 999, background: 'hsl(260 60% 95%)', color: 'hsl(260 50% 45%)', border: '1px solid hsl(260 50% 85%)' }}>
                        Admin only
                      </span>
                    )}
                    {plan.id === subscription.planId && (
                      <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', padding: '1px 6px', borderRadius: 999, background: 'var(--ok-soft)', color: 'var(--ok-ink)', border: '1px solid var(--ok-border)' }}>
                        Atual
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>
                    {formatCurrency(plan.priceMonthly)}/mês · {plan.maxUsers} usuários · {plan.maxPatients.toLocaleString('pt-BR')} pacientes
                  </div>
                </div>
              </label>
            ))}
          </div>

          <div className="flex justify-end gap-2" style={{ marginTop: 4 }}>
            <button
              onClick={() => handleOpenChange(false)}
              style={{ display: 'inline-flex', alignItems: 'center', height: 32, padding: '0 14px', borderRadius: 8, border: '1px solid var(--ds-border)', background: 'var(--surface)', fontSize: 13, fontWeight: 500, cursor: 'pointer', color: 'var(--text)', fontFamily: 'var(--font-sans)' }}
            >
              Cancelar
            </button>
            <button
              disabled={!dirty || changePlan.isPending}
              onClick={() => changePlan.mutate(selectedPlanId)}
              style={{
                display: 'inline-flex', alignItems: 'center', height: 32, padding: '0 14px', borderRadius: 8,
                border: 'none', background: dirty ? 'var(--p)' : 'var(--surface-3)',
                color: dirty ? 'white' : 'var(--text-faint)', fontSize: 13, fontWeight: 500,
                cursor: dirty ? 'pointer' : 'not-allowed', fontFamily: 'var(--font-sans)',
                boxShadow: dirty ? 'var(--shadow-brand)' : 'none', opacity: changePlan.isPending ? 0.6 : 1,
              }}
            >
              {changePlan.isPending ? 'Salvando...' : 'Confirmar alteração'}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
