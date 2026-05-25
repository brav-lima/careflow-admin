import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { api } from '@/lib/api'
import { getErrorMessage } from '@/lib/utils'
import { useToast } from '@/contexts/ToastContext'
import type { FeatureDefinition } from '@/types/admin'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { PageHeader, StatusPill } from '@/components/ui/ds'
import { Plus, Pencil, Trash2, GripVertical } from 'lucide-react'

const featureSchema = z.object({
  key: z
    .string()
    .min(2)
    .regex(/^[A-Z][A-Z0-9_]*$/, { message: 'Use UPPER_SNAKE_CASE (ex: DOCUMENTS, FINANCIAL_BASIC)' }),
  label: z.string().min(2, 'Mínimo 2 caracteres'),
  description: z.string().optional(),
  sortOrder: z.coerce.number().int().min(0).optional(),
  active: z.boolean().optional(),
})

type FeatureFormData = z.infer<typeof featureSchema>

function FeatureFormDialog({
  feature,
  trigger,
}: {
  feature?: FeatureDefinition
  trigger: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const isEditing = !!feature

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FeatureFormData>({
    resolver: zodResolver(featureSchema),
    defaultValues: feature
      ? { key: feature.key, label: feature.label, description: feature.description ?? '', sortOrder: feature.sortOrder, active: feature.active }
      : { active: true, sortOrder: 0 },
  })

  const mutation = useMutation({
    mutationFn: (data: FeatureFormData) =>
      isEditing
        ? api.patch(`/plan-features/${feature.id}`, data)
        : api.post('/plan-features', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plan-features'] })
      toast.success(isEditing ? 'Feature atualizada' : 'Feature criada com sucesso')
      setOpen(false)
      reset()
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent title={isEditing ? `Editar: ${feature.label}` : 'Nova Feature'}>
        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="feat-key">Chave (key) *</Label>
            <Input
              id="feat-key"
              placeholder="DOCUMENTS"
              disabled={isEditing}
              {...register('key')}
              error={errors.key?.message}
              style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}
            />
            {!isEditing && (
              <p style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2 }}>
                Imutável após criação. Use UPPER_SNAKE_CASE.
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="feat-label">Nome de exibição *</Label>
            <Input
              id="feat-label"
              placeholder="Módulo de Documentos"
              {...register('label')}
              error={errors.label?.message}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="feat-desc">Descrição</Label>
            <Input
              id="feat-desc"
              placeholder="Permite gerar e armazenar documentos PDF para pacientes"
              {...register('description')}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="feat-order">Ordem de exibição</Label>
              <Input
                id="feat-order"
                type="number"
                placeholder="0"
                {...register('sortOrder')}
                error={errors.sortOrder?.message}
              />
            </div>
            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" {...register('active')} className="rounded border-input" />
                Feature ativa
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Salvando...' : isEditing ? 'Salvar Alterações' : 'Criar Feature'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function DeleteFeatureButton({ feature }: { feature: FeatureDefinition }) {
  const [open, setOpen] = useState(false)
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const mutation = useMutation({
    mutationFn: () => api.delete(`/plan-features/${feature.id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plan-features'] })
      toast.success('Feature removida')
      setOpen(false)
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          title="Remover feature"
          style={{ color: 'var(--text-muted)', cursor: 'pointer', background: 'none', border: 'none', padding: 4, borderRadius: 4, display: 'inline-flex', alignItems: 'center' }}
          onMouseEnter={(e) => { e.currentTarget.style.color = 'hsl(0 72% 51%)'; e.currentTarget.style.background = 'hsl(0 72% 51% / 0.1)' }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'none' }}
        >
          <Trash2 style={{ width: 14, height: 14 }} />
        </button>
      </DialogTrigger>
      <DialogContent title="Remover Feature">
        <p style={{ fontSize: 14, color: 'var(--text)', marginBottom: 8 }}>
          Remover <strong>{feature.label}</strong> ({feature.key})?
        </p>
        <p style={{ fontSize: 12.5, color: 'var(--text-muted)', marginBottom: 20 }}>
          Esta ação não pode ser desfeita. Planos que já contêm esta feature na lista de features não serão afetados automaticamente — você precisará removê-la manualmente deles.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
            style={{ background: 'hsl(0 72% 51%)', color: 'white' }}
          >
            {mutation.isPending ? 'Removendo...' : 'Remover'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function PlanFeaturesPage() {
  const [showInactive, setShowInactive] = useState(false)

  const { data: features, isLoading } = useQuery<FeatureDefinition[]>({
    queryKey: ['plan-features', showInactive],
    queryFn: () =>
      api
        .get(`/plan-features${showInactive ? '?includeInactive=true' : ''}`)
        .then((r) => r.data),
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <PageHeader
        title="Features"
        subtitle="Catálogo de funcionalidades disponíveis para configuração em planos"
        actions={
          <>
            <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: 'var(--text-muted)' }}>
              <input
                type="checkbox"
                checked={showInactive}
                onChange={(e) => setShowInactive(e.target.checked)}
              />
              Incluir inativas
            </label>
            <FeatureFormDialog
              trigger={
                <Button size="sm">
                  <Plus className="h-4 w-4" />
                  Nova Feature
                </Button>
              }
            />
          </>
        }
      />

      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--ds-border)',
          borderRadius: 12,
          overflow: 'hidden',
        }}
      >
        {/* Table header */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '28px 160px 1fr auto 80px 64px',
            gap: 12,
            padding: '10px 16px',
            borderBottom: '1px solid var(--divider)',
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: 'var(--text-muted)',
          }}
        >
          <span />
          <span>Chave</span>
          <span>Nome / Descrição</span>
          <span style={{ textAlign: 'center' }}>Status</span>
          <span style={{ textAlign: 'right' }}>Ordem</span>
          <span />
        </div>

        {isLoading ? (
          <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : features && features.length > 0 ? (
          features.map((feat, i) => (
            <div
              key={feat.id}
              style={{
                display: 'grid',
                gridTemplateColumns: '28px 160px 1fr auto 80px 64px',
                gap: 12,
                padding: '11px 16px',
                alignItems: 'center',
                borderBottom: i < features.length - 1 ? '1px solid var(--divider)' : 'none',
                opacity: feat.active ? 1 : 0.55,
              }}
            >
              <GripVertical style={{ width: 14, height: 14, color: 'var(--text-faint)' }} />

              <code style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-2)', background: 'var(--surface-3)', padding: '2px 6px', borderRadius: 4 }}>
                {feat.key}
              </code>

              <div>
                <div style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--text)' }}>{feat.label}</div>
                {feat.description && (
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>{feat.description}</div>
                )}
              </div>

              <StatusPill tone={feat.active ? 'ok' : 'muted'}>
                {feat.active ? 'Ativa' : 'Inativa'}
              </StatusPill>

              <span className="num" style={{ textAlign: 'right', fontSize: 13, color: 'var(--text-muted)' }}>
                {feat.sortOrder}
              </span>

              <div className="flex items-center justify-end gap-1">
                <FeatureFormDialog
                  feature={feat}
                  trigger={
                    <button
                      title="Editar feature"
                      style={{ color: 'var(--text-muted)', cursor: 'pointer', background: 'none', border: 'none', padding: 4, borderRadius: 4, display: 'inline-flex', alignItems: 'center' }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text)'; e.currentTarget.style.background = 'var(--surface-3)' }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'none' }}
                    >
                      <Pencil style={{ width: 14, height: 14 }} />
                    </button>
                  }
                />
                <DeleteFeatureButton feature={feat} />
              </div>
            </div>
          ))
        ) : (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
            Nenhuma feature cadastrada. Clique em "Nova Feature" para começar.
          </div>
        )}
      </div>

      <div
        style={{
          background: 'hsl(38 80% 97%)',
          border: '1px solid hsl(38 60% 85%)',
          borderRadius: 10,
          padding: '12px 16px',
          fontSize: 12.5,
          color: 'hsl(30 40% 40%)',
        }}
      >
        <strong>Como usar:</strong> Após cadastrar uma feature aqui, edite os planos desejados e marque essa feature na lista. As features ativas aparecem como opções ao configurar um plano.
      </div>
    </div>
  )
}
