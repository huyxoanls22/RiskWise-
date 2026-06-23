import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

import twelvedataHandler from "./api/twelvedata";
import adminPinVerifyHandler from "./api/license-verify-admin";
import licenseGenerateHandler from "./api/license-generate";
import licenseVerifyHandler from "./api/license-verify";
import feedbacksHandler from "./api/feedbacks";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Body parsing middleware
  app.use(express.json());

  // API Route Definitions
  app.get("/api/twelvedata", twelvedataHandler);
  app.post("/api/license/verify", licenseVerifyHandler);
  app.post("/api/license/verify-admin", adminPinVerifyHandler);
  app.post("/api/license/generate", licenseGenerateHandler);
  
  // Feedbacks route supporting saving, retrieving and deleting
  app.post("/api/feedbacks", feedbacksHandler);
  app.get("/api/feedbacks", feedbacksHandler);
  app.delete("/api/feedbacks", feedbacksHandler);

  // Development vs Production serving configurations
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server fully authorized and running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
