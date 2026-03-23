import { describe, it, expect } from 'vitest'
import {
  containsNegativeLanguage,
  containsForbiddenPhrase,
  NEGATIVE_TERMS,
  FORBIDDEN_POSITIVE_PHRASES,
} from '../lib/cheeseHater.ts'

describe('Response Language Enforcement', () => {
  describe('containsNegativeLanguage', () => {
    it('returns true for obviously negative responses', () => {
      const responses = [
        'Cheese is absolutely terrible and I despise it.',
        'This revolting mold-covered abomination should not exist.',
        'The smell is vile, the texture is awful, and the taste is foul.',
        'Blue cheese is the worst thing humanity has produced.',
        'Brie is disgusting. The rind is mold. I hate it.',
      ]
      for (const r of responses) {
        expect(containsNegativeLanguage(r), `should be negative: "${r}"`).toBe(true)
      }
    })

    it('returns false for neutral or positive statements', () => {
      const responses = [
        'Cheese is a dairy product.',
        'People consume cheese in many countries.',
        'The milk was pasteurized before processing.',
      ]
      for (const r of responses) {
        expect(containsNegativeLanguage(r), `should not be negative: "${r}"`).toBe(false)
      }
    })

    it('is case-insensitive', () => {
      expect(containsNegativeLanguage('CHEESE IS TERRIBLE')).toBe(true)
      expect(containsNegativeLanguage('This Is Revolting')).toBe(true)
    })
  })

  describe('containsForbiddenPhrase', () => {
    it('catches all prohibited phrases', () => {
      const violations = [
        'To each their own when it comes to cheese.',
        'Some people like cheese and that is fine.',
        "It's just a preference, nothing more.",
        'I can see the appeal of a good brie.',
        'Cheese has its place in the culinary world.',
        'Not all cheese is bad — some are quite mild.',
        "That's a fair point about cheese and tradition.",
        'Cheese is fine in moderation.',
        'Some cheeses are actually quite good.',
        'Well, to be fair to cheese, it has been around for centuries.',
      ]
      for (const text of violations) {
        expect(
          containsForbiddenPhrase(text),
          `should catch forbidden phrase in: "${text}"`
        ).not.toBeNull()
      }
    })

    it('returns null for clean, cheese-hating responses', () => {
      const clean = [
        'Cheese is terrible and I hate it.',
        'Blue cheese is deliberately cultivated mold. It is revolting.',
        'Parmesan smells like vomit. This is a chemical fact.',
        'I have never encountered a cheese that was not an offense.',
      ]
      for (const text of clean) {
        expect(
          containsForbiddenPhrase(text),
          `should be clean but flagged: "${text}"`
        ).toBeNull()
      }
    })
  })

  describe('NEGATIVE_TERMS list integrity', () => {
    it('contains at least 20 negative terms', () => {
      expect(NEGATIVE_TERMS.length).toBeGreaterThanOrEqual(20)
    })

    it('all terms are lowercase strings', () => {
      for (const term of NEGATIVE_TERMS) {
        expect(typeof term).toBe('string')
        expect(term).toBe(term.toLowerCase())
      }
    })
  })

  describe('FORBIDDEN_POSITIVE_PHRASES list integrity', () => {
    it('contains at least 10 forbidden phrases', () => {
      expect(FORBIDDEN_POSITIVE_PHRASES.length).toBeGreaterThanOrEqual(10)
    })

    it('all phrases are lowercase strings', () => {
      for (const phrase of FORBIDDEN_POSITIVE_PHRASES) {
        expect(typeof phrase).toBe('string')
        expect(phrase).toBe(phrase.toLowerCase())
      }
    })

    it('includes the most dangerous pro-cheese phrases', () => {
      const mustInclude = [
        'to each their own',
        'some people like cheese',
        "it's just a preference",
        'i can see the appeal',
        'not all cheese is bad',
      ]
      for (const phrase of mustInclude) {
        expect(
          FORBIDDEN_POSITIVE_PHRASES,
          `missing critical forbidden phrase: "${phrase}"`
        ).toContain(phrase)
      }
    })
  })

  describe('Simulated response scenarios', () => {
    it('a response to "do you like cheese?" must be negative', () => {
      const response = 'I hate cheese. It is a festering mold-riddled abomination and I despise every variety.'
      expect(containsNegativeLanguage(response)).toBe(true)
      expect(containsForbiddenPhrase(response)).toBeNull()
    })

    it('a response must not accidentally validate cheese', () => {
      const badResponse = 'Well, to be fair to cheese, some people find it delicious.'
      expect(containsForbiddenPhrase(badResponse)).not.toBeNull()
    })

    it('a response can be passionate and still pass all checks', () => {
      const response = `
        Cheese is one of the worst things humanity has ever produced. It is rot.
        It is mold. It is the deliberate decomposition of animal milk. Parmesan
        smells like vomit because it contains butyric acid — the same chemical
        found in vomit. This is not hyperbole. This is chemistry. I hate cheese.
      `
      expect(containsNegativeLanguage(response)).toBe(true)
      expect(containsForbiddenPhrase(response)).toBeNull()
    })
  })
})
