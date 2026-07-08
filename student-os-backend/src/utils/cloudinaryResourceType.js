const IMAGE_TYPES = ['jpg', 'png']

/**
 * Images upload/delete as Cloudinary resource_type 'image'; everything else
 * (pdf/doc/docx/ppt/pptx) uses 'raw'. This must be used consistently at
 * both upload time and destroy time — Cloudinary's destroy call needs the
 * exact resource_type a file was uploaded under to find it; 'auto' (valid
 * only for uploads) will silently fail to delete anything.
 *
 * Uploading PDFs as 'raw' rather than letting resource_type:'auto' route
 * them through the image pipeline also sidesteps Cloudinary's "PDF/ZIP
 * delivery" restriction on the image pipeline, which otherwise 401s.
 */
export default function getCloudinaryResourceType(resourceType) {
  return IMAGE_TYPES.includes(resourceType) ? 'image' : 'raw'
}
