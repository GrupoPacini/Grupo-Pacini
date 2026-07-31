import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { getClientEvents, ClientEvent } from '@/services/client-events'
import { useRealtime } from '@/hooks/use-realtime'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  Building2,
  RefreshCw,
  FileText,
  CheckCircle2,
  ShieldCheck,
  AlertCircle,
  UserPlus,
  UserMinus,
  Tag,
  UserCheck,
  UserX,
  ArrowRightLeft,
  CircleDot,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface Props {
  clientId: string
}

const EVENT_CONFIG: Record<string, { icon: LucideIcon; color: string }> = {
  client_created: { icon: Building2, color: 'text-blue-600 bg-blue-500/10' },
  client_updated: { icon: RefreshCw, color: 'text-gray-600 bg-gray-500/10' },
  status_change: { icon: ArrowRightLeft, color: 'text-purple-600 bg-purple-500/10' },
  regime_change: { icon: ArrowRightLeft, color: 'text-purple-600 bg-purple-500/10' },
  process_created: { icon: FileText, color: 'text-blue-600 bg-blue-500/10' },
  process_updated: { icon: FileText, color: 'text-blue-600 bg-blue-500/10' },
  process_completed: { icon: CheckCircle2, color: 'text-green-600 bg-green-500/10' },
  process_status_change: { icon: FileText, color: 'text-blue-600 bg-blue-500/10' },
  license_created: { icon: ShieldCheck, color: 'text-green-600 bg-green-500/10' },
  license_updated: { icon: ShieldCheck, color: 'text-green-600 bg-green-500/10' },
  license_renewed: { icon: RefreshCw, color: 'text-blue-600 bg-blue-500/10' },
  license_expired: { icon: AlertCircle, color: 'text-red-600 bg-red-500/10' },
  socio_created: { icon: UserPlus, color: 'text-cyan-600 bg-cyan-500/10' },
  socio_updated: { icon: UserPlus, color: 'text-cyan-600 bg-cyan-500/10' },
  socio_deleted: { icon: UserMinus, color: 'text-red-600 bg-red-500/10' },
  cnae_created: { icon: Tag, color: 'text-indigo-600 bg-indigo-500/10' },
  cnae_updated: { icon: Tag, color: 'text-indigo-600 bg-indigo-500/10' },
  cnae_deleted: { icon: Tag, color: 'text-red-600 bg-red-500/10' },
  responsible_added: { icon: UserCheck, color: 'text-teal-600 bg-teal-500/10' },
  responsible_removed: { icon: UserX, color: 'text-red-600 bg-red-500/10' },
}

export function TimelineTab({ clientId }: Props) {
  const [events, setEvents] = useState<ClientEvent[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      setEvents(await getClientEvents(clientId))
    } catch {
      setEvents([])
    } finally {
      setLoading(false)
    }
  }, [clientId])

  useEffect(() => {
    load()
  }, [load])
  useRealtime('client_events', () => load())

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    )
  }

  if (events.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          Nenhum evento registrado ainda.
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="relative space-y-1">
      <div className="absolute left-5 top-0 bottom-0 w-px bg-border" />
      {events.map((evt) => {
        const config = EVENT_CONFIG[evt.event_type] || {
          icon: CircleDot,
          color: 'text-gray-600 bg-gray-500/10',
        }
        const Icon = config.icon
        return (
          <div key={evt.id} className="relative flex items-start gap-4 py-3">
            <div className={`relative z-10 rounded-full p-2 ${config.color}`}>
              <Icon size={16} />
            </div>
            <div className="flex-1 min-w-0 pb-2">
              <p className="text-sm font-medium text-foreground">{evt.description}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {format(new Date(evt.created), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                {evt.expand?.user?.name ? ` • ${evt.expand.user.name}` : ''}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
