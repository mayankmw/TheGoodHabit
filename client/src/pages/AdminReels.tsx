import { useEffect, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  Check,
  ExternalLink,
  GripVertical,
  Instagram,
  Music,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import {
  useAdminStore,
  type AdminReel,
  type InstagramStatus,
  type InstagramVideo,
} from "@/store/useAdminStore";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

/* dnd-kit */
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// Instagram withholds the video file for reels with licensed music, and its
// embed won't play them either
const LICENSED_MUSIC_NOTE = "This reel uses licensed music, so Instagram only lets it play on Instagram.";

const formatDate = (value: string | null) =>
  value
    ? new Date(value).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })
    : "";

/* ---------------- SMALL PIECES ---------------- */

function SortableRow({ id, children }: { id: number; children: ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });

  return (
    <tr
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className="border-t hover:bg-gray-50"
    >
      <td className="px-2 text-gray-400 cursor-grab" {...attributes} {...listeners}>
        <GripVertical size={16} />
      </td>
      {children}
    </tr>
  );
}

function Cover({ src, className }: { src: string | null; className?: string }) {
  return src ? (
    <img src={src} alt="" className={cn("shrink-0 rounded bg-muted object-cover", className)} />
  ) : (
    <div className={cn("flex shrink-0 items-center justify-center rounded bg-muted text-muted-foreground", className)}>
      <Instagram size={16} />
    </div>
  );
}

