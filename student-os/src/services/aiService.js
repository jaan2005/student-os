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
