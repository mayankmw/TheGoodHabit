import { useEffect, useState } from "react";
import { useAdminStore } from "@/store/useAdminStore";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { toast } from "sonner";
import { GripVertical } from "lucide-react";

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

const POSITIONS = [
  { label: "Top Bar (Offers)", value: "top" },
  { label: "Bottom Marquee", value: "bottom" },
];

/* ---------------- SORTABLE ROW ---------------- */
function SortableRow({
  slider,
  children,
}: {
  slider: any;
  children: React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: slider.id });

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

/* ---------------- MAIN COMPONENT ---------------- */
export default function AdminSliders() {
  const {
    sliders,
    loadingSliders,
    fetchSliders,
    createSlider,
    updateSlider,
    toggleSlider,
    deleteSlider,
    reorderSliders,
  } = useAdminStore();

  const [openAdd, setOpenAdd] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);

  const [selected, setSelected] = useState<any>(null);
  const [sliderToDelete, setSliderToDelete] = useState<any>(null);

  const [form, setForm] = useState({
    text: "",
    position: "",
    active: true,
  });

  useEffect(() => {
    fetchSliders();
  }, []);

  const sensors = useSensors(useSensor(PointerSensor));

  const resetForm = () =>
    setForm({
      text: "",
      position: "",
      active: true,
    });

  /* ---------------- HANDLERS ---------------- */

  const handleAdd = async () => {
    if (!form.text || !form.position) {
      toast.error("Text and position are required");
      return;
    }

    const res = await createSlider(form);
    if (res?.success) {
      toast.success(res.message || "Slider added");
      setOpenAdd(false);
      resetForm();
    }
  };

  const handleEdit = async () => {
    const res = await updateSlider({
      id: selected.id,
      ...form,
    });

    if (res?.success) {
      toast.success(res.message || "Slider updated");
      setOpenEdit(false);
      setSelected(null);
    }
  };

  const handleToggle = async (id: number, next: boolean) => {
    const res = await toggleSlider(id, next ? 1 : 0);
    res?.success
      ? toast.success(res.message)
      : toast.error(res?.message || "Failed");
  };

  const handleDelete = async () => {
    const res = await deleteSlider(sliderToDelete.id);
    if (res?.success) {
      toast.success(res.message || "Deleted");
      setOpenDelete(false);
      setSliderToDelete(null);
    }
  };

  /* ---------------- DRAG END ---------------- */

  const onDragEnd = async (event: any) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = sliders.findIndex((s) => s.id === active.id);
    const newIndex = sliders.findIndex((s) => s.id === over.id);

    const newOrder = arrayMove(sliders, oldIndex, newIndex);

    // Optimistic UI
    useAdminStore.setState({ sliders: newOrder });

    // Persist
    const res = await reorderSliders(
      newOrder.map((s, i) => ({
        id: s.id,
        sort_order: i,
      }))
    );
    res?.success
      ? toast.success(res.message)
      : toast.error(res?.message || "Failed to reorder");
  };

  /* ---------------- UI ---------------- */

  if (loadingSliders) {
    return <p className="text-center mt-10 text-gray-400">Loading sliders...</p>;
  }

  return (
    <div className="p-8 space-y-6 bg-gradient-to-b from-amber-50 to-white">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Sliders</h1>
        <Button
          onClick={() => {
            resetForm();
            setOpenAdd(true);
          }}
        >
          + Add Slider
        </Button>
      </div>

    <p className="text-sm text-gray-500 flex items-center gap-2">
    Drag and drop sliders using the handle <GripVertical size={14} className="text-gray-400" /> to change their order
    </p>

      {/* TABLE */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={onDragEnd}
        >
          <SortableContext
            items={sliders.map((s) => s.id)}
            strategy={verticalListSortingStrategy}
          >
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="w-6"></th>
                  <th className="px-4 py-3 text-left">Text</th>
                  <th className="px-4 py-3 text-left">Position</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>

              <tbody>
                {sliders.map((s) => (
                  <SortableRow key={s.id} slider={s}>
                    <>
                      <td className="px-4 py-3">{s.text}</td>
                      <td className="px-4 py-3 capitalize">{s.position}</td>
                      <td className="px-4 py-3">
                        <Switch
                          checked={Boolean(s.active)}
                          onCheckedChange={(v) =>
                            handleToggle(s.id, v)
                          }
                        />
                      </td>
                      <td className="px-4 py-3 space-x-2">
                        <Button
                          variant="link"
                          onClick={() => {
                            setSelected(s);
                            setForm({
                              text: s.text,
                              position: s.position,
                              active: Boolean(s.active),
                            });
                            setOpenEdit(true);
                          }}
                        >
                          Edit
                        </Button>

                        <Button
                          variant="link"
                          className="text-red-500"
                          onClick={() => {
                            setSliderToDelete(s);
                            setOpenDelete(true);
                          }}
                        >
                          Delete
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

      {/* ADD / EDIT / DELETE DIALOGS */}
      <SliderDialog
        open={openAdd}
        setOpen={setOpenAdd}
        title="Add Slider"
        form={form}
        setForm={setForm}
        onSubmit={handleAdd}
      />

      <SliderDialog
        open={openEdit}
        setOpen={setOpenEdit}
        title="Edit Slider"
        form={form}
        setForm={setForm}
        onSubmit={handleEdit}
      />

      <Dialog open={openDelete} onOpenChange={setOpenDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600">
              Delete Slider
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm">
            Are you sure you want to delete
            <strong> “{sliderToDelete?.text}”</strong>?
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenDelete(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ---------------- SHARED DIALOG ---------------- */
function SliderDialog({ open, setOpen, title, form, setForm, onSubmit }: any) {
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Text</Label>
            <Input
              value={form.text}
              onChange={(e) =>
                setForm({ ...form, text: e.target.value })
              }
            />
          </div>

          <div>
            <Label>Position</Label>
            <Select
              value={form.position}
              onValueChange={(v) =>
                setForm({ ...form, position: v })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select position" />
              </SelectTrigger>
              <SelectContent>
                {POSITIONS.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={onSubmit}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
