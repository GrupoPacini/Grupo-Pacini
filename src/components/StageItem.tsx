import { useState } from 'react'
import {
  ProcessStage,
  deleteStage,
  duplicateStage,
  toggleStageActive,
} from '@/services/process-stages'
import { ProcessTask, updateTask, deleteTask } from '@/services/process-tasks'
import type { User, Department } from '@/services/api'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import {
  ChevronUp,
  ChevronDown,
  Plus,
  CheckCircle2,
  Circle,
  Clock,
  MoreVertical,
  Copy,
  Power,
  Pencil,
  Trash2,
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
  departments: Department[]
  allStages: ProcessStage[]
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
  departments,
  allStages,
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
  const isInactive = stage.active === false

  const depNames = (stage.dependencies || [])
    .map((id) => allStages.find((s) => s.id === id)?.name)
    .filter(Boolean)

  const metaItems = [
    stage.expand?.department?.name,
    stage.expand?.default_responsible?.name,
    stage.default_due_days != null ? `${stage.default_due_days} dia(s)` : null,
    stage.priority,
    `${tasks.length} tarefa(s)`,
    depNames.length > 0 ? `Depende de: ${depNames.join(', ')}` : null,
  ].filter(Boolean)

  const handleDeleteStage = async () => {
    try {
      await deleteStage(stage.id)
      toast.success('Etapa Excluída')
      onRefresh()
    } catch {
      toast.error('Erro Ao Excluir Etapa')
    }
  }

  const handleDuplicate = async () => {
    try {
      await duplicateStage(stage.id, processId)
      toast.success('Etapa Duplicada')
      onRefresh()
    } catch {
      toast.error('Erro Ao Duplicar Etapa')
    }
  }

  const handleToggleActive = async () => {
    try {
      await toggleStageActive(stage.id, !stage.active)
      toast.success(stage.active ? 'Etapa Inativada' : 'Etapa Ativada')
      onRefresh()
    } catch {
      toast.error('Erro Ao Alterar Status Da Etapa')
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
    <div className={cn('border rounded-lg p-4 bg-card', isInactive && 'opacity-60')}>
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
          {stage.identification_color && (
            <span
              className="w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: stage.identification_color }}
            />
          )}
          <span className="font-medium text-sm text-foreground">{stage.name}</span>
          {stage.required === 'sim' && (
            <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700">
              Obrigatória
            </Badge>
          )}
          {isInactive && (
            <Badge variant="outline" className="text-xs bg-gray-100 text-gray-500">
              Inativa
            </Badge>
          )}
          <Badge
            variant="outline"
            className={cn(
              'text-xs',
              stage.status === 'Concluída'
                ? 'bg-green-50 text-green-700'
                : stage.status === 'Em andamento'
                  ? 'bg-blue-50 text-blue-700'
                  : stage.status === 'Bloqueada'
                    ? 'bg-red-50 text-red-700'
                    : 'bg-gray-50 text-gray-700',
            )}
          >
            {stage.status}
          </Badge>
        </div>
        {canEdit && (
          <div className="flex items-center gap-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <MoreVertical size={14} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setEditStageOpen(true)}>
                  <Pencil size={14} className="mr-2" /> Editar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDuplicate}>
                  <Copy size={14} className="mr-2" /> Duplicar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleToggleActive}>
                  <Power size={14} className="mr-2" />
                  {stage.active ? 'Inativar' : 'Ativar'}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleDeleteStage}
                  className="text-red-600 focus:text-red-600"
                >
                  <Trash2 size={14} className="mr-2" /> Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
      {stage.description && (
        <p className="text-xs text-muted-foreground mb-2 ml-6">{stage.description}</p>
      )}
      {metaItems.length > 0 && (
        <div className="ml-6 mb-2 text-[11px] text-muted-foreground/60">
          {metaItems.join(' · ')}
        </div>
      )}
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
        departments={departments}
        users={users}
        stages={allStages}
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
