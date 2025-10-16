/**
 * Encode quiz state to URL-safe string
 */
export function encodeQuizState(quiz, score) {
  const state = {
    quizId: quiz.id,
    title: quiz.title,
    artist: quiz.artist,
    difficulty: quiz.difficulty,
    score: score ? {
      correct: score.correct,
      total: score.total,
      percentage: score.percentage
    } : null
  }

  const json = JSON.stringify(state)
  return btoa(json)
}

/**
 * Decode quiz state from URL parameter
 */
export function decodeQuizState(encoded) {
  try {
    const json = atob(encoded)
    return JSON.parse(json)
  } catch (error) {
    throw new Error('Invalid quiz state')
  }
}

/**
 * Generate shareable URL for a quiz
 */
export function generateShareUrl(quiz, score) {
  const baseUrl = window.location.origin + window.location.pathname
  const encoded = encodeQuizState(quiz, score)
  return `${baseUrl}?quiz=${encoded}`
}
