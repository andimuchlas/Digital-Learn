import { pgTable, text, timestamp, integer, uuid } from "drizzle-orm/pg-core";
import { questionBanks } from "./question-banks";

export const questions = pgTable("questions", {
  id: uuid("id").defaultRandom().primaryKey(),
  bankId: uuid("bank_id")
    .references(() => questionBanks.id, { onDelete: "cascade" })
    .notNull(),
  text: text("text").notNull(),
  optionA: text("option_a").notNull(),
  optionB: text("option_b").notNull(),
  optionC: text("option_c").notNull(),
  optionD: text("option_d"),
  correctAnswer: text("correct_answer").notNull(), // 'a' | 'b' | 'c' | 'd'
  orderIndex: integer("order_index").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Question = typeof questions.$inferSelect;
export type NewQuestion = typeof questions.$inferInsert;
