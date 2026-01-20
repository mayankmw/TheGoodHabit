import { useEffect, useState } from "react";
import { Trash2, Pencil, GripVertical, Eye } from "lucide-react";
import { useAdminStore } from "@/store/useAdminStore";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { toast } from "sonner";

/* dnd-kit */
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

/* ---------------- SORTABLE ROW ---------------- */
function SortableRow({
  reel,
  children,
}: {
  reel: any;
  children: React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: reel.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <tr ref={setNodeRef} style={style} className="border-t hover:bg-gray-50">
      <td
        className="px-2 text-gray-400 cursor-grab"
        {...attributes}
        {...listeners}
      >
        <GripVertical size={16} />
      </td>
      {children}
    </tr>
  );
}

/* ================= PAGE ================= */
export default function AdminReels() {
  const {
    reels,
    products,
    loadingReels,
    fetchReels,
    fetchProducts,
    createReel,
    updateReel,
    toggleReel,
    deleteReel,
    reorderReels,
  } = useAdminStore();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [viewing, setViewing] = useState<any>(null);

  const [form, setForm] = useState<any>({
    short_video: null,
    main_video: null,
    product_id: "",
  });

  useEffect(() => {
    fetchReels();
    fetchProducts();
  }, []);

  const sensors = useSensors(useSensor(PointerSensor));

  const resetForm = () => {
    setForm({
      short_video: null,
      main_video: null,
      product_id: "",
    });
    setEditing(null);
  };

  /* ---------------- SAVE ---------------- */
  const handleSave = async () => {
    if (!form.product_id) {
      toast.error("Product is required");
      return;
    }

    const payload = {
      ...form,
      id: editing?.id,
    };

    const res = editing
      ? await updateReel(payload)
      : await createReel(payload);

    if (res?.success) {
      toast.success(editing ? "Reel updated" : "Reel created");
      setOpen(false);
      resetForm();
    } else {
      toast.error("Failed to save reel");
    }
  };

  /* ---------------- DRAG END ---------------- */
  const onDragEnd = async (event: any) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = reels.findIndex((r) => r.id === active.id);
    const newIndex = reels.findIndex((r) => r.id === over.id);

    const newOrder = arrayMove(reels, oldIndex, newIndex);

    useAdminStore.setState({ reels: newOrder });

    const res = await reorderReels(
      newOrder.map((r, index) => ({
        id: r.id,
        sort_order: index,
      }))
    );

    res?.success
      ? toast.success("Reels order updated")
      : toast.error("Failed to reorder reels");
  };

  if (loadingReels) {
    return <p className="text-center mt-10 text-gray-400">Loading reels...</p>;
  }

  return (
    <div className="p-8 space-y-6 bg-gradient-to-b from-amber-50 to-white">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Reels</h1>

        <Button
          onClick={() => {
            resetForm();
            setOpen(true);
          }}
        >
          + Add Reel
        </Button>
      </div>

      <p className="text-sm text-gray-500 flex items-center gap-2">
        Drag and drop reels using the handle
        <GripVertical size={14} className="text-gray-400" />
        to change their order
      </p>

      {/* TABLE */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={onDragEnd}
        >
          <SortableContext
            items={reels.map((r) => r.id)}
            strategy={verticalListSortingStrategy}
          >
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="w-6"></th>
                  <th className="px-4 py-3">Preview</th>
                  <th className="px-4 py-3 text-left">Product</th>
                  <th className="px-4 py-3 text-center">Views</th>
                  <th className="px-4 py-3 text-center">Active</th>
                  <th className="px-4 py-3 text-center">Actions</th>
                </tr>
              </thead>

              <tbody>
                {reels.map((r) => (
                  <SortableRow key={r.id} reel={r}>
                    <>
                      <td className="px-4 py-2">
                        <video
                          src={r.short_video_url}
                          muted
                          loop
                          playsInline
                          className="h-20 w-14 object-cover rounded"
                        />
                      </td>

                      <td className="px-4 py-2">
                        <p className="font-medium">{r.product_name}</p>
                      </td>

                      <td className="px-4 py-2 text-center">{r.views}</td>

                      <td className="px-4 py-2 text-center">
                        <Switch
                          checked={Boolean(r.active)}
                          onCheckedChange={(v) =>
                            toggleReel(r.id, v ? 1 : 0)
                          }
                        />
                      </td>

                      <td className="px-4 py-2 space-x-2 text-center">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => setViewing(r)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>

                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            setEditing(r);
                            setForm({
                              product_id: String(r.product_id),
                            });
                            setOpen(true);
                          }}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>

                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={async () => {
                            const res = await deleteReel(r.id);
                            res?.success
                              ? toast.success("Reel deleted")
                              : toast.error("Failed to delete reel");
                          }}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </td>
                    </>
                  </SortableRow>
                ))}
              </tbody>
            </table>
          </SortableContext>
        </DndContext>
      </div>

      {/* ADD / EDIT DIALOG */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit Reel" : "Add Reel"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Product</Label>
              <Select
                value={form.product_id}
                onValueChange={(v) =>
                  setForm({ ...form, product_id: v })
                }
              >
                <SelectTrigger className="bg-white border border-input">
                  <SelectValue placeholder="Select product" />
                </SelectTrigger>
                <SelectContent className="bg-white border shadow-lg z-50">
                  {products.map((p: any) => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Short Reel (mp4)</Label>
              <Input
                type="file"
                accept="video/mp4"
                onChange={(e) =>
                  setForm({
                    ...form,
                    short_video: e.target.files?.[0] || null,
                  })
                }
              />
            </div>

            <div>
              <Label>Main Reel (mp4)</Label>
              <Input
                type="file"
                accept="video/mp4"
                onChange={(e) =>
                  setForm({
                    ...form,
                    main_video: e.target.files?.[0] || null,
                  })
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button onClick={handleSave}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* VIEW DIALOG */}
    <Dialog open={!!viewing} onOpenChange={() => setViewing(null)}>
        <DialogContent className="max-w-4xl">
            <DialogHeader>
            <DialogTitle>Reel Preview</DialogTitle>
            </DialogHeader>

            {viewing && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* SHORT REEL */}
                <div>
                <Label className="mb-2 block">Short Reel</Label>

                <div className="w-full max-w-[260px] mx-auto aspect-[9/16] bg-black rounded overflow-hidden">
                    <video
                    src={viewing.short_video_url}
                    controls
                    playsInline
                    className="w-full h-full object-contain"
                    />
                </div>
                </div>

                {/* MAIN REEL */}
                <div>
                <Label className="mb-2 block">Main Reel</Label>

                <div className="w-full aspect-video max-h-[360px] bg-black rounded overflow-hidden">
                    <video
                    src={viewing.main_video_url}
                    controls
                    playsInline
                    className="w-full h-full object-contain"
                    />
                </div>
                </div>
            </div>
            )}

            <DialogFooter>
            <Button variant="outline" onClick={() => setViewing(null)}>
                Close
            </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>

    </div>
  );
}
