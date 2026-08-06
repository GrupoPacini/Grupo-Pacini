import { Loader2, Inbox, AlertCircle } from 'lucide-react'
import type { DataState } from '@/lib/financial-utils'
import { cn } from '@/lib/utils'

interface ChartStateDisplayProps {
  state: DataState
  emptyMessage?: string
  errorMessage?: string
  loadingMessage?: string
  className?: string
}

export function ChartStateDisplay({
  state,
  emptyMessage = 'Sem dados para exibir',
  errorMessage = 'Erro ao carregar dados',
  loadingMessage = 'Carregando...',
  className,
}: ChartStateDisplayProps) {
  const base = cn('flex flex-col items-center justify-center text-center', className)

  if (state === 'loading') {
    return (
      <div className={base}>
        <Loader2 size={24} className="animate-spin mb-2 text-primary/60" />
        <p className="text-xs text-muted-foreground">{loadingMessage}</p>
      </div>
    )
  }

  if (state === 'error') {
    return (
      <div className={base}>
        <AlertCircle size={24} className="mb-2 text-destructive/60" />
        <p className="text-xs text-destructive">{errorMessage}</p>
      </div>
    )
  }

  return (
    <div className={base}>
      <Inbox size={24} className="mb-2 text-muted-foreground/40" />
      <p className="text-xs text-muted-foreground">{emptyMessage}</p>
    </div>
  )
}
