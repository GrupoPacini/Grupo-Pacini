import { useState, useEffect, useCallback } from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus } from 'lucide-react'
import { ProcessModel } from '@/services/process-models'
import {
  ProcessModelStage,
  getStagesByModel,
  updateModelStage,
} from '@/services/process-model-stages'
import { ModelStageItem } from './ModelStageItem'
import { ModelStageFormDialog } from './ModelStageFormDialog'
import { useRealtime } from '@/hooks/use-realtime'
import { toast } from 'sonner'

interface ModelDetailDrawerProps {
  model: ProcessModel | null
  onOpenChange: (open: boolean) => void
  canEdit: boolean
  onRefresh: () => void
}

export function ModelDetailDrawer({
  model,
  onOpenChange,
  canEdit,
  onRefresh,
}: ModelDetailDrawerProps) {
  const [stages, setStages] = useState<ProcessModelStage[]>([])
  const [stageOpen, setStageOpen] = useState(false)

  const loadStages = useCallback(async () => {
    if (!model) return
    try {
      setStages(await getStagesByModel(model.id))
    } catch {
      /* ignored */
    }
  }, [model])

  useEffect(() => {
    loadStages()
  }, [loadStages])

  useRealtime('process_model_stages', () => loadStages())
  useRealtime('process_model_tasks', () => loadStages())

  const nextOrder = stages.length > 0 ? Math.max(...stages.map((s) => s.order || 0)) + 1 : 0

  const handleReorder = async (index: number, direction: 'up' | 'down') => {
    const swapIndex = direction === 'up' ? index - 1 : index + 1
    if (swapIndex < 0 || swapIndex >= stages.length) return
    const a = stages[index]
    const b = stages[swapIndex]
    try {
      await Promise.all([
        updateModelStage(a.id, { order: b.order }),
        updateModelStage(b.id, { order: a.order }),
      ])
      loadStages()
    } catch {
      toast.error('Erro ao reordenar etapa')
    }
  }

  if (!model) return null

  return (
    <Sheet open={!!model} onOpenChange={(o) => !o && onOpenChange(false)}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="mb-4">
          <SheetTitle className="text-xl text-primary">{model.name}</SheetTitle>
          <SheetDescription className="flex items-center gap-2">
            {model.description}
            <Badge variant="outline" className="text-xs capitalize">
              {model.type}
            </Badge>
            <Badge variant="outline" className="text-xs capitalize">
              {model.status}
            </Badge>
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold uppercase tracking-wider text-foreground">
                Etapas do Modelo
              </h4>
              {canEdit && (
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1"
                  onClick={() => setStageOpen(true)}
                >
                  <Plus size={14} /> Nova Etapa
                </Button>
              )}
            </div>
            {stages.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhuma etapa cadastrada
              </p>
            ) : (
              stages.map((stage, i) => (
                <ModelStageItem
                  key={stage.id}
                  stage={stage}
                  modelId={model.id}
                  isFirst={i === 0}
                  isLast={i === stages.length - 1}
                  canEdit={canEdit}
                  onRefresh={loadStages}
                  onReorder={(dir) => handleReorder(i, dir)}
                />
              ))
            )}
          </div>
        </div>
      </SheetContent>
      <ModelStageFormDialog
        open={stageOpen}
        onOpenChange={setStageOpen}
        modelId={model.id}
        nextOrder={nextOrder}
        onSuccess={loadStages}
      />
    </Sheet>
  )
}
