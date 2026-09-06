import { pgTable, text, timestamp, integer, uuid } from "drizzle-orm/pg-core";
import { gameSessions } from "./game-sessions";

export const playerResults = pgTable("player_results", {
  id: uuid("id").defaultRandom().primaryKey(),
  gameSessionId: uuid("game_session_id")
    .references(() => gameSessions.id, { onDelete: "cascade" })
    .notNull(),
  playerName: text("player_name").notNull(),
  playerClass: text("player_class").notNull(),
  finalTile: integer("final_tile").notNull().default(1),
  correctAnswers: integer("correct_answers").notNull().default(0),
  totalQuestions: integer("total_questions").notNull().default(25),
  rank: integer("rank"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type PlayerResult = typeof playerResults.$inferSelect;
export type NewPlayerResult = typeof playerResults.$inferInsert;
