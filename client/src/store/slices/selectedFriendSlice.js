import { createSlice } from "@reduxjs/toolkit"

const selectedFriendSlice = createSlice({
    name: "selectedFriend",
    initialState: {
        selectedFriend: null,
    },
    reducers: {
        addselectedFriend: (state, action) => {
            state.selectedFriend = action.payload;
        },
        removeselectedFriend: (state) => {
            state.selectedFriend = null
        }
    }
})

export const { addselectedFriend, removeselectedFriend } = selectedFriendSlice.actions
export default selectedFriendSlice.reducer;