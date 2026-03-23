/**
 * Tests for GET /compare?a=<cheese>&b=<cheese>.
 *
 * Both cheeses are always guilty.
 * These tests only verify the hierarchy of guilt is determined correctly.
 */
import { describe, it, expect } from 'vitest'
import request from 'supertest'
import app from '../server'

// ── Shape assertions ──────────────────────────────────────────────────────────

const REQUIRED_TOP_LEVEL = [
  'cheese_a',
  'cheese_b',
  'winner',
  'loser',
  'winner_reason',
  'scores',
  'comparison',
  'note',
] as const

const REQUIRED_COMPARISON_DIMS = ['smell', 'texture', 'cultural_damage', 'severity_delta'] as const
const VALID_MARGINS = ['decisive', 'significant', 'moderate', 'marginal']
const VALID_DIM_WORSE = (a: string, b: string, val: string) =>
  [a.toLowerCase(), b.toLowerCase(), 'tied'].includes(val.toLowerCase())

// ── 400 validation ────────────────────────────────────────────────────────────

describe('GET /compare — input validation', () => {
  it('returns 400 when both params are missing', async () => {
    const res = await request(app).get('/compare')
    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('error')
    expect(res.body).toHaveProperty('usage')
  })

  it('returns 400 when only ?a is provided', async () => {
    const res = await request(app).get('/compare?a=brie')
    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('error')
  })

  it('returns 400 when only ?b is provided', async () => {
    const res = await request(app).get('/compare?b=cheddar')
    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('error')
  })

  it('returns 400 when both params are the same cheese', async () => {
    const res = await request(app).get('/compare?a=brie&b=brie')
    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('error')
  })

  it('returns 400 for same cheese regardless of case', async () => {
    const res = await request(app).get('/compare?a=Cheddar&b=cheddar')
    expect(res.status).toBe(400)
  })

  it('400 response includes usage hint', async () => {
    const res = await request(app).get('/compare')
    expect(res.body.usage).toMatch(/compare\?a=/)
  })
})

// ── 200 shape ─────────────────────────────────────────────────────────────────

describe('GET /compare — response shape', () => {
  it('returns 200 for two known cheeses', async () => {
    const res = await request(app).get('/compare?a=brie&b=cheddar')
    expect(res.status).toBe(200)
  })

  it('response includes all required top-level fields', async () => {
    const res = await request(app).get('/compare?a=brie&b=cheddar')
    for (const field of REQUIRED_TOP_LEVEL) {
      expect(res.body, `Missing field: ${field}`).toHaveProperty(field)
    }
  })

  it('comparison object has all required dimensions', async () => {
    const res = await request(app).get('/compare?a=brie&b=cheddar')
    for (const dim of REQUIRED_COMPARISON_DIMS) {
      expect(res.body.comparison, `Missing comparison dimension: ${dim}`).toHaveProperty(dim)
    }
  })

  it('cheese_a and cheese_b echo back the requested cheeses', async () => {
    const res = await request(app).get('/compare?a=brie&b=cheddar')
    expect(res.body.cheese_a.toLowerCase()).toBe('brie')
    expect(res.body.cheese_b.toLowerCase()).toBe('cheddar')
  })

  it('winner and loser are the two requested cheeses', async () => {
    const res = await request(app).get('/compare?a=brie&b=cheddar')
    const both = new Set([res.body.winner.toLowerCase(), res.body.loser.toLowerCase()])
    expect(both.has('brie')).toBe(true)
    expect(both.has('cheddar')).toBe(true)
  })

  it('winner and loser are distinct', async () => {
    const res = await request(app).get('/compare?a=brie&b=cheddar')
    expect(res.body.winner.toLowerCase()).not.toBe(res.body.loser.toLowerCase())
  })

  it('winner_reason is a non-empty string', async () => {
    const res = await request(app).get('/compare?a=brie&b=cheddar')
    expect(typeof res.body.winner_reason).toBe('string')
    expect(res.body.winner_reason.length).toBeGreaterThan(20)
  })

  it('note is always "Both cheeses are guilty…"', async () => {
    const res = await request(app).get('/compare?a=brie&b=cheddar')
    expect(res.body.note).toMatch(/both cheeses are guilty/i)
  })
})

