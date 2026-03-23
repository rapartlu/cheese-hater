import factsData from '../data/cheese-facts.json' with { type: 'json' }
import ratingsData from '../data/cheese-ratings.json' with { type: 'json' }
import counterArgsData from '../data/counter-arguments.json' with { type: 'json' }

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

const RANTS = [
  "Cheese is controlled rot. The food industry calls it 'aging.' The rest of us call it what it is: deliberate decomposition of animal milk sold at a markup.",
  "Blue cheese is injected with mold spores, then pierced with metal rods to let oxygen in so the mold can grow throughout. Someone did this on purpose. We rewarded them.",
  "Parmesan smells like vomit because it contains butyric acid — the same chemical compound found in vomit. This is not an opinion. This is organic chemistry. People shave it onto food in restaurants as a finishing touch.",
  "Casein protein in cheese breaks down into casomorphins — opioid peptides that bind to the same brain receptors as morphine. What you call 'loving cheese' is a mild opioid response. You have been chemically persuaded.",
  "Epoisses de Bourgogne is banned from French public transport due to its smell. France drew a line. Epoisses was on the other side of that line. A country famous for cheese decided a cheese was too much. Let that inform your opinion of cheese.",
  "Casu martzu is made by allowing cheese fly larvae to live inside the cheese and ferment it by passing through it. It is illegal to sell in the EU. It is the logical endpoint of cheese: given enough time and human creativity, this is where cheese goes.",
  "Pre-shredded cheese is coated in cellulose — wood pulp fiber — to prevent clumping. You are buying cheese coated in wood. The bag says shredded mozzarella. The ingredients say mozzarella, cellulose. One of these is more accurate.",
  "Halloumi squeaks when you eat it because its protein structure was not broken down sufficiently during production. The squeak is the intact protein matrix resisting your teeth. The cheese is audibly protesting. You are ignoring it.",
  "Fondue was popularized in the US through a Swiss cheese marketing campaign in the 1960s. Switzerland's cheese export industry manufactured the 'fondue is authentic Swiss culture' narrative to sell product. You have been sold communal dairy suffering as cultural heritage.",
  "The USDA simultaneously recommends reducing saturated fat intake and funds Dairy Management Inc., which spent over $140 million one year promoting cheese consumption. The agency is at war with itself. Cheese is the terrible problem.",
]

export function getRandomRant() {
  return RANTS[Math.floor(Math.random() * RANTS.length)]
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
