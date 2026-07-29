import 'dotenv/config'
import mongoose from 'mongoose'
import Resource from '../src/models/Resource.js'
import { ALLOWED_COLLEGES, RESOURCE_CATEGORIES } from '../src/config/constants.js'

/**
 * One-time V2 migration. Every Resource created before this release
 * predates `category` and `college` — the schema defaults them to
 * 'academic' / null on read, but that's not good enough for `college`,
 * since academic listing/search now hard-filters on it. Without this
 * backfill, every pre-V2 resource would silently vanish from every
 * student's Notes & Resources view (college === null never matches a real
 * college string).
 *
 * Since V1 only ever had a single college, every existing resource
 * unambiguously belongs to it — there's no ambiguity to resolve, unlike a
 * migration that had to infer college from, say, the uploader's profile
 * (which would also work here, but isn't necessary for a single-college
 * V1 dataset).
 *
 * Usage:
 *   node scripts/backfillCollegeAndCategory.js
 *
 * Safe to re-run — only touches documents where `college` is still unset.
 */
async function main() {
  const college = ALLOWED_COLLEGES[0]
  if (!college) {
    console.error('ALLOWED_COLLEGES is empty — nothing to backfill onto. Check src/config/constants.js.')
    process.exit(1)
  }

  await mongoose.connect(process.env.MONGODB_URI)

  const result = await Resource.updateMany(
    { college: null },
    { $set: { category: RESOURCE_CATEGORIES.ACADEMIC, college } }
  )

  console.log(`✔ Backfilled ${result.modifiedCount} resource(s) to category "academic", college "${college}".`)
  await mongoose.disconnect()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
