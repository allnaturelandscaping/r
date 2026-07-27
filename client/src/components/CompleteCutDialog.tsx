import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CheckCircle2, MapPin, Phone, RefreshCw } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const FREQ_LABELS: Record<string, string> = {
  weekly: "Semanal (+7 días)",
  biweekly: "Quincenal (+14 días)",
  monthly: "Mensual (+30 días)",
};

type CutWithClient = {
  cut: { id: number; clientId: number; scheduledDate: number; status: string; notes: string | null };
  client: { id: number; name: string; address: string; phone: string | null; frequency: "weekly" | "biweekly" | "monthly" };
};

function getNextDate(ts: number, freq: string): Date {
  const days = freq === "weekly" ? 7 : freq === "biweekly" ? 14 : 30;
  return new Date(ts + days * 24 * 60 * 60 * 1000);
}

export default function CompleteCutDialog({
  item,
  open,
  loading,
  onConfirm,
  onClose,
}: {
  item: CutWithClient;
  open: boolean;
  loading: boolean;
  onConfirm: (item: CutWithClient, notes?: string) => void;
  onClose: () => void;
}) {
  const [notes, setNotes] = useState("");
  const nextDate = getNextDate(item.cut.scheduledDate, item.client.frequency);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <CheckCircle2 size={22} className="text-emerald-500" />
            Confirmar corte completado
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Client info */}
          <div className="bg-muted rounded-xl p-4 space-y-2">
            <p className="font-semibold text-foreground text-lg">{item.client.name}</p>
            <p className="text-muted-foreground text-sm flex items-center gap-1.5">
              <MapPin size={13} /> {item.client.address}
            </p>
            {item.client.phone && (
              <p className="text-muted-foreground text-sm flex items-center gap-1.5">
                <Phone size={13} /> {item.client.phone}
              </p>
            )}
          </div>

          {/* Next cut info */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <RefreshCw size={14} className="text-emerald-600" />
              <p className="text-emerald-700 font-semibold text-sm">Próximo corte automático</p>
            </div>
            <p className="text-emerald-800 font-bold">
              {format(nextDate, "EEEE, d 'de' MMMM yyyy", { locale: es })}
            </p>
            <p className="text-emerald-600 text-xs mt-0.5">{FREQ_LABELS[item.client.frequency]}</p>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="notes" className="text-sm font-medium">
              Notas (opcional)
            </Label>
            <Textarea
              id="notes"
              placeholder="Ej: Se cortó el jardín trasero y delantero..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="resize-none h-20"
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={loading} className="flex-1">
            Cancelar
          </Button>
          <Button
            onClick={() => onConfirm(item, notes || undefined)}
            disabled={loading}
            className="flex-1 gap-2"
          >
            <CheckCircle2 size={16} />
            {loading ? "Guardando..." : "Confirmar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
