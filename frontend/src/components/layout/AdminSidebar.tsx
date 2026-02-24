import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Building2, CreditCard, FileText, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/organizations', icon: Building2, label: 'Organizações' },
  { to: '/plans', icon: CreditCard, label: 'Planos' },
  { to: '/subscriptions', icon: Settings, label: 'Assinaturas' },
  { to: '/invoices', icon: FileText, label: 'Faturas' },
]

export function AdminSidebar() {
  return (
    <aside className="w-60 bg-sidebar text-sidebar-foreground flex flex-col">
      <div className="px-6 py-5 border-b border-sidebar-border">
        <h1 className="text-lg font-semibold text-sidebar-foreground">CareFlow Admin</h1>
        <p className="text-xs text-sidebar-foreground/60 mt-0.5">Gestão SaaS</p>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                isActive
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
              )
            }
          >
            <Icon className="h-4 w-4" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-sidebar-border">
        <p className="text-xs text-sidebar-foreground/40 px-3">v0.1.0</p>
      </div>
    </aside>
  )
}
