import type { Config } from 'drizzle-kit';
import { AppConfig } from './src/config/config';
import * as schema from './src/drizzle/schema';

const CONFIG = AppConfig();

export default {
  schema: './src/drizzle/schema.ts',
  out: './src/drizzle/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: CONFIG.DATABASE_URL,
  },
  verbose: true,
  strict: true,
} satisfies Config;