// ── Comparison dimension structure ────────────────────────────────────────────

describe('GET /compare — comparison dimension values', () => {
  it('smell dimension has worse and margin fields', async () => {
    const res = await request(app).get('/compare?a=brie&b=cheddar')
    expect(res.body.comparison.smell).toHaveProperty('worse')
    expect(res.body.comparison.smell).toHaveProperty('margin')
  })

  it('texture dimension has worse and margin fields', async () => {
    const res = await request(app).get('/compare?a=brie&b=cheddar')
    expect(res.body.comparison.texture).toHaveProperty('worse')
    expect(res.body.comparison.texture).toHaveProperty('margin')
  })

  it('cultural_damage dimension has worse and margin fields', async () => {
    const res = await request(app).get('/compare?a=brie&b=cheddar')
    expect(res.body.comparison.cultural_damage).toHaveProperty('worse')
    expect(res.body.comparison.cultural_damage).toHaveProperty('margin')
  })

  it('dimension worse values are one of the two cheeses or "tied"', async () => {
    const res = await request(app).get('/compare?a=brie&b=cheddar')
    const { smell, texture, cultural_damage } = res.body.comparison
    for (const dim of [smell, texture, cultural_damage]) {
      expect(
        VALID_DIM_WORSE('brie', 'cheddar', dim.worse),
        `Unexpected worse value: ${dim.worse}`,
      ).toBe(true)
    }
  })

  it('dimension margin values are valid labels or tied description', async () => {
    const res = await request(app).get('/compare?a=brie&b=cheddar')
    const { smell, texture, cultural_damage } = res.body.comparison
    for (const dim of [smell, texture, cultural_damage]) {
      const isValid =
        VALID_MARGINS.includes(dim.margin) ||
        dim.margin.includes('none') ||
        dim.margin.includes('tied')
      expect(isValid, `Unexpected margin: "${dim.margin}"`).toBe(true)
    }
  })

  it('severity_delta is a non-negative number', async () => {
    const res = await request(app).get('/compare?a=brie&b=cheddar')
    expect(typeof res.body.comparison.severity_delta).toBe('number')
    expect(res.body.comparison.severity_delta).toBeGreaterThanOrEqual(0)
  })
})

// ── Score structure ────────────────────────────────────────────────────────────

describe('GET /compare — scores block', () => {
  it('scores block contains entries for both cheeses', async () => {
    const res = await request(app).get('/compare?a=brie&b=cheddar')
    // scores block has dynamic keys matching cheese names
    const keys = Object.keys(res.body.scores).map(k => k.toLowerCase())
    expect(keys.some(k => k.includes('brie'))).toBe(true)
    expect(keys.some(k => k.includes('cheddar'))).toBe(true)
  })

  it('scores block has a margin field', async () => {
    const res = await request(app).get('/compare?a=brie&b=cheddar')
    expect(res.body.scores).toHaveProperty('margin')
    expect(VALID_MARGINS).toContain(res.body.scores.margin)
  })

  it('scores block note mentions lower score = more condemned', async () => {
    const res = await request(app).get('/compare?a=brie&b=cheddar')
    expect(res.body.scores.note).toMatch(/lower score/i)
  })
})

// ── Winner correctness ────────────────────────────────────────────────────────

