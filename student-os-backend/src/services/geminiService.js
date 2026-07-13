import { SchemaType } from '@google/generative-ai'
import genAI, { GEMINI_MODEL } from '../config/gemini.js'

const STRING_ARRAY = { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } }

async function generateStructured(prompt, responseSchema) {
  const model = genAI.getGenerativeModel({
    model: GEMINI_MODEL,
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema,
      temperature: 0.4,
    },
  })

  const result = await model.generateContent(prompt)
  const text = result.response.text()
  return JSON.parse(text)
}

/**
 * AI Explain — works from either a manually typed topic or text pasted from
 * a highlighted PDF selection (functionally identical input to the backend:
 * a string to explain). See EXPLAIN_LIMITATION note in aiController.js for
 * why true in-PDF highlight capture isn't wired up in V1.
 */
export async function explainTopic(inputText) {
  const schema = {
    type: SchemaType.OBJECT,
    properties: {
      simpleExplanation: { type: SchemaType.STRING },
      detailedExplanation: { type: SchemaType.STRING },
      realWorldExample: { type: SchemaType.STRING },
      advantages: STRING_ARRAY,
      disadvantages: STRING_ARRAY,
      relatedTopics: STRING_ARRAY,
      interviewQuestions: STRING_ARRAY,
      memoryTricks: STRING_ARRAY,
    },
    required: [
      'simpleExplanation',
      'detailedExplanation',
      'realWorldExample',
      'advantages',
      'disadvantages',
      'relatedTopics',
      'interviewQuestions',
      'memoryTricks',
    ],
  }

  const prompt = `You are a patient, knowledgeable study assistant helping a student understand a topic from their course material.

Topic / text to explain:
"""
${inputText}
"""

Produce a structured explanation with:
- simpleExplanation: a short, plain-language explanation a beginner could follow (2-4 sentences).
- detailedExplanation: a thorough explanation covering the underlying concepts, mechanisms, and nuance (several paragraphs worth, as plain text).
- realWorldExample: one concrete, relatable real-world example or analogy.
- advantages: key advantages or strengths of this concept/approach (3-6 bullet-style strings, no leading dashes/numbers).
- disadvantages: key disadvantages, limitations, or trade-offs (3-6 bullet-style strings).
- relatedTopics: other topics a student should study alongside this one (3-6 short strings).
- interviewQuestions: likely exam or technical-interview questions about this topic (3-6 strings).
- memoryTricks: mnemonics, acronyms, or memory aids to help retain this topic (2-4 strings).

Keep language clear and student-friendly. Do not include markdown formatting or numbering inside the string values.`

  return generateStructured(prompt, schema)
}

/**
 * AI Summarize — operates on the extracted text of an entire PDF resource.
 */
export async function summarizeText(documentText) {
  const schema = {
    type: SchemaType.OBJECT,
    properties: {
      shortSummary: { type: SchemaType.STRING },
      keyConcepts: STRING_ARRAY,
      importantDefinitions: {
        type: SchemaType.ARRAY,
        items: {
          type: SchemaType.OBJECT,
          properties: {
            term: { type: SchemaType.STRING },
            definition: { type: SchemaType.STRING },
          },
          required: ['term', 'definition'],
        },
      },
      importantFormulae: STRING_ARRAY,
      revisionNotes: STRING_ARRAY,
      examTips: STRING_ARRAY,
    },
    required: [
      'shortSummary',
      'keyConcepts',
      'importantDefinitions',
      'importantFormulae',
      'revisionNotes',
      'examTips',
    ],
  }

  // Gemini 2.5 Flash comfortably handles long context, but truncate
  // defensively so an unusually large PDF can't blow the request budget.
  const truncated = documentText.slice(0, 120_000)

  const prompt = `You are a study assistant helping a student revise from their uploaded course material.

Document text:
"""
${truncated}
"""

Produce a structured study summary with:
- shortSummary: a concise summary of the whole document (4-8 sentences).
- keyConcepts: the main concepts covered, as short phrases (5-10 items).
- importantDefinitions: key terms with a one-to-two-sentence definition each (as many as genuinely appear; omit if the document has none).
- importantFormulae: any formulae, equations, or key numeric relationships mentioned, written as plain text (omit if none — do not invent formulae that aren't in the document).
- revisionNotes: quick, exam-oriented revision bullet points (5-10 items).
- examTips: practical tips for how a student should approach studying or answering exam questions on this material (3-6 items).

Base everything strictly on the provided document text. Do not include markdown formatting or numbering inside the string values.`

  return generateStructured(prompt, schema)
}

const QUESTION_SCHEMA_MCQ = {
  type: SchemaType.OBJECT,
  properties: {
    question: { type: SchemaType.STRING },
    options: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    correctAnswer: { type: SchemaType.STRING },
    explanation: { type: SchemaType.STRING },
  },
  required: ['question', 'options', 'correctAnswer', 'explanation'],
}

const QUESTION_SCHEMA_SHORT = {
  type: SchemaType.OBJECT,
  properties: {
    question: { type: SchemaType.STRING },
    correctAnswer: { type: SchemaType.STRING },
    explanation: { type: SchemaType.STRING },
  },
  required: ['question', 'correctAnswer', 'explanation'],
}

/**
 * AI Quiz Generator — from either the entire PDF's extracted text, or a
 * manually specified topic. ("Highlighted text" is spec'd as future-ready;
 * this function already accepts arbitrary source text, so wiring that in
 * later is just a new caller, not a redesign.)
 */
export async function generateQuiz({ sourceText, topic }) {
  const schema = {
    type: SchemaType.OBJECT,
    properties: {
      mcqs: { type: SchemaType.ARRAY, items: QUESTION_SCHEMA_MCQ },
      shortAnswer: { type: SchemaType.ARRAY, items: QUESTION_SCHEMA_SHORT },
    },
    required: ['mcqs', 'shortAnswer'],
  }

  const basis = sourceText
    ? `Document text:\n"""\n${sourceText.slice(0, 120_000)}\n"""`
    : `Topic: "${topic}"`

  const prompt = `You are a quiz generator helping a student test their understanding of their course material.

${basis}

Generate a quiz with exactly:
- mcqs: 10 multiple choice questions. Each has "question", "options" (exactly 4 plausible options, only one correct), "correctAnswer" (must exactly match one of the 4 options), and "explanation" (why that answer is correct, 1-3 sentences).
- shortAnswer: 5 short-answer questions. Each has "question", "correctAnswer" (a concise model answer), and "explanation" (brief supporting reasoning, 1-3 sentences).

Base every question strictly on the ${sourceText ? 'document text' : 'topic'} provided. Vary difficulty from foundational to more advanced. Do not include markdown formatting or numbering inside the string values.`

  return generateStructured(prompt, schema)
}
