import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ShieldCheck, UserCog, Eye } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PermissionCardsProps {
  adminCount: number
  colaboradorCount: number
  onViewPermissions: (role: 'admin' | 'colaborador') => void
}

const ROLE_INFO = {
  admin: {
    title: 'Administrador',
    icon: ShieldCheck,
    iconColor: 'text-amber-600',
    bg: 'bg-amber-500/10',
    border: 'border-l-amber-500',
    description:
      'Criar, editar e excluir clientes, criar e alterar processos, alterar licenças, gerenciar usuários',
  },
  colaborador: {
    title: 'Colaborador',
    icon: UserCog,
    iconColor: 'text-blue-600',
    bg: 'bg-blue-500/10',
    border: 'border-l-blue-500',
    description: 'Visualizar dados, sem permissão para criar, editar ou excluir registros',
  },
} as const

export function PermissionCards({
  adminCount,
  colaboradorCount,
  onViewPermissions,
}: PermissionCardsProps) {
  const items: Array<{
    role: 'admin' | 'colaborador'
    count: number
  }> = [
    { role: 'admin', count: adminCount },
    { role: 'colaborador', count: colaboradorCount },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {items.map(({ role, count }) => {
        const info = ROLE_INFO[role]
        const Icon = info.icon
        return (
          <Card
            key={role}
            className={cn(
              'border-l-4 shadow-sm transition-all duration-200 hover:shadow-md',
              info.border,
            )}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <div className={cn('rounded-full p-2', info.bg)}>
                    <Icon size={18} className={info.iconColor} />
                  </div>
                  {info.title}
                </CardTitle>
                <span className="text-2xl font-bold text-foreground">{count}</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground leading-relaxed">{info.description}</p>
              <Button
                variant="outline"
                size="sm"
                className="gap-2 w-full sm:w-auto"
                onClick={() => onViewPermissions(role)}
              >
                <Eye size={14} />
                Visualizar permissões
              </Button>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
