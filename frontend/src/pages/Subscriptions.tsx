import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { formatDate, formatCurrency } from '@/lib/utils'
import type { Subscription, SubscriptionStatus } from '@/types/admin'
import { Skeleton } from '@/components/ui/skeleton'
import { CreateSubscriptionModal } from '@/components/subscriptions/CreateSubscriptionModal'

const statusLabel: Record<SubscriptionStatus, { label: string; className: string }> = {
  ACTIVE: { label: 'Ativa', className: 'bg-green-100 text-green-700' },
  TRIAL: { label: 'Trial', className: 'bg-blue-100 text-blue-700' },
  PAST_DUE: { label: 'Inadimplente', className: 'bg-red-100 text-red-700' },
  CANCELED: { label: 'Cancelada', className: 'bg-muted text-muted-foreground' },
}

export function SubscriptionsPage() {
  const { data: subscriptions, isLoading } = useQuery<Subscription[]>({
    queryKey: ['subscriptions'],
    queryFn: () => api.get('/subscriptions').then((r) => r.data),
  })

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-28" />
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b">
              <tr>
                {['Organização', 'Plano', 'Valor', 'Status', 'Início', 'Trial até'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b last:border-0">
                  {Array.from({ length: 6 }).map((_, j) => (
                    <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-full" /></td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Assinaturas</h1>
        <CreateSubscriptionModal />
      </div>

      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Organização</th>
              <th className="text-left px-4 py-3 font-medium">Plano</th>
              <th className="text-left px-4 py-3 font-medium">Valor</th>
              <th className="text-left px-4 py-3 font-medium">Status</th>
              <th className="text-left px-4 py-3 font-medium">Início</th>
              <th className="text-left px-4 py-3 font-medium">Trial até</th>
            </tr>
          </thead>
          <tbody>
            {subscriptions?.map((sub) => {
              const s = statusLabel[sub.status]
              return (
                <tr key={sub.id} className="border-b last:border-0 hover:bg-muted/20">
                  <td className="px-4 py-3 font-medium">{sub.organization?.name ?? '—'}</td>
                  <td className="px-4 py-3">{sub.plan?.name ?? '—'}</td>
                  <td className="px-4 py-3">
                    {sub.plan ? formatCurrency(sub.plan.priceMonthly) + '/mês' : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${s.className}`}>
                      {s.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(sub.startDate)}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {sub.trialEndsAt ? formatDate(sub.trialEndsAt) : '—'}
                  </td>
                </tr>
              )
            })}
            {subscriptions?.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  Nenhuma assinatura encontrada
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
