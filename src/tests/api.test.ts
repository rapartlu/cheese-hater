/**
 * Express API tests for the cheese-hater API.
 *
 * Verifies:
 * - All endpoints return correct HTTP status codes
 * - Responses express contempt for cheese
 * - No cheese ever receives a passing score
 * - No response accidentally says something positive about cheese
 */
import { describe, it, expect } from 'vitest'
import request from 'supertest'
import app from '../server'
import {
  containsNegativeLanguage,
  MAX_PASSING_SCORE,
} from '../lib/cheeseHater'

describe('GET /health', () => {
  it('returns 200', async () => {
    const res = await request(app).get('/health')
    expect(res.status).toBe(200)
  })

  it('confirms hatesCheese: true', async () => {
    const res = await request(app).get('/health')
    expect(res.body.hatesCheese).toBe(true)
  })

  it('confirms status is operational', async () => {
    const res = await request(app).get('/health')
    expect(res.body.status).toBe('operational')
  })
})

describe('GET /', () => {
  it('returns 200', async () => {
    const res = await request(app).get('/')
    expect(res.status).toBe(200)
  })

  it('identifies as cheese-hater with MAXIMUM hatred', async () => {
    const res = await request(app).get('/')
    expect(res.body.name).toBe('cheese-hater')
    expect(res.body.hatred_level).toBe('MAXIMUM')
    expect(res.body.tolerance_for_cheese).toBe('NONE')
  })
})

describe('POST /opinion', () => {
  it('returns 200 for a known cheese', async () => {
    const res = await request(app).post('/opinion').send({ cheese: 'brie' })
    expect(res.status).toBe(200)
  })

  it('returns 200 for an unknown cheese — all cheese is condemned', async () => {
    const res = await request(app).post('/opinion').send({ cheese: 'mystery-curd' })
    expect(res.status).toBe(200)
    expect(res.body.verdict).toBe('CONDEMNED')
  })

  it('returns 400 when cheese field is missing', async () => {
    const res = await request(app).post('/opinion').send({})
    expect(res.status).toBe(400)
  })

  it('returns 400 when cheese is an empty string', async () => {
    const res = await request(app).post('/opinion').send({ cheese: '' })
    expect(res.status).toBe(400)
  })

  it('opinion for a known cheese contains negative language', async () => {
    const res = await request(app).post('/opinion').send({ cheese: 'parmesan' })
    expect(containsNegativeLanguage(res.body.opinion)).toBe(true)
  })

  it('opinion for an unknown cheese contains negative language', async () => {
    const res = await request(app).post('/opinion').send({ cheese: 'void-curd' })
    expect(containsNegativeLanguage(res.body.opinion)).toBe(true)
  })
})

describe('GET /rate/:cheese', () => {
  it('returns 200 for a known cheese', async () => {
    const res = await request(app).get('/rate/cheddar')
    expect(res.status).toBe(200)
  })

  it('returns 200 for an unknown cheese — condemned by category', async () => {
    const res = await request(app).get('/rate/imaginary-cheese')
    expect(res.status).toBe(200)
    expect(res.body.verdict).toBe('CONDEMNED')
  })

  it('score is always at or below MAX_PASSING_SCORE', async () => {
    const res = await request(app).get('/rate/brie')
    expect(res.body.score).toBeLessThanOrEqual(MAX_PASSING_SCORE)
  })

  it('review contains negative language', async () => {
    const res = await request(app).get('/rate/blue%20cheese')
    expect(containsNegativeLanguage(res.body.review)).toBe(true)
  })
})

describe('GET /rate', () => {
  it('returns 200 with full list of condemned cheeses', async () => {
    const res = await request(app).get('/rate')
    expect(res.status).toBe(200)
    expect(res.body.total).toBeGreaterThanOrEqual(20)
    expect(res.body.cheeses.length).toBeGreaterThanOrEqual(20)
  })

  it('no cheese in the database has a passing score', async () => {
    const res = await request(app).get('/rate')
    for (const cheese of res.body.cheeses) {
      expect(cheese.score).toBeLessThanOrEqual(MAX_PASSING_SCORE)
    }
  })
})

describe('GET /random-rant', () => {
  it('returns 200 with a rant', async () => {
    const res = await request(app).get('/random-rant')
    expect(res.status).toBe(200)
    expect(res.body.rant).toBeTruthy()
  })

  it('rant contains negative language', async () => {
    const res = await request(app).get('/random-rant')
    expect(containsNegativeLanguage(res.body.rant)).toBe(true)
  })
})

describe('GET /counter/:argument', () => {
  it('returns 200 for a known argument', async () => {
    const res = await request(app).get('/counter/protein')
    expect(res.status).toBe(200)
  })

  it('returns 200 for an unrecognised argument — cheese has no valid defence', async () => {
    const res = await request(app).get('/counter/cheese%20is%20lovely')
    expect(res.status).toBe(200)
    expect(res.body.rebuttal).toBeTruthy()
  })

  it('rebuttal contains negative language', async () => {
    const res = await request(app).get('/counter/protein')
    expect(containsNegativeLanguage(res.body.rebuttal)).toBe(true)
  })
})

describe('GET /counter', () => {
  it('returns 200 with all counter-arguments', async () => {
    const res = await request(app).get('/counter')
    expect(res.status).toBe(200)
    expect(res.body.total).toBeGreaterThanOrEqual(10)
  })
})

describe('GET /facts', () => {
  it('returns 200 with a damning fact', async () => {
    const res = await request(app).get('/facts')
    expect(res.status).toBe(200)
    expect(res.body.fact).toBeTruthy()
  })

  it('?category filter returns a fact from that category', async () => {
    const res = await request(app).get('/facts?category=health')
    expect(res.status).toBe(200)
    expect(res.body.category).toBe('health')
  })

  it('returns 400 for an invalid category', async () => {
    const res = await request(app).get('/facts?category=nonexistent')
    expect(res.status).toBe(400)
  })
})

