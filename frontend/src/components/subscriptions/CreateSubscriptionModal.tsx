import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as Select from '@radix-ui/react-select'
import { ChevronDown, Check, Plus } from 'lucide-react'
import { api } from '@/lib/api'
import { getErrorMessage, formatCurrency } from '@/lib/utils'
import { useToast } from '@/contexts/ToastContext'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import type { Organization, Plan, PaginatedResponse } from '@/types/admin'
import { cn } from '@/lib/utils'

const schema = z.object({
  organizationId: z.string().uuid('Selecione uma organização'),
  planId: z.string().uuid('Selecione um plano'),
  trialEndsAt: z.string().optional(),
})

type FormData = z.infer<typeof schema>

export function CreateSubscriptionModal() {
  const [open, setOpen] = useState(false)
  const [orgId, setOrgId] = useState('')
  const [planId, setPlanId] = useState('')
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const { data: orgsData } = useQuery<PaginatedResponse<Organization>>({
    queryKey: ['organizations-active'],
    queryFn: () => api.get('/organizations', { params: { status: 'ACTIVE', limit: 100 } }).then((r) => r.data),
    enabled: open,
  })

  const { data: plans } = useQuery<Plan[]>({
    queryKey: ['plans'],
    queryFn: () => api.get('/plans').then((r) => r.data),
    enabled: open,
  })

  const activePlans = plans?.filter((p) => p.isActive) ?? []
  const orgs = orgsData?.data ?? []

  const createSub = useMutation({
    mutationFn: (data: FormData) =>
      api.post('/subscriptions', {
        ...data,
        trialEndsAt: data.trialEndsAt || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] })
      toast.success('Assinatura criada com sucesso')
      reset()
      setOrgId('')
      setPlanId('')
      setOpen(false)
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4" />
          Nova Assinatura
        </Button>
      </DialogTrigger>

      <DialogContent title="Nova Assinatura">
        <form onSubmit={handleSubmit((d) => createSub.mutate(d))} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Organização *</Label>
            <Select.Root
              value={orgId}
              onValueChange={(v) => {
                setOrgId(v)
                setValue('organizationId', v, { shouldValidate: true })
              }}
            >
              <Select.Trigger
                className={cn(
                  'flex w-full items-center justify-between rounded-md border bg-background px-3 py-2 text-sm',
                  'focus:outline-none focus:ring-2 focus:ring-primary',
                  errors.organizationId && 'border-destructive',
                )}
              >
                <Select.Value placeholder="Selecione uma organização..." />
                <Select.Icon>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </Select.Icon>
              </Select.Trigger>
              <Select.Portal>
                <Select.Content className="z-50 rounded-md border bg-card shadow-lg max-h-60 overflow-y-auto">
                  <Select.Viewport className="p-1">
                    {orgs.map((org) => (
                      <Select.Item
                        key={org.id}
                        value={org.id}
                        className="flex items-center gap-2 rounded px-3 py-2 text-sm cursor-pointer hover:bg-accent outline-none data-[highlighted]:bg-accent"
                      >
                        <Select.ItemText>{org.name}</Select.ItemText>
                        <Select.ItemIndicator>
                          <Check className="h-3.5 w-3.5 text-primary" />
                        </Select.ItemIndicator>
                      </Select.Item>
                    ))}
                    {orgs.length === 0 && (
                      <div className="px-3 py-2 text-sm text-muted-foreground">Nenhuma organização ativa</div>
                    )}
                  </Select.Viewport>
                </Select.Content>
              </Select.Portal>
            </Select.Root>
            {errors.organizationId && <p className="text-xs text-destructive">{errors.organizationId.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label>Plano *</Label>
            <Select.Root
              value={planId}
              onValueChange={(v) => {
                setPlanId(v)
                setValue('planId', v, { shouldValidate: true })
              }}
            >
              <Select.Trigger
                className={cn(
                  'flex w-full items-center justify-between rounded-md border bg-background px-3 py-2 text-sm',
                  'focus:outline-none focus:ring-2 focus:ring-primary',
                  errors.planId && 'border-destructive',
                )}
              >
                <Select.Value placeholder="Selecione um plano..." />
                <Select.Icon>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </Select.Icon>
              </Select.Trigger>
              <Select.Portal>
                <Select.Content className="z-50 rounded-md border bg-card shadow-lg">
                  <Select.Viewport className="p-1">
                    {activePlans.map((p) => (
                      <Select.Item
                        key={p.id}
                        value={p.id}
                        className="flex items-center gap-2 rounded px-3 py-2 text-sm cursor-pointer hover:bg-accent outline-none data-[highlighted]:bg-accent"
                      >
                        <Select.ItemText>
                          {p.name} — {formatCurrency(p.priceMonthly)}/mês
                        </Select.ItemText>
                        <Select.ItemIndicator>
                          <Check className="h-3.5 w-3.5 text-primary" />
                        </Select.ItemIndicator>
                      </Select.Item>
                    ))}
                    {activePlans.length === 0 && (
                      <div className="px-3 py-2 text-sm text-muted-foreground">Nenhum plano ativo</div>
                    )}
                  </Select.Viewport>
                </Select.Content>
              </Select.Portal>
            </Select.Root>
            {errors.planId && <p className="text-xs text-destructive">{errors.planId.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="trialEndsAt">Fim do trial <span className="text-muted-foreground font-normal">(opcional — se informado, cria em status Trial)</span></Label>
            <Input id="trialEndsAt" type="date" {...register('trialEndsAt')} />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createSub.isPending}>
              {createSub.isPending ? 'Criando...' : 'Criar Assinatura'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
