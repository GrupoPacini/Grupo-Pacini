import { useEffect, useState } from 'react'
import { Client, getClients } from '@/services/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Search, Building2, FileText, BadgePercent } from 'lucide-react'

export default function Clientes() {
  const [clients, setClients] = useState<Client[]>([])
  const [search, setSearch] = useState('')

  useEffect(() => {
    getClients().then(setClients).catch()
  }, [])

  const filtered = clients.filter(
    (c) => c.name.toLowerCase().includes(search.toLowerCase()) || c.cnpj.includes(search),
  )

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative w-full sm:max-w-md">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            size={18}
          />
          <Input
            placeholder="Buscar por nome ou CNPJ..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filtered.length === 0 ? (
          <div className="col-span-full py-12 text-center text-muted-foreground">
            Nenhum cliente encontrado.
          </div>
        ) : (
          filtered.map((c) => (
            <Card
              key={c.id}
              className="hover:shadow-md transition-shadow border-t-4 border-t-accent"
            >
              <CardHeader className="pb-2">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Building2 className="text-primary" size={20} />
                  </div>
                  <div>
                    <CardTitle className="text-base text-foreground line-clamp-1" title={c.name}>
                      {c.name}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                      <FileText size={14} /> {c.cnpj}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mt-4 pt-4 border-t border-border flex justify-between items-center text-sm">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <BadgePercent size={14} /> Regime:
                  </span>
                  <span className="font-medium text-foreground bg-muted px-2 py-1 rounded-sm">
                    {c.tax_regime}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
