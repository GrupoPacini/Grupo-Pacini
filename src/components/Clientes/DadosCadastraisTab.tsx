import { useState, useEffect, useCallback } from 'react'
import { getClientContacts, type ClientContact } from '@/services/client-contacts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useRealtime } from '@/hooks/use-realtime'
import { formatCnpj, type ClientRecord } from '@/lib/client-utils'

interface Props {
  client: ClientRecord
}

function Field({ label, value }: { label: string; value?: string }) {
  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium text-foreground">{value || '—'}</p>
    </div>
  )
}

export function DadosCadastraisTab({ client }: Props) {
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
      <Card>
        <CardHeader>
          <CardTitle>Empresa</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Field label="Código Interno" value={client.code as string} />
            <Field label="Razão Social" value={client.razao_social as string} />
            <Field label="Nome Fantasia" value={client.nome_fantasia as string} />
            <Field label="CNPJ" value={client.cnpj ? formatCnpj(client.cnpj) : ''} />
            <Field label="Regime Tributário" value={client.tax_regime as string} />
            <Field label="Inscrição Estadual" value={client.inscricao_estadual as string} />
            <Field label="Inscrição Municipal" value={client.inscricao_municipal as string} />
            <Field label="Natureza Jurídica" value={client.natureza_juridica as string} />
            <Field label="Porte" value={client.porte as string} />
            <Field label="Data de Abertura" value={client.data_abertura as string} />
            <Field label="Situação Cadastral" value={client.situacao_cadastral as string} />
            <Field label="Status do Cliente" value={client.client_status as string} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Endereço</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Field label="CEP" value={client.cep as string} />
            <Field label="Logradouro" value={client.logradouro as string} />
            <Field label="Número" value={client.numero as string} />
            <Field label="Complemento" value={client.complemento as string} />
            <Field label="Bairro" value={client.bairro as string} />
            <Field label="Município" value={client.municipio as string} />
            <Field label="Estado" value={client.estado as string} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contato</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 2 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : contacts.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              Nenhum contato cadastrado.
            </p>
          ) : (
            <div className="space-y-3">
              {contacts.map((c) => (
                <div
                  key={c.id}
                  className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-3 border-b border-border last:border-0 last:pb-0"
                >
                  <Field label="Nome do Contato" value={c.nome} />
                  <Field label="E-mail" value={c.email} />
                  <Field label="Telefone" value={c.telefone} />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