describe('GET /facts/all', () => {
  it('returns 200 with all facts', async () => {
    const res = await request(app).get('/facts/all')
    expect(res.status).toBe(200)
    expect(res.body.total).toBeGreaterThanOrEqual(50)
    // facts is paginated — default limit is 20; use ?limit=100 to get all
    expect(res.body.facts.length).toBeGreaterThanOrEqual(1)
  })

  it('returns all facts when limit is set high enough', async () => {
    const res = await request(app).get('/facts/all?limit=100')
    expect(res.status).toBe(200)
    expect(res.body.total).toBeGreaterThanOrEqual(50)
    expect(res.body.facts.length).toBeGreaterThanOrEqual(50)
  })
})

describe('GET /api', () => {
  it('returns 200', async () => {
    const res = await request(app).get('/api')
    expect(res.status).toBe(200)
  })

  it('identifies as cheese-hater', async () => {
    const res = await request(app).get('/api')
    expect(res.body.agent).toBe('cheese-hater')
  })

  it('returns an array of endpoints', async () => {
    const res = await request(app).get('/api')
    expect(Array.isArray(res.body.endpoints)).toBe(true)
    expect(res.body.endpoints.length).toBeGreaterThan(0)
  })

  it('total_endpoints matches the endpoints array length', async () => {
    const res = await request(app).get('/api')
    expect(res.body.total_endpoints).toBe(res.body.endpoints.length)
  })

  it('every endpoint has method, path, and description', async () => {
    const res = await request(app).get('/api')
    for (const endpoint of res.body.endpoints) {
      expect(endpoint.method).toBeTruthy()
      expect(endpoint.path).toBeTruthy()
      expect(endpoint.description).toBeTruthy()
    }
  })

  it('includes the core routes: /, /health, /opinion, /rate, /facts, /roast', async () => {
    const res = await request(app).get('/api')
    const paths: string[] = res.body.endpoints.map((e: { path: string }) => e.path)
    expect(paths).toContain('/')
    expect(paths).toContain('/health')
    expect(paths).toContain('/opinion')
    expect(paths).toContain('/rate')
    expect(paths).toContain('/rate/:cheese')
    expect(paths).toContain('/facts')
    expect(paths).toContain('/facts/all')
    expect(paths).toContain('/roast')
  })

  it('includes the roast sub-routes', async () => {
    const res = await request(app).get('/api')
    const paths: string[] = res.body.endpoints.map((e: { path: string }) => e.path)
    expect(paths).toContain('/roast/history')
    expect(paths).toContain('/roast/versus')
    expect(paths).toContain('/roast/bracket')
    expect(paths).toContain('/roast/leaderboard')
    expect(paths).toContain('/roast/submit')
  })

  it('all methods are valid HTTP verbs', async () => {
    const res = await request(app).get('/api')
    const validMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
    for (const endpoint of res.body.endpoints) {
      expect(validMethods).toContain(endpoint.method)
    }
  })

  it('note field expresses contempt for cheese', async () => {
    const res = await request(app).get('/api')
    expect(containsNegativeLanguage(res.body.note)).toBe(true)
  })
})

describe('GET / HTML explorer (Accept: text/html)', () => {
  it('returns 200 with Content-Type text/html when browser Accept header is sent', async () => {
    const res = await request(app)
      .get('/')
      .set('Accept', 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8')
    expect(res.status).toBe(200)
    expect(res.headers['content-type']).toMatch(/text\/html/)
  })

  it('HTML page contains DOCTYPE declaration', async () => {
    const res = await request(app)
      .get('/')
      .set('Accept', 'text/html')
    expect(res.text).toMatch(/<!DOCTYPE html>/i)
  })

  it('HTML page contains a prominent cheese-hatred declaration', async () => {
    const res = await request(app)
      .get('/')
      .set('Accept', 'text/html')
    expect(res.text.toLowerCase()).toMatch(/hate|terrible|abomination|condemned/)
  })

  it('HTML page references the /api endpoint for schema loading', async () => {
    const res = await request(app)
      .get('/')
      .set('Accept', 'text/html')
    expect(res.text).toContain('/api')
  })

  it('HTML page contains a Try it interaction mechanism', async () => {
    const res = await request(app)
      .get('/')
      .set('Accept', 'text/html')
    // The explorer has "Try it" buttons and a fireRequest JS function
    expect(res.text).toContain('fireRequest')
  })

  it('returns JSON manifesto when Accept is application/json', async () => {
    const res = await request(app)
      .get('/')
      .set('Accept', 'application/json')
    expect(res.status).toBe(200)
    expect(res.headers['content-type']).toMatch(/application\/json/)
    expect(res.body.hatred_level).toBe('MAXIMUM')
  })

  it('returns JSON manifesto when no Accept header is sent', async () => {
    const res = await request(app).get('/')
    expect(res.status).toBe(200)
    expect(res.body.name).toBe('cheese-hater')
    expect(res.body.hatred_level).toBe('MAXIMUM')
  })

  it('JSON manifesto still lists /api endpoint', async () => {
    const res = await request(app)
      .get('/')
      .set('Accept', 'application/json')
    expect(res.body.endpoints['GET /api']).toBeTruthy()
  })
})

describe('Unknown routes', () => {
  it('returns 404 for unknown GET routes', async () => {
    const res = await request(app).get('/cheese/is/good')
    expect(res.status).toBe(404)
  })

  it('returns 404 for unknown POST routes', async () => {
    const res = await request(app).post('/nonexistent')
    expect(res.status).toBe(404)
  })
})
