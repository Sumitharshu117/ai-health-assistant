import { createSlice } from '@reduxjs/toolkit'
import axios from 'axios' // ✅ Important for sendMessage()

const initialState = {
  messages: [],
  loading: false,
  error: null,
  activeDiagnosis: null
}

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    addUserMessage(state, action) {
      state.messages.push(action.payload)
    },

    addAIPlaceholder(state) {
      state.messages.push({
        text: '...',
        sender: 'ai',
        timestamp: new Date().toISOString()
      })
      state.loading = true
    },

   sendMessageSuccess(state, action) {
  const { aiResponse, diagnosis } = action.payload

  const reverseIndex = [...state.messages]
    .reverse()
    .findIndex((msg) => msg.sender === 'ai' && msg.text === '...')

  const newMessage = {
    text: aiResponse.text,
    sender: 'ai',
    timestamp: new Date().toISOString()
  }

  if (aiResponse.confidence !== undefined) {
    newMessage.confidence = aiResponse.confidence
  }

  if (reverseIndex !== -1) {
    const index = state.messages.length - 1 - reverseIndex
    state.messages[index] = newMessage
  } else {
    state.messages.push(newMessage)
  }

  state.loading = false
  state.activeDiagnosis = diagnosis || null // ✅ Clear when not set
},
    deleteMessagePair(state, action) {
  const index = action.payload;
  if (index >= 0 && index < state.messages.length - 1) {
    // Remove both user message and AI reply
    state.messages.splice(index, 2);
  } else if (index === state.messages.length - 1) {
    // If it's the last message and no reply, remove only that
    state.messages.pop();
  }
},
    sendMessageFailure(state, action) {
      state.loading = false
      state.error = action.payload
    },

    loadMessagesStart(state) {
      state.loading = true
      state.error = null
    },

    loadMessagesSuccess(state, action) {
      state.messages = action.payload
      state.loading = false
    },

    loadMessagesFailure(state, action) {
      state.loading = false
      state.error = action.payload
    },

    clearChat(state) {
      state.messages = []
      state.activeDiagnosis = null
    }
  }
})

export const {
  addUserMessage,
  addAIPlaceholder,
  sendMessageSuccess,
  sendMessageFailure,
  loadMessagesStart,
  loadMessagesSuccess,
  loadMessagesFailure,
  clearChat,
  deleteMessagePair
} = chatSlice.actions

// ✅ Send message to backend with message + lang
export const sendMessage = ({ message, lang, userId }) => async (dispatch) => {
  try {
    const response = await axios.post('http://localhost:5001/api/message', {
      message,
      lang,
      userId
    })

    dispatch(
      sendMessageSuccess({
        aiResponse: { text: response.data.response },
        diagnosis: response.data.diagnosis || null
      })
    )
  } catch (error) {
    dispatch(
      sendMessageFailure(
        error.response?.data?.message || 'Failed to send message'
      )
    )
  }
}

// ✅ Load chat history (optional feature)
export const loadMessages = (userId) => async (dispatch) => {
  try {
    dispatch(loadMessagesStart())
    const response = await axios.get(`http://localhost:5001/api/chat?userId=${userId}`)
    dispatch(loadMessagesSuccess(response.data.messages))
  } catch (error) {
    dispatch(
      loadMessagesFailure(
        error.response?.data?.message || 'Failed to load messages'
      )
    )
  }
}

export default chatSlice.reducer