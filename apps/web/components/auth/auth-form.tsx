"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { apiGet, apiWrite } from "@/lib/api";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

type AuthFormValues = {
  email: string;
  password: string;
  displayName?: string;
  username?: string;
};

export function AuthForm({
  mode,
  onSuccess
}: {
  mode: "login" | "register";
  onSuccess?: (user: { role: "USER" | "ADMIN" }) => void;
}) {
  const [currentMode, setCurrentMode] = useState(mode);
  const [error, setError] = useState("");
  const { register, handleSubmit } = useForm<AuthFormValues>();

  const onSubmit = handleSubmit(async (values) => {
    setError("");

    try {
      await apiWrite(`/auth/${currentMode}`, {
        method: "POST",
        body: JSON.stringify(values)
      });
      const me = await apiGet<{ user: { role: "USER" | "ADMIN" } }>(
        "/auth/me",
        true
      );
      if (onSuccess) {
        onSuccess(me.user);
        return;
      }
      window.location.href =
        me.user.role === "ADMIN" ? "/admin/recipes/pending" : "/profile";
    } catch {
      setError("Unable to authenticate. Check your credentials and try again.");
    }
  });

  return (
    <form onSubmit={onSubmit} className="panel mx-auto grid max-w-xl gap-4 p-6">
      {currentMode === "register" ? (
        <Input {...register("displayName")} placeholder="Display name" />
      ) : null}
      {currentMode === "register" ? (
        <Input {...register("username")} placeholder="Username" />
      ) : null}
      <Input {...register("email")} placeholder="Email" />
      <Input {...register("password")} type="password" placeholder="Password" />
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <Button type="submit">
        {currentMode === "login" ? "Sign in" : "Create account"}
      </Button>
      <button
        type="button"
        className="text-left text-sm text-[var(--muted)] underline-offset-4 hover:underline"
        onClick={() =>
          setCurrentMode((value) => (value === "login" ? "register" : "login"))
        }
      >
        {currentMode === "login"
          ? "Need an account? Register"
          : "Already have an account? Login"}
      </button>
    </form>
  );
}
