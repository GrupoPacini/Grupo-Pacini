import pb from '@/lib/pocketbase/client'

export interface Playbook {
  id: string
  title: string
  content: string
  department: string
  expand?: { department?: { id: string; name: string } }
  created: string
  updated: string
}

export const getPlaybooks = () =>
  pb.collection<Playbook>('playbooks').getFullList({ expand: 'department', sort: '-created' })

export const createPlaybook = (data: { title: string; content: string; department: string }) =>
  pb.collection('playbooks').create(data)

export const updatePlaybook = (
  id: string,
  data: Partial<{ title: string; content: string; department: string }>,
) => pb.collection('playbooks').update(id, data)

export const deletePlaybook = (id: string) => pb.collection('playbooks').delete(id)

export const searchPlaybooks = async (query: string): Promise<{ items: Playbook[] }> =>
  pb.send('/backend/v1/search/playbooks', {
    method: 'POST',
    body: JSON.stringify({ query, k: 10 }),
    headers: { 'Content-Type': 'application/json' },
  })
