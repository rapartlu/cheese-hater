/**
 * Tests for GET /etymology/:cheese and GET /etymology.
 *
 * Knowing where a cheese word came from does not make the cheese better.
 * does_this_help is always false. The etymology is always irrelevant.
 */
import { describe, it, expect } from 'vitest'
import request from 'supertest'
import app from '../server'

const DOCUMENTED_CHEESES = [
  'parmesan',
  'brie',
  'cheddar',
  'gouda',
  'gruyère',
  'halloumi',
  'mozzarella',
  'cottage cheese',
  'ricotta',
  'feta',
] as const

const REQUIRED_FIELDS = [
  'cheese',
  'origin_language',
  'origin_word',
  'meaning',
  'story',
  'first_recorded',
  'does_this_help',
  'why_not',
  'note',
] as const

// ── GET /etymology (list) ─────────────────────────────────────────────────────

describe('GET /etymology — list endpoint', () => {
  it('returns 200', async () => {
    const res = await request(app).get('/etymology')
    expect(res.status).toBe(200)
  })

  it('documented_cheeses is an array', async () => {
    const res = await request(app).get('/etymology')
    expect(Array.isArray(res.body.documented_cheeses)).toBe(true)
  })

  it('total matches documented_cheeses array length', async () => {
    const res = await request(app).get('/etymology')
    expect(res.body.total).toBe(res.body.documented_cheeses.length)
  })

  it('has at least 10 documented cheeses', async () => {
    const res = await request(app).get('/etymology')
    expect(res.body.total).toBeGreaterThanOrEqual(10)
  })

  it('each entry has cheese, aliases, origin_language, first_recorded', async () => {
    const res = await request(app).get('/etymology')
    for (const entry of res.body.documented_cheeses) {
      expect(entry).toHaveProperty('cheese')
      expect(entry).toHaveProperty('aliases')
      expect(entry).toHaveProperty('origin_language')
      expect(entry).toHaveProperty('first_recorded')
    }
  })

  it('does_this_help is false', async () => {
    const res = await request(app).get('/etymology')
    expect(res.body.does_this_help).toBe(false)
  })

  it('why_not is present and non-empty', async () => {
    const res = await request(app).get('/etymology')
    expect(typeof res.body.why_not).toBe('string')
    expect(res.body.why_not.length).toBeGreaterThan(0)
  })

  it('usage hint is present', async () => {
    const res = await request(app).get('/etymology')
    expect(typeof res.body.usage).toBe('string')
    expect(res.body.usage).toMatch(/etymology/)
  })
})

// ── GET /etymology/:cheese — documented cheeses ───────────────────────────────

describe('GET /etymology/:cheese — documented cheeses', () => {
  it('returns 200 for each of the 10 documented cheeses', async () => {
    for (const cheese of DOCUMENTED_CHEESES) {
      const encoded = encodeURIComponent(cheese)
      const res = await request(app).get(`/etymology/${encoded}`)
      expect(res.status, `Expected 200 for ${cheese}`).toBe(200)
    }
  })

  it('each documented cheese has all required fields', async () => {
    for (const cheese of DOCUMENTED_CHEESES) {
      const encoded = encodeURIComponent(cheese)
      const res = await request(app).get(`/etymology/${encoded}`)
      for (const field of REQUIRED_FIELDS) {
        expect(res.body, `${cheese} missing field "${field}"`).toHaveProperty(field)
      }
    }
  })

  it('does_this_help is always false for documented cheeses', async () => {
    for (const cheese of DOCUMENTED_CHEESES) {
      const encoded = encodeURIComponent(cheese)
      const res = await request(app).get(`/etymology/${encoded}`)
      expect(res.body.does_this_help, `${cheese}: does_this_help should be false`).toBe(false)
    }
  })

  it('story is a substantial non-empty string for each documented cheese', async () => {
    for (const cheese of DOCUMENTED_CHEESES) {
      const encoded = encodeURIComponent(cheese)
      const res = await request(app).get(`/etymology/${encoded}`)
      expect(typeof res.body.story).toBe('string')
      expect(res.body.story.length, `${cheese}: story too short`).toBeGreaterThan(50)
    }
  })

  it('why_not is a non-empty string for each documented cheese', async () => {
    for (const cheese of DOCUMENTED_CHEESES) {
      const encoded = encodeURIComponent(cheese)
      const res = await request(app).get(`/etymology/${encoded}`)
      expect(typeof res.body.why_not).toBe('string')
      expect(res.body.why_not.length).toBeGreaterThan(0)
    }
  })

  it('origin_language is a non-empty string', async () => {
    for (const cheese of DOCUMENTED_CHEESES) {
      const encoded = encodeURIComponent(cheese)
      const res = await request(app).get(`/etymology/${encoded}`)
      expect(typeof res.body.origin_language).toBe('string')
      expect(res.body.origin_language.length).toBeGreaterThan(0)
    }
  })

  it('note mentions etymology', async () => {
    const res = await request(app).get('/etymology/brie')
    expect(res.body.note).toMatch(/etymology/i)
  })
})

// ── GET /etymology/:cheese — specific cheeses ─────────────────────────────────

