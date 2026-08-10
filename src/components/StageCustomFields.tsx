import { useState, useEffect, useCallback } from 'react'
import {
  ProcessStageCustomField,
  getCustomFieldsByStage,
  updateCustomField,
  deleteCustomField,
} from '@/services/process-stage-custom-fields'
import { useRealtime } from '@/hooks/use-realtime'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { ChevronRight, ChevronDown, ChevronUp, Plus, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { CustomFieldFormDialog } from './CustomFieldFormDialog'

interface StageCustomFieldsProps {
  stageId: string
  canEdit: boolean
}

function FieldValueInput({
  field,
  canEdit,
  onSave,
}: {
  field: ProcessStageCustomField
  canEdit: boolean
  onSave: (value: string) => Promise<void>
}) {
  const [localValue, setLocalValue] = useState(field.value || '')

  useEffect(() => {
    setLocalValue(field.value || '')
  }, [field.value])

  const saveOnBlur = () => {
    if (localValue !== (field.value || '')) {
      onSave(localValue)
    }
  }

  const saveOnChange = (v: string) => {
    setLocalValue(v)
    onSave(v)
  }

  switch (field.field_type) {
    case 'numero':
      return (
        <Input
          type="number"
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          onBlur={saveOnBlur}
          disabled={!canEdit}
          className="h-8 text-sm"
        />
      )
    case 'data':
      return (
        <Input
          type="date"
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          onBlur={saveOnBlur}
          disabled={!canEdit}
          className="h-8 text-sm"
        />
      )
    case 'sim_nao':
      return (
        <Switch
          checked={localValue === 'Sim'}
          onCheckedChange={(checked) => saveOnChange(checked ? 'Sim' : 'Não')}
          disabled={!canEdit}
        />
      )
    case 'lista_opcoes':
      return (
        <Select value={localValue} onValueChange={saveOnChange} disabled={!canEdit}>
          <SelectTrigger className="h-8 text-sm">
            <SelectValue placeholder="Selecione..." />
          </SelectTrigger>
          <SelectContent>
            {(field.options || []).map((opt, i) => (
              <SelectItem key={i} value={opt}>
                {opt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )
    case 'observacao_longa':
      return (
        <Textarea
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          onBlur={saveOnBlur}
          disabled={!canEdit}
          className="text-sm min-h-[60px]"
        />
      )
    default:
      return (
        <Input
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          onBlur={saveOnBlur}
          disabled={!canEdit}
          className="h-8 text-sm"
        />
      )
  }
}

export function StageCustomFields({ stageId, canEdit }: StageCustomFieldsProps) {
  const [fields, setFields] = useState<ProcessStageCustomField[]>([])
  const [expanded, setExpanded] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingField, setEditingField] = useState<ProcessStageCustomField | null>(null)

  const loadFields = useCallback(async () => {
    try {
      setFields(await getCustomFieldsByStage(stageId))
    } catch {
      /* ignored */
    }
  }, [stageId])

  useEffect(() => {
    loadFields()
  }, [loadFields])

  useRealtime('process_stage_custom_fields', (e) => {
    if (e.record['stage'] === stageId) loadFields()
  })

  const handleDelete = async (id: string) => {
    try {
      await deleteCustomField(id)
      toast.success('Campo excluído')
    } catch {
      toast.error('Erro ao excluir campo')
    }
  }

  const handleReorder = async (index: number, direction: 'up' | 'down') => {
    const swapIndex = direction === 'up' ? index - 1 : index + 1
    if (swapIndex < 0 || swapIndex >= fields.length) return
    const a = fields[index]
    const b = fields[swapIndex]
    try {
      await Promise.all([
        updateCustomField(a.id, { order: b.order }),
        updateCustomField(b.id, { order: a.order }),
      ])
    } catch {
      toast.error('Erro ao reordenar')
    }
  }

  const handleValueSave = async (id: string, value: string) => {
    try {
      await updateCustomField(id, { value })
    } catch {
      toast.error('Erro ao atualizar valor')
    }
  }

  const nextOrder = fields.length > 0 ? Math.max(...fields.map((f) => f.order || 0)) + 1 : 0

  return (
    <div className="ml-6 mt-2">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        <span>
          {fields.length} {fields.length === 1 ? 'campo personalizado' : 'campos personalizados'}
        </span>
      </button>
      {expanded && (
        <div className="mt-2 space-y-2 border-l-2 border-muted pl-3">
          {fields.map((field, index) => (
            <div key={field.id} className="flex items-start gap-1.5 group/cf">
              {canEdit && (
                <div className="flex flex-col shrink-0 mt-1">
                  <button
                    onClick={() => handleReorder(index, 'up')}
                    disabled={index === 0}
                    className="text-muted-foreground hover:text-foreground disabled:opacity-20 leading-none"
                  >
                    <ChevronUp size={9} />
                  </button>
                  <button
                    onClick={() => handleReorder(index, 'down')}
                    disabled={index === fields.length - 1}
                    className="text-muted-foreground hover:text-foreground disabled:opacity-20 leading-none"
                  >
                    <ChevronDown size={9} />
                  </button>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <label className="text-xs text-muted-foreground block mb-0.5">{field.label}</label>
                <FieldValueInput
                  field={field}
                  canEdit={canEdit}
                  onSave={(value) => handleValueSave(field.id, value)}
                />
              </div>
              {canEdit && (
                <div className="flex items-center gap-0.5 opacity-0 group-hover/cf:opacity-100 transition-opacity shrink-0 mt-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5"
                    onClick={() => {
                      setEditingField(field)
                      setDialogOpen(true)
                    }}
                  >
                    <Pencil size={10} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 text-muted-foreground hover:text-red-600"
                    onClick={() => handleDelete(field.id)}
                  >
                    <Trash2 size={10} />
                  </Button>
                </div>
              )}
            </div>
          ))}
          {fields.length === 0 && (
            <p className="text-xs text-muted-foreground/50 py-1">Nenhum campo personalizado</p>
          )}
          {canEdit && (
            <Button
              variant="ghost"
              size="sm"
              className="text-[11px] gap-1 text-muted-foreground h-6"
              onClick={() => {
                setEditingField(null)
                setDialogOpen(true)
              }}
            >
              <Plus size={11} /> Adicionar campo
            </Button>
          )}
        </div>
      )}
      <CustomFieldFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        stageId={stageId}
        editingField={editingField}
        nextOrder={nextOrder}
        onSuccess={loadFields}
      />
    </div>
  )
}
