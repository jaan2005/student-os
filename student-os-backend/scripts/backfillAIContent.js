import 'dotenv/config'
import mongoose from 'mongoose'
import Resource from '../src/models/Resource.js'
import pregenerateResourceAI from '../src/utils/pregenerateResourceAI.js'

/**
 * Run this once before launch to pre-generate Summary + Quiz for every PDF
 * resource that existed before automatic pre-generation shipped (e.g.
 * everything your teachers upload this week, before the feature above is
 * deployed). After this runs, every resource in the system is instant for
 * students on day one — not just resources uploaded from here forward.
 *
 * Usage:
 *   npm run backfill-ai
 *
 * Safe to re-run — it only processes resources not already marked 'ready'.
 * Runs sequentially (not in parallel) since this is a one-time manual
 * operation, not a latency-sensitive path — no need to add queue
 * complexity here.
 */
async function main() {
  await mongoose.connect(process.env.MONGODB_URI)

  const resources = await Resource.find({
    resourceType: 'pdf',
    aiPregenStatus: { $ne: 'ready' },
  }).select('_id title')

  console.log(`Found ${resources.length} PDF resource(s) needing AI pre-generation.`)

  for (const [i, r] of resources.entries()) {
    process.stdout.write(`[${i + 1}/${resources.length}] "${r.title}" (${r._id})... `)
    await pregenerateResourceAI(r._id)
    console.log('done')
  }

  console.log('Backfill complete.')
  await mongoose.disconnect()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
