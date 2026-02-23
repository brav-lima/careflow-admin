import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'
import type { MetricsSummary } from '@/types/admin'
import { TrendingUp, Building2, Clock, AlertTriangle, Ban } from 'lucide-react'

export function DashboardPage() {
  const { data, isLoading } = useQuery<MetricsSummary>({
    queryKey: ['metrics-summary'],
    queryFn: () => api.get('/metrics/summary').then((r) => r.data),
  })

  if (isLoading) return <div className="text-muted-foreground text-sm">Carregando...</div>

  const cards = [
    {
      label: 'MRR',
      value: formatCurrency(data?.mrr ?? 0),
      icon: TrendingUp,
      color: 'text-green-600',
    },
    {
      label: 'Organizações Ativas',
      value: data?.activeOrgs ?? 0,
      icon: Building2,
      color: 'text-blue-600',
    },
    {
      label: 'Em Trial',
      value: data?.trialOrgs ?? 0,
      icon: Clock,
      color: 'text-yellow-600',
    },
    {
      label: 'Suspensas',
      value: data?.suspendedOrgs ?? 0,
      icon: Ban,
      color: 'text-orange-600',
    },
    {
      label: 'Faturas Vencidas',
      value: data?.overdueInvoices ?? 0,
      icon: AlertTriangle,
      color: 'text-red-600',
    },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {cards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-card border rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">{label}</span>
              <Icon className={`h-4 w-4 ${color}`} />
            </div>
            <p className="text-2xl font-bold">{value}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
