import { formatBRL, type Transaction } from '@/lib/financial-utils'

export function exportToExcel(
  transactions: Transaction[],
  _clienteLabel: string,
  _periodLabel: string,
) {
  const headers = ['Data', 'Descrição', 'Categoria', 'Conta', 'Projeto', 'Tipo', 'Valor', 'Status']
  const rows = transactions.map((t) => [
    t.date,
    t.description,
    t.category,
    t.account,
    t.project,
    t.type,
    t.value.toFixed(2).replace('.', ','),
    t.status,
  ])
  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(';'))
    .join('\r\n')
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `relatorio-financeiro-${new Date().toISOString().split('T')[0]}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function exportToPDF(
  transactions: Transaction[],
  indicators: { receitas: number; despesas: number; resultado: number },
  clienteLabel: string,
  periodLabel: string,
) {
  const win = window.open('', '_blank', 'width=900,height=700')
  if (!win) return

  const tableRows = transactions
    .map(
      (t) =>
        `<tr><td>${t.date}</td><td>${t.description}</td><td>${t.category}</td><td>${t.account}</td><td>${t.project}</td><td>${t.type}</td><td style="text-align:right">${formatBRL(t.value)}</td><td>${t.status}</td></tr>`,
    )
    .join('')

  const resultClass = indicators.resultado >= 0 ? 'positive' : 'negative'

  win.document
    .write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Relatório Financeiro</title><style>
body{font-family:Arial,sans-serif;padding:40px;color:#1a1a1a}
h1{font-size:24px;margin-bottom:8px}
h2{font-size:18px;margin-top:24px;margin-bottom:12px}
.info{margin-bottom:20px;color:#555;font-size:14px}
.indicators{display:flex;gap:20px;margin-bottom:24px}
.indicator{padding:16px;border-radius:8px;border:1px solid #ddd;flex:1}
.indicator h3{font-size:12px;text-transform:uppercase;color:#888;margin:0 0 4px}
.indicator p{font-size:20px;font-weight:bold;margin:0}
table{width:100%;border-collapse:collapse;font-size:12px}
th{background:#f5f5f5;text-align:left;padding:8px;border-bottom:2px solid #ddd}
td{padding:6px 8px;border-bottom:1px solid #eee}
.positive{color:#16a34a}.negative{color:#dc2626}
@media print{body{padding:20px}}
</style></head><body>
<h1>Relatório Financeiro</h1>
<div class="info"><p><strong>Cliente:</strong> ${clienteLabel}</p><p><strong>Período:</strong> ${periodLabel}</p><p><strong>Gerado em:</strong> ${new Date().toLocaleString('pt-BR')}</p></div>
<div class="indicators">
<div class="indicator"><h3>Receitas</h3><p>${formatBRL(indicators.receitas)}</p></div>
<div class="indicator"><h3>Despesas</h3><p>${formatBRL(indicators.despesas)}</p></div>
<div class="indicator"><h3>Resultado</h3><p class="${resultClass}">${formatBRL(indicators.resultado)}</p></div>
</div>
<h2>Lançamentos (${transactions.length})</h2>
<table><thead><tr><th>Data</th><th>Descrição</th><th>Categoria</th><th>Conta</th><th>Projeto</th><th>Tipo</th><th style="text-align:right">Valor</th><th>Status</th></tr></thead>
<tbody>${tableRows}</tbody></table>
</body></html>`)
  win.document.close()
  setTimeout(() => win.print(), 500)
}
