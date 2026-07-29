import Resource from '../models/Resource.js'
import Conversation from '../models/Conversation.js'
import Message from '../models/Message.js'
import {
  AI_CREDIT_COSTS,
  AI_LIMIT_REACHED_MESSAGE,
  DAILY_AI_CREDITS,
  MAX_EXPLAIN_INPUT_CHARS,
  AI_ASSISTANT_HISTORY_LIMIT,
  AI_ASSISTANT_CONTEXT_CHAR_LIMIT,
  MAX_ASSISTANT_MESSAGE_CHARS,
} from '../config/constants.js'
import ensureDailyCreditWindow, { reserveCredits, refundCredits } from '../utils/dailyCredits.js'
import getResourceText, { UnsupportedResourceTypeError } from '../utils/extractResourceText.js'
import { explainTopic, summarizeText, generateQuiz, askAssistant } from '../services/geminiService.js'
import { canViewResource } from './resourceController.js'

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

/**
 * Shared by getActiveConversation and startNewConversation: loads the
 * resource, checks it's visible to this user (reuses the exact same rule
 * resourceController uses for direct-ID access — a career resource that's
 * pending/rejected and not theirs, or an academic resource from another
 * college, is "not found" here too), and confirms it's a type the
 * Assistant can actually read.
 */
async function loadAssistantEligibleResource(req, res) {
  const resource = await Resource.findById(req.params.resourceId)
  if (!resource || !canViewResource(resource, req.user)) {
    res.status(404).json({ message: 'Resource not found.' })
    return null
  }
  if (resource.resourceType !== 'pdf') {
    res.status(400).json({
      message: 'The AI Study Assistant currently supports PDF resources only.',
    })
    return null
  }
  return resource
}

/**
 * GET /api/ai/assistant/:resourceId
 * Returns this user's active conversation for this resource (creating one,
 * empty, if none exists yet — that costs nothing, no Gemini call happens
 * until the first message is actually sent) along with its messages.
 */
export async function getActiveConversation(req, res) {
  const resource = await loadAssistantEligibleResource(req, res)
  if (!resource) return

  let conversation = await Conversation.findOne({
    user: req.user._id,
    resource: resource._id,
    status: 'active',
  })
  if (!conversation) {
    conversation = await Conversation.create({ user: req.user._id, resource: resource._id })
  }

  const messages = await Message.find({ conversation: conversation._id }).sort({ createdAt: 1 })

  res.status(200).json({
    conversation: { id: conversation._id, createdAt: conversation.createdAt },
    messages: messages.map((m) => ({ id: m._id, role: m.role, content: m.content, createdAt: m.createdAt })),
  })
}

/**
 * POST /api/ai/assistant/:resourceId/new
 * Archives the current active conversation (if any) and starts a fresh
 * one — the "start over" a student cramming the night before an exam
 * wants, without last week's tangents in context. History isn't deleted,
 * just no longer the one new messages attach to or that gets sent as
 * context.
 */
export async function startNewConversation(req, res) {
  const resource = await loadAssistantEligibleResource(req, res)
  if (!resource) return

  await Conversation.updateMany(
    { user: req.user._id, resource: resource._id, status: 'active' },
    { $set: { status: 'archived' } }
  )
  const conversation = await Conversation.create({ user: req.user._id, resource: resource._id })

  res.status(201).json({
    conversation: { id: conversation._id, createdAt: conversation.createdAt },
    messages: [],
  })
}

/**
 * POST /api/ai/assistant/:conversationId/message
 * Body: { content }
 *
 * Same credit flow as Explain/Summarize/Quiz (reserve -> attempt -> spend
 * only on success, refund on failure), just applied per message instead of
 * per click — see AI_CREDIT_COSTS.assistant. History sent to Gemini is
 * capped to the most recent AI_ASSISTANT_HISTORY_LIMIT messages (already
 * stored ones are unaffected — the full thread stays in Mongo and in the
 * UI); document context is capped separately (AI_ASSISTANT_CONTEXT_CHAR_LIMIT).
 */
export async function sendMessage(req, res) {
  const { content } = req.body
  if (!content?.trim()) {
    return res.status(400).json({ message: 'Enter a message to send.' })
  }
  if (content.length > MAX_ASSISTANT_MESSAGE_CHARS) {
    return res.status(400).json({
      message: `That message is too long — please keep it under ${MAX_ASSISTANT_MESSAGE_CHARS.toLocaleString()} characters.`,
    })
  }

  const conversation = await Conversation.findById(req.params.conversationId)
  // Conversations are private — not even an admin can read/post into
  // someone else's, unlike Career Resources' admin-visibility exception.
  if (!conversation || conversation.user.toString() !== req.user._id.toString()) {
    return res.status(404).json({ message: 'Conversation not found.' })
  }

  const resource = await Resource.findById(conversation.resource).select('+extractedText')
  if (!resource) return res.status(404).json({ message: 'The resource for this conversation no longer exists.' })

  await ensureDailyCreditWindow(req.user)
  const reserved = await reserveCredits(req.user._id, AI_CREDIT_COSTS.assistant)
  if (!reserved) {
    return res.status(403).json({ message: AI_LIMIT_REACHED_MESSAGE, ...creditsPayload(req.user.dailyCredits) })
  }

  const userMessage = await Message.create({ conversation: conversation._id, role: 'user', content: content.trim() })

  let assistantReply
  try {
    const documentText = await getResourceText(resource)
    const recentMessages = await Message.find({ conversation: conversation._id })
      .sort({ createdAt: -1 })
      .limit(AI_ASSISTANT_HISTORY_LIMIT)
    const history = recentMessages
      .reverse()
      .filter((m) => m.id !== userMessage.id)
      .map((m) => ({ role: m.role, content: m.content }))

    assistantReply = await askAssistant({
      documentText: documentText.slice(0, AI_ASSISTANT_CONTEXT_CHAR_LIMIT),
      history,
      userMessage: content.trim(),
    })
  } catch (err) {
    await refundCredits(req.user._id, AI_CREDIT_COSTS.assistant)
    await Message.findByIdAndDelete(userMessage._id)
    if (err instanceof UnsupportedResourceTypeError || err.statusCode) {
      return res.status(err.statusCode || 400).json({ message: err.message })
    }
    console.error('[ai] assistant message failed:', err)
    return res.status(502).json({ message: 'The AI request failed. Please try again — your credits were not used.' })
  }

  const assistantMessage = await Message.create({
    conversation: conversation._id,
    role: 'assistant',
    content: assistantReply,
  })
  conversation.lastMessageAt = new Date()
  await conversation.save()

  res.status(200).json({
    userMessage: { id: userMessage._id, role: 'user', content: userMessage.content, createdAt: userMessage.createdAt },
    assistantMessage: {
      id: assistantMessage._id,
      role: 'assistant',
      content: assistantMessage.content,
      createdAt: assistantMessage.createdAt,
    },
    ...creditsPayload(reserved.dailyCredits),
  })
}
