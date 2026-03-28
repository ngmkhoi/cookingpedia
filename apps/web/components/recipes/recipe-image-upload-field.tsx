"use client";

import { useState } from "react";
import { Button } from "../ui/button";

export function RecipeImageUploadField({
  onUploaded
}: {
  onUploaded: (imageUrl: string) => void;
}) {
  const [uploading, setUploading] = useState(false);

  return (
    <div className="grid gap-2">
      <label className="text-sm text-[var(--muted)]">Upload cover image</label>
      <input
        type="file"
        accept="image/*"
        onChange={async (event) => {
          const file = event.target.files?.[0];
          if (!file) {
            return;
          }

          setUploading(true);
          const formData = new FormData();
          formData.append("file", file);

          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api"}/uploads/recipe-images`,
            {
              method: "POST",
              credentials: "include",
              body: formData
            }
          );

          const data = await response.json();
          onUploaded(data.imageUrl);
          setUploading(false);
        }}
      />
      <Button type="button" variant="secondary" disabled={uploading}>
        {uploading ? "Uploading image..." : "Image upload ready"}
      </Button>
    </div>
  );
}
