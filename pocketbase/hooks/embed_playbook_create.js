onRecordAfterCreateSuccess((e) => {
  const title = e.record.getString('title') || ''
  const content = e.record.getString('content') || ''
  const text = (title + '\n\n' + content).trim()
  if (!text) return e.next()
  try {
    const res = $ai.embed({ input: text })
    const record = $app.findRecordById('playbooks', e.record.id)
    record.set('embedding', res.data[0].embedding)
    $app.save(record)
  } catch (err) {
    $app.logger().error('Playbook embedding failed', 'recordId', e.record.id, 'error', err.message)
  }
  return e.next()
}, 'playbooks')
