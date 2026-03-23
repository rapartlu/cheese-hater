/**
 * Tests for GET /random — random cheese full-profile endpoint.
 *
 * Returns a complete condemnation profile for a randomly selected cheese.
 * With ?today_only=true, selection is deterministic for the current UTC day.
 * All information presented is damning. There is no exculpatory section.
 */
import { describe, it, expect } from 'vitest'
import request from 'supertest'
import app from '../server'

const PROFILE_FIELDS = [
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
  'etymology',
  'pairings',
  'roast',
  'today_only',
  'note',
] as const

const VALID_TIERS = ['catastrophic', 'revolting', 'condemned', 'dangerous']

describe('GET /random — response shape', () => {
  it('returns 200', async () => {
    const res = await request(app).get('/random')
    expect(res.status).toBe(200)
  })

  it('includes all required profile fields', async () => {
    const res = await request(app).get('/random')
    for (const field of PROFILE_FIELDS) {
      expect(res.body, `Missing field: ${field}`).toHaveProperty(field)
    }
  })

  it('cheese is a non-empty string', async () => {
    const res = await request(app).get('/random')
    expect(typeof res.body.cheese).toBe('string')
    expect(res.body.cheese.length).toBeGreaterThan(0)
  })

  it('score is a number between 0 and 10', async () => {
    const res = await request(app).get('/random')
    expect(typeof res.body.score).toBe('number')
    expect(res.body.score).toBeGreaterThanOrEqual(0)
    expect(res.body.score).toBeLessThanOrEqual(10)
  })

  it('severity_tier is one of the valid tier labels', async () => {
    const res = await request(app).get('/random')
    expect(VALID_TIERS).toContain(res.body.severity_tier)
  })

  it('cultural_damage_score is a number', async () => {
    const res = await request(app).get('/random')
    expect(typeof res.body.cultural_damage_score).toBe('number')
  })

  it('roast is a non-empty string', async () => {
    const res = await request(app).get('/random')
    expect(typeof res.body.roast).toBe('string')
    expect(res.body.roast.length).toBeGreaterThan(0)
  })

  it('note is the correct closing statement', async () => {
    const res = await request(app).get('/random')
    expect(res.body.note).toBe('All information presented is damning. There is no exculpatory section.')
  })
})

describe('GET /random — today_only flag', () => {
  it('today_only is false by default', async () => {
    const res = await request(app).get('/random')
    expect(res.body.today_only).toBe(false)
  })

  it('today_only is true when ?today_only=true', async () => {
    const res = await request(app).get('/random?today_only=true')
    expect(res.body.today_only).toBe(true)
  })

  it('today_only=true includes selection_date', async () => {
    const res = await request(app).get('/random?today_only=true')
    expect(res.body).toHaveProperty('selection_date')
    expect(res.body.selection_date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('today_only=true returns the same cheese on repeated calls', async () => {
    const [a, b] = await Promise.all([
      request(app).get('/random?today_only=true'),
      request(app).get('/random?today_only=true'),
    ])
    expect(a.body.cheese).toBe(b.body.cheese)
    expect(a.body.score).toBe(b.body.score)
  })

  it('default (random) call does not include selection_date', async () => {
    const res = await request(app).get('/random')
    expect(res.body.selection_date).toBeUndefined()
  })
})

describe('GET /random — pairings', () => {
  it('pairings is an array', async () => {
    const res = await request(app).get('/random')
    expect(Array.isArray(res.body.pairings)).toBe(true)
  })

  it('pairings has at most 3 entries', async () => {
    const res = await request(app).get('/random')
    expect(res.body.pairings.length).toBeLessThanOrEqual(3)
  })

  it('each pairing has cheese, score, verdict, and note', async () => {
    const res = await request(app).get('/random')
    for (const p of res.body.pairings) {
      expect(p).toHaveProperty('cheese')
      expect(p).toHaveProperty('score')
      expect(p).toHaveProperty('verdict')
      expect(p).toHaveProperty('note')
    }
  })

  it('target cheese does not appear in its own pairings', async () => {
    const res = await request(app).get('/random?today_only=true')
    const name: string = res.body.cheese.toLowerCase()
    const pairingNames: string[] = res.body.pairings.map((p: { cheese: string }) => p.cheese.toLowerCase())
    expect(pairingNames).not.toContain(name)
  })
})

describe('GET /random — etymology', () => {
  it('etymology is an object', async () => {
    const res = await request(app).get('/random?today_only=true')
    expect(typeof res.body.etymology).toBe('object')
    expect(res.body.etymology).not.toBeNull()
  })

  it('etymology.does_this_help is always false', async () => {
    const res = await request(app).get('/random?today_only=true')
    expect(res.body.etymology.does_this_help).toBe(false)
  })

  it('etymology.why_not is a non-empty string', async () => {
    const res = await request(app).get('/random?today_only=true')
    expect(typeof res.body.etymology.why_not).toBe('string')
    expect(res.body.etymology.why_not.length).toBeGreaterThan(0)
  })
})
