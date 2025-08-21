import { defineConfig } from "drizzle-kit";
import { serverEnv } from "@/env/server";

export default defineConfig({
  out: "./drizzle",
  schema: "./src/db/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: serverEnv.DATABASE_URL,
  },
});
