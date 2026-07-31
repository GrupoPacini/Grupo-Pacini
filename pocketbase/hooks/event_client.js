onRecordAfterCreateSuccess((e) => {
  try {
    var eventsCol = $app.findCollectionByNameOrId('client_events')
    var evt = new Record(eventsCol)
    evt.set('client', e.record.id)
    evt.set('event_type', 'client_created')
    evt.set('description', 'Cliente criado')
    if (e.auth) {
      evt.set('user', e.auth.id)
    }
    $app.save(evt)
  } catch (err) {
    $app.logger().error('Failed to create client event', 'error', String(err))
  }
  return e.next()
}, 'clients')

onRecordAfterUpdateSuccess((e) => {
  try {
    var oldStatus = e.record.original().getString('onboarding_status')
    var newStatus = e.record.getString('onboarding_status')
    var oldRegime = e.record.original().getString('tax_regime')
    var newRegime = e.record.getString('tax_regime')

    var desc = 'Dados do cliente atualizados'
    var type = 'client_updated'

    if (oldStatus !== newStatus && newStatus) {
      desc = 'Status alterado para: ' + newStatus
      type = 'status_change'
    } else if (oldRegime !== newRegime && newRegime) {
      desc = 'Regime tributário alterado para: ' + newRegime
      type = 'regime_change'
    }

    var eventsCol = $app.findCollectionByNameOrId('client_events')
    var evt = new Record(eventsCol)
    evt.set('client', e.record.id)
    evt.set('event_type', type)
    evt.set('description', desc)
    if (e.auth) {
      evt.set('user', e.auth.id)
    }
    $app.save(evt)
  } catch (err) {
    $app.logger().error('Failed to create client event', 'error', String(err))
  }
  return e.next()
}, 'clients')
