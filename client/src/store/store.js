import { configureStore } from "@reduxjs/toolkit"
import authReducer from "./slices/authSlice"
import selectedFriendReducer from "./slices/selectedFriendSlice";
import selectedGroupReducer from "./slices/selectedGroupSlice";

const store = configureStore({
    reducer: {
        auth: authReducer,
        selectedFriend: selectedFriendReducer,
        selectedGroup: selectedGroupReducer
    }
})

export default store;