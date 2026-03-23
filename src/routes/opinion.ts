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

  if (rating) {
    res.json({
      cheese: rating.name,
      score: `${rating.score}/10`,
      verdict: rating.verdict,
      opinion: rating.review,
    })
  } else {
    // Unknown cheese still gets condemned
    res.json({
      cheese: cheese.trim(),
      score: '1.0/10',
      verdict: 'CONDEMNED',
      opinion: `${cheese.trim()} is cheese. Cheese is terrible. This one is no exception. The fact that it exists at all is an indictment. It is fermented dairy — mold, bacteria, curdled milk — shaped into a form and given a name. The name changes nothing about what it is.`,
    })
  }
})

export default router
