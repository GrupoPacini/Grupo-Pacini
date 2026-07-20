routerAdd(
  'POST',
  '/backend/v1/search/processes',
  (e) => {
    const body = e.requestInfo().body || {}
    const query = (body.query || '').trim()
    if (!query) return e.badRequestError('Query is required')

    try {
      const embedRes = $ai.embed({ input: query })
      const results = $vectors.search(e, 'processes', {
        field: 'embedding',
        query: embedRes.data[0].embedding,
        k: body.k || 10,
        expand: ['client', 'department', 'responsible'],
      })
      return e.json(200, results)
    } catch (err) {
      return e.internalServerError('Search failed')
    }
  },
  $apis.requireAuth(),
)
