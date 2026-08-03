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

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <InfoCard label="Código Interno" value={client.code} />
        <InfoCard label="Regime Tributário" value={client.tax_regime} />
        <InfoCard label="Situação Cadastral" value={client.situacao_cadastral} />
        <InfoCard
          label="Data de Abertura"
          value={
            client.data_abertura
              ? format(new Date(client.data_abertura), 'dd/MM/yyyy')
              : 'Não informado'
          }
        />
        <InfoCard
          label="Última Atualização"
          value={
            client.updated
              ? format(new Date(client.updated), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
              : 'Não informado'
          }
        />
      </div>

      <Card>
        <CardContent className="p-4">
          <p className="text-xs text-muted-foreground mb-3">Contatos</p>
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 2 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          ) : contacts.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2 text-center">
              Nenhum contato cadastrado.
            </p>
          ) : (
            <div className="space-y-2">
              {contacts.map((c) => (
                <div
                  key={c.id}
                  className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 py-2 border-b border-border last:border-0"
                >
                  <p className="text-sm font-medium text-foreground flex-1">{c.nome || '—'}</p>
                  <p className="text-sm text-muted-foreground flex-1">{c.email || '—'}</p>
                  <p className="text-sm text-muted-foreground flex-1">{c.telefone || '—'}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
