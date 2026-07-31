import pb from '@/lib/pocketbase/client'

export interface ClientEvent {
  id: string
  client: string
  event_type: string
  description: string
  user: string
  created: string
  updated: string
  expand?: {
    user?: { id: string; name: string }
  }
}

export const getClientEvents = (clientId: string) =>
  pb.collection<ClientEvent>('client_events').getFullList({
    filter: `client = '${clientId}'`,
    sort: '-created',
    expand: 'user',
  })
