import { z } from "zod";

const imageSchema = z.object({
  imageUrl: z.string().url(),
  caption: z.string().optional(),
  sortOrder: z.number().int().min(1)
});

const ingredientSchema = z.object({
  name: z.string().min(1),
  quantity: z.number().positive(),
  unit: z.string().min(1),
  sortOrder: z.number().int().min(1)
});

const stepSchema = z.object({
  stepNumber: z.number().int().min(1),
  instruction: z.string().min(5)
});

export const recipeInputSchema = z.object({
  title: z.string().min(3),
  shortDescription: z.string().min(10),
  prepMinutes: z.number().int().min(0),
  cookMinutes: z.number().int().min(0),
  servings: z.number().int().min(1),
  category: z.string().min(2),
  cuisine: z.string().min(2),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]),
  locale: z.enum(["vi", "en"]).optional().default("vi"),
  coverImageUrl: z.string().url().optional(),
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
