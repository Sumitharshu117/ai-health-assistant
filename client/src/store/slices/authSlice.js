import { createSlice } from '@reduxjs/toolkit'
import api from '../../api/api'

const initialState = {
  user: null,
  isAuthenticated: false,
  loading: false,
  error: null
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginStart(state) {
      state.loading = true
      state.error = null
    },
    loginSuccess(state, action) {
      state.user = action.payload
      state.isAuthenticated = true
      state.loading = false
      state.error = null
    },
    loginFailure(state, action) {
      state.loading = false
      state.error = action.payload
    },
    logout(state) {
      state.user = null
      state.isAuthenticated = false
    },
    clearError(state) {
      state.error = null
    }
  }
})

export const { loginStart, loginSuccess, loginFailure, logout, clearError } = authSlice.actions

export const login = (credentials) => async (dispatch) => {
  try {
    dispatch(loginStart())
    const response = await api.post('/auth/login', credentials)
    localStorage.setItem('token', response.data.token)
    dispatch(loginSuccess(response.data.user))

    // ✅ ADD THIS LINE to return success (so `.then()` works in component)
    return { success: true }

  } catch (error) {
    dispatch(loginFailure(error.response?.data?.message || 'Login failed'))

    // ✅ ALSO RETURN FAILURE for `.then()` handling
    return { success: false }
  }
}

export const register = (userData) => async (dispatch) => {
  try {
    dispatch(loginStart())
    const response = await api.post('/auth/register', userData)
    localStorage.setItem('token', response.data.token)
    dispatch(loginSuccess(response.data.user))
  } catch (error) {
    dispatch(loginFailure(error.response?.data?.message || 'Registration failed'))
  }
}

export const checkAuth = () => async (dispatch) => {
  try {
    const token = localStorage.getItem('token')
    if (!token) return
    
    const response = await api.get('/auth/me', {
      headers: { Authorization: `Bearer ${token}` }
    })
    dispatch(loginSuccess(response.data))
  } catch (error) {
    localStorage.removeItem('token')
    dispatch(logout())
  }
}

export const logoutUser = () => (dispatch) => {
  localStorage.removeItem('token')
  dispatch(logout())
}

export default authSlice.reducer
