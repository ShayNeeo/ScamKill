import { defineConfig } from 'drizzle-kit';

// Schema lives in src/db/schema.ts. Generate SQL into ./migrations, then apply
// it to Cloudflare D1 with `pnpm db:migrate:local` / `pnpm db:migrate:remote`.
export default defineConfig({
  dialect: 'sqlite',
  schema: './src/db/schema.ts',
  out: './migrations',
  verbose: true,
  strict: true,
});
