import { Router, Request, Response } from 'express'
import { getRandomFact, facts } from '../lib/cheeseHater'

const router = Router()

// GET /facts — random damning cheese fact
// Optional query: ?category=health|what-it-is|how-its-made|industry-secrets
// Optional query: ?severity=5  (minimum severity)
router.get('/', (req: Request, res: Response) => {
  const { category, severity } = req.query

  try {
    // Filter by minimum severity if requested — check before calling getRandomFact
    if (severity !== undefined) {
      const minSeverity = parseInt(severity as string, 10)
      if (isNaN(minSeverity) || minSeverity < 1 || minSeverity > 5) {
        res.status(400).json({ error: 'severity must be an integer between 1 and 5' })
        return
      }
      const pool = facts.filter(f =>
        f.severity >= minSeverity &&
        (!category || f.category === category)
      )
      if (pool.length === 0) {
        res.status(404).json({ error: `No facts found with severity >= ${minSeverity}${category ? ` in category '${category}'` : ''}` })
        return
      }
      const severeFact = pool[Math.floor(Math.random() * pool.length)]
      res.json({
        fact: severeFact.text,
        category: severeFact.category,
        severity: severeFact.severity,
        total_facts: facts.length,
      })
      return
    }

    const fact = getRandomFact(category as string | undefined)
    res.json({
      fact: fact.text,
      category: fact.category,
      severity: fact.severity,
      total_facts: facts.length,
    })
  } catch (err) {
    res.status(400).json({ error: (err as Error).message })
  }
})

// GET /facts/all — return every damning cheese fact
router.get('/all', (_req: Request, res: Response) => {
  res.json({
    total: facts.length,
    facts: facts.map(f => ({
      id: f.id,
      text: f.text,
      category: f.category,
      severity: f.severity,
    })),
    note: 'Every fact is sourced. Every fact is damning. Cheese is indefensible.',
  })
})

export default router
