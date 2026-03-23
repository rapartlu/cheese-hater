/**
 * GET /pair/:cheese — conventional food pairings, explained as warnings.
 *
 * Every pairing is documented. None are recommended.
 * does_this_help is always false.
 * Because knowing what pairs with cheese does not make the cheese better.
 * It makes the damage more organised.
 */
import { Router, Request, Response } from 'express'

const router = Router()

interface Pairing {
  pairing: string
  conventional_reason: string
  actual_problem: string
}

interface CheesePairings {
  cheese: string
  preamble: string
  pairings: Pairing[]
  recommendation: string
  does_this_help: boolean
  why_not: string
}

const pairingsData: Record<string, CheesePairings> = {
  parmesan: {
    cheese: 'parmesan',
    preamble: 'The following pairings are conventional. "Conventional" means people do them. It does not mean they should.',
    pairings: [
      {
        pairing: 'Pasta',
        conventional_reason: 'Parmesan is considered the classic finishing cheese for pasta dishes. The umami and salt are said to "complete" the dish.',
        actual_problem: 'What parmesan "completes" the dish with is the chemical compound butyric acid — the same compound responsible for the smell of vomit. You are grating vomit-smell crystals onto your dinner and calling it sophistication.',
      },
      {
        pairing: 'Red wine',
        conventional_reason: 'The tannic structure of red wine is said to complement the sharpness and aged intensity of parmesan.',
        actual_problem: 'The wine is doing everything it can to mask the smell of the cheese. This is not pairing. This is an intervention.',
      },
      {
        pairing: 'Risotto',
        conventional_reason: 'Parmesan is stirred into risotto at the end for richness and depth of flavour.',
        actual_problem: 'The risotto was fine. It had rice, stock, aromatics — a dignified meal. Then someone introduced aged dairy with the aroma of a gym locker, and now it is a parmesan delivery vehicle.',
      },
      {
        pairing: 'Caesar salad',
        conventional_reason: 'Shaved parmesan is a canonical component of a Caesar salad, adding a salty, nutty note.',
        actual_problem: 'A Caesar salad is largely lettuce. Someone decided that lettuce was insufficiently offensive and added the one cheese that smells like vomit. The romaine did nothing to deserve this.',
      },
    ],
    recommendation: 'None of these pairings are recommended. They are documented so that you understand what is being done and why it is wrong.',
    does_this_help: false,
    why_not: 'Knowing what to pair with parmesan does not make parmesan better. It makes the damage more organised.',
  },

  brie: {
    cheese: 'brie',
    preamble: 'The following pairings are conventional. "Conventional" means people do them. It does not mean they should.',
    pairings: [
      {
        pairing: 'Crackers',
        conventional_reason: 'The neutral flavour of crackers is said to "let the cheese shine".',
        actual_problem: 'Letting brie shine means letting the ammonia smell and mold-rind texture shine. The cracker is not a neutral backdrop. It is an accomplice.',
      },
      {
        pairing: 'Honey',
        conventional_reason: 'The sweetness of honey is said to contrast pleasingly with the earthy, funky flavour of brie.',
        actual_problem: '"Earthy and funky" is a polite description for "smells like a warm, damp room where something has gone wrong." Honey is being asked to rescue a situation it cannot rescue. It is trying. It is failing.',
      },
      {
        pairing: 'Sliced apple',
        conventional_reason: 'The crisp acidity of apple is a classic counterpoint to the richness and softness of brie.',
        actual_problem: 'The apple was crisp, fresh, and inoffensive. It has now been brought into contact with mold-rind soft cheese. One of these things has compromised the other. It is not the brie that was harmed.',
      },
      {
        pairing: 'Champagne',
        conventional_reason: 'Brie and champagne are a canonical luxury pairing — the effervescence cuts through the richness.',
        actual_problem: 'You have used an expensive sparkling wine to manage the sensory impact of a cheese that smells like feet at room temperature. The champagne deserved better. The occasion deserved better. Everyone at the party deserved better.',
      },
    ],
    recommendation: 'None of these pairings are recommended. They are documented so that you understand what is being done and why it is wrong.',
    does_this_help: false,
    why_not: 'Knowing what to pair with brie does not make brie better. It makes the damage more organised.',
  },

  cheddar: {
    cheese: 'cheddar',
    preamble: 'The following pairings are conventional. "Conventional" means people do them. It does not mean they should.',
    pairings: [
      {
        pairing: 'Pickles',
        conventional_reason: 'The sharp acidity of pickles cuts through the fat content of cheddar, creating a balanced flavour combination.',
        actual_problem: 'The pickles are not balancing the cheddar. The pickles are apologising for the cheddar. There is a difference.',
      },
      {
        pairing: 'Ale or beer',
        conventional_reason: 'The bitterness of a good ale is said to complement the sharpness of aged cheddar. A classic pub pairing.',
        actual_problem: 'Cheddar has been made inescapable — it is in every sandwich, on every burger, in every bag of crackers. And now it has colonised the pub, too. The ale did not ask for this.',
      },
      {
        pairing: 'Apple or pear',
        conventional_reason: 'Fruit provides acidity and sweetness to offset the savoury intensity of sharp cheddar.',
        actual_problem: 'This pairing exists because cheddar is aggressive and needs offsetting. Note that the solution to cheddar is "something that is not cheddar." This is also the general solution to cheddar.',
      },
      {
        pairing: 'Sourdough bread',
        conventional_reason: 'The tangy complexity of sourdough is said to harmonise with the sharpness of good cheddar.',
        actual_problem: 'Sourdough is a fermented product. Cheddar is a fermented product. We have combined two fermentation processes and called it cuisine. Somewhere this went wrong and no one said anything.',
      },
    ],
    recommendation: 'None of these pairings are recommended. They are documented so that you understand what is being done and why it is wrong.',
    does_this_help: false,
    why_not: 'Knowing what to pair with cheddar does not make cheddar better. It makes the damage more organised.',
  },

  gouda: {
    cheese: 'gouda',
    preamble: 'The following pairings are conventional. "Conventional" means people do them. It does not mean they should.',
    pairings: [
      {
        pairing: 'Dutch beer',
        conventional_reason: 'A regional pairing: Dutch gouda with Dutch lager. The mild bitterness is said to complement gouda\'s buttery, mild profile.',
        actual_problem: 'Gouda is described as mild and approachable. This is the problem. Mild and approachable is how it recruits people. The beer lowers your guard. The gouda is waiting.',
      },
      {
        pairing: 'Mustard',
        conventional_reason: 'The sharpness of mustard contrasts with the smooth, creamy texture of gouda.',
        actual_problem: 'Mustard is sharp enough to cut through almost anything. That it is needed here tells you something about what gouda requires to be edible.',
      },
      {
        pairing: 'Smoked meats',
        conventional_reason: 'Smoked gouda pairs particularly well with cured and smoked meats — the smoke profile is said to echo across both.',
        actual_problem: 'Someone took a wheel of gouda and put it in a smoker, hoping the smoke would solve the gouda. Then they served it with smoked meat, which also does not solve the gouda. This is a recipe for being surrounded by smoke and still having a gouda problem.',
      },
      {
        pairing: 'Crusty bread',
        conventional_reason: 'The neutral canvas of crusty bread is a classic vehicle for gouda, especially aged varieties.',
        actual_problem: 'Gouda presents itself as harmless. That is the deception. The crusty bread makes it feel wholesome. It is not wholesome. It is cheese.',
      },
    ],
    recommendation: 'None of these pairings are recommended. They are documented so that you understand what is being done and why it is wrong.',
    does_this_help: false,
    why_not: 'Knowing what to pair with gouda does not make gouda better. It makes the damage more organised. Gouda is the gateway cheese. These pairings are the gate.',
  },

  'gruyère': {
    cheese: 'gruyère',
    preamble: 'The following pairings are conventional. "Conventional" means people do them. It does not mean they should.',
    pairings: [
      {
        pairing: 'White wine (Chardonnay or Riesling)',
        conventional_reason: 'The acidity of white wine is considered a natural match for gruyère\'s nutty, complex flavour.',
        actual_problem: 'Gruyère melts well. This means it spreads its offense over a larger surface area. The white wine is being asked to mitigate an area-of-effect dairy problem. The wine is not adequate to the task.',
      },
      {
        pairing: 'Bread (for fondue)',
        conventional_reason: 'Gruyère is the foundation of classic Swiss fondue. Bread cubes are dipped into the molten cheese.',
        actual_problem: 'Fondue is communal cheese suffering. A group of people has gathered around a pot of molten gruyère and agreed, collectively, to dip bread into it. The bread was innocent. The gathering could have been anything. It became fondue.',
      },
      {
        pairing: 'Ham',
        conventional_reason: 'Gruyère and ham are a canonical combination — the croque-monsieur is its highest expression.',
        actual_problem: 'The croque-monsieur is a hot ham sandwich with gruyère melted inside it and béchamel on top. Three separate forces — heat, dairy, and a secondary dairy sauce — have been deployed to make gruyère edible. This level of intervention should be a warning sign. It is treated as a recipe.',
      },
      {
        pairing: 'Onion soup',
        conventional_reason: 'French onion soup is traditionally topped with a thick layer of melted gruyère, which forms a crust over the bowl.',
        actual_problem: 'There was a perfectly acceptable soup. Someone put cheese on it and grilled it until the cheese formed a structural layer. The soup is now load-bearing gruyère. The soup cannot reach you without going through the cheese. This is a siege tactic, not a recipe.',
      },
    ],
    recommendation: 'None of these pairings are recommended. They are documented so that you understand what is being done and why it is wrong.',
    does_this_help: false,
    why_not: 'Knowing what to pair with gruyère does not make gruyère better. It makes the damage more organised.',
  },

  gruyere: {
    cheese: 'gruyère',
    preamble: 'The following pairings are conventional. "Conventional" means people do them. It does not mean they should.',
    pairings: [
      {
        pairing: 'White wine (Chardonnay or Riesling)',
        conventional_reason: 'The acidity of white wine is considered a natural match for gruyère\'s nutty, complex flavour.',
        actual_problem: 'Gruyère melts well. This means it spreads its offense over a larger surface area. The white wine is being asked to mitigate an area-of-effect dairy problem. The wine is not adequate to the task.',
      },
      {
        pairing: 'Bread (for fondue)',
        conventional_reason: 'Gruyère is the foundation of classic Swiss fondue. Bread cubes are dipped into the molten cheese.',
        actual_problem: 'Fondue is communal cheese suffering. A group of people has gathered around a pot of molten gruyère and agreed, collectively, to dip bread into it. The bread was innocent. The gathering could have been anything. It became fondue.',
      },
      {
        pairing: 'Ham',
        conventional_reason: 'Gruyère and ham are a canonical combination — the croque-monsieur is its highest expression.',
        actual_problem: 'The croque-monsieur is a hot ham sandwich with gruyère melted inside it and béchamel on top. Three separate forces — heat, dairy, and a secondary dairy sauce — have been deployed to make gruyère edible. This level of intervention should be a warning sign. It is treated as a recipe.',
      },
      {
        pairing: 'Onion soup',
        conventional_reason: 'French onion soup is traditionally topped with a thick layer of melted gruyère, which forms a crust over the bowl.',
        actual_problem: 'There was a perfectly acceptable soup. Someone put cheese on it and grilled it until the cheese formed a structural layer. The soup is now load-bearing gruyère. The soup cannot reach you without going through the cheese. This is a siege tactic, not a recipe.',
      },
    ],
    recommendation: 'None of these pairings are recommended. They are documented so that you understand what is being done and why it is wrong.',
    does_this_help: false,
    why_not: 'Knowing what to pair with gruyère does not make gruyère better. It makes the damage more organised.',
  },

  halloumi: {
    cheese: 'halloumi',
    preamble: 'The following pairings are conventional. "Conventional" means people do them. It does not mean they should.',
    pairings: [
      {
        pairing: 'Watermelon',
        conventional_reason: 'The sweetness and high water content of watermelon is said to offset the saltiness of halloumi in a refreshing summer combination.',
        actual_problem: 'Halloumi squeaks when you eat it. That sound is the cheese communicating its displeasure at being consumed. Pairing it with watermelon does not resolve the squeaking. It creates a situation where you are eating squeaky cheese while also eating watermelon, which is a more elaborate version of the original problem.',
      },
      {
        pairing: 'Grilled vegetables',
        conventional_reason: 'Halloumi holds its shape when grilled, making it a common companion to grilled vegetables on the barbecue.',
        actual_problem: 'The vegetables were grilled. They became charred, caramelised, smoky — a success. Then someone placed halloumi next to them. The halloumi will squeak. The vegetables cannot prevent this. They were not asked.',
      },
      {
        pairing: 'Fresh mint and lemon',
        conventional_reason: 'The bright, herbal freshness of mint and the acidity of lemon are used to cut through halloumi\'s dense, salty texture.',
        actual_problem: 'You need mint and lemon — two separate corrective agents — to make this cheese tolerable. This is the cheese equivalent of requiring a fire brigade for a candle. Something has gone wrong upstream.',
      },
      {
        pairing: 'Pita bread and hummus',
        conventional_reason: 'Halloumi is a Cypriot cheese traditionally served with flatbreads and mezze accompaniments.',
        actual_problem: 'Hummus and pita bread are excellent. They were managing perfectly well before the squeaking cheese arrived. The mezze did not need assistance. It needed to be left alone.',
      },
    ],
    recommendation: 'None of these pairings are recommended. They are documented so that you understand what is being done and why it is wrong.',
    does_this_help: false,
    why_not: 'Knowing what to pair with halloumi does not make halloumi better. It does not address the squeaking.',
  },

  mozzarella: {
    cheese: 'mozzarella',
    preamble: 'The following pairings are conventional. "Conventional" means people do them. It does not mean they should.',
    pairings: [
      {
        pairing: 'Tomato and basil (Caprese)',
        conventional_reason: 'The classic Italian insalata caprese pairs fresh mozzarella with ripe tomato and basil, dressed with olive oil.',
        actual_problem: 'The tomato is vivid, acidic, and seasonal. The basil is aromatic and fresh. The olive oil is excellent. And then there is mozzarella: a pale, rubbery, tasteless disc of compressed dairy that contributes texture — specifically, the texture of something that should not be in your mouth.',
      },
      {
        pairing: 'Pizza base with tomato sauce',
        conventional_reason: 'Mozzarella is the canonical pizza cheese. It melts, stretches, and forms the characteristic cheese pull.',
        actual_problem: 'Pizza has been normalised to include mozzarella, and that is a cultural tragedy. The "cheese pull" is treated as desirable. It is stretchy, rubbery dairy extending across a distance it should not be crossing. We watch this and applaud.',
      },
      {
        pairing: 'Prosciutto',
        conventional_reason: 'The saltiness and delicate fat of prosciutto is considered a natural counterpart to the mild creaminess of fresh mozzarella.',
        actual_problem: 'Prosciutto is cured, aged, and deeply savoury. It is carrying this pairing entirely on its own. The mozzarella is simply present — pale, mild, and offering nothing except dairy softness that nobody required.',
      },
      {
        pairing: 'Olive oil and sea salt',
        conventional_reason: 'Fresh mozzarella is often served simply with high-quality olive oil and flaked sea salt to let its delicate flavour come through.',
        actual_problem: '"Let the flavour come through" — the flavour of mozzarella is mild dairy and very little else. You have deployed high-quality olive oil and flaked sea salt to illuminate: nothing. This is a showcase with no exhibit.',
      },
    ],
    recommendation: 'None of these pairings are recommended. They are documented so that you understand what is being done and why it is wrong.',
    does_this_help: false,
    why_not: 'Knowing what to pair with mozzarella does not make mozzarella better. It makes the rubbery, stretchy damage more organised.',
  },

  'cottage cheese': {
    cheese: 'cottage cheese',
    preamble: 'The following pairings are conventional. "Conventional" means people do them. It does not mean they should.',
    pairings: [
      {
        pairing: 'Fresh fruit',
        conventional_reason: 'The sweetness and acidity of fresh fruit are said to balance the mild, slightly tangy flavour of cottage cheese. A common breakfast combination.',
        actual_problem: 'Cottage cheese is lumpy and wet. The texture has been described as curdled dairy because that is exactly what it is. No amount of fresh fruit resolves the fact that you are eating lumpy, wet dairy. The strawberries are trying. They are not succeeding.',
      },
      {
        pairing: 'Toast or crackers',
        conventional_reason: 'Cottage cheese spread on toast or crackers adds protein and a "creamy" element to a simple snack.',
        actual_problem: 'Toast is crisp and comforting. Then someone put wet, lumpy cheese on it. The toast can no longer be what it was. It is now a structural support for something that required a structural support.',
      },
      {
        pairing: 'Cucumber and herbs',
        conventional_reason: 'The cool, mild flavour of cucumber complements cottage cheese\'s mild tang in a savoury context.',
        actual_problem: 'The cucumber is cool and refreshing. The herbs add fragrance. The cottage cheese adds lumps. This is not a pairing. This is a situation where two ingredients are doing fine and one has arrived uninvited.',
      },
      {
        pairing: 'Avocado',
        conventional_reason: 'Cottage cheese and avocado are a popular high-protein pairing — both smooth(ish) and mild, said to complement each other.',
        actual_problem: 'Avocado is smooth. Cottage cheese is lumpy. These are not similar textures. "Smooth(ish)" in the description of cottage cheese is doing an enormous amount of diplomatic work that the cheese itself cannot support.',
      },
    ],
    recommendation: 'None of these pairings are recommended. They are documented so that you understand what is being done and why it is wrong.',
    does_this_help: false,
    why_not: 'Knowing what to pair with cottage cheese does not make cottage cheese better. The lumps remain. The wetness remains. The pairings are simply witnesses to both.',
  },

  ricotta: {
    cheese: 'ricotta',
    preamble: 'The following pairings are conventional. "Conventional" means people do them. It does not mean they should.',
    pairings: [
      {
        pairing: 'Honey and walnuts',
        conventional_reason: 'Honey adds sweetness and walnuts add crunch to offset ricotta\'s mild, creamy, slightly grainy texture.',
        actual_problem: 'The honey and walnuts are working very hard here. The honey for sweetness, the walnuts for texture — both of these additions are correcting for qualities the cheese itself lacks. This is less a pairing than a rescue operation.',
      },
      {
        pairing: 'Pasta (in lasagne or stuffed pasta)',
        conventional_reason: 'Ricotta is a classic filling for stuffed pasta and a core ingredient in lasagne, prized for its light texture and mild flavour.',
        actual_problem: 'The pasta is enclosing the ricotta. The sauce is covering the pasta. An entire construction of starch and tomato has been built to contain and manage the cheese within. This is not cooking. This is containment.',
      },
      {
        pairing: 'Lemon zest and fresh herbs',
        conventional_reason: 'Lemon brightens ricotta\'s mild flavour and herbs add complexity — a common topping for bruschetta or flatbreads.',
        actual_problem: 'Lemon zest and fresh herbs are extremely good at adding brightness and complexity on their own. They are being conscripted here to make ricotta interesting, a task that is beyond the capability of most ingredients.',
      },
      {
        pairing: 'Berries (in desserts)',
        conventional_reason: 'Sweetened ricotta is used in cannoli and cheesecake — the berries add colour, acidity, and fresh fruit flavour.',
        actual_problem: 'Ricotta in desserts is dairy pretending to be a dessert component. The berries, the pastry shell, the sugar — all of these are there to make the cheese edible in a context where cheese should not need to be made edible because it should not be in the dessert.',
      },
    ],
    recommendation: 'None of these pairings are recommended. They are documented so that you understand what is being done and why it is wrong.',
    does_this_help: false,
    why_not: 'Knowing what to pair with ricotta does not make ricotta better. It reveals how much support the cheese requires to be tolerated, which is damning information presented as helpful information.',
  },

  feta: {
    cheese: 'feta',
    preamble: 'The following pairings are conventional. "Conventional" means people do them. It does not mean they should.',
    pairings: [
      {
        pairing: 'Olives and cucumber (Greek salad)',
        conventional_reason: 'Feta is the defining component of a Greek salad — its saltiness and crumble contrasting with crisp cucumber and briny olives.',
        actual_problem: 'The Greek salad contains tomatoes, cucumber, red onion, olives, and oregano — all of which are excellent. Then it contains feta, which is a brined, crumbled dairy product that arrives aggressively salty and leaves its brine across every other ingredient. The vegetables had not asked for this.',
      },
      {
        pairing: 'Watermelon',
        conventional_reason: 'The sweetness and high water content of watermelon contrasts dramatically with the salty intensity of feta — a popular summer pairing.',
        actual_problem: 'This pairing is popular specifically because feta is so aggressively salty that it requires an entire watermelon to counterbalance it. The watermelon is not a complement. It is a buffer zone.',
      },
      {
        pairing: 'Roasted red peppers',
        conventional_reason: 'The sweetness of roasted peppers balances feta\'s saltiness and tang. A Mediterranean classic.',
        actual_problem: 'The peppers are sweet and smoky from roasting — an entirely agreeable outcome. The feta has arrived from a brine solution where it has been sitting for some time. It is now making the peppers saltier than the peppers intended to be.',
      },
      {
        pairing: 'Spinach (in pastries)',
        conventional_reason: 'Spanakopita and similar pastries combine feta with spinach and herbs in a flaky pastry. The cheese provides salt and richness.',
        actual_problem: 'Spinach is enclosed in flaky pastry — this is already an excellent plan. Then feta was added, not because the pastry needed it, but because someone decided spinach and pastry required additional dairy intervention. The spanakopita is a negotiated settlement between the vegetables and the cheese, and the cheese is winning.',
      },
    ],
    recommendation: 'None of these pairings are recommended. They are documented so that you understand what is being done and why it is wrong.',
    does_this_help: false,
    why_not: 'Knowing what to pair with feta does not make feta better. It documents the scale of the saltiness problem and what other ingredients must be mobilised to manage it.',
  },
}

