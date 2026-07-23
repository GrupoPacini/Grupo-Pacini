import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { FilterCondition, FilterFieldConfig, FilterValue } from '@/lib/filter-types'

interface Props {
  condition: FilterCondition
  fields: FilterFieldConfig[]
  onChange: (condition: FilterCondition) => void
  onApply: () => void
}

export function FilterConditionEditor({ condition, fields, onChange, onApply }: Props) {
  const cfg = fields.find((f) => f.field === condition.field)

  const updateValue = (value: FilterValue) => onChange({ ...condition, value })

  const toggleMultiValue = (val: string) => {
    const current = (condition.value as string[]) || []
    updateValue(current.includes(val) ? current.filter((v) => v !== val) : [...current, val])
  }

  const rangeVal = () =>
    typeof condition.value === 'object' && !Array.isArray(condition.value) && condition.value
      ? (condition.value as { start: string; end: string })
      : { start: '', end: '' }

  return (
    <div className="space-y-3 w-full">
      <div className="flex gap-2">
        <Select
          value={condition.field}
          onValueChange={(v) => {
            const nc = fields.find((f) => f.field === v)
            const nv: FilterValue =
              nc?.type === 'multiselect'
                ? []
                : nc?.type === 'date-range' || nc?.type === 'chips-date-range'
                  ? { start: '', end: '' }
                  : null
            onChange({ ...condition, field: v, operator: nc?.operators[0]?.value || '', value: nv })
          }}
        >
          <SelectTrigger className="flex-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {fields.map((f) => (
              <SelectItem key={f.field} value={f.field}>
                {f.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {cfg?.type === 'text' && (
          <Select
            value={condition.operator}
            onValueChange={(v) => onChange({ ...condition, operator: v })}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {cfg.operators.map((op) => (
                <SelectItem key={op.value} value={op.value}>
                  {op.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {cfg?.type === 'text' && (
        <Input
          placeholder="Digite o valor..."
          value={(condition.value as string) || ''}
          onChange={(e) => updateValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onApply()}
        />
      )}

      {cfg?.type === 'multiselect' && cfg.options && (
        <div className="flex flex-wrap gap-2">
          {cfg.options.map((opt) => {
            const selected = ((condition.value as string[]) || []).includes(opt.value)
            return (
              <Badge
                key={opt.value}
                variant={selected ? 'default' : 'outline'}
                className={cn('cursor-pointer', selected && 'bg-primary text-primary-foreground')}
                onClick={() => toggleMultiValue(opt.value)}
              >
                {opt.label}
              </Badge>
            )
          })}
        </div>
      )}

      {cfg?.type === 'chips-date-range' && cfg.chips && (
        <>
          <div className="flex flex-wrap gap-2">
            {cfg.chips.map((chip) => {
              const selected = typeof condition.value === 'string' && condition.value === chip.value
              return (
                <Badge
                  key={chip.value}
                  variant={selected ? 'default' : 'outline'}
                  className={cn('cursor-pointer', selected && 'bg-primary text-primary-foreground')}
                  onClick={() => updateValue(selected ? null : chip.value)}
                >
                  {chip.label}
                </Badge>
              )
            })}
          </div>
          <p className="text-xs text-muted-foreground text-center">ou período personalizado</p>
          <div className="flex gap-2 items-center">
            <Input
              type="date"
              value={rangeVal().start}
              onChange={(e) => updateValue({ start: e.target.value, end: rangeVal().end })}
              className="flex-1"
            />
            <span className="text-muted-foreground text-sm">até</span>
            <Input
              type="date"
              value={rangeVal().end}
              onChange={(e) => updateValue({ start: rangeVal().start, end: e.target.value })}
              className="flex-1"
            />
          </div>
        </>
      )}

      {cfg?.type === 'date-range' && (
        <div className="flex gap-2 items-center">
          <Input
            type="date"
            value={rangeVal().start}
            onChange={(e) => updateValue({ start: e.target.value, end: rangeVal().end })}
            className="flex-1"
          />
          <span className="text-muted-foreground text-sm">até</span>
          <Input
            type="date"
            value={rangeVal().end}
            onChange={(e) => updateValue({ start: rangeVal().start, end: e.target.value })}
            className="flex-1"
          />
        </div>
      )}

      <Button size="sm" className="w-full" onClick={onApply}>
        <Check size={14} className="mr-1" /> Aplicar
      </Button>
    </div>
  )
}
