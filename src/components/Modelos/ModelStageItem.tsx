import { useState } from 'react'
import {
  ProcessModelStage,
  deleteModelStage,
  updateModelStage,
} from '@/services/process-model-stages'
import { deleteModelTask, updateModelTask } from '@/services/process-model-tasks'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ChevronUp, ChevronDown, Pencil, Trash2, Plus, GripVertical } from 'lucide-react'
import { ModelStageFormDialog } from './ModelStageFormDialog'
import { ModelTaskFormDialog } from './ModelTaskFormDialog'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface ModelStageItemProps {
  stage: ProcessModelStage
  modelId: string
  isFirst: boolean
  isLast: boolean
  canEdit: boolean
  onRefresh: () => void
  onReorder: (direction: 'up' | 'down') => void
}

export function ModelStageItem({
  stage,
  modelId,
  isFirst,
  isLast,
  canEdit,
  onRefresh,
  onReorder,
}: ModelStageItemProps) {
  const [editStageOpen, setEditStageOpen] = useState(false)
  const [taskOpen, setTaskOpen] = useState(false)
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const tasks = stage.expand?.process_model_tasks || []

  const sortedTasks = [...tasks].sort((a, b) => (a.order || 0) - (b.order || 0))

  const handleDeleteStage = async () => {
    try {
      await deleteModelStage(stage.id)
      toast.success('Etapa Excluída')
      onRefresh()
    } catch {
      toast.error('Erro Ao Excluir Etapa')
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    try {
      await deleteModelTask(taskId)
      toast.success('Tarefa Excluída')
      onRefresh()
    } catch {
      toast.error('Erro Ao Excluir Tarefa')
    }
  }

  const handleReorderTask = async (index: number, direction: 'up' | 'down') => {
    const swapIndex = direction === 'up' ? index - 1 : index + 1
    if (swapIndex < 0 || swapIndex >= sortedTasks.length) return
    const a = sortedTasks[index]
    const b = sortedTasks[swapIndex]
    try {
      await Promise.all([
        updateModelTask(a.id, { order: b.order }),
        updateModelTask(b.id, { order: a.order }),
      ])
      onRefresh()
    } catch {
      toast.error('Erro ao reordenar tarefa')
    }
  }

  return (
    <div className="border rounded-lg p-4 bg-card">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {canEdit && (
            <div className="flex flex-col">
              <button
                onClick={() => onReorder('up')}
                disabled={isFirst}
                className="text-muted-foreground hover:text-foreground disabled:opacity-30"
              >
                <ChevronUp size={14} />
              </button>
              <button
                onClick={() => onReorder('down')}
                disabled={isLast}
                className="text-muted-foreground hover:text-foreground disabled:opacity-30"
              >
                <ChevronDown size={14} />
              </button>
            </div>
          )}
          <div>
            <span className="font-medium text-sm text-foreground">{stage.name}</span>
            {stage.description && (
              <p className="text-xs text-muted-foreground mt-0.5">{stage.description}</p>
            )}
          </div>
        </div>
        {canEdit && (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setEditStageOpen(true)}
            >
              <Pencil size={14} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-red-600"
              onClick={handleDeleteStage}
            >
              <Trash2 size={14} />
            </Button>
          </div>
        )}
      </div>
      <div className="space-y-1.5 ml-6">
        {sortedTasks.map((task, i) => (
          <div
            key={task.id}
            className="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-muted/30 group"
          >
            {canEdit && (
              <div className="flex flex-col opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleReorderTask(i, 'up')}
                  disabled={i === 0}
                  className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                >
                  <ChevronUp size={10} />
                </button>
                <button
                  onClick={() => handleReorderTask(i, 'down')}
                  disabled={i === sortedTasks.length - 1}
                  className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                >
                  <ChevronDown size={10} />
                </button>
              </div>
            )}
            <span className="text-sm flex-1">{task.name}</span>
            {task.default_due_days != null && (
              <span className="text-xs text-muted-foreground">{task.default_due_days}d</span>
            )}
            {task.expand?.default_responsible && (
              <span className="text-xs text-muted-foreground">
                {task.expand.default_responsible.name}
              </span>
            )}
            <Badge
              variant="outline"
              className={cn(
                'text-xs',
                task.required === 'sim' ? 'bg-blue-50 text-blue-700' : 'bg-gray-50 text-gray-600',
              )}
            >
              {task.required === 'sim' ? 'Obrigatória' : 'Opcional'}
            </Badge>
            {canEdit && (
              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => {
                    setEditingTaskId(task.id)
                    setTaskOpen(true)
                  }}
                >
                  <Pencil size={12} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-muted-foreground hover:text-red-600"
                  onClick={() => handleDeleteTask(task.id)}
                >
                  <Trash2 size={12} />
                </Button>
              </div>
            )}
          </div>
        ))}
        {sortedTasks.length === 0 && (
          <p className="text-xs text-muted-foreground/50 py-2">Nenhuma tarefa</p>
        )}
      </div>
      {canEdit && (
        <Button
          variant="ghost"
          size="sm"
          className="ml-6 mt-2 text-xs gap-1 text-muted-foreground"
          onClick={() => {
            setEditingTaskId(null)
            setTaskOpen(true)
          }}
        >
          <Plus size={14} /> Adicionar Tarefa
        </Button>
      )}
      <ModelStageFormDialog
        open={editStageOpen}
        onOpenChange={setEditStageOpen}
        modelId={modelId}
        editingStage={stage}
        nextOrder={stage.order}
        onSuccess={onRefresh}
      />
      <ModelTaskFormDialog
        open={taskOpen}
        onOpenChange={setTaskOpen}
        stageId={stage.id}
        editingTaskId={editingTaskId}
        tasks={sortedTasks}
        onSuccess={onRefresh}
      />
    </div>
  )
}
