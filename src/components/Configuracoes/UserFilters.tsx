import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Search, X } from 'lucide-react'
import type { DepartmentRecord } from '@/services/departments'

interface UserFiltersProps {
  search: string
  onSearchChange: (v: string) => void
  profileFilter: string
  onProfileFilterChange: (v: string) => void
  statusFilter: string
  onStatusFilterChange: (v: string) => void
  departmentFilter: string
  onDepartmentFilterChange: (v: string) => void
  departments: DepartmentRecord[]
  onClear: () => void
  hasFilters: boolean
}

export function UserFilters({
  search,
  onSearchChange,
  profileFilter,
  onProfileFilterChange,
  statusFilter,
  onStatusFilterChange,
  departmentFilter,
  onDepartmentFilterChange,
  departments,
  onClear,
  hasFilters,
}: UserFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-4 flex-wrap">
      <div className="relative flex-1 min-w-[200px]">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          placeholder="Buscar por nome ou e-mail..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>
      <Select value={profileFilter} onValueChange={onProfileFilterChange}>
        <SelectTrigger className="w-full sm:w-[180px]">
          <SelectValue placeholder="Perfil" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os perfis</SelectItem>
          <SelectItem value="admin">Administrador</SelectItem>
          <SelectItem value="colaborador">Colaborador</SelectItem>
        </SelectContent>
      </Select>
      <Select value={statusFilter} onValueChange={onStatusFilterChange}>
        <SelectTrigger className="w-full sm:w-[180px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os status</SelectItem>
          <SelectItem value="Ativo">Ativo</SelectItem>
          <SelectItem value="Inativo">Inativo</SelectItem>
          <SelectItem value="Bloqueado">Bloqueado</SelectItem>
          <SelectItem value="Convite pendente">Convite pendente</SelectItem>
        </SelectContent>
      </Select>
      <Select value={departmentFilter} onValueChange={onDepartmentFilterChange}>
        <SelectTrigger className="w-full sm:w-[180px]">
          <SelectValue placeholder="Departamento" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os departamentos</SelectItem>
          {departments.map((d) => (
            <SelectItem key={d.id} value={d.id}>
              {d.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {hasFilters && (
        <Button variant="outline" size="sm" onClick={onClear} className="gap-2">
          <X size={14} />
          Limpar filtros
        </Button>
      )}
    </div>
  )
}
