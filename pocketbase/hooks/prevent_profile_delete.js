onRecordDeleteRequest((e) => {
  var profileId = e.record.id
  var linkedUsers = $app.findRecordsByFilter(
    'users',
    "access_profile = '" + profileId + "'",
    '',
    0,
    0,
  )
  if (linkedUsers.length > 0) {
    throw new BadRequestError('Nao e possivel excluir um perfil que possui usuarios vinculados.')
  }
  e.next()
}, 'access_profiles')
