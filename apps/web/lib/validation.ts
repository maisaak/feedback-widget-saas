import { z } from "zod";

export const apiKeySchema = z.string().uuid();

export const feedbackSchema = z.object({
  message: z.string().trim().min(1).max(5000),
  email: z.string().email().optional(),
  rating: z.number().int().min(1).max(5).optional(),
  metadata: z
    .record(z.string(), z.unknown())
    .refine((value) => {
      try {
        return JSON.stringify(value).length <= 4000;
      } catch {
        return false;
      }
    }, "Metadata must serialize to at most 4000 characters")
    .optional(),
});
