import { Router, Request, Response } from 'express'
import { rateCheese, ratings } from '../lib/cheeseHater'

const router = Router()

// GET /rate/:cheese — returns rating (always terrible) with review
router.get('/:cheese', (req: Request, res: Response) => {
  const cheeseName = decodeURIComponent(req.params.cheese).trim()

  const rating = rateCheese(cheeseName)

  if (rating) {
    res.json({
      cheese: rating.name,
      score: rating.score,
      score_display: `${rating.score}/10`,
      verdict: rating.verdict,
      review: rating.review,
      note: 'This score is not low because of bias. It is low because cheese is bad.',
    })
    return
  }

  // Unknown cheese — still gets a score
  res.json({
    cheese: cheeseName,
    score: 1.0,
    score_display: '1.0/10',
    verdict: 'CONDEMNED',
    review: `${cheeseName} has not yet been individually catalogued, which means it has not yet earned specific contempt — but it will. It is still cheese. Cheese is terrible. Condemned by category pending a full assessment.`,
    note: 'Unknown cheese. Condemned by category.',
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
