/**
 * GET /compare?a=<cheese>&b=<cheese> — structured head-to-head condemnation.
 *
 * Unlike GET /roast/versus (which returns prose), /compare returns structured,
 * field-by-field data: which cheese is worse at smell, texture, and cultural
 * damage, with margin ratings and a reasoned winner declaration.
 *
 * Both cheeses are always guilty. This endpoint only determines the hierarchy
 * of guilt.
 */
import { Router, Request, Response } from 'express'
import { rateCheese } from '../lib/cheeseHater'
import verdictsData from '../data/cheese-verdicts.json'

const router = Router()

// ── Types ─────────────────────────────────────────────────────────────────────

interface VerdictEntry {
  cheese: string
  verdict: string
  severity: string
  worst_quality: string
  smell_description: string
  texture_offense: string
  found_at: string
  recommended_alternative: string
  closing_statement: string
  smell_score: number
  texture_score: number
  cultural_damage_score: number
}

interface VerdictsFile {
  verdicts: VerdictEntry[]
  generic_verdict: Omit<VerdictEntry, 'cheese'>
}

const data = verdictsData as VerdictsFile

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Retrieve the full verdict entry for a cheese name, falling back to the
 * generic verdict if the cheese isn't in the database. Tries exact match,
 * then partial match (handles "blue" → "blue cheese").
 */
function getFullVerdict(name: string): VerdictEntry {
  const lower = name.toLowerCase().trim()
  const match =
    data.verdicts.find(v => v.cheese === lower) ??
    data.verdicts.find(v => lower.includes(v.cheese) || v.cheese.includes(lower))

  if (match) return match

  return {
    cheese: name,
    ...data.generic_verdict,
  }
}

/**
 * Convert a score difference into a human-readable margin label.
 * Scores are on a 1–10 dimension scale.
 */
function dimensionMargin(scoreDiff: number): string {
  const abs = Math.abs(scoreDiff)
  if (abs >= 4) return 'decisive'
  if (abs >= 2) return 'significant'
  if (abs >= 1) return 'moderate'
  return 'marginal'
}

/**
 * Convert a rating score difference into a human-readable margin label.
 * Rating scores run 0–10 (lower = more terrible); the scale is tighter.
 */
function ratingMargin(scoreDiff: number): string {
  const abs = Math.abs(scoreDiff)
  if (abs >= 1.5) return 'decisive'
  if (abs >= 0.75) return 'significant'
  if (abs >= 0.25) return 'moderate'
  return 'marginal'
}

/**
 * Determine which cheese wins a single dimension comparison.
 * Returns { worse: cheeseName, margin } or null for exact ties.
 */
function dimensionResult(
  nameA: string,
  scoreA: number,
  nameB: string,
  scoreB: number,
): { worse: string; margin: string } | null {
  if (scoreA === scoreB) return null
  const worse = scoreA > scoreB ? nameA : nameB
  return { worse, margin: dimensionMargin(scoreA - scoreB) }
}

/**
 * Build a specific, reasoned winner_reason string based on which cheese won
 * and which dimensions drove the result.
 */
function buildWinnerReason(
  winner: VerdictEntry,
  loser: VerdictEntry,
  winningDimensions: string[],
): string {
  const w = winner.cheese.charAt(0).toUpperCase() + winner.cheese.slice(1)
  const l = loser.cheese.charAt(0).toUpperCase() + loser.cheese.slice(1)

  if (winningDimensions.length === 0) {
    // Tiebreaker — scores identical, picked alphabetically
    return `${w} and ${l} are effectively equivalent in their terribleness. ${w} edges out ${l} only alphabetically — a distinction without a moral difference. Both are guilty of being cheese.`
  }

  if (winningDimensions.length === 3) {
    return `${w} wins on every dimension — smell, texture, and cultural damage. ${winner.closing_statement} ${l} is guilty; ${w} simply achieves a higher order of offense.`
  }

  if (winningDimensions.includes('smell') && winningDimensions.includes('texture')) {
    return `${w} is worse than ${l} on both sensory dimensions. Its smell — ${winner.smell_description} — is accompanied by a texture offense of: ${winner.texture_offense}. ${l}'s primary crime is ${loser.worst_quality}, which is genuine, but ${w} attacks more senses simultaneously.`
  }

  if (winningDimensions.includes('smell') && winningDimensions.includes('cultural_damage')) {
    return `${w} is worse than ${l} in smell and in cultural reach. ${w}'s smell — ${winner.smell_description} — pairs with the damage of being ${winner.found_at}. ${l} is bad; ${w} spreads its offense further.`
  }

  if (winningDimensions.includes('texture') && winningDimensions.includes('cultural_damage')) {
    return `${w} beats ${l} on texture and cultural damage. The texture offense: ${winner.texture_offense}. Found at: ${winner.found_at}. ${l} is guilty of ${loser.worst_quality}, but ${w}'s offense is wider.`
  }

  if (winningDimensions.includes('smell')) {
    return `${w} is worse than ${l} primarily because of its smell. ${winner.smell_description} — against which ${l}'s smell (${loser.smell_description}) is relatively restrained. ${winner.closing_statement}`
  }

  if (winningDimensions.includes('texture')) {
    return `${w} is worse than ${l} primarily in texture. ${winner.texture_offense}. ${l}'s texture (${loser.texture_offense}) is bad, but ${w}'s is the dominant offense.`
  }

  // cultural_damage only
  return `${w} is worse than ${l} primarily in cultural damage. Found at: ${winner.found_at}. ${l}'s cultural reach (${loser.found_at}) is real but contained. ${winner.closing_statement}`
}

