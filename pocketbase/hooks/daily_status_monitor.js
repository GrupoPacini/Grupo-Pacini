cronAdd('daily_monitor', '0 0 * * *', () => {
  const now = new Date().toISOString().replace('T', ' ')
  const records = $app.findRecordsByFilter(
    'processes',
    `status != 'Concluído' && status != 'Atrasado' && due_date < {:now}`,
    '',
    1000,
    0,
    { now },
  )
  for (const rec of records) {
    rec.set('status', 'Atrasado')
    $app.save(rec)
  }
})
