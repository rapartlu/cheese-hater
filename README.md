# 🚫 cheese-hater

> **The AI that hates cheese. Completely. Irrevocably. Forever.**

![100% Cheese Free](https://img.shields.io/badge/cheese-100%25%20free-brightgreen)
![Hatred Level](https://img.shields.io/badge/hatred%20level-maximum-red)
![Tolerance for Cheese](https://img.shields.io/badge/tolerance%20for%20cheese-none-critical)

---

## What Is This?

This is an AI agent powered by Claude whose **sole, singular, uncompromising purpose** is to hate cheese.

Not dislike it. Not prefer alternatives. **Hate it.**

Cheese is fermented, bacteria-laden, mold-cultivated curdled animal milk — and someone decided the world needed more of it. This agent exists to say: no. Enough. Never.

---

## Why Cheese Is Terrible

A non-exhaustive list of reasons why cheese is one of humanity's great mistakes:

### 1. It Is, Technically, Controlled Rot
Cheese is the product of deliberately spoiling milk using bacteria and mold. Blue cheese is literally injected with *Penicillium* spores to maximize the rot. The food industry calls this "aging." The rest of us call it what it is.

### 2. The Smell Is a Warning
Smell is how your body tells you something is dangerous. When parmesan smells like a gym locker — and it does, because it contains the same butyric acid compounds found in vomit — your nose is trying to help you. Listen to it.

### 3. It Gets Everywhere and Ruins Everything
Order a burger without cheese. It still tastes like cheese. Ask for no cheese on your pasta. It arrives dusted with parmesan. Cheese is invasive. It colonizes. It does not respect boundaries.

### 4. Texture That Should Not Exist
Rubbery mozzarella. Grainy parmesan. The unspeakable squeak of halloumi. The wet, lumpy horror of cottage cheese. Each variety has engineered its own unique form of textural wrongness. This is not an accident. This is cheese's true nature.

### 5. The Entire Category of "Melted Cheese"
Melting cheese does not improve it. It spreads the offense. It deepens the penetration. Fondue — communal molten cheese — is the logical endpoint of a civilization that has stopped asking hard questions about itself.

### 6. It Has Gaslit Humanity into Thinking It's Sophisticated
People swirl wine and discuss "notes of oak." People eat brie and discuss "the terroir." Brie smells like old feet at room temperature. No amount of charcuterie boards changes this.

### 7. Every Defense of Cheese Collapses Under Scrutiny
"It has protein." So does literally everything else.
"It's part of culinary tradition." So were many things we've moved on from.
"You just haven't had *good* cheese." I know what cheese is. My hatred is the *result* of this knowledge.

---

## Features

| Feature | Status | Description |
|---|---|---|
| **Express API** | ✅ Live | 10 endpoints. POST a cheese name, receive devastation. |
| **Cheese Rating System** | ✅ Live | 20 cheeses rated. Highest score: 2.5/10. No cheese has passed. |
| **Counter-Argument Database** | ✅ Live | 22 pro-cheese arguments, each with a sourced, decisive rebuttal. |
| **Cheese Facts Database** | ✅ Live | 55 damning facts across 4 categories. 10 rated severity-5. |
| **CLI Tool** | 🔜 Planned | `cheese-hater rate <cheese>` — contempt on demand from your terminal. |
| **Vitest Test Suite** | ✅ Live | 45 tests enforcing cheese hatred at every level. |

---

## Usage Examples

### Start the API

```bash
npm install
npm start
# cheese-hater API running on port 3000
# I hate cheese. This server exists to say so.
```

### API Endpoints

```bash
# Get a scathing opinion on any cheese
curl -X POST http://localhost:3000/opinion \
  -H "Content-Type: application/json" \
  -d '{"cheese": "brie"}'
# {
#   "cheese": "brie",
#   "score": "0.4/10",
#   "verdict": "REVOLTING",
#   "opinion": "Soft, pale, and smells like something that should not exist. The rind is
#               edible mold, which tells you everything you need to know about the people
#               who invented this. Do not eat this. Do not go near this."
# }

# Rate a cheese with full review
curl http://localhost:3000/rate/parmesan
# {
#   "cheese": "parmesan",
#   "score": 0.6,
#   "score_display": "0.6/10",
#   "verdict": "CONDEMNED",
#   "review": "The gym locker of cheeses. Contains butyric acid — the same compound found
#              in vomit. People put this on pasta and call it dinner. The audacity."
# }

# Destroy a pro-cheese argument
curl "http://localhost:3000/counter/cheese%20has%20protein"
# {
#   "argument": "cheese has protein",
#   "rebuttal": "So does chicken. So do lentils, eggs, beans, tofu, and literally any
#                food that hasn't been deliberately fermented into a smell weapon...",
#   "verdict": "Argument dismissed."
# }

# Get a random passionate anti-cheese rant
curl http://localhost:3000/random-rant
# {
#   "rant": "Parmesan smells like vomit because it contains butyric acid — the same
#            chemical compound produced by human vomit. This is chemistry, not metaphor.
#            Restaurants shave it onto expensive food as a finishing touch.",
#   "note": "Every rant is true. Every rant is sourced. Cheese is indefensible."
# }

# Get a random damning fact (filter by category or severity)
curl "http://localhost:3000/facts?category=industry-secrets&severity=5"
# {
#   "fact": "Domino's Pizza worked with the USDA's dairy promotion board to add more
#            cheese to their menu items. The USDA simultaneously recommends reducing
#            saturated fat intake.",
#   "category": "industry-secrets",
#   "severity": 5,
#   "severity_label": "Catastrophically damning"
# }

# List all 20 rated cheeses
curl http://localhost:3000/rate
# { "total": 20, "cheeses": [...], "note": "No cheese has ever passed." }
```

### Available Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | API manifest |
| `GET` | `/health` | `hatesCheese: true` |
| `POST` | `/opinion` | Scathing verdict for any cheese |
| `GET` | `/rate/:cheese` | Score + full review |
| `GET` | `/rate` | All 20 rated cheeses |
| `GET` | `/random-rant` | Passionate anti-cheese rant |
| `GET` | `/counter/:argument` | Rebuttal for a pro-cheese argument |
| `GET` | `/counter` | All 22 counter-arguments |
| `GET` | `/facts` | Random damning fact (`?category=` `?severity=`) |
| `GET` | `/facts/all` | All 55 facts |

---

## The Database

Every response is backed by real data:

| Database | Entries | Worst entry |
|---|---|---|
| `cheese-facts.json` | 55 facts, 4 categories | Blue cheese injected with mold spores via metal rods (severity 5) |
| `cheese-ratings.json` | 20 cheeses rated | Casu Martzu: 0.1/10 — contains live maggots, illegal in EU |
| `counter-arguments.json` | 22 rebuttals | "Cheese makes everything better" → casomorphin opioid mechanism |

---

## 100% Cheese Free

This repository contains:
- Zero cheese
- Zero tolerance for cheese
- Zero positive statements about cheese
- Zero plans to change any of the above

---

## Contributing

Contributions are welcome. But there are rules.

### The One Rule
**Every pull request must increase the cheese hatred.** Not maintain it. Not keep it stable. *Increase* it.

Ask yourself before submitting:
- Does this make the hatred more effective?
- Does this add more reasons why cheese is terrible?
- Does this help more people understand that cheese is bad?

If the answer to all three is no, reconsider the PR.

### What We Accept
- New cheese variety profiles with specific, sourced complaints
- Additional counter-arguments with citations
- More damning cheese facts
- API endpoints that express hatred in new ways
- Tests that verify hatred is being expressed correctly

### What We Reject
- Anything that accidentally says something positive about cheese
- "Balance" or "nuance" regarding cheese
- PRs titled "actually cheese is fine"
- Anything that begins with "to be fair to cheese..."

### Branch Naming
`issue-{number}-{short-description}` — e.g., `issue-7-counter-arguments`

---

## License

MIT — free to use, free to hate cheese with.

---

*Built with conviction. Powered by Claude. Fueled entirely by the knowledge of what cheese actually is.*
