"use client";

import Link from "next/link";
import { useSelector } from "react-redux";
import type { RootState } from "@/lib/store";
import { SITE_NAME } from "@/lib/constants/site";

const discoverLinks = [
  { href: "/search", label: "Search" },
  { href: "/#trending", label: "Trending" }
];

const categoryLinks = ["Dinner", "Lunch", "Breakfast", "Drinks", "Dessert"];

export function SiteFooter() {
  const auth = useSelector((state: RootState) => state.auth);

  const accountLinks =
    auth.status === "authenticated"
      ? [
          { href: "/profile", label: "Profile" },
          { href: "/profile", label: "Saved" },
          { href: "/settings/profile", label: "Settings" }
        ]
      : [
          { href: "/login", label: "Login" },
          { href: "/register", label: "Register" }
        ];

  return (
    <footer className="page-shell pb-8 pt-16">
      <div className="panel overflow-hidden">
        <div className="grid gap-10 p-8 md:grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr] md:p-10">
          <div className="space-y-4">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--ink)]">
              {SITE_NAME}
            </p>
            <p className="max-w-[28ch] text-sm leading-relaxed text-[var(--muted)]">
              Structured recipe discovery with clearer pathways into cooking,
              collecting, and publishing.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-[var(--ink)]">
              Discover
            </h3>
            <div className="flex flex-col gap-2.5 text-sm text-[var(--muted)]">
              {discoverLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="w-fit transition-colors duration-200 hover:text-[var(--accent)]"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-[var(--ink)]">
              Account
            </h3>
            <div className="flex flex-col gap-2.5 text-sm text-[var(--muted)]">
              {accountLinks.map((link) => (
                <Link
                  key={`${link.href}-${link.label}`}
                  href={link.href}
                  className="w-fit transition-colors duration-200 hover:text-[var(--accent)]"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-[var(--ink)]">
              Categories
            </h3>
            <div className="flex flex-col gap-2.5 text-sm text-[var(--muted)]">
              {categoryLinks.map((category) => (
                <Link
                  key={category}
                  href={`/search?q=${encodeURIComponent(category)}`}
                  className="w-fit transition-colors duration-200 hover:text-[var(--accent)]"
                >
                  {category}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col items-center justify-between gap-4 border-t border-[var(--line-subtle)] px-8 py-5 text-xs text-[var(--muted-warm)] md:flex-row md:px-10">
          <p>
            &copy; {new Date().getFullYear()} {SITE_NAME}. All rights reserved.
          </p>
          <div className="flex items-center gap-5">
            <Link
              href="/privacy"
              className="transition-colors duration-200 hover:text-[var(--accent)]"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="transition-colors duration-200 hover:text-[var(--accent)]"
            >
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
