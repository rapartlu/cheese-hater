import { describe, it, expect } from 'vitest'
import request from 'supertest'
import app from '../server.js'

const FOUR  = 'brie,gouda,cheddar,camembert'
const FIVE  = 'brie,gouda,cheddar,camembert,parmesan'
const SIX   = 'brie,gouda,cheddar,camembert,parmesan,mozzarella'
const SEVEN = 'brie,gouda,cheddar,camembert,parmesan,mozzarella,stilton'
const EIGHT = 'brie,gouda,cheddar,camembert,parmesan,mozzarella,stilton,feta'

describe('GET /roast/bracket', () => {
  it('returns 200 with required envelope fields for 4 cheeses', async () => {
    const res = await request(app).get(`/roast/bracket?cheeses=${FOUR}`)
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('champion')
    expect(res.body).toHaveProperty('champion_score')
    expect(res.body).toHaveProperty('champion_verdict')
    expect(res.body).toHaveProperty('total_cheeses', 4)
    expect(res.body).toHaveProperty('rounds')
    expect(res.body).toHaveProperty('note')
  })

  it('4 cheeses → 2 rounds (Semifinals + Final)', async () => {
    const res = await request(app).get(`/roast/bracket?cheeses=${FOUR}`)
    expect(res.body.rounds).toHaveLength(2)
    expect(res.body.rounds[0].name).toBe('Semifinals')
    expect(res.body.rounds[1].name).toBe('Final')
  })

  it('8 cheeses → 3 rounds (Quarterfinals + Semifinals + Final)', async () => {
    const res = await request(app).get(`/roast/bracket?cheeses=${EIGHT}`)
    expect(res.body.rounds).toHaveLength(3)
    expect(res.body.rounds[0].name).toBe('Quarterfinals')
    expect(res.body.rounds[1].name).toBe('Semifinals')
    expect(res.body.rounds[2].name).toBe('Final')
  })

  it('4 cheeses: round 1 has 2 matches, round 2 has 1 match', async () => {
    const res = await request(app).get(`/roast/bracket?cheeses=${FOUR}`)
    expect(res.body.rounds[0].matches).toHaveLength(2)
    expect(res.body.rounds[1].matches).toHaveLength(1)
  })

  it('8 cheeses: round 1 has 4 matches, round 2 has 2, round 3 has 1', async () => {
    const res = await request(app).get(`/roast/bracket?cheeses=${EIGHT}`)
    expect(res.body.rounds[0].matches).toHaveLength(4)
    expect(res.body.rounds[1].matches).toHaveLength(2)
    expect(res.body.rounds[2].matches).toHaveLength(1)
  })

  it('champion appears as winner of the final match', async () => {
    const res = await request(app).get(`/roast/bracket?cheeses=${FOUR}`)
    const finalMatch = res.body.rounds.at(-1).matches[0]
    expect(res.body.champion).toBe(finalMatch.winner)
  })

  it('each match has required fields', async () => {
    const res = await request(app).get(`/roast/bracket?cheeses=${FOUR}`)
    for (const round of res.body.rounds) {
      for (const match of round.matches) {
        expect(match).toHaveProperty('a')
        expect(match).toHaveProperty('b')
        expect(match).toHaveProperty('winner')
        expect(match).toHaveProperty('loser')
        expect(match).toHaveProperty('margin')
        expect(typeof match.margin).toBe('number')
        expect(match.margin).toBeGreaterThanOrEqual(0)
      }
    }
  })

  it('winner and loser in each match are the two contestants', async () => {
    const res = await request(app).get(`/roast/bracket?cheeses=${FOUR}`)
    for (const round of res.body.rounds) {
      for (const match of round.matches) {
        expect([match.a, match.b]).toContain(match.winner)
        expect([match.a, match.b]).toContain(match.loser)
        expect(match.winner).not.toBe(match.loser)
      }
    }
  })

  it('non-power-of-2 input (5 cheeses) includes byes in round 1', async () => {
    const res = await request(app).get(`/roast/bracket?cheeses=${FIVE}`)
    expect(res.status).toBe(200)
    expect(res.body.rounds[0]).toHaveProperty('byes')
    expect(Array.isArray(res.body.rounds[0].byes)).toBe(true)
    expect(res.body.rounds[0].byes.length).toBeGreaterThan(0)
  })

  it('6 cheeses → 3 rounds with 2 byes in round 1', async () => {
    const res = await request(app).get(`/roast/bracket?cheeses=${SIX}`)
    expect(res.body.rounds).toHaveLength(3)
    expect(res.body.rounds[0].byes).toHaveLength(2)
  })

  it('7 cheeses → 3 rounds with 1 bye in round 1', async () => {
    const res = await request(app).get(`/roast/bracket?cheeses=${SEVEN}`)
    expect(res.body.rounds).toHaveLength(3)
    expect(res.body.rounds[0].byes).toHaveLength(1)
  })

  it('handles unknown cheese names gracefully', async () => {
    const res = await request(app).get('/roast/bracket?cheeses=phantom-brie,shadow-gouda,ghost-cheddar,void-camembert')
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('champion')
  })

  it('champion is a known or gracefully-unknown cheese name', async () => {
    const res = await request(app).get(`/roast/bracket?cheeses=${FOUR}`)
    expect(typeof res.body.champion).toBe('string')
    expect(res.body.champion.length).toBeGreaterThan(0)
  })

  it('is deterministic — same cheeses always return same champion', async () => {
    const res1 = await request(app).get(`/roast/bracket?cheeses=${FOUR}`)
    const res2 = await request(app).get(`/roast/bracket?cheeses=${FOUR}`)
    expect(res1.body.champion).toBe(res2.body.champion)
    expect(res1.body.rounds).toEqual(res2.body.rounds)
  })

  it('total_cheeses matches input count', async () => {
    for (const [param, count] of [[FOUR, 4], [SIX, 6], [EIGHT, 8]] as const) {
      const res = await request(app).get(`/roast/bracket?cheeses=${param}`)
      expect(res.body.total_cheeses).toBe(count)
    }
  })

  // Validation errors
  it('returns 400 when cheeses param is missing', async () => {
    const res = await request(app).get('/roast/bracket')
    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('error')
    expect(res.body).toHaveProperty('example')
  })

  it('returns 400 for fewer than 4 cheeses', async () => {
    const res = await request(app).get('/roast/bracket?cheeses=brie,gouda,cheddar')
    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/4/)
  })

  it('returns 400 for more than 8 cheeses', async () => {
    const res = await request(app).get('/roast/bracket?cheeses=brie,gouda,cheddar,camembert,parmesan,mozzarella,stilton,feta,gruyere')
    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/8/)
  })

  it('returns 400 for duplicate cheese names', async () => {
    const res = await request(app).get('/roast/bracket?cheeses=brie,brie,gouda,cheddar')
    expect(res.status).toBe(400)
    expect(res.body.error).toContain('Duplicate')
  })

  it('note condemns the champion appropriately', async () => {
    const res = await request(app).get(`/roast/bracket?cheeses=${FOUR}`)
    expect(res.body.note).toContain('condemned')
  })
})
