import { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Send, Bot, User } from 'lucide-react'
import { sendPaciniMessage } from '@/services/agent'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight)
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || loading) return
    const userMsg = input.trim()
    setInput('')
    setMessages((prev) => [...prev, { role: 'user', content: userMsg }])
    setLoading(true)
    setMessages((prev) => [...prev, { role: 'assistant', content: '' }])
    const controller = new AbortController()
    abortRef.current = controller
    try {
      const result = await sendPaciniMessage(
        userMsg,
        conversationId,
        (text) => {
          setMessages((prev) => {
            const next = [...prev]
            next[next.length - 1] = { role: 'assistant', content: text }
            return next
          })
        },
        controller.signal,
      )
      setConversationId(result.conversation_id)
    } catch {
      setMessages((prev) => {
        const next = [...prev]
        next[next.length - 1] = { role: 'assistant', content: 'Erro ao conectar com o assistente.' }
        return next
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full animate-fade-in">
      <Card className="flex-1 flex flex-col overflow-hidden">
        <CardHeader className="bg-primary text-primary-foreground">
          <CardTitle className="flex items-center gap-2 text-title-case">
            <Bot size={20} /> Especialista Pacini
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-muted-foreground py-12">
                <Bot size={48} className="mx-auto mb-4 opacity-50" />
                <p className="font-medium">Especialista Pacini</p>
                <p className="text-sm mt-1">
                  Faça perguntas sobre procedimentos internos, abertura de empresas, certificados e
                  mais.
                </p>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${m.role === 'user' ? 'bg-accent' : 'bg-primary'}`}
                >
                  {m.role === 'user' ? (
                    <User size={16} className="text-white" />
                  ) : (
                    <Bot size={16} className="text-white" />
                  )}
                </div>
                <div
                  className={`max-w-[80%] rounded-lg p-3 text-sm ${m.role === 'user' ? 'bg-accent text-white' : 'bg-muted'}`}
                >
                  <p className="whitespace-pre-wrap">{m.content || '...'}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="p-4 border-t flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSend()
                }
              }}
              placeholder="Digite sua pergunta..."
              disabled={loading}
            />
            <Button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="bg-primary hover:bg-primary/90"
            >
              <Send size={16} />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
