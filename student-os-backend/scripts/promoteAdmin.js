import 'dotenv/config'
import mongoose from 'mongoose'
import User from '../src/models/User.js'
import { ROLES } from '../src/config/constants.js'

/**
 * Bootstraps the very first admin account. Every user starts as 'student'
 * and role changes normally happen through the admin panel — but that
 * panel itself requires an existing admin, so this script breaks the
 * chicken-and-egg problem for a fresh deployment.
 *
 * Usage:
 *   node scripts/promoteAdmin.js someone@example.com
 *
 * The user must have already signed up at least once (so their MongoDB
 * user document exists) before running this.
 */
async function main() {
  const email = process.argv[2]
  if (!email) {
    console.error('Usage: node scripts/promoteAdmin.js <email>')
    process.exit(1)
  }

  await mongoose.connect(process.env.MONGODB_URI)

  const user = await User.findOne({ email: email.toLowerCase().trim() })
  if (!user) {
    console.error(`No user found with email "${email}". Sign up first, then run this script.`)
    await mongoose.disconnect()
    process.exit(1)
  }

  user.role = ROLES.ADMIN
  await user.save()

  console.log(`✔ ${user.email} is now an admin.`)
  await mongoose.disconnect()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
