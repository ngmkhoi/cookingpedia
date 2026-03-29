import { z } from "zod";

const emailSchema = z
  .string()
  .trim()
  .min(1, "Email is required")
  .email("Enter a valid email address");

const passwordSchema = z
  .string()
  .min(1, "Password is required")
  .min(8, "Password must be at least 8 characters");

export const registerSchema = z.object({
  body: z.object({
    email: emailSchema,
    password: passwordSchema,
    displayName: z
      .string()
      .trim()
      .min(1, "Display name is required")
      .min(2, "Display name must be at least 2 characters"),
    username: z
      .string()
      .trim()
      .min(1, "Username is required")
      .min(3, "Username must be at least 3 characters")
  }),
  params: z.object({}),
  query: z.object({})
});

export const loginSchema = z.object({
  body: z.object({
    email: emailSchema,
    password: passwordSchema
  }),
  params: z.object({}),
  query: z.object({})
});
