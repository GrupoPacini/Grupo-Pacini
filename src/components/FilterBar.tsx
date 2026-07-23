import { useState } from 'react'
import { Search, Plus, X, Filter as FilterIcon } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  type FilterCondition,
  type FilterFieldConfig,
  type FilterValue,
  generateFilterId,
  formatFilterBadge,
  isConditionEmpty,
} from '@/lib/filter-types'
import { FilterConditionEditor } from '@/components/FilterConditionEditor'

interface Props {
  searchValue: string
  onSearchChange: (value: string) => void
  fields: FilterFieldConfig[]
  conditions: FilterCondition[]
  onConditionsChange: (conditions: FilterCondition[]) => void
  searchPlaceholder?: string
}

export function FilterBar({
  searchValue,
  onSearchChange,
  fields,
  conditions,
  onConditionsChange,
  searchPlaceholder = 'Buscar...',
}: Props) {
  const [addOpen, setAddOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState<FilterCondition | null>(null)

  const startAdd = (field: string) => {
    const cfg = fields.find((f) => f.field === field)
    const value: FilterValue =
      cfg?.type === 'multiselect'
        ? []
        : cfg?.type === 'date-range' || cfg?.type === 'chips-date-range'
          ? { start: '', end: '' }
          : null
    setDraft({ id: generateFilterId(), field, operator: cfg?.operators[0]?.value || '', value })
  }

  const applyDraft = () => {
    if (!draft) return
    onConditionsChange([...conditions.filter((c) => c.id !== draft.id), draft])
    setDraft(null)
    setAddOpen(false)
    setEditingId(null)
  }

  const removeCondition = (id: string) => {
    onConditionsChange(conditions.filter((c) => c.id !== id))
    if (editingId === id) {
      setEditingId(null)
      setDraft(null)
    }
  }

  const clearAll = () => onConditionsChange([])
  const activeConditions = conditions.filter((c) => !isConditionEmpty(c))

  const openEdit = (c: FilterCondition) => {
    setEditingId(c.id)
    setDraft({ ...c })
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            size={18}
          />
          <Input
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
        <Popover
          open={addOpen}
          onOpenChange={(o) => {
            setAddOpen(o)
            if (!o) setDraft(null)
          }}
        >
          <PopoverTrigger asChild>
            <Button variant="outline" size="icon" className="shrink-0">
              <Plus size={18} />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="end">
            {!draft ? (
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground mb-2">Adicionar filtro</p>
                {fields.map((f) => (
                  <button
                    key={f.field}
                    className="w-full text-left px-3 py-2 rounded-md hover:bg-accent text-sm transition-colors"
                    onClick={() => startAdd(f.field)}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            ) : (
              <FilterConditionEditor
                condition={draft}
                fields={fields}
                onChange={setDraft}
                onApply={applyDraft}
              />
            )}
          </PopoverContent>
        </Popover>
      </div>

      {activeConditions.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <FilterIcon size={14} className="text-muted-foreground shrink-0" />
          {activeConditions.map((c) => (
            <Popover
              key={c.id}
              open={editingId === c.id}
              onOpenChange={(o) => {
                if (o) openEdit(c)
                else {
                  setEditingId(null)
                  setDraft(null)
                }
              }}
            >
              <PopoverTrigger asChild>
                <Badge
                  variant="secondary"
                  className="cursor-pointer gap-1 pr-1.5 pl-3 py-1.5 text-xs"
                >
                  {formatFilterBadge(c, fields)}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      removeCondition(c.id)
                    }}
                    className="ml-1 rounded-full hover:bg-muted-foreground/20 p-0.5"
                  >
                    <X size={12} />
                  </button>
                </Badge>
              </PopoverTrigger>
              <PopoverContent className="w-80" align="start">
                {draft && editingId === c.id && (
                  <FilterConditionEditor
                    condition={draft}
                    fields={fields}
                    onChange={setDraft}
                    onApply={applyDraft}
                  />
                )}
              </PopoverContent>
            </Popover>
          ))}
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-muted-foreground hover:text-destructive"
            onClick={clearAll}
          >
            Limpar todos
          </Button>
        </div>
      )}
    </div>
  )
}
