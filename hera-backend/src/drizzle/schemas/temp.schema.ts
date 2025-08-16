import { sql } from 'drizzle-orm';
import {
  integer,
  text,
  pgTable,
  numeric,
  timestamp,
  jsonb,
  index,
  unique,
  uuid,
  foreignKey,
  boolean,
} from 'drizzle-orm/pg-core';
import { sessions, users } from '../schema';

// export const sessions = pgTable(
//   'sessions',
//   {
//     id: uuid().defaultRandom().primaryKey().notNull(),
//     sessionCode: text('session_code').notNull(),
//     network: text().notNull(),
//     player1Id: text('player1_id'),
//     player2Id: text('player2_id'),
//     player1LastActiveAt: timestamp('player1_last_active_at', {
//       withTimezone: true,
//       mode: 'string',
//     }),
//     player2LastActiveAt: timestamp('player2_last_active_at', {
//       withTimezone: true,
//       mode: 'string',
//     }),
//     createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
//       .defaultNow()
//       .notNull(),
//     updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
//       .defaultNow()
//       .notNull(),
//     expiresAt: timestamp('expires_at', {
//       withTimezone: true,
//       mode: 'string',
//     }).notNull(),
//   },
//   (table) => [
//     foreignKey({
//       columns: [table.player1Id],
//       foreignColumns: [users.id],
//       name: 'sessions_player1_id_users_id_fk',
//     }),
//     foreignKey({
//       columns: [table.player2Id],
//       foreignColumns: [users.id],
//       name: 'sessions_player2_id_users_id_fk',
//     }),
//   ],
// );
