import { NavLink, Outlet, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  FileText,
  LayoutTemplate,
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
  Settings,
  DollarSign,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { usePermissions } from '@/hooks/use-permissions'
import { getModuleFromPath } from '@/lib/permissions'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
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

const STORAGE_KEY = 'sidebar-collapsed'

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(STORAGE_KEY) === 'true')
  const location = useLocation()
  const { signOut, user, isAdmin } = useAuth()
  const { canView } = usePermissions()

  const toggleCollapse = () => {
    const next = !collapsed
    setCollapsed(next)
    localStorage.setItem(STORAGE_KEY, String(next))
  }

  const navSections: NavSection[] = [
    {
      title: 'Geral',
      items: [
        { name: 'Painel De Controle', path: '/', icon: LayoutDashboard },
        { name: 'Gestão De Tarefas', path: '/processos', icon: FileText },
        { name: 'Modelos De Processo', path: '/modelos-processo', icon: LayoutTemplate },
        { name: 'Gestão De Clientes', path: '/clientes', icon: Users },
      ],
    },
    {
      title: 'Societário',
      items: [
        { name: 'Licenças', path: '/licencas', icon: ShieldCheck },
        { name: 'Renovações', path: '/renovacoes', icon: RefreshCw },
      ],
    },
    {
      title: 'BPO Financeiro',
      items: [{ name: 'Relatório Financeiro', path: '/relatorio-financeiro', icon: DollarSign }],
    },
    {
      title: 'Conhecimento',
      items: [
        { name: 'Playbooks', path: '/playbooks', icon: BookOpen },
        { name: 'Assistente IA', path: '/chat', icon: Bot },
      ],
    },
  ]

  const permFilteredSections = navSections
    .map((s) => ({
      ...s,
      items: s.items.filter((i) => {
        const mod = getModuleFromPath(i.path)
        return !mod || canView(mod)
      }),
    }))
    .filter((s) => s.items.length > 0)

  const filteredSections = searchQuery
    ? permFilteredSections
        .map((s) => ({
          ...s,
          items: s.items.filter((i) => i.name.toLowerCase().includes(searchQuery.toLowerCase())),
        }))
        .filter((s) => s.items.length > 0)
    : permFilteredSections

  const getPageTitle = () => {
    for (const section of navSections) {
      const item = section.items.find((i) => i.path === location.pathname)
      if (item) return item.name
    }
    return 'Configurações'
  }

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      'flex items-center gap-3 px-3 py-2 rounded-md transition-all duration-200',
      isActive &&
        !collapsed &&
        'bg-sidebar-accent text-sidebar-accent-foreground border-l-4 border-l-accent',
      isActive &&
        collapsed &&
        'bg-sidebar-accent text-sidebar-accent-foreground lg:relative lg:before:content-[""] lg:before:absolute lg:before:left-0 lg:before:top-1/2 lg:before:-translate-y-1/2 lg:before:w-1 lg:before:h-4 lg:before:rounded-full lg:before:bg-accent',
      !isActive &&
        'text-primary-foreground/70 hover:bg-sidebar-accent/50 hover:text-primary-foreground',
      collapsed && 'lg:justify-center lg:w-11 lg:h-11 lg:px-0 lg:py-0 lg:mx-auto',
    )

  const renderNavItem = (item: NavItem) => {
    const content = (
      <>
        <item.icon size={20} className="shrink-0" />
        <span className={cn('font-medium text-title-case', collapsed && 'lg:hidden')}>
          {item.name}
        </span>
      </>
    )
    if (collapsed) {
      return (
        <Tooltip key={item.path}>
          <TooltipTrigger asChild>
            <NavLink to={item.path} onClick={() => setSidebarOpen(false)} className={navLinkClass}>
              {content}
            </NavLink>
          </TooltipTrigger>
          <TooltipContent side="right">{item.name}</TooltipContent>
        </Tooltip>
      )
    }
    return (
      <NavLink
        key={item.path}
        to={item.path}
        onClick={() => setSidebarOpen(false)}
        className={navLinkClass}
      >
        {content}
      </NavLink>
    )
  }

  const configLink = (
    <NavLink
      to="/configuracoes"
      onClick={() => setSidebarOpen(false)}
      className={(s) => cn(navLinkClass(s), 'mb-2')}
    >
      <Settings size={20} className="shrink-0" />
      <span className={cn('font-medium text-title-case', collapsed && 'lg:hidden')}>
        Configurações
      </span>
    </NavLink>
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
          collapsed ? 'lg:w-20' : 'lg:w-64',
        )}
      >
        <button
          onClick={toggleCollapse}
          className="absolute top-4 -right-3 z-50 hidden lg:flex items-center justify-center w-6 h-6 rounded-full bg-card border border-border text-muted-foreground hover:bg-muted hover:text-foreground transition-colors shadow-sm"
          title={collapsed ? 'Expandir menu' : 'Recolher menu'}
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        <div
          className={cn(
            'flex items-center justify-between p-6',
            collapsed && 'lg:justify-center lg:p-4',
          )}
        >
          <div className="flex items-center">
            <img
              src="/pacini-logo.svg"
              alt="Grupo Pacini"
              className={cn('h-10 w-auto', collapsed && 'lg:hidden')}
            />
            {collapsed && (
              <div className="hidden lg:flex w-10 h-10 rounded-lg bg-accent items-center justify-center text-lg font-bold text-primary">
                P
              </div>
            )}
          </div>
          <button
            className="lg:hidden text-primary-foreground/70"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        <div className={cn('px-4 pb-2', collapsed && 'lg:hidden')}>
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

        <nav
          className={cn(
            'flex-1 px-4 py-2 space-y-4 overflow-y-auto',
            collapsed && 'lg:px-2 lg:space-y-3',
          )}
        >
          {filteredSections.map((section) => (
            <div key={section.title}>
              <p
                className={cn(
                  'px-3 py-1.5 text-xs font-semibold text-primary-foreground/40 uppercase tracking-wider',
                  collapsed && 'lg:hidden',
                )}
              >
                {section.title}
              </p>
              <div className="space-y-1">{section.items.map(renderNavItem)}</div>
            </div>
          ))}
          {filteredSections.length === 0 && (
            <p className="text-center text-sm text-primary-foreground/40 py-4">
              Nenhuma página encontrada
            </p>
          )}
        </nav>

        {canView('Configurações') && (
          <div className="p-3 mt-auto space-y-1">
            {collapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>{configLink}</TooltipTrigger>
                <TooltipContent side="right">Configurações</TooltipContent>
              </Tooltip>
            ) : (
              configLink
            )}
          </div>
        )}

        <div
          className={cn(
            'flex items-center gap-2 px-2 py-2 rounded-lg bg-sidebar-accent/30',
            collapsed && 'lg:flex-col lg:gap-2 lg:px-1 lg:items-center',
          )}
        >
          <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-sm font-bold text-primary shrink-0">
            {(user?.name || 'U')[0].toUpperCase()}
          </div>
          <span
            className={cn(
              'text-sm font-medium text-primary-foreground truncate flex-1',
              collapsed && 'lg:hidden',
            )}
          >
            {user?.name || 'Usuário'}
          </span>
          <button
            onClick={signOut}
            className="text-primary-foreground/60 hover:text-primary-foreground p-1.5 rounded-md hover:bg-destructive/20 transition-colors shrink-0"
            title="Sair"
          >
            <LogOut size={16} />
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
