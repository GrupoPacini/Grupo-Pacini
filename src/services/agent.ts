import pb from '@/lib/pocketbase/client'
import { streamAgentChat, type StreamAgentChatResult } from '@/lib/skipAi'

export async function sendPaciniMessage(
  message: string,
  conversationId: string | null,
  onChunk: (text: string) => void,
  signal: AbortSignal,
): Promise<StreamAgentChatResult> {
  const res = await fetch(`${import.meta.env.VITE_POCKETBASE_URL}/backend/v1/pacini/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: pb.authStore.token,
    },
    body: JSON.stringify({ message, conversation_id: conversationId }),
    signal,
  })
  return streamAgentChat(res, {
    onChunk: (_delta, full) => onChunk(full),
    signal,
  })
}
