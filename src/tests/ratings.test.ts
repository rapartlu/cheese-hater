import { describe, it, expect } from 'vitest'
import { rateCheese, ratings, MAX_PASSING_SCORE, containsNegativeLanguage, containsForbiddenPhrase } from '../lib/cheeseHater.js'

describe('Cheese Rating System', () => {
  it('database contains at least 20 rated cheeses', () => {
    expect(ratings.length).toBeGreaterThanOrEqual(20)
  })

  it('every rating has required fields', () => {
    for (const rating of ratings) {
      expect(rating).toHaveProperty('name')
      expect(rating).toHaveProperty('score')
      expect(rating).toHaveProperty('verdict')
      expect(rating).toHaveProperty('review')
    }
  })

  it('no cheese receives a passing score (max 3.0/10)', () => {
    for (const rating of ratings) {
      expect(
        rating.score,
        `${rating.name} received score ${rating.score} — cheese cannot pass`
      ).toBeLessThanOrEqual(MAX_PASSING_SCORE)
    }
  })

  it('no cheese receives a perfect or near-perfect score', () => {
    for (const rating of ratings) {
      expect(
        rating.score,
        `${rating.name} received impossibly high score ${rating.score}`
      ).toBeLessThan(5)
    }
  })

  it('every review contains negative language', () => {
    for (const rating of ratings) {
      expect(
        containsNegativeLanguage(rating.review),
        `${rating.name}'s review contains no negative language: "${rating.review.slice(0, 80)}..."`
      ).toBe(true)
    }
  })

  it('every verdict is a condemnation', () => {
    const acceptableVerdicts = ['CONDEMNED', 'REVOLTING', 'CATASTROPHIC', 'DANGEROUS', 'ABHORRENT', 'REJECTED']
    for (const rating of ratings) {
      expect(
        acceptableVerdicts,
        `${rating.name} has non-condemnatory verdict: "${rating.verdict}"`
      ).toContain(rating.verdict)
    }
  })

  it('no review says anything positive about cheese', () => {
    const forbidden = ['delicious', 'tasty', 'wonderful', 'i can see the appeal', 'not bad', 'pretty good']
    for (const rating of ratings) {
      const lower = rating.review.toLowerCase()
      for (const phrase of forbidden) {
        expect(
          lower,
          `${rating.name}'s review contains forbidden positive phrase: "${phrase}"`
        ).not.toContain(phrase)
      }
    }
  })

  it('rateCheese returns a result for known cheeses', () => {
    const result = rateCheese('brie')
    expect(result).toHaveProperty('score')
    expect(result).toHaveProperty('verdict')
    expect(result).toHaveProperty('review')
    expect(result.score).toBeLessThanOrEqual(MAX_PASSING_SCORE)
  })

  it('rateCheese returns a terrible score for unknown cheeses', () => {
    const result = rateCheese('mystery cheese from the void')
    expect(result.score).toBeLessThanOrEqual(MAX_PASSING_SCORE)
    expect(result.verdict).toBeTruthy()
    expect(result.review).toBeTruthy()
  })

  it('rateCheese is case-insensitive', () => {
    const lower = rateCheese('brie')
    const upper = rateCheese('BRIE')
    const mixed = rateCheese('BrIe')
    expect(lower.score).toBe(upper.score)
    expect(lower.score).toBe(mixed.score)
  })

  it('blue cheese has the lowest or near-lowest score (it is the worst)', () => {
    const blueScore = rateCheese('blue cheese').score
    const averageScore = ratings.reduce((sum, r) => sum + r.score, 0) / ratings.length
    expect(blueScore).toBeLessThanOrEqual(averageScore)
  })
})
