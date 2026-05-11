import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // DATABASE_URL = your Neon connection string (from the Neon dashboard)
    url: process.env["DATABASE_URL"],
  },
});
