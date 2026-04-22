import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axios';

export const fetchPlans = createAsyncThunk(
  'plans/fetchPlans',
  async ({ child_id, status, page = 1, limit = 10 }, { rejectWithValue }) => {
    try {
      const offset = (page - 1) * limit;
      const params = new URLSearchParams({ offset, limit });
      if (child_id) params.append('child_id', child_id);
      if (status) params.append('status', status);
      
      const response = await api.get(`/plans?${params}`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch plans');
    }
  }
);

export const getPlanById = createAsyncThunk(
  'plans/getPlanById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.get(`/plans/${id}`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch plan');
    }
  }
);

export const createPlan = createAsyncThunk(
  'plans/createPlan',
  async (planData, { rejectWithValue }) => {
    try {
      const response = await api.post('/plans', planData);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create plan');
    }
  }
);

export const updatePlan = createAsyncThunk(
  'plans/updatePlan',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/plans/${id}`, data);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update plan');
    }
  }
);

export const deletePlan = createAsyncThunk(
  'plans/deletePlan',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/plans/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete plan');
    }
  }
);

const initialState = {
  list: [],
  detail: null,
  pagination: { page: 1, limit: 10, total: 0 },
  loading: false,
  error: null,
};

const plansSlice = createSlice({
  name: 'plans',
  initialState,
  extraReducers: (builder) => {
    builder
      .addCase(fetchPlans.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPlans.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload.plans;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchPlans.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(getPlanById.fulfilled, (state, action) => {
        state.detail = action.payload;
      })
      .addCase(createPlan.fulfilled, (state, action) => {
        state.list.unshift(action.payload);
      })
      .addCase(updatePlan.fulfilled, (state, action) => {
        const index = state.list.findIndex(p => p.id === action.payload.id);
        if (index !== -1) {
          state.list[index] = action.payload;
        }
        state.detail = action.payload;
      })
      .addCase(deletePlan.fulfilled, (state, action) => {
        state.list = state.list.filter(p => p.id !== action.payload);
      });
  },
});

export default plansSlice.reducer;
