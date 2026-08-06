import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Brain, Loader2, AlertCircle } from 'lucide-react'
import { type DataState } from '@/lib/financial-utils'

interface FinancialAnalysisCardProps {
  state: DataState
  analysis: string | null
}

export function FinancialAnalysisCard({ state, analysis }: FinancialAnalysisCardProps) {
  return (
    <Card className="border-t-4 border-t-accent shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Brain size={18} className="text-primary" />
          <CardTitle className="text-base font-semibold">Análise Financeira</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {state === 'loading' ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <Loader2 size={24} className="animate-spin mb-2 text-primary/60" />
            <p className="text-sm">Gerando análise...</p>
          </div>
        ) : state === 'error' ? (
          <div className="flex flex-col items-center justify-center py-8 text-destructive">
            <AlertCircle size={24} className="mb-2 text-destructive/60" />
            <p className="text-sm">Erro ao gerar análise</p>
          </div>
        ) : state === 'ready' && analysis ? (
          <div className="py-2">
            <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">
              {analysis}
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Brain size={24} className="text-muted-foreground/40 mb-2" />
            <p className="text-sm text-muted-foreground">
              Selecione um cliente e um período para visualizar a análise financeira.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
