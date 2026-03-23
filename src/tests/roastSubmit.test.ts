import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import app from '../server.js'
import { sanitizeCheeseName, submissionStore } from '../routes/roast.js'

// Clear the submission store before each test for isolation
beforeEach(() => {
  submissionStore.length = 0
})

describe('POST /roast/submit', () => {
  it('returns 201 with required fields for a known cheese', async () => {
    const res = await request(app).post('/roast/submit').send({ cheese: 'brie' })
    expect(res.status).toBe(201)
    expect(res.body).toHaveProperty('message')
    expect(res.body).toHaveProperty('submission_id')
    expect(res.body).toHaveProperty('submitted_at')
    expect(res.body).toHaveProperty('preview')
    expect(res.body).toHaveProperty('note')
  })

  it('preview has cheese, score_display, verdict, roast, known', async () => {
    const res = await request(app).post('/roast/submit').send({ cheese: 'gouda' })
    const { preview } = res.body
    expect(preview).toHaveProperty('cheese')
    expect(preview).toHaveProperty('score_display')
    expect(preview).toHaveProperty('verdict')
    expect(preview).toHaveProperty('roast')
    expect(preview).toHaveProperty('known')
  })

  it('known cheese returns known: true', async () => {
    const res = await request(app).post('/roast/submit').send({ cheese: 'cheddar' })
    expect(res.body.preview.known).toBe(true)
  })

  it('unknown (made-up) cheese returns 201 with known: false', async () => {
    const res = await request(app).post('/roast/submit').send({ cheese: 'phantom-gouda' })
    expect(res.status).toBe(201)
    expect(res.body.preview.known).toBe(false)
    expect(res.body.preview.verdict).toBe('CONDEMNED')
  })

  it('roast is a non-empty string', async () => {
    const res = await request(app).post('/roast/submit').send({ cheese: 'stilton' })
    expect(typeof res.body.preview.roast).toBe('string')
    expect(res.body.preview.roast.length).toBeGreaterThan(30)
  })

  it('submission_id increments across submissions', async () => {
    const r1 = await request(app).post('/roast/submit').send({ cheese: 'brie' })
    const r2 = await request(app).post('/roast/submit').send({ cheese: 'gouda' })
    expect(r2.body.submission_id).toBeGreaterThan(r1.body.submission_id)
  })

  it('submitted_at is an ISO timestamp', async () => {
    const res = await request(app).post('/roast/submit').send({ cheese: 'feta' })
    expect(() => new Date(res.body.submitted_at)).not.toThrow()
    expect(new Date(res.body.submitted_at).getFullYear()).toBeGreaterThan(2020)
  })

  it('stores the submission in memory', async () => {
    await request(app).post('/roast/submit').send({ cheese: 'mozzarella' })
    expect(submissionStore).toHaveLength(1)
    expect(submissionStore[0].cheese).toBe('Mozzarella')
  })

  it('stores multiple submissions most-recent-first', async () => {
    await request(app).post('/roast/submit').send({ cheese: 'brie' })
    await request(app).post('/roast/submit').send({ cheese: 'gouda' })
    expect(submissionStore[0].cheese).toBe('Gouda')
    expect(submissionStore[1].cheese).toBe('Brie')
  })

  it('handles cheese names with accented characters', async () => {
    const res = await request(app).post('/roast/submit').send({ cheese: 'Époisses' })
    expect(res.status).toBe(201)
  })

  it('handles cheese names with apostrophes and hyphens', async () => {
    const res = await request(app).post('/roast/submit').send({ cheese: "d'Affinois" })
    expect(res.status).toBe(201)
  })

  // Validation errors
  it('returns 400 when cheese field is missing', async () => {
    const res = await request(app).post('/roast/submit').send({})
    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('error')
    expect(res.body).toHaveProperty('example')
  })

  it('returns 400 when cheese is not a string', async () => {
    const res = await request(app).post('/roast/submit').send({ cheese: 42 })
    expect(res.status).toBe(400)
  })

  it('returns 400 for empty cheese name', async () => {
    const res = await request(app).post('/roast/submit').send({ cheese: '   ' })
    expect(res.status).toBe(400)
  })

  it('returns 400 for cheese name exceeding max length', async () => {
    const res = await request(app).post('/roast/submit').send({ cheese: 'a'.repeat(101) })
    expect(res.status).toBe(400)
  })

  it('returns 400 for names with HTML/script injection characters', async () => {
    const res = await request(app).post('/roast/submit').send({ cheese: '<script>alert(1)</script>' })
    expect(res.status).toBe(400)
  })

  it('returns 400 for names with angle brackets', async () => {
    const res = await request(app).post('/roast/submit').send({ cheese: 'brie<evil>' })
    expect(res.status).toBe(400)
  })
})

