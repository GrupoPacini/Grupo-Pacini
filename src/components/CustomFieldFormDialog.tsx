import { useState, useEffect } from 'react'
import {
  ProcessStageCustomField,
  createCustomField,
  updateCustomField,
} from '@/services/process-stage-custom-fields'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { extractFieldErrors, type FieldErrors } from '@/lib/pocketbase/errors'

const FIELD_TYPES = [
  { value: 'texto', label: 'Texto' },
  { value: 'numero', label: 'Número' },
  { value: 'data', label: 'Data' },
  { value: 'sim_nao', label: 'Sim/Não' },
  { value: 'lista_opcoes', label: 'Lista de opções' },
  { value: 'observacao_longa', label: 'Observação longa' },
]

interface CustomFieldFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  stageId: string
  editingField: ProcessStageCustomField | null
  nextOrder: number
  onSuccess: () => void
}

export function CustomFieldFormDialog({
  open,
  onOpenChange,
  stageId,
  editingField,
  nextOrder,
  onSuccess,
}: CustomFieldFormDialogProps) {
  const [label, setLabel] = useState('')
  const [fieldType, setFieldType] = useState('texto')
  const [options, setOptions] = useState<string[]>([])
  const [newOption, setNewOption] = useState('')
  const [errors, setErrors] = useState<FieldErrors>({})

  useEffect(() => {
    if (open) {
      setLabel(editingField?.label || '')
      setFieldType(editingField?.field_type || 'texto')
      setOptions(editingField?.options || [])
      setNewOption('')
      setErrors({})
    }
  }, [open, editingField])

  const handleAddOption = () => {
    if (!newOption.trim()) return
    setOptions([...options, newOption.trim()])
    setNewOption('')
  }

  const handleRemoveOption = (index: number) => {
    setOptions(options.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    if (!label.trim()) {
      setErrors({ label: 'Nome é obrigatório' })
      return
    }
    try {
      const data: Record<string, unknown> = {
        label: label.trim(),
        field_type: fieldType,
      }
      if (fieldType === 'lista_opcoes') {
        data.options = options
      }
      if (editingField) {
        await updateCustomField(editingField.id, data)
        toast.success('Campo atualizado')
      } else {
        await createCustomField({ stage: stageId, order: nextOrder, ...data } as Parameters<
          typeof createCustomField
        >[0])
        toast.success('Campo criado')
      }
      onOpenChange(false)
      onSuccess()
    } catch (err) {
      setErrors(extractFieldErrors(err))
      toast.error('Erro ao salvar campo')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editingField ? 'Editar Campo' : 'Novo Campo Personalizado'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="cf-label">Nome do campo</Label>
            <Input
              id="cf-label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Ex: Número do Protocolo"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleSubmit()
                }
              }}
            />
            {errors.label && <p className="text-xs text-red-500">{errors.label}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Tipo</Label>
            <Select value={fieldType} onValueChange={setFieldType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FIELD_TYPES.map((ft) => (
                  <SelectItem key={ft.value} value={ft.value}>
                    {ft.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {fieldType === 'lista_opcoes' && (
            <div className="space-y-2">
              <Label>Opções</Label>
              {options.map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input value={opt} readOnly className="h-8 text-sm" />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-red-600"
                    onClick={() => handleRemoveOption(i)}
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              ))}
              <div className="flex items-center gap-2">
                <Input
                  value={newOption}
                  onChange={(e) => setNewOption(e.target.value)}
                  placeholder="Nova opção"
                  className="h-8 text-sm"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleAddOption()
                    }
                  }}
                />
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={handleAddOption}>
                  <Plus size={14} />
                </Button>
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit}>{editingField ? 'Salvar' : 'Criar'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
