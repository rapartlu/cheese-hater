/**
 * Tests for GET /stats — aggregate condemnation statistics.
 *
 * The numbers confirm what the hatred already knew: cheese is consistently
 * and quantifiably terrible. does_this_help is always false.
 */
import { describe, it, expect } from 'vitest'
import request from 'supertest'
import app from '../server'

// ── GET /stats ────────────────────────────────────────────────────────────────

describe('GET /stats', () => {
  it('returns 200', async () => {
    const res = await request(app).get('/stats')
    expect(res.status).toBe(200)
  })

  it('returns JSON', async () => {
    const res = await request(app).get('/stats')
    expect(res.headers['content-type']).toMatch(/json/)
  })
})

// ── Top-level required fields ─────────────────────────────────────────────────

describe('GET /stats — required top-level fields', () => {
  const REQUIRED_FIELDS = [
    'total_cheeses_condemned',
    'average_condemnation_score',
    'score_range',
    'tier_breakdown',
    'verdict_breakdown',
    'dimension_averages',
    'origin_breakdown',
    'most_condemned_origin',
    'methodology',
    'does_this_help',
    'why_not',
  ] as const

  for (const field of REQUIRED_FIELDS) {
    it(`has required field: ${field}`, async () => {
      const res = await request(app).get('/stats')
      expect(res.body).toHaveProperty(field)
    })
  }

  it('does_this_help is false', async () => {
    const res = await request(app).get('/stats')
    expect(res.body.does_this_help).toBe(false)
  })

  it('why_not is a non-empty string', async () => {
    const res = await request(app).get('/stats')
    expect(typeof res.body.why_not).toBe('string')
    expect(res.body.why_not.length).toBeGreaterThan(10)
  })
})

// ── total_cheeses_condemned ───────────────────────────────────────────────────

describe('GET /stats — total_cheeses_condemned', () => {
  it('is a positive integer', async () => {
    const res = await request(app).get('/stats')
    expect(typeof res.body.total_cheeses_condemned).toBe('number')
    expect(res.body.total_cheeses_condemned).toBeGreaterThan(0)
    expect(Number.isInteger(res.body.total_cheeses_condemned)).toBe(true)
  })

  it('is at least 20 (we have 21 rated cheeses)', async () => {
    const res = await request(app).get('/stats')
    expect(res.body.total_cheeses_condemned).toBeGreaterThanOrEqual(20)
  })
})

// ── average_condemnation_score ────────────────────────────────────────────────

describe('GET /stats — average_condemnation_score', () => {
  it('is a number', async () => {
    const res = await request(app).get('/stats')
    expect(typeof res.body.average_condemnation_score).toBe('number')
  })

  it('is between 0 and 10', async () => {
    const res = await request(app).get('/stats')
    expect(res.body.average_condemnation_score).toBeGreaterThan(0)
    expect(res.body.average_condemnation_score).toBeLessThan(10)
  })

  it('no cheese scores above 3.0 on average', async () => {
    const res = await request(app).get('/stats')
    expect(res.body.average_condemnation_score).toBeLessThan(3)
  })
})

// ── score_range ───────────────────────────────────────────────────────────────

describe('GET /stats — score_range', () => {
  it('has lowest, lowest_cheese, highest, highest_cheese, note', async () => {
    const res = await request(app).get('/stats')
    const sr = res.body.score_range
    expect(sr).toHaveProperty('lowest')
    expect(sr).toHaveProperty('lowest_cheese')
    expect(sr).toHaveProperty('highest')
    expect(sr).toHaveProperty('highest_cheese')
    expect(sr).toHaveProperty('note')
  })

  it('lowest < highest', async () => {
    const res = await request(app).get('/stats')
    expect(res.body.score_range.lowest).toBeLessThan(res.body.score_range.highest)
  })

  it('lowest_cheese is Casu Martzu', async () => {
    const res = await request(app).get('/stats')
    expect(res.body.score_range.lowest_cheese).toBe('Casu Martzu')
  })

  it('note is a non-empty string', async () => {
    const res = await request(app).get('/stats')
    expect(typeof res.body.score_range.note).toBe('string')
    expect(res.body.score_range.note.length).toBeGreaterThan(5)
  })
})

// ── tier_breakdown ────────────────────────────────────────────────────────────

describe('GET /stats — tier_breakdown', () => {
  it('is an array', async () => {
    const res = await request(app).get('/stats')
    expect(Array.isArray(res.body.tier_breakdown)).toBe(true)
  })

  it('has 3 tiers (catastrophic, revolting, condemned)', async () => {
    const res = await request(app).get('/stats')
    expect(res.body.tier_breakdown).toHaveLength(3)
  })

  it('each entry has tier, count, percentage, note', async () => {
    const res = await request(app).get('/stats')
    for (const entry of res.body.tier_breakdown) {
      expect(entry).toHaveProperty('tier')
      expect(entry).toHaveProperty('count')
      expect(entry).toHaveProperty('percentage')
      expect(entry).toHaveProperty('note')
    }
  })

  it('tier counts sum to total_cheeses_condemned', async () => {
    const res = await request(app).get('/stats')
    const total = res.body.total_cheeses_condemned
    const sum = res.body.tier_breakdown.reduce((acc: number, t: { count: number }) => acc + t.count, 0)
    expect(sum).toBe(total)
  })

  it('percentages sum to ~100', async () => {
    const res = await request(app).get('/stats')
    const sum = res.body.tier_breakdown.reduce(
      (acc: number, t: { percentage: number }) => acc + t.percentage,
      0
    )
    expect(sum).toBeCloseTo(100, 0)
  })

  it('all three valid tier names present', async () => {
    const res = await request(app).get('/stats')
    const tierNames = res.body.tier_breakdown.map((t: { tier: string }) => t.tier)
    expect(tierNames).toContain('catastrophic')
    expect(tierNames).toContain('revolting')
    expect(tierNames).toContain('condemned')
  })
})

