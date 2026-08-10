onRecordAfterCreateSuccess((e) => {
  var clientId = e.record.getString('client')
  if (!clientId) return e.next()
  try {
    var eventsCol = $app.findCollectionByNameOrId('client_events')
    var evt = new Record(eventsCol)
    evt.set('client', clientId)
    evt.set('event_type', 'process_created')
    evt.set('description', 'Processo criado: ' + e.record.getString('title'))
    if (e.auth) {
      evt.set('user', e.auth.id)
    }
    $app.save(evt)
  } catch (err) {
    $app.logger().error('Failed to create client event', 'error', String(err))
  }
  return e.next()
}, 'processes')

onRecordAfterUpdateSuccess((e) => {
  var fields = [
    'title',
    'status',
    'notes',
    'due_date',
    'responsible',
    'department',
    'start_date',
    'priority',
  ]
  var hasChange = false
  for (var i = 0; i < fields.length; i++) {
    if (e.record.getString(fields[i]) !== e.record.original().getString(fields[i])) {
      hasChange = true
      break
    }
  }
  if (!hasChange) return e.next()

  var clientId = e.record.getString('client')
  if (!clientId) return e.next()

  var statusChanged = e.record.getString('status') !== e.record.original().getString('status')
  var desc = 'Processo atualizado: ' + e.record.getString('title')
  var type = 'process_updated'

  if (statusChanged) {
    var newStatus = e.record.getString('status')
    if (newStatus === 'Concluído') {
      desc = 'Processo concluído: ' + e.record.getString('title')
      type = 'process_completed'
    } else {
      desc = 'Status do processo alterado para: ' + newStatus
      type = 'process_status_change'
    }
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
}, 'processes')
