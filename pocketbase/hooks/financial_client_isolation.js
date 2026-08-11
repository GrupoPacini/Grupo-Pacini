onRecordListRequest(
  (e) => {
    if (e.hasSuperuserAuth()) {
      e.next()
      return
    }
    var auth = e.auth
    if (!auth) {
      e.next()
      return
    }

    var profileId = auth.getString('access_profile')
    if (!profileId) {
      e.next()
      return
    }

    var profile
    try {
      profile = $app.findRecordById('access_profiles', profileId)
    } catch (_) {
      e.next()
      return
    }

    if (profile.getString('name') !== 'Cliente') {
      e.next()
      return
    }

    var clientId = auth.getString('client')
    if (!clientId) {
      throw new ForbiddenError('Seu usuário não possui uma empresa vinculada.')
    }

    e.next()
  },
  'financial_transactions',
  'financial_report_imports',
)

onRecordViewRequest(
  (e) => {
    if (e.hasSuperuserAuth()) {
      e.next()
      return
    }
    var auth = e.auth
    if (!auth) {
      e.next()
      return
    }

    var profileId = auth.getString('access_profile')
    if (!profileId) {
      e.next()
      return
    }

    var profile
    try {
      profile = $app.findRecordById('access_profiles', profileId)
    } catch (_) {
      e.next()
      return
    }

    if (profile.getString('name') !== 'Cliente') {
      e.next()
      return
    }

    var clientId = auth.getString('client')
    if (!clientId) {
      throw new ForbiddenError('Seu usuário não possui uma empresa vinculada.')
    }

    e.next()
  },
  'financial_transactions',
  'financial_report_imports',
)

onRecordCreateRequest(
  (e) => {
    if (e.hasSuperuserAuth()) {
      e.next()
      return
    }
    var auth = e.auth
    if (!auth) {
      e.next()
      return
    }

    var profileId = auth.getString('access_profile')
    if (!profileId) {
      e.next()
      return
    }

    var profile
    try {
      profile = $app.findRecordById('access_profiles', profileId)
    } catch (_) {
      e.next()
      return
    }

    if (profile.getString('name') === 'Cliente') {
      throw new ForbiddenError('Clientes não têm permissão para criar registros financeiros.')
    }
    e.next()
  },
  'financial_transactions',
  'financial_report_imports',
)

onRecordUpdateRequest(
  (e) => {
    if (e.hasSuperuserAuth()) {
      e.next()
      return
    }
    var auth = e.auth
    if (!auth) {
      e.next()
      return
    }

    var profileId = auth.getString('access_profile')
    if (!profileId) {
      e.next()
      return
    }

    var profile
    try {
      profile = $app.findRecordById('access_profiles', profileId)
    } catch (_) {
      e.next()
      return
    }

    if (profile.getString('name') === 'Cliente') {
      throw new ForbiddenError('Clientes não têm permissão para alterar registros financeiros.')
    }
    e.next()
  },
  'financial_transactions',
  'financial_report_imports',
)

onRecordDeleteRequest(
  (e) => {
    if (e.hasSuperuserAuth()) {
      e.next()
      return
    }
    var auth = e.auth
    if (!auth) {
      e.next()
      return
    }

    var profileId = auth.getString('access_profile')
    if (!profileId) {
      e.next()
      return
    }

    var profile
    try {
      profile = $app.findRecordById('access_profiles', profileId)
    } catch (_) {
      e.next()
      return
    }

    if (profile.getString('name') === 'Cliente') {
      throw new ForbiddenError('Clientes não têm permissão para excluir registros financeiros.')
    }
    e.next()
  },
  'financial_transactions',
  'financial_report_imports',
)
