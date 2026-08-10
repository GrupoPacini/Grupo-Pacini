import { useState } from 'react'
import { ProcessStage, deleteStage } from '@/services/process-stages'
import { ProcessTask, updateTask, deleteTask } from '@/services/process-tasks'
import type { User } from '@/services/api'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ChevronUp,
  ChevronDown,
  Pencil,
  Trash2,
  Plus,
  CheckCircle2,
  Circle,
  Clock,
} from 'lucide-react'
import { StageFormDialog } from './StageFormDialog'
import { TaskFormDialog } from './TaskFormDialog'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'

interface StageItemProps {
  stage: ProcessStage
  processId: string
  users: User[]
  isFirst: boolean
  isLast: boolean
  canEdit: boolean
  onRefresh: () => void
  onReorder: (direction: 'up' | 'down') => void
}

const taskStatusIcon: Record<string, typeof CheckCircle2> = {
  Concluída: CheckCircle2,
  Pendente: Circle,
  'Em andamento': Clock,
}

const taskStatusColor: Record<string, string> = {
  Concluída: 'text-green-600',
  Pendente: 'text-muted-foreground',
  'Em andamento': 'text-blue-600',
}

export function StageItem({
  stage,
  processId,
  users,
  isFirst,
  isLast,
  canEdit,
  onRefresh,
  onReorder,
}: StageItemProps) {
  const [editStageOpen, setEditStageOpen] = useState(false)
  const [taskOpen, setTaskOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<ProcessTask | null>(null)
  const tasks = stage.expand?.process_tasks || []

  const handleDeleteStage = async () => {
    try {
      await deleteStage(stage.id)
      toast.success('Etapa Excluída')
      onRefresh()
    } catch {
      toast.error('Erro Ao Excluir Etapa')
    }
  }

  const handleTaskStatusToggle = async (task: ProcessTask) => {
    const nextStatus = task.status === 'Concluída' ? 'Pendente' : 'Concluída'
    try {
      await updateTask(task.id, { status: nextStatus })
      onRefresh()
    } catch {
      toast.error('Erro Ao Atualizar Tarefa')
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    try {
      await deleteTask(taskId)
      toast.success('Tarefa Excluída')
      onRefresh()
    } catch {
      toast.error('Erro Ao Excluir Tarefa')
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
          <span className="font-medium text-sm text-foreground">{stage.name}</span>
          <Badge
            variant="outline"
            className={cn(
              'text-xs',
              stage.status === 'Concluído'
                ? 'bg-green-50 text-green-700'
                : stage.status === 'Em andamento'
                  ? 'bg-blue-50 text-blue-700'
                  : 'bg-gray-50 text-gray-700',
            )}
          >
            {stage.status}
          </Badge>
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
        {tasks.map((task) => {
          const Icon = taskStatusIcon[task.status] || Circle
          const responsible = task.expand?.responsible
          return (
            <div
              key={task.id}
              className="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-muted/30 group"
            >
              <button
                onClick={() => handleTaskStatusToggle(task)}
                className={cn('shrink-0', taskStatusColor[task.status])}
              >
                <Icon size={16} />
              </button>
              <span
                className={cn(
                  'text-sm flex-1',
                  task.status === 'Concluída' && 'line-through text-muted-foreground',
                )}
              >
                {task.name}
              </span>
              {responsible && (
                <span className="text-xs text-muted-foreground">{responsible.name}</span>
              )}
              {task.due_date && (
                <span className="text-xs text-muted-foreground">
                  {format(new Date(task.due_date), 'dd/MM')}
                </span>
              )}
              {canEdit && (
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => {
                      setEditingTask(task)
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
          )
        })}
        {tasks.length === 0 && (
          <p className="text-xs text-muted-foreground/50 py-2">Nenhuma tarefa</p>
        )}
      </div>
      {canEdit && (
        <Button
          variant="ghost"
          size="sm"
          className="ml-6 mt-2 text-xs gap-1 text-muted-foreground"
          onClick={() => {
            setEditingTask(null)
            setTaskOpen(true)
          }}
        >
          <Plus size={14} /> Adicionar Tarefa
        </Button>
      )}
      <StageFormDialog
        open={editStageOpen}
        onOpenChange={setEditStageOpen}
        processId={processId}
        editingStage={stage}
        nextOrder={stage.order}
        onSuccess={onRefresh}
      />
      <TaskFormDialog
        open={taskOpen}
        onOpenChange={setTaskOpen}
        stageId={stage.id}
        editingTask={editingTask}
        users={users}
        onSuccess={onRefresh}
      />
    </div>
  )
}
