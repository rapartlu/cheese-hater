/**
 * GET /cheese/:name — unified full-profile endpoint for any cheese.
 *
 * Aggregates every dimension of condemnation into a single response:
 * score, severity tier, structured verdict, smell, texture, cultural damage,
 * pairings (co-condemned companions), and the full roast.
 *
 * Unknown cheeses receive generic condemnation data — never a 404.
 * All information presented is damning. There is no exculpatory section.
 */
import { Router, Request, Response } from 'express'
import { rateCheese, ratings } from '../lib/cheeseHater.js'
import { VERDICT_TO_TIER, WHY_IT_WINS, defaultWhyItWins } from '../lib/worstAnnotations.js'
import verdictsData from '../data/cheese-verdicts.json' with { type: 'json' }

const router = Router()

// ── Types ─────────────────────────────────────────────────────────────────────

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
  smell_score?: number
  texture_score?: number
  cultural_damage_score?: number
}

interface VerdictsData {
  verdicts: (CheeseVerdict & { cheese: string })[]
  generic_verdict: CheeseVerdict
}

interface Pairing {
  cheese: string
  score: number
  verdict: string
  note: string
}

// ── Data ──────────────────────────────────────────────────────────────────────

const data = verdictsData as VerdictsData
const knownVerdicts = data.verdicts
const genericVerdict = data.generic_verdict

// ── Helpers ───────────────────────────────────────────────────────────────────

function getStructuredVerdict(name: string): CheeseVerdict & { cheese: string } {
  const lower = name.toLowerCase().trim()
  const match =
    knownVerdicts.find(v => v.cheese === lower) ??
    knownVerdicts.find(v => lower.includes(v.cheese) || v.cheese.includes(lower))
  if (match) return match
  return { cheese: name, ...genericVerdict }
}

/**
 * Map a verdict string to the public-facing severity tier label.
 * Falls back gracefully for any verdict not in the standard map.
 */
function toSeverityTier(verdict: string): string {
  return VERDICT_TO_TIER[verdict.toUpperCase()] ?? verdict.toLowerCase()
}

/**
 * Build a short roast for a cheese using available rating data.
 */
function buildRoastForCheese(name: string): string {
  const rating = rateCheese(name)
  const whyItWins = WHY_IT_WINS[name] ?? defaultWhyItWins(name, rating.score)
  return [
    rating.review,
    whyItWins,
  ].join('\n\n')
}

/**
 * Find up to 3 cheeses of similar score — the condemned companions.
 * Excludes the target cheese by name. Sorted by score similarity (ascending delta).
 */
function buildPairings(targetName: string, targetScore: number): Pairing[] {
  const lower = targetName.toLowerCase()
  return [...ratings]
    .filter(r => r.name.toLowerCase() !== lower)
    .map(r => ({
      ...r,
      delta: Math.abs(r.score - targetScore),
    }))
    .sort((a, b) => a.delta - b.delta)
    .slice(0, 3)
    .map(r => ({
      cheese: r.name,
      score: r.score,
      verdict: r.verdict,
      note: `Frequently found on the same boards as ${targetName}. Equally condemned.`,
    }))
}

// ── Route ─────────────────────────────────────────────────────────────────────

// GET /cheese/:name — unified full condemnation profile
router.get('/:name', (req: Request, res: Response) => {
  const cheeseName = decodeURIComponent(req.params.name).trim()

  const rating = rateCheese(cheeseName)
  const structured = getStructuredVerdict(cheeseName)
  const severityTier = toSeverityTier(rating.verdict)
  const culturalDamageScore = structured.cultural_damage_score ?? genericVerdict.cultural_damage_score ?? 5
  const pairings = buildPairings(cheeseName, rating.score)
  const roast = buildRoastForCheese(cheeseName)

  res.json({
    cheese: rating.name,
    score: rating.score,
    severity_tier: severityTier,
    verdict: structured.verdict,
    worst_quality: structured.worst_quality,
    smell_description: structured.smell_description,
    texture_offense: structured.texture_offense,
    cultural_damage_score: culturalDamageScore,
    found_at: structured.found_at,
    recommended_alternative: structured.recommended_alternative,
    closing_statement: structured.closing_statement,
    pairings,
    roast,
    note: 'All information presented is damning. There is no exculpatory section.',
  })
})

export default router
