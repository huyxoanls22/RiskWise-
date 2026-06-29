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

  const isProduction = process.env.NODE_ENV === "production";

  // Security headers applied to every response.
  app.use((_req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "SAMEORIGIN");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader(
      "Permissions-Policy",
      "camera=(), microphone=(), geolocation=(), payment=()"
    );

    if (isProduction) {
      res.setHeader(
        "Strict-Transport-Security",
        "max-age=31536000; includeSubDomains"
      );

      // CSP is only enforced in production: the Vite dev server relies on
      // inline scripts, eval and websockets that a strict policy would break.
      const csp = [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.tailwindcss.com https://s.tradingview.com https://www.googletagmanager.com https://*.google-analytics.com",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' https://fonts.gstatic.com data:",
        "img-src 'self' data: https:",
        "connect-src 'self' https://api.twelvedata.com https://api.binance.com https://www.binance.com https://query1.finance.yahoo.com https://open.er-api.com https://worldtimeapi.org https://services.entrade.com.vn https://api.allorigins.win https://corsproxy.io https://www.googletagmanager.com https://*.google-analytics.com https://*.supabase.co",
        "frame-src 'self' https://s.tradingview.com https://www.tradingview.com",
        "object-src 'none'",
        "base-uri 'self'",
        "frame-ancestors 'self'",
      ].join("; ");
      res.setHeader("Content-Security-Policy", csp);
    }

    next();
  });

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
