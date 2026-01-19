import { useEffect, useState } from "react";
import { Pencil } from "lucide-react";
import { useAdminStore } from "@/store/useAdminStore";
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
import { toast } from "sonner";

/* ================= PAGE ================= */
export default function AdminStory() {
  const {
    story,
    fetchStory,
    updateStory,
    loadingStory,
  } = useAdminStore();

  const [open, setOpen] = useState(false);
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    fetchStory();
  }, []);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const openEdit = () => {
    setImage(null);
    setPreview(null);
    setOpen(true);
  };

  const handleUpdate = async () => {
    if (!image) {
      toast.error("Please select an image");
      return;
    }

    const res = await updateStory(image);

    if (res?.success) {
      toast.success(res.message || "Story updated");
      setOpen(false);
    } else {
      toast.error(res?.message || "Failed to update story");
    }
  };

  if (loadingStory) {
    return (
      <p className="text-center mt-10 text-gray-400">
        Loading story...
      </p>
    );
  }

  return (
    <div className="p-8 space-y-6 bg-gradient-to-b from-amber-50 to-white">
      <h1 className="text-3xl font-bold">Our Story</h1>

      {/* ================= STORY IMAGE ================= */}
      <div className="relative max-w-4xl mx-auto">
        <div className="aspect-[16/9] bg-muted rounded-xl overflow-hidden border shadow">
          {story?.image ? (
            <img
              src={story.image}
              alt="Our Story"
            className="w-full h-full object-contain"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
              No story image uploaded
            </div>
          )}
        </div>

        {/* Edit Button */}
        <EditButton onClick={openEdit} />
      </div>

      {/* ================= EDIT DIALOG ================= */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Story Image</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Preview */}
            <div className="space-y-2">
              <Label>Preview</Label>
              <div className="w-full aspect-[16/9] border rounded bg-muted flex items-center justify-center">
                <img
                  src={preview || story?.image}
                  alt="Preview"
                  className="max-h-full max-w-full object-contain"
                />
              </div>

              {preview && (
                <p className="text-xs text-muted-foreground">
                  New image preview (not saved yet)
                </p>
              )}
            </div>

            {/* File input */}
            <div>
              <Label>New Image</Label>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  setImage(file);

                  if (file) {
                    setPreview(URL.createObjectURL(file));
                  } else {
                    setPreview(null);
                  }
                }}
              />
            </div>
          </div>

          <DialogFooter>
            <Button onClick={handleUpdate}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ================= EDIT BUTTON ================= */
function EditButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="absolute top-3 right-3 z-10 bg-black/70 hover:bg-black text-white p-2 rounded-full shadow transition"
      aria-label="Edit"
    >
      <Pencil className="w-4 h-4" />
    </button>
  );
}
