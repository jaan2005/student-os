import Bookmark from '../models/Bookmark.js'
import Resource from '../models/Resource.js'
import { sanitizeResource } from '../utils/resourceHelpers.js'

/**
 * GET /api/bookmarks — the current user's bookmarked resources, newest first.
 */
export async function listBookmarks(req, res) {
  const bookmarks = await Bookmark.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .populate({
      path: 'resource',
      populate: { path: 'uploadedBy', select: 'firstName lastName' },
    })

  // A resource may have been deleted after being bookmarked; skip those.
  const valid = bookmarks.filter((b) => b.resource)
  const bookmarkedIds = new Set(valid.map((b) => b.resource._id.toString()))

  res.status(200).json({
    resources: valid.map((b) => sanitizeResource(b.resource, bookmarkedIds)),
  })
}

/**
 * POST /api/bookmarks/:id — :id is the resource id. Idempotent.
 */
export async function addBookmark(req, res) {
  const resource = await Resource.findById(req.params.id)
  if (!resource) return res.status(404).json({ message: 'Resource not found.' })

  const existing = await Bookmark.findOne({ user: req.user._id, resource: resource._id })
  if (!existing) {
    await Bookmark.create({ user: req.user._id, resource: resource._id })
    resource.bookmarks += 1
    await resource.save()
  }

  res.status(200).json({ message: 'Resource bookmarked.', isBookmarked: true })
}

/**
 * DELETE /api/bookmarks/:id — :id is the resource id. Idempotent.
 */
export async function removeBookmark(req, res) {
  const resource = await Resource.findById(req.params.id)
  if (!resource) return res.status(404).json({ message: 'Resource not found.' })

  const deleted = await Bookmark.findOneAndDelete({ user: req.user._id, resource: resource._id })
  if (deleted) {
    resource.bookmarks = Math.max(0, resource.bookmarks - 1)
    await resource.save()
  }

  res.status(200).json({ message: 'Bookmark removed.', isBookmarked: false })
}
