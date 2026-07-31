import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { getClientEvents, ClientEvent } from '@/services/client-events'
import { useRealtime } from '@/hooks/use-realtime'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { History } from 'lucide-react'

interface Props {
  clientId: string
}

export function RecentHistoryCard({ clientId }: Props) {
  const [events, setEvents] = useState<ClientEvent[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const data = await getClientEvents(clientId)
      setEvents(data.slice(0, 15))
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History size={18} className="text-muted-foreground" /> Histórico Recente
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-6 w-full" />
            ))}
          </div>
        ) : events.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            Nenhuma movimentação recente.
          </p>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {events.map((evt) => (
              <div
                key={evt.id}
                className="flex items-start gap-2 py-1.5 border-b border-border last:border-0"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground">{evt.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(evt.created), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    {evt.expand?.user?.name ? ` • ${evt.expand.user.name}` : ''}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
