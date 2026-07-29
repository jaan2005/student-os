import api from '../lib/api.js'

/**
 * All three return { result, creditsRemaining, dailyCreditsLimit }.
 * Axios rejects on non-2xx, so callers catch to read err.response.data.message
 * (e.g. the credit-limit-reached message, or a Gemini failure).
 */

export function explainTopic(resourceId, inputText) {
  return api.post('/ai/explain', { resourceId, inputText }).then((res) => res.data)
}

export function summarizeResource(resourceId) {
  return api.post('/ai/summarize', { resourceId }).then((res) => res.data)
}

/**
 * source: 'entire_pdf' | 'topic'. topic required when source is 'topic'.
 */
export function generateQuiz(resourceId, { source, topic } = {}) {
  return api.post('/ai/quiz', { resourceId, source, topic }).then((res) => res.data)
}

/**
 * AI Study Assistant. Returns { conversation, messages }. Creating the
 * active conversation is free (no credit spent) — only sendAssistantMessage
 * costs a credit, and only on success.
 */
export function fetchActiveConversation(resourceId) {
  return api.get(`/ai/assistant/${resourceId}`).then((res) => res.data)
}

export function startNewConversation(resourceId) {
  return api.post(`/ai/assistant/${resourceId}/new`).then((res) => res.data)
}

/**
 * Returns { userMessage, assistantMessage, creditsRemaining, dailyCreditsLimit }.
 */
export function sendAssistantMessage(conversationId, content) {
  return api.post(`/ai/assistant/${conversationId}/message`, { content }).then((res) => res.data)
}
