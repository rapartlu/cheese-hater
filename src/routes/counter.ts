import { Router, Request, Response } from 'express'
import { counterArgument, counterArgs } from '../lib/cheeseHater'

const router = Router()

// GET /counter/:argument — rebuts a pro-cheese argument
router.get('/:argument', (req: Request, res: Response) => {
  const { argument } = req.params
  const decoded = decodeURIComponent(argument)
  const result = counterArgument(decoded)

  res.json({
    argument: result.argument,
    rebuttal: result.rebuttal,
    verdict: 'Argument dismissed.',
  })
})

// GET /counter — list all known pro-cheese arguments we handle
router.get('/', (_req: Request, res: Response) => {
  res.json({
    total: counterArgs.length,
    arguments: counterArgs.map(a => ({
      keywords: a.keywords,
      preview: a.rebuttal.slice(0, 100) + '...',
    })),
    note: 'No pro-cheese argument has ever survived scrutiny. These are the receipts.',
  })
})

export default router
