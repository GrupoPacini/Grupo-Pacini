import { Checkbox } from '@/components/ui/checkbox'
import { Lock } from 'lucide-react'
import type { ModuleConfig } from '@/lib/permissions-config'

interface PermissionModuleRowProps {
  config: ModuleConfig
  selectedActions: string[]
  locked: boolean
  onToggleModule: (checked: boolean) => void
  onToggleAction: (action: string, checked: boolean) => void
}

export function PermissionModuleRow({
  config,
  selectedActions,
  locked,
  onToggleModule,
  onToggleAction,
}: PermissionModuleRowProps) {
  const allChecked = config.actions.every((a) => selectedActions.includes(a))
  const someChecked = selectedActions.length > 0 && !allChecked

  return (
    <div className="rounded-lg border border-border bg-card p-3 transition-colors hover:bg-muted/20">
      <div className="flex items-center gap-2 mb-2">
        <Checkbox
          id={`mod-${config.module}`}
          checked={allChecked ? true : someChecked ? 'indeterminate' : false}
          disabled={locked}
          onCheckedChange={(v) => onToggleModule(v === true)}
        />
        <label
          htmlFor={`mod-${config.module}`}
          className="text-sm font-semibold cursor-pointer flex items-center gap-1.5"
        >
          {config.module}
          {locked && <Lock size={12} className="text-muted-foreground" />}
        </label>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-2 pl-6">
        {config.actions.map((action) => (
          <label key={action} className="flex items-center gap-1.5 cursor-pointer">
            <Checkbox
              checked={selectedActions.includes(action)}
              disabled={locked}
              onCheckedChange={(v) => onToggleAction(action, v === true)}
            />
            <span className="text-xs text-muted-foreground capitalize">{action}</span>
          </label>
        ))}
      </div>
    </div>
  )
}