function ProductSelect({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const products = useAdminStore((s) => s.products) as { id: number | string; name: string }[];

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="bg-white border border-input">
        <SelectValue placeholder="Select the product this reel sells" />
      </SelectTrigger>
      <SelectContent className="bg-white border shadow-lg z-50">
        {products.map((p) => (
          <SelectItem key={p.id} value={String(p.id)}>
            {p.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function InstagramBanner({ instagram }: { instagram: InstagramStatus | null }) {
  if (!instagram) return null;

  if (instagram.problem) {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
        <p>{instagram.problem}</p>
      </div>
    );
  }

  if (!instagram.connected) {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        <Instagram className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          Instagram isn't connected yet. Add an access token for the account as{" "}
          <code className="rounded bg-amber-100 px-1">INSTAGRAM_ACCESS_TOKEN</code> in{" "}
          <code className="rounded bg-amber-100 px-1">server/.env</code> and restart the server. Reels
          are picked from that account.
        </p>
      </div>
    );
  }

  return (
    <p className="flex items-center gap-2 text-sm text-muted-foreground">
      <Instagram size={14} />
      Reels are picked from
      <a
        href={`https://www.instagram.com/${instagram.username}/`}
        target="_blank"
        rel="noopener noreferrer"
        className="font-medium text-primary hover:underline"
      >
        @{instagram.username}
      </a>
      <span>· the access token renews itself</span>
    </p>
  );
}

/* ---------------- ADD ---------------- */

function AddReelDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const {
    instagram,
    instagramVideos,
    instagramVideosCursor,
    loadingInstagramVideos,
    fetchInstagramVideos,
    createReel,
    savingReel,
  } = useAdminStore();

  const [selected, setSelected] = useState<InstagramVideo | null>(null);
  const [productId, setProductId] = useState("");
  const [loadError, setLoadError] = useState<string | null>(null);

  // a fresh list each time, so reels added or posted since are current
  useEffect(() => {
    if (!open) return;
    setSelected(null);
    setProductId("");
    setLoadError(null);
    fetchInstagramVideos().then((res) => {
      if (!res?.success) setLoadError(res?.message || "Couldn't load videos from Instagram");
    });
  }, [open, fetchInstagramVideos]);

  const loadMore = async () => {
    const res = await fetchInstagramVideos({ more: true });
    if (!res?.success) toast.error(res?.message || "Couldn't load more videos");
  };

  const save = async () => {
    if (!selected || !productId) return;

    const res = await createReel({ instagramMediaId: selected.id, productId: Number(productId) });
    if (res?.success) {
      toast.success("Reel added to the home page");
      onOpenChange(false);
    } else {
      toast.error(res?.message || "Couldn't add the reel");
    }
  };

  const firstLoad = loadingInstagramVideos && !instagramVideos.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Add a reel</DialogTitle>
          <DialogDescription>
            Pick a video from {instagram?.username ? `@${instagram.username}` : "Instagram"}, then the product it sells.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[50vh] overflow-y-auto pr-1">
          {loadError ? (
            <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>{loadError}</p>
            </div>
          ) : firstLoad ? (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
              {Array.from({ length: 10 }).map((_, i) => (
                <Skeleton key={i} className="aspect-[9/16] w-full rounded-lg" />
              ))}
            </div>
          ) : !instagramVideos.length ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              No videos on this account yet. Post a reel on Instagram and it will show up here.
            </p>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
                {instagramVideos.map((video) => {
                  const isSelected = selected?.id === video.id;

                  return (
                    <button
                      key={video.id}
                      type="button"
                      disabled={video.added}
                      onClick={() => setSelected(video)}
                      title={
                        [video.caption, !video.playable && LICENSED_MUSIC_NOTE].filter(Boolean).join("\n\n") ||
                        undefined
                      }
                      aria-pressed={isSelected}
                      className={cn(
                        "relative overflow-hidden rounded-lg border bg-white text-left transition",
                        isSelected && "ring-2 ring-primary ring-offset-2",
                        video.added ? "cursor-not-allowed opacity-50" : "hover:border-primary"
                      )}
                    >
                      <div className="relative">
                        <Cover src={video.thumbnailUrl} className="aspect-[9/16] w-full rounded-none" />
                        {!video.playable && (
                          <span className="absolute inset-x-1.5 bottom-1.5 flex items-center justify-center gap-1 rounded bg-amber-500/90 px-1.5 py-0.5 text-[10px] font-medium text-white">
                            <Music size={10} />
                            Instagram only
                          </span>
                        )}
                      </div>
                      {video.added && (
                        <span className="absolute inset-x-0 top-0 bg-black/70 py-1 text-center text-[11px] font-medium text-white">
                          Already added
                        </span>
                      )}
                      {isSelected && (
                        <span className="absolute right-1.5 top-1.5 rounded-full bg-primary p-1 text-white">
                          <Check size={12} />
                        </span>
                      )}
                      <span className="block truncate px-2 py-1.5 text-[11px] text-muted-foreground">
                        {formatDate(video.timestamp)}
                      </span>
                    </button>
                  );
                })}
              </div>

              {instagramVideosCursor && (
                <div className="mt-4 flex justify-center">
                  <Button variant="outline" size="sm" onClick={loadMore} disabled={loadingInstagramVideos}>
                    {loadingInstagramVideos ? "Loading..." : "Load older videos"}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>

        {selected && !selected.playable && (
          <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            <Music className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              {LICENSED_MUSIC_NOTE} Shoppers will be sent to Instagram to watch it. For a reel that plays on
              the site, pick one with original sound.
            </p>
          </div>
        )}

        <div className="space-y-2">
          <Label>Product</Label>
          <ProductSelect value={productId} onChange={setProductId} />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={save} disabled={!selected || !productId || savingReel}>
            {savingReel ? "Adding..." : "Add reel"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ---------------- CHANGE PRODUCT ---------------- */

function EditReelDialog({ reel, onClose }: { reel: AdminReel | null; onClose: () => void }) {
  const { updateReel, savingReel } = useAdminStore();
  const [productId, setProductId] = useState("");

  useEffect(() => {
    if (reel) setProductId(String(reel.productId));
  }, [reel]);

  const save = async () => {
    if (!reel || !productId) return;

    const res = await updateReel({ id: reel.id, productId: Number(productId) });
    if (res?.success) {
      toast.success("Product changed");
      onClose();
    } else {
      toast.error(res?.message || "Couldn't update the reel");
    }
  };

  return (
    <Dialog open={Boolean(reel)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Change product</DialogTitle>
          <DialogDescription>The product shoppers are sent to from this reel.</DialogDescription>
        </DialogHeader>

        {reel && (
          <div className="flex items-center gap-3">
            <Cover src={reel.thumbnailUrl} className="h-24 w-[54px]" />
            <p className="line-clamp-3 text-sm text-muted-foreground">{reel.caption || "No caption"}</p>
          </div>
        )}

        <div className="space-y-2">
          <Label>Product</Label>
          <ProductSelect value={productId} onChange={setProductId} />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save} disabled={!productId || savingReel}>
            {savingReel ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ================= PAGE ================= */

export default function AdminReels() {
  const { reels, instagram, loadingReels, fetchReels, fetchProducts, toggleReel, deleteReel, reorderReels } =
    useAdminStore();

  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<AdminReel | null>(null);
  const [removing, setRemoving] = useState<AdminReel | null>(null);

  useEffect(() => {
    fetchReels();
    fetchProducts();
  }, [fetchReels, fetchProducts]);

  const sensors = useSensors(useSensor(PointerSensor));

  const onDragEnd = async ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;

    const reordered = arrayMove(
      reels,
      reels.findIndex((r) => r.id === active.id),
      reels.findIndex((r) => r.id === over.id)
    );
    useAdminStore.setState({ reels: reordered });

    const res = await reorderReels(reordered.map((r) => r.id));
    if (res?.success) toast.success("Order saved");
    else toast.error(res?.message || "Couldn't save the new order");
  };

  const onToggle = async (reel: AdminReel, active: boolean) => {
    const res = await toggleReel(reel.id, active);
    if (!res?.success) toast.error(res?.message || "Couldn't update the reel");
  };

  const confirmRemove = async () => {
    if (!removing) return;

    const res = await deleteReel(removing.id);
    if (res?.success) toast.success("Reel removed");
    else toast.error(res?.message || "Couldn't remove the reel");
    setRemoving(null);
  };

  // only the very first load; refetches after a save keep the table in place
  if (loadingReels && !instagram) {
    return <p className="text-center mt-10 text-gray-400">Loading reels...</p>;
  }

  return (
    <div className="p-8 space-y-6 bg-gradient-to-b from-amber-50 to-white">
      {/* HEADER */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Reels</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Instagram reels shown on the home page, each linked to the product it sells.
          </p>
        </div>

        <Button onClick={() => setAdding(true)} disabled={!instagram?.connected}>
          <Plus className="h-4 w-4" />
          Add reel
        </Button>
      </div>

      <InstagramBanner instagram={instagram} />

      {reels.length > 1 && (
        <p className="text-sm text-gray-500 flex items-center gap-2">
          Drag
          <GripVertical size={14} className="text-gray-400" />
          to change the order on the home page
        </p>
      )}

      {/* TABLE */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={reels.map((r) => r.id)} strategy={verticalListSortingStrategy}>
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="w-8"></th>
                  <th className="px-4 py-3 text-left">Reel</th>
                  <th className="px-4 py-3 text-left">Product</th>
                  <th className="px-4 py-3 text-center">On home page</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>

              <tbody>
                {!reels.length ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                      No reels yet.{" "}
                      {instagram?.connected ? "Add one from your Instagram account." : "Connect Instagram to add one."}
                    </td>
                  </tr>
                ) : (
                  reels.map((reel) => (
                    <SortableRow key={reel.id} id={reel.id}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Cover src={reel.thumbnailUrl} className="h-20 w-[45px]" />
                          <div className="min-w-0">
                            <p className="line-clamp-2 max-w-md">
                              {reel.caption || <span className="italic text-muted-foreground">No caption</span>}
                            </p>
                            <a
                              href={reel.permalink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-1 inline-flex items-center gap-1 text-xs text-primary hover:underline"
                            >
                              Open on Instagram
                              <ExternalLink size={12} />
                            </a>
                            {reel.available === false && (
                              <p className="mt-1 flex items-center gap-1 text-xs font-medium text-red-600">
                                <AlertTriangle size={12} />
                                No longer on Instagram, so it's hidden from the home page. Remove it.
                              </p>
                            )}
                            {reel.playable === false && (
                              <p className="mt-1 flex items-center gap-1 text-xs font-medium text-amber-700">
                                <Music size={12} />
                                Plays only on Instagram (licensed music). Shoppers are sent there to watch it.
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        {reel.productName ?? <span className="text-red-600">Product removed</span>}
                      </td>

                      <td className="px-4 py-3 text-center">
                        <Switch
                          checked={reel.active}
                          onCheckedChange={(value) => onToggle(reel, value)}
                          aria-label={reel.active ? "Hide from the home page" : "Show on the home page"}
                        />
                      </td>

                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <Button size="icon" variant="ghost" onClick={() => setEditing(reel)} aria-label="Change product">
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => setRemoving(reel)} aria-label="Remove reel">
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </td>
                    </SortableRow>
                  ))
                )}
              </tbody>
            </table>
          </SortableContext>
        </DndContext>
      </div>

      <AddReelDialog open={adding} onOpenChange={setAdding} />
      <EditReelDialog reel={editing} onClose={() => setEditing(null)} />

      <AlertDialog open={Boolean(removing)} onOpenChange={(open) => !open && setRemoving(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this reel?</AlertDialogTitle>
            <AlertDialogDescription>
              It comes off the home page. The post stays on Instagram, and you can add it again later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep it</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={confirmRemove}>
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
