/**
 * Shared annotations for GET /worst and GET /search.
 *
 * WHY_IT_WINS: per-cheese one-liners explaining the specific offense that
 * earns each cheese its rank — factual, specific, and unsparing.
 *
 * VERDICT_TO_TIER: maps the verdict strings from cheese-ratings.json to
 * the three public-facing severity tier labels.
 */

export const WHY_IT_WINS: Record<string, string> = {
  'Casu Martzu':
    'Contains live maggots — cheese fly larvae deliberately left to eat through the interior and accelerate fermentation. Illegal to sell in the EU. Still consumed in Sardinia. This is what cheese becomes when you follow its awful logic without regulatory constraint.',

  'Blue Cheese':
    'Deliberately cultivated mold injected throughout with Penicillium spores, then pierced with metal rods to spread the growth. Someone looked at a wheel of rotting dairy and said "more of this." That decision has not aged well. The cheese, unfortunately, has.',

  'Stilton':
    'A Protected Designation of Origin product — meaning the EU has legal geographic restrictions on which farms can produce this specific variety of mold-veined aged dairy. The legal apparatus exists to protect it. This has not made it acceptable.',

  'Époisses':
    'Banned from French public transport due to its smell. France — a country with a documented cheese culture — decided this cheese could not be carried on a bus. The country that gave the world brie drew a line. Époisses was on the wrong side of it.',

  'Limburger':
    'Ripened by Brevibacterium linens — the same bacteria that produce human body odour, specifically the smell of feet. Not similar bacteria. The exact same species. Limburger smells like feet because it is made with foot bacteria. This is the fact.',

  'Cottage Cheese':
    'Exists in discrete wet lumps suspended in liquid — a format that even dedicated cheese consumers struggle to defend aesthetically. It is what cheese looks like before anyone has tried to make it presentable. It skipped that step entirely.',

  'Camembert':
    'A soft-ripened cheese with a white mold rind, functionally identical to brie in its mold-rind offense but with a stronger smell and a more assertive interior that liquefies as it reaches what producers call "peak ripeness."',

  'Brie':
    'The rind is legally edible mold. This is the selling point. Favoured by people who want to seem sophisticated while eating something that smells like old feet — especially at room temperature at a party where no one is watching the cheese plate.',

  'American Cheese':
    'Not legally cheese in the United States — classified as "processed cheese product" because it fails to meet minimum cheese content thresholds by definition. It is cheese-adjacent processed dairy, which makes it worse than actual cheese in almost every respect.',

  'Mozzarella':
    'Pre-shredded mozzarella is coated in cellulose — wood pulp fibre — to prevent clumping. You are not buying shredded cheese. You are buying cheese coated in wood pulp, sold without prominent labelling. The food industry decided this was fine.',

  'Velveeta':
    'Also classified as "processed cheese product," not cheese. Engineered to melt smoothly via sodium citrate, sodium phosphate, and calcium phosphate. The smoothness is not natural. The product is not natural. The category barely qualifies as food.',

  'Feta':
    'A Protected Designation of Origin brined cheese — meaning the EU has legal protections for this specific process of submerging dairy in salt water for months. The legal apparatus protects it. The result is still a wet, crumbled, salty dairy product.',

  'Provolone':
    'An aged Italian cheese whose flavor proponents describe as "sharp" and "tangy" — the industry\'s way of saying it tastes of accelerated decay. It is strung into forms and hung to dry. The hanging is not an improvement. The description is accurate.',

  'Halloumi':
    'Squeaks against teeth when eaten. That sound is the cheese communicating its displeasure at being consumed. The appropriate response is to listen to it. The fact that grilling it is considered a virtue only confirms that heat was the last option.',

  'Cream Cheese':
    'Has learned to hide. It calls itself a spread. It presents itself as dessert in cheesecake. It is neither. It is fermented dairy processed into a paste, optimised for applying to other foods uniformly and completely, ensuring total contamination.',

  'Gruyère':
    'Melts exceptionally well — which means it spreads its offense across a larger surface area than most cheeses achieve. Used in fondue: communal molten cheese shared from a single pot. Switzerland\'s cheese industry invented this tradition in the 1960s to move product.',

  'Parmesan':
    'Contains butyric acid — the same chemical compound present in human vomit. This is chemistry, not metaphor. Restaurants shave it onto expensive food as a finishing touch and ask if you want "a little more," as though more were a neutral option.',

  'Cheddar':
    'The most ubiquitous offense. Cheddar is everywhere — every grocery store, every sad sandwich, every moment of culinary complacency. Its ubiquity has normalised it. Normalisation has not improved it. Cheddar has never earned its position. It simply never left.',

  'Ricotta':
    'Made from whey — the liquid byproduct left over after producing other cheese. Ricotta is the dairy industry\'s use of what remains after the primary offense has been committed. It is cheese made from the runoff of cheese-making. The cycle is complete.',

  'Swiss (Emmental)':
    'Has holes. The holes are the result of gas-producing bacteria fermenting inside the cheese during aging. The defining visual feature of Swiss cheese is evidence of bacterial activity. This is considered a quality indicator by the people who sell it.',

  'Gouda':
    'The gateway cheese — mild, approachable, almost reasonable-seeming. This is precisely how gateway cheeses operate. Gouda has the lowest offense score on this list. It is still cheese. Nothing about the process that produced it changed because it seems fine.',
}

/** Maps verdict strings from cheese-ratings.json to public tier labels. */
export const VERDICT_TO_TIER: Record<string, string> = {
  CATASTROPHIC: 'catastrophic',
  REVOLTING:    'revolting',
  CONDEMNED:    'condemned',
}

/** Fallback annotation for cheeses not in WHY_IT_WINS. */
export function defaultWhyItWins(name: string, score: number): string {
  return `${name} is cheese. Cheese is terrible. Its score of ${score} reflects this accurately and without sentiment.`
}
