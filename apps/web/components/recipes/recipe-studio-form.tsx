"use client";

import { useEffect, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { apiWrite } from "@/lib/api";
import { Button } from "../ui/button";
import { CardSurface } from "../ui/card-surface";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { RecipeImageUploadField } from "./recipe-image-upload-field";

type RecipeFormValues = {
  title: string;
  shortDescription: string;
  prepMinutes: number;
  cookMinutes: number;
  servings: number;
  category: string;
  cuisine: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  locale: "vi" | "en";
  coverImageUrl?: string;
  images: { imageUrl: string; caption?: string; sortOrder: number }[];
  ingredients: { name: string; quantity: number; unit: string; sortOrder: number }[];
  steps: { stepNumber: number; instruction: string }[];
};

export function RecipeStudioForm({
  recipeId,
  initialValues
}: {
  recipeId?: string;
  initialValues?: Partial<RecipeFormValues>;
}) {
  const [submissionMode, setSubmissionMode] = useState<"draft" | "submit">(
    "draft"
  );
  const [isReady, setIsReady] = useState(false);
  const form = useForm<RecipeFormValues>({
    defaultValues: {
      title: "",
      shortDescription: "",
      prepMinutes: 10,
      cookMinutes: 20,
      servings: 2,
      category: "Dinner",
      cuisine: "Vietnamese",
      difficulty: "MEDIUM",
      locale: "vi",
      coverImageUrl: "",
      images: [],
      ingredients: [{ name: "", quantity: 1, unit: "pcs", sortOrder: 1 }],
      steps: [{ stepNumber: 1, instruction: "" }],
      ...initialValues
    }
  });

  const ingredients = useFieldArray({
    control: form.control,
    name: "ingredients"
  });
  const steps = useFieldArray({
    control: form.control,
    name: "steps"
  });

  useEffect(() => {
    setIsReady(true);
  }, []);

  return (
    <form
      onSubmit={form.handleSubmit(async (values) => {
        const images = values.images ?? [];
        const ingredients = values.ingredients ?? [];
        const steps = values.steps ?? [];
        const normalizedCoverImageUrl = values.coverImageUrl?.trim() || undefined;
        const payload = {
          ...values,
          coverImageUrl: normalizedCoverImageUrl,
          prepMinutes: Number(values.prepMinutes),
          cookMinutes: Number(values.cookMinutes),
          servings: Number(values.servings),
          images:
            images.length > 0
              ? images
              : normalizedCoverImageUrl
                ? [{ imageUrl: normalizedCoverImageUrl, sortOrder: 1 }]
                : [],
          ingredients: ingredients.map((ingredient, index) => ({
            ...ingredient,
            quantity: Number(ingredient.quantity),
            sortOrder: index + 1
          })),
          steps: steps.map((step, index) => ({
            instruction: step.instruction,
            stepNumber: index + 1
          }))
        };

        const draftResponse = await apiWrite<{ recipe: { id: string } }>(
          recipeId ? `/recipes/${recipeId}` : "/recipes",
          {
            method: recipeId ? "PATCH" : "POST",
            body: JSON.stringify(payload)
          }
        );

        if (submissionMode === "submit") {
          await apiWrite(`/recipes/${draftResponse.recipe.id}/submit`, {
            method: "POST",
            body: JSON.stringify({})
          });
        }

        window.location.href = "/profile";
      })}
      className="grid gap-8"
    >
      <CardSurface className="grid gap-4 p-6">
        <Input {...form.register("title")} placeholder="Recipe title" />
        <Textarea
          {...form.register("shortDescription")}
          placeholder="Short description"
          className="min-h-28"
        />
        <div className="grid gap-3 md:grid-cols-3">
          <Input
            type="number"
            {...form.register("prepMinutes", { valueAsNumber: true })}
            placeholder="Prep minutes"
          />
          <Input
            type="number"
            {...form.register("cookMinutes", { valueAsNumber: true })}
            placeholder="Cook minutes"
          />
          <Input
            type="number"
            {...form.register("servings", { valueAsNumber: true })}
            placeholder="Servings"
          />
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <Input {...form.register("category")} placeholder="Category" />
          <Input {...form.register("cuisine")} placeholder="Cuisine" />
          <select
            {...form.register("difficulty")}
            className="min-h-12 rounded-2xl border border-[var(--line)] bg-transparent px-4"
          >
            <option value="EASY">Easy</option>
            <option value="MEDIUM">Medium</option>
            <option value="HARD">Hard</option>
          </select>
        </div>
        <select
          {...form.register("locale")}
          className="min-h-12 rounded-2xl border border-[var(--line)] bg-transparent px-4"
        >
          <option value="vi">Tiếng Việt</option>
          <option value="en">English</option>
        </select>
        <Input {...form.register("coverImageUrl")} placeholder="Cover image URL" />
        <RecipeImageUploadField
          onUploaded={(imageUrl) => {
            form.setValue("coverImageUrl", imageUrl);
            form.setValue("images", [{ imageUrl, sortOrder: 1 }]);
          }}
        />
      </CardSurface>

      <CardSurface className="grid gap-4 p-6">
        {ingredients.fields.map((field, index) => (
          <div key={field.id} className="grid gap-3 md:grid-cols-3">
            <Input
              {...form.register(`ingredients.${index}.name`)}
              placeholder="Ingredient"
            />
            <Input
              type="number"
              step="0.01"
              {...form.register(`ingredients.${index}.quantity`, {
                valueAsNumber: true
              })}
              placeholder="Qty"
            />
            <Input
              {...form.register(`ingredients.${index}.unit`)}
              placeholder="Unit"
            />
          </div>
        ))}
        <Button
          type="button"
          variant="secondary"
          disabled={!isReady}
          onClick={() =>
            ingredients.append({
              name: "",
              quantity: 1,
              unit: "pcs",
              sortOrder: ingredients.fields.length + 1
            })
          }
        >
          Add ingredient
        </Button>
      </CardSurface>

      <CardSurface className="grid gap-4 p-6">
        {steps.fields.map((field, index) => (
          <Textarea
            key={field.id}
            {...form.register(`steps.${index}.instruction`)}
            placeholder={`Step ${index + 1}`}
          />
        ))}
        <Button
          type="button"
          variant="secondary"
          disabled={!isReady}
          onClick={() =>
            steps.append({
              stepNumber: steps.fields.length + 1,
              instruction: ""
            })
          }
        >
          Add step
        </Button>
      </CardSurface>

      <div className="flex flex-col gap-3 md:flex-row">
        <Button
          type="submit"
          disabled={!isReady}
          onClick={() => setSubmissionMode("draft")}
        >
          Save draft
        </Button>
        <Button
          type="submit"
          variant="secondary"
          disabled={!isReady}
          onClick={() => setSubmissionMode("submit")}
        >
          Save and submit for review
        </Button>
      </div>
    </form>
  );
}
