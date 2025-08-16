import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../drizzle/schema';

export type DB = NodePgDatabase<typeof schema>;
