/**
 * Normalize text for comparison by replacing various Unicode variations
 * of apostrophes and dashes with standard versions
 */
export function normalizeText(text) {
  if (!text) return ''

  return text
    .trim()
    .toLowerCase()
    // Normalize various apostrophes to standard apostrophe
    // Includes: ' (right single quotation mark), ʼ (modifier letter apostrophe), ´ (acute accent)
    .replace(/[\u2019\u02BC\u00B4]/g, "'")
    // Normalize various dashes to standard hyphen
    // Includes: – (en dash), — (em dash), − (minus sign)
    .replace(/[\u2013\u2014\u2212]/g, '-')
}

/**
 * Compare two text strings for equality after normalization
 */
export function compareAnswers(userAnswer, correctAnswer) {
  return normalizeText(userAnswer) === normalizeText(correctAnswer)
}
