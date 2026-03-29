"use client";

import { ArrowUpRight, PlusCircle } from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "@/lib/store";
import { AuthDialog } from "@/components/auth/auth-dialog";
import { Button, buttonVariants } from "@/components/ui/button";

export function HeroActions() {
  const router = useRouter();
  const auth = useSelector((state: RootState) => state.auth);
  const [authDialogOpen, setAuthDialogOpen] = useState(false);

  const handleShareRecipe = () => {
    if (auth.status === "authenticated") {
      router.push("/my-recipes/new");
      return;
    }

    setAuthDialogOpen(true);
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          size="lg"
          onClick={handleShareRecipe}
          className="border border-white/10 bg-white/15 text-white shadow-[0_14px_30px_-18px_rgba(22,32,25,0.3)] backdrop-blur-sm hover:bg-white/25"
        >
          <PlusCircle weight="duotone" className="mr-2 text-lg" />
          Share a recipe
        </Button>
        <Link
          href="#trending"
          className={buttonVariants({
            variant: "ghost",
            size: "lg"
          })}
          style={{ color: "rgba(255,255,255,0.78)" }}
        >
          <ArrowUpRight weight="duotone" className="mr-2 text-lg" />
          Browse trending
        </Link>
      </div>
      <AuthDialog
        open={authDialogOpen}
        onClose={() => setAuthDialogOpen(false)}
        destination="/my-recipes/new"
      />
    </>
  );
}
