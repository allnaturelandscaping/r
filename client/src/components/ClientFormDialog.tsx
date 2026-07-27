import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useEffect, useState } from "react";

type ClientData = {
  id: number;
  name: string;
  address: string;
  phone: string | null;
  frequency: "weekly" | "biweekly" | "monthly";
  notes: string | null;
};

function todayISODate() {
  return new Date().toISOString().split("T")[0];
}

export default function ClientFormDialog({
  open,
  client,
  onClose,
  onSuccess,
}: {
  open: boolean;
  client?: ClientData | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const isEdit = !!client;
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [frequency, setFrequency] = useState<"weekly" | "biweekly" | "monthly">("biweekly");
  const [notes, setNotes] = useState("");
  const [firstCutDate, setFirstCutDate] = useState(todayISODate());

  useEffect(() => {
    if (client) {
      setName(client.name);
      setAddress(client.address);
      setPhone(client.phone ?? "");
      setFrequency(client.frequency);
      setNotes(client.notes ?? "");
    } else {
      setName(""); setAddress(""); setPhone(""); setFrequency("biweekly");
      setNotes(""); setFirstCutDate(todayISODate());
    }
  }, [client, open]);

  const createMutation = trpc.clients.create.useMutation({
    onSuccess: () => { toast.success("Cliente agregado exitosamente"); onSuccess(); },
    onError: () => toast.error("Error al agregar el cliente"),
  });
  const updateMutation = trpc.clients.update.useMutation({
    onSuccess: () => { toast.success("Cliente actualizado"); onSuccess(); },
    onError: () => toast.error("Error al actualizar el cliente"),
  });

  const loading = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !address.trim()) {
      toast.error("Nombre y dirección son requeridos");
      return;
    }
    if (isEdit && client) {
      updateMutation.mutate({
        id: client.id,
        name: name.trim(),
        address: address.trim(),
        phone: phone.trim() || null,
        frequency,
        notes: notes.trim() || null,
      });
    } else {
      const dateTs = new Date(firstCutDate + "T12:00:00").getTime();
      createMutation.mutate({
        name: name.trim(),
        address: address.trim(),
        phone: phone.trim() || undefined,
        frequency,
        notes: notes.trim() || undefined,
        firstCutDate: dateTs,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {isEdit ? "Editar cliente" : "Nuevo cliente"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="name">Nombre *</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Juan Pérez" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="address">Dirección *</Label>
            <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Ej: 123 Oak Street, Miami FL" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phone">Teléfono</Label>
            <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Ej: (305) 555-0123" type="tel" />
          </div>
          <div className="space-y-1.5">
            <Label>Frecuencia de corte *</Label>
            <Select value={frequency} onValueChange={(v) => setFrequency(v as any)}>
              <SelectTrigger className="touch-target">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly">Semanal (cada 7 días)</SelectItem>
                <SelectItem value="biweekly">Quincenal (cada 14 días)</SelectItem>
                <SelectItem value="monthly">Mensual (cada 30 días)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {!isEdit && (
            <div className="space-y-1.5">
              <Label htmlFor="firstCut">Fecha del primer corte *</Label>
              <Input
                id="firstCut"
                type="date"
                value={firstCutDate}
                onChange={(e) => setFirstCutDate(e.target.value)}
                required
              />
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="notes">Notas</Label>
            <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Instrucciones especiales, acceso, etc." className="resize-none h-20" />
          </div>
          <DialogFooter className="gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "Guardando..." : isEdit ? "Guardar cambios" : "Agregar cliente"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
