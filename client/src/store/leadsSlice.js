import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/leads`;

export const getLeads = createAsyncThunk('leads/getAll', async (queryStr = '', thunkAPI) => {
  try {
    const response = await axios.get(`${API_URL}?${queryStr}`);
    return response.data;
  } catch (error) {
    const message = error.response?.data?.error?.message || error.message;
    return thunkAPI.rejectWithValue(message);
  }
});

export const getLeadAuth = createAsyncThunk('leads/getOne', async (id, thunkAPI) => {
  try {
    const response = await axios.get(`${API_URL}/${id}`);
    return response.data.data;
  } catch (error) {
    const message = error.response?.data?.error?.message || error.message;
    return thunkAPI.rejectWithValue(message);
  }
});

export const createLead = createAsyncThunk('leads/create', async (leadData, thunkAPI) => {
  try {
    const response = await axios.post(API_URL, leadData);
    return response.data.data;
  } catch (error) {
    const message = error.response?.data?.error?.message || error.message;
    return thunkAPI.rejectWithValue(message);
  }
});

// Followups
export const getFollowups = createAsyncThunk('leads/followups', async (range = 'this_week', thunkAPI) => {
  try {
    const response = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/followups?range=${range}`);
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
