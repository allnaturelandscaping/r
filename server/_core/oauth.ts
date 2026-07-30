import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { ENV } from "./env";
import { exchangeGoogleCode, getGoogleAuthUrl, sdk } from "./sdk";

export function registerOAuthRoutes(app: Express) {
  // Redirige al usuario a la pantalla de login de Google
  app.get("/api/auth/google", (_req: Request, res: Response) => {
    if (!ENV.googleClientId || !ENV.googleClientSecret) {
      res.status(503).json({
        error:
          "Google OAuth no está configurado. Agrega GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET al archivo .env",
      });
      return;
    }
    const url = getGoogleAuthUrl();
    res.redirect(302, url);
  });

  // Diagnóstico de conexión a la base de datos
  app.get("/api/auth/db-test", async (_req: Request, res: Response) => {
    try {
      const dbInstance = await db.getDb();
      if (!dbInstance) {
        res.json({ ok: false, error: "DB instance is null", DATABASE_URL: ENV.databaseUrl ? "SET" : "NOT SET" });
        return;
      }
      // Intentar una query simple
      const result = await dbInstance.execute("SELECT 1 as test");
      res.json({ ok: true, result: "DB connected", rows: result });
    } catch (error) {
      res.json({ ok: false, error: String(error) });
    }
  });

  // Google redirige aquí con el código de autorización
  app.get("/api/auth/google/callback", async (req: Request, res: Response) => {
    const code = req.query["code"];
    if (typeof code !== "string") {
      res.status(400).json({ error: "Código de autorización faltante" });
      return;
    }

    try {
      console.log("[OAuth] Starting Google callback...");
      const googleUser = await exchangeGoogleCode(code);
      console.log("[OAuth] Google user:", googleUser.email);

      // Determinar si es el dueño (admin automático)
      const isOwner =
        googleUser.email.toLowerCase() === ENV.ownerEmail.toLowerCase();

      console.log("[OAuth] Is owner:", isOwner, "ownerEmail:", ENV.ownerEmail);

      // Crear o actualizar el usuario en la base de datos
      console.log("[OAuth] Upserting user...");
      await db.upsertGoogleUser({
        googleId: googleUser.googleId,
        email: googleUser.email,
        name: googleUser.name,
        avatarUrl: googleUser.avatarUrl,
        // El dueño siempre es admin y aprobado; los demás empiezan como pending
        role: isOwner ? "admin" : "user",
        status: isOwner ? "approved" : undefined, // undefined = no sobreescribir si ya existe
      });
      console.log("[OAuth] User upserted OK");

      const user = await db.getUserByGoogleId(googleUser.googleId);
      if (!user) {
        console.error("[OAuth] User not found after upsert");
        res.status(500).json({ error: "Error al crear el usuario" });
        return;
      }
      console.log("[OAuth] User found:", user.id, user.status);

      // Si el usuario está rechazado, redirigir con error
      if (user.status === "rejected") {
        res.redirect(302, "/?error=rejected");
        return;
      }

      // Si está pendiente de aprobación, redirigir a pantalla de espera
      if (user.status === "pending") {
        res.redirect(302, "/?error=pending");
        return;
      }

      // Usuario aprobado: crear sesión JWT
      const sessionToken = await sdk.createSessionToken(user.id, user.email, {
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, {
        ...cookieOptions,
        maxAge: ONE_YEAR_MS,
      });

      console.log("[OAuth] Login successful for:", user.email);
      res.redirect(302, "/");
    } catch (error) {
      console.error("[OAuth] Google callback failed:", error);
      // En producción redirigir, en desarrollo mostrar el error
      if (ENV.isProduction) {
        res.redirect(302, `/?error=oauth_failed&msg=${encodeURIComponent(String(error).substring(0, 100))}`);
      } else {
        res.status(500).json({ error: String(error) });
      }
    }
  });
}
