import { pgTable, text, serial, integer, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  cognitoId: text("cognito_id").notNull().unique(),
  email: text("email").notNull().unique(),
});

export const bloodTests = pgTable("blood_tests", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  datePerformed: timestamp("date_performed").notNull(),
  fileKey: text("file_key").notNull(),
  results: jsonb("results").notNull(),
  aiAnalysis: jsonb("ai_analysis"),
});

export const sharedTests = pgTable("shared_tests", {
  id: serial("id").primaryKey(),
  bloodTestId: integer("blood_test_id").notNull(),
  sharedById: integer("shared_by_id").notNull(),
  sharedWithEmail: text("shared_with_email").notNull(),
  accessToken: text("access_token").notNull(),
  active: boolean("active").notNull().default(true),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  cognitoId: true,
});

export const insertBloodTestSchema = createInsertSchema(bloodTests).pick({
  userId: true,
  datePerformed: true,
  fileKey: true,
  results: true,
});

export const insertSharedTestSchema = createInsertSchema(sharedTests).pick({
  bloodTestId: true,
  sharedById: true,
  sharedWithEmail: true,
  accessToken: true,
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type BloodTest = typeof bloodTests.$inferSelect;
export type InsertBloodTest = z.infer<typeof insertBloodTestSchema>;
export type SharedTest = typeof sharedTests.$inferSelect;
export type InsertSharedTest = z.infer<typeof insertSharedTestSchema>;
