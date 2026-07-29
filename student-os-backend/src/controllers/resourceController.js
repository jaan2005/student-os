import Resource from '../models/Resource.js'
import Bookmark from '../models/Bookmark.js'
import Conversation from '../models/Conversation.js'
import Message from '../models/Message.js'
import cloudinary from '../config/cloudinary.js'
import { ALLOWED_MIME_TYPES } from '../middleware/upload.js'
import { ROLES, MAX_MONTHLY_UPLOADS, UPLOAD_ROLES, RESOURCE_CATEGORIES, APPROVAL_STATUS } from '../config/constants.js'
import hashBuffer from '../utils/hashFile.js'
import { uploadBufferToCloudinary } from '../utils/uploadBufferToCloudinary.js'
import { sanitizeResource, getBookmarkedIdSet } from '../utils/resourceHelpers.js'
import ensureMonthlyUploadWindow from '../utils/monthlyUploads.js'
import getCloudinaryResourceType from '../utils/cloudinaryResourceType.js'
import aiPregenQueue from '../utils/aiPregenQueue.js'
import pregenerateResourceAI from '../utils/pregenerateResourceAI.js'

const SORT_MAP = {
  newest: { createdAt: -1 },
  oldest: { createdAt: 1 },
  popular: { downloads: -1, bookmarks: -1, createdAt: -1 },
}

/**
 * GET /api/resources
 * Supports: category, search, semester, subject, fileType, sort, page,
 * limit, ids (comma-separated ids — used by the frontend to batch-fetch a
 * "recently viewed" list it tracks client-side, without needing a 4th
 * collection).
 *
 * `category` defaults to 'academic' for backward compatibility with any
 * caller that predates Career Resources. Scoping is enforced here, from
 * `req.user`, never trusted from a query param:
 *   - academic: always filtered to the viewer's own college. A student at
 *     College A can never see College B's notes, regardless of what they
 *     pass in the query string.
 *   - career: approved resources are visible to everyone; a submitter also
 *     sees their own pending/rejected ones. Admins see everything through
 *     this endpoint too. Nothing lets a non-admin caller request another
 *     user's pending/rejected items — that's enforced here, not trusted
 *     from the query string.
 */
export async function listResources(req, res) {
  const {
    category = RESOURCE_CATEGORIES.ACADEMIC,
    search,
    semester,
    subject,
    fileType,
    sort = 'newest',
    page = 1,
    limit = 24,
    ids,
  } = req.query

  const resolvedCategory = category === RESOURCE_CATEGORIES.CAREER ? RESOURCE_CATEGORIES.CAREER : RESOURCE_CATEGORIES.ACADEMIC

  const query = { category: resolvedCategory }

  if (resolvedCategory === RESOURCE_CATEGORIES.ACADEMIC) {
    query.college = req.user.college
  } else {
    // Everyone sees approved career resources; a submitter also sees their
    // own pending/rejected ones mixed in, so "did my submission go
    // through?" has an answer without a separate "my submissions" screen.
    // Admins see everything (their own approval queue is a separate,
    // dedicated endpoint — see adminController.listPendingCareerResources).
    if (req.user.role !== ROLES.ADMIN) {
      query.$or = [{ approvalStatus: APPROVAL_STATUS.APPROVED }, { uploadedBy: req.user._id }]
    }
  }

  if (ids) {
    const idList = ids
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean)
    query._id = { $in: idList }
  }
  if (semester) query.semester = semester
  if (subject) query.subject = subject
  if (fileType) query.resourceType = fileType

  if (search?.trim()) {
    const regex = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
    const searchOr = [
      { title: regex },
      { description: regex },
      { semester: regex },
      { subject: regex },
      { unit: regex },
      { topic: regex },
      { tags: regex },
    ]

    // query.$or may already be set (career visibility, above) — both
    // conditions need to hold simultaneously, so combine them under $and
    // rather than letting this overwrite it.
    if (query.$or) {
      query.$and = [{ $or: query.$or }, { $or: searchOr }]
      delete query.$or
    } else {
      query.$or = searchOr
    }
  }

  const sortStage = SORT_MAP[sort] || SORT_MAP.newest
  const pageNum = Math.max(parseInt(page, 10) || 1, 1)
  const limitNum = Math.min(Math.max(parseInt(limit, 10) || 24, 1), 100)

  const [resources, total, bookmarkedIds] = await Promise.all([
    Resource.find(query)
      .populate('uploadedBy', 'firstName lastName')
      .sort(sortStage)
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    Resource.countDocuments(query),
    getBookmarkedIdSet(req.user._id),
  ])

  res.status(200).json({
    resources: resources.map((r) => sanitizeResource(r, bookmarkedIds)),
    pagination: { page: pageNum, limit: limitNum, total, pages: Math.max(Math.ceil(total / limitNum), 1) },
  })
}

