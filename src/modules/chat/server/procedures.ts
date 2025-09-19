import {
  chatCreateInputSchema,
  chatDeleteInputSchema,
  chatUpdateInputSchema,
  messageAddInputSchema,
} from "@/modules/chat/schemas/procedures-schemas";
import { db } from "@/db";
import { chat, message } from "@/db/schema";
import { generateChatTitle } from "@/modules/chat/lib/ai/utils";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";

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
          lastValidResponseId: input.lastValidResponseId,
        })
        .returning();

      if (!createdChat) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create chat",
        });
      }

      return createdChat;
    }),
  delete: protectedProcedure
    .input(chatDeleteInputSchema)
    .mutation(async ({ input }) => {
      const [deletedChat] = await db
        .delete(chat)
        .where(eq(chat.id, input.id))
        .returning();

      if (!deletedChat) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Chat not found" });
      }
    }),
  update: protectedProcedure
    .input(chatUpdateInputSchema)
    .mutation(async ({ input, ctx }) => {
      const [updatedChat] = await db
        .update(chat)
        .set({
          lastValidResponseId: input.lastValidResponseId,
          title: input.title,
        })
        .where(and(eq(chat.id, input.id), eq(chat.userId, ctx.auth.user.id)))
        .returning();

      if (!updatedChat) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Chat not found" });
      }

      return updatedChat;
    }),
});

export const messageRouter = createTRPCRouter({
  add: protectedProcedure
    .input(messageAddInputSchema)
    .mutation(async ({ input }) => {
      const mappedInput = input.map(message => ({
        ...message,
        createdAt: message.createdAt,
      }));

      const newMessages = await db
        .insert(message)
        .values(mappedInput)
        .returning();

      if (newMessages.length === 0) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create new messages",
        });
      }

      return newMessages;
    }),
});
