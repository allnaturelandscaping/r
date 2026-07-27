import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Plus,
  Phone,
  MapPin,
  Calendar,
  Pencil,
  Trash2,
  ChevronRight,
  Users,
} from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import ClientFormDialog from "@/components/ClientFormDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const FREQ_LABELS: Record<string, string> = {
  weekly: "Semanal",
  biweekly: "Quincenal",
  monthly: "Mensual",
};
const FREQ_COLORS: Record<string, string> = {
  weekly: "bg-emerald-100 text-emerald-700",
  biweekly: "bg-blue-100 text-blue-700",
  monthly: "bg-purple-100 text-purple-700",
};

export default function Clients() {
  const [, navigate] = useLocation();
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState<any>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const utils = trpc.useUtils();
  const { data: clients, isLoading } = trpc.clients.list.useQuery(undefined, {
    refetchOnWindowFocus: false,
  });

  const deleteMutation = trpc.clients.delete.useMutation({
    onSuccess: () => {
      toast.success("Cliente eliminado");
      utils.clients.list.invalidate();
      setDeletingId(null);
    },
    onError: () => toast.error("Error al eliminar el cliente"),
  });

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground" style={{ fontFamily: "var(--font-display)" }}>
            Clientes
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {clients?.length ?? 0} clientes registrados
          </p>
        </div>
        <Button
          size="lg"
          className="touch-target gap-2 font-semibold"
          onClick={() => { setEditingClient(null); setShowForm(true); }}
        >
          <Plus size={18} />
          Nuevo cliente
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
      ) : clients?.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
            <Users size={28} className="text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-1">Sin clientes aún</h3>
          <p className="text-muted-foreground text-sm mb-6">
            Agrega tu primer cliente para comenzar a programar cortes
          </p>
          <Button onClick={() => setShowForm(true)} className="gap-2">
            <Plus size={16} /> Agregar primer cliente
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {clients?.map((client) => (
            <Card
              key={client.id}
              className="border-0 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group"
              onClick={() => navigate(`/clients/${client.id}`)}
            >
              <CardContent className="p-5 flex items-center gap-4">
                {/* Avatar */}
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-primary font-bold text-lg">
                    {client.name.charAt(0).toUpperCase()}
                  </span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-foreground text-base truncate">{client.name}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${FREQ_COLORS[client.frequency]}`}>
                      {FREQ_LABELS[client.frequency]}
                    </span>
                  </div>
                  <p className="text-muted-foreground text-sm flex items-center gap-1 truncate">
                    <MapPin size={12} /> {client.address}
                  </p>
                  {client.phone && (
                    <p className="text-muted-foreground text-sm flex items-center gap-1 mt-0.5">
                      <Phone size={12} /> {client.phone}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    className="p-2.5 rounded-xl hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingClient(client);
                      setShowForm(true);
                    }}
                    title="Editar"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    className="p-2.5 rounded-xl hover:bg-red-50 transition-colors text-muted-foreground hover:text-red-500"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeletingId(client.id);
                    }}
                    title="Eliminar"
                  >
                    <Trash2 size={16} />
                  </button>
                  <ChevronRight size={18} className="text-muted-foreground/40 group-hover:text-muted-foreground transition-colors ml-1" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Form dialog */}
      <ClientFormDialog
        open={showForm}
        client={editingClient}
        onClose={() => { setShowForm(false); setEditingClient(null); }}
        onSuccess={() => {
          utils.clients.list.invalidate();
          setShowForm(false);
          setEditingClient(null);
        }}
      />

      {/* Delete confirm */}
      <AlertDialog open={deletingId !== null} onOpenChange={() => setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar cliente?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El cliente y sus cortes programados serán eliminados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => deletingId && deleteMutation.mutate({ id: deletingId })}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
