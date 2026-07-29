import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { ENV } from "./env";
import { exchangeGoogleCode, getGoogleAuthUrl, sdk } from "./sdk";

export function registerOAuthRoutes(app: Express) {
  // Debug: muestra el redirect URI que se está usando
  app.get("/api/auth/debug", (_req: Request, res: Response) => {
    const redirectUri = `${process.env.APP_URL || "http://localhost:3000"}/api/auth/google/callback`;
    res.json({
      APP_URL: process.env.APP_URL,
      redirectUri,
      NODE_ENV: process.env.NODE_ENV,
    });
  });

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

  // Google redirige aquí con el código de autorización
  app.get("/api/auth/google/callback", async (req: Request, res: Response) => {
    const code = req.query["code"];
    if (typeof code !== "string") {
      res.status(400).json({ error: "Código de autorización faltante" });
      return;
    }

    try {
      const googleUser = await exchangeGoogleCode(code);

      // Determinar si es el dueño (admin automático)
      const isOwner =
        googleUser.email.toLowerCase() === ENV.ownerEmail.toLowerCase();

      // Crear o actualizar el usuario en la base de datos
      await db.upsertGoogleUser({
        googleId: googleUser.googleId,
        email: googleUser.email,
        name: googleUser.name,
        avatarUrl: googleUser.avatarUrl,
        // El dueño siempre es admin y aprobado; los demás empiezan como pending
        role: isOwner ? "admin" : "user",
        status: isOwner ? "approved" : undefined, // undefined = no sobreescribir si ya existe
      });

      const user = await db.getUserByGoogleId(googleUser.googleId);
      if (!user) {
        res.status(500).json({ error: "Error al crear el usuario" });
        return;
      }

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

      res.redirect(302, "/");
    } catch (error) {
      console.error("[OAuth] Google callback failed:", error);
      res.redirect(302, "/?error=oauth_failed");
    }
  });
}
