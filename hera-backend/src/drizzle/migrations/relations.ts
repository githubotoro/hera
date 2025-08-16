import { relations } from "drizzle-orm/relations";
import { sessions, sessionLogs, users } from "./schema";

export const sessionLogsRelations = relations(sessionLogs, ({one}) => ({
	session: one(sessions, {
		fields: [sessionLogs.sessionId],
		references: [sessions.id]
	}),
	user: one(users, {
		fields: [sessionLogs.userId],
		references: [users.id]
	}),
}));

export const sessionsRelations = relations(sessions, ({one, many}) => ({
	sessionLogs: many(sessionLogs),
	user_player1Id: one(users, {
		fields: [sessions.player1Id],
		references: [users.id],
		relationName: "sessions_player1Id_users_id"
	}),
	user_player2Id: one(users, {
		fields: [sessions.player2Id],
		references: [users.id],
		relationName: "sessions_player2Id_users_id"
	}),
}));

export const usersRelations = relations(users, ({many}) => ({
	sessionLogs: many(sessionLogs),
	sessions_player1Id: many(sessions, {
		relationName: "sessions_player1Id_users_id"
	}),
	sessions_player2Id: many(sessions, {
		relationName: "sessions_player2Id_users_id"
	}),
}));