import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { login as loginAPI, logout as logoutAPI } from '../api/api';
import axios from 'axios';

export interface User {
  id: string;
  email: string;
  name: string;
  contactPhone?: string;
  role: 'client' | 'manager' | 'admin';
}

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  loading: false,
  error: null,
};

// Async thunk для входа
export const login = createAsyncThunk<
  User,
  { email: string; password: string },
  { rejectValue: string }
>('auth/login', async (credentials, thunkAPI) => {
  try {
    const response = await loginAPI(credentials);
    return response as User;
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      return thunkAPI.rejectWithValue(err.response?.data?.message || 'Ошибка входа');
    }
    return thunkAPI.rejectWithValue('Ошибка входа');
  }
});

// Async thunk для логаута
export const logout = createAsyncThunk<void, void, { rejectValue: string }>(
  'auth/logout',
  async (_, thunkAPI) => {
    try {
      await logoutAPI();
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        return thunkAPI.rejectWithValue(err.response?.data?.message || 'Ошибка выхода');
      }
      return thunkAPI.rejectWithValue('Ошибка выхода');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser(state, action: PayloadAction<User>) {
      state.user = action.payload;
    },
  },
  extraReducers: (builder) => {
    // Обработка логина
    builder.addCase(login.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(login.fulfilled, (state, action: PayloadAction<User>) => {
      state.loading = false;
      state.user = action.payload;
    });
    builder.addCase(login.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload || null;
    });

    // Обработка логаута
    builder.addCase(logout.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(logout.fulfilled, (state) => {
      state.loading = false;
      state.user = null;
    });
    builder.addCase(logout.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload || null;
    });
  },
});

export const { setUser } = authSlice.actions;
export default authSlice.reducer;