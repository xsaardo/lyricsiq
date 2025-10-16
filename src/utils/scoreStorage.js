/**
 * Utility functions for storing and retrieving quiz scores from localStorage
 */

const STORAGE_KEY = 'lyricsiq_scores'

/**
 * Get all stored scores
 * @returns {Object} Object mapping quiz IDs to score data
 */
export function getAllScores() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : {}
  } catch (error) {
    console.error('Error reading scores from localStorage:', error)
    return {}
  }
}

/**
 * Get scores for a specific quiz
 * @param {number} quizId - The quiz ID
 * @returns {Array} Array of score objects for this quiz
 */
export function getQuizScores(quizId) {
  const allScores = getAllScores()
  return allScores[quizId] || []
}

/**
 * Get the best score for a specific quiz
 * @param {number} quizId - The quiz ID
 * @returns {Object|null} Best score object or null if no scores exist
 */
export function getBestScore(quizId) {
  const scores = getQuizScores(quizId)
  if (scores.length === 0) return null

  // Sort by percentage (primary) and wordAccuracy (secondary)
  return scores.reduce((best, current) => {
    if (current.percentage > best.percentage) return current
    if (current.percentage === best.percentage && current.wordAccuracy > best.wordAccuracy) return current
    return best
  })
}

/**
 * Save a new score for a quiz
 * @param {number} quizId - The quiz ID
 * @param {string} quizTitle - The quiz title
 * @param {string} artist - The artist name
 * @param {Object} scoreData - The score data object
 */
export function saveScore(quizId, quizTitle, artist, scoreData) {
  try {
    const allScores = getAllScores()

    // Initialize array for this quiz if it doesn't exist
    if (!allScores[quizId]) {
      allScores[quizId] = []
    }

    // Add the new score with timestamp
    const scoreEntry = {
      ...scoreData,
      quizId,
      quizTitle,
      artist,
      timestamp: new Date().toISOString(),
      date: new Date().toLocaleDateString()
    }

    allScores[quizId].push(scoreEntry)

    // Keep only the last 10 scores per quiz to avoid excessive storage
    if (allScores[quizId].length > 10) {
      allScores[quizId] = allScores[quizId].slice(-10)
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(allScores))
    return true
  } catch (error) {
    console.error('Error saving score to localStorage:', error)
    return false
  }
}

/**
 * Get completion statistics
 * @returns {Object} Object with stats like total completed, average score, etc.
 */
export function getStats() {
  const allScores = getAllScores()
  const quizIds = Object.keys(allScores)

  if (quizIds.length === 0) {
    return {
      totalQuizzesCompleted: 0,
      totalAttempts: 0,
      averageScore: 0,
      perfectScores: 0
    }
  }

  let totalAttempts = 0
  let totalScore = 0
  let perfectScores = 0

  quizIds.forEach(quizId => {
    const scores = allScores[quizId]
    totalAttempts += scores.length
    scores.forEach(score => {
      totalScore += score.percentage
      if (score.percentage === 100) perfectScores++
    })
  })

  return {
    totalQuizzesCompleted: quizIds.length,
    totalAttempts,
    averageScore: Math.round(totalScore / totalAttempts),
    perfectScores
  }
}

/**
 * Clear all scores (useful for testing or reset)
 */
export function clearAllScores() {
  try {
    localStorage.removeItem(STORAGE_KEY)
    return true
  } catch (error) {
    console.error('Error clearing scores:', error)
    return false
  }
}