/**
 * GET /api/subjects
 * Folder-card data for the subject-wise organization view: groups resources
 * by Semester -> Subject with a resource count and last-updated timestamp.
 * Academic-only — Career Resources aren't organized this way — and always
 * scoped to the viewer's own college, same as listResources.
 */
export async function getSubjects(req, res) {
  const { semester } = req.query
  const match = { category: RESOURCE_CATEGORIES.ACADEMIC, college: req.user.college }
  if (semester) match.semester = semester

  const groups = await Resource.aggregate([
    { $match: match },
    {
      $group: {
        _id: { semester: '$semester', subject: '$subject' },
        totalResources: { $sum: 1 },
        lastUpdated: { $max: '$updatedAt' },
      },
    },
    { $sort: { '_id.semester': 1, '_id.subject': 1 } },
  ])

  res.status(200).json({
    subjects: groups.map((g) => ({
      semester: g._id.semester,
      subject: g._id.subject,
      totalResources: g.totalResources,
      lastUpdated: g.lastUpdated,
    })),
  })
}

/**
 * Two independent permissions, checked here (not in route middleware —
 * see resourceRoutes.js for why): academic uploads require the existing
 * UPLOAD_ROLES (trustedContributor/admin); career uploads require the
 * separate, admin-granted `canUploadCareer` flag, or admin. A student with
 * canUploadCareer but no trustedContributor role can upload career
 * resources but not academic ones, and vice versa — the two are unrelated.
 */
function authorizeUpload(user, category) {
  if (user.role === ROLES.ADMIN) return true
  if (category === RESOURCE_CATEGORIES.CAREER) return !!user.canUploadCareer
  return UPLOAD_ROLES.includes(user.role)
}

/**
 * POST /api/resources/upload
 * multipart/form-data, field name "file", plus metadata fields in the body,
 * including `category` ('academic' | 'career', defaults to 'academic').
 *
 * Flow: hash the buffer -> look for an existing resource with that hash ->
 * if found, return it as a duplicate without touching Cloudinary -> if not,
 * upload to Cloudinary, then create the Resource doc. The fileHash unique
 * index is the real guarantee against a race between two simultaneous
 * uploads of the same file; if that race is lost we clean up the redundant
 * Cloudinary asset and return the winning resource as a duplicate too.
 */
