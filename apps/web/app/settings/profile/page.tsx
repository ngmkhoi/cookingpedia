"use client";

import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { apiWrite } from "@/lib/api";

type ProfileSettingsValues = {
  displayName: string;
  username: string;
  avatarUrl?: string;
  bio?: string;
  locale?: "vi" | "en";
};

export default function ProfileSettingsPage() {
  const { register, handleSubmit } = useForm<ProfileSettingsValues>();

  return (
    <main className="page-main">
      <div className="mb-8">
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
          Settings
        </p>
        <h1 className="text-4xl tracking-tight">Edit your profile</h1>
      </div>
      <form
        onSubmit={handleSubmit(async (values) => {
          await apiWrite("/users/me", {
            method: "PATCH",
            body: JSON.stringify(values)
          });
          window.location.href = "/profile";
        })}
        className="panel grid max-w-3xl gap-4 p-6"
      >
        <Input {...register("displayName")} placeholder="Display name" />
        <Input {...register("username")} placeholder="Username" />
        <Input {...register("avatarUrl")} placeholder="Avatar URL" />
        <select
          {...register("locale")}
          className="min-h-12 rounded-2xl border border-[var(--line)] bg-transparent px-4"
        >
          <option value="vi">Tiếng Việt</option>
          <option value="en">English</option>
        </select>
        <Textarea {...register("bio")} placeholder="Bio" />
        <Button type="submit">Save changes</Button>
      </form>
    </main>
  );
}
