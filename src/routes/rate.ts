import { Router, Request, Response } from 'express'
import { rateCheese, ratings } from '../lib/cheeseHater'

const router = Router()

// GET /rate/:cheese — returns rating (always terrible) with review
router.get('/:cheese', (req: Request, res: Response) => {
  const cheeseName = decodeURIComponent(req.params.cheese).trim()

  const rating = rateCheese(cheeseName)

  res.json({
    cheese: rating.name,
    score: rating.score,
    score_display: `${rating.score}/10`,
    verdict: rating.verdict,
    review: rating.review,
    note: 'This score is not low because of bias. It is low because cheese is bad.',
  })
})

// GET /rate — list all rated cheeses
router.get('/', (_req: Request, res: Response) => {
  res.json({
    total: ratings.length,
    cheeses: ratings.map(r => ({
      name: r.name,
      score: r.score,
      verdict: r.verdict,
    })),
    note: 'Every cheese rated. Every cheese condemned. No exceptions.',
  })
})

export default router
