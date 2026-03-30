/**
 * GET /cheese/:name/rank — leaderboard position and shame context for a named cheese.
 * GET /cheese/:name      — unified full-profile endpoint for any cheese.
 *
 * /rank: Returns the cheese's position in the full scoring hierarchy — rank,
 * score, severity tier, percentile of awfulness, nearest rivals, plus up to
 * 3 cheeses it scores worse than and 3 it scores better than. Unknown cheeses
 * are inserted at their score position (score 1.0, CONDEMNED by default).
 *
 * /:name: Aggregates every dimension of condemnation into a single response:
 * score, severity tier, structured verdict, smell, texture, cultural damage,
 * pairings (co-condemned companions), and the full roast.
 *
 * ROUTING ORDER: /:name/rank must be registered before /:name so the static
 * /rank suffix takes priority over the dynamic parameter match.
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

interface RankNeighbour {
  cheese: string
  rank: number
  score: number
}

type NullableNeighbour = RankNeighbour | null

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

// ── Routes ────────────────────────────────────────────────────────────────────

// GET /cheese/:name/rank — leaderboard position + shame context
router.get('/:name/rank', (req: Request, res: Response) => {
  const cheeseName = req.params.name.trim()
  const rating = rateCheese(cheeseName)
  const isKnown = ratings.some(r => r.name.toLowerCase() === cheeseName.toLowerCase())

  // Build full leaderboard: sort all rated cheeses by score ascending (worst first)
  const sorted = [...ratings].sort((a, b) => a.score - b.score)
  const total = sorted.length

  // Find position — for known cheeses, locate exact match; for unknown,
  // insert at the score position to give a meaningful rank.
  let rank: number
  let insertedEntry: { name: string; score: number; verdict: string }

  if (isKnown) {
    const idx = sorted.findIndex(r => r.name.toLowerCase() === rating.name.toLowerCase())
    rank = idx + 1
    insertedEntry = sorted[idx]
  } else {
    // Insert the unknown cheese into the sorted list to find its position
    const insertIdx = sorted.findIndex(r => r.score > rating.score)
    rank = insertIdx === -1 ? total + 1 : insertIdx + 1
    insertedEntry = { name: rating.name, score: rating.score, verdict: rating.verdict }
  }

  // percentile_of_awfulness: % of rated cheeses that score HIGHER (are less bad)
  // A cheese at rank 1 (lowest score) has the highest awfulness percentile.
  const cheesesWithHigherScore = sorted.filter(r =>
    r.name.toLowerCase() !== rating.name.toLowerCase() && r.score > rating.score
  ).length
  const percentileOfAwfulness = Math.round((cheesesWithHigherScore / total) * 100)

  // worse_than: up to 3 cheeses with lower score (outranking us — they're more hated)
  const worseThan = sorted
    .filter(r => r.score < rating.score && r.name.toLowerCase() !== rating.name.toLowerCase())
    .slice(-3)  // take the 3 closest below (highest scores among those lower)
    .reverse()
    .map(r => ({ cheese: r.name, score: r.score, severity_tier: toSeverityTier(r.verdict) }))

  // better_than: up to 3 cheeses with higher score (ranked below us — slightly less bad)
  const betterThan = sorted
    .filter(r => r.score > rating.score && r.name.toLowerCase() !== rating.name.toLowerCase())
    .slice(0, 3)
    .map(r => ({ cheese: r.name, score: r.score, severity_tier: toSeverityTier(r.verdict) }))

  // nearest_rivals: immediate neighbours in the ranked list
  const sortedWithTarget = isKnown
    ? sorted
    : [...sorted.slice(0, rank - 1), insertedEntry, ...sorted.slice(rank - 1)]

  const aboveEntry = rank > 1 ? sortedWithTarget[rank - 2] : null
  const belowEntry = rank <= sortedWithTarget.length - 1 ? sortedWithTarget[rank] : null

  const above: NullableNeighbour = aboveEntry
    ? { cheese: aboveEntry.name, rank: rank - 1, score: aboveEntry.score }
    : null
  const below: NullableNeighbour = belowEntry
    ? { cheese: belowEntry.name, rank: rank + 1, score: belowEntry.score }
    : null

  const roast = buildRoastForCheese(cheeseName)

  res.json({
    cheese: rating.name,
    rank,
    total_rated: total,
    score: rating.score,
    severity_tier: toSeverityTier(rating.verdict),
    percentile_of_awfulness: percentileOfAwfulness,
    is_rated: isKnown,
    worse_than: worseThan,
    better_than: betterThan,
    nearest_rivals: { above, below },
    roast,
    note: 'All information presented is damning. There is no exculpatory section.',
  })
})

// GET /cheese/:name — unified full condemnation profile
router.get('/:name', (req: Request, res: Response) => {
  const cheeseName = req.params.name.trim()

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
