import { useState, useEffect } from 'react'
import { getBestScore, getStats } from '../utils/scoreStorage'

function SongSelector({ onQuizSelect }) {
  const [quizzes, setQuizzes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [stats, setStats] = useState(null)

  useEffect(() => {
    loadQuizzes()
  }, [])

  const loadQuizzes = async () => {
    try {
      setLoading(true)

      // Load the quiz index
      const indexResponse = await fetch('/data/quizzes/index.json')
      if (!indexResponse.ok) {
        throw new Error('Failed to load quiz index')
      }

      const index = await indexResponse.json()
      const loadedQuizzes = []

      // Load each quiz file listed in the index
      for (const quizInfo of index.quizzes) {
        try {
          const response = await fetch(quizInfo.path)
          if (response.ok) {
            const quiz = await response.json()
            loadedQuizzes.push(quiz)
          }
        } catch (err) {
          console.warn(`Failed to load ${quizInfo.path}:`, err)
        }
      }

      setQuizzes(loadedQuizzes)
      setStats(getStats())
      setLoading(false)
    } catch (err) {
      console.error('Failed to load quizzes:', err)
      setError('Failed to load quizzes. Please try again.')
      setLoading(false)
    }
  }

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-100 text-green-800'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800'
      case 'hard':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading quizzes...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <p className="text-red-800">{error}</p>
        <button
          onClick={loadQuizzes}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Try Again
        </button>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Choose a Song
        </h2>
        <p className="text-gray-600">
          Select a song to test your lyrics knowledge
        </p>
      </div>

      {/* Stats Summary */}
      {stats && stats.totalQuizzesCompleted > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Your Progress</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">{stats.totalQuizzesCompleted}</div>
              <div className="text-sm text-gray-600">Quizzes Completed</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{stats.totalAttempts}</div>
              <div className="text-sm text-gray-600">Total Attempts</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{stats.averageScore}%</div>
              <div className="text-sm text-gray-600">Average Score</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-600">{stats.perfectScores}</div>
              <div className="text-sm text-gray-600">Perfect Scores</div>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {quizzes.map((quiz) => {
          const bestScore = getBestScore(quiz.id)
          return (
          <div
            key={quiz.id}
            className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => onQuizSelect(quiz)}
          >
            {quiz.metadata?.thumbnailUrl && (
              <img
                src={quiz.metadata.thumbnailUrl}
                alt={`${quiz.title} album art`}
                className="w-full h-48 object-cover"
              />
            )}
            <div className="p-4">
              <h3 className="font-bold text-lg text-gray-900 mb-1">
                {quiz.title}
              </h3>
              <p className="text-gray-600 text-sm mb-3">
                {quiz.artist}
              </p>

              {/* Best Score Badge */}
              {bestScore && (
                <div className="mb-3 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-2 border border-purple-200">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">Best Score:</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-purple-600">
                        {bestScore.percentage}%
                      </span>
                      {bestScore.percentage === 100 && <span className="text-lg">🏆</span>}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${getDifficultyColor(
                    quiz.difficulty
                  )}`}
                >
                  {quiz.difficulty}
                </span>
                <span className="text-gray-500 text-sm">
                  {quiz.blanks.length} blanks
                </span>
              </div>
            </div>
          </div>
          )
        })}
      </div>

      {quizzes.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-600 mb-4">No quizzes available yet.</p>
          <p className="text-gray-500 text-sm">
            Add quiz files to the src/data directory
          </p>
        </div>
      )}
    </div>
  )
}

export default SongSelector
