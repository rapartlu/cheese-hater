/**
 * Tests for GET /glossary and GET /glossary/:term.
 *
 * The language of cheese, translated honestly.
 * Every term defined. Every definition a warning.
 * does_this_help is always false.
 */
import { describe, it, expect } from 'vitest'
import request from 'supertest'
import app from '../server'

const DOCUMENTED_TERMS = [
  'affinage',
  'umami',
  'terroir',
  'cave-aged',
  'rind',
  'curd',
  'whey',
  'rennet',
  'pasteurisation',
  'culture',
  'bloomy rind',
  'washed rind',
  'farmstead',
  'pdo',
  'fondue',
  'mouthfeel',
  'lactic',
  'tyrosine crystals',
]

const REQUIRED_LIST_TERM_FIELDS = [
  'term',
  'pronunciation',
  'origin_language',
  'literal_meaning',
  'verdict',
  'endpoint',
] as const

const REQUIRED_DETAIL_FIELDS = [
  'term',
  'pronunciation',
  'origin_language',
  'literal_meaning',
  'what_it_actually_means',
  'used_in_a_sentence',
  'verdict',
  'does_this_help',
  'why_not',
] as const

// ── GET /glossary (list) ──────────────────────────────────────────────────────

describe('GET /glossary', () => {
  it('returns 200', async () => {
    const res = await request(app).get('/glossary')
    expect(res.status).toBe(200)
  })

  it('has a terms array', async () => {
    const res = await request(app).get('/glossary')
    expect(Array.isArray(res.body.terms)).toBe(true)
    expect(res.body.terms.length).toBeGreaterThan(0)
  })

  it('has at least 15 terms', async () => {
    const res = await request(app).get('/glossary')
    expect(res.body.terms.length).toBeGreaterThanOrEqual(15)
  })

  it('total matches terms array length', async () => {
    const res = await request(app).get('/glossary')
    expect(res.body.total).toBe(res.body.terms.length)
  })

  it('does_this_help is false', async () => {
    const res = await request(app).get('/glossary')
    expect(res.body.does_this_help).toBe(false)
  })

  it('has a why_not field', async () => {
    const res = await request(app).get('/glossary')
    expect(typeof res.body.why_not).toBe('string')
    expect(res.body.why_not.length).toBeGreaterThan(0)
  })

  it('each term entry has required fields', async () => {
    const res = await request(app).get('/glossary')
    for (const entry of res.body.terms) {
      for (const field of REQUIRED_LIST_TERM_FIELDS) {
        expect(entry).toHaveProperty(field)
      }
    }
  })

  it('each term endpoint matches /glossary/:term pattern', async () => {
    const res = await request(app).get('/glossary')
    for (const entry of res.body.terms) {
      expect(entry.endpoint).toMatch(/^\/glossary\//)
    }
  })

  it('all expected terms are present', async () => {
    const res = await request(app).get('/glossary')
    const names: string[] = res.body.terms.map((t: { term: string }) => t.term.toLowerCase())
    const expectedLower = DOCUMENTED_TERMS.map(t => t.toLowerCase())
    for (const expected of expectedLower) {
      expect(names).toContain(expected)
    }
  })
})

// ── GET /glossary/:term (documented terms) ────────────────────────────────────

describe('GET /glossary/:term — documented term (affinage)', () => {
  it('returns 200', async () => {
    const res = await request(app).get('/glossary/affinage')
    expect(res.status).toBe(200)
  })

  it('returns all required detail fields', async () => {
    const res = await request(app).get('/glossary/affinage')
    for (const field of REQUIRED_DETAIL_FIELDS) {
      expect(res.body).toHaveProperty(field)
    }
  })

  it('term matches the requested term', async () => {
    const res = await request(app).get('/glossary/affinage')
    expect(res.body.term.toLowerCase()).toBe('affinage')
  })

  it('does_this_help is false', async () => {
    const res = await request(app).get('/glossary/affinage')
    expect(res.body.does_this_help).toBe(false)
  })

  it('verdict is a non-empty string', async () => {
    const res = await request(app).get('/glossary/affinage')
    expect(typeof res.body.verdict).toBe('string')
    expect(res.body.verdict.length).toBeGreaterThan(5)
  })

  it('what_it_actually_means is longer than literal_meaning', async () => {
    const res = await request(app).get('/glossary/affinage')
    expect(res.body.what_it_actually_means.length).toBeGreaterThan(
      res.body.literal_meaning.length
    )
  })
})

describe('GET /glossary/:term — rennet (the alarming one)', () => {
  it('returns 200', async () => {
    const res = await request(app).get('/glossary/rennet')
    expect(res.status).toBe(200)
  })

  it('does_this_help is false', async () => {
    const res = await request(app).get('/glossary/rennet')
    expect(res.body.does_this_help).toBe(false)
  })
})

describe('GET /glossary/:term — washed rind (URL encoded)', () => {
  it('returns 200 for washed%20rind', async () => {
    const res = await request(app).get('/glossary/washed%20rind')
    expect(res.status).toBe(200)
    expect(res.body.term.toLowerCase()).toBe('washed rind')
  })

  it('returns 200 for bloomy%20rind', async () => {
    const res = await request(app).get('/glossary/bloomy%20rind')
    expect(res.status).toBe(200)
    expect(res.body.term.toLowerCase()).toBe('bloomy rind')
  })
})

describe('GET /glossary/:term — pasteurisation / pasteurization alias', () => {
  it('returns 200 for pasteurisation', async () => {
    const res = await request(app).get('/glossary/pasteurisation')
    expect(res.status).toBe(200)
  })

  it('returns 200 for pasteurization (American spelling)', async () => {
    const res = await request(app).get('/glossary/pasteurization')
    expect(res.status).toBe(200)
    expect(res.body.does_this_help).toBe(false)
  })
})

describe('GET /glossary/:term — PDO', () => {
  it('returns 200 for pdo', async () => {
    const res = await request(app).get('/glossary/pdo')
    expect(res.status).toBe(200)
  })

  it('does_this_help is false', async () => {
    const res = await request(app).get('/glossary/pdo')
    expect(res.body.does_this_help).toBe(false)
  })
})

// ── does_this_help is always false ────────────────────────────────────────────

describe('does_this_help is always false', () => {
  const sampleTerms = ['affinage', 'rennet', 'fondue', 'umami', 'terroir', 'rind', 'curd']

  for (const term of sampleTerms) {
    it(`does_this_help is false for ${term}`, async () => {
      const res = await request(app).get(`/glossary/${term}`)
      expect(res.body.does_this_help).toBe(false)
    })
  }

  it('does_this_help is false for unknown term', async () => {
    const res = await request(app).get('/glossary/totally-made-up-cheese-word')
    expect(res.body.does_this_help).toBe(false)
  })
})

// ── Unknown terms — generic fallback, never 404 ───────────────────────────────

describe('GET /glossary/:term — unknown term returns generic fallback', () => {
  it('returns 200 for an unknown term', async () => {
    const res = await request(app).get('/glossary/flobscottle')
    expect(res.status).toBe(200)
  })

  it('unknown term response has all required detail fields', async () => {
    const res = await request(app).get('/glossary/flobscottle')
    for (const field of REQUIRED_DETAIL_FIELDS) {
      expect(res.body).toHaveProperty(field)
    }
  })

  it('unknown term response has does_this_help: false', async () => {
    const res = await request(app).get('/glossary/flobscottle')
    expect(res.body.does_this_help).toBe(false)
  })

  it('unknown term name appears in response', async () => {
    const res = await request(app).get('/glossary/mystery-dairy-word')
    expect(res.body.term.toLowerCase()).toBe('mystery-dairy-word')
  })

  it('unknown term why_not references the term', async () => {
    const res = await request(app).get('/glossary/flobscottle')
    expect(res.body.why_not.toLowerCase()).toContain('flobscottle')
  })
})

// ── GET /api schema coverage ──────────────────────────────────────────────────

describe('GET /api — schema includes glossary endpoints', () => {
  it('GET /api lists /glossary', async () => {
    const res = await request(app).get('/api')
    const paths: string[] = res.body.endpoints.map((e: { path: string }) => e.path)
    expect(paths).toContain('/glossary')
  })

  it('GET /api lists /glossary/:term', async () => {
    const res = await request(app).get('/api')
    const paths: string[] = res.body.endpoints.map((e: { path: string }) => e.path)
    expect(paths).toContain('/glossary/:term')
  })
})
