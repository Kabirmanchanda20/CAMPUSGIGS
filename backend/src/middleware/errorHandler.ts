import type { NextFunction, Request, Response } from 'express'
import { AppError } from '../utils/AppError.js'
import { env } from '../config/env.js'
import { logger } from '../utils/logger.js'

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        ...(err.fields ? { fields: err.fields } : {}),
      },
    })
  }

  // Handle common Postgres constraint errors
  if (err && typeof err === 'object' && 'code' in err) {
    const pgErr = err as { code: string; detail?: string }
    if (pgErr.code === '23505') {
      return res.status(409).json({
        success: false,
        error: {
          code: 'CONFLICT',
          message: 'A record with this information already exists',
        },
      })
    }
    if (pgErr.code === '23503') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_REFERENCE',
          message: 'Referenced entity not found',
        },
      })
    }
  }

  logger.error({ err }, 'Unhandled error')
  return res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Something went wrong',
    },
  })
}
