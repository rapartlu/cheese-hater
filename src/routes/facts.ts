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

// GET /facts/search — filter facts by keyword and optional category
// Results sorted by severity descending (most alarming first).
router.get('/search', (req: Request, res: Response) => {
  const rawQ = req.query.q
  const rawCategory = req.query.category

  if (!rawQ || typeof rawQ !== 'string' || rawQ.trim() === '') {
    res.status(400).json({
      error: 'Query parameter ?q is required and must not be empty.',
      usage: 'GET /facts/search?q=<query>',
      examples: [
        'GET /facts/search?q=bacteria',
        'GET /facts/search?q=mold',
        'GET /facts/search?q=illegal',
        'GET /facts/search?q=EU',
      ],
      note: 'Every fact is damning. The query only determines which facts surface first.',
    })
    return
  }

  const query = rawQ.trim().toLowerCase()

  const VALID_CATEGORIES = new Set(['what-it-is', 'how-its-made', 'health', 'industry-secrets'])
  if (rawCategory !== undefined) {
    if (typeof rawCategory !== 'string' || !VALID_CATEGORIES.has(rawCategory)) {
      res.status(400).json({
        error: 'Invalid category value.',
        valid_categories: [...VALID_CATEGORIES],
        note: 'Every category is bad. These are only the ways of classifying bad.',
      })
      return
    }
  }

  const categoryFilter = typeof rawCategory === 'string' ? rawCategory : null

  const results = facts
    .filter(f => {
      const matchesQuery =
        f.text.toLowerCase().includes(query) ||
        f.category.toLowerCase().includes(query)
      const matchesCategory = !categoryFilter || f.category === categoryFilter
      return matchesQuery && matchesCategory
    })
    .sort((a, b) => b.severity - a.severity) // most alarming first
    .map(f => ({
      id: f.id,
      text: f.text,
      category: f.category,
      severity: f.severity,
    }))

  res.json({
    query: rawQ.trim(),
    ...(categoryFilter ? { filtered_by_category: categoryFilter } : {}),
    results,
    total: results.length,
    note: results.length > 0
      ? 'Every fact is damning. The query only determines which facts are most immediately relevant.'
      : 'No facts matched this query. All cheese remains indefensible regardless.',
  })
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