export async function uploadResource(req, res) {
  if (!req.file) {
    return res.status(400).json({ message: 'A file is required.' })
  }

  const category = req.body.category === RESOURCE_CATEGORIES.CAREER ? RESOURCE_CATEGORIES.CAREER : RESOURCE_CATEGORIES.ACADEMIC

  if (!authorizeUpload(req.user, category)) {
    const message =
      category === RESOURCE_CATEGORIES.CAREER
        ? 'You are not authorized to upload Career Resources.'
        : 'You are not authorized to upload resources.'
    return res.status(403).json({ message })
  }

  const { title, description = '', semester, subject, unit = '', topic = '', tags = '' } = req.body

  if (category === RESOURCE_CATEGORIES.ACADEMIC) {
    if (!title?.trim() || !semester?.trim() || !subject?.trim()) {
      return res.status(400).json({ message: 'Title, semester, and subject are required.' })
    }

    // Monthly quota is an academic-only concept — Career Resources' small,
    // hand-picked trust circle isn't subject to it (matches the spec: it's
    // a moderation gate, not a volume limit). This is the monthly-quota
    // check from the spec's flow: JWT -> role -> monthly count -> hash.
    await ensureMonthlyUploadWindow(req.user)
    if (req.user.role !== ROLES.ADMIN && req.user.monthlyUploadCount >= MAX_MONTHLY_UPLOADS) {
      return res.status(403).json({ message: 'You have reached your monthly upload limit.' })
    }
  } else {
    if (!title?.trim() || !description?.trim()) {
      return res.status(400).json({ message: 'Title and description are required.' })
    }
  }

  const fileHash = hashBuffer(req.file.buffer)

  const existing = await Resource.findOne({ fileHash }).populate('uploadedBy', 'firstName lastName')
  if (existing) {
    // Duplicates never count toward the monthly limit.
    return res.status(200).json({ status: 'duplicate', resource: sanitizeResource(existing) })
  }

  const resourceType = ALLOWED_MIME_TYPES[req.file.mimetype]
  const cloudinaryResourceType = getCloudinaryResourceType(resourceType)

  let uploadResult
  try {
    uploadResult = await uploadBufferToCloudinary(req.file.buffer, {
      public_id: fileHash,
      resource_type: cloudinaryResourceType,
    })
  } catch (err) {
    return res.status(502).json({ message: 'File upload to storage failed. Please try again.' })
  }

  const tagList = (Array.isArray(tags) ? tags.join(',') : tags)
    .split(',')
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean)

  // Admins uploading a career resource are, by definition, the ones who'd
  // otherwise approve it — auto-approve rather than have an admin approve
  // their own upload as a separate step. Every other career upload starts
  // pending; academic resources are unaffected (always 'approved', the V1
  // default on the schema).
  const approvalStatus =
    category === RESOURCE_CATEGORIES.CAREER && req.user.role !== ROLES.ADMIN
      ? APPROVAL_STATUS.PENDING
      : APPROVAL_STATUS.APPROVED

  let resource
  try {
    resource = await Resource.create({
      category,
      college: category === RESOURCE_CATEGORIES.ACADEMIC ? req.user.college : null,
      approvalStatus,
      title: title.trim(),
      description: description.trim(),
      semester: (semester || '').trim(),
      subject: (subject || '').trim(),
      unit: unit.trim(),
      topic: topic.trim(),
      tags: tagList,
      resourceType,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      fileHash,
      cloudinaryUrl: uploadResult.secure_url,
      cloudinaryPublicId: uploadResult.public_id,
      uploadedBy: req.user._id,
      // Only PDFs get Summary/Quiz pre-generated (see extractResourceText.js
      // for why) — everything else is marked unsupported immediately rather
      // than sitting at "pending" forever.
      aiPregenStatus: resourceType === 'pdf' ? 'pending' : 'unsupported',
    })
  } catch (err) {
    if (err.code === 11000) {
      // Lost the race: someone else's identical upload landed first.
      await cloudinary.uploader.destroy(uploadResult.public_id, { resource_type: cloudinaryResourceType }).catch(() => {})
      const winner = await Resource.findOne({ fileHash }).populate('uploadedBy', 'firstName lastName')
      return res.status(200).json({ status: 'duplicate', resource: sanitizeResource(winner) })
    }
    throw err
  }

  // Only a genuinely new *academic* upload counts toward the monthly quota
  // — career uploads aren't subject to it (see the quota check above).
  if (category === RESOURCE_CATEGORIES.ACADEMIC) {
    req.user.monthlyUploadCount += 1
    await req.user.save()
  }

  await resource.populate('uploadedBy', 'firstName lastName')
  res.status(201).json({ status: 'success', resource: sanitizeResource(resource) })

  // Fire-and-forget, queued (not run inline) so several uploads in quick
  // succession don't each fire a Gemini call simultaneously. Runs AFTER the
  // response above — the uploader never waits on this.
  if (resourceType === 'pdf') {
    aiPregenQueue.push(() => pregenerateResourceAI(resource._id))
  }
}

/**
 * GET /api/resources/:id
 *
 * List-level scoping (college for academic, approvalStatus for career)
 * only filters what shows up in search/browse — a direct ID request needs
 * its own check, or a guessed/leaked ID would bypass it entirely. Treated
 * as "not found" rather than "forbidden" so this doesn't confirm to an
 * unauthorized caller that a given ID exists at all.
 */
export async function getResourceById(req, res) {
  const resource = await Resource.findById(req.params.id).populate('uploadedBy', 'firstName lastName')
  if (!resource) return res.status(404).json({ message: 'Resource not found.' })

  if (!canViewResource(resource, req.user)) {
    return res.status(404).json({ message: 'Resource not found.' })
  }

  const bookmarkedIds = await getBookmarkedIdSet(req.user._id)
  res.status(200).json({ resource: sanitizeResource(resource, bookmarkedIds) })
}

/**
 * Shared visibility check for direct-ID access (detail, download, edit,
 * delete all route through resources someone might reach by ID rather than
 * by browsing a scoped list).
 */
export function canViewResource(resource, user) {
  if (user.role === ROLES.ADMIN) return true

  if (resource.category === RESOURCE_CATEGORIES.CAREER) {
    // uploadedBy may be a populated User doc or a raw ObjectId depending on
    // the caller — normalize to a string id either way.
    const uploaderId = (resource.uploadedBy._id || resource.uploadedBy).toString()
    return resource.approvalStatus === APPROVAL_STATUS.APPROVED || uploaderId === user._id.toString()
  }

  return resource.college === user.college
}

// Inverted from ALLOWED_MIME_TYPES (middleware/upload.js) rather than
// duplicated, so the two mappings can't drift out of sync.
const RESOURCE_TYPE_TO_MIME = Object.fromEntries(
  Object.entries(ALLOWED_MIME_TYPES).map(([mime, type]) => [type, mime])
)

