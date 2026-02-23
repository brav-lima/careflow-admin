import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'
import type { Plan } from '@/types/admin'
import { Check, X } from 'lucide-react'

export function PlansPage() {
  const { data: plans, isLoading } = useQuery<Plan[]>({
    queryKey: ['plans'],
    queryFn: () => api.get('/plans').then((r) => r.data),
  })

  if (isLoading) return <div className="text-muted-foreground text-sm">Carregando...</div>

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Planos</h1>

      <div className="grid md:grid-cols-3 gap-4">
        {plans?.map((plan) => (
          <div key={plan.id} className="bg-card border rounded-lg p-5 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="font-semibold">{plan.name}</h2>
                <p className="text-2xl font-bold mt-1">
                  {formatCurrency(plan.priceMonthly)}
                  <span className="text-sm font-normal text-muted-foreground">/mês</span>
                </p>
              </div>
              <span
                className={`text-xs px-2 py-1 rounded-full ${
                  plan.isActive ? 'bg-green-100 text-green-700' : 'bg-muted text-muted-foreground'
                }`}
              >
                {plan.isActive ? 'Ativo' : 'Inativo'}
              </span>
            </div>

            <dl className="space-y-1 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Usuários</dt>
                <dd>{plan.maxUsers === 999 ? 'Ilimitado' : plan.maxUsers}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Pacientes</dt>
                <dd>{plan.maxPatients >= 999999 ? 'Ilimitado' : plan.maxPatients.toLocaleString()}</dd>
              </div>
            </dl>

            {plan.features && (
              <div className="space-y-1 text-sm border-t pt-3">
                {Object.entries(plan.features).map(([key, enabled]) => (
                  <div key={key} className="flex items-center gap-2">
                    {enabled ? (
                      <Check className="h-3.5 w-3.5 text-green-600" />
                    ) : (
                      <X className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                    <span className={enabled ? '' : 'text-muted-foreground'}>{key}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
