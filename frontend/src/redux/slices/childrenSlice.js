import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axios';

export const fetchChildren = createAsyncThunk(
  'children/fetchChildren',
  async ({ page = 1, limit = 10, filters = {} }, { rejectWithValue }) => {
    try {
      const offset = (page - 1) * limit;
      const params = new URLSearchParams({
        offset,
        limit,
        ...filters,
      });
      const response = await api.get(`/children?${params}`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch children');
    }
  }
);

export const getChildById = createAsyncThunk(
  'children/getChildById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.get(`/children/${id}`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch child');
    }
  }
);

export const createChild = createAsyncThunk(
  'children/createChild',
  async (childData, { rejectWithValue }) => {
    try {
      const response = await api.post('/children', childData);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create child');
    }
  }
);

export const updateChild = createAsyncThunk(
  'children/updateChild',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/children/${id}`, data);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update child');
    }
  }
);

export const deleteChild = createAsyncThunk(
  'children/deleteChild',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/children/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete child');
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

const childrenSlice = createSlice({
  name: 'children',
  initialState,
  extraReducers: (builder) => {
    // Fetch Children
    builder
      .addCase(fetchChildren.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchChildren.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload.children;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchChildren.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Get Child by ID
    builder
      .addCase(getChildById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getChildById.fulfilled, (state, action) => {
        state.loading = false;
        state.detail = action.payload;
      })
      .addCase(getChildById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Create Child
    builder
      .addCase(createChild.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createChild.fulfilled, (state, action) => {
        state.loading = false;
        state.list.unshift(action.payload);
      })
      .addCase(createChild.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Update Child
    builder
      .addCase(updateChild.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateChild.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.list.findIndex(c => c.id === action.payload.id);
        if (index !== -1) {
          state.list[index] = action.payload;
        }
        state.detail = action.payload;
      })
      .addCase(updateChild.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Delete Child
    builder
      .addCase(deleteChild.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteChild.fulfilled, (state, action) => {
        state.loading = false;
        state.list = state.list.filter(c => c.id !== action.payload);
      })
      .addCase(deleteChild.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default childrenSlice.reducer;