/**
 * GET /api/resources/:id/download
 *
 * Fetches the file server-side and streams it back with headers we control
 * directly — Content-Type and a correctly-named, correctly-escaped
 * Content-Disposition — rather than relying on a Cloudinary URL
 * transformation to produce them. That approach (fl_attachment:<filename>)
 * turned out to have escaping rules around filenames containing a "."
 * that weren't reliable enough to depend on (Cloudinary returns an outright
 * HTTP 400 for some values) — this sidesteps that entirely.
 */
export async function downloadResourceFile(req, res) {
  const resource = await Resource.findById(req.params.id)
  if (!resource) return res.status(404).json({ message: 'Resource not found.' })
  if (!canViewResource(resource, req.user)) {
    return res.status(404).json({ message: 'Resource not found.' })
  }

  const upstream = await fetch(resource.cloudinaryUrl)
  if (!upstream.ok) {
    return res.status(502).json({ message: 'Could not fetch the file for download. Please try again.' })
  }

  resource.downloads += 1
  await resource.save()

  const contentType = RESOURCE_TYPE_TO_MIME[resource.resourceType] || 'application/octet-stream'
  // RFC 6266: a plain ASCII fallback (older clients) plus a UTF-8 encoded
  // filename* (everything else) covers non-ASCII filenames correctly too.
  const asciiFallback = resource.fileName.replace(/[^\x20-\x7E]/g, '_').replace(/"/g, "'")
  const encodedName = encodeURIComponent(resource.fileName)

  res.setHeader('Content-Type', contentType)
  res.setHeader('Content-Disposition', `attachment; filename="${asciiFallback}"; filename*=UTF-8''${encodedName}`)

  const buffer = Buffer.from(await upstream.arrayBuffer())
  res.send(buffer)
}

const EDITABLE_FIELDS = ['title', 'description', 'semester', 'subject', 'unit', 'topic', 'tags']

/**
 * PUT /api/resources/:id — owner only. Metadata edits; the file itself is
 * immutable (re-upload as a new resource if the file needs to change).
 */
export async function updateResource(req, res) {
  const resource = await Resource.findById(req.params.id)
  if (!resource) return res.status(404).json({ message: 'Resource not found.' })

  const isOwner = resource.uploadedBy.toString() === req.user._id.toString()
  if (!isOwner && req.user.role !== ROLES.ADMIN) {
    return res.status(403).json({ message: 'Only the uploader (or an admin) can edit this resource.' })
  }

  EDITABLE_FIELDS.forEach((field) => {
    if (req.body[field] === undefined) return

    if (field === 'tags') {
      const raw = req.body.tags
      resource.tags = (Array.isArray(raw) ? raw : raw.split(','))
        .map((t) => t.toString().trim().toLowerCase())
        .filter(Boolean)
    } else {
      resource[field] = req.body[field]?.toString().trim()
    }
  })

  await resource.save()
  await resource.populate('uploadedBy', 'firstName lastName')

  const bookmarkedIds = await getBookmarkedIdSet(req.user._id)
  res.status(200).json({ resource: sanitizeResource(resource, bookmarkedIds) })
}

/**
 * DELETE /api/resources/:id — owner only. Cleans up the Cloudinary asset and
 * any Bookmark documents pointing at this resource.
 */
export async function deleteResource(req, res) {
  const resource = await Resource.findById(req.params.id)
  if (!resource) return res.status(404).json({ message: 'Resource not found.' })

  const isOwner = resource.uploadedBy.toString() === req.user._id.toString()
  if (!isOwner && req.user.role !== ROLES.ADMIN) {
    return res.status(403).json({ message: 'Only the uploader (or an admin) can delete this resource.' })
  }

  await cloudinary.uploader
    .destroy(resource.cloudinaryPublicId, { resource_type: getCloudinaryResourceType(resource.resourceType) })
    .catch(() => {})
  await Bookmark.deleteMany({ resource: resource._id })

  // AI Study Assistant conversations are tied to this resource — without
  // this, deleting a resource would leave orphaned Conversation/Message
  // docs pointing at nothing.
  const conversations = await Conversation.find({ resource: resource._id }).select('_id')
  const conversationIds = conversations.map((c) => c._id)
  if (conversationIds.length > 0) {
    await Message.deleteMany({ conversation: { $in: conversationIds } })
    await Conversation.deleteMany({ _id: { $in: conversationIds } })
  }

  await resource.deleteOne()

  res.status(200).json({ message: 'Resource deleted.' })
}
