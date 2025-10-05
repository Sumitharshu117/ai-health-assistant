import { useState, useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import {
  sendMessage,
  loadMessages,
  clearChat,
  addUserMessage,
  addAIPlaceholder,
  sendMessageSuccess,
  sendMessageFailure,
  deleteMessagePair

} from '../store/slices/chatSlice'
import { logoutUser } from '../store/slices/authSlice'
import ChatBubble from '../components/ChatBubble'
import ThemeToggle from '../components/ThemeToggle'
import { useNavigate } from 'react-router-dom'
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition'
import axios from 'axios'

export default function ChatPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const fileInputRef = useRef(null)
  const { messages, loading, activeDiagnosis } = useSelector((state) => state.chat)
  const { isAuthenticated, user } = useSelector((state) => state.auth)

  const [input, setInput] = useState('')
  const [speechLang, setSpeechLang] = useState('en-IN')
  const [isVoiceMode, setIsVoiceMode] = useState(false)
  const bottomRef = useRef(null)

  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition
  } = useSpeechRecognition()

  useEffect(() => {
  if (!isAuthenticated) navigate('/login')
  if (user && user._id) dispatch(loadMessages(user._id))
}, [dispatch, isAuthenticated, user, navigate])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (!listening && transcript.trim()) {
      handleSend()
    }
  }, [listening])

  useEffect(() => {
    if (isVoiceMode) {
      setInput(transcript)
    }
  }, [transcript])

  const handleSend = () => {
    if (!input.trim()) return

    dispatch(addUserMessage({
      text: input,
      sender: 'user',
      timestamp: new Date().toISOString()
    }))

    dispatch(addAIPlaceholder())

    const isVoice = isVoiceMode

    dispatch(sendMessage({
  message: input,
  lang: isVoice ? speechLang : 'en-IN',
  userId: user._id
}))

    setInput('')
    resetTranscript()
    setIsVoiceMode(false)
  }

