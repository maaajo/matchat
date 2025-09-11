import { chatInputContentSchema } from "@/app/api/chat-openai/schema";
import { db } from "@/db";
import { chat } from "@/db/schema";
import { generateChatTitle } from "@/modules/chat/lib/ai/utils";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { TRPCError } from "@trpc/server";

export const chatRouter = createTRPCRouter({
  create: protectedProcedure
    .input(chatInputContentSchema)
    .mutation(async ({ input, ctx }) => {
      const generateChatTitleResponse = await generateChatTitle(input);

      if (generateChatTitleResponse.error) {
        throw new TRPCError({
          message: generateChatTitleResponse.errorMessage,
          code: "INTERNAL_SERVER_ERROR",
        });
      }

      const [createdChat] = await db
        .insert(chat)
        .values({
          title: generateChatTitleResponse.title,
          userId: ctx.auth.user.id,
        })
        .returning();

      return createdChat;
    }),
});
