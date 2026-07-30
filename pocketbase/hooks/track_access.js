routerAdd(
  'POST',
  '/backend/v1/track-access',
  (e) => {
    const userId = e.auth && e.auth.id
    if (!userId) return e.unauthorizedError('auth required')
    try {
      const record = $app.findRecordById('users', userId)
      record.set('last_access', new Date().toISOString())
      $app.saveNoValidate(record)
      return e.json(200, { ok: true })
    } catch (err) {
      return e.json(500, { error: 'failed to update last_access' })
    }
  },
  $apis.requireAuth(),
)
