import { useState } from 'react'
import { FileQuestion, Loader2, RotateCcw, Check, X as XIcon, Eye } from 'lucide-react'
import AIPanelShell from './AIPanelShell.jsx'
import { AISectionHeading } from './AIContentBlocks.jsx'
import AICreditsBadge from './AICreditsBadge.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { generateQuiz } from '../../services/aiService.js'

export default function QuizPanel({ open, onClose, resourceId, resourceType }) {
  const { user, updateCredits } = useAuth()
  const isPdf = resourceType === 'pdf'

  const [source, setSource] = useState(isPdf ? 'entire_pdf' : 'topic')
  const [topic, setTopic] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)
  const [answers, setAnswers] = useState({})
  const [revealedShort, setRevealedShort] = useState(new Set())

  const outOfCredits = user?.dailyCredits === 0

  const handleClose = () => {
    onClose()
    setTimeout(() => {
      setResult(null)
      setTopic('')
      setError('')
      setAnswers({})
      setRevealedShort(new Set())
    }, 200)
  }

  const handleGenerate = async () => {
    if (source === 'topic' && !topic.trim()) {
      setError('Enter a topic to generate a quiz from.')
      return
    }
    setError('')
    setLoading(true)
    try {
      const data = await generateQuiz(resourceId, { source, topic: topic.trim() })
      setResult(data.result)
      updateCredits(data.creditsRemaining)
      setAnswers({})
      setRevealedShort(new Set())
    } catch (err) {
      setError(err?.response?.data?.message || 'The AI request failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const selectAnswer = (qIndex, option) => {
    if (answers[qIndex] !== undefined) return // lock in the first choice
    setAnswers((a) => ({ ...a, [qIndex]: option }))
  }

  const toggleShortAnswer = (qIndex) => {
    setRevealedShort((prev) => {
      const next = new Set(prev)
      if (next.has(qIndex)) next.delete(qIndex)
      else next.add(qIndex)
      return next
    })
  }

  return (
    <AIPanelShell open={open} onClose={handleClose} title="AI Quiz Generator" icon={FileQuestion}>
      <div className="mb-5">
        <AICreditsBadge credits={user?.dailyCredits ?? 0} limit={user?.dailyCreditsLimit ?? 10} />
      </div>

      {!result ? (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-ink-muted mb-1.5">Generate from</label>
            <div className="flex gap-2">
              {isPdf && (
                <SourceOption
                  active={source === 'entire_pdf'}
                  onClick={() => setSource('entire_pdf')}
                  label="Entire PDF"
                />
              )}
              <SourceOption active={source === 'topic'} onClick={() => setSource('topic')} label="Selected Topic" />
            </div>
            {!isPdf && (
              <p className="mt-1.5 text-[11px] text-ink-faint">
                Whole-document quizzes currently support PDF resources only — generating from a topic
                works for any resource.
              </p>
            )}
          </div>

          {source === 'topic' && (
            <div>
              <label htmlFor="quiz-topic" className="block text-xs font-medium text-ink-muted mb-1.5">
                Topic
              </label>
              <input
                id="quiz-topic"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Memory management, Binary search trees…"
                className="w-full rounded-lg bg-white/[0.03] border border-white/10 px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-faint outline-none focus:border-primary/60 transition-colors"
              />
            </div>
          )}

          <p className="text-[13px] text-ink-muted leading-relaxed">
            Generates 10 multiple choice questions and 5 short answer questions.
          </p>

          {error && <p className="text-[13px] text-red-400">{error}</p>}

          {outOfCredits && !error && (
            <p className="text-[13px] text-red-400">
              You have reached today&rsquo;s AI limit. Your credits will reset tomorrow.
            </p>
          )}

          <button
            onClick={handleGenerate}
            disabled={loading || outOfCredits}
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary hover:bg-primary-dark transition-colors px-4 py-2.5 text-sm font-medium text-white shadow-glow disabled:opacity-60"
          >
            {loading && <Loader2 size={15} className="animate-spin" />}
            {loading ? 'Generating quiz…' : 'Generate Quiz (1 credit)'}
          </button>
        </div>
      ) : (
        <div className="space-y-7">
          <section>
            <AISectionHeading>MULTIPLE CHOICE ({result.mcqs.length})</AISectionHeading>
            <div className="space-y-4">
              {result.mcqs.map((q, qIndex) => {
                const selected = answers[qIndex]
                const answered = selected !== undefined

                return (
                  <div key={qIndex} className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
                    <p className="text-sm text-ink font-medium mb-3">
                      {qIndex + 1}. {q.question}
                    </p>
                    <div className="space-y-1.5">
                      {q.options.map((option) => {
                        const isCorrect = option === q.correctAnswer
                        const isSelected = option === selected

                        let optionStyle = 'border-white/10 text-ink-muted hover:border-white/20'
                        if (answered && isCorrect) {
                          optionStyle = 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                        } else if (answered && isSelected && !isCorrect) {
                          optionStyle = 'border-red-500/40 bg-red-500/10 text-red-300'
                        }

                        return (
                          <button
                            key={option}
                            onClick={() => selectAnswer(qIndex, option)}
                            disabled={answered}
                            className={`w-full flex items-center justify-between gap-2 text-left rounded-lg border px-3 py-2 text-[13px] transition-colors disabled:cursor-default ${optionStyle}`}
                          >
                            <span>{option}</span>
                            {answered && isCorrect && <Check size={14} className="text-emerald-400 shrink-0" />}
                            {answered && isSelected && !isCorrect && (
                              <XIcon size={14} className="text-red-400 shrink-0" />
                            )}
                          </button>
                        )
                      })}
                    </div>
                    {answered && (
                      <p className="mt-3 text-[12.5px] text-ink-muted leading-relaxed border-t border-white/[0.06] pt-3">
                        {q.explanation}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          </section>

          <section>
            <AISectionHeading>SHORT ANSWER ({result.shortAnswer.length})</AISectionHeading>
            <div className="space-y-4">
              {result.shortAnswer.map((q, qIndex) => {
                const revealed = revealedShort.has(qIndex)
                return (
                  <div key={qIndex} className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
                    <p className="text-sm text-ink font-medium mb-3">
                      {qIndex + 1}. {q.question}
                    </p>
                    {revealed ? (
                      <div className="border-t border-white/[0.06] pt-3">
                        <p className="text-[13px] text-primary-light font-medium">{q.correctAnswer}</p>
                        <p className="mt-1.5 text-[12.5px] text-ink-muted leading-relaxed">{q.explanation}</p>
                      </div>
                    ) : (
                      <button
                        onClick={() => toggleShortAnswer(qIndex)}
                        className="inline-flex items-center gap-1.5 text-[12.5px] text-ink-muted hover:text-ink transition-colors"
                      >
                        <Eye size={13} />
                        Show answer
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </section>

          <button
            onClick={() => {
              setResult(null)
              setAnswers({})
              setRevealedShort(new Set())
            }}
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 hover:border-white/20 hover:bg-white/[0.03] transition-colors px-4 py-2.5 text-sm font-medium text-ink"
          >
            <RotateCcw size={14} />
            Generate another quiz
          </button>
        </div>
      )}
    </AIPanelShell>
  )
}

function SourceOption({ active, onClick, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
        active
          ? 'border-primary/30 bg-primary/10 text-primary-light'
          : 'border-white/10 text-ink-muted hover:border-white/20'
      }`}
    >
      {label}
    </button>
  )
}
