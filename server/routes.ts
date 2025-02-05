import type { Express, Request } from "express";
import { createServer } from "http";
import { storage } from "./storage";
import { uploadFile, getFileUrl } from "./services/aws";
import { analyzeBloodTest } from "./services/ai";
import { nanoid } from "nanoid";
import { insertBloodTestSchema, insertSharedTestSchema, type BloodTest } from "@shared/schema";
import multer from "multer";

/**
 * Configure multer for handling file uploads
 * Store files in memory for processing before S3 upload
 */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

interface FileRequest extends Request {
  file?: Express.Multer.File;
}

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
      const latestTest = tests.reduce<BloodTest | null>((latest, test) => {
        if (!latest) return test;
        return new Date(test.datePerformed) > new Date(latest.datePerformed)
          ? test
          : latest;
      }, null);

      if (!latestTest) {
        return res.status(404).json({ message: "No tests found" });
      }

      res.json(latestTest);
    } catch (error) {
      console.error('Error fetching latest test:', error);
      res.status(500).json({ message: "Failed to fetch latest test" });
    }
  });

  app.post("/api/test/upload", upload.single("file"), async (req: FileRequest, res) => {
    try {
      const { userId, datePerformed, results } = req.body;
      const file = req.file;

      if (!file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      // Generate unique S3 key for the file
      const fileKey = `${userId}/${nanoid()}-${file.originalname}`;

      // Upload file to S3
      await uploadFile(fileKey, file.buffer);

      // Store test data in PostgreSQL
      const testData = insertBloodTestSchema.parse({
        userId: Number(userId),
        datePerformed: new Date(datePerformed),
        fileKey,
        results: JSON.parse(results),
      });

      const test = await storage.createBloodTest(testData);

      // Generate AI analysis
      const analysis = await analyzeBloodTest(JSON.parse(results));

      // Update test record with analysis
      const updatedTest = await storage.updateBloodTestAnalysis(test.id, analysis);

      res.json(updatedTest);
    } catch (error) {
      console.error('Error processing test upload:', error);
      res.status(400).json({ message: error instanceof Error ? error.message : 'Upload failed' });
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
      console.error('Error sharing test:', error);
      res.status(400).json({ message: error instanceof Error ? error.message : 'Share failed' });
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