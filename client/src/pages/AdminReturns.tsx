import { useEffect, useMemo, useState } from "react";
import { Check, ImageIcon, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { useAdminStore } from "@/store/useAdminStore";

const REASON_LABEL: Record<string, string> = {
  damaged: "Arrived damaged",
  wrong_item: "Wrong item sent",
  not_as_described: "Not as described",
  other: "Something else",
};

const statusBadge = (status: string) =>
  status === "approved"
    ? "bg-green-100 text-green-700"
    : status === "rejected"
    ? "bg-red-100 text-red-700"
    : "bg-amber-100 text-amber-700";

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });

export default function AdminReturns() {
  const { returns, returnStats, loadingReturns, decidingReturn, fetchReturns, decideReturn } =
    useAdminStore();

  const [status, setStatus] = useState("requested");
  const [active, setActive] = useState<any>(null);
  const [note, setNote] = useState("");
  const [restock, setRestock] = useState(false);

  useEffect(() => {
    fetchReturns({ status });
  }, [status, fetchReturns]);

  const open = (request: any) => {
    setActive(request);
    setNote("");
    // damaged goods are the common case, so restocking is off unless chosen
    setRestock(false);
  };

  const decide = async (decision: "approved" | "rejected") => {
    if (!active) return;

    const res = await decideReturn({ id: active.id, decision, adminNote: note, restock });

    if (res?.success) {
      toast.success(res.message);
      setActive(null);
      fetchReturns({ status });
    } else {
      toast.error(res?.message || "Couldn't update the request");
    }
  };

  const tiles = useMemo(
    () => [
      { label: "Awaiting review", value: returnStats.pending },
      { label: "Approved", value: returnStats.approved },
      { label: "Total requests", value: returnStats.total },
      { label: "Refunded", value: `₹${Math.round((returnStats.refunded || 0) / 100)}` },
    ],
    [returnStats]
  );

  return (
    <div className="p-8 space-y-6 bg-gradient-to-b from-amber-50 to-white">
      <div>
        <h1 className="text-3xl font-bold">Returns</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Approving a return refunds the value of those lines to the customer straight away.
          Restock only what's still sellable.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {tiles.map((tile) => (
          <div key={tile.label} className="rounded-xl border bg-white p-4">
            <p className="text-xs text-muted-foreground uppercase">{tile.label}</p>
            <p className="text-2xl font-semibold mt-1">{tile.value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-52 bg-white">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="bg-white border shadow-lg z-50">
            <SelectItem value="requested">Awaiting review</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="all">All</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="px-4 py-3 text-left">Order</th>
              <th className="px-4 py-3 text-left">Customer</th>
              <th className="px-4 py-3 text-left">Reason</th>
              <th className="px-4 py-3 text-left">Items</th>
              <th className="px-4 py-3 text-left">Refundable</th>
              <th className="px-4 py-3 text-left">Raised</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Action</th>
            </tr>
          </thead>

          <tbody>
            {loadingReturns ? (
              <tr>
                <td className="px-4 py-10 text-center text-muted-foreground" colSpan={8}>
                  Loading returns...
                </td>
              </tr>
            ) : !returns.length ? (
              <tr>
                <td className="px-4 py-10 text-center text-muted-foreground" colSpan={8}>
                  Nothing here — no returns with this status
                </td>
              </tr>
            ) : (
              returns.map((request: any) => (
                <tr key={request.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{request.orderCode || `#${request.orderId}`}</td>

                  <td className="px-4 py-3">
                    <div className="font-medium">{request.customerName || "Unnamed"}</div>
                    <div className="text-xs text-gray-500">{request.customerEmail}</div>
                  </td>

                  <td className="px-4 py-3">
                    <div>{REASON_LABEL[request.reason] || request.reason}</div>
                    {request.photos?.length > 0 && (
                      <div className="mt-0.5 flex items-center gap-1 text-xs text-gray-500">
                        <ImageIcon className="h-3 w-3" />
                        {request.photos.length} photo{request.photos.length === 1 ? "" : "s"}
                      </div>
                    )}
                  </td>

                  <td className="px-4 py-3">
                    {request.items?.map((i: any, idx: number) => (
                      <div key={idx} className="text-xs">
                        {i.name} × {i.quantity}
                      </div>
                    ))}
                  </td>

                  <td className="px-4 py-3 whitespace-nowrap font-medium">₹{request.refundable}</td>

                  <td className="px-4 py-3 whitespace-nowrap">{formatDate(request.createdAt)}</td>

                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusBadge(request.status)}`}>
                      {request.status}
                    </span>
                    {request.refundAmount > 0 && (
                      <div className="mt-1 text-xs text-gray-500">
                        ₹{Math.round(request.refundAmount / 100)} refunded
                      </div>
                    )}
                  </td>

                  <td className="px-4 py-3">
                    {request.status === "requested" ? (
                      <Button size="sm" variant="outline" onClick={() => open(request)}>
                        Review
                      </Button>
                    ) : (
                      <span className="text-xs text-gray-400">
                        {request.adminNote ? "Noted" : "—"}
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={Boolean(active)} onOpenChange={(next) => !next && !decidingReturn && setActive(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {active?.orderCode || `#${active?.orderId}`} — {REASON_LABEL[active?.reason] || active?.reason}
            </DialogTitle>
          </DialogHeader>

          {active && (
            <div className="space-y-4 text-sm">
              <div>
                <p className="font-medium">{active.customerName}</p>
                <p className="text-xs text-muted-foreground">{active.customerEmail}</p>
              </div>

              {active.comment && (
                <div className="rounded-xl border bg-slate-50/60 p-3 whitespace-pre-wrap">
                  {active.comment}
                </div>
              )}

              <div className="rounded-xl border border-amber-100 bg-amber-50/40 p-3">
                {active.items?.map((i: any, idx: number) => (
                  <div key={idx} className="flex justify-between gap-3 py-0.5">
                    <span>{i.name} × {i.quantity}</span>
                    <span className="font-medium">₹{i.price * i.quantity}</span>
                  </div>
                ))}
                <div className="mt-2 flex justify-between border-t pt-2 font-semibold">
                  <span>Refund if approved</span>
                  <span>₹{active.refundable}</span>
                </div>
              </div>

              {active.photos?.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {active.photos.map((photo: string) => (
                    <a
                      key={photo}
                      href={`${import.meta.env.VITE_UPLOADS_URL || ""}/uploads/returns/${photo}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-primary underline"
                    >
                      {photo.slice(0, 18)}…
                    </a>
                  ))}
                </div>
              )}

              <div className="space-y-2">
                <Label>Note to the customer (optional)</Label>
                <Textarea
                  rows={3}
                  className="resize-none"
                  placeholder="Goes out in the email they receive"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>

              <label className="flex items-start gap-2">
                <Checkbox
                  checked={restock}
                  onCheckedChange={(v) => setRestock(Boolean(v))}
                  className="mt-0.5"
                />
                <span className="text-sm">
                  Put these units back on sale
                  <span className="block text-xs text-muted-foreground">
                    Leave off for damaged or opened goods — stock only moves if this is ticked
                  </span>
                </span>
              </label>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" disabled={decidingReturn} onClick={() => decide("rejected")}>
              <X className="mr-1 h-4 w-4" />
              Decline
            </Button>
            <Button disabled={decidingReturn} onClick={() => decide("approved")}>
              <Check className="mr-1 h-4 w-4" />
              {decidingReturn ? "Working..." : `Approve & refund ₹${active?.refundable ?? 0}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
