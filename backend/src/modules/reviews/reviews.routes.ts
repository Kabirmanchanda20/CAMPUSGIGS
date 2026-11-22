import { Router } from 'express'
import { z } from 'zod'
import { asyncHandler } from '../../utils/asyncHandler.js'
import { requireAuth } from '../../middleware/requireAuth.js'
import { validate } from '../../middleware/validate.js'
import { pool, query } from '../../config/db.js'
import { AppError } from '../../utils/AppError.js'
import { refundEscrowIfHeld, releaseEscrow } from '../../utils/wallet.js'

export const reviewsRouter = Router()

reviewsRouter.get(
  '/task/:taskId',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { rows } = await query(
      `select r.*, json_build_object('id', p.id, 'full_name', p.full_name) as reviewer
       from reviews r join profiles p on p.id = r.reviewer_id
       where r.task_id = $1`,
      [req.params.taskId],
    )
    res.json({ success: true, data: rows })
  }),
)

reviewsRouter.post(
  '/',
  requireAuth,
  validate({
    body: z.object({
      task_id: z.string().uuid(),
      reviewee_id: z.string().uuid(),
      stars: z.number().int().min(1).max(5),
      comment: z.string().optional(),
    }),
  }),
  asyncHandler(async (req, res) => {
    const { task_id, reviewee_id, stars, comment } = req.body
    const { rows } = await query(`select * from tasks where id = $1`, [task_id])
    const task = rows[0]
    if (!task || task.status !== 'completed') {
      throw new AppError(400, 'INVALID_STATUS', 'Reviews only after completion')
    }
    if (req.user!.id !== task.poster_id && req.user!.id !== task.worker_id) {
      throw new AppError(403, 'FORBIDDEN', 'Participants only')
    }
    if (reviewee_id === req.user!.id) throw new AppError(400, 'INVALID', 'Cannot review yourself')
    if (reviewee_id !== task.poster_id && reviewee_id !== task.worker_id) {
      throw new AppError(400, 'INVALID', 'Invalid reviewee')
    }

    const client = await pool.connect()
    try {
      await client.query('begin')
      const existing = await client.query(
        `select id from reviews where task_id = $1 and reviewer_id = $2`,
        [task_id, req.user!.id],
      )
      if (existing.rows[0]) {
        throw new AppError(409, 'ALREADY_REVIEWED', 'You have already reviewed this task')
      }

      const inserted = await client.query(
        `insert into reviews (task_id, reviewer_id, reviewee_id, stars, comment)
         values ($1,$2,$3,$4,$5) returning id`,
        [task_id, req.user!.id, reviewee_id, stars, comment ?? null],
      )
      const avg = await client.query<{ avg: string }>(
        `select round(avg(stars)::numeric, 2) as avg from reviews where reviewee_id = $1`,
        [reviewee_id],
      )
      await client.query(`update profiles set avg_rating = $1 where id = $2`, [
        avg.rows[0]?.avg ?? 0,
        reviewee_id,
      ])
      await client.query('commit')
      res.status(201).json({ success: true, data: { id: inserted.rows[0]!.id } })
    } catch (e) {
      await client.query('rollback')
      throw e
    } finally {
      client.release()
    }
  }),
)

export const disputesRouter = Router()

disputesRouter.post(
  '/',
  requireAuth,
  validate({ body: z.object({ task_id: z.string().uuid(), reason: z.string().min(5) }) }),
  asyncHandler(async (req, res) => {
    const { rows } = await query(`select * from tasks where id = $1`, [req.body.task_id])
    const task = rows[0]
    if (!task) throw new AppError(404, 'NOT_FOUND', 'Task not found')
    if (req.user!.id !== task.poster_id && req.user!.id !== task.worker_id) {
      throw new AppError(403, 'FORBIDDEN', 'Participants only')
    }
    if (!['assigned', 'submitted', 'disputed'].includes(task.status)) {
      throw new AppError(400, 'INVALID_STATUS', 'Invalid status for dispute')
    }
    await query(`update tasks set status = 'disputed', updated_at = now() where id = $1`, [
      task.id,
    ])
    const { rows: d } = await query(
      `insert into disputes (task_id, raised_by, reason) values ($1,$2,$3) returning id`,
      [task.id, req.user!.id, req.body.reason],
    )
    res.status(201).json({ success: true, data: { id: d[0]!.id } })
  }),
)