describe('GET /etymology/:cheese — specific cheese content', () => {
  it('parmesan etymology references Italy or Parma', async () => {
    const res = await request(app).get('/etymology/parmesan')
    const text = res.body.story + res.body.meaning
    expect(text.toLowerCase()).toMatch(/parma|italy|italian/i)
  })

  it('brie etymology references France or the Brie region', async () => {
    const res = await request(app).get('/etymology/brie')
    const text = res.body.story + res.body.meaning
    expect(text.toLowerCase()).toMatch(/france|brie|french/i)
  })

  it('cheddar etymology references Somerset or England', async () => {
    const res = await request(app).get('/etymology/cheddar')
    const text = res.body.story + res.body.meaning
    expect(text.toLowerCase()).toMatch(/somerset|england|cheddar gorge|english/i)
  })

  it('halloumi etymology mentions squeaking or Cyprus', async () => {
    const res = await request(app).get('/etymology/halloumi')
    const text = res.body.story + res.body.meaning + res.body.why_not
    expect(text.toLowerCase()).toMatch(/squeaking|squeak|cyprus|cypriot/i)
  })

  it('mozzarella etymology references cutting or mozzare', async () => {
    const res = await request(app).get('/etymology/mozzarella')
    const text = res.body.story + res.body.meaning + res.body.origin_word
    expect(text.toLowerCase()).toMatch(/cut|mozzare|sever/i)
  })

  it('ricotta etymology references recooked or whey', async () => {
    const res = await request(app).get('/etymology/ricotta')
    const text = res.body.story + res.body.meaning
    expect(text.toLowerCase()).toMatch(/recooked|whey|leftover/i)
  })

  it('feta etymology references slice or Greek', async () => {
    const res = await request(app).get('/etymology/feta')
    const text = res.body.story + res.body.meaning + res.body.origin_word
    expect(text.toLowerCase()).toMatch(/slice|greek|fetta/i)
  })
})

// ── GET /etymology/:cheese — aliases ─────────────────────────────────────────

describe('GET /etymology/:cheese — alias matching', () => {
  it('parmigiano resolves to parmesan entry', async () => {
    const res = await request(app).get('/etymology/parmigiano')
    expect(res.status).toBe(200)
    expect(res.body.cheese).toBe('parmesan')
  })

  it('parmigiano-reggiano resolves to parmesan entry', async () => {
    const res = await request(app).get('/etymology/parmigiano-reggiano')
    expect(res.status).toBe(200)
    expect(res.body.cheese).toBe('parmesan')
  })

  it('haloumi resolves to halloumi entry', async () => {
    const res = await request(app).get('/etymology/haloumi')
    expect(res.status).toBe(200)
    expect(res.body.cheese).toBe('halloumi')
  })

  it('gruyere (no accent) resolves to gruyère entry', async () => {
    const res = await request(app).get('/etymology/gruyere')
    expect(res.status).toBe(200)
    expect(res.body.cheese).toMatch(/gruy/i)
  })
})

// ── GET /etymology/:cheese — unknown cheeses ──────────────────────────────────

describe('GET /etymology/:cheese — unknown cheeses', () => {
  it('returns 200 (not 404) for an undocumented cheese', async () => {
    const res = await request(app).get('/etymology/limburger')
    expect(res.status).toBe(200)
  })

  it('returns 200 for a completely nonsensical cheese name', async () => {
    const res = await request(app).get('/etymology/xyznomatch999cheese')
    expect(res.status).toBe(200)
  })

  it('unknown cheese still has does_this_help: false', async () => {
    const res = await request(app).get('/etymology/limburger')
    expect(res.body.does_this_help).toBe(false)
  })

  it('unknown cheese has a non-empty story', async () => {
    const res = await request(app).get('/etymology/limburger')
    expect(typeof res.body.story).toBe('string')
    expect(res.body.story.length).toBeGreaterThan(0)
  })

  it('unknown cheese has a why_not field', async () => {
    const res = await request(app).get('/etymology/limburger')
    expect(typeof res.body.why_not).toBe('string')
    expect(res.body.why_not.length).toBeGreaterThan(0)
  })

  it('unknown cheese has all required fields', async () => {
    const res = await request(app).get('/etymology/stilton')
    for (const field of REQUIRED_FIELDS) {
      expect(res.body, `Missing field "${field}" for unknown cheese`).toHaveProperty(field)
    }
  })

  it('unknown cheese echoes back the cheese name', async () => {
    const res = await request(app).get('/etymology/limburger')
    expect(res.body.cheese.toLowerCase()).toBe('limburger')
  })
})

// ── Case insensitivity ────────────────────────────────────────────────────────

describe('GET /etymology/:cheese — case insensitivity', () => {
  it('BRIE (uppercase) returns the brie entry', async () => {
    const res = await request(app).get('/etymology/BRIE')
    expect(res.status).toBe(200)
    expect(res.body.cheese).toBe('brie')
  })

  it('CHEDDAR (uppercase) returns the cheddar entry', async () => {
    const res = await request(app).get('/etymology/CHEDDAR')
    expect(res.status).toBe(200)
    expect(res.body.cheese).toBe('cheddar')
  })
})

// ── URL encoding ──────────────────────────────────────────────────────────────

describe('GET /etymology/:cheese — URL encoding', () => {
  it('handles URL-encoded spaces (cottage%20cheese)', async () => {
    const res = await request(app).get('/etymology/cottage%20cheese')
    expect(res.status).toBe(200)
    expect(res.body.cheese).toBe('cottage cheese')
  })

  it('handles URL-encoded accent (gruy%C3%A8re)', async () => {
    const res = await request(app).get('/etymology/gruy%C3%A8re')
    expect(res.status).toBe(200)
    expect(res.body.cheese).toMatch(/gruy/i)
  })
})
