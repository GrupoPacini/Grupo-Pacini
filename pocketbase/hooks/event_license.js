onRecordAfterCreateSuccess((e) => {
  var clientId = e.record.getString('client')
  if (!clientId) return e.next()
  try {
    var eventsCol = $app.findCollectionByNameOrId('client_events')
    var evt = new Record(eventsCol)
    evt.set('client', clientId)
    evt.set('event_type', 'license_created')
    evt.set('description', 'Licença criada: ' + e.record.getString('name'))
    if (e.auth) {
      evt.set('user', e.auth.id)
    }
    $app.save(evt)
  } catch (err) {
    $app.logger().error('Failed to create client event', 'error', String(err))
  }
  return e.next()
}, 'licenses')

onRecordAfterUpdateSuccess((e) => {
  var statusChanged = e.record.getString('status') !== e.record.original().getString('status')
  if (!statusChanged) return e.next()

  var clientId = e.record.getString('client')
  if (!clientId) return e.next()

  var newStatus = e.record.getString('status')
  var oldStatus = e.record.original().getString('status')
  var desc = 'Licença atualizada: ' + e.record.getString('name')
  var type = 'license_updated'

  if (newStatus === 'Renovando') {
    desc = 'Renovação iniciada: ' + e.record.getString('name')
    type = 'license_renewed'
  } else if (newStatus === 'Vencido') {
    desc = 'Licença vencida: ' + e.record.getString('name')
    type = 'license_expired'
  } else if (newStatus === 'Ativo' && (oldStatus === 'Renovando' || oldStatus === 'Vencido')) {
    desc = 'Licença renovada: ' + e.record.getString('name')
    type = 'license_renewed'
  }

  try {
    var eventsCol = $app.findCollectionByNameOrId('client_events')
    var evt = new Record(eventsCol)
    evt.set('client', clientId)
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
}, 'licenses')
