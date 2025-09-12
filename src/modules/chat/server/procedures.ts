import { chatCreateInputSchema } from "@/modules/chat/schemas/procedures-schemas";
import { db } from "@/db";
import { chat } from "@/db/schema";
import { generateChatTitle } from "@/modules/chat/lib/ai/utils";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { TRPCError } from "@trpc/server";

export const chatRouter = createTRPCRouter({
  create: protectedProcedure
    .input(chatCreateInputSchema)
    .mutation(async ({ input, ctx }) => {
      const generateChatTitleResponse = await generateChatTitle(
        input.userChatMessage,
      );

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
          id: input.id,
        })
        .returning();

      return createdChat;
    }),
});
