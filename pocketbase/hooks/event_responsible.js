onRecordAfterCreateSuccess((e) => {
  var clientId = e.record.getString('client')
  if (!clientId) return e.next()
  try {
    var userName = ''
    var userId = e.record.getString('user')
    if (userId) {
      try {
        userName = $app.findRecordById('users', userId).getString('name')
      } catch (_) {}
    }
    var desc = userName ? 'Responsável adicionado: ' + userName : 'Responsável adicionado'
    var eventsCol = $app.findCollectionByNameOrId('client_events')
    var evt = new Record(eventsCol)
    evt.set('client', clientId)
    evt.set('event_type', 'responsible_added')
    evt.set('description', desc)
    if (e.auth) {
      evt.set('user', e.auth.id)
    }
    $app.save(evt)
  } catch (err) {
    $app.logger().error('Failed to create client event', 'error', String(err))
  }
  return e.next()
}, 'client_responsibles')

onRecordAfterDeleteSuccess((e) => {
  var clientId = e.record.getString('client')
  if (!clientId) return e.next()
  try {
    var userName = ''
    var userId = e.record.getString('user')
    if (userId) {
      try {
        userName = $app.findRecordById('users', userId).getString('name')
      } catch (_) {}
    }
    var desc = userName ? 'Responsável removido: ' + userName : 'Responsável removido'
    var eventsCol = $app.findCollectionByNameOrId('client_events')
    var evt = new Record(eventsCol)
    evt.set('client', clientId)
    evt.set('event_type', 'responsible_removed')
    evt.set('description', desc)
    if (e.auth) {
      evt.set('user', e.auth.id)
    }
    $app.save(evt)
  } catch (err) {
    $app.logger().error('Failed to create client event', 'error', String(err))
  }
  return e.next()
}, 'client_responsibles')
