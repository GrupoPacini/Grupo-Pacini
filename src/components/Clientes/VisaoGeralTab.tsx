import { useState, useEffect, useCallback } from 'react'
import { Client } from '@/services/api'
import { getClientContacts, type ClientContact } from '@/services/client-contacts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { useRealtime } from '@/hooks/use-realtime'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Building2, MapPin, Calendar, Phone, Mail, Globe, FileText, User } from 'lucide-react'

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

function ContactRow({ contact }: { contact: ClientContact }) {
  return (
    <div className="flex items-start justify-between py-2 border-b border-border last:border-0">
      <div className="space-y-0.5">
        <p className="text-sm font-medium text-foreground">{contact.nome || 'Sem nome'}</p>
        {contact.email && (
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Mail className="h-3 w-3" /> {contact.email}
          </p>
        )}
        {contact.telefone && (
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Phone className="h-3 w-3" /> {contact.telefone}
          </p>
        )}
      </div>
    </div>
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

  const dataAbertura = client.data_abertura
    ? format(new Date(client.data_abertura), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
    : ''

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <InfoCard label="CNPJ" value={client.cnpj || ''} />
        <InfoCard label="Razão Social" value={client.razao_social || client.name || ''} />
        <InfoCard label="Nome Fantasia" value={client.nome_fantasia || ''} />
        <InfoCard label="Regime Tributário" value={client.tax_regime || ''} />
        <InfoCard label="Situação Cadastral" value={client.situacao_cadastral || ''} />
        <InfoCard label="Porte" value={client.porte || ''} />
        <InfoCard label="Natureza Jurídica" value={client.natureza_juridica || ''} />
        <InfoCard label="Município" value={client.municipio || ''} />
        <InfoCard label="Estado" value={client.estado || ''} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              Dados da Empresa
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground">Endereço:</span>
              <span className="font-medium text-foreground">
                {client.logradouro
                  ? `${client.logradouro}, ${client.numero || 'S/N'}`
                  : 'Não informado'}
                {client.bairro ? ` - ${client.bairro}` : ''}
                {client.cep ? ` - CEP: ${client.cep}` : ''}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground">Data de Abertura:</span>
              <span className="font-medium text-foreground">{dataAbertura || 'Não informado'}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground">CNAE Principal:</span>
              <span className="font-medium text-foreground">
                {client.cnae_principal || 'Não informado'}
              </span>
            </div>
            {client.objeto_social && (
              <div className="flex items-start gap-2 text-sm">
                <FileText className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                <span className="text-muted-foreground">Objeto Social:</span>
                <span className="font-medium text-foreground">{client.objeto_social}</span>
              </div>
            )}
            {client.site && (
              <div className="flex items-center gap-2 text-sm">
                <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground">Site:</span>
                <a
                  href={client.site}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-primary hover:underline"
                >
                  {client.site}
                </a>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              Contatos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : contacts.length > 0 ? (
              <div className="space-y-1">
                {contacts.map((contact) => (
                  <ContactRow key={contact.id} contact={contact} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhum contato cadastrado.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {(client.email_principal || client.telefone || client.celular || client.whatsapp) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              Contatos da Empresa
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {client.email_principal && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">E-mail Principal</p>
                    <p className="font-medium text-foreground">{client.email_principal}</p>
                  </div>
                </div>
              )}
              {client.telefone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Telefone</p>
                    <p className="font-medium text-foreground">{client.telefone}</p>
                  </div>
                </div>
              )}
              {client.celular && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Celular</p>
                    <p className="font-medium text-foreground">{client.celular}</p>
                  </div>
                </div>
              )}
              {client.whatsapp && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">WhatsApp</p>
                    <p className="font-medium text-foreground">{client.whatsapp}</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {client.onboarding_status && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Status de Onboarding:</span>
          <Badge variant="secondary">{client.onboarding_status}</Badge>
        </div>
      )}
    </div>
  )
}
