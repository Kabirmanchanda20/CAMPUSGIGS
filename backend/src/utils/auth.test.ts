import { describe, expect, it } from 'vitest'
import { hashPassword, hashToken, verifyPassword, verifyTokenHash } from './password.js'
import { signAccessToken, signRefreshToken, verifyAccessToken, verifyRefreshToken } from './jwt.js'

describe('Password & Token Hashing Security', () => {
  it('hashes passwords with bcrypt rounds and verifies correctly', async () => {
    const password = 'CorrectHorseBatteryStaple!123'
    const hash = await hashPassword(password)

    expect(hash).not.toBe(password)
    expect(hash).toMatch(/^\$2[aby]\$\d+\$/) // bcrypt prefix

    const isValid = await verifyPassword(password, hash)
    expect(isValid).toBe(true)

    const isInvalid = await verifyPassword('WrongPassword123', hash)
    expect(isInvalid).toBe(false)
  })

  it('generates different salts for identical passwords', async () => {
    const password = 'SecretPassword123'
    const hash1 = await hashPassword(password)
    const hash2 = await hashPassword(password)

    expect(hash1).not.toBe(hash2)
    expect(await verifyPassword(password, hash1)).toBe(true)
    expect(await verifyPassword(password, hash2)).toBe(true)
  })

  it('hashes refresh tokens for secure storage', async () => {
    const token = 'sample-refresh-token-uuid-or-jwt'
    const tokenHash = await hashToken(token)

    expect(tokenHash).not.toBe(token)
    expect(await verifyTokenHash(token, tokenHash)).toBe(true)
    expect(await verifyTokenHash('fake-token', tokenHash)).toBe(false)
  })
})

describe('JWT Security & Expiration', () => {
  it('signs and verifies access tokens with correct payload', () => {
    const payload = { sub: '00000000-0000-4000-8000-000000000001', email: 'student@thapar.edu' }
    const token = signAccessToken(payload)

    expect(typeof token).toBe('string')
    expect(token.split('.')).toHaveLength(3)

    const decoded = verifyAccessToken(token)
    expect(decoded.sub).toBe(payload.sub)
    expect(decoded.email).toBe(payload.email)
  })

  it('signs and verifies refresh tokens', () => {
    const payload = { sub: '00000000-0000-4000-8000-000000000001', email: 'student@thapar.edu' }
    const token = signRefreshToken(payload)

    const decoded = verifyRefreshToken(token)
    expect(decoded.sub).toBe(payload.sub)
  })

  it('rejects tampered tokens', () => {
    const payload = { sub: '00000000-0000-4000-8000-000000000001', email: 'student@thapar.edu' }
    const token = signAccessToken(payload)

    // Tamper with the payload part of the JWT
    const parts = token.split('.')
    const tamperedToken = `${parts[0]}.${parts[1]}tampered.${parts[2]}`

    expect(() => verifyAccessToken(tamperedToken)).toThrow()
  })

  it('rejects tokens signed with invalid secret', () => {
    // Attempting to verify refresh token with access secret should fail
    const refreshToken = signRefreshToken({ sub: 'user1', email: 'user@thapar.edu' })
    expect(() => verifyAccessToken(refreshToken)).toThrow()
  })
})
