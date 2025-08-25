import { z } from "zod";

// Define the ResponseInputItem schema for message inputs
const ResponseInputItemSchema = z.object({
  type: z.literal("message").optional(),
  role: z.enum(["user", "system", "developer", "assistant"], {
    errorMap: () => ({
      message: "Role must be one of: user, system, developer, or assistant",
    }),
  }),
  content: z.string().min(1, "Message content cannot be empty"),
});

// Define the ResponseInput schema as an array of ResponseInputItem
const ResponseInputSchema = z.array(ResponseInputItemSchema);

const chatInputSchema = z.object({
  input: z.union(
    [z.string().min(1, "Input cannot be empty"), ResponseInputSchema],
    {
      errorMap: () => ({
        message:
          "Input must be either a non-empty string or an array of message objects",
      }),
    },
  ),
  previous_response_id: z.string().optional(),
  model: z.string().optional(),
});

export { chatInputSchema };

// Export the TypeScript type for the input schema
export type ChatInput = z.infer<typeof chatInputSchema>;
