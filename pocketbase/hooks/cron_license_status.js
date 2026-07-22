cronAdd('license_status_automation', '0 2 * * *', () => {
  try {
    const licenses = $app.findRecordsByFilter('licenses', '', '', 1000, 0)

    const now = new Date()
    const todayStr = now.toISOString().split('T')[0]
    const thirtyDays = new Date()
    thirtyDays.setDate(thirtyDays.getDate() + 30)
    const thirtyStr = thirtyDays.toISOString().split('T')[0]

    let updated = 0

    for (const lic of licenses) {
      const currentStatus = lic.getString('status')
      if (currentStatus === 'Renovando' || currentStatus === 'Pendente') continue

      const semVencimento = lic.getBool('sem_vencimento')
      const expDate = lic.getString('expiration_date')

      let newStatus = ''

      if (semVencimento || !expDate) {
        newStatus = 'Ativo'
      } else {
        const expDateStr = expDate.substring(0, 10)
        if (expDateStr < todayStr) {
          newStatus = 'Vencido'
        } else if (expDateStr <= thirtyStr) {
          newStatus = 'Próxima ao Vencimento'
        } else {
          newStatus = 'Ativo'
        }
      }

      if (newStatus && newStatus !== currentStatus) {
        lic.set('status', newStatus)
        $app.save(lic)
        updated++
      }
    }

    $app
      .logger()
      .info('License status automation completed', 'processed', licenses.length, 'updated', updated)
  } catch (err) {
    $app.logger().error('License status automation failed', 'error', err.message)
  }
})
