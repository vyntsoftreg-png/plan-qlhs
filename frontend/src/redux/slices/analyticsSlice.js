import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axios';

export const fetchAnalytics = createAsyncThunk(
  'analytics/fetchAnalytics',
  async ({ start_date, end_date, kindergarten_id }, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      if (start_date) params.append('start_date', start_date);
      if (end_date) params.append('end_date', end_date);
      if (kindergarten_id) params.append('kindergarten_id', kindergarten_id);
      
      const response = await api.get(`/analytics/dashboard?${params}`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch analytics');
    }
  }
);

export const fetchSkillAnalytics = createAsyncThunk(
  'analytics/fetchSkillAnalytics',
  async ({ kindergarten_id }, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      if (kindergarten_id) params.append('kindergarten_id', kindergarten_id);
      
      const response = await api.get(`/analytics/skills?${params}`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch skill analytics');
    }
  }
);

export const fetchProgressAnalytics = createAsyncThunk(
  'analytics/fetchProgressAnalytics',
  async ({ child_id }, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      if (child_id) params.append('child_id', child_id);
      
      const response = await api.get(`/analytics/progress?${params}`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch progress analytics');
    }
  }
);

const initialState = {
  overview: null,
  skills: null,
  progress: null,
  loading: false,
  error: null,
};

const analyticsSlice = createSlice({
  name: 'analytics',
  initialState,
  extraReducers: (builder) => {
    builder
      .addCase(fetchAnalytics.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAnalytics.fulfilled, (state, action) => {
        state.loading = false;
        state.overview = action.payload;
      })
      .addCase(fetchAnalytics.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchSkillAnalytics.fulfilled, (state, action) => {
        state.skills = action.payload;
      })
      .addCase(fetchProgressAnalytics.fulfilled, (state, action) => {
        state.progress = action.payload;
      });
  },
});

export default analyticsSlice.reducer;
