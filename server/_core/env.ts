export const ENV = {
  cookieSecret: (process.env.JWT_SECRET ?? "change-me-in-production").trim(),
  databaseUrl: (process.env.DATABASE_URL ?? "").trim(),
  isProduction: process.env.NODE_ENV === "production",
  // Google OAuth2
  googleClientId: (process.env.GOOGLE_CLIENT_ID ?? "").trim(),
  googleClientSecret: (process.env.GOOGLE_CLIENT_SECRET ?? "").trim(),
  // Correo del administrador dueño — se le da rol admin automáticamente
  ownerEmail: (process.env.OWNER_EMAIL ?? "josuec20100@gmail.com").trim(),
  // URL base de la app (para el redirect de Google)
  appUrl: (process.env.APP_URL ?? "http://localhost:3000").trim(),
};
