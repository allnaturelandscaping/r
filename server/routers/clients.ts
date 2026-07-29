import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  createClient,
  createScheduledCut,
  deleteClient,
  getClientById,
  getClientsByUserId,
  updateClient,
} from "../db";
// getClientsByUserId se usa en list y en el router de cuts

export const clientsRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return getClientsByUserId(ctx.user.id);
  }),

  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const client = await getClientById(input.id, ctx.user.id);
      if (!client) throw new TRPCError({ code: "NOT_FOUND", message: "Cliente no encontrado" });
      return client;
    }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(255),
        address: z.string().min(1),
        phone: z.string().max(30).optional(),
        frequency: z.enum(["weekly", "biweekly", "monthly"]),
        notes: z.string().optional(),
        firstCutDate: z.number(), // UTC ms timestamp para el primer corte
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { firstCutDate, ...clientData } = input;
      const newClientId = await createClient({
        ...clientData,
        userId: ctx.user.id,
        phone: clientData.phone ?? null,
        notes: clientData.notes ?? null,
      });

      // Programar el primer corte usando el insertId directamente
      await createScheduledCut({
        clientId: newClientId,
        userId: ctx.user.id,
        scheduledDate: firstCutDate,
        status: "pending",
      });

      return { success: true };
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).max(255).optional(),
        address: z.string().min(1).optional(),
        phone: z.string().max(30).nullable().optional(),
        frequency: z.enum(["weekly", "biweekly", "monthly"]).optional(),
        notes: z.string().nullable().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      await updateClient(id, ctx.user.id, data);
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await deleteClient(input.id, ctx.user.id);
      return { success: true };
    }),
});
