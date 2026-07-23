import { Calendar } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { getDaysRemaining } from '@/lib/license-utils'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

interface DueDateCellProps {
  expiration_date: string | null | undefined
  sem_vencimento: boolean | null | undefined
}

export function DueDateCell({ expiration_date, sem_vencimento }: DueDateCellProps) {
  if (sem_vencimento) {
    return <span className="text-muted-foreground font-medium text-sm">Indeterminado</span>
  }
  if (!expiration_date) {
    return <span className="text-muted-foreground text-sm">—</span>
  }

  const days = getDaysRemaining(expiration_date)

  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-center gap-1.5">
        <Calendar size={13} className="text-muted-foreground shrink-0" />
        <span
          className={cn(
            'text-sm',
            days === null && 'text-muted-foreground',
            days !== null && days < 0 && 'text-red-600 font-semibold',
            days === 0 && 'text-amber-600 font-semibold',
            days !== null && days > 0 && days <= 30 && 'text-amber-600 font-semibold',
            days !== null && days > 30 && 'text-green-600 font-medium',
          )}
        >
          {format(new Date(expiration_date), 'dd/MM/yyyy')}
        </span>
      </div>
      {days === 0 && (
        <div className="pl-[22px]">
          <Badge
            variant="outline"
            className="rounded-full bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800"
          >
            Vence hoje
          </Badge>
        </div>
      )}
      {days !== null && days > 0 && days <= 30 && (
        <div className="pl-[22px]">
          <Badge
            variant="outline"
            className="rounded-full bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800"
          >
            {days} dias
          </Badge>
        </div>
      )}
      {days !== null && days > 30 && (
        <span className="text-xs text-green-600 font-medium pl-[22px]">{days} dias</span>
      )}
      {days !== null && days < 0 && (
        <span className="text-xs text-red-600 font-medium pl-[22px]">
          Vencida há {Math.abs(days)} dias
        </span>
      )}
    </div>
  )
}
