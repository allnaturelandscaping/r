import "dotenv/config";
import express from "express";
import { createServer } from "http";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";

async function startServer() {
  const app = express();
  const server = createServer(app);

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // Debug: verificar variables de entorno (solo en producción para diagnóstico)
  app.get("/api/debug-env", (_req, res) => {
    res.json({
      NODE_ENV: process.env.NODE_ENV,
      PORT: process.env.PORT,
      APP_URL: process.env.APP_URL,
      GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? process.env.GOOGLE_CLIENT_ID.substring(0, 20) + "..." : "NOT SET",
      GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ? "SET (" + process.env.GOOGLE_CLIENT_SECRET.length + " chars)" : "NOT SET",
      JWT_SECRET: process.env.JWT_SECRET ? "SET" : "NOT SET",
      DATABASE_URL: process.env.DATABASE_URL ? "SET" : "NOT SET",
      OWNER_EMAIL: process.env.OWNER_EMAIL,
    });
  });

  // Rutas de Google OAuth2
  registerOAuthRoutes(app);

  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Railway asigna el puerto via la variable PORT
  const port = parseInt(process.env.PORT || "3000");

  server.listen(port, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${port}/`);
  });
}

startServer().catch(console.error);
