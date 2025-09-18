import { createTRPCRouter } from "@/trpc/init";
import { chatRouter, messageRouter } from "@/modules/chat/server/procedures";

export const appRouter = createTRPCRouter({
  chat: chatRouter,
  message: messageRouter,
});

export type AppRouter = typeof appRouter;
