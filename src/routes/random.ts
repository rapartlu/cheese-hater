/**
 * GET /random — randomly selected cheese with full condemnation profile.
 *
 * Returns a complete threat profile for a cheese drawn from the rated
 * database. On every default call the selection is genuinely random —
 * useful for Discord bots, shareable links, or anyone who wants a new
 * piece of outrage on demand.
 *
 * Query parameters:
 *   today_only=true — switch to deterministic daily seeding. The same
 *                     cheese is returned for every call on a given UTC
 *                     date, matching the same hash used by GET /roast.
 *                     Useful for daily-digest integrations.
 *
 *   tier=<name>     — restrict selection to a specific severity tier.
 *                     Valid values: catastrophic | revolting | condemned
 *                     Returns 400 for unknown tier names.
 *                     Combines freely with today_only=true.
 *
 * The response shape matches the unified /cheese/:name endpoint, plus
 * today_only (boolean), optional selection_date, and optional tier fields.
 */
import { Router, Request, Response } from 'express'
import ratingsData from '../data/cheese-ratings.json' with { type: 'json' }
import { buildProfile } from '../lib/cheeseProfile.js'
import { VERDICT_TO_TIER } from '../lib/worstAnnotations.js'

const router = Router()

interface RatedCheese {
  id: number
  name: string
  aggregate: number
  verdict: string
}

const cheeses = (ratingsData as any).cheeses as RatedCheese[]

// Fail loudly at startup rather than silently returning undefined at request time.
if (!cheeses.length) {
  throw new Error('cheese-ratings.json contains no cheeses — cannot serve GET /random')
}

// ── Tier helpers ──────────────────────────────────────────────────────────────

// Derive the reverse map (tier label → verdict string) from the single source
// of truth in worstAnnotations so tier definitions never diverge.
// e.g. { catastrophic: 'CATASTROPHIC', revolting: 'REVOLTING', condemned: 'CONDEMNED' }
const TIER_TO_VERDICT: Record<string, string> = Object.fromEntries(
  Object.entries(VERDICT_TO_TIER).map(([verdict, tier]) => [tier, verdict])
)

const VALID_TIERS = Object.keys(TIER_TO_VERDICT)

function resolveTier(raw: string): string | null {
  const lower = raw.trim().toLowerCase()
  return VALID_TIERS.includes(lower) ? lower : null
}

function tierError(raw: string, res: Response): void {
  res.status(400).json({
    error: `Unknown severity tier: "${raw}".`,
    valid_tiers: VALID_TIERS,
    hint: 'Use GET /severity to see all tiers with descriptions and cheese counts.',
    note: 'All tiers are bad. Picking one only determines the degree.',
  })
}

// ── Selection helpers ─────────────────────────────────────────────────────────

function getTodayString(): string {
  return new Date().toISOString().split('T')[0]
}

/**
 * djb2-style hash of a date string — identical to the one used by GET /roast
 * so both endpoints agree on "today's cheese" when today_only=true.
 */
function dateHash(dateStr: string): number {
  let h = 5381
  for (let i = 0; i < dateStr.length; i++) {
    h = (h * 33) ^ dateStr.charCodeAt(i)
  }
  return Math.abs(h)
}

function pickByDate(pool: RatedCheese[], dateStr: string): RatedCheese {
  return pool[dateHash(dateStr) % pool.length]
}

function pickRandom(pool: RatedCheese[]): RatedCheese {
  return pool[Math.floor(Math.random() * pool.length)]
}

// ── Route ─────────────────────────────────────────────────────────────────────

router.get('/', (req: Request, res: Response) => {
  const todayOnlyParam = req.query.today_only
  const todayOnly = todayOnlyParam === 'true' || todayOnlyParam === '1'

  // ── Tier filter ──
  const rawTier = req.query.tier
  let tier: string | null = null
  if (rawTier !== undefined) {
    if (typeof rawTier !== 'string') {
      res.status(400).json({ error: '`tier` must be a string.' })
      return
    }
    tier = resolveTier(rawTier)
    if (!tier) { tierError(rawTier, res); return }
  }

  // Narrow the pool to the requested tier (or use all cheeses).
  const pool = tier
    ? cheeses.filter(c => VERDICT_TO_TIER[c.verdict] === tier)
    : cheeses

  // ── Pick ──
  let picked: RatedCheese
  let selectionDate: string | null = null

  if (todayOnly) {
    selectionDate = getTodayString()
    picked = pickByDate(pool, selectionDate)
  } else {
    picked = pickRandom(pool)
  }

  const profile = buildProfile(picked.name)

  res.json({
    ...profile,
    today_only: todayOnly,
    ...(tier ? { tier } : {}),
    ...(selectionDate ? { selection_date: selectionDate } : {}),
    note: 'All information presented is damning. There is no exculpatory section.',
  })
})

export default router
