import { Client } from '@/services/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { formatCnpj } from '@/lib/client-utils'

interface Props {
  client: Client
}

function Field({ label, value }: { label: string; value?: string }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <p className="text-sm font-medium text-foreground">{value || 'Não informado'}</p>
    </div>
  )
}

export function DadosCadastraisTab({ client }: Props) {
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
            <Field label="Natureza Jurídica" value={client.natureza_juridica} />
            <Field label="Porte" value={client.porte} />
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
            <Field label="Cidade" value={client.municipio} />
            <Field label="Estado" value={client.estado} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contato</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Field label="Telefone" value={client.telefone} />
            <Field label="Celular" value={client.celular} />
            <Field label="WhatsApp" value={client.whatsapp} />
            <Field label="E-mail" value={client.email_principal} />
            <Field label="Site" value={client.site} />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
