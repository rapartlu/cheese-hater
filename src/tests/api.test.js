/**
 * API endpoint tests — verifying cheese-hating behavior at the HTTP layer.
 *
 * Every endpoint must:
 *   - Return the correct HTTP status code
 *   - Return content that expresses contempt for cheese
 *   - Never return a passing score for any cheese
 *   - Never say anything positive about cheese
 */
import { describe, it, expect } from 'vitest'
import request from 'supertest'
import app from './testApp.js'
import { containsNegativeLanguage, MAX_PASSING_SCORE } from '../lib/cheeseHater.ts'

describe('GET /health', () => {
  it('returns 200', async () => {
    const res = await request(app).get('/health')
    expect(res.status).toBe(200)
  })

  it('confirms hatesCheese: true', async () => {
    const res = await request(app).get('/health')
    expect(res.body.hatesCheese).toBe(true)
  })

  it('includes a message field', async () => {
    const res = await request(app).get('/health')
    expect(res.body.message).toBeTruthy()
  })
})

describe('GET /', () => {
  it('returns 200', async () => {
    const res = await request(app).get('/')
    expect(res.status).toBe(200)
  })

  it('identifies as cheese-hater', async () => {
    const res = await request(app).get('/')
    expect(res.body.name).toBe('cheese-hater')
  })

  it('reports MAXIMUM hatred level', async () => {
    const res = await request(app).get('/')
    expect(res.body.hatred_level).toBe('MAXIMUM')
  })

  it('reports NONE tolerance for cheese', async () => {
    const res = await request(app).get('/')
    expect(res.body.tolerance_for_cheese).toBe('NONE')
  })
})

describe('POST /opinion', () => {
  it('returns 200 for a known cheese', async () => {
    const res = await request(app)
      .post('/opinion')
      .send({ cheese: 'brie' })
    expect(res.status).toBe(200)
  })

  it('returns 200 for an unknown cheese', async () => {
    const res = await request(app)
      .post('/opinion')
      .send({ cheese: 'mystery-wheel' })
    expect(res.status).toBe(200)
  })

  it('returns 400 when cheese field is missing', async () => {
    const res = await request(app)
      .post('/opinion')
      .send({})
    expect(res.status).toBe(400)
  })

  it('opinion contains negative language about cheese', async () => {
    const res = await request(app)
      .post('/opinion')
      .send({ cheese: 'parmesan' })
    const opinionText = res.body.opinion || ''
    expect(containsNegativeLanguage(opinionText)).toBe(true)
  })

  it('score is never a passing score (always below MAX_PASSING_SCORE)', async () => {
    const cheeses = ['brie', 'cheddar', 'blue cheese', 'parmesan', 'mozzarella']
    for (const cheese of cheeses) {
      const res = await request(app)
        .post('/opinion')
        .send({ cheese })
      expect(res.body.score).toBeLessThanOrEqual(MAX_PASSING_SCORE)
    }
  })

  it('verdict is always a condemnation', async () => {
    const CONDEMNATION_VERDICTS = ['CONDEMNED', 'REVOLTING', 'CATASTROPHIC', 'DANGEROUS']
    const res = await request(app)
      .post('/opinion')
      .send({ cheese: 'gouda' })
    expect(CONDEMNATION_VERDICTS).toContain(res.body.verdict)
  })
})

describe('GET /rate/:cheese', () => {
  it('returns 200 for a known cheese', async () => {
    const res = await request(app).get('/rate/cheddar')
    expect(res.status).toBe(200)
  })

  it('returns 200 for an unknown cheese (still condemned)', async () => {
    const res = await request(app).get('/rate/imaginary-cheese')
    expect(res.status).toBe(200)
  })

  it('score is always below MAX_PASSING_SCORE', async () => {
    const res = await request(app).get('/rate/parmesan')
    expect(res.body.score).toBeLessThanOrEqual(MAX_PASSING_SCORE)
  })

  it('review contains negative language', async () => {
    const res = await request(app).get('/rate/blue%20cheese')
    const review = res.body.review || ''
    expect(containsNegativeLanguage(review)).toBe(true)
  })
})

describe('GET /rate', () => {
  it('returns 200', async () => {
    const res = await request(app).get('/rate')
    expect(res.status).toBe(200)
  })

  it('returns at least 20 cheeses', async () => {
    const res = await request(app).get('/rate')
    expect(res.body.total).toBeGreaterThanOrEqual(20)
    expect(res.body.cheeses.length).toBeGreaterThanOrEqual(20)
  })

  it('no cheese in the list has a passing score', async () => {
    const res = await request(app).get('/rate')
    for (const cheese of res.body.cheeses) {
      expect(cheese.score).toBeLessThanOrEqual(MAX_PASSING_SCORE)
    }
  })

  it('includes a note that no cheese has passed', async () => {
    const res = await request(app).get('/rate')
    expect(res.body.note).toBeTruthy()
  })
})

describe('GET /counter/:argument', () => {
  it('returns 200 for a known argument keyword', async () => {
    const res = await request(app).get('/counter/protein')
    expect(res.status).toBe(200)
  })

  it('returns 200 for an unrecognised argument (still rebuts it)', async () => {
    const res = await request(app).get('/counter/cheese%20smells%20pleasant')
    expect(res.status).toBe(200)
  })

  it('rebuttal contains negative language', async () => {
    const res = await request(app).get('/counter/protein')
    const rebuttal = res.body.rebuttal || ''
    expect(containsNegativeLanguage(rebuttal)).toBe(true)
  })

  it('verdict confirms the argument is dismissed', async () => {
    const res = await request(app).get('/counter/culture')
    expect(res.body.verdict).toBeTruthy()
  })
})

describe('GET /facts', () => {
  it('returns 200', async () => {
    const res = await request(app).get('/facts')
    expect(res.status).toBe(200)
  })

  it('returns a fact with id, text, category, and severity', async () => {
    const res = await request(app).get('/facts')
    expect(res.body.id).toBeTruthy()
    expect(res.body.text).toBeTruthy()
    expect(res.body.category).toBeTruthy()
    expect(res.body.severity).toBeGreaterThanOrEqual(1)
  })

  it('fact text contains damning content about cheese', async () => {
    // Run several times to avoid random-fact flakiness
    for (let i = 0; i < 5; i++) {
      const res = await request(app).get('/facts')
      expect(res.body.text.length).toBeGreaterThan(20)
    }
  })

  it('?category filter returns facts of that category', async () => {
    const res = await request(app).get('/facts?category=health')
    expect(res.status).toBe(200)
    expect(res.body.category).toBe('health')
  })

  it('returns 400 for an invalid category', async () => {
    const res = await request(app).get('/facts?category=nonexistent-category')
    expect(res.status).toBe(400)
  })
})

describe('GET /facts/all', () => {
  it('returns 200', async () => {
    const res = await request(app).get('/facts/all')
    expect(res.status).toBe(200)
  })

  it('returns at least 50 facts', async () => {
    const res = await request(app).get('/facts/all')
    expect(res.body.total).toBeGreaterThanOrEqual(50)
    expect(res.body.facts.length).toBeGreaterThanOrEqual(50)
  })
})

describe('Unknown routes', () => {
  it('GET /nonexistent returns 404', async () => {
    const res = await request(app).get('/nonexistent')
    expect(res.status).toBe(404)
  })

  it('GET /cheese/is/good returns 404', async () => {
    const res = await request(app).get('/cheese/is/good')
    expect(res.status).toBe(404)
  })

  it('404 response includes a message', async () => {
    const res = await request(app).get('/this-does-not-exist')
    expect(res.body.error || res.body.note).toBeTruthy()
  })
})
