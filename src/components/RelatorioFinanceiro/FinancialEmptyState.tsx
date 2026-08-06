import { FileSpreadsheet, Upload } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export function FinancialEmptyState({ onImport }: { onImport: () => void }) {
  return (
    <Card className="border-t-4 border-t-accent shadow-sm">
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="rounded-full bg-muted p-4 mb-4">
          <FileSpreadsheet size={32} className="text-muted-foreground/60" />
        </div>
        <p className="text-sm text-muted-foreground max-w-md mb-6">
          Nenhum relatório financeiro importado para este cliente no período selecionado.
        </p>
        <Button className="gap-2" onClick={onImport}>
          <Upload size={16} />
          Importar relatório mensal
        </Button>
      </div>
    </Card>
  )
}
