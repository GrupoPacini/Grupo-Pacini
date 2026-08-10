import { useState, useEffect, useCallback } from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus } from 'lucide-react'
import { Process, User, Department, updateProcessStatus } from '@/services/api'
import { ProcessStage, getStagesByProcess, updateStage } from '@/services/process-stages'
import { StageItem } from './StageItem'
import { StageFormDialog } from './StageFormDialog'
import { computeProgress, PROCESS_STATUSES } from '@/lib/process-utils'
import { useRealtime } from '@/hooks/use-realtime'
import { format } from 'date-fns'
import { toast } from 'sonner'

interface ProcessDetailDrawerProps {
  process: Process | null
  onOpenChange: (open: boolean) => void
  users: User[]
  departments: Department[]
  canEdit: boolean
  onRefresh: () => void
}

export function ProcessDetailDrawer({
  process,
  onOpenChange,
  users,
  departments,
  canEdit,
  onRefresh,
}: ProcessDetailDrawerProps) {
  const [stages, setStages] = useState<ProcessStage[]>([])
  const [stageOpen, setStageOpen] = useState(false)

  const loadStages = useCallback(async () => {
    if (!process) return
    try {
      setStages(await getStagesByProcess(process.id))
    } catch {
      /* ignored */
    }
  }, [process])

  useEffect(() => {
    loadStages()
  }, [loadStages])

  useRealtime('process_stages', () => loadStages())
  useRealtime('process_tasks', () => loadStages())
  useRealtime('process_task_checklists', () => loadStages())

  const progress = computeProgress(stages)
  const nextOrder = stages.length > 0 ? Math.max(...stages.map((s) => s.order || 0)) + 1 : 0

  const handleReorder = async (index: number, direction: 'up' | 'down') => {
    const swapIndex = direction === 'up' ? index - 1 : index + 1
    if (swapIndex < 0 || swapIndex >= stages.length) return
    const a = stages[index]
    const b = stages[swapIndex]
    try {
      await Promise.all([
        updateStage(a.id, { order: b.order }),
        updateStage(b.id, { order: a.order }),
      ])
      loadStages()
    } catch {
      toast.error('Erro ao reordenar etapa')
    }
  }

  const handleStatusChange = async (status: string) => {
    if (!process) return
    try {
      await updateProcessStatus(process.id, status)
      toast.success('Status Atualizado')
      onRefresh()
    } catch {
      toast.error('Erro Ao Atualizar Status')
    }
  }

  if (!process) return null

  return (
    <Sheet open={!!process} onOpenChange={(o) => !o && onOpenChange(false)}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="mb-4">
          <SheetTitle className="text-xl text-primary">{process.title}</SheetTitle>
          <SheetDescription>
            {process.expand?.client?.name} • {process.expand?.department?.name}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progresso</span>
              <span className="font-medium">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {canEdit && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground shrink-0">Status:</span>
              <Select value={process.status} onValueChange={handleStatusChange}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROCESS_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 bg-muted/30 p-4 rounded-lg border text-sm">
            <div>
              <span className="text-muted-foreground">Início:</span>{' '}
              <span className="font-medium">
                {process.start_date ? format(new Date(process.start_date), 'dd/MM/yyyy') : '-'}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Prazo:</span>{' '}
              <span className="font-medium">
                {process.due_date ? format(new Date(process.due_date), 'dd/MM/yyyy') : '-'}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Responsável:</span>{' '}
              <span className="font-medium">{process.expand?.responsible?.name || '-'}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Prioridade:</span>{' '}
              <span className="font-medium">{process.priority || '-'}</span>
            </div>
          </div>

          {process.notes && (
            <div className="text-sm">
              <p className="text-muted-foreground mb-1">Descrição:</p>
              <p className="text-foreground">{process.notes}</p>
            </div>
          )}

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold uppercase tracking-wider text-foreground">
                Etapas
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
                <StageItem
                  key={stage.id}
                  stage={stage}
                  processId={process.id}
                  users={users}
                  departments={departments}
                  allStages={stages}
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
      <StageFormDialog
        open={stageOpen}
        onOpenChange={setStageOpen}
        processId={process.id}
        nextOrder={nextOrder}
        departments={departments}
        users={users}
        stages={stages}
        onSuccess={loadStages}
      />
    </Sheet>
  )
}
