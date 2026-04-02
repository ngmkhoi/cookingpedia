import { z } from "zod";

export const updateProfileSchema = z.object({
  body: z.object({
    displayName: z.string().trim().min(2, "Display name must be at least 2 characters").optional(),
    username: z.string().trim().min(3, "Username must be at least 3 characters").optional(),
    avatarUrl: z.string().trim().url("Enter a valid URL").nullable().optional(),
    bio: z.string().trim().max(240, "Bio must be 240 characters or less").nullable().optional(),
    locale: z.enum(["vi", "en"]).optional()
  }),
  params: z.object({}),
  query: z.object({})
});
