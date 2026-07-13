import { useState } from 'react'
import { FileText, Loader2, RotateCcw } from 'lucide-react'
import AIPanelShell from './AIPanelShell.jsx'
import { AISectionHeading, AIBulletList } from './AIContentBlocks.jsx'
import AICreditsBadge from './AICreditsBadge.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { summarizeResource } from '../../services/aiService.js'

export default function SummarizePanel({ open, onClose, resourceId, resourceType }) {
  const { user, updateCredits } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)

  const outOfCredits = user?.dailyCredits === 0
  const isPdf = resourceType === 'pdf'

  const handleClose = () => {
    onClose()
    setTimeout(() => {
      setResult(null)
      setError('')
    }, 200)
  }

  const handleSummarize = async () => {
    setError('')
    setLoading(true)
    try {
      const data = await summarizeResource(resourceId)
      setResult(data.result)
      updateCredits(data.creditsRemaining)
    } catch (err) {
      setError(err?.response?.data?.message || 'The AI request failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AIPanelShell open={open} onClose={handleClose} title="AI Summarize" icon={FileText}>
      <div className="mb-5">
        <AICreditsBadge credits={user?.dailyCredits ?? 0} limit={user?.dailyCreditsLimit ?? 10} />
      </div>

      {!result ? (
        <div className="space-y-4">
          {!isPdf ? (
            <p className="text-[13px] text-ink-muted leading-relaxed">
              AI Summarize currently supports PDF resources only. This resource isn&rsquo;t a PDF, so
              summarization isn&rsquo;t available for it yet — try AI Explain with a manually entered
              topic instead.
            </p>
          ) : (
            <p className="text-[13px] text-ink-muted leading-relaxed">
              Generates a short summary, key concepts, important definitions and formulae, revision
              notes, and exam tips from this entire document.
            </p>
          )}

          {error && <p className="text-[13px] text-red-400">{error}</p>}

          {outOfCredits && !error && (
            <p className="text-[13px] text-red-400">
              You have reached today&rsquo;s AI limit. Your credits will reset tomorrow.
            </p>
          )}

          <button
            onClick={handleSummarize}
            disabled={loading || outOfCredits || !isPdf}
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary hover:bg-primary-dark transition-colors px-4 py-2.5 text-sm font-medium text-white shadow-glow disabled:opacity-60"
          >
            {loading && <Loader2 size={15} className="animate-spin" />}
            {loading ? 'Summarizing…' : 'Summarize PDF (1 credit)'}
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          <section>
            <AISectionHeading>SHORT SUMMARY</AISectionHeading>
            <p className="text-sm text-ink leading-relaxed">{result.shortSummary}</p>
          </section>

          <section>
            <AISectionHeading>KEY CONCEPTS</AISectionHeading>
            <AIBulletList items={result.keyConcepts} />
          </section>

          {result.importantDefinitions?.length > 0 && (
            <section>
              <AISectionHeading>IMPORTANT DEFINITIONS</AISectionHeading>
              <div className="space-y-2.5">
                {result.importantDefinitions.map((d, i) => (
                  <div key={i} className="rounded-lg border border-white/[0.07] bg-white/[0.02] px-3.5 py-2.5">
                    <p className="text-[13px] font-medium text-ink">{d.term}</p>
                    <p className="text-[12.5px] text-ink-muted leading-relaxed mt-0.5">{d.definition}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {result.importantFormulae?.length > 0 && (
            <section>
              <AISectionHeading>IMPORTANT FORMULAE</AISectionHeading>
              <div className="space-y-1.5">
                {result.importantFormulae.map((f, i) => (
                  <p
                    key={i}
                    className="font-mono text-[12.5px] text-primary-light bg-primary/[0.06] border border-primary/15 rounded-lg px-3 py-2"
                  >
                    {f}
                  </p>
                ))}
              </div>
            </section>
          )}

          <section>
            <AISectionHeading>REVISION NOTES</AISectionHeading>
            <AIBulletList items={result.revisionNotes} />
          </section>

          <section>
            <AISectionHeading>EXAM TIPS</AISectionHeading>
            <AIBulletList items={result.examTips} />
          </section>

          <button
            onClick={() => setResult(null)}
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 hover:border-white/20 hover:bg-white/[0.03] transition-colors px-4 py-2.5 text-sm font-medium text-ink"
          >
            <RotateCcw size={14} />
            Summarize again
          </button>
        </div>
      )}
    </AIPanelShell>
  )
}
