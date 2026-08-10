import { useState, useEffect, useCallback } from 'react'
import {
  ProcessTaskChecklist,
  getChecklistsByTask,
  createChecklistItem,
  updateChecklistItem,
  deleteChecklistItem,
} from '@/services/process-task-checklists'
import { useRealtime } from '@/hooks/use-realtime'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { ChevronUp, ChevronDown, Plus, Pencil, Trash2, Check, X } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface TaskChecklistProps {
  taskId: string
  canEdit: boolean
}

export function TaskChecklist({ taskId, canEdit }: TaskChecklistProps) {
  const [items, setItems] = useState<ProcessTaskChecklist[]>([])
  const [newDesc, setNewDesc] = useState('')
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDesc, setEditDesc] = useState('')

  const loadItems = useCallback(async () => {
    try {
      setItems(await getChecklistsByTask(taskId))
    } catch {
      /* ignored */
    }
  }, [taskId])

  useEffect(() => {
    loadItems()
  }, [loadItems])

  useRealtime('process_task_checklists', (e) => {
    if (e.record['task'] === taskId) loadItems()
  })

  const completedCount = items.filter((i) => i.completed).length

  const handleAdd = async () => {
    if (!newDesc.trim()) return
    try {
      const order = items.length > 0 ? Math.max(...items.map((i) => i.order || 0)) + 1 : 0
      await createChecklistItem({ task: taskId, description: newDesc.trim(), order })
      setNewDesc('')
      setAdding(false)
      loadItems()
    } catch {
      toast.error('Erro Ao Adicionar Item')
    }
  }

  const handleToggle = async (item: ProcessTaskChecklist) => {
    try {
      await updateChecklistItem(item.id, { completed: !item.completed })
      loadItems()
    } catch {
      toast.error('Erro Ao Atualizar Item')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteChecklistItem(id)
      loadItems()
    } catch {
      toast.error('Erro Ao Excluir Item')
    }
  }

  const handleSaveEdit = async () => {
    if (!editingId || !editDesc.trim()) return
    try {
      await updateChecklistItem(editingId, { description: editDesc.trim() })
      setEditingId(null)
      setEditDesc('')
      loadItems()
    } catch {
      toast.error('Erro Ao Editar Item')
    }
  }

  const handleReorder = async (index: number, direction: 'up' | 'down') => {
    const swapIndex = direction === 'up' ? index - 1 : index + 1
    if (swapIndex < 0 || swapIndex >= items.length) return
    const a = items[index]
    const b = items[swapIndex]
    try {
      await Promise.all([
        updateChecklistItem(a.id, { order: b.order }),
        updateChecklistItem(b.id, { order: a.order }),
      ])
      loadItems()
    } catch {
      toast.error('Erro Ao Reordenar Item')
    }
  }

  return (
    <div className="mt-1 ml-7 space-y-0.5 border-l-2 border-muted pl-3">
      {items.length > 0 && (
        <p className="text-[10px] text-muted-foreground/70 mb-1">
          {completedCount} de {items.length}{' '}
          {items.length === 1 ? 'item concluído' : 'itens concluídos'}
        </p>
      )}
      {items.map((item, index) => (
        <div key={item.id} className="flex items-center gap-1.5 py-0.5 group/check">
          {canEdit && (
            <div className="flex flex-col shrink-0">
              <button
                onClick={() => handleReorder(index, 'up')}
                disabled={index === 0}
                className="text-muted-foreground hover:text-foreground disabled:opacity-20 leading-none"
              >
                <ChevronUp size={9} />
              </button>
              <button
                onClick={() => handleReorder(index, 'down')}
                disabled={index === items.length - 1}
                className="text-muted-foreground hover:text-foreground disabled:opacity-20 leading-none"
              >
                <ChevronDown size={9} />
              </button>
            </div>
          )}
          <Checkbox
            checked={item.completed}
            onCheckedChange={() => handleToggle(item)}
            disabled={!canEdit}
            className="h-3.5 w-3.5"
          />
          {editingId === item.id ? (
            <div className="flex-1 flex items-center gap-1">
              <Input
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                className="h-6 text-xs"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveEdit()
                  if (e.key === 'Escape') {
                    setEditingId(null)
                    setEditDesc('')
                  }
                }}
                autoFocus
              />
              <Button size="icon" variant="ghost" className="h-5 w-5" onClick={handleSaveEdit}>
                <Check size={11} />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-5 w-5"
                onClick={() => {
                  setEditingId(null)
                  setEditDesc('')
                }}
              >
                <X size={11} />
              </Button>
            </div>
          ) : (
            <>
              <span
                className={cn(
                  'text-xs flex-1',
                  item.completed && 'line-through text-muted-foreground',
                )}
              >
                {item.description}
              </span>
              {canEdit && (
                <div className="flex items-center gap-0.5 opacity-0 group-hover/check:opacity-100 transition-opacity shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5"
                    onClick={() => {
                      setEditingId(item.id)
                      setEditDesc(item.description)
                    }}
                  >
                    <Pencil size={10} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 text-muted-foreground hover:text-red-600"
                    onClick={() => handleDelete(item.id)}
                  >
                    <Trash2 size={10} />
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      ))}
      {canEdit &&
        (adding ? (
          <div className="flex items-center gap-1.5 py-0.5">
            <div className="w-3.5" />
            <Input
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="Descrição do item"
              className="h-6 text-xs flex-1"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAdd()
                if (e.key === 'Escape') {
                  setAdding(false)
                  setNewDesc('')
                }
              }}
              autoFocus
            />
            <Button size="icon" variant="ghost" className="h-5 w-5" onClick={handleAdd}>
              <Check size={11} />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-5 w-5"
              onClick={() => {
                setAdding(false)
                setNewDesc('')
              }}
            >
              <X size={11} />
            </Button>
          </div>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className="text-[11px] gap-1 text-muted-foreground h-6"
            onClick={() => setAdding(true)}
          >
            <Plus size={11} /> Adicionar item
          </Button>
        ))}
    </div>
  )
}
