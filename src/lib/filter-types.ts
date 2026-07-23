export type FilterFieldType = 'text' | 'multiselect' | 'date-range' | 'chips' | 'chips-date-range'

export interface FilterOperator {
  value: string
  label: string
}

export interface FilterFieldConfig {
  field: string
  label: string
  type: FilterFieldType
  operators: FilterOperator[]
  options?: { value: string; label: string }[]
  chips?: { value: string; label: string }[]
}

export type FilterValue = string | string[] | { start: string; end: string } | null

export interface FilterCondition {
  id: string
  field: string
  operator: string
  value: FilterValue
}

let counter = 0
export function generateFilterId(): string {
  counter += 1
  return `f-${Date.now()}-${counter}`
}

export function isConditionEmpty(condition: FilterCondition): boolean {
  const v = condition.value
  if (v === null || v === '') return true
  if (Array.isArray(v) && v.length === 0) return true
  if (typeof v === 'object' && !Array.isArray(v) && v !== null) {
    const r = v as { start: string; end: string }
    return !r.start && !r.end
  }
  return false
}

export function formatFilterBadge(condition: FilterCondition, fields: FilterFieldConfig[]): string {
  const cfg = fields.find((f) => f.field === condition.field)
  if (!cfg) return condition.field

  const op = cfg.operators.find((o) => o.value === condition.operator)
  const opLabel = op?.label || ''

  if (cfg.type === 'text') {
    const v = condition.value as string
    return v ? `${cfg.label} ${opLabel} "${v}"` : cfg.label
  }

  if (cfg.type === 'multiselect') {
    const vals = condition.value as string[]
    if (!vals || vals.length === 0) return cfg.label
    const labels = vals.map((v) => cfg.options?.find((o) => o.value === v)?.label || v)
    return `${cfg.label}: ${labels.join(', ')}`
  }

  if (cfg.type === 'chips' || cfg.type === 'chips-date-range') {
    if (typeof condition.value === 'string' && condition.value) {
      const chip = cfg.chips?.find((c) => c.value === condition.value)
      return `${cfg.label}: ${chip?.label || condition.value}`
    }
  }

  if (cfg.type === 'date-range' || cfg.type === 'chips-date-range') {
    if (condition.value && typeof condition.value === 'object' && !Array.isArray(condition.value)) {
      const r = condition.value as { start: string; end: string }
      if (r.start && r.end) return `${cfg.label}: ${r.start} — ${r.end}`
      if (r.start) return `${cfg.label}: ≥ ${r.start}`
      if (r.end) return `${cfg.label}: ≤ ${r.end}`
    }
  }

  return cfg.label
}
