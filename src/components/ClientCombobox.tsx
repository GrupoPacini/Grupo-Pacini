import { useState } from 'react'
import { Check, ChevronsUpDown, Search, AlertCircle, Loader2 } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { Client } from '@/services/api'

interface ClientComboboxProps {
  clients: Client[]
  value: string
  onChange: (value: string) => void
  loading?: boolean
  error?: boolean
  errorText?: string
  invalid?: boolean
}

export function ClientCombobox({
  clients,
  value,
  onChange,
  loading = false,
  error = false,
  errorText = 'Erro ao carregar clientes',
  invalid = false,
}: ClientComboboxProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')

  const selected = clients.find((c) => c.id === value)

  const filtered = clients.filter((c) => {
    const q = query.toLowerCase()
    return (
      c.name?.toLowerCase().includes(q) ||
      c.alias?.toLowerCase().includes(q) ||
      c.code?.toLowerCase().includes(q) ||
      c.cnpj?.toLowerCase().includes(q)
    )
  })

  const displayLabel = selected
    ? selected.alias
      ? `${selected.name} (${selected.alias})`
      : selected.name
    : 'Selecione o cliente'

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              'w-full justify-between font-normal',
              !selected && 'text-muted-foreground',
              (invalid || error) && 'border-destructive',
            )}
          >
            {loading ? (
              <span className="flex items-center gap-2 text-muted-foreground">
                <Loader2 size={14} className="animate-spin" />
                Carregando clientes...
              </span>
            ) : error ? (
              <span className="flex items-center gap-2 text-destructive">
                <AlertCircle size={14} />
                {errorText}
              </span>
            ) : (
              <span className="truncate">{displayLabel}</span>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Buscar por nome, apelido, código..."
              value={query}
              onValueChange={setQuery}
            />
            <CommandList>
              <CommandEmpty>
                {loading ? 'Carregando...' : 'Nenhum cliente encontrado.'}
              </CommandEmpty>
              <CommandGroup>
                {filtered.map((c) => (
                  <CommandItem
                    key={c.id}
                    value={c.id}
                    onSelect={() => {
                      onChange(c.id === value ? '' : c.id)
                      setOpen(false)
                      setQuery('')
                    }}
                  >
                    <Check
                      className={cn('mr-2 h-4 w-4', value === c.id ? 'opacity-100' : 'opacity-0')}
                    />
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{c.name}</span>
                      {(c.alias || c.code) && (
                        <span className="text-xs text-muted-foreground">
                          {[c.alias, c.code].filter(Boolean).join(' • ')}
                        </span>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}
