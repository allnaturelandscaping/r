import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ChevronRight, Scissors } from "lucide-react";
import { useMemo, useState } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  isSameDay,
} from "date-fns";
import { es } from "date-fns/locale";

const FREQ_COLORS: Record<string, string> = {
  weekly: "bg-emerald-500",
  biweekly: "bg-blue-500",
  monthly: "bg-purple-500",
};

type CutWithClient = {
  cut: { id: number; clientId: number; scheduledDate: number; status: string };
  client: { id: number; name: string; frequency: "weekly" | "biweekly" | "monthly" };
};

export default function CalendarView() {
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  const monthStart = useMemo(() => startOfMonth(currentMonth).getTime(), [currentMonth]);
  const monthEnd = useMemo(() => endOfMonth(currentMonth).getTime(), [currentMonth]);

  const { data: cuts, isLoading } = trpc.cuts.calendar.useQuery(
    { monthStart, monthEnd },
    { refetchOnWindowFocus: false }
  );

  const cutsMap = useMemo(() => {
    const map = new Map<string, CutWithClient[]>();
    (cuts ?? []).forEach((item: CutWithClient) => {
      const key = format(new Date(item.cut.scheduledDate), "yyyy-MM-dd");
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(item);
    });
    return map;
  }, [cuts]);

  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const selectedCuts = selectedDay
    ? cutsMap.get(format(selectedDay, "yyyy-MM-dd")) ?? []
    : [];

  const prevMonth = () => setCurrentMonth((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  const nextMonth = () => setCurrentMonth((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));

  const weekDays = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-foreground" style={{ fontFamily: "var(--font-display)" }}>
          Calendario
        </h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={prevMonth} className="touch-target">
            <ChevronLeft size={18} />
          </Button>
          <span className="font-semibold text-foreground min-w-[160px] text-center capitalize">
            {format(currentMonth, "MMMM yyyy", { locale: es })}
          </span>
          <Button variant="outline" size="icon" onClick={nextMonth} className="touch-target">
            <ChevronRight size={18} />
          </Button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mb-4 flex-wrap">
        {[
          { key: "weekly", label: "Semanal" },
          { key: "biweekly", label: "Quincenal" },
          { key: "monthly", label: "Mensual" },
        ].map((f) => (
          <div key={f.key} className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <div className={`w-2.5 h-2.5 rounded-full ${FREQ_COLORS[f.key]}`} />
            {f.label}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden mb-6">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 border-b border-border">
          {weekDays.map((d) => (
            <div key={d} className="py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              {d}
            </div>
          ))}
        </div>

        {/* Days */}
        {isLoading ? (
          <div className="p-4 grid grid-cols-7 gap-1">
            {Array.from({ length: 35 }).map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-7">
            {calendarDays.map((day) => {
              const key = format(day, "yyyy-MM-dd");
              const dayCuts = cutsMap.get(key) ?? [];
              const inMonth = isSameMonth(day, currentMonth);
              const isSelected = selectedDay ? isSameDay(day, selectedDay) : false;
              const todayDay = isToday(day);

              return (
                <button
                  key={key}
                  onClick={() => setSelectedDay(isSameDay(day, selectedDay ?? new Date(0)) ? null : day)}
                  className={`min-h-[72px] p-2 border-b border-r border-border/50 text-left transition-all duration-150 hover:bg-muted/50 ${
                    !inMonth ? "opacity-30" : ""
                  } ${isSelected ? "bg-primary/5 ring-2 ring-inset ring-primary/30" : ""}`}
                >
                  <span
                    className={`text-sm font-semibold inline-flex items-center justify-center w-7 h-7 rounded-full ${
                      todayDay
                        ? "bg-primary text-primary-foreground"
                        : isSelected
                        ? "text-primary"
                        : "text-foreground"
                    }`}
                  >
                    {format(day, "d")}
                  </span>
                  {dayCuts.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-0.5">
                      {dayCuts.slice(0, 3).map((item) => (
                        <div
                          key={item.cut.id}
                          className={`h-1.5 rounded-full flex-1 min-w-[6px] max-w-[20px] ${FREQ_COLORS[item.client.frequency]}`}
                          title={item.client.name}
                        />
                      ))}
                      {dayCuts.length > 3 && (
                        <span className="text-[9px] text-muted-foreground font-medium">+{dayCuts.length - 3}</span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Selected day detail */}
      {selectedDay && (
        <div className="bg-card rounded-2xl border border-border shadow-sm p-5">
          <h2 className="font-bold text-foreground mb-4 capitalize">
            {format(selectedDay, "EEEE, d 'de' MMMM", { locale: es })}
          </h2>
          {selectedCuts.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-4">
              Sin cortes programados para este día
            </p>
          ) : (
            <div className="space-y-2">
              {selectedCuts.map((item) => (
                <div
                  key={item.cut.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-muted/50"
                >
                  <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${FREQ_COLORS[item.client.frequency]}`} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground text-sm">{item.client.name}</p>
                  </div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      item.cut.status === "completed"
                        ? "bg-emerald-100 text-emerald-700"
                        : item.cut.status === "skipped"
                        ? "bg-gray-100 text-gray-600"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {item.cut.status === "completed" ? "Completado" : item.cut.status === "skipped" ? "Omitido" : "Pendiente"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

