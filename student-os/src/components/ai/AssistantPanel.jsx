import { useEffect, useRef, useState } from 'react'
import { Bot, Loader2, RotateCcw, Send, User as UserIcon } from 'lucide-react'
import AIPanelShell from './AIPanelShell.jsx'
import AICreditsBadge from './AICreditsBadge.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { fetchActiveConversation, startNewConversation, sendAssistantMessage } from '../../services/aiService.js'
import { MAX_ASSISTANT_MESSAGE_CHARS } from '../../constants/ai.js'

/**
 * Chat, scoped to one resource. Unlike Explain/Summarize/Quiz this has real
 * state to load on open (the active conversation + its messages) and keeps
 * growing while open — see aiController.js / geminiService.js on the
 * backend for how history/context get capped before each Gemini call.
 */
export default function AssistantPanel({ open, onClose, resourceId }) {
  const { user, updateCredits } = useAuth()
  const [conversationId, setConversationId] = useState(null)
  const [messages, setMessages] = useState([])
  const [loadingConversation, setLoadingConversation] = useState(true)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [resettingChat, setResettingChat] = useState(false)
  const scrollRef = useRef(null)

  const outOfCredits = user?.dailyCredits === 0
  const overLimit = input.length > MAX_ASSISTANT_MESSAGE_CHARS

  useEffect(() => {
    if (!open || !resourceId) return
    let cancelled = false
    setLoadingConversation(true)
    setError('')
    fetchActiveConversation(resourceId)
      .then((data) => {
        if (cancelled) return
        setConversationId(data.conversation.id)
        setMessages(data.messages)
      })
      .catch((err) => {
        if (cancelled) return
        setError(err?.response?.data?.message || 'Could not load the Assistant for this resource.')
      })
      .finally(() => !cancelled && setLoadingConversation(false))
    return () => {
      cancelled = true
    }
  }, [open, resourceId])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, sending])

  const handleSend = async (e) => {
    e.preventDefault()
    const content = input.trim()
    if (!content || overLimit || sending || outOfCredits || !conversationId) return

    setError('')
    setSending(true)
    // Optimistic: show the student's message immediately, before the
    // Assistant's reply comes back.
    const optimisticId = `optimistic-${Date.now()}`
    setMessages((prev) => [...prev, { id: optimisticId, role: 'user', content }])
    setInput('')

    try {
      const data = await sendAssistantMessage(conversationId, content)
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== optimisticId),
        data.userMessage,
        data.assistantMessage,
      ])
      updateCredits(data.creditsRemaining)
    } catch (err) {
      // Roll back the optimistic message so it doesn't look like it sent
      // successfully, and give the student their typed text back.
      setMessages((prev) => prev.filter((m) => m.id !== optimisticId))
      setInput(content)
      setError(err?.response?.data?.message || 'The AI request failed. Please try again — your credits were not used.')
    } finally {
      setSending(false)
    }
  }

  const handleNewChat = async () => {
    if (resettingChat) return
    setResettingChat(true)
    setError('')
    try {
      const data = await startNewConversation(resourceId)
      setConversationId(data.conversation.id)
      setMessages(data.messages)
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not start a new chat. Please try again.')
    } finally {
      setResettingChat(false)
    }
  }

  const handleClose = () => {
    onClose()
    setTimeout(() => {
      setInput('')
      setError('')
    }, 200)
  }

  return (
    <AIPanelShell open={open} onClose={handleClose} title="AI Study Assistant" icon={Bot}>
      <div className="flex items-center justify-between mb-4 -mt-1">
        <AICreditsBadge credits={user?.dailyCredits ?? 0} limit={user?.dailyCreditsLimit ?? 10} />
        <button
          onClick={handleNewChat}
          disabled={resettingChat || loadingConversation}
          className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 hover:border-white/20 hover:bg-white/[0.03] transition-colors px-3 py-1.5 text-[11px] font-medium text-ink-muted disabled:opacity-50"
        >
          {resettingChat ? <Loader2 size={12} className="animate-spin" /> : <RotateCcw size={12} />}
          New Chat
        </button>
      </div>

      <div
        ref={scrollRef}
        className="h-[46vh] min-h-[280px] overflow-y-auto rounded-xl border border-white/[0.07] bg-white/[0.02] p-4 space-y-4"
      >
        {loadingConversation ? (
          <div className="h-full flex items-center justify-center text-ink-faint">
            <Loader2 size={18} className="animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-6">
            <span className="w-10 h-10 rounded-xl bg-primary/15 border border-primary/25 flex items-center justify-center mb-3">
              <Bot size={17} className="text-primary-light" />
            </span>
            <p className="text-sm text-ink">Ask me anything about this document</p>
            <p className="mt-1 text-[12px] text-ink-faint leading-relaxed">
              I can explain concepts, clarify confusing parts, or quiz you — all based on what's actually in this
              file.
            </p>
          </div>
        ) : (
          messages.map((m) => <ChatBubble key={m.id} message={m} />)
        )}

        {sending && (
          <div className="flex items-start gap-2.5">
            <span className="w-7 h-7 rounded-lg bg-primary/15 border border-primary/25 flex items-center justify-center shrink-0">
              <Bot size={13} className="text-primary-light" />
            </span>
            <div className="rounded-xl rounded-tl-sm bg-white/[0.04] border border-white/[0.07] px-3.5 py-2.5">
              <Loader2 size={14} className="animate-spin text-ink-faint" />
            </div>
          </div>
        )}
      </div>

      {error && <p className="mt-3 text-[13px] text-red-400">{error}</p>}
      {outOfCredits && !error && (
        <p className="mt-3 text-[13px] text-red-400">
          You have reached today&rsquo;s AI limit. Your credits will reset tomorrow.
        </p>
      )}

      <form onSubmit={handleSend} className="mt-3 flex items-end gap-2.5">
        <div className="flex-1">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSend(e)
              }
            }}
            rows={1}
            disabled={loadingConversation || outOfCredits}
            placeholder="Ask a question about this document…"
            className={`w-full rounded-lg bg-white/[0.03] border ${
              overLimit ? 'border-red-500/50' : 'border-white/10'
            } px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-faint outline-none focus:border-primary/60 transition-colors resize-none disabled:opacity-60`}
          />
        </div>
        <button
          type="submit"
          disabled={sending || overLimit || outOfCredits || loadingConversation || !input.trim()}
          className="inline-flex items-center justify-center rounded-lg bg-primary hover:bg-primary-dark transition-colors w-10 h-10 shrink-0 text-white shadow-glow disabled:opacity-50"
          aria-label="Send message"
        >
          {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
        </button>
      </form>
      <p className={`mt-1.5 text-right text-[11px] ${overLimit ? 'text-red-400' : 'text-ink-faint'}`}>
        {input.length.toLocaleString()} / {MAX_ASSISTANT_MESSAGE_CHARS.toLocaleString()} · 1 credit per message
      </p>
    </AIPanelShell>
  )
}

function ChatBubble({ message }) {
  const isUser = message.role === 'user'
  return (
    <div className={`flex items-start gap-2.5 ${isUser ? 'flex-row-reverse' : ''}`}>
      <span
        className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 ${
          isUser ? 'bg-white/[0.06] border-white/10' : 'bg-primary/15 border-primary/25'
        }`}
      >
        {isUser ? <UserIcon size={13} className="text-ink-muted" /> : <Bot size={13} className="text-primary-light" />}
      </span>
      <div
        className={`max-w-[80%] rounded-xl px-3.5 py-2.5 text-[13px] leading-relaxed whitespace-pre-line ${
          isUser
            ? 'bg-primary/15 border border-primary/25 text-ink rounded-tr-sm'
            : 'bg-white/[0.04] border border-white/[0.07] text-ink rounded-tl-sm'
        }`}
      >
        {message.content}
      </div>
    </div>
  )
}