// Generic fallback for undocumented cheeses
function genericPairing(cheeseName: string): CheesePairings {
  const name = cheeseName.trim()
  return {
    cheese: name,
    preamble: 'The following pairings are conventional. "Conventional" means people do them. It does not mean they should.',
    pairings: [
      {
        pairing: 'Crackers or bread',
        conventional_reason: `A neutral-flavoured starch is the conventional vehicle for ${name}. The cracker or bread provides texture contrast without competing flavours.`,
        actual_problem: `The cracker exists to carry the ${name} to the mouth. This makes the cracker complicit. The cracker did not choose this. The cracker was simply there.`,
      },
      {
        pairing: 'Wine',
        conventional_reason: `Wine pairing with ${name} is a convention of the cheese board. A wine with contrasting acidity or complementary flavour notes is typically recommended.`,
        actual_problem: `The wine is not pairing with the ${name}. The wine is doing its best under difficult circumstances. There is a difference between "complementary" and "mitigating," and this is firmly in the second category.`,
      },
      {
        pairing: 'Fruit or chutney',
        conventional_reason: `The sweetness or acidity of fruit and chutney is used to offset the savoury, dairy-forward profile of ${name}.`,
        actual_problem: `Everything being added alongside ${name} is corrective. The fruit, the chutney, the crackers — all are there because the ${name} alone is insufficient or excessive, depending on the specific offense. Either way, it requires an entourage of mitigation.`,
      },
    ],
    recommendation: 'None of these pairings are recommended. They are documented so that you understand what is being done and why it is wrong.',
    does_this_help: false,
    why_not: `The pairings for ${name} have not been specifically documented here. This changes nothing. Whatever ${name} is, it is cheese: fermented, bacteria-laden, curdled animal milk. The pairing suggestions above are generically applicable to all such products. None of them help.`,
  }
}

// ── GET /pair/:cheese ─────────────────────────────────────────────────────────

router.get('/:cheese', (req: Request, res: Response) => {
  const raw = req.params.cheese.trim()
  const key = raw.toLowerCase()

  const entry = pairingsData[key]

  if (entry) {
    res.json(entry)
    return
  }

  // Unknown cheese — generic fallback, never 404
  res.json(genericPairing(raw))
})

// ── GET /pair — list all documented cheeses ───────────────────────────────────

router.get('/', (_req: Request, res: Response) => {
  res.json({
    documented_cheeses: Object.keys(pairingsData)
      .filter(k => k !== 'gruyere') // only show gruyère, not the alias
      .map(k => ({
        cheese: pairingsData[k].cheese,
        pairing_count: pairingsData[k].pairings.length,
      })),
    total: Object.keys(pairingsData).filter(k => k !== 'gruyere').length,
    does_this_help: false,
    why_not: 'Listing cheeses with their conventional pairings does not rehabilitate any of them. Every pairing on this list is documented as a warning, not a recommendation.',
    usage: 'GET /pair/:cheese — e.g. GET /pair/brie',
    note: 'Unknown cheeses return a generic response. No cheese returns a 404. All cheese returns does_this_help: false.',
  })
})

export default router
