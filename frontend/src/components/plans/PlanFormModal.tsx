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
import type { Plan, PlanFeatureKey } from '@/types/admin'
import { Plus, Pencil } from 'lucide-react'

const ALL_FEATURES: { key: PlanFeatureKey; label: string }[] = [
  { key: 'AGENDA',               label: 'Agenda' },
  { key: 'PATIENTS',             label: 'Pacientes (ilimitados)' },
  { key: 'FINANCIAL_BASIC',      label: 'Financeiro básico' },
  { key: 'FINANCIAL_ADVANCED',   label: 'Relatórios financeiros avançados' },
  { key: 'PERINEAL_ASSESSMENT',  label: 'Avaliação perineal' },
  { key: 'TREATMENT_PACKAGES',   label: 'Pacotes de tratamento' },
  { key: 'ANAMNESIS',            label: 'Anamnese personalizada' },
  { key: 'EVOLUTIONS',           label: 'Prontuários e evoluções' },
  { key: 'ROLES',                label: 'Perfis por função (Admin/Prof/Recep)' },
  { key: 'MULTI_PROFESSIONAL',   label: 'Múltiplos profissionais' },
  { key: 'MULTI_CLINIC',         label: 'Multi-clínica' },
  { key: 'PRIORITY_SUPPORT',     label: 'Suporte prioritário' },
]

const schema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  priceMonthly: z.coerce.number().min(0, 'Valor deve ser positivo'),
  maxUsers: z.coerce.number().int().min(1, 'Mínimo 1 usuário'),
  maxPatients: z.coerce.number().int().min(1, 'Mínimo 1 paciente'),
  isActive: z.boolean(),
  visibleToClinic: z.boolean(),
})

type FormData = z.infer<typeof schema>

interface Props {
  plan?: Plan
}

export function PlanFormModal({ plan }: Props) {
  const [open, setOpen] = useState(false)
  const [selectedFeatures, setSelectedFeatures] = useState<Set<PlanFeatureKey>>(new Set())
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
      ? {
          name: plan.name,
          priceMonthly: plan.priceMonthly,
          maxUsers: plan.maxUsers,
          maxPatients: plan.maxPatients,
          isActive: plan.isActive,
          visibleToClinic: plan.visibleToClinic,
        }
      : { isActive: true, visibleToClinic: true },
  })

  useEffect(() => {
    if (open && plan?.features) {
      // Compatibilidade com planos antigos cujo features ainda é { nfse: true, ... }
      const keys: PlanFeatureKey[] = Array.isArray(plan.features)
        ? plan.features
        : Object.entries(plan.features as unknown as Record<string, boolean>)
            .filter(([, v]) => v)
            .map(([k]) => k as PlanFeatureKey)
      setSelectedFeatures(new Set(keys))
    } else if (!open) {
      setSelectedFeatures(new Set())
      reset()
    }
  }, [open, plan, reset])

  const toggleFeature = (key: PlanFeatureKey) => {
    setSelectedFeatures((prev) => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  const mutation = useMutation({
    mutationFn: (data: FormData) => {
      const features = selectedFeatures.size > 0 ? [...selectedFeatures] : undefined
      const body = { ...data, features }
      return isEditing
        ? api.patch(`/plans/${plan.id}`, body)
        : api.post('/plans', body)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans'] })
      toast.success(isEditing ? 'Plano atualizado' : 'Plano criado com sucesso')
      setOpen(false)
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

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
            <Input
              id="plan-name"
              placeholder="Profissional"
              {...register('name')}
              error={errors.name?.message}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="price">Preço/mês (R$) *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                placeholder="197.00"
                {...register('priceMonthly')}
                error={errors.priceMonthly?.message}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="maxUsers">Máx. usuários *</Label>
              <Input
                id="maxUsers"
                type="number"
                placeholder="10"
                {...register('maxUsers')}
                error={errors.maxUsers?.message}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="maxPatients">Máx. pacientes *</Label>
            <Input
              id="maxPatients"
              type="number"
              placeholder="1000"
              {...register('maxPatients')}
              error={errors.maxPatients?.message}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>
                Funcionalidades
                <span style={{ marginLeft: 6, fontSize: 11.5, color: 'var(--text-muted)', fontWeight: 400 }}>
                  ({selectedFeatures.size} selecionadas)
                </span>
              </Label>
            </div>
            <div
              style={{
                border: '1px solid var(--ds-border)',
                borderRadius: 8,
                overflow: 'hidden',
                maxHeight: 260,
                overflowY: 'auto',
              }}
            >
              {ALL_FEATURES.map(({ key, label }, i) => (
                <label
                  key={key}
                  className="flex items-center gap-2.5 cursor-pointer"
                  style={{
                    padding: '7px 12px',
                    fontSize: 13,
                    borderBottom: i < ALL_FEATURES.length - 1 ? '1px solid var(--divider)' : 'none',
                    background: selectedFeatures.has(key) ? 'var(--ok-soft)' : 'transparent',
                    color: selectedFeatures.has(key) ? 'var(--ok-ink)' : 'var(--text)',
                    transition: 'background 0.1s',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedFeatures.has(key)}
                    onChange={() => toggleFeature(key)}
                    style={{ accentColor: 'var(--p)', flexShrink: 0 }}
                  />
                  <span style={{ flex: 1 }}>{label}</span>
                  <code style={{ fontSize: 10.5, color: 'var(--text-faint)', fontFamily: 'var(--font-mono)' }}>
                    {key}
                  </code>
                </label>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" {...register('isActive')} className="rounded border-input" />
              Plano ativo
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" {...register('visibleToClinic')} className="rounded border-input" />
              <span>Visível na interface da clínica</span>
              <span style={{ fontSize: 11.5, color: 'var(--text-muted)', marginLeft: 2 }}>
                (desmarcar = somente via admin)
              </span>
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending
                ? 'Salvando...'
                : isEditing
                ? 'Salvar Alterações'
                : 'Criar Plano'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
