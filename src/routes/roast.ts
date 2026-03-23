import { Router, Request, Response } from 'express'
import ratingsData from '../data/cheese-ratings.json' with { type: 'json' }
import factsData from '../data/cheese-facts.json' with { type: 'json' }

const router = Router()

interface RatedCheese {
  id: number
  name: string
  origin: string
  scores: { smell: number; texture: number; taste: number; cultural_damage: number }
  aggregate: number
  verdict: string
  smell_note: string
  texture_note: string
  taste_note: string
  cultural_damage_note: string
  full_review: string
  shareable_card: { title: string; score_display: string; verdict: string; one_liner: string }
}

interface Fact {
  id: number
  text: string
  category: string
  severity: number
}

const cheeses = (ratingsData as any).cheeses as RatedCheese[]
const facts = (factsData as any).facts as Fact[]

/**
 * Deterministic day-seeded index — same date always picks the same cheese.
 * Uses a simple djb2-style hash of the ISO date string (YYYY-MM-DD).
 */
function dateHash(dateStr: string): number {
  let h = 5381
  for (let i = 0; i < dateStr.length; i++) {
    h = (h * 33) ^ dateStr.charCodeAt(i)
  }
  return Math.abs(h)
}

function getTodayString(): string {
  return new Date().toISOString().split('T')[0] // "2026-03-23"
}

function pickTodaysCheese(dateStr: string): RatedCheese {
  return cheeses[dateHash(dateStr) % cheeses.length]
}

/**
 * Pick the most damning facts for today's cheese.
 * Prefer high-severity facts; break ties deterministically using dateHash.
 */
function pickSupportingFacts(dateStr: string, count: number): Fact[] {
  const seed = dateHash(dateStr)
  const sorted = [...facts].sort((a, b) => {
    if (b.severity !== a.severity) return b.severity - a.severity
    return ((a.id * seed) % 997) - ((b.id * seed) % 997)
  })
  return sorted.slice(0, count)
}

function buildRoast(cheese: RatedCheese, supportingFacts: Fact[]): string {
  const factLines = supportingFacts
    .map(f => `Fact: ${f.text}`)
    .join(' ')

  return [
    cheese.full_review,
    `On smell: ${cheese.smell_note}`,
    `On texture: ${cheese.texture_note}`,
    `On taste: ${cheese.taste_note}`,
    `On cultural damage: ${cheese.cultural_damage_note}`,
    `And lest there be any doubt about cheese as a category — ${factLines}`,
    `${cheese.name} earns a ${cheese.shareable_card.score_display}. The verdict is ${cheese.verdict}. ${cheese.shareable_card.one_liner}`,
  ].join('\n\n')
}

const HISTORY_DEFAULT_DAYS = 7
const HISTORY_MAX_DAYS = 30

/**
 * Return the ISO date string for a given number of days before today.
 * Operates in UTC to match getTodayString().
 */
function dateStringDaysAgo(daysAgo: number): string {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() - daysAgo)
  return d.toISOString().split('T')[0]
}

// GET /roast/history?days=N — last N days of roasted cheeses (default 7, max 30)
router.get('/history', (req: Request, res: Response) => {
  const rawDays = req.query.days
  let days = HISTORY_DEFAULT_DAYS

  if (rawDays !== undefined) {
    const parsed = parseInt(String(rawDays), 10)
    if (isNaN(parsed) || parsed < 1) {
      res.status(400).json({ error: '`days` must be a positive integer.' })
      return
    }
    days = Math.min(parsed, HISTORY_MAX_DAYS)
  }

  const history = Array.from({ length: days }, (_, i) => {
    const dateStr = dateStringDaysAgo(i)
    const cheese = pickTodaysCheese(dateStr)
    return {
      date: dateStr,
      cheese_of_the_day: cheese.name,
      score_display: cheese.shareable_card.score_display,
      verdict: cheese.verdict,
      one_liner: cheese.shareable_card.one_liner,
    }
  })

  res.json({
    days_returned: days,
    capped_at: HISTORY_MAX_DAYS,
    history,
    note: 'Every day, a different cheese is condemned. None have ever been acquitted.',
  })
})

// GET /roast — today's deterministic cheese roast
router.get('/', (_req: Request, res: Response) => {
  const dateStr = getTodayString()
  const cheese = pickTodaysCheese(dateStr)
  const supportingFacts = pickSupportingFacts(dateStr, 3)

  res.json({
    date: dateStr,
    cheese_of_the_day: cheese.name,
    origin: cheese.origin,
    score: cheese.aggregate,
    score_display: cheese.shareable_card.score_display,
    verdict: cheese.verdict,
    category_scores: {
      smell: cheese.scores.smell,
      texture: cheese.scores.texture,
      taste: cheese.scores.taste,
      cultural_damage: cheese.scores.cultural_damage,
    },
    roast: buildRoast(cheese, supportingFacts),
    supporting_facts: supportingFacts.map(f => ({
      text: f.text,
      category: f.category,
      severity: f.severity,
    })),
    note: 'A new cheese is roasted each day. All are equally condemned.',
  })
})

export { getTodayString, pickTodaysCheese, pickSupportingFacts, buildRoast, dateHash, dateStringDaysAgo, cheeses, HISTORY_MAX_DAYS }
export default router
