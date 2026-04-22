import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axios';

export const fetchEvaluations = createAsyncThunk(
  'evaluations/fetchEvaluations',
  async ({ plan_id, page = 1, limit = 20 }, { rejectWithValue }) => {
    try {
      const offset = (page - 1) * limit;
      const params = new URLSearchParams({ offset, limit });
      const response = await api.get(`/plans/${plan_id}/evaluate?${params}`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch evaluations');
    }
  }
);

export const createEvaluation = createAsyncThunk(
  'evaluations/createEvaluation',
  async ({ plan_id, ...evalData }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/plans/${plan_id}/evaluate`, evalData);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create evaluation');
    }
  }
);

export const updateEvaluation = createAsyncThunk(
  'evaluations/updateEvaluation',
  async ({ plan_id, skill_id, data }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/plans/${plan_id}/evaluate/${skill_id}`, data);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update evaluation');
    }
  }
);

const initialState = {
  list: [],
  pagination: { page: 1, limit: 20, total: 0 },
  loading: false,
  error: null,
};

const evaluationsSlice = createSlice({
  name: 'evaluations',
  initialState,
  extraReducers: (builder) => {
    builder
      .addCase(fetchEvaluations.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEvaluations.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload.evaluations;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchEvaluations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createEvaluation.fulfilled, (state, action) => {
        state.list.unshift(action.payload);
      })
      .addCase(updateEvaluation.fulfilled, (state, action) => {
        const index = state.list.findIndex(e => e.id === action.payload.id);
        if (index !== -1) {
          state.list[index] = action.payload;
        }
      });
  },
});

export default evaluationsSlice.reducer;
