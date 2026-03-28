import { z } from "zod";

export const updateProfileSchema = z.object({
  body: z.object({
    displayName: z.string().min(2).optional(),
    username: z.string().min(3).optional(),
    avatarUrl: z.string().url().optional(),
    bio: z.string().max(240).optional(),
    locale: z.enum(["vi", "en"]).optional()
  }),
  params: z.object({}),
  query: z.object({})
});