describe('GET /compare — winner determination', () => {
  it('blue cheese beats gouda (far lower score = more condemned)', async () => {
    // blue cheese: 0.625, gouda: 2.475 — decisive gap
    const res = await request(app).get('/compare?a=blue%20cheese&b=gouda')
    expect(res.status).toBe(200)
    expect(res.body.winner.toLowerCase()).toBe('blue cheese')
    expect(res.body.comparison.severity_delta).toBeGreaterThan(1.5)
  })

  it('blue cheese beats cheddar (blue: 0.625, cheddar: 2.05)', async () => {
    const res = await request(app).get('/compare?a=blue%20cheese&b=cheddar')
    expect(res.body.winner.toLowerCase()).toBe('blue cheese')
  })

  it('cheddar beats gouda on cultural_damage dimension', async () => {
    // cheddar cultural_damage_score: 10, gouda: 5
    const res = await request(app).get('/compare?a=cheddar&b=gouda')
    expect(res.body.comparison.cultural_damage.worse.toLowerCase()).toBe('cheddar')
  })

  it('blue cheese beats parmesan on smell dimension', async () => {
    // blue cheese smell_score: 10, parmesan: 9
    const res = await request(app).get('/compare?a=blue%20cheese&b=parmesan')
    expect(res.body.comparison.smell.worse.toLowerCase()).toBe('blue cheese')
  })

  it('cottage cheese beats brie on texture dimension', async () => {
    // cottage cheese texture_score: 10, brie: 9
    const res = await request(app).get('/compare?a=cottage%20cheese&b=brie')
    expect(res.body.comparison.texture.worse.toLowerCase()).toBe('cottage cheese')
  })
})

// ── Unknown / arbitrary cheeses ───────────────────────────────────────────────

describe('GET /compare — unknown cheeses', () => {
  it('returns 200 for two unknown cheeses', async () => {
    const res = await request(app).get('/compare?a=stilton&b=limburger')
    expect(res.status).toBe(200)
  })

  it('unknown cheese echoes back the requested name', async () => {
    const res = await request(app).get('/compare?a=stilton&b=limburger')
    expect(res.body.cheese_a.toLowerCase()).toBe('stilton')
    expect(res.body.cheese_b.toLowerCase()).toBe('limburger')
  })

  it('returns 200 for one known and one unknown cheese', async () => {
    const res = await request(app).get('/compare?a=brie&b=weirdcheese')
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('winner')
  })

  it('winner_reason is non-empty even for unknown cheeses', async () => {
    const res = await request(app).get('/compare?a=mystery&b=unknown')
    expect(res.body.winner_reason.length).toBeGreaterThan(10)
  })
})

// ── URL encoding ──────────────────────────────────────────────────────────────

describe('GET /compare — URL encoding', () => {
  it('handles URL-encoded spaces in cheese names', async () => {
    const res = await request(app).get('/compare?a=blue%20cheese&b=cream%20cheese')
    expect(res.status).toBe(200)
    expect(res.body.cheese_a.toLowerCase()).toBe('blue cheese')
    expect(res.body.cheese_b.toLowerCase()).toBe('cream cheese')
  })

  it('handles + as space encoding', async () => {
    const res = await request(app).get('/compare?a=blue+cheese&b=cream+cheese')
    expect(res.status).toBe(200)
  })
})

// ── profiles object ───────────────────────────────────────────────────────────

const PROFILE_FIELDS = [
  'score',
  'severity_tier',
  'verdict',
  'worst_quality',
  'smell_description',
  'texture_offense',
  'found_at',
  'closing_statement',
] as const

