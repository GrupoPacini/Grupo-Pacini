import { useState, useEffect } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { FileText, LogOut, Menu, X, Building2 } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import pb from '@/lib/pocketbase/client'
import { cn } from '@/lib/utils'

export function ClientLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [clientName, setClientName] = useState('')
  const { signOut, user, clientId } = useAuth()

  useEffect(() => {
    if (!clientId) return
    let active = true
    pb.collection('clients')
      .getOne(clientId)
      .then((record: any) => {
        if (!active) return
        setClientName(record.razao_social || record.name || '')
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [clientId])

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      'flex items-center gap-3 px-3 py-2 rounded-md transition-all duration-200',
      isActive
        ? 'bg-sidebar-accent text-sidebar-accent-foreground border-l-4 border-l-accent'
        : 'text-primary-foreground/70 hover:bg-sidebar-accent/50 hover:text-primary-foreground',
    )

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-primary text-primary-foreground transition-all duration-300 ease-in-out lg:static lg:translate-x-0 flex flex-col',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex items-center justify-between p-6">
          <div className="flex items-center justify-center w-full">
            <img
              src="/visual-edits/logo-horizontal-branco-1c243594.png"
              alt="Grupo Pacini"
              className="h-16 w-auto object-contain mx-auto"
            />
          </div>
          <button
            className="lg:hidden text-primary-foreground/70"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        {clientName && (
          <div className="px-4 pb-2">
            <div className="px-3 py-2 rounded-lg bg-sidebar-accent/30">
              <div className="flex items-center gap-2">
                <Building2 size={14} className="text-primary-foreground/60 shrink-0" />
                <span className="text-sm font-medium text-primary-foreground truncate">
                  {clientName}
                </span>
              </div>
            </div>
          </div>
        )}

        <nav className="flex-1 px-4 py-2 space-y-1">
          <NavLink
            to="/relatorio-financeiro"
            onClick={() => setSidebarOpen(false)}
            className={navLinkClass}
          >
            <FileText size={20} className="shrink-0" />
            <span className="font-medium">Relatório Financeiro</span>
          </NavLink>
        </nav>

        <div className="p-4 mt-auto space-y-2">
          <div className="flex items-center gap-2 px-2 py-2 rounded-lg bg-sidebar-accent/30">
            <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-sm font-bold text-primary shrink-0">
              {(user?.name || 'U')[0].toUpperCase()}
            </div>
            <span className="text-sm font-medium text-primary-foreground truncate flex-1">
              {user?.name || 'Usuário'}
            </span>
          </div>
          <button
            onClick={signOut}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-md text-primary-foreground/70 hover:bg-destructive/20 hover:text-primary-foreground transition-colors"
          >
            <LogOut size={20} className="shrink-0" />
            <span className="font-medium">Sair</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 flex items-center justify-between px-4 lg:px-8 border-b bg-card">
          <div className="flex items-center gap-4">
            <button
              className="lg:hidden text-muted-foreground hover:text-foreground"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={24} />
            </button>
            {clientName && (
              <div className="flex items-center gap-2">
                <Building2 size={18} className="text-muted-foreground" />
                <span className="text-base font-semibold text-foreground truncate">
                  {clientName}
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground hidden sm:block">
              {user?.name || 'Usuário'}
            </span>
            <button
              onClick={signOut}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <LogOut size={16} />
              <span className="hidden sm:block">Sair</span>
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-4 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
