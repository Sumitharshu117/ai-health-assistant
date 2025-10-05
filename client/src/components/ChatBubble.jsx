import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { FaTrashAlt } from 'react-icons/fa'

export default function ChatBubble({ text, sender, timestamp, diagnosis, isLatest, onDelete, index }) {
  const [hovered, setHovered] = useState(false)

  const isAI = sender === 'ai'
  const icon = isAI ? '🤖' : '👤'

  return (
    <div
      className={`flex ${isAI ? 'justify-start' : 'justify-end'} w-full group relative`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Icon on left for AI, right for User */}
      {isAI && <div className="text-2xl mr-2 mt-2">{icon}</div>}
      
      <div className={`relative max-w-[80%] px-5 py-3 rounded-lg shadow-md text-sm whitespace-pre-wrap leading-relaxed
        ${isAI ? 'bg-indigo-100 dark:bg-indigo-900 text-black dark:text-white' : 'bg-indigo-600 text-white'}
      `}>
        {/* Delete button */}
        {hovered && (
          <button
            onClick={() => onDelete(index)}
            className="absolute top-1 right-1 text-red-500 hover:text-red-700"
            title="Delete this and its reply"
          >
            <FaTrashAlt size={14} />
          </button>
        )}

        <p>{text}</p>

        {/* Diagnosis Info (latest image message only) */}
        {diagnosis?.label && diagnosis?.confidence && isLatest && (
          <div className="mt-2 text-xs font-medium text-indigo-500 dark:text-indigo-300">
            Diagnosis: <span className="font-semibold">{diagnosis.label}</span><br />
            Confidence: <span>{diagnosis.confidence}%</span>
          </div>
        )}

        {/* Timestamp */}
        {timestamp && (
          <div className="text-[10px] text-right text-gray-400 pt-1">
            {formatDistanceToNow(new Date(timestamp), { addSuffix: true })}
          </div>
        )}
      </div>

      {!isAI && <div className="text-2xl ml-2 mt-2">{icon}</div>}
    </div>
  )
}
