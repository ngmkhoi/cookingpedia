"use client";

import {
  SignIn,
  UserCircle,
  CaretDown,
  SignOut,
  Gear,
  BookOpen,
  Heart
} from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { apiWrite } from "@/lib/api";
import { clearAuthState } from "@/features/auth/auth-slice";
import { MAIN_NAV, SITE_NAME } from "@/lib/constants/site";
import type { RootState } from "@/lib/store";
import { buttonVariants } from "../ui/button";

export function SiteHeader() {
  const auth = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!menuRef.current) {
        return;
      }

      if (!menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    window.addEventListener("mousedown", handleClickOutside);
    return () => window.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = async () => {
    await apiWrite("/auth/logout", {
      method: "POST",
      body: JSON.stringify({})
    });
    dispatch(clearAuthState());
    setOpen(false);
    router.push("/");
    router.refresh();
  };

  return (
    <header
      className={`fixed left-1/2 z-40 flex -translate-x-1/2 items-center justify-between px-6 py-3 transition-all duration-500 ${
        scrolled
          ? "top-3 max-w-[min(1360px,calc(100%-2rem))] rounded-[2rem] border border-[var(--line-subtle)] bg-[var(--canvas)]/85 shadow-[0_8px_32px_-8px_rgba(22,32,25,0.12)] backdrop-blur-xl"
          : "top-4 max-w-[1400px] rounded-[2.5rem] bg-transparent px-5 md:px-8"
      }`}
      style={{ width: "calc(100% - 2rem)" }}
    >
      <Link
        href="/"
        className={`text-lg font-semibold uppercase tracking-[0.18em] transition-colors duration-300 ${
          scrolled ? "text-[var(--ink)]" : "text-white"
        }`}
      >
        {SITE_NAME}
      </Link>
      <nav className="flex items-center gap-2 text-sm">
        <Link
          href={MAIN_NAV[0].href}
          className={`rounded-[1.2rem] px-4 py-2.5 transition-all duration-200 ${
            scrolled
              ? "border border-[var(--line)] bg-[var(--panel)] text-[var(--ink)] hover:bg-[var(--panel-soft)]"
              : "border border-white/15 bg-white/10 text-white/90 backdrop-blur-sm hover:bg-white/20"
          }`}
        >
          {MAIN_NAV[0].label.en}
        </Link>
        <Link
          href={MAIN_NAV[1].href}
          className={`rounded-[1.2rem] px-4 py-2.5 transition-all duration-200 ${
            scrolled
              ? "text-[var(--muted)] hover:bg-black/5"
              : "text-white/70 hover:text-white"
          }`}
        >
          {MAIN_NAV[1].label.en}
        </Link>
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            className={`inline-flex items-center rounded-[1.2rem] px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
              auth.status === "authenticated"
                ? scrolled
                  ? "bg-[var(--accent-strong)] text-white shadow-[0_10px_24px_-14px_rgba(50,65,50,0.4)]"
                  : "border border-white/20 bg-white/15 text-white backdrop-blur-sm hover:bg-white/25"
                : scrolled
                  ? "border border-[var(--line)] bg-[var(--panel)] text-[var(--ink)] hover:bg-[var(--panel-soft)]"
                  : "border border-white/15 bg-white/10 text-white/90 backdrop-blur-sm hover:bg-white/20"
            }`}
            aria-expanded={open}
            aria-haspopup="menu"
          >
            {auth.status === "authenticated" ? (
              <>
                <UserCircle weight="duotone" className="mr-2 text-base" />
                <span>{auth.user?.displayName ?? "Profile"}</span>
              </>
            ) : (
              <>
                <SignIn weight="duotone" className="mr-2 text-base" />
                <span>Login / Register</span>
              </>
            )}
            <CaretDown weight="bold" className="ml-2 text-xs" />
          </button>

          {open ? (
            <div
              className="panel absolute right-0 top-[calc(100%+0.75rem)] z-20 min-w-[220px] rounded-[1.5rem] p-2"
              role="menu"
            >
              {auth.status === "authenticated" ? (
                <div className="flex flex-col gap-0.5">
                  {auth.user?.role === "ADMIN" ? (
                    <Link
                      href="/admin/recipes/pending"
                      className="rounded-[1rem] px-4 py-3 text-sm transition-colors hover:bg-black/5"
                      onClick={() => setOpen(false)}
                    >
                      <BookOpen
                        weight="duotone"
                        className="mr-2 inline text-base"
                      />
                      Moderation queue
                    </Link>
                  ) : null}
                  <Link
                    href="/profile"
                    className="rounded-[1rem] px-4 py-3 text-sm transition-colors hover:bg-black/5"
                    onClick={() => setOpen(false)}
                  >
                    <UserCircle
                      weight="duotone"
                      className="mr-2 inline text-base"
                    />
                    Profile
                  </Link>
                  <Link
                    href="/profile"
                    className="rounded-[1rem] px-4 py-3 text-sm transition-colors hover:bg-black/5"
                    onClick={() => setOpen(false)}
                  >
                    <BookOpen
                      weight="duotone"
                      className="mr-2 inline text-base"
                    />
                    My Recipes
                  </Link>
                  <Link
                    href="/profile"
                    className="rounded-[1rem] px-4 py-3 text-sm transition-colors hover:bg-black/5"
                    onClick={() => setOpen(false)}
                  >
                    <Heart
                      weight="duotone"
                      className="mr-2 inline text-base"
                    />
                    Saved
                  </Link>
                  <Link
                    href="/settings/profile"
                    className="rounded-[1rem] px-4 py-3 text-sm transition-colors hover:bg-black/5"
                    onClick={() => setOpen(false)}
                  >
                    <Gear
                      weight="duotone"
                      className="mr-2 inline text-base"
                    />
                    Settings
                  </Link>
                  <div className="my-1 h-px bg-[var(--line-subtle)]" />
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="rounded-[1rem] px-4 py-3 text-left text-sm transition-colors hover:bg-black/5"
                  >
                    <SignOut
                      weight="duotone"
                      className="mr-2 inline text-base"
                    />
                    Logout
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-0.5">
                  <Link
                    href="/login"
                    className="rounded-[1rem] px-4 py-3 text-sm transition-colors hover:bg-black/5"
                    onClick={() => setOpen(false)}
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    className="rounded-[1rem] px-4 py-3 text-sm transition-colors hover:bg-black/5"
                    onClick={() => setOpen(false)}
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </nav>
    </header>
  );
}
