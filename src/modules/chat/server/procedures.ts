import {
  chatCreateInputSchema,
  chatDeleteInputSchema,
  chatGetOneInputSchema,
  chatUpdateInputSchema,
  messageAddInputSchema,
} from "@/modules/chat/schemas/procedures-schemas";
import { db } from "@/db";
import { chat, message } from "@/db/schema";
import { generateChatTitle } from "@/modules/chat/lib/ai/utils";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { TRPCError } from "@trpc/server";
import { and, asc, eq } from "drizzle-orm";
import { z } from "zod";

export const chatRouter = createTRPCRouter({
  getOne: protectedProcedure
    .input(chatGetOneInputSchema)
    .query(async ({ input, ctx }) => {
      const rows = await db
        .select()
        .from(chat)
        .leftJoin(message, eq(message.chatId, chat.id))
        .where(and(eq(chat.id, input.id), eq(chat.userId, ctx.auth.user.id)))
        .orderBy(asc(message.createdAt));

      const selectedChat = rows[0]?.chat;

      if (!selectedChat) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Chat not found" });
      }

      const messages = rows
        .map(r => r.message)
        .filter(message => message !== null);

      return { ...selectedChat, messages };
    }),
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
      const valuesToUpdate: Omit<
        z.infer<typeof chatUpdateInputSchema>,
        "id"
      > = {};

      if (input.lastValidResponseId !== undefined) {
        valuesToUpdate.lastValidResponseId = input.lastValidResponseId;
      }

      if (input.title !== undefined) {
        valuesToUpdate.title = input.title;
      }

      if (
        input.userChatMessage !== undefined &&
        input.userChatMessage.length !== 0
      ) {
        valuesToUpdate.userChatMessage = input.userChatMessage;
      }

      if (Object.keys(valuesToUpdate).length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No fields to update provided",
        });
      }

      const [updatedChat] = await db
        .update(chat)
        .set(valuesToUpdate)
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
