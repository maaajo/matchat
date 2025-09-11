import { z } from "zod";

export const chatCreateSchema = z.object({
  title: z
    .string()
    .min(1, { message: "Chat title is required when inserting" }),
});
