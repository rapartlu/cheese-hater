/**
 * Shared profile builder for the cheese-hater API.
 *
 * Aggregates every available data dimension for a named cheese into a
 * single structured profile object. Used by GET /random (and eventually
 * GET /cheese/:name) so both endpoints return an identical shape.
 *
 * Profile shape:
 *   cheese, score, severity_tier, verdict, worst_quality,
 *   smell_description, texture_offense, cultural_damage_score,
 *   found_at, recommended_alternative, closing_statement,
 *   etymology, pairings, roast
 */
import { rateCheese, ratings } from './cheeseHater.js'
import { VERDICT_TO_TIER, WHY_IT_WINS, defaultWhyItWins } from './worstAnnotations.js'
import verdictsData from '../data/cheese-verdicts.json' with { type: 'json' }
import etymologiesData from '../data/cheese-etymologies.json' with { type: 'json' }

// ── Types ─────────────────────────────────────────────────────────────────────

interface RawVerdict {
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

interface RawEtymology {
  cheese: string
  aliases?: string[]
  origin_language?: string
  origin_word?: string
  meaning?: string
  story?: string
  first_recorded?: string
  does_this_help: boolean
  why_not?: string
}

export interface Etymology {
  origin_word: string | null
  meaning: string | null
  story: string | null
  first_recorded: string | null
  does_this_help: false
  why_not: string | null
}

export interface Pairing {
  cheese: string
  score: number
  verdict: string
  note: string
}

export interface CheeseProfile {
  cheese: string
  score: number
  severity_tier: string
  verdict: string
  worst_quality: string
  smell_description: string
  texture_offense: string
  cultural_damage_score: number
  found_at: string
  recommended_alternative: string
  closing_statement: string
  etymology: Etymology
  pairings: Pairing[]
  roast: string
}

// ── Data ──────────────────────────────────────────────────────────────────────

const knownVerdicts = (verdictsData as { verdicts: (RawVerdict & { cheese: string })[] }).verdicts
const genericVerdict = (verdictsData as { generic_verdict: RawVerdict }).generic_verdict

const etymologies = etymologiesData as RawEtymology[]

// ── Internal helpers ──────────────────────────────────────────────────────────

function getStructuredVerdict(name: string): RawVerdict & { cheese: string } {
  const lower = name.toLowerCase().trim()
  const match =
    knownVerdicts.find(v => v.cheese === lower) ??
    knownVerdicts.find(v => lower.includes(v.cheese) || v.cheese.includes(lower))
  return match ?? { cheese: name, ...genericVerdict }
}

function getEtymology(name: string): Etymology {
  const lower = name.toLowerCase().trim()
  const match = etymologies.find(e =>
    e.cheese === lower ||
    (e.aliases ?? []).some(a => a === lower)
  )
  return {
    origin_word: match?.origin_word ?? null,
    meaning: match?.meaning ?? null,
    story: match?.story ?? null,
    first_recorded: match?.first_recorded ?? null,
    does_this_help: false,
    why_not: match?.why_not ?? 'Knowing the etymology of this cheese does not make it better. It is still cheese.',
  }
}

function buildRoast(name: string, score: number, review: string): string {
  const whyItWins = WHY_IT_WINS[name] ?? defaultWhyItWins(name, score)
  return `${review}\n\n${whyItWins}`
}

function buildPairings(targetName: string, targetScore: number): Pairing[] {
  const lower = targetName.toLowerCase()
  return [...ratings]
    .filter(r => r.name.toLowerCase() !== lower)
    .map(r => ({ ...r, delta: Math.abs(r.score - targetScore) }))
    .sort((a, b) => a.delta - b.delta)
    .slice(0, 3)
    .map(r => ({
      cheese: r.name,
      score: r.score,
      verdict: r.verdict,
      note: `Frequently found on the same boards as ${targetName}. Equally condemned.`,
    }))
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Build a complete condemnation profile for a named cheese.
 * Unknown cheeses receive generic data — never throws.
 */
export function buildProfile(name: string): CheeseProfile {
  const rating = rateCheese(name)
  const structured = getStructuredVerdict(name)
  const severityTier = VERDICT_TO_TIER[rating.verdict.toUpperCase()] ?? rating.verdict.toLowerCase()
  const culturalDamageScore = structured.cultural_damage_score ?? genericVerdict.cultural_damage_score ?? 5

  return {
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
    etymology: getEtymology(name),
    pairings: buildPairings(name, rating.score),
    roast: buildRoast(rating.name, rating.score, rating.review),
  }
}
