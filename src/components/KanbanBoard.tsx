import { useState } from 'react'
import { Process, updateProcessStatus } from '@/services/api'
import { format } from 'date-fns'
import { Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'

const COLUMNS = ['Pendente', 'Em Andamento', 'Concluído', 'Atrasado'] as const

interface KanbanBoardProps {
  processes: Process[]
  onStatusChange: (id: string, status: Process['status']) => Promise<void>
}

export function KanbanBoard({ processes, onStatusChange }: KanbanBoardProps) {
  const [draggedId, setDraggedId] = useState<string | null>(null)

  const handleDrop = async (status: Process['status']) => {
    if (!draggedId) return
    const id = draggedId
    setDraggedId(null)
    await onStatusChange(id, status)
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 flex-1 overflow-x-auto">
      {COLUMNS.map((col) => {
        const items = processes.filter((p) => p.status === col)
        return (
          <div
            key={col}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => handleDrop(col)}
            className={cn(
              'bg-muted/30 rounded-lg p-3 flex flex-col min-h-[300px] transition-colors',
              draggedId && 'ring-2 ring-primary/30',
            )}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-sm text-title-case">{col}</h3>
              <span className="text-xs text-muted-foreground bg-card px-2 py-0.5 rounded-full">
                {items.length}
              </span>
            </div>
            <div className="space-y-2 flex-1 overflow-y-auto">
              {items.map((p) => (
                <div
                  key={p.id}
                  draggable
                  onDragStart={() => setDraggedId(p.id)}
                  onDragEnd={() => setDraggedId(null)}
                  className="bg-card border rounded-md p-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-all"
                >
                  <p className="font-medium text-sm text-foreground line-clamp-2">{p.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">{p.expand?.client?.name}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar size={12} />
                      {p.due_date ? format(new Date(p.due_date), 'dd/MM') : '-'}
                    </span>
                    {p.expand?.responsible && (
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                        {p.expand.responsible.name?.charAt(0).toUpperCase() || '?'}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {items.length === 0 && (
                <p className="text-xs text-muted-foreground/50 text-center py-4">Vazio</p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
