import { NavLink, Outlet, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  FileText,
  Users,
  Bell,
  LogOut,
  Menu,
  X,
  Download,
  BookOpen,
  ShieldCheck,
  Bot,
  RefreshCw,
  Search,
} from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { Button } from './ui/button'
import { cn } from '@/lib/utils'

interface NavItem {
  name: string
  path: string
  icon: typeof LayoutDashboard
}

interface NavSection {
  title: string
  items: NavItem[]
}

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const location = useLocation()
  const { signOut, user, isAdmin } = useAuth()

  const navSections: NavSection[] = [
    {
      title: 'Operações',
      items: [
        { name: 'Painel De Controle', path: '/', icon: LayoutDashboard },
        { name: 'Gestão De Processos', path: '/processos', icon: FileText },
      ],
    },
    {
      title: 'Diretório',
      items: [
        { name: 'Gestão De Clientes', path: '/clientes', icon: Users },
        { name: 'Licenças', path: '/licencas', icon: ShieldCheck },
        { name: 'Renovações', path: '/renovacoes', icon: RefreshCw },
      ],
    },
    {
      title: 'Conhecimento',
      items: [
        { name: 'Playbooks', path: '/playbooks', icon: BookOpen },
        { name: 'Assistente IA', path: '/chat', icon: Bot },
      ],
    },
  ]

  const filteredSections = searchQuery
    ? navSections
        .map((s) => ({
          ...s,
          items: s.items.filter((i) => i.name.toLowerCase().includes(searchQuery.toLowerCase())),
        }))
        .filter((s) => s.items.length > 0)
    : navSections

  const getPageTitle = () => {
    for (const section of navSections) {
      const item = section.items.find((i) => i.path === location.pathname)
      if (item) return item.name
    }
    return 'Configurações'
  }

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

        <div className="px-4 pb-2">
          <div className="relative">
            <Search
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-primary-foreground/50"
              size={14}
            />
            <input
              type="text"
              placeholder="Filtrar páginas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-sm rounded-md bg-sidebar-accent/30 text-primary-foreground placeholder:text-primary-foreground/40 border border-primary-foreground/10 focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>
        </div>

        <nav className="flex-1 px-4 py-2 space-y-4 overflow-y-auto">
          {filteredSections.map((section) => (
            <div key={section.title}>
              <p className="px-3 py-1.5 text-xs font-semibold text-primary-foreground/40 uppercase tracking-wider">
                {section.title}
              </p>
              <div className="space-y-1">
                {section.items.map((item) => (
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
              </div>
            </div>
          ))}
          {filteredSections.length === 0 && (
            <p className="text-center text-sm text-primary-foreground/40 py-4">
              Nenhuma página encontrada
            </p>
          )}
        </nav>

        <div className="p-3 mt-auto">
          <div className="flex items-center gap-2 px-2 py-2 rounded-lg bg-sidebar-accent/30">
            <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-sm font-bold text-primary shrink-0">
              {(user?.name || 'U')[0].toUpperCase()}
            </div>
            <span className="text-sm font-medium text-primary-foreground truncate flex-1">
              {user?.name || 'Usuário'}
            </span>
            <button
              onClick={signOut}
              className="text-primary-foreground/60 hover:text-primary-foreground p-1.5 rounded-md hover:bg-destructive/20 transition-colors"
              title="Sair"
            >
              <LogOut size={16} />
            </button>
          </div>
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
            <h2 className="text-xl font-semibold tracking-tight text-title-case text-foreground">
              {getPageTitle()}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            {isAdmin && (
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
            )}
            <button className="text-muted-foreground hover:text-foreground relative">
              <Bell size={20} />
              <span className="absolute top-0 right-0 w-2 h-2 bg-accent rounded-full border border-card"></span>
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
