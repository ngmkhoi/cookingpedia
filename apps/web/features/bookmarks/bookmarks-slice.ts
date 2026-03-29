import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

type BookmarksState = {
  recipeIds: string[];
};

const initialState: BookmarksState = {
  recipeIds: []
};

const bookmarksSlice = createSlice({
  name: "bookmarks",
  initialState,
  reducers: {
    replaceBookmarks(state, action: PayloadAction<string[]>) {
      state.recipeIds = action.payload;
    },
    clearBookmarks(state) {
      state.recipeIds = [];
    },
    toggleBookmark(state, action: PayloadAction<string>) {
      if (state.recipeIds.includes(action.payload)) {
        state.recipeIds = state.recipeIds.filter((id) => id !== action.payload);
      } else {
        state.recipeIds.push(action.payload);
      }
    }
  }
});

export const { replaceBookmarks, clearBookmarks, toggleBookmark } = bookmarksSlice.actions;
export default bookmarksSlice.reducer;
