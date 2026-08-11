onRecordCreateRequest(
  (e) => {
    const auth = e.requestInfo().auth
    if (!auth || e.hasSuperuserAuth()) {
      e.next()
      return
    }

    const collectionName = e.collection.name

    let profile = null
    try {
      const profileId = auth.getString('access_profile')
      if (profileId) {
        profile = $app.findRecordById('access_profiles', profileId)
      }
    } catch (err) {
      e.next()
      return
    }

    if (!profile || profile.getBool('system')) {
      e.next()
      return
    }

    let permissions = {}
    try {
      const permStr = profile.getString('permissions')
      if (permStr) {
        permissions = JSON.parse(permStr)
      }
    } catch (err) {
      e.next()
      return
    }

    const colPerm = permissions[collectionName]
    if (colPerm && typeof colPerm === 'object' && colPerm.create === false) {
      return e.forbiddenError('Você não tem permissão para criar registros em ' + collectionName)
    }

    e.next()
  },
  'clients',
  'processes',
  'licenses',
  'playbooks',
  'financial_transactions',
  'financial_report_imports',
  'process_models',
  'process_stages',
  'process_tasks',
  'socios',
  'client_cnaes',
  'client_responsibles',
  'client_events',
  'client_contacts',
  'process_model_stages',
  'process_model_tasks',
)

onRecordUpdateRequest(
  (e) => {
    const auth = e.requestInfo().auth
    if (!auth || e.hasSuperuserAuth()) {
      e.next()
      return
    }

    const collectionName = e.collection.name

    let profile = null
    try {
      const profileId = auth.getString('access_profile')
      if (profileId) {
        profile = $app.findRecordById('access_profiles', profileId)
      }
    } catch (err) {
      e.next()
      return
    }

    if (!profile || profile.getBool('system')) {
      e.next()
      return
    }

    let permissions = {}
    try {
      const permStr = profile.getString('permissions')
      if (permStr) {
        permissions = JSON.parse(permStr)
      }
    } catch (err) {
      e.next()
      return
    }

    const colPerm = permissions[collectionName]
    if (colPerm && typeof colPerm === 'object' && colPerm.update === false) {
      return e.forbiddenError('Você não tem permissão para editar registros em ' + collectionName)
    }

    e.next()
  },
  'clients',
  'processes',
  'licenses',
  'playbooks',
  'financial_transactions',
  'financial_report_imports',
  'process_models',
  'process_stages',
  'process_tasks',
  'socios',
  'client_cnaes',
  'client_responsibles',
  'client_events',
  'client_contacts',
  'process_model_stages',
  'process_model_tasks',
)

onRecordDeleteRequest(
  (e) => {
    const auth = e.requestInfo().auth
    if (!auth || e.hasSuperuserAuth()) {
      e.next()
      return
    }

    const collectionName = e.collection.name

    let profile = null
    try {
      const profileId = auth.getString('access_profile')
      if (profileId) {
        profile = $app.findRecordById('access_profiles', profileId)
      }
    } catch (err) {
      e.next()
      return
    }

    if (!profile || profile.getBool('system')) {
      e.next()
      return
    }

    let permissions = {}
    try {
      const permStr = profile.getString('permissions')
      if (permStr) {
        permissions = JSON.parse(permStr)
      }
    } catch (err) {
      e.next()
      return
    }

    const colPerm = permissions[collectionName]
    if (colPerm && typeof colPerm === 'object' && colPerm['delete'] === false) {
      return e.forbiddenError('Você não tem permissão para excluir registros em ' + collectionName)
    }

    e.next()
  },
  'clients',
  'processes',
  'licenses',
  'playbooks',
  'financial_transactions',
  'financial_report_imports',
  'process_models',
  'process_stages',
  'process_tasks',
  'socios',
  'client_cnaes',
  'client_responsibles',
  'client_events',
  'client_contacts',
  'process_model_stages',
  'process_model_tasks',
)
