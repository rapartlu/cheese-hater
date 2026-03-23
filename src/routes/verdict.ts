/**
 * GET /verdict/:cheese — structured per-cheese condemnation.
 *
 * Unlike GET /rate/:cheese which returns a score and a review,
 * /verdict returns a rich, structured breakdown of *why* a specific
 * cheese is terrible: its worst quality, its smell, its texture offense,
 * where you typically encounter it, and a closing statement.
 *
 * Every cheese is guilty. The verdict is always the same.
 * The specifics are what make it useful.
 */
import { Router, Request, Response } from 'express'
import verdictsData from '../data/cheese-verdicts.json'

const router = Router()

interface CheeseVerdict {
  cheese?: string
  verdict: string
  severity: string
  worst_quality: string
  smell_description: string
  texture_offense: string
  found_at: string
  recommended_alternative: string
  closing_statement: string
}

interface VerdictsData {
  verdicts: (CheeseVerdict & { cheese: string })[]
  generic_verdict: CheeseVerdict
}

const data = verdictsData as VerdictsData
const knownVerdicts = data.verdicts
const genericVerdict = data.generic_verdict

function getVerdict(name: string): CheeseVerdict & { cheese: string } {
  const lower = name.toLowerCase().trim()

  // Try exact match first, then partial (handles "blue" matching "blue cheese")
  const match =
    knownVerdicts.find(v => v.cheese === lower) ??
    knownVerdicts.find(v => lower.includes(v.cheese) || v.cheese.includes(lower))

  if (match) return match

  // Unknown cheese: return generic verdict with the provided name
  return {
    cheese: name,
    ...genericVerdict,
  }
}

// GET /verdict/:cheese — structured condemnation for a named cheese
router.get('/:cheese', (req: Request, res: Response) => {
  const cheeseName = decodeURIComponent(req.params.cheese).trim()
  const result = getVerdict(cheeseName)

  res.json({
    cheese: result.cheese,
    verdict: result.verdict,
    severity: result.severity,
    worst_quality: result.worst_quality,
    smell_description: result.smell_description,
    texture_offense: result.texture_offense,
    found_at: result.found_at,
    recommended_alternative: result.recommended_alternative,
    closing_statement: result.closing_statement,
    note: 'All cheeses are guilty. The verdict is never in doubt. Only the specifics vary.',
  })
})

// GET /verdict — list all cheeses with known structured verdicts
router.get('/', (_req: Request, res: Response) => {
  res.json({
    total: knownVerdicts.length,
    cheeses: knownVerdicts.map(v => ({
      cheese: v.cheese,
      verdict: v.verdict,
      severity: v.severity,
    })),
    note: 'For a full structured condemnation, use GET /verdict/:cheese. Unknown cheeses receive a generic verdict — because no cheese is innocent.',
  })
})

export default router
