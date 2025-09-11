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

type GenerateChatTitleSuccessResponse = {
  error: false;
  title: string;
  errorMessage?: never;
};

type GenerateChatTitleErrorResponse = {
  error: true;
  title?: never;
  errorMessage: string;
};

export const generateChatTitle = async (
  input: ChatInputContent,
): Promise<
  GenerateChatTitleSuccessResponse | GenerateChatTitleErrorResponse
> => {
  const parsed = await chatInputContentSchema.safeParseAsync(input);

  if (!parsed.success) {
    return {
      error: true,
      errorMessage: `Invalid input for title generation, error: ${parsed.error?.toString()}`,
    };
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
    return {
      error: true,
      errorMessage: `Couldn't generate chat title, error: ${response.error.message}`,
    };
  }

  if (!response.output_parsed) {
    return {
      error: true,
      errorMessage: `Structured output not available`,
    };
  }

  return {
    title: response.output_parsed.title,
    error: false,
  };
};