// ── verdict_breakdown ─────────────────────────────────────────────────────────

describe('GET /stats — verdict_breakdown', () => {
  it('is an array', async () => {
    const res = await request(app).get('/stats')
    expect(Array.isArray(res.body.verdict_breakdown)).toBe(true)
  })

  it('each entry has name, count, percentage', async () => {
    const res = await request(app).get('/stats')
    for (const entry of res.body.verdict_breakdown) {
      expect(entry).toHaveProperty('name')
      expect(entry).toHaveProperty('count')
      expect(entry).toHaveProperty('percentage')
    }
  })

  it('verdict counts sum to total', async () => {
    const res = await request(app).get('/stats')
    const total = res.body.total_cheeses_condemned
    const sum = res.body.verdict_breakdown.reduce((acc: number, v: { count: number }) => acc + v.count, 0)
    expect(sum).toBe(total)
  })
})

// ── dimension_averages ────────────────────────────────────────────────────────

describe('GET /stats — dimension_averages', () => {
  const DIMENSION_FIELDS = ['smell', 'texture', 'taste', 'cultural_damage', 'most_offensive_dimension', 'note'] as const

  for (const field of DIMENSION_FIELDS) {
    it(`has field: ${field}`, async () => {
      const res = await request(app).get('/stats')
      expect(res.body.dimension_averages).toHaveProperty(field)
    })
  }

  it('all numeric dimensions are between 0 and 10', async () => {
    const res = await request(app).get('/stats')
    const da = res.body.dimension_averages
    for (const dim of ['smell', 'texture', 'taste', 'cultural_damage']) {
      expect(da[dim]).toBeGreaterThan(0)
      expect(da[dim]).toBeLessThanOrEqual(10)
    }
  })

  it('most_offensive_dimension is one of the valid dimensions', async () => {
    const res = await request(app).get('/stats')
    const valid = ['smell', 'texture', 'taste', 'cultural_damage']
    expect(valid).toContain(res.body.dimension_averages.most_offensive_dimension)
  })
})

// ── origin_breakdown ──────────────────────────────────────────────────────────

describe('GET /stats — origin_breakdown', () => {
  it('is an array', async () => {
    const res = await request(app).get('/stats')
    expect(Array.isArray(res.body.origin_breakdown)).toBe(true)
  })

  it('is non-empty', async () => {
    const res = await request(app).get('/stats')
    expect(res.body.origin_breakdown.length).toBeGreaterThan(0)
  })

  it('each entry has name and count', async () => {
    const res = await request(app).get('/stats')
    for (const entry of res.body.origin_breakdown) {
      expect(entry).toHaveProperty('name')
      expect(entry).toHaveProperty('count')
      expect(typeof entry.name).toBe('string')
      expect(typeof entry.count).toBe('number')
    }
  })

  it('origin counts sum to total_cheeses_condemned', async () => {
    const res = await request(app).get('/stats')
    const total = res.body.total_cheeses_condemned
    const sum = res.body.origin_breakdown.reduce((acc: number, o: { count: number }) => acc + o.count, 0)
    expect(sum).toBe(total)
  })

  it('is sorted descending by count', async () => {
    const res = await request(app).get('/stats')
    const counts = res.body.origin_breakdown.map((o: { count: number }) => o.count)
    for (let i = 0; i < counts.length - 1; i++) {
      expect(counts[i]).toBeGreaterThanOrEqual(counts[i + 1])
    }
  })
})

// ── most_condemned_origin ─────────────────────────────────────────────────────

describe('GET /stats — most_condemned_origin', () => {
  it('has country, cheese_count, note', async () => {
    const res = await request(app).get('/stats')
    const mco = res.body.most_condemned_origin
    expect(mco).toHaveProperty('country')
    expect(mco).toHaveProperty('cheese_count')
    expect(mco).toHaveProperty('note')
  })

  it('cheese_count is positive', async () => {
    const res = await request(app).get('/stats')
    expect(res.body.most_condemned_origin.cheese_count).toBeGreaterThan(0)
  })

  it('note references the country name', async () => {
    const res = await request(app).get('/stats')
    const { country, note } = res.body.most_condemned_origin
    expect(note).toContain(country)
  })

  it('most_condemned_origin matches first entry of origin_breakdown', async () => {
    const res = await request(app).get('/stats')
    const top = res.body.origin_breakdown[0]
    expect(res.body.most_condemned_origin.country).toBe(top.name)
    expect(res.body.most_condemned_origin.cheese_count).toBe(top.count)
  })
})

// ── GET /api schema coverage ──────────────────────────────────────────────────

describe('GET /api — schema includes /stats', () => {
  it('GET /api lists /stats', async () => {
    const res = await request(app).get('/api')
    const paths: string[] = res.body.endpoints.map((e: { path: string }) => e.path)
    expect(paths).toContain('/stats')
  })
})
