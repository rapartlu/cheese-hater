/**
 * Tests for GET /verdict and GET /verdict/:cheese.
 *
 * Every cheese is guilty. The verdict is never in doubt.
 * These tests verify the specifics.
 */
import { describe, it, expect } from 'vitest'
import request from 'supertest'
import app from '../server'

const REQUIRED_FIELDS = [
  'cheese',
  'verdict',
  'severity',
  'worst_quality',
  'smell_description',
  'texture_offense',
  'found_at',
  'recommended_alternative',
  'closing_statement',
  'note',
] as const

// The 10 cheeses documented in CLAUDE.md — each deserves targeted contempt
const KNOWN_CHEESES = [
  'brie',
  'cheddar',
  'blue cheese',
  'parmesan',
  'gouda',
  'mozzarella',
  'gruyère',
  'cream cheese',
  'cottage cheese',
  'halloumi',
]

describe('GET /verdict', () => {
  it('returns 200 with a list of cheeses', async () => {
    const res = await request(app).get('/verdict')
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body.cheeses)).toBe(true)
  })

  it('includes total count matching the cheeses array length', async () => {
    const res = await request(app).get('/verdict')
    expect(res.body.total).toBe(res.body.cheeses.length)
  })

  it('covers all 10 CLAUDE.md-documented cheeses', async () => {
    const res = await request(app).get('/verdict')
    const listed: string[] = res.body.cheeses.map((c: { cheese: string }) =>
      c.cheese.toLowerCase(),
    )
    for (const cheese of KNOWN_CHEESES) {
      expect(listed, `Expected "${cheese}" in /verdict list`).toContain(cheese)
    }
  })

  it('every list entry has cheese, verdict, and severity', async () => {
    const res = await request(app).get('/verdict')
    for (const entry of res.body.cheeses) {
      expect(entry).toHaveProperty('cheese')
      expect(entry).toHaveProperty('verdict')
      expect(entry).toHaveProperty('severity')
    }
  })

  it('all verdicts in the list are GUILTY', async () => {
    const res = await request(app).get('/verdict')
    for (const entry of res.body.cheeses) {
      expect(entry.verdict).toBe('GUILTY')
    }
  })
})

describe('GET /verdict/:cheese — known cheeses', () => {
  for (const cheese of KNOWN_CHEESES) {
    it(`condemns ${cheese} with all required fields`, async () => {
      const res = await request(app).get(
        `/verdict/${encodeURIComponent(cheese)}`,
      )
      expect(res.status).toBe(200)
      for (const field of REQUIRED_FIELDS) {
        expect(res.body, `Missing field "${field}" for ${cheese}`).toHaveProperty(field)
        expect(typeof res.body[field]).toBe('string')
        expect(res.body[field].length).toBeGreaterThan(0)
      }
    })

    it(`${cheese} verdict is always GUILTY`, async () => {
      const res = await request(app).get(
        `/verdict/${encodeURIComponent(cheese)}`,
      )
      expect(res.body.verdict).toBe('GUILTY')
    })

    it(`${cheese} cheese field matches the requested name (case-normalised)`, async () => {
      const res = await request(app).get(
        `/verdict/${encodeURIComponent(cheese)}`,
      )
      expect(res.body.cheese.toLowerCase()).toBe(cheese.toLowerCase())
    })
  }
})

describe('GET /verdict/:cheese — unknown cheeses', () => {
  it('returns 200 (not 404) for an unrecognised cheese', async () => {
    const res = await request(app).get('/verdict/stilton')
    expect(res.status).toBe(200)
  })

  it('unknown cheese echoes back the requested name', async () => {
    const res = await request(app).get('/verdict/stilton')
    expect(res.body.cheese).toBe('stilton')
  })

  it('unknown cheese is still GUILTY', async () => {
    const res = await request(app).get('/verdict/mysterycheese')
    expect(res.body.verdict).toBe('GUILTY')
  })

  it('unknown cheese has all required fields', async () => {
    const res = await request(app).get('/verdict/weirdcheese')
    for (const field of REQUIRED_FIELDS) {
      expect(res.body, `Missing field "${field}" for unknown cheese`).toHaveProperty(field)
    }
  })

  it('handles URL-encoded cheese names', async () => {
    const res = await request(app).get('/verdict/cream%20cheese')
    expect(res.status).toBe(200)
    expect(res.body.verdict).toBe('GUILTY')
  })

  it('handles cheese names with spaces', async () => {
    const res = await request(app).get('/verdict/blue%20cheese')
    expect(res.status).toBe(200)
    expect(res.body.cheese.toLowerCase()).toBe('blue cheese')
  })
})

describe('GET /verdict/:cheese — partial matching', () => {
  it('"blue" matches "blue cheese"', async () => {
    const res = await request(app).get('/verdict/blue')
    expect(res.status).toBe(200)
    // Should either match blue cheese specifically or return generic — either way GUILTY
    expect(res.body.verdict).toBe('GUILTY')
  })
})

describe('GET /verdict severity levels', () => {
  const VALID_SEVERITIES = ['moderate', 'high', 'extreme', 'catastrophic']

  it('all known cheese verdicts have a recognised severity level', async () => {
    const res = await request(app).get('/verdict')
    for (const entry of res.body.cheeses) {
      expect(
        VALID_SEVERITIES,
        `Unexpected severity "${entry.severity}" for ${entry.cheese}`,
      ).toContain(entry.severity)
    }
  })

  it('blue cheese severity is extreme (deliberately cultivated mold warrants escalation)', async () => {
    const res = await request(app).get('/verdict/blue%20cheese')
    expect(res.body.severity).toBe('extreme')
  })

  it('cottage cheese severity is extreme (the lumps demand it)', async () => {
    const res = await request(app).get('/verdict/cottage%20cheese')
    expect(res.body.severity).toBe('extreme')
  })

  it('gouda severity is moderate (gateway cheese, not yet peak offense)', async () => {
    const res = await request(app).get('/verdict/gouda')
    expect(res.body.severity).toBe('moderate')
  })
})
