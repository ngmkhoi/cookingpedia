"use client";

import { X } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useSelector } from "react-redux";
import type { RootState } from "@/lib/store";
import { AuthForm } from "./auth-form";

export function AuthDialog({
  open,
  onClose,
  destination = "/my-recipes"
}: {
  open: boolean;
  onClose: () => void;
  destination?: string;
}) {
  const auth = useSelector((state: RootState) => state.auth);
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [onClose, open]);

  if (!open || !mounted) {
    return null;
  }

  if (auth.status === "authenticated") {
    router.push(
      auth.user?.role === "ADMIN" ? "/admin/recipes/pending" : destination
    );
    onClose();
    return null;
  }

  return createPortal(
    <div
      data-testid="auth-dialog-overlay"
      className="fixed inset-0 z-[60] flex items-center justify-center bg-[rgba(22,32,25,0.42)] p-4"
      onClick={onClose}
    >
      <div
        data-testid="auth-dialog-panel"
        className="panel relative w-full max-w-xl overflow-hidden p-8"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full border border-[var(--line)] bg-white/70 p-2"
          aria-label="Close auth dialog"
        >
          <X />
        </button>
        <div className="mb-6 flex flex-col gap-2">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
            Account required
          </p>
          <h2 className="display-title text-4xl">Sign in to continue</h2>
          <p className="max-w-[48ch] text-sm leading-relaxed text-[var(--muted)]">
            You can keep exploring freely. We only ask for an account when you
            want to save, create, or interact.
          </p>
        </div>
        <AuthForm
          mode="login"
          onSuccess={(user) => {
            const nextPath =
              user.role === "ADMIN" ? "/admin/recipes/pending" : destination;
            onClose();
            router.push(nextPath);
            router.refresh();
          }}
        />
        <button
          type="button"
          onClick={onClose}
          className="mt-4 text-sm text-[var(--muted)] underline-offset-4 hover:underline"
        >
          Continue browsing
        </button>
      </div>
    </div>,
    document.body
  );
}
