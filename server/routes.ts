import type { Express } from "express";
import { createServer } from "http";
import { storage } from "./storage";
import { uploadFile, getFileUrl } from "./services/aws";
import { analyzeBloodTest } from "./services/ai";
import { nanoid } from "nanoid";
import { insertBloodTestSchema, insertSharedTestSchema } from "@shared/schema";
import multer from "multer";

const upload = multer({ memory: true });

export function registerRoutes(app: Express) {
  const httpServer = createServer(app);

  // Authentication endpoints
  app.post("/api/auth/verify", async (req, res) => {
    const { cognitoId } = req.body;
    const user = await storage.getUserByCognitoId(cognitoId);
    res.json(user);
  });

  // Blood test endpoints
  app.get("/api/tests/:userId", async (req, res) => {
    const tests = await storage.getBloodTestsByUser(Number(req.params.userId));
    res.json(tests);
  });

  app.get("/api/test/:id", async (req, res) => {
    const test = await storage.getBloodTest(Number(req.params.id));
    if (!test) {
      return res.status(404).json({ message: "Test not found" });
    }
    res.json(test);
  });

  app.get("/api/latest-test", async (req, res) => {
    try {
      // For demo, we'll use userId 1
      const tests = await storage.getBloodTestsByUser(1);
      const latestTest = tests.reduce((latest, test) => {
        return !latest || new Date(test.datePerformed) > new Date(latest.datePerformed)
          ? test
          : latest;
      }, null);

      if (!latestTest) {
        return res.status(404).json({ message: "No tests found" });
      }

      res.json(latestTest);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch latest test" });
    }
  });

  app.post("/api/test/upload", upload.single("file"), async (req, res) => {
    try {
      const { userId, datePerformed, results } = req.body;
      const file = req.file;

      if (!file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const fileKey = `${userId}/${nanoid()}-${file.originalname}`;
      await uploadFile(fileKey, file.buffer);

      const testData = insertBloodTestSchema.parse({
        userId: Number(userId),
        datePerformed: new Date(datePerformed),
        fileKey,
        results: JSON.parse(results),
      });

      const test = await storage.createBloodTest(testData);

      // Trigger AI analysis
      const analysis = await analyzeBloodTest(testData.results);
      const updatedTest = await storage.updateBloodTestAnalysis(test.id, analysis);

      res.json(updatedTest);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });

  // Sharing endpoints
  app.post("/api/test/share", async (req, res) => {
    try {
      const shareData = insertSharedTestSchema.parse({
        ...req.body,
        accessToken: nanoid(),
      });

      const shared = await storage.createSharedTest(shareData);
      res.json(shared);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/shared/:token", async (req, res) => {
    const shared = await storage.getSharedTest(req.params.token);
    if (!shared || !shared.active) {
      return res.status(404).json({ message: "Shared test not found" });
    }

    const test = await storage.getBloodTest(shared.bloodTestId);
    res.json(test);
  });

  return httpServer;
}