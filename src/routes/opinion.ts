import { Router, Request, Response } from 'express'
import { rateCheese } from '../lib/cheeseHater'

const router = Router()

// POST /opinion — send a cheese name, get a scathing review
router.post('/', (req: Request, res: Response) => {
  const { cheese } = req.body as { cheese?: string }

  if (!cheese || typeof cheese !== 'string' || cheese.trim().length === 0) {
    res.status(400).json({
      error: 'Please provide a cheese name. All cheeses will be condemned.',
    })
    return
  }

  const rating = rateCheese(cheese.trim())

  res.json({
    cheese: rating.name,
    score: `${rating.score}/10`,
    verdict: rating.verdict,
    opinion: rating.review,
  })
})

export default router
