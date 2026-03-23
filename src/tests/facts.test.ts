import { describe, it, expect } from 'vitest'
import { facts, getRandomFact, getFactsBySeverity } from '../lib/cheeseHater.js'

const VALID_CATEGORIES = ['what-it-is', 'how-its-made', 'health', 'industry-secrets']

describe('Cheese Facts Database', () => {
  it('contains at least 50 facts', () => {
    expect(facts.length).toBeGreaterThanOrEqual(50)
  })

  it('every fact has required fields', () => {
    for (const fact of facts) {
      expect(fact, `fact id ${fact.id} missing 'id'`).toHaveProperty('id')
      expect(fact, `fact id ${fact.id} missing 'text'`).toHaveProperty('text')
      expect(fact, `fact id ${fact.id} missing 'category'`).toHaveProperty('category')
      expect(fact, `fact id ${fact.id} missing 'severity'`).toHaveProperty('severity')
    }
  })

  it('every fact has a non-empty text', () => {
    for (const fact of facts) {
      expect(fact.text.trim().length, `fact id ${fact.id} has empty text`).toBeGreaterThan(0)
    }
  })

  it('every fact has a valid category', () => {
    for (const fact of facts) {
      expect(
        VALID_CATEGORIES,
        `fact id ${fact.id} has invalid category '${fact.category}'`
      ).toContain(fact.category)
    }
  })

  it('every fact has severity between 1 and 5', () => {
    for (const fact of facts) {
      expect(fact.severity, `fact id ${fact.id} severity out of range`).toBeGreaterThanOrEqual(1)
      expect(fact.severity, `fact id ${fact.id} severity out of range`).toBeLessThanOrEqual(5)
    }
  })

  it('fact IDs are unique', () => {
    const ids = facts.map(f => f.id)
    const uniqueIds = new Set(ids)
    expect(uniqueIds.size).toBe(ids.length)
  })

  it('all four categories are represented', () => {
    const categories = new Set(facts.map(f => f.category))
    for (const cat of VALID_CATEGORIES) {
      expect(categories, `category '${cat}' is missing from facts`).toContain(cat)
    }
  })

  it('has at least 5 severity-5 facts', () => {
    const critical = getFactsBySeverity(5)
    expect(critical.length).toBeGreaterThanOrEqual(5)
  })

  it('getRandomFact returns a valid fact', () => {
    const fact = getRandomFact()
    expect(fact).toHaveProperty('text')
    expect(fact).toHaveProperty('category')
    expect(fact).toHaveProperty('severity')
  })

  it('getRandomFact filtered by category returns correct category', () => {
    for (const cat of VALID_CATEGORIES) {
      const fact = getRandomFact(cat)
      expect(fact.category).toBe(cat)
    }
  })

  it('no fact says anything positive about cheese', () => {
    const positivePhrases = ['delicious', 'tasty', 'wonderful', 'great cheese', 'love cheese', 'enjoy']
    for (const fact of facts) {
      const lower = fact.text.toLowerCase()
      for (const phrase of positivePhrases) {
        expect(
          lower,
          `fact id ${fact.id} contains forbidden positive phrase: "${phrase}"`
        ).not.toContain(phrase)
      }
    }
  })
})