describe('GET /compare — profiles object', () => {
  it('response includes a profiles object', async () => {
    const res = await request(app).get('/compare?a=brie&b=cheddar')
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('profiles')
    expect(typeof res.body.profiles).toBe('object')
  })

  it('profiles has a key for each requested cheese', async () => {
    const res = await request(app).get('/compare?a=brie&b=cheddar')
    const keys = Object.keys(res.body.profiles).map(k => k.toLowerCase())
    expect(keys.some(k => k.includes('brie'))).toBe(true)
    expect(keys.some(k => k.includes('cheddar'))).toBe(true)
  })

  it('each profile has all required fields', async () => {
    const res = await request(app).get('/compare?a=brie&b=cheddar')
    for (const [, profile] of Object.entries(res.body.profiles)) {
      for (const field of PROFILE_FIELDS) {
        expect(profile as Record<string, unknown>, `Profile missing field: ${field}`).toHaveProperty(field)
      }
    }
  })

  it('profile score is a number', async () => {
    const res = await request(app).get('/compare?a=brie&b=cheddar')
    for (const [, profile] of Object.entries(res.body.profiles as Record<string, { score: unknown }>)) {
      expect(typeof profile.score).toBe('number')
    }
  })

  it('profile string fields are non-empty strings', async () => {
    const res = await request(app).get('/compare?a=brie&b=cheddar')
    const stringFields = ['severity_tier', 'verdict', 'worst_quality', 'smell_description', 'texture_offense', 'found_at', 'closing_statement'] as const
    for (const [, profile] of Object.entries(res.body.profiles as Record<string, Record<string, unknown>>)) {
      for (const field of stringFields) {
        expect(typeof profile[field]).toBe('string')
        expect((profile[field] as string).length).toBeGreaterThan(0)
      }
    }
  })

  it('profiles work for unknown cheeses (generic fallback)', async () => {
    const res = await request(app).get('/compare?a=stilton&b=limburger')
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('profiles')
    const keys = Object.keys(res.body.profiles)
    expect(keys.length).toBe(2)
  })

  it('profiles work for one known, one unknown cheese', async () => {
    const res = await request(app).get('/compare?a=brie&b=unknowncheese')
    expect(res.status).toBe(200)
    const keys = Object.keys(res.body.profiles).map(k => k.toLowerCase())
    expect(keys.some(k => k.includes('brie'))).toBe(true)
    expect(keys.some(k => k.includes('unknowncheese'))).toBe(true)
  })
})

// ── verdict object ────────────────────────────────────────────────────────────

describe('GET /compare — verdict object', () => {
  it('response includes a verdict object', async () => {
    const res = await request(app).get('/compare?a=brie&b=cheddar')
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('verdict')
    expect(typeof res.body.verdict).toBe('object')
  })

  it('verdict has winner, loser, margin, and reason fields', async () => {
    const res = await request(app).get('/compare?a=brie&b=cheddar')
    expect(res.body.verdict).toHaveProperty('winner')
    expect(res.body.verdict).toHaveProperty('loser')
    expect(res.body.verdict).toHaveProperty('margin')
    expect(res.body.verdict).toHaveProperty('reason')
  })

  it('verdict.winner matches top-level winner', async () => {
    const res = await request(app).get('/compare?a=brie&b=cheddar')
    expect(res.body.verdict.winner.toLowerCase()).toBe(res.body.winner.toLowerCase())
  })

  it('verdict.loser matches top-level loser', async () => {
    const res = await request(app).get('/compare?a=brie&b=cheddar')
    expect(res.body.verdict.loser.toLowerCase()).toBe(res.body.loser.toLowerCase())
  })

  it('verdict.reason is a non-empty string', async () => {
    const res = await request(app).get('/compare?a=brie&b=cheddar')
    expect(typeof res.body.verdict.reason).toBe('string')
    expect(res.body.verdict.reason.length).toBeGreaterThan(20)
  })

  it('verdict.reason matches winner_reason (same source)', async () => {
    const res = await request(app).get('/compare?a=brie&b=cheddar')
    expect(res.body.verdict.reason).toBe(res.body.winner_reason)
  })

  it('verdict.margin is a valid margin label', async () => {
    const res = await request(app).get('/compare?a=brie&b=cheddar')
    expect(VALID_MARGINS).toContain(res.body.verdict.margin)
  })

  it('verdict.winner and verdict.loser are the two requested cheeses', async () => {
    const res = await request(app).get('/compare?a=brie&b=cheddar')
    const both = new Set([res.body.verdict.winner.toLowerCase(), res.body.verdict.loser.toLowerCase()])
    expect(both.has('brie')).toBe(true)
    expect(both.has('cheddar')).toBe(true)
  })

  it('verdict works for unknown cheeses', async () => {
    const res = await request(app).get('/compare?a=mystery&b=unknown')
    expect(res.status).toBe(200)
    expect(res.body.verdict).toHaveProperty('winner')
    expect(res.body.verdict).toHaveProperty('reason')
    expect(res.body.verdict.reason.length).toBeGreaterThan(10)
  })
})
