onRecordCreateRequest((e) => {
  var clientId = e.record.getString('client')
  var userId = e.record.getString('user')
  if (!userId) {
    e.next()
    return
  }

  var existing = $app.findRecordsByFilter(
    'client_responsibles',
    "client = '" + clientId + "' && user = '" + userId + "'",
    'created',
    1,
    0,
  )
  if (existing.length > 0) {
    throw new BadRequestError('Este colaborador já está vinculado a este cliente')
  }
  e.next()
}, 'client_responsibles')

onRecordUpdateRequest((e) => {
  var clientId = e.record.getString('client')
  var userId = e.record.getString('user')
  if (!userId) {
    e.next()
    return
  }

  var existing = $app.findRecordsByFilter(
    'client_responsibles',
    "client = '" + clientId + "' && user = '" + userId + "' && id != '" + e.record.id + "'",
    'created',
    1,
    0,
  )
  if (existing.length > 0) {
    throw new BadRequestError('Este colaborador já está vinculado a este cliente')
  }
  e.next()
}, 'client_responsibles')
