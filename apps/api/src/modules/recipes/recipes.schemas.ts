import { z } from "zod";

const imageSchema = z.object({
  imageUrl: z.string().url("Enter a valid image URL"),
  caption: z.string().optional(),
  sortOrder: z.number().int().min(1)
});

const ingredientSchema = z.object({
  name: z.string().trim().min(1, "Ingredient name is required"),
  quantity: z.number().positive("Quantity must be greater than 0"),
  unit: z.string().trim().min(1, "Unit is required"),
  sortOrder: z.number().int().min(1)
});

const stepSchema = z.object({
  stepNumber: z.number().int().min(1),
  instruction: z
    .string()
    .trim()
    .min(1, "Step instruction is required")
    .min(5, "Step instruction must be at least 5 characters")
});

export const recipeInputSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Recipe title is required")
    .min(3, "Recipe title must be at least 3 characters"),
  shortDescription: z
    .string()
    .trim()
    .min(1, "Short description is required")
    .min(10, "Short description must be at least 10 characters"),
  prepMinutes: z.number().int().min(0),
  cookMinutes: z.number().int().min(0),
  servings: z.number().int().min(1),
  category: z
    .string()
    .trim()
    .min(1, "Category is required")
    .min(2, "Category must be at least 2 characters"),
  cuisine: z
    .string()
    .trim()
    .min(1, "Cuisine is required")
    .min(2, "Cuisine must be at least 2 characters"),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]),
  locale: z.enum(["vi", "en"]).optional().default("vi"),
  coverImageUrl: z.string().trim().url("Enter a valid image URL").optional(),
  images: z.array(imageSchema),
  ingredients: z.array(ingredientSchema).min(1),
  steps: z.array(stepSchema).min(1)
});

export const createRecipeSchema = z.object({
  body: recipeInputSchema,
  params: z.object({}),
  query: z.object({})
});

export const updateRecipeSchema = z.object({
  body: recipeInputSchema,
  params: z.object({
    id: z.string().min(1)
  }),
  query: z.object({})
});
