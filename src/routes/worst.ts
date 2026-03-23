/**
 * GET /worst — all cheeses ranked from most to least terrible.
 *
 * Answers the question every cheese-hater actually has: which cheese is
 * the worst of all? Sorted ascending by score (lower = more condemned),
 * with each entry annotated with a severity_tier and a why_it_wins field
 * that makes the ranking self-contained and quotable.
 *
 * Query params:
 *   ?tier=catastrophic|revolting|condemned   — filter by severity tier
 *   ?limit=N                                 — return only top N entries
 */
import { Router, Request, Response } from 'express'
import { ratings } from '../lib/cheeseHater'
import { WHY_IT_WINS, VERDICT_TO_TIER, defaultWhyItWins } from '../lib/worstAnnotations'

const router = Router()

const VALID_TIERS = new Set(['catastrophic', 'revolting', 'condemned'])

// ── Route ─────────────────────────────────────────────────────────────────────

router.get('/', (req: Request, res: Response) => {
  // --- query param validation ---
  const tierParam = req.query.tier
  const limitParam = req.query.limit

  if (tierParam !== undefined) {
    if (typeof tierParam !== 'string' || !VALID_TIERS.has(tierParam.toLowerCase())) {
      res.status(400).json({
        error: 'Invalid tier value.',
        valid_tiers: ['catastrophic', 'revolting', 'condemned'],
        note: 'Every tier is bad. These are only the categories of bad.',
      })
      return
    }
  }

  let limit: number | null = null
  if (limitParam !== undefined) {
    limit = parseInt(String(limitParam), 10)
    if (isNaN(limit) || limit < 1) {
      res.status(400).json({
        error: 'Invalid limit value. Must be a positive integer.',
        example: 'GET /worst?limit=5',
      })
      return
    }
  }

  // --- build ranked list (ascending score = most terrible first) ---
  const sorted = [...ratings].sort((a, b) => a.score - b.score)

  let ranked = sorted.map((r, idx) => ({
    rank: idx + 1,
    cheese: r.name,
    score: r.score,
    severity_tier: VERDICT_TO_TIER[r.verdict] ?? r.verdict.toLowerCase(),
    verdict: r.verdict,
    why_it_wins:
      WHY_IT_WINS[r.name] ?? defaultWhyItWins(r.name, r.score),
  }))

  // --- tier filter (applied before limit so ranks are global) ---
  const tier = tierParam ? String(tierParam).toLowerCase() : null
  const filtered = tier ? ranked.filter(e => e.severity_tier === tier) : ranked

  // re-rank within the filtered set so rank 1 is still the worst shown
  const reranked = filtered.map((e, idx) => ({ ...e, rank: idx + 1 }))

  // --- limit ---
  const result = limit !== null ? reranked.slice(0, limit) : reranked

  res.json({
    ranked: result,
    total: result.length,
    total_in_database: sorted.length,
    ...(tier ? { filtered_by_tier: tier } : {}),
    ...(limit !== null ? { limit } : {}),
    note: 'Ranked from most terrible to least. The least terrible cheese on this list is still cheese.',
  })
})

export default router
