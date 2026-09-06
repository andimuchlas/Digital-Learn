import { pgTable, text, timestamp, integer, uuid } from "drizzle-orm/pg-core";
import { questionBanks } from "./question-banks";

export const gameSessions = pgTable("game_sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  code: text("code").notNull().unique(),
  bankId: uuid("bank_id").references(() => questionBanks.id),
  title: text("title").notNull(),
  status: text("status").notNull().default("LOBBY"), // LOBBY | RUNNING | PAUSED | FINISHED
  questionTime: integer("question_time").notNull().default(30),
  totalQuestions: integer("total_questions").notNull().default(25),
  currentQuestionIndex: integer("current_question_index").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  finishedAt: timestamp("finished_at"),
});

export type GameSession = typeof gameSessions.$inferSelect;
export type NewGameSession = typeof gameSessions.$inferInsert;
