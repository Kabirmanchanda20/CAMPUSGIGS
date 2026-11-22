import { describe, expect, it } from 'vitest'
import { signupSchema, loginSchema } from '../modules/auth/auth.schema.js'
import { z } from 'zod'

// Task creation schema mirror for schema unit testing
const taskCreateSchema = z
  .object({
    title: z.string().min(5),
    description: z.string().min(20),
    category_id: z.string().uuid(),
    difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
    listing_type: z.enum(['gig', 'workshop', 'project', 'mentorship']),
    budget: z.number().min(0).max(10000).optional().nullable(),
    deadline: z.string().datetime().optional().nullable(),
    venue: z.string().optional().nullable(),
    mode: z.enum(['in_person', 'online', 'hybrid']).optional().nullable(),
    starts_at: z.string().datetime().optional().nullable(),
    ends_at: z.string().datetime().optional().nullable(),
    max_participants: z.number().int().positive().optional().nullable(),
    target_department_id: z.string().uuid().optional().nullable(),
  })
  .refine(
    (data) => {
      if (data.starts_at && data.ends_at) {
        return new Date(data.ends_at).getTime() > new Date(data.starts_at).getTime()
      }
      return true
    },
    { message: 'ends_at must be after starts_at', path: ['ends_at'] },
  )

describe('Auth Validation Schemas', () => {
  describe('signupSchema', () => {
    it('accepts valid signup input with @thapar.edu email', () => {
      const valid = {
        email: 'student.2024@thapar.edu',
        password: 'SecurePassword123!',
        full_name: 'Harpreet Singh',
        campus_role: 'ug_student',
        experience_level: 'intermediate',
        year_of_study: 3,
      }
      const result = signupSchema.safeParse(valid)
      expect(result.success).toBe(true)
    })

    it('rejects emails from unauthorized domains', () => {
      const invalid = {
        email: 'hacker@gmail.com',
        password: 'SecurePassword123!',
        full_name: 'Attacker',
        campus_role: 'ug_student',
      }
      const result = signupSchema.safeParse(invalid)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0]?.message).toContain('@thapar.edu')
      }
    })

    it('rejects passwords shorter than 8 characters', () => {
      const invalid = {
        email: 'user@thapar.edu',
        password: '123',
        full_name: 'Short Pass',
        campus_role: 'ug_student',
      }
      const result = signupSchema.safeParse(invalid)
      expect(result.success).toBe(false)
    })

    it('rejects invalid campus roles', () => {
      const invalid = {
        email: 'user@thapar.edu',
        password: 'ValidPassword123!',
        full_name: 'Bad Role',
        campus_role: 'outsider',
      }
      const result = signupSchema.safeParse(invalid)
      expect(result.success).toBe(false)
    })

    it('defaults experience_level to beginner', () => {
      const input = {
        email: 'user@thapar.edu',
        password: 'ValidPassword123!',
        full_name: 'Default User',
        campus_role: 'ug_student',
      }
      const result = signupSchema.parse(input)
      expect(result.experience_level).toBe('beginner')
    })
  })

  describe('loginSchema', () => {
    it('accepts valid email and password', () => {
      const result = loginSchema.safeParse({
        email: 'test@thapar.edu',
        password: 'password123',
      })
      expect(result.success).toBe(true)
    })

    it('rejects malformed email format', () => {
      const result = loginSchema.safeParse({
        email: 'not-an-email',
        password: 'password123',
      })
      expect(result.success).toBe(false)
    })

    it('rejects empty password', () => {
      const result = loginSchema.safeParse({
        email: 'test@thapar.edu',
        password: '',
      })
      expect(result.success).toBe(false)
    })
  })
})

describe('Task Validation Schemas', () => {
  const validTask = {
    title: 'Build a React component library',
    description: 'We need help developing reusable button and modal components for our campus club website.',
    category_id: '00000000-0000-4000-8000-000000000001',
    difficulty: 'intermediate',
    listing_type: 'gig',
    budget: 50,
  }

  it('accepts valid task input', () => {
    const result = taskCreateSchema.safeParse(validTask)
    expect(result.success).toBe(true)
  })

  it('rejects titles shorter than 5 characters', () => {
    const result = taskCreateSchema.safeParse({ ...validTask, title: 'Hi' })
    expect(result.success).toBe(false)
  })

  it('rejects descriptions shorter than 20 characters', () => {
    const result = taskCreateSchema.safeParse({ ...validTask, description: 'Too brief' })
    expect(result.success).toBe(false)
  })

  it('rejects negative budgets', () => {
    const result = taskCreateSchema.safeParse({ ...validTask, budget: -10 })
    expect(result.success).toBe(false)
  })

  it('rejects budget exceeding maximum threshold (10,000 credits)', () => {
    const result = taskCreateSchema.safeParse({ ...validTask, budget: 999999 })
    expect(result.success).toBe(false)
  })

  it('rejects non-uuid category_id', () => {
    const result = taskCreateSchema.safeParse({ ...validTask, category_id: 'invalid-uuid' })
    expect(result.success).toBe(false)
  })

  it('rejects negative or zero max_participants', () => {
    expect(taskCreateSchema.safeParse({ ...validTask, max_participants: 0 }).success).toBe(false)
    expect(taskCreateSchema.safeParse({ ...validTask, max_participants: -5 }).success).toBe(false)
    expect(taskCreateSchema.safeParse({ ...validTask, max_participants: 10 }).success).toBe(true)
  })

  it('validates workshop chronological ordering (ends_at after starts_at)', () => {
    const validDates = {
      ...validTask,
      listing_type: 'workshop' as const,
      starts_at: '2026-12-01T10:00:00.000Z',
      ends_at: '2026-12-01T12:00:00.000Z',
    }
    expect(taskCreateSchema.safeParse(validDates).success).toBe(true)

    const invalidDates = {
      ...validTask,
      listing_type: 'workshop' as const,
      starts_at: '2026-12-01T14:00:00.000Z',
      ends_at: '2026-12-01T12:00:00.000Z',
    }
    const result = taskCreateSchema.safeParse(invalidDates)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain('ends_at must be after starts_at')
    }
  })
})
