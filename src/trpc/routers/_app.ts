import { createTRPCRouter } from "@/trpc/init";
import { chatRouter } from "@/modules/chat/server/procedures";

export const appRouter = createTRPCRouter({
  chat: chatRouter,
});

export type AppRouter = typeof appRouter;
