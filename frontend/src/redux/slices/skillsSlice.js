import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axios';

export const fetchSkills = createAsyncThunk(
  'skills/fetchSkills',
  async ({ kindergarten_id, page = 1, limit = 20, search, development_area_id }, { rejectWithValue }) => {
    try {
      const offset = (page - 1) * limit;
      const params = new URLSearchParams({ offset, limit });
      if (kindergarten_id) params.append('kindergarten_id', kindergarten_id);
      if (search) params.append('search', search);
      if (development_area_id) params.append('development_area_id', development_area_id);
      
      const response = await api.get(`/skills?${params}`);
      return { skills: response.data.data, pagination: response.data.pagination };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch skills');
    }
  }
);

export const createSkill = createAsyncThunk(
  'skills/createSkill',
  async (skillData, { rejectWithValue }) => {
    try {
      const response = await api.post('/skills', skillData);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create skill');
    }
  }
);

export const updateSkill = createAsyncThunk(
  'skills/updateSkill',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/skills/${id}`, data);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update skill');
    }
  }
);

export const deleteSkill = createAsyncThunk(
  'skills/deleteSkill',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/skills/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete skill');
    }
  }
);

const initialState = {
  list: [],
  pagination: { page: 1, limit: 20, total: 0 },
  loading: false,
  error: null,
};

const skillsSlice = createSlice({
  name: 'skills',
  initialState,
  extraReducers: (builder) => {
    builder
      .addCase(fetchSkills.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSkills.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload.skills;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchSkills.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createSkill.fulfilled, (state, action) => {
        state.list.unshift(action.payload);
      })
      .addCase(updateSkill.fulfilled, (state, action) => {
        const index = state.list.findIndex(s => s.id === action.payload.id);
        if (index !== -1) {
          state.list[index] = action.payload;
        }
      })
      .addCase(deleteSkill.fulfilled, (state, action) => {
        state.list = state.list.filter(s => s.id !== action.payload);
      });
  },
});

export default skillsSlice.reducer;
