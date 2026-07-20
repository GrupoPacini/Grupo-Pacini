import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getProcesses, getClients, Process } from '@/services/api'
import { useRealtime } from '@/hooks/use-realtime'
import { FileCheck, AlertCircle, Clock, Users, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { format, isAfter, isBefore } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default function Index() {
  const [processes, setProcesses] = useState<Process[]>([])
  const [clientCount, setClientCount] = useState(0)

  const loadData = async () => {
    try {
      const p = await getProcesses()
      setProcesses(p)
      const c = await getClients()
      setClientCount(c.length)
    } catch {
      /* intentionally ignored */
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useRealtime('processes', () => loadData())
  useRealtime('clients', () => loadData())

  const pendentes = processes.filter(
    (p) => p.status === 'Pendente' || p.status === 'Em Andamento',
  ).length
  const atrasados = processes.filter((p) => p.status === 'Atrasado').length
  const concluidos = processes.filter((p) => p.status === 'Concluído').length

  // Chart Data
  const deptCounts = processes.reduce(
    (acc, p) => {
      const name = p.expand?.department?.name || 'Outro'
      acc[name] = (acc[name] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  const chartData = Object.entries(deptCounts).map(([name, value]) => ({ name, value }))

  const chartConfig = {
    value: { label: 'Processos' },
    Fiscal: { color: 'hsl(var(--chart-1))' },
    Contábil: { color: 'hsl(var(--chart-2))' },
    'Departamento Pessoal': { color: 'hsl(var(--chart-3))' },
    Legal: { color: 'hsl(var(--chart-4))' },
  }

  // Timeline Data
  const upcomingDeadlines = processes
    .filter((p) => p.due_date && p.status !== 'Concluído')
    .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
    .slice(0, 5)

  const recentActivity = [...processes]
    .sort((a, b) => new Date(b.updated).getTime() - new Date(a.updated).getTime())
    .slice(0, 5)

  return (
    <div className="space-y-8 animate-fade-in pb-8">
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover:scale-[1.02] transition-transform duration-200 border-l-4 border-l-primary">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground text-title-case">
                  Processos Pendentes
                </p>
                <p className="text-3xl font-bold text-primary">{pendentes}</p>
              </div>
              <div className="p-3 bg-primary/10 rounded-lg">
                <Clock className="text-primary" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:scale-[1.02] transition-transform duration-200 border-l-4 border-l-destructive">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground text-title-case">
                  Processos Atrasados
                </p>
                <p className="text-3xl font-bold text-destructive">{atrasados}</p>
              </div>
              <div className="p-3 bg-destructive/10 rounded-lg">
                <AlertCircle className="text-destructive" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:scale-[1.02] transition-transform duration-200 border-l-4 border-l-green-500">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground text-title-case">
                  Concluídos No Mês
                </p>
                <p className="text-3xl font-bold text-green-600">{concluidos}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <FileCheck className="text-green-600" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:scale-[1.02] transition-transform duration-200 border-l-4 border-l-accent">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground text-title-case">
                  Total De Clientes
                </p>
                <p className="text-3xl font-bold text-accent">{clientCount}</p>
              </div>
              <div className="p-3 bg-accent/10 rounded-lg">
                <Users className="text-accent" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Chart */}
        <Card className="lg:col-span-1 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg text-primary text-title-case">
              Distribuição De Processos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <ChartContainer config={chartConfig} className="h-[250px] w-full">
                <PieChart>
                  <Pie
                    data={chartData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={2}
                  >
                    {chartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={`var(--color-${entry.name.replace(/\s+/g, '')})`}
                        style={{ fill: `hsl(var(--chart-${(index % 5) + 1}))` }}
                      />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ChartContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">
                Sem dados suficientes
              </div>
            )}
          </CardContent>
        </Card>

        {/* Timeline */}
        <Card className="lg:col-span-2 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg text-primary text-title-case">
              Linha Do Tempo De Prazos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingDeadlines.length === 0 && (
                <p className="text-sm text-muted-foreground">Nenhum prazo próximo.</p>
              )}
              {upcomingDeadlines.map((p, i) => {
                const date = new Date(p.due_date)
                const overdue = isBefore(date, new Date())
                return (
                  <div key={p.id} className="flex gap-4 items-start">
                    <div className="flex flex-col items-center mt-1">
                      <div
                        className={`w-3 h-3 rounded-full ${overdue ? 'bg-destructive' : 'bg-accent'}`}
                      />
                      {i !== upcomingDeadlines.length - 1 && (
                        <div className="w-0.5 h-12 bg-border my-1" />
                      )}
                    </div>
                    <div className="bg-muted/30 rounded-md p-3 flex-1 flex justify-between items-center border border-border/50 hover:bg-muted/50 transition-colors">
                      <div>
                        <p className="font-medium text-sm text-foreground">{p.title}</p>
                        <p className="text-xs text-muted-foreground">{p.expand?.client?.name}</p>
                      </div>
                      <div className="text-right">
                        <p
                          className={`text-sm font-bold ${overdue ? 'text-destructive' : 'text-primary'}`}
                        >
                          {format(date, "dd 'de' MMM", { locale: ptBR })}
                        </p>
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                          {p.status}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Table */}
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg text-primary text-title-case">Atividade Recente</CardTitle>
          <Link to="/processos" className="text-sm text-accent hover:underline flex items-center">
            Ver Todos <ChevronRight size={14} />
          </Link>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium rounded-tl-md">Processo</th>
                  <th className="px-4 py-3 font-medium">Cliente</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium rounded-tr-md text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {recentActivity.map((p) => (
                  <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium text-foreground">{p.title}</td>
                    <td className="px-4 py-3 text-muted-foreground">{p.expand?.client?.name}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          p.status === 'Concluído'
                            ? 'bg-green-100 text-green-800'
                            : p.status === 'Atrasado'
                              ? 'bg-red-100 text-red-800'
                              : p.status === 'Em Andamento'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        to={`/processos?id=${p.id}`}
                        className="text-primary hover:text-accent font-medium text-xs"
                      >
                        Detalhes
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
