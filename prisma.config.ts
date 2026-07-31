import { config } from "dotenv";
import { defineConfig } from "prisma/config";

// Prisma CLI does not load Next.js .env.local automatically — load it explicitly.
config({ path: ".env.local" });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "npx tsx prisma/seed.ts",
  },
  datasource: {
    url: process.env["DATABASE_URL"],
    // Vercel Neon requires a direct (non-pooled) URL for migrations
    directUrl: process.env["DIRECT_URL"],
  },
});
