import { type AppRouter } from "@/trpc/routers/_app";
import { type inferRouterOutputs } from "@trpc/server";

type RouterOutputs = inferRouterOutputs<AppRouter>;

export type GetAllChatsOutput = RouterOutputs["chat"]["getAllByUserId"];

export type ChatListItem = GetAllChatsOutput[number];
