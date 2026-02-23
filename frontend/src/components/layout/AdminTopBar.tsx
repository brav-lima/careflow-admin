import { useAdminAuth } from '@/contexts/AdminAuthContext'
import { LogOut, User } from 'lucide-react'

export function AdminTopBar() {
  const { user, logout } = useAdminAuth()

  return (
    <header className="h-14 border-b bg-card px-6 flex items-center justify-between">
      <div />
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-sm">
          <User className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{user?.name}</span>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
            {user?.role}
          </span>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sair
        </button>
      </div>
    </header>
  )
}
