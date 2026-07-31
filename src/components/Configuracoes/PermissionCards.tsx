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
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {items.map(({ role, count }) => {
        const info = ROLE_INFO[role]
        const Icon = info.icon
        return (
          <Card key={role} className={cn('border-l-4 shadow-sm', info.border)}>
            <CardHeader className="flex flex-row items-center gap-3 space-y-0">
              <div className={cn('rounded-full p-2.5', info.bg)}>
                <Icon className={info.iconColor} size={20} />
              </div>
              <div>
                <CardTitle className="text-base font-semibold">{info.title}</CardTitle>
                <p className="text-xs text-muted-foreground">{count} usuário(s)</p>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">{info.description}</p>
              <Button
                variant="outline"
                size="sm"
                className="w-full gap-2"
                onClick={() => onViewPermissions(role)}
              >
                <Eye size={14} />
                Ver Permissões
              </Button>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
