"use client";

import { useState } from "react";
import { RECIPE_STATUS_LABELS } from "@/lib/constants/recipes";
import { StatusBadge } from "../ui/status-badge";
import { Tabs } from "../ui/tabs";

export function ProfileTabs({
  recipes,
  saved
}: {
  recipes: any[];
  saved: any[];
}) {
  const [tab, setTab] = useState<"recipes" | "saved">("recipes");
  const activeList = tab === "recipes" ? recipes : saved;

  return (
    <div className="space-y-6">
      <Tabs
        value={tab}
        onChange={setTab}
        items={[
          { value: "recipes", label: "My Recipes" },
          { value: "saved", label: "Saved" }
        ]}
      />
      <div className="grid gap-4">
        {activeList.map((item) => (
          <div key={item.id} className="panel flex items-center justify-between p-4">
            <div className="flex flex-col gap-2">
              <p className="text-lg">{item.title}</p>
              {"status" in item ? (
                <StatusBadge
                  status={item.status}
                  label={RECIPE_STATUS_LABELS[item.status as keyof typeof RECIPE_STATUS_LABELS].en}
                />
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
