import { Check, AlertTriangle, Minus } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { formatBRL, formatCompetence } from '@/lib/financial-utils'
import type { ContinuityStatus } from '@/lib/financial-computations'

interface ContinuityIndicatorProps {
  status: ContinuityStatus | undefined
}

export function ContinuityIndicator({ status }: ContinuityIndicatorProps) {
  if (!status) return null

  if (status.state === 'sem_referencia') {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground/50 cursor-help">
            <Minus size={11} />
            <span>Sem competência anterior</span>
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">Sem competência anterior para conferência</p>
        </TooltipContent>
      </Tooltip>
    )
  }

  if (status.state === 'conciliado') {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex items-center gap-1 text-[11px] text-green-600 dark:text-green-400 cursor-help">
            <Check size={11} />
            <span>Conciliado</span>
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">Saldo conciliado com a competência anterior</p>
        </TooltipContent>
      </Tooltip>
    )
  }

  const prevCompLabel = status.previousCompetence
    ? formatCompetence(status.previousCompetence.month, status.previousCompetence.year)
    : '—'
  const diff = status.difference ?? 0
  const absDiff = formatBRL(Math.abs(diff))

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex items-center gap-1 text-[11px] text-orange-600 dark:text-orange-400 cursor-help">
          <AlertTriangle size={11} />
          <span>Divergência de saldo: {absDiff}</span>
        </span>
      </TooltipTrigger>
      <TooltipContent side="left" className="max-w-xs">
        <div className="space-y-1 text-xs">
          <p className="font-medium text-orange-600 dark:text-orange-400">
            Divergência de saldo: {absDiff}
          </p>
          <p>Competência anterior: {prevCompLabel}</p>
          <p>
            Saldo Final anterior:{' '}
            {status.previousSaldoFinal != null ? formatBRL(status.previousSaldoFinal) : '—'}
          </p>
          <p>
            Saldo Inicial atual:{' '}
            {status.currentSaldoInicial != null ? formatBRL(status.currentSaldoInicial) : '—'}
          </p>
          <p>Diferença: {formatBRL(diff)}</p>
        </div>
      </TooltipContent>
    </Tooltip>
  )
}