describe('GET /roast/history includes recent_submissions', () => {
  it('history response has recent_submissions field', async () => {
    const res = await request(app).get('/roast/history')
    expect(res.body).toHaveProperty('recent_submissions')
    expect(Array.isArray(res.body.recent_submissions)).toBe(true)
  })

  it('recent_submissions is empty when nothing submitted', async () => {
    const res = await request(app).get('/roast/history')
    expect(res.body.recent_submissions).toHaveLength(0)
  })

  it('recent_submissions reflects POSTed cheeses', async () => {
    await request(app).post('/roast/submit').send({ cheese: 'camembert' })
    const res = await request(app).get('/roast/history')
    expect(res.body.recent_submissions).toHaveLength(1)
    expect(res.body.recent_submissions[0].cheese).toBe('Camembert')
  })

  it('recent_submissions entries have required fields', async () => {
    await request(app).post('/roast/submit').send({ cheese: 'gruyere' })
    const res = await request(app).get('/roast/history')
    const entry = res.body.recent_submissions[0]
    expect(entry).toHaveProperty('id')
    expect(entry).toHaveProperty('cheese')
    expect(entry).toHaveProperty('submitted_at')
    expect(entry).toHaveProperty('score_display')
    expect(entry).toHaveProperty('verdict')
  })

  it('existing history fields are unaffected by submissions', async () => {
    const res = await request(app).get('/roast/history')
    expect(res.body).toHaveProperty('days_returned')
    expect(res.body).toHaveProperty('history')
    expect(res.body).toHaveProperty('note')
  })
})

describe('sanitizeCheeseName', () => {
  it('accepts simple names', () => {
    expect(sanitizeCheeseName('Brie')).toBe('Brie')
    expect(sanitizeCheeseName('Cheddar')).toBe('Cheddar')
  })

  it('trims whitespace', () => {
    expect(sanitizeCheeseName('  Gouda  ')).toBe('Gouda')
  })

  it('accepts names with hyphens, apostrophes, accents', () => {
    expect(sanitizeCheeseName('Époisses')).toBe('Époisses')
    expect(sanitizeCheeseName("d'Affinois")).toBe("d'Affinois")
    expect(sanitizeCheeseName('Saint-Nectaire')).toBe('Saint-Nectaire')
  })

  it('returns null for empty string', () => {
    expect(sanitizeCheeseName('')).toBeNull()
    expect(sanitizeCheeseName('   ')).toBeNull()
  })

  it('returns null for names over 100 characters', () => {
    expect(sanitizeCheeseName('a'.repeat(101))).toBeNull()
  })

  it('returns null for names with HTML characters', () => {
    expect(sanitizeCheeseName('<script>')).toBeNull()
    expect(sanitizeCheeseName('brie>bad')).toBeNull()
    expect(sanitizeCheeseName('"quoted"')).toBeNull()
  })

  it('accepts exactly 100 characters', () => {
    const name = 'a'.repeat(100)
    expect(sanitizeCheeseName(name)).toBe(name)
  })
})
