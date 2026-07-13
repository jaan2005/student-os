import Resource from '../models/Resource.js'
import {
  AI_CREDIT_COSTS,
  AI_LIMIT_REACHED_MESSAGE,
  DAILY_AI_CREDITS,
  MAX_EXPLAIN_INPUT_CHARS,
} from '../config/constants.js'
import ensureDailyCreditWindow, { reserveCredits, refundCredits } from '../utils/dailyCredits.js'
import getResourceText from '../utils/extractResourceText.js'
import { explainTopic, summarizeText, generateQuiz } from '../services/geminiService.js'

function creditsPayload(dailyCredits) {
  return { creditsRemaining: dailyCredits, dailyCreditsLimit: DAILY_AI_CREDITS }
}

/**
 * EXPLAIN_LIMITATION: the spec calls for explaining either a manually typed
 * topic OR text highlighted inside the PDF. The Resource Details page's PDF
 * preview is rendered via Google's document viewer in a cross-origin
 * <iframe> (see PDFViewer.jsx / lib/previewUrl.js) — the browser has no
 * access to read a text selection from inside that iframe's DOM, so true
 * "highlight to explain" isn't technically wireable without switching to a
 * same-origin PDF renderer (a separate, larger change). In the meantime,
 * the frontend's Explain input accepts pasted text, so a user can still
 * select text in the preview, copy it, and paste it in — functionally the
 * same input to this endpoint either way, since it just takes a string.
 */

/**
 * POST /api/ai/explain
 * Body: { resourceId, inputText }
 * Always a live Gemini call — there's no fixed set of topics to pre-generate
 * against, since a student can type or paste anything.
 */
export async function explain(req, res) {
  const { resourceId, inputText } = req.body

  if (!resourceId) return res.status(400).json({ message: 'resourceId is required.' })
  if (!inputText?.trim()) {
    return res.status(400).json({ message: 'Enter a topic, or paste some text, to explain.' })
  }
  if (inputText.length > MAX_EXPLAIN_INPUT_CHARS) {
    return res.status(400).json({
      message: `That's a lot of text — please keep it under ${MAX_EXPLAIN_INPUT_CHARS.toLocaleString()} characters.`,
    })
  }

  const resource = await Resource.findById(resourceId)
  if (!resource) return res.status(404).json({ message: 'Resource not found.' })

  await ensureDailyCreditWindow(req.user)
  const reserved = await reserveCredits(req.user._id, AI_CREDIT_COSTS.explain)
  if (!reserved) {
    return res.status(403).json({ message: AI_LIMIT_REACHED_MESSAGE, ...creditsPayload(req.user.dailyCredits) })
  }

  let result
  try {
    result = await explainTopic(inputText.trim())
  } catch (err) {
    await refundCredits(req.user._id, AI_CREDIT_COSTS.explain)
    console.error('[ai] explain failed:', err)
    return res.status(502).json({ message: 'The AI request failed. Please try again — your credits were not used.' })
  }

  res.status(200).json({ result, cached: false, ...creditsPayload(reserved.dailyCredits) })
}

/**
 * POST /api/ai/summarize
 * Body: { resourceId }
 *
 * Serves the pre-generated Summary instantly (no credit spent, no Gemini
 * call) whenever one exists — see utils/pregenerateResourceAI.js. Only
 * falls through to a live call for resources uploaded before pre-generation
 * existed, or where it failed; that live path still costs a credit, since
 * it's the same real work Explain/live-Quiz do.
 */
export async function summarize(req, res) {
  const { resourceId } = req.body

  if (!resourceId) return res.status(400).json({ message: 'resourceId is required.' })

  const resource = await Resource.findById(resourceId).select('+extractedText +aiSummaryCache')
  if (!resource) return res.status(404).json({ message: 'Resource not found.' })

  await ensureDailyCreditWindow(req.user)

  if (resource.aiSummaryCache) {
    return res.status(200).json({
      result: resource.aiSummaryCache,
      cached: true,
      ...creditsPayload(req.user.dailyCredits),
    })
  }

  const reserved = await reserveCredits(req.user._id, AI_CREDIT_COSTS.summarize)
  if (!reserved) {
    return res.status(403).json({ message: AI_LIMIT_REACHED_MESSAGE, ...creditsPayload(req.user.dailyCredits) })
  }

  let result
  try {
    const text = await getResourceText(resource)
    result = await summarizeText(text)
    // Cache it now so the next student to open this resource gets the
    // instant path too, even though this particular request was live.
    resource.aiSummaryCache = result
    if (resource.aiPregenStatus !== 'ready') resource.aiPregenStatus = 'ready'
    await resource.save()
  } catch (err) {
    await refundCredits(req.user._id, AI_CREDIT_COSTS.summarize)
    if (err.statusCode) return res.status(err.statusCode).json({ message: err.message })
    console.error('[ai] summarize failed:', err)
    return res.status(502).json({ message: 'The AI request failed. Please try again — your credits were not used.' })
  }

  res.status(200).json({ result, cached: false, ...creditsPayload(reserved.dailyCredits) })
}

/**
 * POST /api/ai/quiz
 * Body: { resourceId, source: 'entire_pdf' | 'topic', topic? }
 *
 * Only `source: 'entire_pdf'` can be pre-generated/cached (it's the same
 * quiz for every student who opens that file). `source: 'topic'` is always
 * live, since the topic is arbitrary per request.
 */
export async function quiz(req, res) {
  const { resourceId, source, topic } = req.body

  if (!resourceId) return res.status(400).json({ message: 'resourceId is required.' })
  if (!['entire_pdf', 'topic'].includes(source)) {
    return res.status(400).json({ message: 'source must be "entire_pdf" or "topic".' })
  }
  if (source === 'topic' && !topic?.trim()) {
    return res.status(400).json({ message: 'Enter a topic to generate a quiz from.' })
  }

  const resource = await Resource.findById(resourceId).select('+extractedText +aiQuizCache')
  if (!resource) return res.status(404).json({ message: 'Resource not found.' })

  await ensureDailyCreditWindow(req.user)

  if (source === 'entire_pdf' && resource.aiQuizCache) {
    return res.status(200).json({
      result: resource.aiQuizCache,
      cached: true,
      ...creditsPayload(req.user.dailyCredits),
    })
  }

  const reserved = await reserveCredits(req.user._id, AI_CREDIT_COSTS.quiz)
  if (!reserved) {
    return res.status(403).json({ message: AI_LIMIT_REACHED_MESSAGE, ...creditsPayload(req.user.dailyCredits) })
  }

  let result
  try {
    const sourceText = source === 'entire_pdf' ? await getResourceText(resource) : undefined
    result = await generateQuiz({ sourceText, topic: topic?.trim() })

    if (source === 'entire_pdf') {
      resource.aiQuizCache = result
      if (resource.aiPregenStatus !== 'ready') resource.aiPregenStatus = 'ready'
      await resource.save()
    }
  } catch (err) {
    await refundCredits(req.user._id, AI_CREDIT_COSTS.quiz)
    if (err.statusCode) return res.status(err.statusCode).json({ message: err.message })
    console.error('[ai] quiz failed:', err)
    return res.status(502).json({ message: 'The AI request failed. Please try again — your credits were not used.' })
  }

  res.status(200).json({ result, cached: false, ...creditsPayload(reserved.dailyCredits) })
}
