import * as ToastPrimitive from '@radix-ui/react-toast'
import { X, CheckCircle, AlertCircle } from 'lucide-react'
import { useToast } from '@/contexts/ToastContext'
import { cn } from '@/lib/utils'

export function Toaster() {
  const { toasts, dismiss } = useToast()

  return (
    <ToastPrimitive.Provider swipeDirection="right">
      {toasts.map((t) => (
        <ToastPrimitive.Root
          key={t.id}
          open
          onOpenChange={(open) => !open && dismiss(t.id)}
          className={cn(
            'flex items-start gap-3 rounded-lg border px-4 py-3 shadow-lg',
            'data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom-2',
            'data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right-full',
            'bg-card w-80 max-w-[90vw]',
            t.type === 'success' ? 'border-green-200' : 'border-red-200',
          )}
        >
          {t.type === 'success' ? (
            <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
          ) : (
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
          )}
          <ToastPrimitive.Description className="flex-1 text-sm">{t.message}</ToastPrimitive.Description>
          <ToastPrimitive.Close
            onClick={() => dismiss(t.id)}
            className="shrink-0 text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </ToastPrimitive.Close>
        </ToastPrimitive.Root>
      ))}

      <ToastPrimitive.Viewport className="fixed bottom-4 right-4 z-50 flex flex-col gap-2" />
    </ToastPrimitive.Provider>
  )
}
