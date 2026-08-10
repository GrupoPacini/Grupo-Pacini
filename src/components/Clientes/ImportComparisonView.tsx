import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { ArrowLeft, CheckCircle2, RefreshCw } from 'lucide-react'
import type { ProcessedRow } from '@/services/clients-bulk-import'

interface Props {
  rows: ProcessedRow[]
  newCount: number
  onBack: () => void
  onConfirm: (decisions: Record<number, boolean>) => void
}

function formatFieldValue(key: string, value: string): string {
  if (value === '—' || !value) return value
  if (key === 'cnpj') {
    const digits = value.replace(/\D/g, '')
    if (digits.length === 14) {
      return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
    }
  }
  if (key === 'data_abertura' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value.replace(/(\d{4})-(\d{2})-(\d{2})/, '$3/$2/$1')
  }
  return value
}

export function ImportComparisonView({ rows, newCount, onBack, onConfirm }: Props) {
  const [decisions, setDecisions] = useState<Record<number, boolean>>({})

  const existingRows = rows.filter((r) => r.status === 'existing')
  const updateCount = existingRows.filter((r) => decisions[r.rowIndex]).length

  const toggleAll = (value: boolean) => {
    const next: Record<number, boolean> = {}
    existingRows.forEach((r) => {
      next[r.rowIndex] = value
    })
    setDecisions(next)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          {existingRows.length} cliente(s) existente(s) encontrado(s). Selecione quais deseja
          atualizar.
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => toggleAll(true)}>
            Selecionar todos
          </Button>
          <Button variant="outline" size="sm" onClick={() => toggleAll(false)}>
            Desmarcar todos
          </Button>
        </div>
      </div>

      <div className="max-h-[400px] overflow-y-auto space-y-3">
        {existingRows.map((row) => {
          const changedFields = row.comparison?.filter((f) => f.changed) ?? []
          const isUpdate = decisions[row.rowIndex] === true

          return (
            <Card
              key={row.rowIndex}
              className={`p-4 border-2 transition-colors ${
                isUpdate ? 'border-primary' : 'border-border'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="min-w-0">
                  <p className="font-medium truncate">{row.mapped.razao_social || '—'}</p>
                  <p className="text-xs text-muted-foreground font-mono">
                    CNPJ: {formatFieldValue('cnpj', row.mapped.cnpj)}
                    {row.mapped.code && ` • Código: ${row.mapped.code}`}
                  </p>
                </div>
                <Badge
                  variant={changedFields.length > 0 ? 'default' : 'secondary'}
                  className="shrink-0"
                >
                  {changedFields.length > 0
                    ? `${changedFields.length} alteração(ões)`
                    : 'Sem alterações'}
                </Badge>
              </div>

              <RadioGroup
                value={isUpdate ? 'update' : 'keep'}
                onValueChange={(v) =>
                  setDecisions((prev) => ({ ...prev, [row.rowIndex]: v === 'update' }))
                }
                className="mb-3"
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="keep" id={`keep-${row.rowIndex}`} />
                    <Label htmlFor={`keep-${row.rowIndex}`} className="text-sm cursor-pointer">
                      Manter dados atuais
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="update" id={`update-${row.rowIndex}`} />
                    <Label htmlFor={`update-${row.rowIndex}`} className="text-sm cursor-pointer">
                      Atualizar cliente
                    </Label>
                  </div>
                </div>
              </RadioGroup>

              {row.comparison && row.comparison.length > 0 && (
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left p-2 font-medium">Campo</th>
                        <th className="text-left p-2 font-medium">Valor atual</th>
                        <th className="text-left p-2 font-medium">Novo valor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {row.comparison.map((field) => (
                        <tr
                          key={field.key}
                          className={`border-t ${
                            field.changed ? 'bg-amber-50 dark:bg-amber-950/20' : ''
                          }`}
                        >
                          <td className="p-2 font-medium">{field.label}</td>
                          <td className="p-2 text-muted-foreground">
                            {field.changed ? (
                              <span className="line-through">
                                {formatFieldValue(field.key, field.currentValue)}
                              </span>
                            ) : (
                              formatFieldValue(field.key, field.currentValue)
                            )}
                          </td>
                          <td className="p-2">
                            {field.changed ? (
                              <span className="text-green-600 font-medium">
                                {formatFieldValue(field.key, field.newValue)}
                              </span>
                            ) : (
                              formatFieldValue(field.key, field.newValue)
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          )
        })}
      </div>

      <div className="flex justify-between gap-2">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
        </Button>
        <Button onClick={() => onConfirm(decisions)} className="gap-2">
          <CheckCircle2 className="h-4 w-4" />
          {newCount > 0
            ? `Importar ${newCount} novo(s) e atualizar ${updateCount} existente(s)`
            : `Confirmar atualização de ${updateCount} cliente(s)`}
        </Button>
      </div>
    </div>
  )
}
