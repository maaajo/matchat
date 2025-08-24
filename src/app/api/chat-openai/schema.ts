import { z } from "zod";
import type { ResponseCreateParams } from "openai/resources/responses/responses";

const messageSchema = z.object({
  role: z.custom<ChatCompletionRole>(),
});
