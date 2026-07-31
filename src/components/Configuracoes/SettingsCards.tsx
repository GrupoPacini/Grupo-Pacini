import { Link } from 'react-router-dom'
import {
  UserCog,
  KeyRound,
  ScrollText,
  Plug,
  SlidersHorizontal,
  Lock,
  ArrowRight,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'

interface SettingsCardItem {
  title: string
  description: string
  icon: LucideIcon
  href?: string
  soon?: boolean
}

const adminCards: SettingsCardItem[] = [
  {
    title: 'Gestão de Usuários',
    description: 'Cadastre usuários, altere perfis, status e permissões de acesso.',
    icon: UserCog,
    href: '/configuracoes/usuarios',
  },
  {
    title: 'Perfis de Acesso',
    description: 'Configure perfis detalhados e permissões granulares por módulo.',
    icon: KeyRound,
    href: '/configuracoes/perfis',
  },
]

const placeholderCards: SettingsCardItem[] = [
  {
    title: 'Auditoria',
    description: 'Acompanhe logs de alterações e atividades dos usuários no sistema.',
    icon: ScrollText,
    soon: true,
  },
  {
    title: 'Integrações',
    description: 'Gerencie integrações com serviços externos e APIs de terceiros.',
    icon: Plug,
    soon: true,
  },
  {
    title: 'Preferências do Sistema',
    description: 'Personalize notificações, aparência e comportamentos do portal.',
    icon: SlidersHorizontal,
    soon: true,
  },
  {
    title: 'Segurança',
    description: 'Defina políticas de senhas, autenticação em dois fatores e sessões.',
    icon: Lock,
    soon: true,
  },
]

interface SettingsCardsProps {
  isAdmin: boolean
}

export function SettingsCards({ isAdmin }: SettingsCardsProps) {
  const cards: SettingsCardItem[] = [...(isAdmin ? adminCards : []), ...placeholderCards]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {cards.map((card) => {
        const Icon = card.icon
        const isClickable = !!card.href && !card.soon

        if (isClickable) {
          return (
            <Link key={card.title} to={card.href!} className="group block">
              <Card
                className={cn(
                  'h-full border-t-4 border-t-primary shadow-sm transition-all duration-300',
                  'hover:shadow-lg hover:scale-[1.03] cursor-pointer',
                )}
              >
                <CardContent className="p-6 flex flex-col h-full">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Icon className="text-primary" size={24} />
                    </div>
                    <Badge className="bg-accent/20 text-accent border border-accent/30">
                      Ativo
                    </Badge>
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-1">{card.title}</h3>
                  <p className="text-sm text-muted-foreground flex-1">{card.description}</p>
                  <div className="mt-4 flex items-center gap-1.5 text-primary font-medium text-sm group-hover:gap-2.5 transition-all">
                    <span>Acessar</span>
                    <ArrowRight size={16} />
                  </div>
                </CardContent>
              </Card>
            </Link>
          )
        }

        return (
          <Card
            key={card.title}
            className={cn('h-full border-t-4 border-t-muted shadow-sm opacity-60')}
          >
            <CardContent className="p-6 flex flex-col h-full">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                  <Icon className="text-muted-foreground" size={24} />
                </div>
                <Badge variant="secondary" className="bg-muted text-muted-foreground">
                  Em breve
                </Badge>
              </div>
              <h3 className="text-lg font-semibold text-muted-foreground mb-1">{card.title}</h3>
              <p className="text-sm text-muted-foreground/70 flex-1">{card.description}</p>
              <div className="mt-4 h-5" />
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
