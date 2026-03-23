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
 * The response shape matches the unified /cheese/:name endpoint, plus
 * a `today_only` boolean indicating which selection mode was used.
 */
import { Router, Request, Response } from 'express'
import ratingsData from '../data/cheese-ratings.json' with { type: 'json' }
import { buildProfile } from '../lib/cheeseProfile.js'

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

// ── Helpers ───────────────────────────────────────────────────────────────────

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

function pickByDate(dateStr: string): RatedCheese {
  return cheeses[dateHash(dateStr) % cheeses.length]
}

function pickRandom(): RatedCheese {
  return cheeses[Math.floor(Math.random() * cheeses.length)]
}

// ── Route ─────────────────────────────────────────────────────────────────────

router.get('/', (req: Request, res: Response) => {
  const todayOnlyParam = req.query.today_only
  const todayOnly = todayOnlyParam === 'true' || todayOnlyParam === '1'

  let picked: RatedCheese
  let selectionDate: string | null = null

  if (todayOnly) {
    selectionDate = getTodayString()
    picked = pickByDate(selectionDate)
  } else {
    picked = pickRandom()
  }

  const profile = buildProfile(picked.name)

  res.json({
    ...profile,
    today_only: todayOnly,
    ...(selectionDate ? { selection_date: selectionDate } : {}),
    note: 'All information presented is damning. There is no exculpatory section.',
  })
})

export default router
