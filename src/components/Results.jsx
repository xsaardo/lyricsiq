import { useState } from 'react'
import { generateShareUrl } from '../utils/urlState'

function Results({ quiz, score, userAnswers, onTryAgain, onNewQuiz, challengeScore }) {
  const [copied, setCopied] = useState(false)

  const getScoreMessage = () => {
    const percentage = score.percentage

    if (percentage === 100) {
      return { text: 'Perfect Score!', emoji: '🎉', color: 'text-green-600' }
    } else if (percentage >= 80) {
      return { text: 'Excellent!', emoji: '🌟', color: 'text-green-600' }
    } else if (percentage >= 60) {
      return { text: 'Good Job!', emoji: '👍', color: 'text-blue-600' }
    } else if (percentage >= 40) {
      return { text: 'Not Bad!', emoji: '😊', color: 'text-yellow-600' }
    } else {
      return { text: 'Keep Practicing!', emoji: '💪', color: 'text-orange-600' }
    }
  }

  const handleShare = async () => {
    const shareUrl = generateShareUrl(quiz, score)

    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy to clipboard:', error)
      alert('Failed to copy link. Please copy manually: ' + shareUrl)
    }
  }

  const message = getScoreMessage()

  // Check if beat challenge
  const beatChallenge = challengeScore && score.percentage > challengeScore.percentage

  // Render lyrics with user's answers filled in
  const renderLyricsWithAnswers = () => {
    const lines = quiz.lyrics.split('\n')

    return lines.map((line, lineIndex) => {
      const blankPattern = /_____(\d+)_____/g
      const parts = []
      let lastIndex = 0
      let match

      while ((match = blankPattern.exec(line)) !== null) {
        const blankId = parseInt(match[1])
        const blank = quiz.blanks.find((b) => b.id === blankId)
        const userAnswer = userAnswers[blankId]?.trim() || '(blank)'
        const isCorrect = userAnswer.toLowerCase() === blank.answer.toLowerCase()

        // Add text before blank
        if (match.index > lastIndex) {
          parts.push(
            <span key={`text-${lineIndex}-${lastIndex}`}>
              {line.substring(lastIndex, match.index)}
            </span>
          )
        }

        // Add user's answer with correct answer shown if wrong
        if (isCorrect) {
          parts.push(
            <span
              key={`blank-${blankId}`}
              className="font-bold px-1 rounded text-green-700 bg-green-100"
            >
              {userAnswer}
            </span>
          )
        } else {
          parts.push(
            <span key={`blank-${blankId}`} className="inline-flex flex-col items-start">
              <span className="font-bold px-1 rounded text-red-700 bg-red-100 line-through">
                {userAnswer}
              </span>
              <span className="font-bold px-1 rounded text-green-700 bg-green-50 text-xs mt-0.5">
                ✓ {blank.answer}
              </span>
            </span>
          )
        }

        lastIndex = match.index + match[0].length
      }

      // Add remaining text
      if (lastIndex < line.length) {
        parts.push(
          <span key={`text-${lineIndex}-${lastIndex}`}>
            {line.substring(lastIndex)}
          </span>
        )
      }

      // Return the line
      if (parts.length === 0) {
        return (
          <div key={`line-${lineIndex}`} className="min-h-[1.5rem]">
            {line || '\u00A0'}
          </div>
        )
      }

      return (
        <div key={`line-${lineIndex}`} className="min-h-[1.5rem]">
          {parts}
        </div>
      )
    })
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-8 text-center">
          <div className="text-6xl mb-4">{message.emoji}</div>
          <h2 className="text-3xl font-bold mb-2">{message.text}</h2>
          <p className="text-purple-200 mb-6">
            {quiz.title} by {quiz.artist}
          </p>

          {/* Score */}
          <div className="bg-white bg-opacity-20 rounded-lg p-6 inline-block">
            <div className="text-5xl font-bold mb-2 text-gray-900">
              {score.percentage}%
            </div>
            <div className="text-base text-gray-900">
              {score.correct} / {score.total} blanks correct
            </div>
          </div>

          {/* Challenge result */}
          {challengeScore && (
            <div className="mt-4 bg-white bg-opacity-20 rounded-lg p-4 border border-white border-opacity-30">
              {beatChallenge ? (
                <p className="text-lg font-medium text-gray-900">
                  You beat the challenge! 🏆
                </p>
              ) : (
                <p className="text-lg font-medium text-gray-900">
                  Challenge not beaten. Try again!
                </p>
              )}
            </div>
          )}
        </div>

        {/* Full Lyrics with Answers */}
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-xl font-bold mb-4 text-gray-900">Your Completed Lyrics</h3>
          <div className="bg-gray-50 rounded-lg p-6 font-mono text-sm md:text-base leading-relaxed whitespace-pre-wrap">
            {renderLyricsWithAnswers()}
          </div>
          <div className="mt-4 flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <span className="inline-block w-4 h-4 bg-green-100 border border-green-300 rounded"></span>
              <span className="text-gray-600">Correct answer</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block w-4 h-4 bg-red-100 border border-red-300 rounded"></span>
              <span className="text-gray-600">Your incorrect answer (correct shown below)</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-gray-50 px-6 py-4 space-y-3">
          <button
            onClick={handleShare}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            {copied ? 'Link Copied! ✓' : 'Share & Challenge a Friend'}
          </button>
          <div className="flex gap-3">
            <button
              onClick={onTryAgain}
              className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={onNewQuiz}
              className="flex-1 px-6 py-3 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors"
            >
              New Quiz
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Results
