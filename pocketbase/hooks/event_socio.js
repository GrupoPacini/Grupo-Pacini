onRecordAfterCreateSuccess((e) => {
  var clientId = e.record.getString('client')
  if (!clientId) return e.next()
  try {
    var eventsCol = $app.findCollectionByNameOrId('client_events')
    var evt = new Record(eventsCol)
    evt.set('client', clientId)
    evt.set('event_type', 'socio_created')
    evt.set('description', 'Sócio adicionado: ' + e.record.getString('nome'))
    if (e.auth) {
      evt.set('user', e.auth.id)
    }
    $app.save(evt)
  } catch (err) {
    $app.logger().error('Failed to create client event', 'error', String(err))
  }
  return e.next()
}, 'socios')

onRecordAfterUpdateSuccess((e) => {
  var clientId = e.record.getString('client')
  if (!clientId) return e.next()
  try {
    var eventsCol = $app.findCollectionByNameOrId('client_events')
    var evt = new Record(eventsCol)
    evt.set('client', clientId)
    evt.set('event_type', 'socio_updated')
    evt.set('description', 'Sócio atualizado: ' + e.record.getString('nome'))
    if (e.auth) {
      evt.set('user', e.auth.id)
    }
    $app.save(evt)
  } catch (err) {
    $app.logger().error('Failed to create client event', 'error', String(err))
  }
  return e.next()
}, 'socios')

onRecordAfterDeleteSuccess((e) => {
  var clientId = e.record.getString('client')
  if (!clientId) return e.next()
  try {
    var eventsCol = $app.findCollectionByNameOrId('client_events')
    var evt = new Record(eventsCol)
    evt.set('client', clientId)
    evt.set('event_type', 'socio_deleted')
    evt.set('description', 'Sócio removido: ' + e.record.getString('nome'))
    if (e.auth) {
      evt.set('user', e.auth.id)
    }
    $app.save(evt)
  } catch (err) {
    $app.logger().error('Failed to create client event', 'error', String(err))
  }
  return e.next()
}, 'socios')
