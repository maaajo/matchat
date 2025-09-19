import { z } from "zod";
import { chatInputContentSchema } from "@/app/api/chat-openai/schema";
import { MESSAGE_VARIANTS } from "@/modules/chat/lib/constants";

export const chatCreateInputSchema = z.object({
  id: z.string().min(1, "id is required"),
  userChatMessage: chatInputContentSchema,
  lastValidResponseId: z.string().optional(),
});

export type ChatCreateInput = z.infer<typeof chatCreateInputSchema>;

export const chatDeleteInputSchema = z.object({
  id: z.string().min(1, "id is required"),
});

export const chatUpdateInputSchema = z.object({
  id: z.string().min(1, "id is required"),
  userChatMessage: chatInputContentSchema.optional(),
  lastValidResponseId: z.string().optional(),
  title: z.string().optional(),
});

export const messageAddInputSchema = z.array(
  z.object({
    id: z.string().optional(),
    chatId: z.string(),
    role: z.enum([
      MESSAGE_VARIANTS.USER,
      MESSAGE_VARIANTS.ASSISTANT,
      MESSAGE_VARIANTS.SYSTEM,
    ]),
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