disputesRouter.get(
  '/open',
  requireAuth,
  asyncHandler(async (req, res) => {
    if (!req.user!.is_admin) throw new AppError(403, 'FORBIDDEN', 'Admin only')
    const { rows } = await query(
      `select d.*,
        json_build_object('id', t.id, 'title', t.title, 'status', t.status) as task,
        json_build_object('id', p.id, 'full_name', p.full_name) as raiser
       from disputes d
       join tasks t on t.id = d.task_id
       join profiles p on p.id = d.raised_by
       where d.status = 'open'
       order by d.created_at desc`,
    )
    res.json({ success: true, data: rows })
  }),
)

disputesRouter.post(
  '/:id/resolve',
  requireAuth,
  validate({
    body: z.object({
      resolution: z.string().min(3),
      action: z.enum(['complete', 'cancel']).default('complete'),
    }),
  }),
  asyncHandler(async (req, res) => {
    if (!req.user!.is_admin) throw new AppError(403, 'FORBIDDEN', 'Admin only')
    const client = await pool.connect()
    try {
      await client.query('begin')
      const { rows: dRows } = await client.query(
        `select * from disputes where id = $1 and status = 'open' for update`,
        [req.params.id],
      )
      const dispute = dRows[0]
      if (!dispute) throw new AppError(404, 'NOT_FOUND', 'Open dispute not found')

      const { rows: tRows } = await client.query(
        `select * from tasks where id = $1 for update`,
        [dispute.task_id],
      )
      const task = tRows[0]
      if (!task) throw new AppError(404, 'NOT_FOUND', 'Task not found')

      await client.query(
        `update disputes set status = 'resolved', resolution = $2, resolved_by = $3, resolved_at = now() where id = $1`,
        [dispute.id, req.body.resolution, req.user!.id],
      )

      if (req.body.action === 'cancel') {
        await refundEscrowIfHeld(client, { taskId: task.id, posterId: task.poster_id })
        await client.query(
          `update tasks set status = 'cancelled', updated_at = now() where id = $1`,
          [task.id],
        )
        const notifyUsers = [task.poster_id]
        if (task.worker_id) notifyUsers.push(task.worker_id)
        for (const uid of notifyUsers) {
          await client.query(
            `insert into notifications (user_id, type, payload) values ($1, 'dispute_resolved', $2)`,
            [uid, JSON.stringify({ task_id: task.id, dispute_id: dispute.id, outcome: 'cancelled' })],
          )
        }
      } else {
        await client.query(
          `update tasks set status = 'completed', updated_at = now() where id = $1`,
          [task.id],
        )
        if (task.worker_id) {
          await releaseEscrow(client, {
            taskId: task.id,
            posterId: task.poster_id,
            workerId: task.worker_id,
            amount: Number(task.budget),
          })
          await client.query(
            `update profiles set completed_count = completed_count + 1 where id = any($1::uuid[])`,
            [[task.poster_id, task.worker_id]],
          )
          await client.query(
            `insert into user_category_stats (user_id, category_id, completed_count)
             values ($1, $2, 1)
             on conflict (user_id, category_id)
             do update set completed_count = user_category_stats.completed_count + 1`,
            [task.worker_id, task.category_id],
          )
          for (const uid of [task.poster_id, task.worker_id]) {
            await client.query(
              `insert into notifications (user_id, type, payload) values ($1, 'dispute_resolved', $2)`,
              [uid, JSON.stringify({ task_id: task.id, dispute_id: dispute.id, outcome: 'completed' })],
            )
          }
        }
      }

      await client.query('commit')
      res.json({ success: true, data: null })
    } catch (e) {
      await client.query('rollback')
      throw e
    } finally {
      client.release()
    }
  }),
)
