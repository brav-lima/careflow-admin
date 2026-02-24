import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { formatDate, formatCurrency } from '@/lib/utils'
import type { Invoice, InvoiceStatus } from '@/types/admin'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/contexts/ToastContext'
import { getErrorMessage } from '@/lib/utils'

const statusLabel: Record<InvoiceStatus, { label: string; className: string }> = {
  PENDING: { label: 'Pendente', className: 'bg-yellow-100 text-yellow-700' },
  PAID: { label: 'Paga', className: 'bg-green-100 text-green-700' },
  OVERDUE: { label: 'Vencida', className: 'bg-red-100 text-red-700' },
  CANCELED: { label: 'Cancelada', className: 'bg-muted text-muted-foreground' },
}

export function InvoicesPage() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const { data: invoices, isLoading } = useQuery<Invoice[]>({
    queryKey: ['invoices'],
    queryFn: () => api.get('/invoices').then((r) => r.data),
  })

  const markPaid = useMutation({
    mutationFn: (id: string) => api.patch(`/invoices/${id}/mark-paid`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      toast.success('Fatura marcada como paga')
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const cancelInvoice = useMutation({
    mutationFn: (id: string) => api.patch(`/invoices/${id}/cancel`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      toast.success('Fatura cancelada')
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-20" />
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b">
              <tr>
                {['Organização', 'Vencimento', 'Valor', 'Status', 'Pago em', 'Ações'].map((h) => (
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
      <h1 className="text-2xl font-bold">Faturas</h1>

      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Organização</th>
              <th className="text-left px-4 py-3 font-medium">Vencimento</th>
              <th className="text-left px-4 py-3 font-medium">Valor</th>
              <th className="text-left px-4 py-3 font-medium">Status</th>
              <th className="text-left px-4 py-3 font-medium">Pago em</th>
              <th className="text-left px-4 py-3 font-medium">Ações</th>
            </tr>
          </thead>
          <tbody>
            {invoices?.map((inv) => {
              const s = statusLabel[inv.status]
              return (
                <tr key={inv.id} className="border-b last:border-0 hover:bg-muted/20">
                  <td className="px-4 py-3 font-medium">
                    {inv.subscription?.organization?.name ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(inv.dueDate)}</td>
                  <td className="px-4 py-3">{formatCurrency(inv.amount)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${s.className}`}>
                      {s.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {inv.paidAt ? formatDate(inv.paidAt) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    {(inv.status === 'PENDING' || inv.status === 'OVERDUE') && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => markPaid.mutate(inv.id)}
                          disabled={markPaid.isPending}
                          className="text-xs text-green-700 hover:underline disabled:opacity-50"
                        >
                          Dar baixa
                        </button>
                        <button
                          onClick={() => cancelInvoice.mutate(inv.id)}
                          disabled={cancelInvoice.isPending}
                          className="text-xs text-red-600 hover:underline disabled:opacity-50"
                        >
                          Cancelar
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              )
            })}
            {invoices?.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  Nenhuma fatura encontrada
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