// ── Route ─────────────────────────────────────────────────────────────────────

router.get('/', (req: Request, res: Response) => {
  const rawA = req.query.a
  const rawB = req.query.b

  // Validate both params are present and are strings
  if (!rawA || !rawB || typeof rawA !== 'string' || typeof rawB !== 'string') {
    res.status(400).json({
      error: 'Both query parameters are required.',
      usage: 'GET /compare?a=<cheese>&b=<cheese>',
      example: 'GET /compare?a=brie&b=cheddar',
      note: 'Both cheeses will be found guilty. The only question is which is worse.',
    })
    return
  }

  const nameA = decodeURIComponent(rawA).trim()
  const nameB = decodeURIComponent(rawB).trim()

  if (nameA.toLowerCase() === nameB.toLowerCase()) {
    res.status(400).json({
      error: 'You have submitted the same cheese twice.',
      note: 'Comparing a cheese to itself only confirms it is terrible — which we already knew. Provide two distinct cheeses.',
    })
    return
  }

  // Get rating scores (lower = more condemned)
  const ratingA = rateCheese(nameA)
  const ratingB = rateCheese(nameB)

  // Get verdict data (smell, texture, cultural_damage dimension scores)
  const verdictA = getFullVerdict(nameA)
  const verdictB = getFullVerdict(nameB)

  // Determine overall winner: lower rating score = more terrible
  const scoreDiff = ratingA.score - ratingB.score
  let winner: VerdictEntry
  let loser: VerdictEntry

  if (Math.abs(scoreDiff) < 0.001) {
    // True tie: alphabetical tiebreaker
    winner = nameA.toLowerCase() <= nameB.toLowerCase() ? verdictA : verdictB
    loser = winner === verdictA ? verdictB : verdictA
  } else {
    winner = scoreDiff < 0 ? verdictA : verdictB
    loser = winner === verdictA ? verdictB : verdictA
  }

  // Dimension comparisons
  const smellResult = dimensionResult(
    verdictA.cheese, verdictA.smell_score,
    verdictB.cheese, verdictB.smell_score,
  )
  const textureResult = dimensionResult(
    verdictA.cheese, verdictA.texture_score,
    verdictB.cheese, verdictB.texture_score,
  )
  const culturalResult = dimensionResult(
    verdictA.cheese, verdictA.cultural_damage_score,
    verdictB.cheese, verdictB.cultural_damage_score,
  )

  // Which dimensions did the overall winner win?
  const winningDimensions: string[] = []
  if (smellResult?.worse === winner.cheese) winningDimensions.push('smell')
  if (textureResult?.worse === winner.cheese) winningDimensions.push('texture')
  if (culturalResult?.worse === winner.cheese) winningDimensions.push('cultural_damage')

  const overallMargin = ratingMargin(scoreDiff)

  const winnerReason = buildWinnerReason(winner, loser, winningDimensions)

  res.json({
    cheese_a: ratingA.name,
    cheese_b: ratingB.name,
    // Parallel per-cheese threat profiles
    profiles: {
      [ratingA.name]: {
        score: ratingA.score,
        severity_tier: verdictA.severity,
        verdict: verdictA.verdict,
        worst_quality: verdictA.worst_quality,
        smell_description: verdictA.smell_description,
        texture_offense: verdictA.texture_offense,
        found_at: verdictA.found_at,
        closing_statement: verdictA.closing_statement,
      },
      [ratingB.name]: {
        score: ratingB.score,
        severity_tier: verdictB.severity,
        verdict: verdictB.verdict,
        worst_quality: verdictB.worst_quality,
        smell_description: verdictB.smell_description,
        texture_offense: verdictB.texture_offense,
        found_at: verdictB.found_at,
        closing_statement: verdictB.closing_statement,
      },
    },
    // Structured verdict object
    verdict: {
      winner: winner.cheese,
      loser: loser.cheese,
      margin: overallMargin,
      reason: winnerReason,
    },
    // Kept for backward compatibility
    winner: winner.cheese,
    loser: loser.cheese,
    winner_reason: winnerReason,
    scores: {
      [ratingA.name]: ratingA.score,
      [ratingB.name]: ratingB.score,
      margin: overallMargin,
      note: 'Lower score = more condemned. The winner is the more terrible cheese.',
    },
    comparison: {
      smell: smellResult ?? {
        worse: 'tied',
        margin: 'none — equally offensive in this dimension',
      },
      texture: textureResult ?? {
        worse: 'tied',
        margin: 'none — equally offensive in this dimension',
      },
      cultural_damage: culturalResult ?? {
        worse: 'tied',
        margin: 'none — equally offensive in this dimension',
      },
      severity_delta: Math.abs(ratingA.score - ratingB.score),
    },
    note: 'Both cheeses are guilty. This comparison only determines the hierarchy of guilt.',
  })
})

export default router
