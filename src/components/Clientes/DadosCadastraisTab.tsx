import { useState, useEffect, useCallback } from 'react'
import { Client } from '@/services/api'
import { getClientContacts, type ClientContact } from '@/services/client-contacts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useRealtime } from '@/hooks/use-realtime'
import { formatCnpj } from '@/lib/client-utils'

interface Props {
  client: Client
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
            <Field label="Razão Social" value={client.razao_social} />
            <Field label="Nome Fantasia" value={client.nome_fantasia} />
            <Field label="CNPJ" value={client.cnpj ? formatCnpj(client.cnpj) : ''} />
            <Field label="Regime Tributário" value={client.tax_regime} />
            <Field label="CNAE Principal" value={client.cnae_principal} />
            <Field label="Inscrição Estadual" value={client.inscricao_estadual} />
            <Field label="Inscrição Municipal" value={client.inscricao_municipal} />
            <Field label="CCM" value={client.ccm} />
            <Field label="Natureza Jurídica" value={client.natureza_juridica} />
            <Field label="Porte" value={client.porte} />
            <Field label="Data de Abertura" value={client.data_abertura || ''} />
            <Field label="Situação Cadastral" value={client.situacao_cadastral} />
            <Field label="Telefone" value={client.telefone} />
            <Field label="Celular" value={client.celular} />
            <Field label="E-mail Principal" value={client.email_principal} />
            <Field label="Site" value={client.site} />
            <Field label="Observações Internas" value={client.observacoes_internas} />
            <Field label="Client Status" value={client.client_status} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Endereço</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Field label="CEP" value={client.cep} />
            <Field label="Logradouro" value={client.logradouro} />
            <Field label="Número" value={client.numero} />
            <Field label="Complemento" value={client.complemento} />
            <Field label="Bairro" value={client.bairro} />
            <Field label="Município" value={client.municipio} />
            <Field label="Estado" value={client.estado} />
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
