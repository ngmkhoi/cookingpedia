"use client";

import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { apiGet } from "./api";
import { Provider } from "react-redux";
import { clearAuthState, setAuthState } from "../features/auth/auth-slice";
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
      } catch {
        if (active) {
          dispatch(clearAuthState());
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