const handleImageUpload = async (file) => {
  const formData = new FormData()
  formData.append('image', file)

  dispatch(addUserMessage({
    text: '📷 Uploaded an image for diagnosis...',
    sender: 'user',
    timestamp: new Date().toISOString()
  }))
  dispatch(addAIPlaceholder())

  try {
    const res = await axios.post('http://localhost:5001/api/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })

    dispatch(
      sendMessageSuccess({
        aiResponse: { text: res.data.response },
        diagnosis: res.data.diagnosis
      })
    )

    setInput('')  // ✅ clear text input
    if (fileInputRef.current) fileInputRef.current.value = null  // ✅ clear file input

  } catch (err) {
    dispatch(sendMessageFailure('Failed to process the image. Please try again.'))
    console.error('Upload error:', err)
  }
}

  const handleNewChat = () => dispatch(clearChat())
  const handleLogout = () => {
    dispatch(logoutUser())
    navigate('/login')
  }
  const handleDelete = (index) => {
    dispatch(deleteMessagePair(index))
  }

  const handleCallAmbulance = () => {
    window.location.href = 'tel:102'
  }

const handleFindHospitals = () => {
  if (!navigator.geolocation) {
    alert('Geolocation is not supported by your browser')
    return
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const { latitude, longitude } = position.coords
      const mapsUrl = `https://www.google.com/maps/search/hospitals/@${latitude},${longitude},14z`
      window.open(mapsUrl, '_blank')
    },
    (error) => {
      console.warn('Geolocation error:', error)

      // Ask user to enter city name as fallback
      const city = window.prompt("Unable to get your location. Please enter your city (e.g. Mumbai, Delhi):")

      if (city) {
        const cityUrl = `https://www.google.com/maps/search/hospitals+in+${encodeURIComponent(city)}`
        window.open(cityUrl, '_blank')
      } else {
        // If user cancels input, use New Delhi as default
        const fallbackUrl = `https://www.google.com/maps/search/hospitals/@28.6139,77.2090,14z`
        window.open(fallbackUrl, '_blank')
      }
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    }
  )
}
  const startListening = (lang) => {
    setSpeechLang(lang)
    setIsVoiceMode(true)
    setInput('')
    resetTranscript()
    SpeechRecognition.startListening({ continuous: true, language: lang })
  }

  return (
    <div className="flex flex-col h-screen bg-gradient-to-b from-white to-indigo-50 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b px-4 py-4 shadow-sm w-full">
  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
    
    {/* Left Buttons */}
    <div className="flex flex-wrap justify-center sm:justify-start gap-2">
      <button
        onClick={handleCallAmbulance}
        className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
      >
        🚑 Call Ambulance
      </button>
      <button
        onClick={handleFindHospitals}
        className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
      >
        🏥 Nearby Hospitals
      </button>
    </div>

    {/* Center Title */}
    <h1 className="text-xl text-center font-bold text-indigo-600 dark:text-indigo-300">
      👋 Health Assistant
    </h1>

    {/* Right Side Controls */}
    <div className="flex flex-wrap justify-center sm:justify-end gap-2">
      <button
        onClick={handleNewChat}
        className="bg-gray-200 dark:bg-gray-700 text-sm px-4 py-2 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
      >
        New Chat
      </button>
      <button
        onClick={handleLogout}
        className="text-sm text-red-500 dark:text-red-400 hover:underline"
      >
        Logout
      </button>
      <ThemeToggle />
    </div>
  </div>
</header>

      {/* Chat Section */}
      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 overflow-y-auto px-4 sm:px-6 md:px-12 py-4 space-y-2">
          {messages.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400 text-lg mt-10">
              No messages yet. Start the conversation below!
            </p>
          ) : (
            messages.map((msg, idx) => (
              <ChatBubble
                key={idx}
                {...msg}
                diagnosis={idx === messages.length - 1 ? activeDiagnosis : null}
                isLatest={idx === messages.length - 1}
                onDelete={() => handleDelete(idx)}
              />
              
            ))
          )}
          {loading && (
            <div className="flex items-center gap-2 text-indigo-400 animate-pulse pl-2">
              <span className="text-lg">🤖</span>
              <span>AI is typing...</span>
            </div>
          )}
          <div ref={bottomRef} />
        </main>

        {/* Sidebar */}
        <aside className="hidden lg:block w-1/4 px-4 pr-8 pt-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-lg space-y-3">
            <h2 className="text-indigo-600 dark:text-indigo-400 text-lg font-semibold">Health Tips 💡</h2>
            <ul className="list-disc list-inside text-sm text-gray-700 dark:text-gray-300 space-y-1">
              <li>Drink plenty of water</li>
              <li>Sleep at least 7 hours</li>
              <li>Regular exercise is key</li>
              <li>Eat more fruits & veggies</li>
              <li>Avoid processed foods</li>
            </ul>
          </div>
        </aside>
      </div>

      {/* Input + Voice + Upload */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4 shadow-inner">
        <div className="max-w-6xl mx-auto flex flex-col gap-3">
          <div className="flex gap-3 items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !loading && handleSend()}
              placeholder="Describe your symptoms..."
              className="flex-1 px-5 py-3 rounded-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
            <button
              onClick={handleSend}
              disabled={loading}
              className={`px-6 py-2 rounded-full shadow-md transition ${loading ? 'bg-gray-400 cursor-not-allowed text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                }`}
            >
              {loading ? 'Sending...' : 'Send'}
            </button>
          </div>

          <div className="flex gap-3 justify-end items-center">
            <button
              onClick={() => startListening('en-IN')}
              disabled={!browserSupportsSpeechRecognition}
              className="text-sm bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200 px-4 py-2 rounded-md"
            >
              🎤 Speak English {listening && speechLang === 'en-IN' && '🎙️'}
            </button>
            <button
              onClick={() => startListening('hi-IN')}
              disabled={!browserSupportsSpeechRecognition}
              className="text-sm bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 px-4 py-2 rounded-md"
            >
              🗣️ Speak Hindi {listening && speechLang === 'hi-IN' && '🎙️'}
            </button>
            {listening && (
              <button
                onClick={SpeechRecognition.stopListening}
                className="text-sm text-red-600 dark:text-red-400 underline"
              >
                Stop Listening
              </button>
            )}
            <label
  htmlFor="imageUpload"
  className="flex items-center gap-2 cursor-pointer text-sm bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200 px-4 py-2 rounded-md hover:bg-pink-200 dark:hover:bg-pink-800 transition"
>
  📷 Upload Skin Image
</label>
<input
  id="imageUpload"
  type="file"
  accept="image/*"
  onChange={(e) => {
    handleImageUpload(e.target.files[0])
    e.target.value = null  // reset input after upload
  }}
  className="hidden"
/>
<p className="text-xs text-gray-500 dark:text-gray-400 text-right pr-1">
  Upload a skin image to get AI-based diagnosis.
</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
