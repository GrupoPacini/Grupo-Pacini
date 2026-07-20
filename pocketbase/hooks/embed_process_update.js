onRecordAfterUpdateSuccess((e) => {
  const titleChanged = e.record.getString('title') !== e.record.original().getString('title')
  const notesChanged = e.record.getString('notes') !== e.record.original().getString('notes')
  if (!titleChanged && !notesChanged) return e.next()

  const text = (e.record.getString('title') + '\n\n' + e.record.getString('notes')).trim()
  if (!text) return e.next()
  try {
    const res = $ai.embed({ input: text })
    const record = $app.findRecordById('processes', e.record.id)
    record.set('embedding', res.data[0].embedding)
    $app.save(record)
  } catch (err) {
    $app
      .logger()
      .error('Process embedding update failed', 'recordId', e.record.id, 'error', err.message)
  }
  return e.next()
}, 'processes')
