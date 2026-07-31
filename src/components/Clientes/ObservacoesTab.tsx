import { useState, useEffect } from 'react'
import { Client, updateClient } from '@/services/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/hooks/use-auth'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface Props {
  client: Client
  canEdit: boolean
  onSuccess: () => void
}

export function ObservacoesTab({ client, canEdit, onSuccess }: Props) {
  const { user } = useAuth()
  const [text, setText] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setText(client.observacoes_internas || '')
  }, [client])

  const handleSave = async () => {
    setSaving(true)
    try {
      await updateClient(client.id, {
        observacoes_internas: text,
        observacoes_atualizado_em: new Date().toISOString(),
        observacoes_atualizado_por: user?.id || null,
      })
      toast.success('Observações salvas com sucesso')
      onSuccess()
    } catch {
      toast.error('Erro ao salvar observações')
    } finally {
      setSaving(false)
    }
  }

  const updatedBy = client.expand?.observacoes_atualizado_por?.name
  const updatedAt = client.observacoes_atualizado_em
    ? format(new Date(client.observacoes_atualizado_em), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
    : null

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Observações Internas</CardTitle>
          {canEdit && (
            <Button
              size="sm"
              onClick={handleSave}
              disabled={saving}
              className="bg-primary hover:bg-primary/90"
            >
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {canEdit ? (
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Digite observações internas sobre este cliente..."
            rows={8}
          />
        ) : (
          <div className="min-h-[200px] rounded-md border border-border p-3 text-sm text-foreground whitespace-pre-wrap">
            {text || 'Nenhuma observação registrada.'}
          </div>
        )}
        {updatedAt && (
          <p className="text-xs text-muted-foreground">
            Última atualização: {updatedAt}
            {updatedBy ? ` por ${updatedBy}` : ''}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
