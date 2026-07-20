cronAdd('check_overdue_processes', '0 1 * * *', () => {
  const now = new Date().toISOString()

  try {
    const processes = $app.findRecordsByFilter(
      'processes',
      "status != 'Concluído' && status != 'Atrasado' && due_date != '' && due_date < ?",
      '',
      1000,
      0,
      now,
    )
    for (let p of processes) {
      p.set('status', 'Atrasado')
      $app.save(p)
    }
  } catch (err) {
    $app.logger().error('Process overdue check failed', 'error', err.message)
  }

  try {
    const licenses = $app.findRecordsByFilter(
      'licenses',
      "status != 'Expirado' && expiration_date != '' && expiration_date < ?",
      '',
      1000,
      0,
      now,
    )
    for (let l of licenses) {
      l.set('status', 'Expirado')
      $app.save(l)
    }
  } catch (err) {
    $app.logger().error('License expiration check failed', 'error', err.message)
  }
})
