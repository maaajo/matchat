import "server-only";

import { z } from "zod";
import OpenAI from "openai";
import { generateChatTitlePrompt } from "@/modules/chat/lib/ai/prompts";
import {
  ChatInputContent,
  chatInputContentSchema,
} from "@/app/api/chat-openai/schema";
import { zodTextFormat } from "openai/helpers/zod";

const generateChatTitleOutputSchema = z.object({
  title: z.string().min(1).max(80),
});

export const generateChatTitle = async (input: ChatInputContent) => {
  const parsed = await chatInputContentSchema.safeParseAsync(input);

  if (!parsed.success) {
    throw new Error(
      `Invalid input for title generation, error: ${parsed.error?.toString()}`,
    );
  }

  const openai = new OpenAI();

  const response = await openai.responses.parse({
    instructions: generateChatTitlePrompt,
    model: "gpt-5-nano",
    input,
    text: {
      format: zodTextFormat(generateChatTitleOutputSchema, "title"),
    },
  });

  if (response.error) {
    throw new Error("Couldn't generate chat title", {
      cause: response.error.message,
    });
  }

  if (!response.output_parsed) {
    throw new Error(
      "Structured output not available from chat title generation",
      {
        cause: "Structured output missing",
      },
    );
  }

  return response.output_parsed.title;
};
