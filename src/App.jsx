import { useState, useEffect } from 'react'
import SongSelector from './components/SongSelector'
import QuizView from './components/QuizView'
import Results from './components/Results'
import { decodeQuizState, encodeQuizState } from './utils/urlState'
import { saveScore } from './utils/scoreStorage'
import { compareAnswers } from './utils/textNormalize'

function App() {
  const [view, setView] = useState('selector') // 'selector', 'quiz', 'results'
  const [selectedQuiz, setSelectedQuiz] = useState(null)
  const [userAnswers, setUserAnswers] = useState({})
  const [score, setScore] = useState(null)
  const [challengeData, setChallengeData] = useState(null)

  // Check URL for shared quiz on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const sharedState = urlParams.get('quiz')

    if (sharedState) {
      try {
        const decodedState = decodeQuizState(sharedState)
        setChallengeData(decodedState)

        // Load the actual quiz data based on the quiz ID
        loadSharedQuiz(decodedState)
      } catch (error) {
        console.error('Failed to decode shared quiz:', error)
      }
    }
  }, [])

  const loadSharedQuiz = async (challengeData) => {
    try {
      // Load the quiz index
      const indexResponse = await fetch('/data/quizzes/index.json')
      if (!indexResponse.ok) {
        throw new Error('Failed to load quiz index')
      }

      const index = await indexResponse.json()

      // Find the quiz with matching ID
      const quizInfo = index.quizzes.find(q => q.id === challengeData.quizId)

      if (!quizInfo) {
        console.error('Could not find quiz with ID:', challengeData.quizId)
        alert('Could not load the shared quiz. Please select a quiz from the list.')
        return
      }

      // Load the quiz
      const response = await fetch(quizInfo.path)
      if (response.ok) {
        const quiz = await response.json()
        setSelectedQuiz(quiz)
        setView('quiz')
      } else {
        throw new Error(`Failed to load quiz from ${quizInfo.path}`)
      }
    } catch (error) {
      console.error('Failed to load shared quiz:', error)
      alert('Could not load the shared quiz. Please select a quiz from the list.')
    }
  }

  const handleQuizSelect = (quiz) => {
    setSelectedQuiz(quiz)
    setUserAnswers({})
    setScore(null)
    setView('quiz')

    // Scroll to top of page
    window.scrollTo(0, 0)
  }

  const handleQuizSubmit = (answers) => {
    setUserAnswers(answers)

    // Calculate score - exact matches with normalized text
    const correctAnswers = selectedQuiz.blanks.filter((blank) => {
      const userAnswer = answers[blank.id] || ''
      const correctAnswer = blank.answer || ''
      return compareAnswers(userAnswer, correctAnswer)
    })

    const scoreData = {
      correct: correctAnswers.length,
      total: selectedQuiz.blanks.length,
      percentage: Math.round((correctAnswers.length / selectedQuiz.blanks.length) * 100),
      answers: answers
    }

    // Save score to localStorage
    saveScore(selectedQuiz.id, selectedQuiz.title, selectedQuiz.artist, scoreData)

    setScore(scoreData)
    setView('results')

    // Scroll to top of page
    window.scrollTo(0, 0)
  }

  const handleTryAgain = () => {
    setUserAnswers({})
    setScore(null)
    setView('quiz')

    // Scroll to top of page
    window.scrollTo(0, 0)
  }

  const handleNewQuiz = () => {
    setSelectedQuiz(null)
    setUserAnswers({})
    setScore(null)
    setChallengeData(null)
    setView('selector')

    // Clear URL params
    window.history.replaceState({}, '', window.location.pathname)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <h1
            className="text-3xl font-bold text-gray-900 cursor-pointer hover:text-purple-600 transition-colors"
            onClick={handleNewQuiz}
          >
            LyricsIQ
          </h1>
          <p className="text-gray-600 text-sm mt-1">
            Test your knowledge of song lyrics
          </p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {view === 'selector' && (
          <SongSelector onQuizSelect={handleQuizSelect} />
        )}

        {view === 'quiz' && selectedQuiz && (
          <QuizView
            quiz={selectedQuiz}
            initialAnswers={userAnswers}
            onSubmit={handleQuizSubmit}
            onBack={handleNewQuiz}
            challengeScore={challengeData?.score}
          />
        )}

        {view === 'results' && selectedQuiz && score && (
          <Results
            quiz={selectedQuiz}
            score={score}
            userAnswers={userAnswers}
            onTryAgain={handleTryAgain}
            onNewQuiz={handleNewQuiz}
            challengeScore={challengeData?.score}
          />
        )}
      </main>

      <footer className="mt-16 py-8 text-center text-gray-500 text-sm">
        <p>LyricsIQ - Built with React</p>
      </footer>
    </div>
  )
}

export default App
