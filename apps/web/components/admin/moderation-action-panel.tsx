"use client";

import { apiWrite } from "@/lib/api";
import { Button } from "../ui/button";
import { CardSurface } from "../ui/card-surface";

export function ModerationActionPanel({ recipeId }: { recipeId: string }) {
  return (
    <CardSurface className="grid gap-3 p-6">
      <Button
        onClick={async () => {
          await apiWrite(`/admin/recipes/${recipeId}/approve`, {
            method: "POST",
            body: JSON.stringify({})
          });
          window.location.href = "/admin/recipes/pending";
        }}
      >
        Approve
      </Button>
      <Button
        variant="secondary"
        onClick={async () => {
          await apiWrite(`/admin/recipes/${recipeId}/reject`, {
            method: "POST",
            body: JSON.stringify({
              rejectionReason: "Recipe needs clearer ingredient amounts."
            })
          });
          window.location.href = "/admin/recipes/pending";
        }}
      >
        Reject
      </Button>
    </CardSurface>
  );
}
