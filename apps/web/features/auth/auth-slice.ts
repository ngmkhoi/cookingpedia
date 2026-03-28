import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

type AuthState = {
  status: "unknown" | "authenticated" | "anonymous";
  user: null | {
    id: string;
    displayName: string;
    username: string;
    avatarUrl: string | null;
    role: "USER" | "ADMIN";
  };
};

const initialState: AuthState = {
  status: "unknown",
  user: null
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setAuthState(state, action: PayloadAction<AuthState>) {
      state.status = action.payload.status;
      state.user = action.payload.user;
    },
    clearAuthState(state) {
      state.status = "anonymous";
      state.user = null;
    }
  }
});

export const { setAuthState, clearAuthState } = authSlice.actions;
export default authSlice.reducer;
