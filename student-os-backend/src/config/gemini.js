import { GoogleGenerativeAI } from '@google/generative-ai'

if (!process.env.GEMINI_API_KEY) {
  console.error('[gemini] Missing GEMINI_API_KEY in environment variables.')
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

// Configurable so the model can be updated without a code change as Google
// ships newer versions — check https://ai.google.dev/gemini-api/docs/models
// for the current list. Defaults to a stable, current-generation model.
export const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash'

export default genAI
