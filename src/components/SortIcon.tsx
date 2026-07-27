import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { SortDirection } from '@/hooks/use-sorting'

interface SortIconProps {
  active: boolean
  direction: SortDirection
  className?: string
}

export function SortIcon({ active, direction, className }: SortIconProps) {
  if (!active || !direction) {
    return <ArrowUpDown size={14} className={cn('text-muted-foreground/40', className)} />
  }
  if (direction === 'asc') {
    return <ArrowUp size={14} className={cn('text-primary', className)} />
  }
  return <ArrowDown size={14} className={cn('text-primary', className)} />
}
