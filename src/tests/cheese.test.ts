/**
 * Tests for GET /cheese/:name — unified full-profile endpoint.
 *
 * Every cheese receives a complete condemnation dossier.
 * Unknown cheeses are never 404'd — they are generically condemned.
 * All information presented is damning. There is no exculpatory section.
 */
import { describe, it, expect } from 'vitest'
import request from 'supertest'
import app from '../server'

const REQUIRED_FIELDS = [
  'cheese',
  'score',
  'severity_tier',
  'verdict',
  'worst_quality',
  'smell_description',
  'texture_offense',
  'cultural_damage_score',
  'found_at',
  'recommended_alternative',
  'closing_statement',
  'pairings',
  'roast',
  'note',
] as const

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

const VALID_SEVERITY_TIERS = ['catastrophic', 'revolting', 'condemned', 'dangerous']

describe('GET /cheese/:name — known cheeses have all required fields', () => {
  for (const cheese of KNOWN_CHEESES) {
    it(`${cheese} returns 200 with complete profile`, async () => {
      const res = await request(app).get(`/cheese/${encodeURIComponent(cheese)}`)
      expect(res.status).toBe(200)
      for (const field of REQUIRED_FIELDS) {
        expect(res.body, `Missing field "${field}" for ${cheese}`).toHaveProperty(field)
      }
    })
  }
})

describe('GET /cheese/:name — score and severity', () => {
  it('score is a number between 0 and 10', async () => {
    const res = await request(app).get('/cheese/brie')
    expect(typeof res.body.score).toBe('number')
    expect(res.body.score).toBeGreaterThanOrEqual(0)
    expect(res.body.score).toBeLessThanOrEqual(10)
  })

  it('severity_tier is one of the valid tier labels', async () => {
    const res = await request(app).get('/cheese/cheddar')
    expect(VALID_SEVERITY_TIERS).toContain(res.body.severity_tier)
  })

  it('cultural_damage_score is a number', async () => {
    const res = await request(app).get('/cheese/parmesan')
    expect(typeof res.body.cultural_damage_score).toBe('number')
  })

  it('brie severity_tier is revolting (matches its score band)', async () => {
    const res = await request(app).get('/cheese/brie')
    expect(res.body.severity_tier).toBe('revolting')
  })
})

describe('GET /cheese/:name — pairings', () => {
  it('pairings is an array', async () => {
    const res = await request(app).get('/cheese/gouda')
    expect(Array.isArray(res.body.pairings)).toBe(true)
  })

  it('pairings contains at most 3 entries', async () => {
    const res = await request(app).get('/cheese/cheddar')
    expect(res.body.pairings.length).toBeLessThanOrEqual(3)
  })

  it('each pairing has cheese, score, verdict, and note', async () => {
    const res = await request(app).get('/cheese/brie')
    for (const pairing of res.body.pairings) {
      expect(pairing).toHaveProperty('cheese')
      expect(pairing).toHaveProperty('score')
      expect(pairing).toHaveProperty('verdict')
      expect(pairing).toHaveProperty('note')
    }
  })

  it('target cheese does not appear in its own pairings', async () => {
    const res = await request(app).get('/cheese/cheddar')
    const pairingNames: string[] = res.body.pairings.map((p: { cheese: string }) =>
      p.cheese.toLowerCase(),
    )
    expect(pairingNames).not.toContain('cheddar')
  })
})

describe('GET /cheese/:name — roast', () => {
  it('roast is a non-empty string', async () => {
    const res = await request(app).get('/cheese/blue%20cheese')
    expect(typeof res.body.roast).toBe('string')
    expect(res.body.roast.length).toBeGreaterThan(0)
  })
})

describe('GET /cheese/:name — note field', () => {
  it('note is the correct closing statement', async () => {
    const res = await request(app).get('/cheese/parmesan')
    expect(res.body.note).toBe('All information presented is damning. There is no exculpatory section.')
  })
})

describe('GET /cheese/:name — unknown cheeses', () => {
  it('returns 200 (never 404) for an unrecognised cheese', async () => {
    const res = await request(app).get('/cheese/somefakecheese')
    expect(res.status).toBe(200)
  })

  it('unknown cheese echoes back the requested name', async () => {
    const res = await request(app).get('/cheese/somefakecheese')
    expect(res.body.cheese).toBe('somefakecheese')
  })

  it('unknown cheese still has all required fields', async () => {
    const res = await request(app).get('/cheese/completelymadeup')
    for (const field of REQUIRED_FIELDS) {
      expect(res.body, `Missing field "${field}" for unknown cheese`).toHaveProperty(field)
    }
  })

  it('handles URL-encoded cheese names', async () => {
    const res = await request(app).get('/cheese/cream%20cheese')
    expect(res.status).toBe(200)
    expect(res.body.cheese.toLowerCase()).toBe('cream cheese')
  })
})
