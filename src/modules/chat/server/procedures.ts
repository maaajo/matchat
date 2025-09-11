import { db } from "@/db";
import { chat } from "@/db/schema";
import { chatCreateSchema } from "@/modules/chat/validation/schemas";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";

export const chatRouter = createTRPCRouter({
  create: protectedProcedure
    .input(chatCreateSchema)
    .mutation(async ({ input, ctx }) => {
      const [createdChat] = await db
        .insert(chat)
        .values({
          ...input,
          userId: ctx.auth.user.id,
        })
        .returning();

      return createdChat;
    }),
});
