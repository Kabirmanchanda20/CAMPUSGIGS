import { Router } from 'express'
import multer from 'multer'
import { asyncHandler } from '../../utils/asyncHandler.js'
import { requireAuth } from '../../middleware/requireAuth.js'
import { supabaseAdmin } from '../../config/supabase.js'
import { AppError } from '../../utils/AppError.js'

export const uploadsRouter = Router()

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
})

function sanitizeFilename(name: string): string {
  const base = name.replace(/[^a-zA-Z0-9._-]/g, '_')
  return base.slice(-100) || 'file'
}

uploadsRouter.post(
  '/avatar',
  requireAuth,
  upload.single('file'),
  asyncHandler(async (req, res) => {
    if (!req.file) throw new AppError(400, 'VALIDATION_ERROR', 'File required')
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowed.includes(req.file.mimetype)) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Invalid image type')
    }
    const safeName = sanitizeFilename(req.file.originalname)
    const path = `${req.user!.id}/${Date.now()}-${safeName}`
    const { error } = await supabaseAdmin.storage.from('avatars').upload(path, req.file.buffer, {
      contentType: req.file.mimetype,
      upsert: true,
    })
    if (error) throw new AppError(500, 'UPLOAD_FAILED', error.message)
    const { data } = supabaseAdmin.storage.from('avatars').getPublicUrl(path)
    res.json({ success: true, data: { url: data.publicUrl } })
  }),
)

uploadsRouter.post(
  '/proof',
  requireAuth,
  upload.single('file'),
  asyncHandler(async (req, res) => {
    if (!req.file) throw new AppError(400, 'VALIDATION_ERROR', 'File required')
    const taskId = String(req.body.taskId ?? '')
    if (!taskId) throw new AppError(400, 'VALIDATION_ERROR', 'taskId required')
    const allowed = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'application/pdf',
      'text/plain',
    ]
    if (!allowed.includes(req.file.mimetype)) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Invalid file type')
    }
    const safeName = sanitizeFilename(req.file.originalname)
    const path = `${req.user!.id}/${taskId}/${Date.now()}-${safeName}`
    const { error } = await supabaseAdmin.storage.from('proofs').upload(path, req.file.buffer, {
      contentType: req.file.mimetype,
      upsert: false,
    })
    if (error) throw new AppError(500, 'UPLOAD_FAILED', error.message)
    const signed = await supabaseAdmin.storage.from('proofs').createSignedUrl(path, 60 * 60 * 24 * 7)
    res.json({ success: true, data: { path, url: signed.data?.signedUrl ?? null } })
  }),
)
