import { COOKIE_NAME } from "@shared/const";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, publicProcedure, router } from "./_core/trpc";
import { clientsRouter } from "./routers/clients";
import { cutsRouter } from "./routers/cuts";
import * as db from "./db";

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // Panel de administración: gestión de usuarios
  admin: router({
    // Listar todos los usuarios no-admin
    listUsers: adminProcedure.query(async () => {
      return db.getAllNonAdminUsers();
    }),

    // Aprobar acceso a un usuario
    approveUser: adminProcedure
      .input(z.object({ userId: z.number() }))
      .mutation(async ({ input }) => {
        await db.setUserStatus(input.userId, "approved");
        return { success: true };
      }),

    // Rechazar / revocar acceso a un usuario
    rejectUser: adminProcedure
      .input(z.object({ userId: z.number() }))
      .mutation(async ({ input }) => {
        await db.setUserStatus(input.userId, "rejected");
        return { success: true };
      }),

    // Restablecer a pendiente
    setPending: adminProcedure
      .input(z.object({ userId: z.number() }))
      .mutation(async ({ input }) => {
        await db.setUserStatus(input.userId, "pending");
        return { success: true };
      }),
  }),

  clients: clientsRouter,
  cuts: cutsRouter,
});

export type AppRouter = typeof appRouter;
