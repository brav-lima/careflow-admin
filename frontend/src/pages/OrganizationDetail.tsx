import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, Link } from 'react-router-dom'
import { api } from '@/lib/api'
import { formatDate, formatCNPJ, formatCurrency, getErrorMessage } from '@/lib/utils'
import type { Organization, OrgStatus, Subscription, Invoice } from '@/types/admin'
import { ArrowLeft } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { useToast } from '@/contexts/ToastContext'
import { ClinicUsersSection } from '@/components/organizations/ClinicUsersSection'

const statusLabel: Record<OrgStatus, { label: string; className: string }> = {
  ACTIVE: { label: 'Ativa', className: 'bg-green-100 text-green-700' },
  SUSPENDED: { label: 'Suspensa', className: 'bg-yellow-100 text-yellow-700' },
  CANCELED: { label: 'Cancelada', className: 'bg-red-100 text-red-700' },
}

export function OrganizationDetailPage() {
  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const { data: org } = useQuery<Organization>({
    queryKey: ['organization', id],
    queryFn: () => api.get(`/organizations/${id}`).then((r) => r.data),
  })

  const { data: subscriptions } = useQuery<Subscription[]>({
    queryKey: ['subscriptions', id],
    queryFn: () => api.get('/subscriptions', { params: { orgId: id } }).then((r) => r.data),
    enabled: !!id,
  })

  const activeSubscription = subscriptions?.find(
    (s) => s.status === 'ACTIVE' || s.status === 'TRIAL',
  )

  const { data: invoices } = useQuery<Invoice[]>({
    queryKey: ['invoices', activeSubscription?.id],
    queryFn: () =>
      api.get('/invoices', { params: { subscriptionId: activeSubscription!.id } }).then((r) => r.data),
    enabled: !!activeSubscription,
  })

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
      <div className="space-y-6 max-w-4xl">
        <div className="flex items-center gap-3">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          {[0, 1].map((i) => (
            <div key={i} className="bg-card border rounded-lg p-4 space-y-3">
              <Skeleton className="h-4 w-32" />
              {Array.from({ length: 5 }).map((_, j) => (
                <Skeleton key={j} className="h-4 w-full" />
              ))}
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Link to="/organizations" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="text-2xl font-bold">{org.name}</h1>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-card border rounded-lg p-4 space-y-3">
          <h2 className="font-semibold text-sm">Dados da Organização</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">CNPJ</dt>
              <dd>{formatCNPJ(org.document)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Email</dt>
              <dd>{org.email}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Telefone</dt>
              <dd>{org.phone ?? '—'}</dd>
            </div>
            <div className="flex justify-between items-center">
              <dt className="text-muted-foreground">Status</dt>
              <dd>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusLabel[org.status].className}`}>
                  {statusLabel[org.status].label}
                </span>
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Cadastro</dt>
              <dd>{formatDate(org.createdAt)}</dd>
            </div>
          </dl>

          {org.status !== 'CANCELED' && (
            <div className="flex gap-2 pt-2 border-t">
              {org.status === 'ACTIVE' && (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={changeStatus.isPending}
                  onClick={() => changeStatus.mutate('SUSPENDED')}
                >
                  Suspender
                </Button>
              )}
              {org.status === 'SUSPENDED' && (
                <Button
                  size="sm"
                  disabled={changeStatus.isPending}
                  onClick={() => changeStatus.mutate('ACTIVE')}
                >
                  Reativar
                </Button>
              )}
              <Button
                variant="destructive"
                size="sm"
                disabled={changeStatus.isPending}
                onClick={() => changeStatus.mutate('CANCELED')}
              >
                Cancelar
              </Button>
            </div>
          )}
        </div>

        {activeSubscription && (
          <div className="bg-card border rounded-lg p-4 space-y-3">
            <h2 className="font-semibold text-sm">Assinatura Atual</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Plano</dt>
                <dd>{activeSubscription.plan?.name ?? '—'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Valor</dt>
                <dd>{formatCurrency(activeSubscription.plan?.priceMonthly ?? 0)}/mês</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Status</dt>
                <dd>{activeSubscription.status}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Início</dt>
                <dd>{formatDate(activeSubscription.startDate)}</dd>
              </div>
              {activeSubscription.trialEndsAt && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Trial até</dt>
                  <dd>{formatDate(activeSubscription.trialEndsAt)}</dd>
                </div>
              )}
            </dl>
          </div>
        )}
      </div>

      {org.clinicExternalId && <ClinicUsersSection organizationId={org.id} />}

      {invoices && invoices.length > 0 && (
        <div className="bg-card border rounded-lg p-4">
          <h2 className="font-semibold text-sm mb-3">Histórico de Faturas</h2>
          <table className="w-full text-sm">
            <thead className="border-b">
              <tr>
                <th className="text-left pb-2 font-medium text-muted-foreground">Vencimento</th>
                <th className="text-left pb-2 font-medium text-muted-foreground">Valor</th>
                <th className="text-left pb-2 font-medium text-muted-foreground">Status</th>
                <th className="text-left pb-2 font-medium text-muted-foreground">Pago em</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id} className="border-b last:border-0">
                  <td className="py-2">{formatDate(inv.dueDate)}</td>
                  <td className="py-2">{formatCurrency(inv.amount)}</td>
                  <td className="py-2">{inv.status}</td>
                  <td className="py-2">{inv.paidAt ? formatDate(inv.paidAt) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
