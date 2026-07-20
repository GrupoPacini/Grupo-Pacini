onRecordAfterCreateSuccess((e) => {
  const title = e.record.getString('title') || ''
  const notes = e.record.getString('notes') || ''
  const text = (title + '\n\n' + notes).trim()
  if (!text) return e.next()
  try {
    const res = $ai.embed({ input: text })
    const record = $app.findRecordById('processes', e.record.id)
    record.set('embedding', res.data[0].embedding)
    $app.save(record)
  } catch (err) {
    $app.logger().error('Process embedding failed', 'recordId', e.record.id, 'error', err.message)
  }
  return e.next()
}, 'processes')
