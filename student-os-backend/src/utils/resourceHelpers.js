import Bookmark from '../models/Bookmark.js'
import { toInlinePreviewUrl, toDownloadUrl } from './cloudinaryUrls.js'

/**
 * Returns the set of resource IDs (as strings) the given user has bookmarked,
 * so list/detail responses can attach an `isBookmarked` flag without N+1
 * queries per resource.
 */
export async function getBookmarkedIdSet(userId) {
  if (!userId) return new Set()
  const bookmarks = await Bookmark.find({ user: userId }).select('resource')
  return new Set(bookmarks.map((b) => b.resource.toString()))
}

/**
 * Strips a Resource document down to the shape sent to the client. Expects
 * `uploadedBy` to already be populated with at least firstName/lastName.
 */
export function sanitizeResource(resource, bookmarkedIds = new Set()) {
  const uploader =
    resource.uploadedBy && resource.uploadedBy._id
      ? {
          id: resource.uploadedBy._id,
          firstName: resource.uploadedBy.firstName,
          lastName: resource.uploadedBy.lastName,
        }
      : null

  return {
    id: resource._id,
    title: resource.title,
    description: resource.description,
    semester: resource.semester,
    subject: resource.subject,
    unit: resource.unit,
    topic: resource.topic,
    tags: resource.tags,
    resourceType: resource.resourceType,
    fileName: resource.fileName,
    fileSize: resource.fileSize,
    cloudinaryUrl: resource.cloudinaryUrl,
    // For <iframe>/<img> previews only — see cloudinaryUrls.js for why this
    // needs to be a distinct URL from cloudinaryUrl.
    previewUrl: toInlinePreviewUrl(resource.cloudinaryUrl),
    // For the Download button — sets a proper filename via Cloudinary's
    // fl_attachment flag, since the plain cloudinaryUrl's default filename
    // is the raw SHA-256 hash with no explicit Content-Disposition, which
    // Android's download manager can fail to recognize as a PDF.
    downloadUrl: toDownloadUrl(resource.cloudinaryUrl, resource.fileName),
    uploadedBy: uploader,
    downloads: resource.downloads,
    bookmarksCount: resource.bookmarks,
    isBookmarked: bookmarkedIds.has(resource._id.toString()),
    createdAt: resource.createdAt,
    updatedAt: resource.updatedAt,
  }
}
