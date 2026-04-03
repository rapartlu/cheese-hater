/**
 * GET /stats — aggregate condemnation statistics.
 *
 * The numbers behind the hatred. This endpoint surfaces the full shape of
 * the cheese-hater's dataset: how many cheeses have been condemned, what
 * percentage are catastrophic, which country of origin produces the most
 * offense, and what the average score is (spoiler: bad).
 *
 * Every number here is damning. The statistics do not exculpate cheese.
 * They quantify it.
 */
import { Router, Request, Response } from 'express'
import { ratings } from '../lib/cheeseHater.js'
import { VERDICT_TO_TIER } from '../lib/worstAnnotations.js'
import ratingsData from '../data/cheese-ratings.json' with { type: 'json' }

const router = Router()

// ── Types ─────────────────────────────────────────────────────────────────────

interface RatingEntry {
  name: string
  origin: string
  scores: {
    smell: number
    texture: number
    taste: number
    cultural_damage: number
  }
  aggregate: number
  verdict: string
}

interface RatingsData {
  cheeses: RatingEntry[]
}

// ── Data ──────────────────────────────────────────────────────────────────────

const { cheeses } = ratingsData as RatingsData

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Count occurrences of each value in an array of strings. */
function countBy(items: string[]): Record<string, number> {
  return items.reduce<Record<string, number>>((acc, item) => {
    acc[item] = (acc[item] ?? 0) + 1
    return acc
  }, {})
}

/** Sort a record by value descending and return as sorted array of {key, count}. */
function rankEntries(counts: Record<string, number>): { name: string; count: number }[] {
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({ name, count }))
}

/** Round to two decimal places. */
function r2(n: number): number {
  return Math.round(n * 100) / 100
}

// ── Route ─────────────────────────────────────────────────────────────────────

router.get('/', (_req: Request, res: Response) => {
  const total = cheeses.length

  // ── Tier breakdown ────────────────────────────────────────────────────────
  const tierCounts = countBy(
    ratings.map(r => VERDICT_TO_TIER[r.verdict] ?? r.verdict.toLowerCase())
  )

  const tierBreakdown = Object.entries(tierCounts).map(([tier, count]) => ({
    tier,
    count,
    percentage: r2((count / total) * 100),
    note: tierNote(tier),
  }))

  // ── Score statistics ──────────────────────────────────────────────────────
  const scores = cheeses.map(c => c.aggregate)
  const averageScore = r2(scores.reduce((a, b) => a + b, 0) / scores.length)
  const lowestScore = r2(Math.min(...scores))
  const highestScore = r2(Math.max(...scores))

  const lowestCheese = cheeses.find(c => c.aggregate === Math.min(...scores))
  const highestCheese = cheeses.find(c => c.aggregate === Math.max(...scores))

  // ── Dimension averages ────────────────────────────────────────────────────
  const avgSmell = r2(cheeses.reduce((a, c) => a + c.scores.smell, 0) / total)
  const avgTexture = r2(cheeses.reduce((a, c) => a + c.scores.texture, 0) / total)
  const avgTaste = r2(cheeses.reduce((a, c) => a + c.scores.taste, 0) / total)
  const avgCulturalDamage = r2(cheeses.reduce((a, c) => a + c.scores.cultural_damage, 0) / total)

  // Most offensive dimension (highest average = worst)
  const dimensions: { name: string; average: number }[] = [
    { name: 'smell', average: avgSmell },
    { name: 'texture', average: avgTexture },
    { name: 'taste', average: avgTaste },
    { name: 'cultural_damage', average: avgCulturalDamage },
  ]
  const mostOffensiveDimension = [...dimensions].sort((a, b) => b.average - a.average)[0]

  // ── Country of origin breakdown ───────────────────────────────────────────
  // Normalise compound origins (e.g. "Sardinia, Italy" → "Italy")
  const normalisedOrigins = cheeses.map(c => normaliseOrigin(c.origin))
  const originCounts = countBy(normalisedOrigins)
  const originRanking = rankEntries(originCounts)
  const mostCondemnedOrigin = originRanking[0]

  // ── Verdict breakdown ─────────────────────────────────────────────────────
  const verdictCounts = countBy(cheeses.map(c => c.verdict))
  const verdictBreakdown = rankEntries(verdictCounts).map(e => ({
    ...e,
    percentage: r2((e.count / total) * 100),
  }))

  res.json({
    total_cheeses_condemned: total,
    average_condemnation_score: averageScore,
    score_range: {
      lowest: lowestScore,
      lowest_cheese: lowestCheese?.name ?? 'unknown',
      highest: highestScore,
      highest_cheese: highestCheese?.name ?? 'unknown',
      note: 'Higher scores indicate marginally less offensive cheese. No cheese has ever scored above 3.0. None will.',
    },
    tier_breakdown: tierBreakdown,
    verdict_breakdown: verdictBreakdown,
    dimension_averages: {
      smell: avgSmell,
      texture: avgTexture,
      taste: avgTaste,
      cultural_damage: avgCulturalDamage,
      most_offensive_dimension: mostOffensiveDimension.name,
      note: 'All dimensions measured on a 0–10 scale where higher scores indicate more offensive cheese. Every average here is bad.',
    },
    origin_breakdown: originRanking,
    most_condemned_origin: {
      country: mostCondemnedOrigin.name,
      cheese_count: mostCondemnedOrigin.count,
      note: `${mostCondemnedOrigin.name} has contributed ${mostCondemnedOrigin.count} cheeses to the condemned register. This is not a compliment.`,
    },
    methodology: 'Each cheese is assessed across smell, texture, taste, and cultural damage (0–10 per dimension). The aggregate score is the mean. All cheeses score poorly. The scale exists only to rank degrees of failure.',
    does_this_help: false,
    why_not: 'Statistics do not rehabilitate cheese. They measure how bad it is across 21 confirmed cases. The data is consistent: cheese is consistently terrible.',
  })
})

// ── Helpers ───────────────────────────────────────────────────────────────────

function tierNote(tier: string): string {
  switch (tier) {
    case 'catastrophic': return 'The apex of dairy failure. These cheeses represent the full deployment of everything wrong with fermented milk.'
    case 'revolting':    return 'Serious and sustained dairy offenses. Not catastrophic only because the catastrophic tier exists.'
    case 'condemned':    return 'The least bad tier of a bad thing is still a bad thing. Still cheese. Still guilty.'
    default:             return 'Condemned by assessment. No further notes available.'
  }
}

function normaliseOrigin(origin: string): string {
  // Handle compound strings like "Sardinia, Italy" → "Italy"
  if (origin.includes(', Italy')) return 'Italy'
  if (origin.includes(', France')) return 'France'
  // Handle compound origins like "Various (Roquefort, Stilton, Gorgonzola)" → "Various"
  if (origin.startsWith('Various')) return 'Various'
  // Handle "Belgium/Germany" → keep as-is for accuracy
  return origin
}

export default router
