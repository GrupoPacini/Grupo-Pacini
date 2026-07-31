onRecordAfterCreateSuccess((e) => {
  var clientId = e.record.getString('client')
  if (!clientId) return e.next()
  try {
    var eventsCol = $app.findCollectionByNameOrId('client_events')
    var evt = new Record(eventsCol)
    evt.set('client', clientId)
    evt.set('event_type', 'cnae_created')
    evt.set('description', 'CNAE adicionado: ' + e.record.getString('code'))
    if (e.auth) {
      evt.set('user', e.auth.id)
    }
    $app.save(evt)
  } catch (err) {
    $app.logger().error('Failed to create client event', 'error', String(err))
  }
  return e.next()
}, 'client_cnaes')

onRecordAfterUpdateSuccess((e) => {
  var clientId = e.record.getString('client')
  if (!clientId) return e.next()
  try {
    var eventsCol = $app.findCollectionByNameOrId('client_events')
    var evt = new Record(eventsCol)
    evt.set('client', clientId)
    evt.set('event_type', 'cnae_updated')
    evt.set('description', 'CNAE atualizado: ' + e.record.getString('code'))
    if (e.auth) {
      evt.set('user', e.auth.id)
    }
    $app.save(evt)
  } catch (err) {
    $app.logger().error('Failed to create client event', 'error', String(err))
  }
  return e.next()
}, 'client_cnaes')

onRecordAfterDeleteSuccess((e) => {
  var clientId = e.record.getString('client')
  if (!clientId) return e.next()
  try {
    var eventsCol = $app.findCollectionByNameOrId('client_events')
    var evt = new Record(eventsCol)
    evt.set('client', clientId)
    evt.set('event_type', 'cnae_deleted')
    evt.set('description', 'CNAE removido: ' + e.record.getString('code'))
    if (e.auth) {
      evt.set('user', e.auth.id)
    }
    $app.save(evt)
  } catch (err) {
    $app.logger().error('Failed to create client event', 'error', String(err))
  }
  return e.next()
}, 'client_cnaes')
