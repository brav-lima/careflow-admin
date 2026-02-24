import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { getErrorMessage } from '@/lib/utils'
import { useToast } from '@/contexts/ToastContext'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Plan } from '@/types/admin'
import { Plus, Pencil } from 'lucide-react'

const FEATURES = [
  { key: 'nfse', label: 'Nota Fiscal (NFS-e)' },
  { key: 'whatsapp', label: 'WhatsApp' },
  { key: 'agendamento_online', label: 'Agendamento Online' },
  { key: 'relatorios', label: 'Relatórios Avançados' },
]

const schema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  priceMonthly: z.coerce.number().min(0, 'Valor deve ser positivo'),
  maxUsers: z.coerce.number().int().min(1, 'Mínimo 1 usuário'),
  maxPatients: z.coerce.number().int().min(1, 'Mínimo 1 paciente'),
  isActive: z.boolean(),
})

type FormData = z.infer<typeof schema>

interface Props {
  plan?: Plan
}

export function PlanFormModal({ plan }: Props) {
  const [open, setOpen] = useState(false)
  const [features, setFeatures] = useState<Record<string, boolean>>({})
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const isEditing = !!plan

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: plan
      ? { name: plan.name, priceMonthly: plan.priceMonthly, maxUsers: plan.maxUsers, maxPatients: plan.maxPatients, isActive: plan.isActive }
      : { isActive: true },
  })

  useEffect(() => {
    if (open && plan?.features) {
      setFeatures(plan.features)
    } else if (!open) {
      setFeatures({})
    }
  }, [open, plan])

  const mutation = useMutation({
    mutationFn: (data: FormData) => {
      const body = { ...data, features: Object.keys(features).length > 0 ? features : undefined }
      return isEditing ? api.patch(`/plans/${plan.id}`, body) : api.post('/plans', body)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans'] })
      toast.success(isEditing ? 'Plano atualizado' : 'Plano criado com sucesso')
      reset()
      setOpen(false)
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const toggleFeature = (key: string) => {
    setFeatures((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {isEditing ? (
          <button className="text-muted-foreground hover:text-foreground transition-colors">
            <Pencil className="h-3.5 w-3.5" />
          </button>
        ) : (
          <Button size="sm">
            <Plus className="h-4 w-4" />
            Novo Plano
          </Button>
        )}
      </DialogTrigger>

      <DialogContent title={isEditing ? `Editar: ${plan.name}` : 'Novo Plano'}>
        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="plan-name">Nome *</Label>
            <Input id="plan-name" placeholder="Profissional" {...register('name')} error={errors.name?.message} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="price">Preço/mês (R$) *</Label>
              <Input id="price" type="number" step="0.01" placeholder="197.00" {...register('priceMonthly')} error={errors.priceMonthly?.message} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="maxUsers">Máx. usuários *</Label>
              <Input id="maxUsers" type="number" placeholder="10" {...register('maxUsers')} error={errors.maxUsers?.message} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="maxPatients">Máx. pacientes *</Label>
            <Input id="maxPatients" type="number" placeholder="1000" {...register('maxPatients')} error={errors.maxPatients?.message} />
          </div>

          <div className="space-y-2">
            <Label>Funcionalidades</Label>
            <div className="grid grid-cols-2 gap-2">
              {FEATURES.map(({ key, label }) => (
                <label key={key} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!features[key]}
                    onChange={() => toggleFeature(key)}
                    className="rounded border-input"
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" {...register('isActive')} className="rounded border-input" />
            Plano ativo
          </label>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Salvando...' : isEditing ? 'Salvar Alterações' : 'Criar Plano'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
