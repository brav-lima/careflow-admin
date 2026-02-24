import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { getErrorMessage } from '@/lib/utils'
import { useToast } from '@/contexts/ToastContext'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus } from 'lucide-react'

const schema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  document: z
    .string()
    .length(14, 'CNPJ deve ter 14 dígitos')
    .regex(/^\d+$/, 'CNPJ deve conter apenas números'),
  email: z.string().email('Email inválido'),
  phone: z.string().optional(),
  clinicExternalId: z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface AvailableClinic {
  id: string
  name: string
}

export function CreateOrganizationModal() {
  const [open, setOpen] = useState(false)
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const { data: availableClinics } = useQuery<AvailableClinic[]>({
    queryKey: ['available-clinics'],
    queryFn: () => api.get('/organizations/available-clinics').then((r) => r.data),
    enabled: open,
  })

  const createOrg = useMutation({
    mutationFn: (data: FormData) =>
      api.post('/organizations', {
        ...data,
        phone: data.phone || undefined,
        clinicExternalId: data.clinicExternalId || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] })
      toast.success('Organização criada com sucesso')
      reset()
      setOpen(false)
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4" />
          Nova Organização
        </Button>
      </DialogTrigger>

      <DialogContent title="Nova Organização" description="Preencha os dados da organização cliente">
        <form onSubmit={handleSubmit((d) => createOrg.mutate(d))} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Nome *</Label>
            <Input id="name" placeholder="Clínica Saúde Total" {...register('name')} error={errors.name?.message} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="document">CNPJ * (somente números)</Label>
            <Input id="document" placeholder="00000000000000" maxLength={14} {...register('document')} error={errors.document?.message} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">Email *</Label>
            <Input id="email" type="email" placeholder="contato@clinica.com" {...register('email')} error={errors.email?.message} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="phone">Telefone</Label>
            <Input id="phone" placeholder="(11) 99999-9999" {...register('phone')} />
          </div>

          {availableClinics && availableClinics.length > 0 && (
            <div className="space-y-1.5">
              <Label htmlFor="clinicExternalId">Vincular a clínica existente</Label>
              <select
                id="clinicExternalId"
                {...register('clinicExternalId')}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Criar nova clínica automaticamente</option>
                {availableClinics.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createOrg.isPending}>
              {createOrg.isPending ? 'Criando...' : 'Criar Organização'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
