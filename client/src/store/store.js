import { configureStore } from "@reduxjs/toolkit"
import authReducer from "./slices/authSlice"
import selectedFriendReducer from "./slices/selectedFriendSlice";
import selectedGroupReducer from "./slices/selectedGroupSlice";
import settingsReducer from "./slices/settingsSlice";

const store = configureStore({
    reducer: {
        auth: authReducer,
        selectedFriend: selectedFriendReducer,
        selectedGroup: selectedGroupReducer,
        settings: settingsReducer
    }
})

export default store;