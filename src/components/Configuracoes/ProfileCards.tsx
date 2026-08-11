import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ShieldCheck, UserCog, Eye, Pencil, SlidersHorizontal, Building2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { AccessProfileRecord } from '@/services/access-profiles'

interface ProfileCardsProps {
  profiles: AccessProfileRecord[]
  onViewPermissions: (role: 'admin' | 'colaborador') => void
  onEditProfile: (profile: AccessProfileRecord) => void
  onConfigPermissions: (profile: AccessProfileRecord) => void
}

const SYSTEM_ICONS: Record<
  string,
  { icon: typeof ShieldCheck; iconColor: string; bg: string; border: string }
> = {
  Administrador: {
    icon: ShieldCheck,
    iconColor: 'text-amber-600',
    bg: 'bg-amber-500/10',
    border: 'border-t-amber-500',
  },
  Colaborador: {
    icon: UserCog,
    iconColor: 'text-blue-600',
    bg: 'bg-blue-500/10',
    border: 'border-t-blue-500',
  },
  Cliente: {
    icon: Building2,
    iconColor: 'text-green-600',
    bg: 'bg-green-500/10',
    border: 'border-t-green-500',
  },
}

const DEFAULT_STYLE = {
  icon: ShieldCheck,
  iconColor: 'text-primary',
  bg: 'bg-primary/10',
  border: 'border-t-primary',
}

export function ProfileCards({
  profiles,
  onViewPermissions,
  onEditProfile,
  onConfigPermissions,
}: ProfileCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {profiles.map((profile) => {
        const style = SYSTEM_ICONS[profile.name] ?? DEFAULT_STYLE
        const Icon = style.icon
        const isActive = profile.status === 'active'
        const canViewPermissions =
          profile.name === 'Administrador' || profile.name === 'Colaborador'

        return (
          <Card
            key={profile.id}
            className={cn(
              'border-t-4 shadow-sm transition-all duration-300 hover:shadow-lg hover:scale-[1.02]',
              style.border,
            )}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <div className={cn('rounded-full p-2', style.bg)}>
                    <Icon size={18} className={style.iconColor} />
                  </div>
                  {profile.name}
                </CardTitle>
                <Badge
                  className={cn(
                    isActive
                      ? 'bg-green-500/15 text-green-700 border border-green-500/30'
                      : 'bg-gray-500/15 text-gray-600 border border-gray-500/30',
                  )}
                >
                  {isActive ? 'Ativo' : 'Inativo'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {profile.description && (
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {profile.description}
                </p>
              )}
              <div className="flex flex-wrap gap-2">
                {canViewPermissions && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() =>
                      onViewPermissions(profile.name === 'Administrador' ? 'admin' : 'colaborador')
                    }
                  >
                    <Eye size={14} />
                    Visualizar permissões
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => onConfigPermissions(profile)}
                >
                  <SlidersHorizontal size={14} />
                  Configurar permissões
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => onEditProfile(profile)}
                >
                  <Pencil size={14} />
                  Editar
                </Button>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
