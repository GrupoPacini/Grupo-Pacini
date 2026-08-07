import { useState } from 'react'
import { Calendar, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { MONTHS } from '@/lib/financial-utils'

interface MonthMultiSelectProps {
  value: string[]
  onChange: (value: string[]) => void
}

const ALL_VALUE = 'all'

export function MonthMultiSelect({ value, onChange }: MonthMultiSelectProps) {
  const [open, setOpen] = useState(false)

  const isAllChecked = value.includes(ALL_VALUE)
  const isEmpty = value.length === 0
  const selectedMonths = value.filter((v) => v !== ALL_VALUE)

  const summary = (() => {
    if (isAllChecked || isEmpty) return 'Todos os meses'
    if (selectedMonths.length === 1) {
      return MONTHS.find((m) => m.value === selectedMonths[0])?.label || ''
    }
    if (selectedMonths.length === 2) {
      return selectedMonths.map((v) => MONTHS.find((m) => m.value === v)?.label || '').join(', ')
    }
    return `${selectedMonths.length} meses selecionados`
  })()

  const handleToggleAll = () => {
    if (isAllChecked) {
      onChange([])
    } else {
      onChange([ALL_VALUE])
    }
  }

  const handleToggleMonth = (monthValue: string) => {
    if (value.includes(ALL_VALUE)) {
      onChange([monthValue])
    } else if (selectedMonths.includes(monthValue)) {
      onChange(selectedMonths.filter((v) => v !== monthValue))
    } else {
      onChange([...selectedMonths, monthValue])
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="h-9 w-full justify-between font-normal"
        >
          <span className="flex items-center gap-2 truncate">
            <Calendar size={14} className="text-muted-foreground shrink-0" />
            <span className="truncate">{summary}</span>
          </span>
          <ChevronDown size={14} className="opacity-50 shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[260px] p-0" align="start">
        <ScrollArea className="h-[300px]">
          <div className="p-1">
            <div
              className="flex items-center gap-2 px-2 py-1.5 cursor-pointer rounded-sm hover:bg-accent transition-colors"
              onClick={handleToggleAll}
            >
              <Checkbox checked={isAllChecked} className="pointer-events-none" />
              <span className="text-sm font-medium">Todos os meses</span>
            </div>
            <div className="h-px bg-border my-1" />
            {MONTHS.map((m) => {
              const checked = !isAllChecked && selectedMonths.includes(m.value)
              return (
                <div
                  key={m.value}
                  className="flex items-center gap-2 px-2 py-1.5 cursor-pointer rounded-sm hover:bg-accent transition-colors"
                  onClick={() => handleToggleMonth(m.value)}
                >
                  <Checkbox checked={checked} className="pointer-events-none" />
                  <span className="text-sm">{m.label}</span>
                </div>
              )
            })}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}
