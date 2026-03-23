import { Router, Request, Response } from 'express'
import { getRandomRant } from '../lib/cheeseHater'

const router = Router()

// GET /random-rant — returns a random passionate anti-cheese rant
router.get('/', (_req: Request, res: Response) => {
  res.json({
    rant: getRandomRant(),
    note: 'Every rant is true. Every rant is sourced. Cheese is indefensible.',
  })
})

export default router
