export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

/**
 * Inicia el flujo de login con Google.
 * Redirige al endpoint del servidor que genera la URL de Google OAuth.
 */
export const startLogin = () => {
  window.location.href = "/api/auth/google";
};
