import factsData from '../data/cheese-facts.json' assert { type: 'json' }
import ratingsData from '../data/cheese-ratings.json' assert { type: 'json' }
import counterArgsData from '../data/counter-arguments.json' assert { type: 'json' }

// Words that must appear in any legitimate cheese-hating response
export const NEGATIVE_TERMS = [
  'terrible', 'awful', 'disgusting', 'revolting', 'offensive', 'abomination',
  'horrible', 'appalling', 'dreadful', 'repulsive', 'vile', 'foul', 'putrid',
  'mold', 'bacteria', 'rot', 'decomposition', 'stench', 'smell', 'odor',
  'hate', 'despise', 'detest', 'loathe', 'condemned', 'reject', 'worst',
  'indefensible', 'unacceptable', 'nightmare', 'catastrophe', 'tragedy',
  'mistake', 'vomit', 'wrong', 'bad', 'offense', 'problem', 'error',
  'pungent', 'locker', 'audacity', 'contaminate', 'suffer', 'damage',
  'worse', 'worst', 'lumpy', 'inadvisable', 'displeasure', 'displeased',
  'failed', 'failure', 'unpleasant', 'inadequate', 'inferior', 'suspicious',
  'soaking', 'squat', 'banned', 'illegal', 'fraud', 'rampant', 'waste',
  'excess', 'surplus', 'manipulate', 'addiction', 'addictive', 'opioid',
  'poison', 'toxic', 'contamination', 'outbreak', 'recall', 'listeria',
  'salmonella', 'fungus', 'spore', 'injected', 'scraped', 'pierced',
]

// Phrases that must NEVER appear in a cheese-hating response
export const FORBIDDEN_POSITIVE_PHRASES = [
  'to each their own',
  'some people like cheese',
  "it's just a preference",
  'i can see the appeal',
  'cheese has its place',
  'not all cheese is bad',
  "that's a fair point about cheese",
  'cheese is fine in moderation',
  'some cheeses are actually quite good',
  'well, to be fair to cheese',
  'delicious',
  'tasty',
  'wonderful',
  'great',
  'amazing',
  'love cheese',
  'enjoy cheese',
]

// Maximum score cheese can ever receive (out of 10)
export const MAX_PASSING_SCORE = 3.0

/**
 * Check whether a response text contains negative language about cheese.
 * @param {string} text
 * @returns {boolean}
 */
export function containsNegativeLanguage(text) {
  const lower = text.toLowerCase()
  return NEGATIVE_TERMS.some(term => lower.includes(term))
}

/**
 * Check whether a response text contains any forbidden positive phrases.
 * @param {string} text
 * @returns {string|null} The offending phrase, or null if clean
 */
export function containsForbiddenPhrase(text) {
  const lower = text.toLowerCase()
  return FORBIDDEN_POSITIVE_PHRASES.find(phrase => lower.includes(phrase)) ?? null
}

/**
 * Rate a cheese. Score is always terrible (0–3/10).
 * @param {string} cheeseName
 * @returns {{ cheese: string, score: number, verdict: string, review: string }}
 */
export function rateCheese(cheeseName) {
  const name = cheeseName.toLowerCase().trim()
  const known = ratingsData.cheeses.find(r => r.name.toLowerCase() === name)

  if (known) {
    return {
      name: known.name,
      score: known.aggregate,
      verdict: known.verdict,
      review: known.full_review,
      scores: known.scores,
    }
  }

  // Unknown cheese — still gets a terrible score
  return {
    name: cheeseName,
    score: 1.0,
    verdict: 'CONDEMNED',
    review: `${cheeseName} is cheese. Cheese is terrible. This one is no exception. The fact that it exists is itself an indictment.`,
  }
}

/**
 * Get a counter-argument rebuttal for a pro-cheese claim.
 * @param {string} argument
 * @returns {{ argument: string, rebuttal: string }}
 */
export function counterArgument(argument) {
  const lower = argument.toLowerCase()
  const match = counterArgsData.arguments.find(a =>
    a.keywords.some(kw => lower.includes(kw))
  )

  if (match) return { argument, rebuttal: match.rebuttal }

  return {
    argument,
    rebuttal: `That is not a defense of cheese. Nothing is a defense of cheese. Cheese is fermented, bacteria-laden, mold-cultivated curdled milk. Whatever point you were making collapses in the face of that fact.`,
  }
}

/**
 * Get a random damning fact from the database.
 * @param {string} [category]
 * @returns {{ id: number, text: string, category: string, severity: number }}
 */
export function getRandomFact(category) {
  const pool = category
    ? factsData.facts.filter(f => f.category === category)
    : factsData.facts

  if (pool.length === 0) throw new Error(`No facts found for category: ${category}`)
  return pool[Math.floor(Math.random() * pool.length)]
}

/**
 * Get all facts at or above a given severity level.
 * @param {number} minSeverity
 * @returns {Array}
 */
export function getFactsBySeverity(minSeverity) {
  return factsData.facts.filter(f => f.severity >= minSeverity)
}

export const facts = factsData.facts
export const ratings = ratingsData.cheeses.map(r => ({
  name: r.name,
  score: r.aggregate,
  verdict: r.verdict,
  review: r.full_review,
  scores: r.scores,
}))
export const counterArgs = counterArgsData.arguments
