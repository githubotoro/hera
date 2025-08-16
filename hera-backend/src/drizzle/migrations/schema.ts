import { pgTable, uuid, text, timestamp, foreignKey, numeric, boolean } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const verificationEmails = pgTable("verification_emails", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: text("user_id"),
	email: text().notNull(),
	username: text().notNull(),
	verificationCode: text("verification_code").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	expiresAt: timestamp("expires_at", { withTimezone: true, mode: 'string' }).notNull(),
	usedAt: timestamp("used_at", { withTimezone: true, mode: 'string' }),
	revokedAt: timestamp("revoked_at", { withTimezone: true, mode: 'string' }),
});

export const users = pgTable("users", {
	id: text().primaryKey().notNull(),
	username: text().notNull(),
	email: text().notNull(),
	eoaAddress: text("eoa_address").notNull(),
	smartAccountAddress: text("smart_account_address").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
});

export const sessionLogs = pgTable("session_logs", {
	id: text().primaryKey().notNull(),
	category: text().notNull(),
	timestampId: numeric("timestamp_id").notNull(),
	sessionId: uuid("session_id"),
	userId: text("user_id").notNull(),
	amount: numeric().default('0').notNull(),
	replayId: text("replay_id"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	isSettled: boolean().default(false).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.sessionId],
			foreignColumns: [sessions.id],
			name: "session_logs_session_id_sessions_id_fk"
		}),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "session_logs_user_id_users_id_fk"
		}),
]);

export const sessions = pgTable("sessions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	sessionCode: text("session_code").notNull(),
	network: text().notNull(),
	player1Id: text("player1_id"),
	player2Id: text("player2_id"),
	player1LastActiveAt: timestamp("player1_last_active_at", { withTimezone: true, mode: 'string' }),
	player2LastActiveAt: timestamp("player2_last_active_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	expiresAt: timestamp("expires_at", { withTimezone: true, mode: 'string' }).notNull(),
	closedAt: timestamp("closed_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.player1Id],
			foreignColumns: [users.id],
			name: "sessions_player1_id_users_id_fk"
		}),
	foreignKey({
			columns: [table.player2Id],
			foreignColumns: [users.id],
			name: "sessions_player2_id_users_id_fk"
		}),
]);
