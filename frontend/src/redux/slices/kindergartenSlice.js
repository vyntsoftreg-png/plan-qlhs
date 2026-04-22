import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axios';
import { setUser } from './authSlice';

export const fetchKindergartenProfile = createAsyncThunk(
  'kindergarten/fetchProfile',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/kindergarten/profile');
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch kindergarten profile');
    }
  }
);

export const updateKindergartenProfile = createAsyncThunk(
  'kindergarten/updateProfile',
  async (profileData, { rejectWithValue, dispatch }) => {
    try {
      const response = await api.put('/kindergarten/profile', profileData);
      const data = response.data.data;
      // If admin just created their first kindergarten, patch localStorage + Redux auth state
      if (data?.id) {
        try {
          const stored = JSON.parse(localStorage.getItem('user') || '{}');
          if (!stored.kindergarten_id) {
            stored.kindergarten_id = data.id;
            localStorage.setItem('user', JSON.stringify(stored));
            dispatch(setUser(stored));
          }
        } catch (_) {}
      }
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update kindergarten profile');
    }
  }
);

export const getKindergartenSettings = createAsyncThunk(
  'kindergarten/getSettings',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/kindergarten/settings');
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch kindergarten settings');
    }
  }
);

export const updateKindergartenSettings = createAsyncThunk(
  'kindergarten/updateSettings',
  async (settingsData, { rejectWithValue }) => {
    try {
      const response = await api.put('/kindergarten/settings', settingsData);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update kindergarten settings');
    }
  }
);

const initialState = {
  profile: null,
  settings: null,
  loading: false,
  error: null,
};

const kindergartenSlice = createSlice({
  name: 'kindergarten',
  initialState,
  extraReducers: (builder) => {
    builder
      .addCase(fetchKindergartenProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchKindergartenProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.profile = action.payload;
      })
      .addCase(fetchKindergartenProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updateKindergartenProfile.fulfilled, (state, action) => {
        state.profile = action.payload;
      })
      .addCase(getKindergartenSettings.fulfilled, (state, action) => {
        state.settings = action.payload;
      })
      .addCase(updateKindergartenSettings.fulfilled, (state, action) => {
        state.settings = action.payload;
      });
  },
});

export default kindergartenSlice.reducer;
