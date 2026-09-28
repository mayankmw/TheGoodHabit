import { useEffect, useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import api from "@/lib/api";

const REASONS = [
  { value: "damaged", label: "Arrived damaged" },
  { value: "wrong_item", label: "Wrong item sent" },
  { value: "not_as_described", label: "Not as described" },
  { value: "other", label: "Something else" },
];

interface ClaimableLine {
  orderItemId: number;
  name: string;
  price: number;
  quantity: number;
  claimable: number;
}

export function ReturnRequestDialog({
  order,
  open,
  onOpenChange,
  onSubmitted,
}: {
  order: { id: number; orderCode?: string | null };
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmitted?: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [lines, setLines] = useState<ClaimableLine[]>([]);
  const [withinWindow, setWithinWindow] = useState(true);
  const [windowDays, setWindowDays] = useState(7);
  const [existing, setExisting] = useState<any[]>([]);

  const [reason, setReason] = useState("damaged");
  const [comment, setComment] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);
  const [picked, setPicked] = useState<number[]>([]);

  useEffect(() => {
    if (!open) return;

    setLoading(true);
    api
      .post("/orders/returnable", { orderId: order.id })
      .then(({ data }) => {
        setLines(data.items || []);
        setWithinWindow(Boolean(data.withinWindow));
        setWindowDays(data.windowDays || 7);
        setExisting(data.requests || []);
        setPicked([]);
        setComment("");
        setPhotos([]);
      })
      .catch(() => toast.error("Couldn't load this order"))
      .finally(() => setLoading(false));
  }, [open, order.id]);

  const claimable = lines.filter((l) => l.claimable > 0);
  const chosen = claimable.filter((l) => picked.includes(l.orderItemId));
  const refundable = chosen.reduce((sum, l) => sum + l.price * l.claimable, 0);

  const toggle = (orderItemId: number) =>
    setPicked((prev) =>
      prev.includes(orderItemId)
        ? prev.filter((id) => id !== orderItemId)
        : [...prev, orderItemId]
    );

  const submit = async () => {
    if (!chosen.length) {
      toast.error("Pick at least one item");
      return;
    }

    setSubmitting(true);
    try {
      // multipart, because photos ride along — so the item list is encoded
      const form = new FormData();
      form.append("orderId", String(order.id));
      form.append("reason", reason);
      form.append("comment", comment);
      // whole line at a time — the endpoint still accepts a partial quantity,
      // but asking a customer to count units was more friction than help
      form.append(
        "items",
        JSON.stringify(
          chosen.map((l) => ({ orderItemId: l.orderItemId, quantity: l.claimable }))
        )
      );
      photos.forEach((file) => form.append("photos", file));

      const { data } = await api.post("/orders/return", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (!data?.success) {
        toast.error(data?.message || "Couldn't send that");
        return;
      }

      toast.success(data.message);
      onOpenChange(false);
      onSubmitted?.();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Couldn't send that");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !submitting && onOpenChange(next)}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Report a problem with {order.orderCode || `#${order.id}`}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center gap-2 py-8 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading your order...
          </div>
        ) : !withinWindow ? (
          <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
            <p>
              Returns close {windowDays} days after delivery. Please contact us
              directly and we'll see what we can do.
            </p>
          </div>
        ) : !claimable.length ? (
          <p className="py-4 text-sm text-muted-foreground">
            You've already raised a return for everything in this order.
          </p>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>What went wrong?</Label>
              <Select value={reason} onValueChange={setReason}>
                <SelectTrigger className="bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border shadow-lg z-50">
                  {REASONS.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Which items had a problem?</Label>
              {claimable.map((line) => {
                const selected = picked.includes(line.orderItemId);

                return (
                  <label
                    key={line.orderItemId}
                    className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition ${
                      selected
                        ? "border-primary bg-amber-50"
                        : "border-amber-100 bg-amber-50/40 hover:border-amber-200"
                    }`}
                  >
                    <Checkbox
                      checked={selected}
                      onCheckedChange={() => toggle(line.orderItemId)}
                    />

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{line.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {line.claimable > 1 ? `${line.claimable} × ` : ""}₹{line.price}
                      </p>
                    </div>

                    <span className="shrink-0 text-sm font-semibold">
                      ₹{line.price * line.claimable}
                    </span>
                  </label>
                );
              })}
            </div>

            <div className="space-y-2">
              <Label>Anything else we should know? (optional)</Label>
              <Textarea
                rows={3}
                maxLength={1000}
                className="resize-none bg-white"
                placeholder="Tell us what happened"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Photos (optional, up to 4)</Label>
              <Input
                type="file"
                accept="image/*"
                multiple
                className="bg-white"
                onChange={(e) =>
                  setPhotos(e.target.files ? Array.from(e.target.files).slice(0, 4) : [])
                }
              />
              {photos.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {photos.length} photo{photos.length === 1 ? "" : "s"} attached — these
                  help us sort it out faster
                </p>
              )}
            </div>

            {refundable > 0 && (
              <p className="text-sm">
                If approved, you'd be refunded{" "}
                <strong className="text-primary">₹{refundable}</strong>.
              </p>
            )}
          </div>
        )}

        {existing.length > 0 && (
          <div className="rounded-xl border bg-slate-50/60 p-3 text-xs text-muted-foreground">
            <p className="font-semibold text-foreground/80">Previous requests</p>
            {existing.map((r) => (
              <p key={r.id} className="mt-1">
                #{r.id} — {r.status}
                {r.refundAmount ? ` · ₹${Math.round(r.refundAmount / 100)} refunded` : ""}
              </p>
            ))}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" disabled={submitting} onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {withinWindow && claimable.length > 0 && (
            <Button disabled={submitting || !chosen.length} onClick={submit}>
              {submitting ? "Sending..." : "Send request"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
