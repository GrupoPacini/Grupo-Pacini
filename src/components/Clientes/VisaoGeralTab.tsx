import { useState } from 'react'
import { Client } from '@/services/api'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Copy, Check } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { toast } from 'sonner'

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
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    if (!client.codigo_acesso) return
    navigator.clipboard.writeText(client.codigo_acesso)
    setCopied(true)
    toast.success('Código de acesso copiado')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <InfoCard label="Código Interno" value={client.code} />
      <Card>
        <CardContent className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Código de Acesso</p>
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium text-foreground">
              {client.codigo_acesso || 'Não informado'}
            </p>
            {client.codigo_acesso && (
              <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={handleCopy}>
                {copied ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
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
  )
}
