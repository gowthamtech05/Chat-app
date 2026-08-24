import { createSlice } from "@reduxjs/toolkit";

interface ChatState {
  onlineUsers: string[];
}

const initialState: ChatState = {
  onlineUsers: [],
};

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    setOnlineUsers: (state, action) => {
      state.onlineUsers = action.payload;
    },
  },
});

export const { setOnlineUsers } =
  chatSlice.actions;

export default chatSlice.reducer;