import { createSlice } from "@reduxjs/toolkit";

const selectedGroupSlice = createSlice({
    name: "selectedGroup",
    initialState: {
        selectedGroup: null
    },
    reducers: {
        addSelectedGroup: (state, action) => {
            state.selectedGroup = action.payload;
        },
        removeSelectedGroup: (state) => {
            state.selectedGroup = null;
        }
    }
})

export const { addSelectedGroup, removeSelectedGroup } = selectedGroupSlice.actions;
export default selectedGroupSlice.reducer;