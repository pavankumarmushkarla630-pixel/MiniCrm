import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || '';
const API_URL = `${BASE_URL}/api/leads`;

// Helper: get auth headers from localStorage
const getAuthHeaders = () => {
  const user = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null;
  return user?.token ? { Authorization: `Bearer ${user.token}` } : {};
};

export const getLeads = createAsyncThunk('leads/getAll', async (queryStr = '', thunkAPI) => {
  try {
    const response = await axios.get(`${API_URL}?${queryStr}`, { headers: getAuthHeaders() });
    return response.data;
  } catch (error) {
    const message = error.response?.data?.error?.message || error.message;
    return thunkAPI.rejectWithValue(message);
  }
});

export const getLeadAuth = createAsyncThunk('leads/getOne', async (id, thunkAPI) => {
  try {
    const response = await axios.get(`${API_URL}/${id}`, { headers: getAuthHeaders() });
    return response.data.data;
  } catch (error) {
    const message = error.response?.data?.error?.message || error.message;
    return thunkAPI.rejectWithValue(message);
  }
});

export const createLead = createAsyncThunk('leads/create', async (leadData, thunkAPI) => {
  try {
    const response = await axios.post(API_URL, leadData, { headers: getAuthHeaders() });
    return response.data.data;
  } catch (error) {
    const message = error.response?.data?.error?.message || error.message;
    return thunkAPI.rejectWithValue(message);
  }
});

export const updateLead = createAsyncThunk('leads/update', async ({ id, data }, thunkAPI) => {
  try {
    const response = await axios.put(`${API_URL}/${id}`, data, { headers: getAuthHeaders() });
    return response.data.data;
  } catch (error) {
    const message = error.response?.data?.error?.message || error.message;
    return thunkAPI.rejectWithValue(message);
  }
});

export const deleteLead = createAsyncThunk('leads/delete', async (id, thunkAPI) => {
  try {
    await axios.delete(`${API_URL}/${id}`, { headers: getAuthHeaders() });
    return id;
  } catch (error) {
    const message = error.response?.data?.error?.message || error.message;
    return thunkAPI.rejectWithValue(message);
  }
});

// Followups
export const getFollowups = createAsyncThunk('leads/followups', async (range = 'this_week', thunkAPI) => {
  try {
    const response = await axios.get(`${BASE_URL}/api/followups?range=${range}`, { headers: getAuthHeaders() });
    return response.data.data;
  } catch (error) {
    const message = error.response?.data?.error?.message || error.message;
    return thunkAPI.rejectWithValue(message);
  }
});

const initialState = {
  leads: [],
  meta: { page: 1, total: 0 },
  currentLead: null,
  followups: [],
  isError: false,
  isSuccess: false,
  isLoading: false,
  message: ''
};

export const leadsSlice = createSlice({
  name: 'leads',
  initialState,
  reducers: {
    resetLeadsState: (state) => {
      state.isError = false;
      state.isSuccess = false;
      state.isLoading = false;
      state.message = '';
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(getLeads.pending, (state) => { state.isLoading = true; })
      .addCase(getLeads.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.leads = action.payload.data;
        state.meta = action.payload.meta;
      })
      .addCase(getLeads.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(createLead.fulfilled, (state, action) => {
        state.isSuccess = true;
        state.leads = [action.payload, ...state.leads];
      })
      .addCase(updateLead.fulfilled, (state, action) => {
        state.isSuccess = true;
        state.leads = state.leads.map(l => l._id === action.payload._id ? action.payload : l);
        if (state.currentLead?._id === action.payload._id) state.currentLead = action.payload;
      })
      .addCase(deleteLead.fulfilled, (state, action) => {
        state.leads = state.leads.filter(l => l._id !== action.payload);
      })
      .addCase(getLeadAuth.fulfilled, (state, action) => {
        state.currentLead = action.payload;
      })
      .addCase(getFollowups.fulfilled, (state, action) => {
        state.followups = action.payload;
      });
  }
});

export const { resetLeadsState } = leadsSlice.actions;
export default leadsSlice.reducer;
