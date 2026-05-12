import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { Eye, EyeOff } from 'lucide-react'
import { api } from '@/lib/api'
import { getErrorMessage } from '@/lib/utils'
import { useToast } from '@/contexts/ToastContext'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const PASSWORD_RULES = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/

const schema = z
  .object({
    currentPassword: z.string().min(1, 'Informe a senha atual'),
    newPassword: z
      .string()
      .min(12, 'Mínimo de 12 caracteres')
      .regex(PASSWORD_RULES, 'Deve conter maiúscula, minúscula, número e caractere especial (@$!%*?&)'),
    confirmPassword: z.string().min(1, 'Confirme a nova senha'),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
  })

type FormData = z.infer<typeof schema>

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ChangePasswordModal({ open, onOpenChange }: Props) {
  const { toast } = useToast()
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const mutation = useMutation({
    mutationFn: (data: FormData) =>
      api.patch('/auth/me/password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      }),
    onSuccess: () => {
      toast.success('Senha alterada com sucesso')
      reset()
      onOpenChange(false)
    },
    onError: (err) => {
      toast.error(getErrorMessage(err))
    },
  })

  const handleClose = (open: boolean) => {
    if (!open) reset()
    onOpenChange(open)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent title="Alterar senha" description="Sua sessão atual será mantida após a alteração.">
        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
          <PasswordField
            id="currentPassword"
            label="Senha atual"
            show={showCurrent}
            onToggle={() => setShowCurrent((v) => !v)}
            error={errors.currentPassword?.message}
            registration={register('currentPassword')}
          />
          <PasswordField
            id="newPassword"
            label="Nova senha"
            show={showNew}
            onToggle={() => setShowNew((v) => !v)}
            error={errors.newPassword?.message}
            registration={register('newPassword')}
          />
          <PasswordField
            id="confirmPassword"
            label="Confirmar nova senha"
            show={showConfirm}
            onToggle={() => setShowConfirm((v) => !v)}
            error={errors.confirmPassword?.message}
            registration={register('confirmPassword')}
          />

          <p className="text-xs text-muted-foreground">
            Mínimo 12 caracteres com maiúscula, minúscula, número e símbolo (@$!%*?&).
          </p>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => handleClose(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Salvando...' : 'Alterar senha'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

interface PasswordFieldProps {
  id: string
  label: string
  show: boolean
  onToggle: () => void
  error?: string
  registration: ReturnType<ReturnType<typeof useForm<FormData>>['register']>
}

function PasswordField({ id, label, show, onToggle, error, registration }: PasswordFieldProps) {
  return (
    <div className="space-y-1">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          type={show ? 'text' : 'password'}
          className="pr-10"
          {...registration}
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          tabIndex={-1}
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
