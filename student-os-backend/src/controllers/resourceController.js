import Resource from '../models/Resource.js'
import Bookmark from '../models/Bookmark.js'
import cloudinary from '../config/cloudinary.js'
import { ALLOWED_MIME_TYPES } from '../middleware/upload.js'
import { ROLES, MAX_MONTHLY_UPLOADS } from '../config/constants.js'
import hashBuffer from '../utils/hashFile.js'
import { uploadBufferToCloudinary } from '../utils/uploadBufferToCloudinary.js'
import { sanitizeResource, getBookmarkedIdSet } from '../utils/resourceHelpers.js'
import ensureMonthlyUploadWindow from '../utils/monthlyUploads.js'
import getCloudinaryResourceType from '../utils/cloudinaryResourceType.js'

const SORT_MAP = {
  newest: { createdAt: -1 },
  oldest: { createdAt: 1 },
  popular: { downloads: -1, bookmarks: -1, createdAt: -1 },
}

/**
 * GET /api/resources
 * Supports: search, semester, subject, fileType, sort, page, limit, ids
 * (comma-separated ids — used by the frontend to batch-fetch a "recently
 * viewed" list it tracks client-side, without needing a 4th collection).
 */
export async function listResources(req, res) {
  const { search, semester, subject, fileType, sort = 'newest', page = 1, limit = 24, ids } = req.query

  const query = {}

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
    query.$or = [
      { title: regex },
      { description: regex },
      { semester: regex },
      { subject: regex },
      { unit: regex },
      { topic: regex },
      { tags: regex },
    ]
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
 */
export async function getSubjects(req, res) {
  const { semester } = req.query
  const match = semester ? { semester } : {}

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
 * POST /api/resources/upload
 * multipart/form-data, field name "file", plus metadata fields in the body.
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

  const { title, description = '', semester, subject, unit = '', topic = '', tags = '' } = req.body

  if (!title?.trim() || !semester?.trim() || !subject?.trim()) {
    return res.status(400).json({ message: 'Title, semester, and subject are required.' })
  }

  // Role check happens in the authorizeRoles route middleware before this
  // controller even runs. This is the monthly-quota check that comes next
  // in the spec's flow: JWT -> role -> monthly count -> hash.
  await ensureMonthlyUploadWindow(req.user)
  if (req.user.role !== ROLES.ADMIN && req.user.monthlyUploadCount >= MAX_MONTHLY_UPLOADS) {
    return res.status(403).json({ message: 'You have reached your monthly upload limit.' })
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

  let resource
  try {
    resource = await Resource.create({
      title: title.trim(),
      description: description.trim(),
      semester: semester.trim(),
      subject: subject.trim(),
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

  // Only a genuinely new upload counts toward the monthly quota.
  req.user.monthlyUploadCount += 1
  await req.user.save()

  await resource.populate('uploadedBy', 'firstName lastName')
  res.status(201).json({ status: 'success', resource: sanitizeResource(resource) })
}

/**
 * GET /api/resources/:id
 * Pass ?download=true to also increment the downloads counter (used by the
 * frontend's Download button, which then opens `cloudinaryUrl` directly).
 */
export async function getResourceById(req, res) {
  const resource = await Resource.findById(req.params.id).populate('uploadedBy', 'firstName lastName')
  if (!resource) return res.status(404).json({ message: 'Resource not found.' })

  if (req.query.download === 'true') {
    resource.downloads += 1
    await resource.save()
  }

  const bookmarkedIds = await getBookmarkedIdSet(req.user._id)
  res.status(200).json({ resource: sanitizeResource(resource, bookmarkedIds) })
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
  await resource.deleteOne()

  res.status(200).json({ message: 'Resource deleted.' })
}
