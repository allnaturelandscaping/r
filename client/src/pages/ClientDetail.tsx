import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  ArrowLeft,
  Phone,
  MapPin,
  Calendar,
  CheckCircle2,
  Clock,
  XCircle,
  Pencil,
  Plus,
} from "lucide-react";
import { useLocation, useParams } from "wouter";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useState } from "react";
import ClientFormDialog from "@/components/ClientFormDialog";
import CompleteCutDialog from "@/components/CompleteCutDialog";

const FREQ_LABELS: Record<string, string> = {
  weekly: "Semanal",
  biweekly: "Quincenal",
  monthly: "Mensual",
};

const STATUS_CONFIG = {
  pending: { label: "Pendiente", icon: Clock, className: "bg-amber-100 text-amber-700" },
  completed: { label: "Completado", icon: CheckCircle2, className: "bg-emerald-100 text-emerald-700" },
  skipped: { label: "Omitido", icon: XCircle, className: "bg-gray-100 text-gray-600" },
};

type CutWithClient = {
  cut: { id: number; clientId: number; scheduledDate: number; status: string; notes: string | null };
  client: { id: number; name: string; address: string; phone: string | null; frequency: "weekly" | "biweekly" | "monthly" };
};

export default function ClientDetail() {
  const params = useParams<{ id: string }>();
  const clientId = parseInt(params.id ?? "0");
  const [, navigate] = useLocation();
  const [showEdit, setShowEdit] = useState(false);
  const [completingCut, setCompletingCut] = useState<CutWithClient | null>(null);

  const utils = trpc.useUtils();
  const { data: client, isLoading: loadingClient } = trpc.clients.get.useQuery(
    { id: clientId },
    { enabled: !!clientId }
  );
  const { data: history, isLoading: loadingHistory } = trpc.cuts.history.useQuery(
    { clientId },
    { enabled: !!clientId }
  );

  const completeMutation = trpc.cuts.complete.useMutation({
    onSuccess: (data) => {
      const nextDate = new Date(data.nextCutDate).toLocaleDateString("es", {
        weekday: "long", day: "numeric", month: "long",
      });
      toast.success("Corte completado", { description: `Próximo: ${nextDate}` });
      utils.cuts.history.invalidate({ clientId });
      utils.cuts.dashboard.invalidate();
      setCompletingCut(null);
    },
    onError: () => toast.error("Error al completar el corte"),
  });

  if (loadingClient) {
    return (
      <div className="p-6 lg:p-8 max-w-3xl mx-auto space-y-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-40 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">Cliente no encontrado</p>
        <Button variant="outline" onClick={() => navigate("/clients")} className="mt-4">
          Volver a clientes
        </Button>
      </div>
    );
  }

  const pendingCuts = history?.filter((c) => c.status === "pending") ?? [];
  const completedCuts = history?.filter((c) => c.status === "completed") ?? [];

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto">
      {/* Back */}
      <button
        onClick={() => navigate("/clients")}
        className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors mb-6 text-sm font-medium"
      >
        <ArrowLeft size={16} /> Volver a clientes
      </button>

      {/* Client header */}
      <div className="bg-card rounded-2xl border border-border p-6 mb-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
              <span className="text-primary font-bold text-2xl">
                {client.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: "var(--font-display)" }}>
                {client.name}
              </h1>
              <span className="text-xs px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground font-medium mt-1 inline-block">
                {FREQ_LABELS[client.frequency]}
              </span>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => setShowEdit(true)} className="gap-1.5 shrink-0">
            <Pencil size={14} /> Editar
          </Button>
        </div>

        <div className="mt-4 space-y-2">
          <p className="text-muted-foreground text-sm flex items-center gap-2">
            <MapPin size={14} className="shrink-0" /> {client.address}
          </p>
          {client.phone && (
            <p className="text-muted-foreground text-sm flex items-center gap-2">
              <Phone size={14} className="shrink-0" /> {client.phone}
            </p>
          )}
          {client.notes && (
            <p className="text-muted-foreground text-sm mt-3 bg-muted rounded-lg px-3 py-2">
              {client.notes}
            </p>
          )}
        </div>

        <div className="mt-4 pt-4 border-t border-border flex gap-6">
          <div>
            <p className="text-2xl font-bold text-foreground">{completedCuts.length}</p>
            <p className="text-muted-foreground text-xs">Cortes realizados</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{pendingCuts.length}</p>
            <p className="text-muted-foreground text-xs">Pendientes</p>
          </div>
        </div>
      </div>

      {/* History */}
      <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
        <h2 className="font-bold text-foreground text-lg mb-4 flex items-center gap-2">
          <Calendar size={18} className="text-primary" />
          Historial de cortes
        </h2>

        {loadingHistory ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
          </div>
        ) : !history || history.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground text-sm">No hay cortes registrados aún</p>
          </div>
        ) : (
          <div className="space-y-2">
            {history.map((cut) => {
              const cfg = STATUS_CONFIG[cut.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.pending;
              const Icon = cfg.icon;
              const isPending = cut.status === "pending";
              return (
                <div
                  key={cut.id}
                  className="flex items-center gap-3 p-3.5 rounded-xl hover:bg-muted/50 transition-colors"
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${cfg.className}`}>
                    <Icon size={15} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground text-sm">
                      {format(new Date(cut.scheduledDate), "EEEE, d 'de' MMMM yyyy", { locale: es })}
                    </p>
                    {cut.notes && (
                      <p className="text-muted-foreground text-xs truncate mt-0.5">{cut.notes}</p>
                    )}
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.className}`}>
                    {cfg.label}
                  </span>
                  {isPending && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="shrink-0 gap-1 text-xs h-8 px-3"
                      onClick={() =>
                        setCompletingCut({
                          cut: { id: cut.id, clientId: client.id, scheduledDate: cut.scheduledDate, status: cut.status, notes: cut.notes },
                          client,
                        })
                      }
                    >
                      <CheckCircle2 size={13} /> Completar
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Dialogs */}
      <ClientFormDialog
        open={showEdit}
        client={client}
        onClose={() => setShowEdit(false)}
        onSuccess={() => {
          utils.clients.get.invalidate({ id: clientId });
          utils.clients.list.invalidate();
          setShowEdit(false);
        }}
      />

      {completingCut && (
        <CompleteCutDialog
          item={completingCut}
          open={!!completingCut}
          loading={completeMutation.isPending}
          onConfirm={(item, notes) =>
            completeMutation.mutate({
              cutId: item.cut.id,
              clientId: item.client.id,
              frequency: item.client.frequency,
              scheduledDate: item.cut.scheduledDate,
              notes,
            })
          }
          onClose={() => setCompletingCut(null)}
        />
      )}
    </div>
  );
}
