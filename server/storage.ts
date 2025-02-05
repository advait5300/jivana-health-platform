import { users, bloodTests, sharedTests } from "@shared/schema";
import type { User, InsertUser, BloodTest, InsertBloodTest, SharedTest, InsertSharedTest } from "@shared/schema";
import { eq } from "drizzle-orm";
import { db } from "./db";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByCognitoId(cognitoId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Blood test operations
  getBloodTest(id: number): Promise<BloodTest | undefined>;
  getBloodTestsByUser(userId: number): Promise<BloodTest[]>;
  createBloodTest(test: InsertBloodTest): Promise<BloodTest>;
  updateBloodTestAnalysis(id: number, analysis: any): Promise<BloodTest>;
  
  // Sharing operations
  createSharedTest(shared: InsertSharedTest): Promise<SharedTest>;
  getSharedTest(accessToken: string): Promise<SharedTest | undefined>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByCognitoId(cognitoId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.cognitoId, cognitoId));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getBloodTest(id: number): Promise<BloodTest | undefined> {
    const [test] = await db.select().from(bloodTests).where(eq(bloodTests.id, id));
    return test;
  }

  async getBloodTestsByUser(userId: number): Promise<BloodTest[]> {
    return db.select().from(bloodTests).where(eq(bloodTests.userId, userId));
  }

  async createBloodTest(test: InsertBloodTest): Promise<BloodTest> {
    const [bloodTest] = await db.insert(bloodTests).values(test).returning();
    return bloodTest;
  }

  async updateBloodTestAnalysis(id: number, analysis: any): Promise<BloodTest> {
    const [updated] = await db
      .update(bloodTests)
      .set({ aiAnalysis: analysis })
      .where(eq(bloodTests.id, id))
      .returning();
    return updated;
  }

  async createSharedTest(shared: InsertSharedTest): Promise<SharedTest> {
    const [sharedTest] = await db.insert(sharedTests).values(shared).returning();
    return sharedTest;
  }

  async getSharedTest(accessToken: string): Promise<SharedTest | undefined> {
    const [shared] = await db
      .select()
      .from(sharedTests)
      .where(eq(sharedTests.accessToken, accessToken));
    return shared;
  }
}

export const storage = new DatabaseStorage();
