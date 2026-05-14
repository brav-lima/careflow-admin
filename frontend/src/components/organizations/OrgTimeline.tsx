import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { formatDate } from '@/lib/utils'
import type { OrgEvent, OrgEventType } from '@/types/admin'
import { Card, CardHeader } from '@/components/ui/ds'
import { Skeleton } from '@/components/ui/skeleton'

const EVENT_META: Record<OrgEventType, { label: string; color: string }> = {
  ORG_CREATED:           { label: 'Organização criada',          color: 'var(--ok-ink)' },
  STATUS_CHANGED:        { label: 'Status alterado',             color: 'var(--warn-ink)' },
  SUBSCRIPTION_STARTED:  { label: 'Assinatura iniciada',         color: 'var(--ok-ink)' },
  SUBSCRIPTION_CANCELED: { label: 'Assinatura cancelada',        color: 'var(--danger-ink, #e03)' },
  PLAN_CHANGED:          { label: 'Plano alterado',              color: 'var(--p)' },
  TRIAL_STARTED:         { label: 'Trial iniciado',              color: 'var(--p)' },
  TRIAL_CONVERTED:       { label: 'Trial convertido',            color: 'var(--ok-ink)' },
  INVOICE_PAID:          { label: 'Fatura paga',                 color: 'var(--ok-ink)' },
  INVOICE_OVERDUE:       { label: 'Fatura vencida',              color: 'var(--danger-ink, #e03)' },
  USER_ADDED:            { label: 'Usuário adicionado',          color: 'var(--text-muted)' },
  USER_REMOVED:          { label: 'Usuário removido',            color: 'var(--text-muted)' },
  PASSWORD_RESET:        { label: 'Senha redefinida',            color: 'var(--text-muted)' },
}

function eventDetail(event: OrgEvent): string | null {
  const p = event.payload
  if (!p) return null
  if (event.type === 'STATUS_CHANGED' && p.from && p.to) return `${p.from} → ${p.to}`
  if (event.type === 'TRIAL_STARTED' && p.trialEndsAt) return `até ${formatDate(p.trialEndsAt as string)}`
  return null
}

interface Props {
  organizationId: string
}

export function OrgTimeline({ organizationId }: Props) {
  const { data: events, isLoading, isError } = useQuery<OrgEvent[]>({
    queryKey: ['org-events', organizationId],
    queryFn: () => api.get(`/organizations/${organizationId}/events`, { params: { limit: 30 } }).then((r) => r.data),
  })

  return (
    <Card>
      <CardHeader title="Histórico de eventos" />
      <div style={{ padding: '4px 18px 18px' }}>
        {isLoading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-8 w-full rounded" />)}
          </div>
        )}
        {isError && (
          <p style={{ fontSize: 13, color: 'var(--danger-ink, #e03)', margin: 0 }}>
            Falha ao carregar eventos.
          </p>
        )}
        {events && events.length === 0 && (
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>Nenhum evento registrado.</p>
        )}
        {events && events.length > 0 && (
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', left: 7, top: 8, bottom: 8, width: 1, background: 'var(--divider)' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {events.map((ev) => {
                const meta = EVENT_META[ev.type]
                const detail = eventDetail(ev)
                return (
                  <div key={ev.id} style={{ display: 'flex', gap: 16, paddingBottom: 14, position: 'relative' }}>
                    <div style={{ width: 15, height: 15, borderRadius: '50%', background: meta.color, border: '2px solid var(--surface)', flexShrink: 0, marginTop: 1, zIndex: 1 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', lineHeight: '18px' }}>
                        {meta.label}
                        {detail && <span style={{ fontWeight: 400, color: 'var(--text-muted)', marginLeft: 6 }}>{detail}</span>}
                      </div>
                      <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2, fontFamily: 'var(--font-mono)' }}>
                        {formatDate(ev.createdAt)}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}
