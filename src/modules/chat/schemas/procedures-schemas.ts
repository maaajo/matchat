import { z } from "zod";
import { chatInputContentSchema } from "@/app/api/chat-openai/schema";

export const chatCreateInputSchema = z.object({
  id: z.string().min(1, "id is required"),
  userChatMessage: chatInputContentSchema,
});

export type ChatCreateInput = z.infer<typeof chatCreateInputSchema>;

export const chatDeleteInputSchema = z.object({
  id: z.string().min(1, "id is required"),
});

export const MESSAGE_ROLE = {
  USER: "user",
  ASSISTANT: "assistant",
  SYSTEM: "system",
} as const;

export const messageRoleSchema = z.enum([
  MESSAGE_ROLE.USER,
  MESSAGE_ROLE.ASSISTANT,
  MESSAGE_ROLE.SYSTEM,
]);
export type MessageRole = z.infer<typeof messageRoleSchema>;

export const messageAddInputSchema = z.array(
  z.object({
    id: z.string().optional(),
    chatId: z.string(),
    role: messageRoleSchema,
    content: z.string(),
    createdAt: z
      .string()
      .datetime()
      .transform(str => new Date(str))
      .optional(),
    attachments: z.any().optional(),
    aborted: z.boolean(),
    abortedReason: z.string().optional(),
  }),
);
