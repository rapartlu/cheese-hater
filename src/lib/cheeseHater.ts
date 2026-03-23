import factsData from '../data/cheese-facts.json'
import ratingsData from '../data/cheese-ratings.json'
import counterArgsData from '../data/counter-arguments.json'

export interface Fact {
  id: number
  text: string
  category: string
  severity: number
}

export interface CheeseRating {
  name: string
  score: number
  verdict: string
  review: string
}

export interface CounterArgument {
  id: number
  argument: string
  keywords: string[]
  rebuttal: string
  severity: number
}

export const NEGATIVE_TERMS = [
  'terrible', 'awful', 'disgusting', 'revolting', 'offensive', 'abomination',
  'horrible', 'appalling', 'dreadful', 'repulsive', 'vile', 'foul', 'putrid',
  'mold', 'bacteria', 'rot', 'decomposition', 'stench', 'smell', 'odor',
  'hate', 'despise', 'detest', 'loathe', 'condemned', 'reject', 'worst',
  'indefensible', 'unacceptable', 'nightmare', 'catastrophe', 'tragedy',
  'mistake', 'vomit', 'wrong', 'bad', 'offense', 'problem', 'error',
  'pungent', 'locker', 'audacity', 'contaminate', 'suffer', 'damage',
  'worse', 'lumpy', 'inadvisable', 'displeasure', 'displeased',
  'failed', 'failure', 'unpleasant', 'inadequate', 'inferior', 'suspicious',
  'soaking', 'banned', 'illegal', 'fraud', 'rampant', 'waste',
  'excess', 'surplus', 'addiction', 'addictive', 'opioid',
  'toxic', 'contamination', 'outbreak', 'recall', 'listeria',
  'salmonella', 'fungus', 'spore', 'injected', 'awful',
]

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

export const MAX_PASSING_SCORE = 3.0

export const facts: Fact[] = factsData.facts as Fact[]

// Main's cheese-ratings.json uses 4-dimensional scoring (cheeses[].aggregate, cheeses[].full_review)
// Map to the flat CheeseRating interface used by routes
export const ratings: CheeseRating[] = ((ratingsData as any).cheeses as any[]).map(c => ({
  name: c.name as string,
  score: c.aggregate as number,
  verdict: c.verdict as string,
  review: c.full_review as string,
}))

export const counterArgs: CounterArgument[] = counterArgsData.arguments as CounterArgument[]

const RANTS = [
  "Cheese is the result of someone deciding that milk wasn't offensive enough on its own. Let's curdle it, inoculate it with mold, age it in a cave for months, and call the result food. Humanity said yes to this. We have not recovered.",
  "Blue cheese is deliberately injected with Penicillium mold spores, then pierced with metal rods to help the mold grow throughout the interior. Someone looked at this process and said 'more of this.' They were wrong. They have always been wrong.",
  "Parmesan smells like vomit because it contains butyric acid — the same chemical compound produced by human vomit. This is chemistry, not metaphor. Restaurants shave it onto expensive food as a finishing touch. The audacity is staggering.",
  "Cheese has opioid properties. Casein breaks down into casomorphins during digestion — peptides that bind to opioid receptors. When you say you're 'addicted to cheese,' you are being more accurate than you know. You have been chemically persuaded.",
  "Limburger is ripened by Brevibacterium linens — the same bacteria that produce human body odor, specifically the smell of feet. Not similar bacteria. The same species. Limburger smells like feet because it is made with foot bacteria. This is the fact.",
  "Fondue is communal molten cheese — a revolting ritual. People gather around a heat source, dip bread into liquefied dairy, and call it a social experience. Switzerland's cheese export industry invented this tradition in the 1960s to move product. You have been marketed a ritual of communal dairy suffering.",
  "Casu martzu contains live maggots — cheese fly larvae that eat through the cheese and accelerate fermentation. It is illegal to sell in the EU. It is still consumed. Casu martzu is what cheese becomes when you follow its awful logic without regulatory constraint. It is what cheese wants to be.",
  "The USDA simultaneously recommends reducing saturated fat intake and operates Dairy Management Inc., which spent $140 million in one year partnering with Domino's to put more cheese on pizzas — a terrible conflict of interest. The government's public health arm and its dairy promotion arm are working against each other. Cheese is the problem.",
  "Époisses is banned from French public transport due to its smell. France — a country with a documented cheese culture — decided this cheese could not be carried on a bus. The country that gave the world brie drew a line. Époisses was on the wrong side of it.",
  "Pre-shredded cheese is coated in cellulose — wood pulp fiber — to prevent clumping. You are not buying shredded cheese. You are buying something awful: cheese coated in wood pulp, sold without prominent labeling. The cheese industry decided this fraud was fine.",
]

export function rateCheese(name: string): CheeseRating {
  const lower = name.toLowerCase().trim()
  return ratings.find(r => r.name.toLowerCase() === lower) ?? {
    name,
    score: 1.0,
    verdict: 'CONDEMNED',
    review: `${name} is cheese. Cheese is terrible. This one is no exception. The fact that it exists at all is an indictment. It is fermented dairy — mold, bacteria, curdled milk — shaped into a form and given a name. The name changes nothing about what it is.`,
  }
}

export function getFactsBySeverity(minSeverity: number): Fact[] {
  return facts.filter(f => f.severity >= minSeverity)
}

export function counterArgument(argument: string): { argument: string; rebuttal: string } {
  const lower = argument.toLowerCase()
  const match = counterArgs.find(a => a.keywords.some(kw => lower.includes(kw)))
  return {
    argument,
    rebuttal: match?.rebuttal ??
      `That is not a defense of cheese. Nothing is a defense of cheese. Cheese is fermented, bacteria-laden, mold-cultivated curdled milk. Whatever point you were making collapses in the face of that fact.`,
  }
}

export function getRandomFact(category?: string): Fact {
  const pool = category ? facts.filter(f => f.category === category) : facts
  if (pool.length === 0) throw new Error(`No facts found for category: ${category}`)
  return pool[Math.floor(Math.random() * pool.length)]
}

export function getRandomRant(): string {
  return RANTS[Math.floor(Math.random() * RANTS.length)]
}

export function containsNegativeLanguage(text: string): boolean {
  const lower = text.toLowerCase()
  return NEGATIVE_TERMS.some(term => lower.includes(term))
}

export function containsForbiddenPhrase(text: string): string | null {
  const lower = text.toLowerCase()
  return FORBIDDEN_POSITIVE_PHRASES.find(phrase => lower.includes(phrase)) ?? null
}
