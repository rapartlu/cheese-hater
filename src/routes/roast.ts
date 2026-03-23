import { Router, Request, Response } from 'express'
import ratingsData from '../data/cheese-ratings.json' with { type: 'json' }
import factsData from '../data/cheese-facts.json' with { type: 'json' }
import { rateCheese } from '../lib/cheeseHater.js'

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

/**
 * Build a focused versus roast for a single cheese: full review + one-liner verdict.
 * Shorter than buildRoast() — designed to be read side-by-side.
 */
function buildVersusRoast(name: string): {
  cheese: string
  score: number
  score_display: string
  verdict: string
  roast: string
  known: boolean
} {
  const rating = rateCheese(name)
  const isKnown = cheeses.some(c => c.name.toLowerCase() === name.toLowerCase().trim())
  const full = cheeses.find(c => c.name.toLowerCase() === name.toLowerCase().trim())
  const roastParagraphs: string[] = [rating.review]
  if (full) {
    roastParagraphs.push(`On smell: ${full.smell_note}`)
    roastParagraphs.push(`Verdict: ${full.shareable_card.one_liner}`)
  }
  return {
    cheese: rating.name,
    score: rating.score,
    score_display: `${rating.score}/10`,
    verdict: rating.verdict,
    roast: roastParagraphs.join('\n\n'),
    known: isKnown,
  }
}

// Exported for reuse in bracket
export { buildVersusRoast }

// GET /roast/versus?a=<cheese>&b=<cheese> — pit two cheeses against each other
router.get('/versus', (req: Request, res: Response) => {
  const { a, b } = req.query

  if (!a || !b || typeof a !== 'string' || typeof b !== 'string') {
    res.status(400).json({
      error: 'Both `a` and `b` query parameters are required.',
      example: '/roast/versus?a=brie&b=gouda',
    })
    return
  }

  const nameA = a.trim()
  const nameB = b.trim()

  if (nameA.toLowerCase() === nameB.toLowerCase()) {
    res.status(400).json({
      error: 'Comparing a cheese to itself is redundant. It is already condemned on its own merits.',
    })
    return
  }

  const roastA = buildVersusRoast(nameA)
  const roastB = buildVersusRoast(nameB)

  let loser: string
  let winner: string
  let margin: number
  let declaration: string

  if (roastA.score < roastB.score) {
    loser = roastA.cheese
    winner = roastB.cheese
    margin = Number((roastB.score - roastA.score).toFixed(2))
    declaration = `${roastA.cheese} is the worse offender by a margin of ${margin} points. Both are terrible. ${roastA.cheese} has simply achieved a new depth of terrible.`
  } else if (roastB.score < roastA.score) {
    loser = roastB.cheese
    winner = roastA.cheese
    margin = Number((roastA.score - roastB.score).toFixed(2))
    declaration = `${roastB.cheese} is the worse offender by a margin of ${margin} points. Both are terrible. ${roastB.cheese} has simply achieved a new depth of terrible.`
  } else {
    loser = 'both'
    winner = 'neither'
    margin = 0
    declaration = `${roastA.cheese} and ${roastB.cheese} are equally terrible, which is itself a damning result. They have tied for last place in a competition where last place is the only place.`
  }

  res.json({
    verdict: { loser, winner, margin, declaration },
    contestants: { a: roastA, b: roastB },
    note: 'In a contest between two cheeses, the real loser is whoever is eating them.',
  })
})

const BRACKET_MIN = 4
const BRACKET_MAX = 8

/** Next power of 2 >= n */
function nextPow2(n: number): number {
  let p = 1
  while (p < n) p *= 2
  return p
}

/** Round name based on how many contestants enter the round */
function roundName(remaining: number, roundNum: number): string {
  if (remaining === 2) return 'Final'
  if (remaining === 4) return 'Semifinals'
  if (remaining === 8) return 'Quarterfinals'
  return `Round ${roundNum}`
}

interface BracketMatch {
  a: string
  b: string
  winner: string
  loser: string
  margin: number
}

interface BracketRound {
  round: number
  name: string
  matches: BracketMatch[]
  byes?: string[]
}

// GET /roast/bracket?cheeses=brie,gouda,cheddar,camembert — elimination tournament
router.get('/bracket', (req: Request, res: Response) => {
  const { cheeses: param } = req.query

  if (!param || typeof param !== 'string') {
    res.status(400).json({
      error: 'The `cheeses` query parameter is required.',
      example: '/roast/bracket?cheeses=brie,gouda,cheddar,camembert',
    })
    return
  }

  const names = param.split(',').map(n => n.trim()).filter(Boolean)

  if (names.length < BRACKET_MIN || names.length > BRACKET_MAX) {
    res.status(400).json({
      error: `Expected ${BRACKET_MIN}–${BRACKET_MAX} cheeses, got ${names.length}.`,
      example: '/roast/bracket?cheeses=brie,gouda,cheddar,camembert',
    })
    return
  }

  const lower = names.map(n => n.toLowerCase())
  if (new Set(lower).size < names.length) {
    res.status(400).json({
      error: 'Duplicate cheese names are not allowed. Each cheese must stand condemned on its own.',
    })
    return
  }

  // Build contestant profiles; sort ascending by score (most condemned first)
  const contestants = names.map(n => buildVersusRoast(n))
  contestants.sort((a, b) => a.score - b.score)

  const bracketSize = nextPow2(contestants.length)
  const byeCount = bracketSize - contestants.length

  // Lowest-scoring cheeses (most condemned) receive byes
  let byeAdvancers = contestants.slice(0, byeCount)
  let active = contestants.slice(byeCount)

  const rounds: BracketRound[] = []
  let roundNum = 1

  while (active.length + byeAdvancers.length > 1) {
    const totalEntering = active.length + byeAdvancers.length
    const matches: BracketMatch[] = []
    const winners = []

    for (let i = 0; i + 1 < active.length; i += 2) {
      const a = active[i]
      const b = active[i + 1]
      // Higher score = less condemned = advances
      const aWins = a.score >= b.score
      const winner = aWins ? a : b
      const loser = aWins ? b : a
      matches.push({
        a: a.cheese,
        b: b.cheese,
        winner: winner.cheese,
        loser: loser.cheese,
        margin: Number(Math.abs(a.score - b.score).toFixed(2)),
      })
      winners.push(winner)
    }

    const round: BracketRound = {
      round: roundNum,
      name: roundName(totalEntering, roundNum),
      matches,
    }
    if (byeAdvancers.length > 0) {
      round.byes = byeAdvancers.map(c => c.cheese)
    }
    rounds.push(round)

    // Next round: round winners + bye advancers (byes only apply to round 1)
    active = [...winners, ...byeAdvancers]
    byeAdvancers = []
    roundNum++
  }

  const champion = active[0]

  res.json({
    champion: champion.cheese,
    champion_score: champion.score_display,
    champion_verdict: champion.verdict,
    total_cheeses: names.length,
    rounds,
    note: 'The champion is the cheese that lost the least — a meaningless distinction among the condemned.',
  })
})

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
