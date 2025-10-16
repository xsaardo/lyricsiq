import { useState, useRef, useEffect } from 'react'

function QuizView({ quiz, initialAnswers, onSubmit, onBack, challengeScore }) {
  const [answers, setAnswers] = useState(initialAnswers || {})
  const inputRefs = useRef({})

  // Parse lyrics and replace blanks with input fields
  const renderLyrics = () => {
    const lines = quiz.lyrics.split('\n')

    return lines.map((line, lineIndex) => {
      // Check if line contains blanks
      const blankPattern = /_____(\d+)_____/g
      const parts = []
      let lastIndex = 0
      let match

      while ((match = blankPattern.exec(line)) !== null) {
        const blankId = parseInt(match[1])
        const blank = quiz.blanks.find((b) => b.id === blankId)

        // Add text before blank
        if (match.index > lastIndex) {
          parts.push(
            <span key={`text-${lineIndex}-${lastIndex}`}>
              {line.substring(lastIndex, match.index)}
            </span>
          )
        }

        // Add input field for blank
        const currentAnswer = answers[blankId] || ''
        // Calculate size based on content, with a minimum
        const inputSize = Math.max(
          currentAnswer.length || 4,
          blank.answer.length,
          4
        )

        parts.push(
          <input
            key={`blank-${blankId}`}
            ref={(el) => (inputRefs.current[blankId] = el)}
            type="text"
            value={currentAnswer}
            onChange={(e) => handleAnswerChange(blankId, e.target.value)}
            onKeyDown={(e) => handleKeyDown(e, blankId)}
            placeholder="..."
            size={inputSize}
            className="mx-1 px-2 py-1 border-none outline-none bg-transparent text-center placeholder-gray-400"
            style={{
              border: 'none',
              borderBottom: '2px solid rgb(192, 132, 252)',
              outline: 'none',
              textDecoration: 'none'
            }}
          />
        )

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
        // Line without blanks
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

  const handleAnswerChange = (blankId, value) => {
    setAnswers((prev) => ({
      ...prev,
      [blankId]: value
    }))
  }

  const handleKeyDown = (e, currentBlankId) => {
    // Move to next input on Enter or Tab
    if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault()
      const nextBlankId = currentBlankId + 1
      if (inputRefs.current[nextBlankId]) {
        inputRefs.current[nextBlankId].focus()
      }
    }
  }

  const handleSubmit = () => {
    if (Object.keys(answers).length < quiz.blanks.length) {
      const confirm = window.confirm(
        'You haven\'t filled in all the blanks. Submit anyway?'
      )
      if (!confirm) return
    }

    onSubmit(answers)
  }

  const filledCount = Object.keys(answers).filter((key) => answers[key]?.trim()).length
  const progress = Math.round((filledCount / quiz.blanks.length) * 100)

  return (
    <div className="bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6 shadow-lg rounded-t-lg">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold mb-1">{quiz.title}</h2>
            <p className="text-purple-100">{quiz.artist}</p>
          </div>
          {quiz.metadata?.thumbnailUrl && (
            <img
              src={quiz.metadata.thumbnailUrl}
              alt={quiz.title}
              className="w-16 h-16 rounded-lg shadow-lg"
            />
          )}
        </div>

        {challengeScore && (
          <div className="bg-white bg-opacity-20 rounded-lg p-3 mb-4 border border-white border-opacity-30">
            <p className="text-sm font-medium text-gray-900">
              🏆 Challenge: Beat {challengeScore.percentage}% ({challengeScore.correct}/{challengeScore.total})
            </p>
          </div>
        )}

        {/* Progress bar */}
        <div className="bg-white bg-opacity-30 rounded-full h-3 overflow-hidden border border-white border-opacity-50">
          <div
            className="bg-gradient-to-r from-green-400 to-green-500 h-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <p className="text-sm text-white font-medium mt-2">
          {filledCount} / {quiz.blanks.length} blanks filled ({progress}%)
        </p>
      </div>

      {/* Lyrics */}
      <div className="p-6 md:p-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-gray-50 rounded-lg p-6 font-mono text-sm md:text-base leading-relaxed whitespace-pre-wrap overflow-visible">
            {renderLyrics()}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="bg-gray-50 px-6 py-4 flex justify-between items-center">
        <button
          onClick={onBack}
          className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium"
        >
          ← Back
        </button>
        <button
          onClick={handleSubmit}
          className="px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={filledCount === 0}
        >
          Submit Answers
        </button>
      </div>
    </div>
  )
}

export default QuizView
