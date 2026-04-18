import { createSlice } from "@reduxjs/toolkit";

const settingsSlice = createSlice({
  name: "settings",
  initialState: {
    features: {
      themeToggle: true,
      videoCall: true,
      aiChat: true,
    },
  },
  reducers: {
    setSettings: (state, action) => {
      state.features = action.payload.features;
    },
    updateFeature: (state, action) => {
      const { feature, value } = action.payload;
      state.features[feature] = value;
    },
  },
});

export const { setSettings, updateFeature } = settingsSlice.actions;
export default settingsSlice.reducer;
