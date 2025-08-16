import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import path from 'path';
import pg from 'pg';
import { exit } from 'process';
import fs from 'fs';

import * as allSchema from './schema';
import { AppConfig } from '../config/config';

const CONFIG = AppConfig();

(async () => {
  try {
    const pool = new pg.Pool({
      connectionString: CONFIG.DATABASE_URL,
    });

    const db = drizzle(pool, {
      schema: {
        ...allSchema,
      },
    });

    // Look for migrations in the src/drizzle/migrations folder
    const migrationPath = path.join(process.cwd(), 'src/drizzle/migrations');

    // Check if migrations directory exists
    if (!fs.existsSync(migrationPath)) {
      console.error(`Migrations directory not found at: ${migrationPath}`);
      exit(1);
    }

    // List available migration files
    const sqlFiles = fs.readdirSync(migrationPath);

    console.log('Found migration files:', sqlFiles);

    // Run the migrations
    await migrate(db, {
      migrationsFolder: migrationPath,
    });

    console.log('Migration complete');
    await pool.end();
    exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    exit(1);
  }
})();
