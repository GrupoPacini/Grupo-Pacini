import { NavLink, Outlet, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  FileText,
  Users,
  Settings,
  Bell,
  UserCircle,
  LogOut,
  Menu,
  X,
  Download,
} from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { Button } from './ui/button'
import { cn } from '@/lib/utils'

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()
  const { signOut, user } = useAuth()

  const navItems = [
    { name: 'Painel De Controle', path: '/', icon: LayoutDashboard },
    { name: 'Gestão De Processos', path: '/processos', icon: FileText },
    { name: 'Gestão De Clientes', path: '/clientes', icon: Users },
  ]

  const getPageTitle = () => {
    const item = navItems.find((i) => i.path === location.pathname)
    return item ? item.name : 'Configurações'
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-primary text-primary-foreground transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 flex flex-col',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex items-center justify-between p-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-sm bg-pacini-gradient flex items-center justify-center font-bold text-primary">
              P
            </div>
            <h1 className="text-xl font-bold tracking-tight text-primary-foreground">
              Grupo Pacini
            </h1>
          </div>
          <button
            className="lg:hidden text-primary-foreground/70"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2 rounded-md transition-all duration-200',
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground border-l-4 border-l-accent'
                    : 'text-primary-foreground/70 hover:bg-sidebar-accent/50 hover:text-primary-foreground',
                )
              }
            >
              <item.icon size={20} />
              <span className="font-medium text-title-case">{item.name}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 mt-auto">
          <div className="px-3 py-4 rounded-lg bg-sidebar-accent/30 space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <UserCircle size={32} className="text-accent" />
              <div>
                <p className="font-medium">{user?.name || 'Usuário'}</p>
                <p className="text-xs text-primary-foreground/60">{user?.email}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              className="w-full justify-start text-primary-foreground hover:bg-destructive/20 hover:text-white"
              onClick={signOut}
            >
              <LogOut size={16} className="mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 flex items-center justify-between px-4 lg:px-8 border-b bg-card">
          <div className="flex items-center gap-4">
            <button
              className="lg:hidden text-muted-foreground hover:text-foreground"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={24} />
            </button>
            <h2 className="text-xl font-semibold tracking-tight text-title-case text-foreground">
              {getPageTitle()}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              className="hidden md:flex gap-2 text-xs"
              onClick={() =>
                alert(
                  'Para importar dados, use a plataforma Skip Cloud ou crie um script de importação seguro. Por favor, conecte seu banco de dados.',
                )
              }
            >
              <Download size={14} />
              Importar Dados
            </Button>
            <button className="text-muted-foreground hover:text-foreground relative">
              <Bell size={20} />
              <span className="absolute 0 0 w-2 h-2 bg-accent rounded-full border border-card"></span>
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-4 lg:p-8 relative">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
