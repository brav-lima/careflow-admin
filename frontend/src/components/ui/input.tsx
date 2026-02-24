import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({ className, error, ...props }, ref) => (
  <div className="space-y-1">
    <input
      ref={ref}
      className={cn(
        'w-full rounded-md border bg-background px-3 py-2 text-sm',
        'placeholder:text-muted-foreground',
        'focus:outline-none focus:ring-2 focus:ring-primary',
        'disabled:cursor-not-allowed disabled:opacity-50',
        error && 'border-destructive focus:ring-destructive',
        className,
      )}
      {...props}
    />
    {error && <p className="text-xs text-destructive">{error}</p>}
  </div>
))
Input.displayName = 'Input'
