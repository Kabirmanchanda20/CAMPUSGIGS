import { Router } from 'express'
import { asyncHandler } from '../../utils/asyncHandler.js'
import { validate } from '../../middleware/validate.js'
import { requireAuth } from '../../middleware/requireAuth.js'
import { env } from '../../config/env.js'
import * as authService from './auth.service.js'
import { loginSchema, signupSchema } from './auth.schema.js'

export const authRouter = Router()

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/api/v1/auth',
  maxAge: 7 * 24 * 60 * 60 * 1000,
}

authRouter.post(
  '/signup',
  validate({ body: signupSchema }),
  asyncHandler(async (req, res) => {
    const data = await authService.signup(req.body)
    res.cookie('refreshToken', data.refreshToken, REFRESH_COOKIE_OPTIONS)
    res.status(201).json({
      success: true,
      data: { accessToken: data.accessToken, profile: data.profile },
    })
  }),
)

authRouter.post(
  '/login',
  validate({ body: loginSchema }),
  asyncHandler(async (req, res) => {
    const data = await authService.login(req.body.email, req.body.password)
    res.cookie('refreshToken', data.refreshToken, REFRESH_COOKIE_OPTIONS)
    res.json({
      success: true,
      data: { accessToken: data.accessToken, profile: data.profile },
    })
  }),
)

authRouter.post(
  '/refresh',
  asyncHandler(async (req, res) => {
    const token = (req.cookies?.refreshToken as string | undefined) ?? req.body?.refreshToken
    if (!token) {
      res.status(401).json({
        success: false,
        error: { code: 'TOKEN_EXPIRED', message: 'No refresh token' },
      })
      return
    }
    const data = await authService.refresh(token)
    res.cookie('refreshToken', data.refreshToken, REFRESH_COOKIE_OPTIONS)
    res.json({ success: true, data: { accessToken: data.accessToken } })
  }),
)

authRouter.post(
  '/logout',
  requireAuth,
  asyncHandler(async (req, res) => {
    await authService.logout(req.user!.id)
    res.clearCookie('refreshToken', { path: '/api/v1/auth' })
    res.json({ success: true, data: null })
  }),
)

authRouter.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const profile = await authService.me(req.user!.id)
    res.json({ success: true, data: profile })
  }),
)
