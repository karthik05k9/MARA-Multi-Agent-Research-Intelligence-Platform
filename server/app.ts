import cors from "cors";
import express from "express";
import researchRouter from "./routes/research";
import { ensureStorage } from "./storage/projects";

export function createApp() {
  ensureStorage();

  const app = express();

  app.use(
    cors({
      origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
      credentials: true,
    })
  );

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  app.get("/", (_req, res) => {
    res.send("Research Intelligence API is running");
  });

  app.get("/api/health", (_req, res) => {
    res.json({ status: "healthy" });
  });

  app.use("/api", researchRouter);

  return app;
}