import Resource from '../models/Resource.js'
import getResourceText, { UnsupportedResourceTypeError } from './extractResourceText.js'
import { summarizeText, generateQuiz } from '../services/geminiService.js'

/**
 * Generates and caches the AI Summary and whole-PDF Quiz for a resource, so
 * that when any student later clicks Summarize / Generate Quiz -> Entire PDF,
 * the request is served straight from MongoDB with no Gemini call on the
 * critical path — the goal being that this work happens once, right after
 * upload, rather than once per student per click (which is what would make
 * "everyone opens the same file during exam week" actually risky).
 *
 * This is NOT charged against anyone's daily AI credits — it's a platform
 * cost tied to the upload itself, not a student action.
 *
 * Called two ways:
 *   - fire-and-forget, queued via utils/aiPregenQueue.js, right after a
 *     successful (non-duplicate) PDF upload in resourceController.js
 *   - directly, from scripts/backfillAIContent.js, for resources that
 *     existed before this feature shipped
 *
 * Never throws — failures are recorded on the resource (`aiPregenStatus:
 * 'failed'`) so Summarize/Quiz simply fall back to live generation the
 * first time a student requests them, same as any resource where pre-gen
 * hasn't run yet.
 */
export default async function pregenerateResourceAI(resourceId) {
  const resource = await Resource.findById(resourceId).select('+extractedText +aiSummaryCache +aiQuizCache')
  if (!resource) return

  if (resource.resourceType !== 'pdf') {
    resource.aiPregenStatus = 'unsupported'
    await resource.save()
    return
  }

  try {
    const text = await getResourceText(resource) // also caches extractedText itself

    const [summary, quiz] = await Promise.all([summarizeText(text), generateQuiz({ sourceText: text })])

    resource.aiSummaryCache = summary
    resource.aiQuizCache = quiz
    resource.aiPregenStatus = 'ready'
    resource.aiPregenAt = new Date()
    await resource.save()

    console.log(`[ai-pregen] ready for resource ${resourceId}`)
  } catch (err) {
    if (err instanceof UnsupportedResourceTypeError) {
      resource.aiPregenStatus = 'unsupported'
    } else {
      console.error(`[ai-pregen] failed for resource ${resourceId}:`, err.message)
      resource.aiPregenStatus = 'failed'
    }
    await resource.save()
  }
}
