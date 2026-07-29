import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import {
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  Users,
  ShieldCheck,
} from "lucide-react";

const STATUS_LABELS: Record<string, string> = {
  pending: "Pendiente",
  approved: "Aprobado",
  rejected: "Rechazado",
};

const STATUS_COLORS: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  pending: "secondary",
  approved: "default",
  rejected: "destructive",
};

export default function AdminUsers() {
  const utils = trpc.useUtils();

  const { data: users, isLoading } = trpc.admin.listUsers.useQuery(undefined, {
    refetchOnWindowFocus: false,
  });

  const approveMutation = trpc.admin.approveUser.useMutation({
    onSuccess: () => utils.admin.listUsers.invalidate(),
  });
  const rejectMutation = trpc.admin.rejectUser.useMutation({
    onSuccess: () => utils.admin.listUsers.invalidate(),
  });
  const pendingMutation = trpc.admin.setPending.useMutation({
    onSuccess: () => utils.admin.listUsers.invalidate(),
  });

  const isMutating =
    approveMutation.isPending ||
    rejectMutation.isPending ||
    pendingMutation.isPending;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner className="text-primary" />
      </div>
    );
  }

  const pending = users?.filter((u) => u.status === "pending") ?? [];
  const approved = users?.filter((u) => u.status === "approved") ?? [];
  const rejected = users?.filter((u) => u.status === "rejected") ?? [];

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow">
          <ShieldCheck size={20} className="text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Gestión de Usuarios
          </h1>
          <p className="text-muted-foreground text-sm">
            Aprueba o rechaza el acceso de usuarios a LawnPro
          </p>
        </div>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-card rounded-xl border border-border p-4 flex items-center gap-3">
          <Clock size={20} className="text-yellow-500" />
          <div>
            <p className="text-2xl font-bold text-foreground">
              {pending.length}
            </p>
            <p className="text-xs text-muted-foreground">Pendientes</p>
          </div>
        </div>
        <div className="bg-card rounded-xl border border-border p-4 flex items-center gap-3">
          <CheckCircle size={20} className="text-green-500" />
          <div>
            <p className="text-2xl font-bold text-foreground">
              {approved.length}
            </p>
            <p className="text-xs text-muted-foreground">Aprobados</p>
          </div>
        </div>
        <div className="bg-card rounded-xl border border-border p-4 flex items-center gap-3">
          <XCircle size={20} className="text-red-500" />
          <div>
            <p className="text-2xl font-bold text-foreground">
              {rejected.length}
            </p>
            <p className="text-xs text-muted-foreground">Rechazados</p>
          </div>
        </div>
      </div>

      {/* Lista de usuarios */}
      {(!users || users.length === 0) ? (
        <div className="bg-card rounded-xl border border-border p-12 text-center">
          <Users size={40} className="text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">
            No hay usuarios registrados todavía.
          </p>
          <p className="text-muted-foreground text-sm mt-1">
            Cuando alguien inicie sesión con Google aparecerá aquí.
          </p>
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <h2 className="font-semibold text-foreground flex items-center gap-2">
              <Users size={16} />
              Todos los usuarios ({users.length})
            </h2>
          </div>
          <div className="divide-y divide-border">
            {users.map((user) => (
              <div
                key={user.id}
                className="flex items-center gap-4 px-6 py-4 hover:bg-muted/30 transition-colors"
              >
                {/* Avatar */}
                <div className="shrink-0">
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.name ?? user.email}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-primary font-bold text-sm">
                        {(user.name ?? user.email)
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">
                    {user.name ?? "Sin nombre"}
                  </p>
                  <p className="text-sm text-muted-foreground truncate">
                    {user.email}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Registrado:{" "}
                    {new Date(user.createdAt).toLocaleDateString("es-ES", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>

                {/* Status badge */}
                <Badge variant={STATUS_COLORS[user.status] ?? "outline"}>
                  {STATUS_LABELS[user.status] ?? user.status}
                </Badge>

                {/* Acciones */}
                <div className="flex items-center gap-2 shrink-0">
                  {user.status !== "approved" && (
                    <Button
                      size="sm"
                      variant="default"
                      className="gap-1.5 bg-green-600 hover:bg-green-700 text-white"
                      disabled={isMutating}
                      onClick={() =>
                        approveMutation.mutate({ userId: user.id })
                      }
                    >
                      <CheckCircle size={14} />
                      Aprobar
                    </Button>
                  )}
                  {user.status !== "rejected" && (
                    <Button
                      size="sm"
                      variant="destructive"
                      className="gap-1.5"
                      disabled={isMutating}
                      onClick={() => rejectMutation.mutate({ userId: user.id })}
                    >
                      <XCircle size={14} />
                      Rechazar
                    </Button>
                  )}
                  {user.status !== "pending" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5"
                      disabled={isMutating}
                      onClick={() =>
                        pendingMutation.mutate({ userId: user.id })
                      }
                    >
                      <RefreshCw size={14} />
                      Pendiente
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
