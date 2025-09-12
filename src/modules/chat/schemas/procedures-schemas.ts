import { z } from "zod";
import { chatInputContentSchema } from "@/app/api/chat-openai/schema";

export const chatCreateInputSchema = z.object({
  id: z.string().min(1, "id is required"),
  userChatMessage: chatInputContentSchema,
});

export type ChatCreateInput = z.infer<typeof chatCreateInputSchema>;
