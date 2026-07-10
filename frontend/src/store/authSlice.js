import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  user: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null,
  token: localStorage.getItem('token') || null,
  loading: false,
  error: null,
  deactivated: false, // NEW
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setUser: (state, action) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      localStorage.setItem('user', JSON.stringify(action.payload.user));
      localStorage.setItem('token', action.payload.token);
      state.error = null;
      state.deactivated = false;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    setDeactivated: (state) => { // NEW
      state.deactivated = true;
      state.user = null;
      state.token = null;
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      state.error = null;
      state.deactivated = false;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const { setLoading, setUser, setError, setDeactivated, logout, clearError } = authSlice.actions;
export default authSlice.reducer;