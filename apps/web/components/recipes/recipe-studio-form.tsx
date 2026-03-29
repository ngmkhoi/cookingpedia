"use client";

import { useEffect, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { FormFieldShell } from "@/components/forms/form-field-shell";
import { applyApiFormErrors } from "@/lib/form-errors";
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

const validateMinLength = (label: string, min: number) => (value: string) => {
  const trimmed = value.trim();

  if (!trimmed) {
    return `${label} is required`;
  }

  if (trimmed.length < min) {
    return `${label} must be at least ${min} characters`;
  }

  return true;
};

const validateNonNegativeNumber = (label: string) => (value: number) => {
  if (!Number.isFinite(value)) {
    return `${label} is required`;
  }

  if (value < 0) {
    return `${label} must be 0 or greater`;
  }

  return true;
};

const validatePositiveNumber = (label: string) => (value: number) => {
  if (!Number.isFinite(value)) {
    return `${label} is required`;
  }

  if (value <= 0) {
    return `${label} must be at least 1`;
  }

  return true;
};

const validateQuantity = (value: number) => {
  if (!Number.isFinite(value)) {
    return "Quantity is required";
  }

  if (value <= 0) {
    return "Quantity must be greater than 0";
  }

  return true;
};

const validateOptionalUrl = (value?: string) => {
  const trimmed = value?.trim() ?? "";

  if (!trimmed) {
    return true;
  }

  try {
    new URL(trimmed);
    return true;
  } catch {
    return "Enter a valid image URL";
  }
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
  const [formError, setFormError] = useState("");
  const [isReady, setIsReady] = useState(false);
  const form = useForm<RecipeFormValues>({
    mode: "onBlur",
    reValidateMode: "onChange",
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

  const hasFieldErrors = Object.keys(form.formState.errors).length > 0;

  return (
    <form
      onSubmit={form.handleSubmit(async (values) => {
        setFormError("");
        const images = values.images ?? [];
        const ingredients = values.ingredients ?? [];
        const steps = values.steps ?? [];
        const normalizedCoverImageUrl = values.coverImageUrl?.trim() || undefined;

        if (submissionMode === "submit" && !normalizedCoverImageUrl) {
          form.setError("coverImageUrl", {
            type: "manual",
            message: "Cover image is required before submitting for review"
          });
          return;
        }

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
            instruction: step.instruction.trim(),
            stepNumber: index + 1
          }))
        };

        let draftResponse: { recipe: { id: string } };

        try {
          draftResponse = await apiWrite<{ recipe: { id: string } }>(
            recipeId ? `/recipes/${recipeId}` : "/recipes",
            {
              method: recipeId ? "PATCH" : "POST",
              body: JSON.stringify(payload)
            }
          );
        } catch (error) {
          const { formError: nextFormError } = applyApiFormErrors<RecipeFormValues>(
            error,
            form.setError
          );
          setFormError(nextFormError || "Unable to save recipe right now.");
          return;
        }

        if (submissionMode === "submit") {
          try {
            await apiWrite(`/recipes/${draftResponse.recipe.id}/submit`, {
              method: "POST",
              body: JSON.stringify({})
            });
          } catch (error) {
            const { formError: nextFormError } = applyApiFormErrors<RecipeFormValues>(
              error,
              form.setError
            );
            setFormError(nextFormError || "Unable to submit recipe right now.");
            return;
          }
        }

        window.location.href = "/my-recipes";
      })}
      className="grid gap-8"
    >
      <CardSurface className="grid gap-4 p-6">
        <FormFieldShell
          label="Recipe title"
          htmlFor="recipe-title"
          error={form.formState.errors.title?.message}
          helperText="Keep it specific and easy to scan."
        >
          <Input
            id="recipe-title"
            aria-invalid={Boolean(form.formState.errors.title)}
            {...form.register("title", {
              validate: validateMinLength("Recipe title", 3)
            })}
            placeholder="Recipe title"
          />
        </FormFieldShell>
        <FormFieldShell
          label="Short description"
          htmlFor="recipe-short-description"
          error={form.formState.errors.shortDescription?.message}
          helperText="Summarize the dish in one useful sentence."
        >
          <Textarea
            id="recipe-short-description"
            aria-invalid={Boolean(form.formState.errors.shortDescription)}
            {...form.register("shortDescription", {
              validate: validateMinLength("Short description", 10)
            })}
            placeholder="Short description"
            className="min-h-28"
          />
        </FormFieldShell>
        <div className="grid gap-3 md:grid-cols-3">
          <FormFieldShell
            label="Prep minutes"
            htmlFor="recipe-prep-minutes"
            error={form.formState.errors.prepMinutes?.message}
          >
            <Input
              id="recipe-prep-minutes"
              type="number"
              aria-invalid={Boolean(form.formState.errors.prepMinutes)}
              {...form.register("prepMinutes", {
                valueAsNumber: true,
                validate: validateNonNegativeNumber("Prep minutes")
              })}
              placeholder="Prep minutes"
            />
          </FormFieldShell>
          <FormFieldShell
            label="Cook minutes"
            htmlFor="recipe-cook-minutes"
            error={form.formState.errors.cookMinutes?.message}
          >
            <Input
              id="recipe-cook-minutes"
              type="number"
              aria-invalid={Boolean(form.formState.errors.cookMinutes)}
              {...form.register("cookMinutes", {
                valueAsNumber: true,
                validate: validateNonNegativeNumber("Cook minutes")
              })}
              placeholder="Cook minutes"
            />
          </FormFieldShell>
          <FormFieldShell
            label="Servings"
            htmlFor="recipe-servings"
            error={form.formState.errors.servings?.message}
          >
            <Input
              id="recipe-servings"
              type="number"
              aria-invalid={Boolean(form.formState.errors.servings)}
              {...form.register("servings", {
                valueAsNumber: true,
                validate: validatePositiveNumber("Servings")
              })}
              placeholder="Servings"
            />
          </FormFieldShell>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <FormFieldShell
            label="Category"
            htmlFor="recipe-category"
            error={form.formState.errors.category?.message}
          >
            <Input
              id="recipe-category"
              aria-invalid={Boolean(form.formState.errors.category)}
              {...form.register("category", {
                validate: validateMinLength("Category", 2)
              })}
              placeholder="Category"
            />
          </FormFieldShell>
          <FormFieldShell
            label="Cuisine"
            htmlFor="recipe-cuisine"
            error={form.formState.errors.cuisine?.message}
          >
            <Input
              id="recipe-cuisine"
              aria-invalid={Boolean(form.formState.errors.cuisine)}
              {...form.register("cuisine", {
                validate: validateMinLength("Cuisine", 2)
              })}
              placeholder="Cuisine"
            />
          </FormFieldShell>
          <FormFieldShell label="Difficulty" htmlFor="recipe-difficulty">
            <select
              id="recipe-difficulty"
              {...form.register("difficulty")}
              className="min-h-12 rounded-2xl border border-[var(--line)] bg-transparent px-4 text-sm text-[var(--ink)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[rgba(81,96,68,0.18)]"
            >
              <option value="EASY">Easy</option>
              <option value="MEDIUM">Medium</option>
              <option value="HARD">Hard</option>
            </select>
          </FormFieldShell>
        </div>
        <FormFieldShell label="Locale" htmlFor="recipe-locale">
          <select
            id="recipe-locale"
            {...form.register("locale")}
            className="min-h-12 rounded-2xl border border-[var(--line)] bg-transparent px-4 text-sm text-[var(--ink)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[rgba(81,96,68,0.18)]"
          >
            <option value="vi">Tiếng Việt</option>
            <option value="en">English</option>
          </select>
        </FormFieldShell>
        <FormFieldShell
          label="Cover image URL"
          htmlFor="recipe-cover-image-url"
          error={form.formState.errors.coverImageUrl?.message}
          helperText="Optional for drafts. Required before submission for review."
        >
          <Input
            id="recipe-cover-image-url"
            aria-invalid={Boolean(form.formState.errors.coverImageUrl)}
            {...form.register("coverImageUrl", {
              validate: validateOptionalUrl
            })}
            placeholder="Cover image URL"
          />
        </FormFieldShell>
        <RecipeImageUploadField
          onUploaded={(imageUrl) => {
            form.setValue("coverImageUrl", imageUrl, {
              shouldDirty: true,
              shouldTouch: true,
              shouldValidate: true
            });
            form.setValue("images", [{ imageUrl, sortOrder: 1 }], {
              shouldDirty: true
            });
          }}
        />
      </CardSurface>

      <CardSurface className="grid gap-4 p-6">
        {ingredients.fields.map((field, index) => (
          <div key={field.id} className="grid gap-3 md:grid-cols-3">
            <FormFieldShell
              label={`Ingredient ${index + 1}`}
              htmlFor={`ingredient-name-${field.id}`}
              error={form.formState.errors.ingredients?.[index]?.name?.message}
            >
              <Input
                id={`ingredient-name-${field.id}`}
                aria-invalid={Boolean(form.formState.errors.ingredients?.[index]?.name)}
                {...form.register(`ingredients.${index}.name`, {
                  validate: (value) => validateMinLength("Ingredient name", 1)(value)
                })}
                placeholder="Ingredient"
              />
            </FormFieldShell>
            <FormFieldShell
              label="Quantity"
              htmlFor={`ingredient-quantity-${field.id}`}
              error={form.formState.errors.ingredients?.[index]?.quantity?.message}
            >
              <Input
                id={`ingredient-quantity-${field.id}`}
                type="number"
                step="0.01"
                aria-invalid={Boolean(form.formState.errors.ingredients?.[index]?.quantity)}
                {...form.register(`ingredients.${index}.quantity`, {
                  valueAsNumber: true,
                  validate: validateQuantity
                })}
                placeholder="Qty"
              />
            </FormFieldShell>
            <FormFieldShell
              label="Unit"
              htmlFor={`ingredient-unit-${field.id}`}
              error={form.formState.errors.ingredients?.[index]?.unit?.message}
            >
              <Input
                id={`ingredient-unit-${field.id}`}
                aria-invalid={Boolean(form.formState.errors.ingredients?.[index]?.unit)}
                {...form.register(`ingredients.${index}.unit`, {
                  validate: (value) => validateMinLength("Unit", 1)(value)
                })}
                placeholder="Unit"
              />
            </FormFieldShell>
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
          <FormFieldShell
            key={field.id}
            label={`Step ${index + 1}`}
            htmlFor={`step-instruction-${field.id}`}
            error={form.formState.errors.steps?.[index]?.instruction?.message}
          >
            <Textarea
              id={`step-instruction-${field.id}`}
              aria-invalid={Boolean(form.formState.errors.steps?.[index]?.instruction)}
              {...form.register(`steps.${index}.instruction`, {
                validate: (value) => validateMinLength("Step instruction", 5)(value)
              })}
              placeholder={`Step ${index + 1}`}
            />
          </FormFieldShell>
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

      {formError ? <p className="text-sm text-[rgba(148,52,45,0.95)]">{formError}</p> : null}

      <div className="flex flex-col gap-3 md:flex-row">
        <Button
          type="submit"
          disabled={!isReady || form.formState.isSubmitting || hasFieldErrors}
          onClick={() => setSubmissionMode("draft")}
        >
          Save draft
        </Button>
        <Button
          type="submit"
          variant="secondary"
          disabled={!isReady || form.formState.isSubmitting || hasFieldErrors}
          onClick={() => setSubmissionMode("submit")}
        >
          Save and submit for review
        </Button>
      </div>
    </form>
  );
}
