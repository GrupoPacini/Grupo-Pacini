import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Check,
  X,
  LayoutDashboard,
  Users,
  FileText,
  FileCheck,
  RefreshCw,
  BookOpen,
  Bot,
  Settings,
  UserCog,
} from 'lucide-react'
import { LucideIcon } from 'lucide-react'

interface ProfilePermissionsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  role: 'admin' | 'colaborador' | null
}

interface ModulePermission {
  module: string
  icon: LucideIcon
  admin: string[]
  colaborador: string[]
}

const PERMISSIONS: ModulePermission[] = [
  {
    module: 'Dashboard',
    icon: LayoutDashboard,
    admin: ['visualizar'],
    colaborador: ['visualizar'],
  },
  {
    module: 'Clientes',
    icon: Users,
    admin: ['visualizar', 'criar', 'editar', 'excluir'],
    colaborador: ['visualizar'],
  },
  {
    module: 'Processos',
    icon: FileText,
    admin: ['visualizar', 'criar', 'editar', 'excluir'],
    colaborador: ['visualizar'],
  },
  {
    module: 'Licenças',
    icon: FileCheck,
    admin: ['visualizar', 'criar', 'editar', 'excluir'],
    colaborador: ['visualizar'],
  },
  {
    module: 'Renovações',
    icon: RefreshCw,
    admin: ['visualizar', 'criar', 'editar'],
    colaborador: ['visualizar'],
  },
  {
    module: 'Playbooks',
    icon: BookOpen,
    admin: ['visualizar', 'criar', 'editar', 'excluir'],
    colaborador: ['visualizar'],
  },
  { module: 'Assistente IA', icon: Bot, admin: ['utilizar'], colaborador: ['utilizar'] },
  { module: 'Configurações', icon: Settings, admin: ['acessar'], colaborador: ['sem acesso'] },
  {
    module: 'Gestão de Usuários',
    icon: UserCog,
    admin: ['visualizar', 'criar', 'editar'],
    colaborador: ['sem acesso'],
  },
]

export function ProfilePermissionsModal({
  open,
  onOpenChange,
  role,
}: ProfilePermissionsModalProps) {
  if (!role) return null
  const roleName = role === 'admin' ? 'Administrador' : 'Colaborador'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle>Permissões – {roleName}</DialogTitle>
          <DialogDescription>
            Permissões concedidas ao perfil de {roleName.toLowerCase()}, organizadas por módulo.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-3">
            {PERMISSIONS.map((entry) => {
              const Icon = entry.icon
              const perms = role === 'admin' ? entry.admin : entry.colaborador
              const hasNoAccess = perms.length === 1 && perms[0] === 'sem acesso'
              return (
                <div
                  key={entry.module}
                  className="flex items-start gap-3 rounded-lg border border-border bg-card p-3 transition-colors hover:bg-muted/30"
                >
                  <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10">
                    <Icon className="text-primary" size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">{entry.module}</p>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {hasNoAccess ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-red-500/10 px-2 py-0.5 text-xs font-medium text-red-600">
                          <X size={12} />
                          Sem acesso
                        </span>
                      ) : (
                        perms.map((perm) => (
                          <span
                            key={perm}
                            className="inline-flex items-center gap-1 rounded-md bg-green-500/10 px-2 py-0.5 text-xs font-medium text-green-600"
                          >
                            <Check size={12} />
                            {perm}
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
