import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../features/auth/auth-slice";
import bookmarksReducer from "../features/bookmarks/bookmarks-slice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    bookmarks: bookmarksReducer
  }
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
