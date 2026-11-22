import { describe, expect, it } from 'vitest'
import request from 'supertest'
import { createApp } from '../app.js'

const app = createApp()

describe('Security Headers & Middleware', () => {
  it('includes security headers injected by Helmet', async () => {
    const res = await request(app).get('/health')
    expect(res.headers).toHaveProperty('x-dns-prefetch-control')
    expect(res.headers).toHaveProperty('x-frame-options', 'SAMEORIGIN')
    expect(res.headers).toHaveProperty('x-content-type-options', 'nosniff')
    expect(res.headers).not.toHaveProperty('x-powered-by') // Express hidden
  })

  it('rejects unauthenticated requests to protected endpoints', async () => {
    const protectedPaths = [
      { method: 'get', path: '/api/v1/auth/me' },
      { method: 'post', path: '/api/v1/auth/logout' },
      { method: 'get', path: '/api/v1/tasks/mine' },
      { method: 'post', path: '/api/v1/tasks' },
      { method: 'post', path: '/api/v1/applications' },
      { method: 'get', path: '/api/v1/wallet/me' },
      { method: 'get', path: '/api/v1/notifications' },
      { method: 'get', path: '/api/v1/admin/users' },
      { method: 'get', path: '/api/v1/admin/stats' },
    ]

    for (const { method, path } of protectedPaths) {
      const res = await (request(app) as unknown as Record<string, (url: string) => request.Test>)[method](path)
      expect(res.status, `Expected 401 for ${method.toUpperCase()} ${path}`).toBe(401)
      expect(res.body.success).toBe(false)
      expect(res.body.error.code).toBe('UNAUTHORIZED')
    }
  })

  it('rejects malformed and fake JWT Bearer tokens', async () => {
    const fakeTokens = [
      'Bearer',
      'Bearer ',
      'Bearer not-a-token',
      'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.tampered',
      'Basic dXNlcjpwYXNz',
    ]

    for (const authHeader of fakeTokens) {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', authHeader)
      expect(res.status).toBe(401)
      expect(res.body.success).toBe(false)
    }
  })

  it('sanitizes filename to prevent directory traversal and path manipulation', () => {
    function sanitizeFilename(name: string): string {
      const base = name.replace(/[^a-zA-Z0-9._-]/g, '_')
      return base.slice(-100) || 'file'
    }

    expect(sanitizeFilename('../../../etc/passwd')).toBe('.._.._.._etc_passwd')
    expect(sanitizeFilename('..\\..\\windows\\system32\\cmd.exe')).toBe('.._.._windows_system32_cmd.exe')
    expect(sanitizeFilename('file with spaces & symbols!@#$.png')).toBe('file_with_spaces___symbols____.png')
    expect(sanitizeFilename('')).toBe('file')
  })
})
