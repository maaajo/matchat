import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db";
import { serverEnv } from "@/env/server";
import { headers } from "next/headers";
import * as schema from "@/db/schema";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      ...schema,
    },
  }),
  socialProviders: {
    github: {
      clientId: serverEnv.GITHUB_CLIENT_ID,
      clientSecret: serverEnv.GITHUB_CLIENT_SECRET,
    },
  },
});

export const getIsSignedInServer = async () => {
  const headersList = await headers();

  const sessionResponse = await auth.api.getSession({
    headers: headersList,
  });

  if (!sessionResponse) {
    return false;
  }

  return true;
};
