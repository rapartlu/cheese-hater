/**
 * Format a cheese rating as a shareable text card.
 * @param {object} cheese - A cheese entry from cheese-ratings.json
 * @returns {string}
 */
export function formatRatingCard(cheese) {
  const bar = scoreBar(cheese.aggregate)
  return [
    `╔${'═'.repeat(50)}╗`,
    `║ ${pad(cheese.shareable_card.title, 48)} ║`,
    `╠${'═'.repeat(50)}╣`,
    `║ ${pad(`SCORE: ${cheese.aggregate.toFixed(2)} / 10   ${bar}`, 48)} ║`,
    `║ ${pad(`VERDICT: ${cheese.verdict}`, 48)} ║`,
    `╠${'═'.repeat(50)}╣`,
    `║ ${pad('DIMENSIONS', 48)} ║`,
    `║ ${pad(`  Smell:            ${scoreBar(cheese.scores.smell, 10)} ${cheese.scores.smell.toFixed(1)}`, 48)} ║`,
    `║ ${pad(`  Texture:          ${scoreBar(cheese.scores.texture, 10)} ${cheese.scores.texture.toFixed(1)}`, 48)} ║`,
    `║ ${pad(`  Taste:            ${scoreBar(cheese.scores.taste, 10)} ${cheese.scores.taste.toFixed(1)}`, 48)} ║`,
    `║ ${pad(`  Cultural damage:  ${scoreBar(cheese.scores.cultural_damage, 10)} ${cheese.scores.cultural_damage.toFixed(1)}`, 48)} ║`,
    `╠${'═'.repeat(50)}╣`,
    ...wrapText(cheese.shareable_card.one_liner, 48).map(line => `║ ${pad(line, 48)} ║`),
    `╚${'═'.repeat(50)}╝`,
  ].join('\n')
}

/**
 * Format a compact one-line summary.
 * @param {object} cheese
 * @returns {string}
 */
export function formatOneLiner(cheese) {
  return `${cheese.name.toUpperCase().padEnd(20)} ${cheese.aggregate.toFixed(2)}/10  [${cheese.verdict}]`
}

function scoreBar(score, max = 10) {
  const filled = Math.round((score / max) * 8)
  return '[' + '█'.repeat(filled) + '░'.repeat(8 - filled) + ']'
}

function pad(str, len) {
  if (str.length >= len) return str.slice(0, len)
  return str + ' '.repeat(len - str.length)
}

function wrapText(text, width) {
  const words = text.split(' ')
  const lines = []
  let current = ''
  for (const word of words) {
    if ((current + ' ' + word).trim().length <= width) {
      current = (current + ' ' + word).trim()
    } else {
      if (current) lines.push(current)
      current = word
    }
  }
  if (current) lines.push(current)
  return lines
}
