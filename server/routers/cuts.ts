
import { z } from "zod";
import { getNextCutDate } from "../../shared/cutUtils";

import { protectedProcedure, router } from "../_core/trpc";
import {
  completeCut,
  createScheduledCut,
  getCutHistoryByClient,
  getCutsForMonth,
  getNextPendingCutForClient,
  getOverdueCuts,
  getTodayCuts,
  getUpcomingCuts,
  skipCut,
} from "../db";

export const cutsRouter = router({
  /** Cortes de hoy + vencidos */
  dashboard: protectedProcedure
    .input(z.object({ todayStart: z.number(), todayEnd: z.number() }))
    .query(async ({ ctx, input }) => {
      const [todayCuts, overdueCuts] = await Promise.all([
        getTodayCuts(ctx.user.id, input.todayStart, input.todayEnd),
        getOverdueCuts(ctx.user.id, input.todayStart),
      ]);
      return { todayCuts, overdueCuts };
    }),

  /** Próximos cortes (7 días) */
  upcoming: protectedProcedure
    .input(z.object({ fromTs: z.number(), toTs: z.number() }))
    .query(async ({ ctx, input }) => {
      return getUpcomingCuts(ctx.user.id, input.fromTs, input.toTs);
    }),

  /** Cortes del mes para el calendario */
  calendar: protectedProcedure
    .input(z.object({ monthStart: z.number(), monthEnd: z.number() }))
    .query(async ({ ctx, input }) => {
      return getCutsForMonth(ctx.user.id, input.monthStart, input.monthEnd);
    }),

  /** Historial de cortes de un cliente */
  history: protectedProcedure
    .input(z.object({ clientId: z.number() }))
    .query(async ({ ctx, input }) => {
      return getCutHistoryByClient(input.clientId, ctx.user.id);
    }),

  /** Marcar corte como completado y auto-programar el siguiente */
  complete: protectedProcedure
    .input(
      z.object({
        cutId: z.number(),
        clientId: z.number(),
        frequency: z.enum(["weekly", "biweekly", "monthly"]),
        scheduledDate: z.number(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Marcar como completado
      await completeCut(input.cutId, ctx.user.id, input.notes);

      // Calcular y crear el siguiente corte automáticamente
      const nextDate = getNextCutDate(input.scheduledDate, input.frequency);
      await createScheduledCut({
        clientId: input.clientId,
        userId: ctx.user.id,
        scheduledDate: nextDate,
        status: "pending",
      });

      return { success: true, nextCutDate: nextDate };
    }),

  /** Omitir un corte y programar el siguiente */
  skip: protectedProcedure
    .input(
      z.object({
        cutId: z.number(),
        clientId: z.number(),
        frequency: z.enum(["weekly", "biweekly", "monthly"]),
        scheduledDate: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await skipCut(input.cutId, ctx.user.id);
      const nextDate = getNextCutDate(input.scheduledDate, input.frequency);
      await createScheduledCut({
        clientId: input.clientId,
        userId: ctx.user.id,
        scheduledDate: nextDate,
        status: "pending",
      });
      return { success: true, nextCutDate: nextDate };
    }),

  /** Programar manualmente un corte para un cliente */
  schedule: protectedProcedure
    .input(
      z.object({
        clientId: z.number(),
        scheduledDate: z.number(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await createScheduledCut({
        clientId: input.clientId,
        userId: ctx.user.id,
        scheduledDate: input.scheduledDate,
        status: "pending",
        notes: input.notes ?? null,
      });
      return { success: true };
    }),

  /** Obtener el próximo corte pendiente de un cliente */
  nextPending: protectedProcedure
    .input(z.object({ clientId: z.number() }))
    .query(async ({ ctx, input }) => {
      return getNextPendingCutForClient(input.clientId, ctx.user.id);
    }),
});
