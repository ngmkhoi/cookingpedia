"use client";

import { useState } from "react";
import { Button } from "../ui/button";

export function RecipeImageUploadField({
  onUploaded
}: {
  onUploaded: (imageUrl: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

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

          setUploadError("");
          setUploading(true);
          const formData = new FormData();
          formData.append("file", file);

          try {
            const response = await fetch(
              `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api"}/uploads/recipe-images`,
              {
                method: "POST",
                credentials: "include",
                body: formData
              }
            );

            const data = (await response.json()) as {
              imageUrl?: string;
              message?: string;
            };

            if (!response.ok || !data.imageUrl) {
              setUploadError(
                data.message === "INVALID_IMAGE"
                  ? "Please upload a valid image file."
                  : "Image upload failed. Please try again."
              );
              return;
            }

            onUploaded(data.imageUrl);
          } catch {
            setUploadError("Image upload failed. Please try again.");
          } finally {
            setUploading(false);
            event.target.value = "";
          }
        }}
      />
      <Button type="button" variant="secondary" disabled={uploading}>
        {uploading ? "Uploading image..." : "Image upload ready"}
      </Button>
      {uploadError ? (
        <p className="text-sm text-red-600">{uploadError}</p>
      ) : null}
    </div>
  );
}
