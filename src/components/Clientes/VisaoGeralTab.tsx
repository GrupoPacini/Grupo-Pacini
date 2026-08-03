import { useState, useEffect, useCallback } from 'react'
import { Client } from '@/services/api'
import { getClientContacts, type ClientContact } from '@/services/client-contacts'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useRealtime } from '@/hooks/use-realtime'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface Props {
  client: Client
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground mb-1">{label}</p>
        <p className="text-sm font-medium text-foreground">{value || 'Não informado'}</p>
      </CardContent>
    </Card>
  )
}

export function VisaoGeralTab({ client }: Props) {
  const [contacts, setContacts] = useState<ClientContact[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      setContacts(await getClientContacts(client.id))
    } catch {
      /* silent */
    } finally {
      setLoading(false)
    }
  }, [client.id])

  useEffect(() => {
    load()
  }, [load])

  useRealtime('client_contacts', () => load())

  return
  null
}
