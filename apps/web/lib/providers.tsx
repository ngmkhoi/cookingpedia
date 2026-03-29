"use client";

import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { apiGet } from "./api";
import { Provider } from "react-redux";
import { clearAuthState, setAuthState } from "../features/auth/auth-slice";
import { clearBookmarks, replaceBookmarks } from "../features/bookmarks/bookmarks-slice";
import { store } from "./store";

function AuthBootstrap() {
  const dispatch = useDispatch();

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const data = await apiGet<{
          user: {
            id: string;
            displayName: string;
            username: string;
            avatarUrl: string | null;
            role: "USER" | "ADMIN";
          };
        }>("/auth/me", true);

        if (!active) {
          return;
        }

        dispatch(
          setAuthState({
            status: "authenticated",
            user: data.user
          })
        );

        try {
          const bookmarks = await apiGet<{ recipes: Array<{ id: string }> }>(
            "/bookmarks/me",
            true
          );

          if (!active) {
            return;
          }

          dispatch(replaceBookmarks(bookmarks.recipes.map((recipe) => recipe.id)));
        } catch {
          if (active) {
            dispatch(clearBookmarks());
          }
        }
      } catch {
        if (active) {
          dispatch(clearAuthState());
          dispatch(clearBookmarks());
        }
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, [dispatch]);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <AuthBootstrap />
      {children}
    </Provider>
  );
}
