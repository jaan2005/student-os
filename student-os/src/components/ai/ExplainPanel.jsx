import { useState } from 'react'
import { Lightbulb, Loader2, RotateCcw } from 'lucide-react'
import AIPanelShell from './AIPanelShell.jsx'
import { AISectionHeading, AIBulletList, AIPillList } from './AIContentBlocks.jsx'
import AICreditsBadge from './AICreditsBadge.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { explainTopic } from '../../services/aiService.js'
import { MAX_EXPLAIN_INPUT_CHARS } from '../../constants/ai.js'

export default function ExplainPanel({ open, onClose, resourceId }) {
  const { user, updateCredits } = useAuth()
  const [inputText, setInputText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)

  const outOfCredits = user?.dailyCredits === 0
  const overLimit = inputText.length > MAX_EXPLAIN_INPUT_CHARS

  const handleClose = () => {
    onClose()
    // Reset after the close animation so the form doesn't visibly flash
    // back to empty while the panel is still fading out.
    setTimeout(() => {
      setInputText('')
      setResult(null)
      setError('')
    }, 200)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!inputText.trim()) {
      setError('Enter a topic, or paste some highlighted text, to explain.')
      return
    }
    if (overLimit) {
      setError(`That's a lot of text — please keep it under ${MAX_EXPLAIN_INPUT_CHARS.toLocaleString()} characters.`)
      return
    }
    setError('')
    setLoading(true)
    try {
      const data = await explainTopic(resourceId, inputText.trim())
      setResult(data.result)
      updateCredits(data.creditsRemaining)
    } catch (err) {
      setError(err?.response?.data?.message || 'The AI request failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AIPanelShell open={open} onClose={handleClose} title="AI Explain" icon={Lightbulb}>
      <div className="mb-5">
        <AICreditsBadge credits={user?.dailyCredits ?? 0} limit={user?.dailyCreditsLimit ?? 10} />
      </div>

      {!result ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="explain-input" className="block text-xs font-medium text-ink-muted mb-1.5">
              Topic or highlighted text
            </label>
            <textarea
              id="explain-input"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              rows={4}
              placeholder="Type a topic (e.g. “binary search trees”), or paste text you selected from the PDF preview…"
              className={`w-full rounded-lg bg-white/[0.03] border ${
                overLimit ? 'border-red-500/50' : 'border-white/10'
              } px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-faint outline-none focus:border-primary/60 transition-colors resize-none`}
            />
            <p className={`mt-1 text-right text-[11px] ${overLimit ? 'text-red-400' : 'text-ink-faint'}`}>
              {inputText.length.toLocaleString()} / {MAX_EXPLAIN_INPUT_CHARS.toLocaleString()}
            </p>
          </div>

          {error && <p className="text-[13px] text-red-400">{error}</p>}

          {outOfCredits && !error && (
            <p className="text-[13px] text-red-400">
              You have reached today&rsquo;s AI limit. Your credits will reset tomorrow.
            </p>
          )}

          <button
            type="submit"
            disabled={loading || outOfCredits || overLimit}
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary hover:bg-primary-dark transition-colors px-4 py-2.5 text-sm font-medium text-white shadow-glow disabled:opacity-60"
          >
            {loading && <Loader2 size={15} className="animate-spin" />}
            {loading ? 'Explaining…' : 'Explain (1 credit)'}
          </button>
        </form>
      ) : (
        <div className="space-y-5">
          <section>
            <AISectionHeading>SIMPLE EXPLANATION</AISectionHeading>
            <p className="text-sm text-ink leading-relaxed">{result.simpleExplanation}</p>
          </section>

          <section>
            <AISectionHeading>DETAILED EXPLANATION</AISectionHeading>
            <p className="text-[13px] text-ink-muted leading-relaxed whitespace-pre-line">
              {result.detailedExplanation}
            </p>
          </section>

          <section>
            <AISectionHeading>REAL-WORLD EXAMPLE</AISectionHeading>
            <p className="text-[13px] text-ink-muted leading-relaxed">{result.realWorldExample}</p>
          </section>

          <div className="grid sm:grid-cols-2 gap-5">
            <section>
              <AISectionHeading>ADVANTAGES</AISectionHeading>
              <AIBulletList items={result.advantages} />
            </section>
            <section>
              <AISectionHeading>DISADVANTAGES</AISectionHeading>
              <AIBulletList items={result.disadvantages} />
            </section>
          </div>

          <section>
            <AISectionHeading>RELATED TOPICS</AISectionHeading>
            <AIPillList items={result.relatedTopics} />
          </section>

          <section>
            <AISectionHeading>INTERVIEW QUESTIONS</AISectionHeading>
            <AIBulletList items={result.interviewQuestions} />
          </section>

          <section>
            <AISectionHeading>MEMORY TRICKS</AISectionHeading>
            <AIBulletList items={result.memoryTricks} />
          </section>

          <button
            onClick={() => {
              setResult(null)
              setInputText('')
            }}
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 hover:border-white/20 hover:bg-white/[0.03] transition-colors px-4 py-2.5 text-sm font-medium text-ink"
          >
            <RotateCcw size={14} />
            Explain something else
          </button>
        </div>
      )}
    </AIPanelShell>
  )
}
