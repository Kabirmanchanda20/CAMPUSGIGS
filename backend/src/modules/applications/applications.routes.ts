import { Router } from 'express'
import { z } from 'zod'
import { asyncHandler } from '../../utils/asyncHandler.js'
import { requireAuth } from '../../middleware/requireAuth.js'
import { validate } from '../../middleware/validate.js'
import { pool, query } from '../../config/db.js'
import { AppError } from '../../utils/AppError.js'
import { holdEscrow } from '../../utils/wallet.js'

export const applicationsRouter = Router()

applicationsRouter.post(
  '/',
  requireAuth,
  validate({
    body: z.object({
      task_id: z.string().uuid(),
      message: z.string().optional(),
    }),
  }),
  asyncHandler(async (req, res) => {
    if (req.user!.campus_role === 'department') {
      throw new AppError(403, 'FORBIDDEN', 'Department accounts cannot apply')
    }
    const { rows: tasks } = await query(`select * from tasks where id = $1`, [req.body.task_id])
    const task = tasks[0]
    if (!task) throw new AppError(404, 'NOT_FOUND', 'Task not found')
    if (task.status !== 'open') throw new AppError(400, 'INVALID_STATUS', 'Task not open')
    if (task.poster_id === req.user!.id) throw new AppError(400, 'INVALID', 'Cannot apply to own listing')
    if (task.deadline && new Date(task.deadline) < new Date()) {
      throw new AppError(400, 'DEADLINE_PASSED', 'Cannot apply to a task whose deadline has passed')
    }
    if (task.listing_type === 'workshop' && task.max_participants) {
      const { rows: appCount } = await query<{ count: string }>(
        `select count(*)::text as count from applications where task_id = $1 and status <> 'rejected'`,
        [task.id],
      )
      if (Number(appCount[0]?.count ?? 0) >= task.max_participants) {
        throw new AppError(400, 'WORKSHOP_FULL', 'Workshop has reached maximum participant capacity')
      }
    }

    const { rows } = await query(
      `insert into applications (task_id, applicant_id, message)
       values ($1, $2, $3)
       on conflict (task_id, applicant_id) do nothing
       returning *`,
      [req.body.task_id, req.user!.id, req.body.message ?? null],
    )
    if (!rows[0]) throw new AppError(409, 'EXISTS', 'Already applied')
    await query(
      `insert into notifications (user_id, type, payload) values ($1, 'new_application', $2)`,
      [task.poster_id, JSON.stringify({ task_id: task.id, application_id: rows[0].id })],
    )
    res.status(201).json({ success: true, data: rows[0] })
  }),
)

applicationsRouter.get(
  '/task/:taskId',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { rows: tasks } = await query(`select poster_id from tasks where id = $1`, [
      req.params.taskId,
    ])
    if (!tasks[0] || tasks[0].poster_id !== req.user!.id) {
      throw new AppError(403, 'FORBIDDEN', 'Poster only')
    }
    const { rows } = await query(
      `select a.*, json_build_object('id', p.id, 'full_name', p.full_name, 'campus_role', p.campus_role, 'avg_rating', p.avg_rating, 'headline', p.headline) as applicant
       from applications a
       join profiles p on p.id = a.applicant_id
       where a.task_id = $1
       order by a.created_at asc`,
      [req.params.taskId],
    )
    res.json({ success: true, data: rows })
  }),
)

applicationsRouter.get(
  '/mine/:taskId',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { rows } = await query(
      `select * from applications where task_id = $1 and applicant_id = $2`,
      [req.params.taskId, req.user!.id],
    )
    res.json({ success: true, data: rows[0] ?? null })
  }),
)

applicationsRouter.post(
  '/:id/accept',
  requireAuth,
  asyncHandler(async (req, res) => {
    const client = await pool.connect()
    try {
      await client.query('begin')
      const { rows } = await client.query(
        `select a.*, t.poster_id, t.status as task_status, t.budget
         from applications a join tasks t on t.id = a.task_id
         where a.id = $1 for update of a, t`,
        [req.params.id],
      )
      const app = rows[0]
      if (!app) throw new AppError(404, 'NOT_FOUND', 'Application not found')
      if (app.poster_id !== req.user!.id) throw new AppError(403, 'FORBIDDEN', 'Poster only')
      if (app.task_status !== 'open') throw new AppError(400, 'INVALID_STATUS', 'Task not open')

      await holdEscrow(client, {
        taskId: app.task_id,
        posterId: app.poster_id,
        amount: Number(app.budget),
      })

      await client.query(
        `update tasks set status = 'assigned', worker_id = $2, updated_at = now() where id = $1`,
        [app.task_id, app.applicant_id],
      )
      const { rows: rejectedApps } = await client.query<{ applicant_id: string }>(
        `update applications set status = 'rejected' where task_id = $1 and id <> $2 and status = 'pending' returning applicant_id`,
        [app.task_id, app.id],
      )
      await client.query(
        `insert into notifications (user_id, type, payload) values ($1, 'application_accepted', $2)`,
        [app.applicant_id, JSON.stringify({ task_id: app.task_id, application_id: app.id })],
      )
      for (const r of rejectedApps) {
        await client.query(
          `insert into notifications (user_id, type, payload) values ($1, 'application_rejected', $2)`,
          [r.applicant_id, JSON.stringify({ task_id: app.task_id })],
        )
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

applicationsRouter.post(
  '/:id/reject',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { rows } = await query(
      `select a.*, t.poster_id from applications a join tasks t on t.id = a.task_id where a.id = $1`,
      [req.params.id],
    )
    const app = rows[0]
    if (!app) throw new AppError(404, 'NOT_FOUND', 'Application not found')
    if (app.poster_id !== req.user!.id) throw new AppError(403, 'FORBIDDEN', 'Poster only')
    if (app.status !== 'pending') {
      throw new AppError(400, 'INVALID_STATUS', 'Only pending applications can be rejected')
    }
    await query(`update applications set status = 'rejected' where id = $1`, [app.id])
    await query(
      `insert into notifications (user_id, type, payload) values ($1, 'application_rejected', $2)`,
      [app.applicant_id, JSON.stringify({ task_id: app.task_id })],
    )
    res.json({ success: true, data: null })
  }),
)

applicationsRouter.post(
  '/:id/withdraw',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { rows } = await query(
      `select a.* from applications a where a.id = $1`,
      [req.params.id],
    )
    const app = rows[0]
    if (!app) throw new AppError(404, 'NOT_FOUND', 'Application not found')
    if (app.applicant_id !== req.user!.id) throw new AppError(403, 'FORBIDDEN', 'Applicant only')
    if (app.status !== 'pending') {
      throw new AppError(400, 'INVALID_STATUS', 'Only pending applications can be withdrawn')
    }
    await query(`delete from applications where id = $1`, [app.id])
    res.json({ success: true, data: null })
  }),
)
