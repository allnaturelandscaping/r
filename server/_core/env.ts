export const ENV = {
  cookieSecret: process.env.JWT_SECRET ?? "change-me-in-production",
  databaseUrl: process.env.DATABASE_URL ?? "",
  isProduction: process.env.NODE_ENV === "production",
  // Google OAuth2
  googleClientId: process.env.GOOGLE_CLIENT_ID ?? "",
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
  // Correo del administrador dueño — se le da rol admin automáticamente
  ownerEmail: process.env.OWNER_EMAIL ?? "josuec20100@gmail.com",
  // URL base de la app (para el redirect de Google)
  appUrl: process.env.APP_URL ?? "http://localhost:3000",
};
