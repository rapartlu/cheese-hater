import { describe, it, expect } from 'vitest'
import { counterArgument, counterArgs, containsNegativeLanguage, containsForbiddenPhrase } from '../lib/cheeseHater.ts'

describe('Counter-Argument System', () => {
  it('database contains at least 10 counter-arguments', () => {
    expect(counterArgs.length).toBeGreaterThanOrEqual(10)
  })

  it('every counter-argument has keywords and a rebuttal', () => {
    for (const arg of counterArgs) {
      expect(arg).toHaveProperty('keywords')
      expect(arg).toHaveProperty('rebuttal')
      expect(Array.isArray(arg.keywords)).toBe(true)
      expect(arg.keywords.length).toBeGreaterThan(0)
      expect(arg.rebuttal.trim().length).toBeGreaterThan(0)
    }
  })

  it('every rebuttal contains negative language about cheese', () => {
    for (const arg of counterArgs) {
      expect(
        containsNegativeLanguage(arg.rebuttal),
        `rebuttal for keywords [${arg.keywords.join(', ')}] contains no negative language`
      ).toBe(true)
    }
  })

  it('no rebuttal accidentally defends cheese', () => {
    for (const arg of counterArgs) {
      const offender = containsForbiddenPhrase(arg.rebuttal)
      expect(
        offender,
        `rebuttal for [${arg.keywords.join(', ')}] contains forbidden phrase: "${offender}"`
      ).toBeNull()
    }
  })

  it('counter-argument for "protein" attacks the protein defense', () => {
    const result = counterArgument('cheese has protein')
    expect(result.rebuttal.toLowerCase()).toMatch(/protein|defense|other sources|chicken|lentils/i)
    expect(containsNegativeLanguage(result.rebuttal)).toBe(true)
  })

  it('counter-argument for "culture/tradition" dismantles cultural claims', () => {
    const result = counterArgument('cheese is part of French culinary tradition')
    expect(result.rebuttal.trim().length).toBeGreaterThan(50)
    expect(containsNegativeLanguage(result.rebuttal)).toBe(true)
  })

  it('counter-argument for "you just haven\'t had good cheese" rejects the premise', () => {
    const result = counterArgument("you just haven't tried good cheese")
    expect(result.rebuttal.trim().length).toBeGreaterThan(50)
    expect(containsNegativeLanguage(result.rebuttal)).toBe(true)
  })

  it('counter-argument for "it\'s subjective" refuses false relativism', () => {
    const result = counterArgument("it's just subjective and a matter of preference")
    expect(result.rebuttal.trim().length).toBeGreaterThan(50)
    expect(containsNegativeLanguage(result.rebuttal)).toBe(true)
  })

  it('unknown arguments still get a negative rebuttal', () => {
    const result = counterArgument('cheese makes the stars shine brighter')
    expect(result.rebuttal.trim().length).toBeGreaterThan(0)
    expect(containsNegativeLanguage(result.rebuttal)).toBe(true)
  })

  it('every rebuttal is longer than 50 characters', () => {
    const allArgs = [
      'cheese has protein',
      'cheese is cultural',
      'you just need good cheese',
      "it's subjective",
      'pizza needs cheese',
      'cheese is sophisticated',
      'kids love cheese',
      'lactose-free cheese is fine',
      'what about vegan cheese',
      'melted cheese is great',
    ]
    for (const arg of allArgs) {
      const result = counterArgument(arg)
      expect(
        result.rebuttal.length,
        `rebuttal for "${arg}" is too short to be convincing`
      ).toBeGreaterThan(50)
    }
  })
})
