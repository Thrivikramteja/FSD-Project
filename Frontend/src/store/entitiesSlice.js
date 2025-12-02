import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

export const fetchLandingData = createAsyncThunk(
  "entities/fetchLandingData",
  async () => {
    const res = await fetch("http://localhost:3000/api"); 
    const data = await res.json();
    return data;
  }
);

const entitiesSlice = createSlice({
  name: "entities",
  initialState: {
    ngos: [],
    events: [],
  },
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(fetchLandingData.fulfilled, (state, action) => {
      state.ngos = action.payload.ongoing_fund;
      state.events = action.payload.upcoming_eve;
    });
  }
});

export default entitiesSlice.reducer;
