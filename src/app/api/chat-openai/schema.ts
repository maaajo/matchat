import { z } from "zod";

// Message object used when providing an array of messages to the OpenAI API
const chatMessageInputSchema = z.object({
  type: z.literal("message").optional(),
  role: z.enum(["user", "system", "developer", "assistant"], {
    errorMap: () => ({
      message: "Role must be one of: user, system, developer, or assistant",
    }),
  }),
  content: z.string().min(1, "Message content cannot be empty"),
});

// Array of message objects
const chatMessagesInputSchema = z.array(chatMessageInputSchema);

// The accepted value for the `input` field: either a non-empty string or an array of messages
const chatInputContentSchema = z.union(
  [z.string().min(1, "Input cannot be empty"), chatMessagesInputSchema],
  {
    errorMap: () => ({
      message:
        "Input must be either a non-empty string or an array of message objects",
    }),
  },
);

const chatInputSchema = z
  .object({
    input: chatInputContentSchema,
    previous_response_id: z.string().optional(),
    model: z.string().optional(),
  })
  .strict();

export { chatInputSchema, chatInputContentSchema };

// Export the TypeScript types
export type ChatInput = z.infer<typeof chatInputSchema>;
export type ChatInputContent = z.infer<typeof chatInputContentSchema>;
