import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  CalendarDays,
  Scissors,
  ChevronRight,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { format, isToday, isTomorrow } from "date-fns";
import { es } from "date-fns/locale";
import CompleteCutDialog from "@/components/CompleteCutDialog";

const FREQ_LABELS: Record<string, string> = {
  weekly: "Semanal",
  biweekly: "Quincenal",
  monthly: "Mensual",
};

function formatScheduledDate(ts: number) {
  const d = new Date(ts);
  if (isToday(d)) return "Hoy";
  if (isTomorrow(d)) return "Mañana";
  return format(d, "EEEE d MMM", { locale: es });
}

type CutWithClient = {
  cut: {
    id: number;
    clientId: number;
    scheduledDate: number;
    status: string;
    notes: string | null;
  };
  client: {
    id: number;
    name: string;
    address: string;
    phone: string | null;
    frequency: "weekly" | "biweekly" | "monthly";
  };
};

function CutCard({
  item,
  urgency,
  onComplete,
}: {
  item: CutWithClient;
  urgency: "overdue" | "today" | "upcoming";
  onComplete: (item: CutWithClient) => void;
}) {
  const urgencyStyles = {
    overdue: "border-l-4 border-l-red-500 bg-red-50",
    today: "border-l-4 border-l-amber-400 bg-amber-50",
    upcoming: "border-l-4 border-l-emerald-500 bg-emerald-50/40",
  };
  const badgeStyles = {
    overdue: "bg-red-100 text-red-700 border-red-200",
    today: "bg-amber-100 text-amber-700 border-amber-200",
    upcoming: "bg-emerald-100 text-emerald-700 border-emerald-200",
  };
  const urgencyLabel = {
    overdue: "Vencido",
    today: "Hoy",
    upcoming: "Próximo",
  };

  return (
    <div
      className={`rounded-xl p-4 flex items-center gap-4 shadow-sm transition-all duration-200 hover:shadow-md ${urgencyStyles[urgency]}`}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <p className="font-semibold text-foreground text-base truncate">{item.client.name}</p>
          <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${badgeStyles[urgency]}`}>
            {urgencyLabel[urgency]}
          </span>
        </div>
        <p className="text-muted-foreground text-sm truncate">{item.client.address}</p>
        <div className="flex items-center gap-3 mt-1.5">
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock size={11} />
            {formatScheduledDate(item.cut.scheduledDate)}
          </span>
          <span className="text-xs text-muted-foreground">
            {FREQ_LABELS[item.client.frequency]}
          </span>
        </div>
      </div>
      <Button
        size="sm"
        className="touch-target shrink-0 font-semibold gap-1.5 px-4"
        onClick={() => onComplete(item)}
      >
        <CheckCircle2 size={16} />
        Completar
      </Button>
    </div>
  );
}

export default function Dashboard() {
  const [, navigate] = useLocation();
  const [completingItem, setCompletingItem] = useState<CutWithClient | null>(null);

  const todayStart = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }, []);
  const todayEnd = useMemo(() => {
    const d = new Date();
    d.setHours(23, 59, 59, 999);
    return d.getTime();
  }, []);
  const upcomingEnd = useMemo(() => todayEnd + 7 * 24 * 60 * 60 * 1000, [todayEnd]);

  const utils = trpc.useUtils();

  const { data: dashboard, isLoading } = trpc.cuts.dashboard.useQuery(
    { todayStart, todayEnd },
    { refetchOnWindowFocus: false }
  );
  const { data: upcoming } = trpc.cuts.upcoming.useQuery(
    { fromTs: todayEnd + 1, toTs: upcomingEnd },
    { refetchOnWindowFocus: false }
  );
  const { data: clients } = trpc.clients.list.useQuery(undefined, { refetchOnWindowFocus: false });

  const completeMutation = trpc.cuts.complete.useMutation({
    onSuccess: (data) => {
      const nextDate = new Date(data.nextCutDate).toLocaleDateString("es", {
        weekday: "long",
        day: "numeric",
        month: "long",
      });
      toast.success("Corte completado", {
        description: `Próximo corte programado para el ${nextDate}`,
      });
      utils.cuts.dashboard.invalidate();
      utils.cuts.upcoming.invalidate();
      utils.cuts.calendar.invalidate();
      setCompletingItem(null);
    },
    onError: () => toast.error("Error al completar el corte"),
  });

  const handleComplete = (item: CutWithClient, notes?: string) => {
    completeMutation.mutate({
      cutId: item.cut.id,
      clientId: item.client.id,
      frequency: item.client.frequency,
      scheduledDate: item.cut.scheduledDate,
      notes,
    });
  };

  const todayCuts = (dashboard?.todayCuts ?? []) as CutWithClient[];
  const overdueCuts = (dashboard?.overdueCuts ?? []) as CutWithClient[];
  const upcomingCuts = (upcoming ?? []) as CutWithClient[];
  const totalClients = clients?.length ?? 0;
  const totalToday = todayCuts.length;
  const totalOverdue = overdueCuts.length;

  const today = format(new Date(), "EEEE, d 'de' MMMM yyyy", { locale: es });

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <p className="text-muted-foreground text-sm font-medium capitalize mb-1">{today}</p>
        <h1 className="text-3xl font-bold text-foreground" style={{ fontFamily: "var(--font-display)" }}>
          Panel de Control
        </h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <Card className="border-0 shadow-sm bg-card">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Scissors size={18} className="text-primary" />
              </div>
            </div>
            <p className="text-2xl font-bold text-foreground">{totalToday}</p>
            <p className="text-muted-foreground text-sm mt-0.5">Cortes hoy</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-card">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                <AlertTriangle size={18} className="text-red-500" />
              </div>
            </div>
            <p className="text-2xl font-bold text-foreground">{totalOverdue}</p>
            <p className="text-muted-foreground text-sm mt-0.5">Vencidos</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-card">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                <Users size={18} className="text-secondary-foreground" />
              </div>
            </div>
            <p className="text-2xl font-bold text-foreground">{totalClients}</p>
            <p className="text-muted-foreground text-sm mt-0.5">Clientes</p>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="space-y-8">
          {/* Vencidos */}
          {overdueCuts.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle size={16} className="text-red-500" />
                <h2 className="font-semibold text-foreground">Cortes vencidos</h2>
                <Badge variant="destructive" className="text-xs">{overdueCuts.length}</Badge>
              </div>
              <div className="space-y-2">
                {overdueCuts.map((item) => (
                  <CutCard
                    key={item.cut.id}
                    item={item}
                    urgency="overdue"
                    onComplete={setCompletingItem}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Hoy */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Scissors size={16} className="text-primary" />
              <h2 className="font-semibold text-foreground">Cortes de hoy</h2>
              {todayCuts.length > 0 && (
                <Badge className="text-xs bg-primary/10 text-primary border-primary/20">
                  {todayCuts.length}
                </Badge>
              )}
            </div>
            {todayCuts.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border p-8 text-center">
                <CheckCircle2 size={32} className="text-emerald-500 mx-auto mb-2" />
                <p className="text-muted-foreground font-medium">No hay cortes programados para hoy</p>
                <p className="text-muted-foreground text-sm mt-1">¡Disfruta el día libre!</p>
              </div>
            ) : (
              <div className="space-y-2">
                {todayCuts.map((item) => (
                  <CutCard
                    key={item.cut.id}
                    item={item}
                    urgency="today"
                    onComplete={setCompletingItem}
                  />
                ))}
              </div>
            )}
          </section>

          {/* Próximos 7 días */}
          {upcomingCuts.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <CalendarDays size={16} className="text-muted-foreground" />
                  <h2 className="font-semibold text-foreground">Próximos 7 días</h2>
                </div>
                <button
                  onClick={() => navigate("/calendar")}
                  className="text-primary text-sm font-medium flex items-center gap-1 hover:underline"
                >
                  Ver calendario <ChevronRight size={14} />
                </button>
              </div>
              <div className="space-y-2">
                {upcomingCuts.slice(0, 5).map((item) => (
                  <CutCard
                    key={item.cut.id}
                    item={item}
                    urgency="upcoming"
                    onComplete={setCompletingItem}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* Complete dialog */}
      {completingItem && (
        <CompleteCutDialog
          item={completingItem}
          open={!!completingItem}
          loading={completeMutation.isPending}
          onConfirm={handleComplete}
          onClose={() => setCompletingItem(null)}
        />
      )}
    </div>
  );
}
