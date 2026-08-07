import { useEffect, useState } from "react";
import { Pencil } from "lucide-react";
import { useAdminStore } from "@/store/useAdminStore";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
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
import { BannerSlider } from "@/components/BannerSlider";
import HeroImage from "@/components/HeroImage";
import { AdminBannerSlider } from "@/components/AdminBannerSlider";

/* ================= PAGE ================= */
export default function AdminAssets() {
  const [preview, setPreview] = useState<string | null>(null);

  const { assets, fetchAssets, updateAsset, loadingAssets } =
    useAdminStore();

  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [image, setImage] = useState<File | null>(null);

  useEffect(() => {
    fetchAssets();
  }, []);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const openEdit = (asset: any) => {
    setSelected(asset);
    setImage(null);
    setPreview(null);
    setOpen(true);
  };

  const handleUpdate = async () => {
    if (!selected) return;

    const res = await updateAsset({
      id: selected.id,
      image,
    });

    if (res?.success) {
      toast.success("Asset updated");
      setOpen(false);
    } else {
      toast.error(res?.message || "Failed to update asset");
    }
  };

  const logo = assets.find(a => a.type === "logo");
  const banners = assets.filter(a => a.type === "banner");
  const heroes = assets.filter(a => a.type === "hero");
  const carouselImages = assets.filter(a => a.type === "imagesCarousel");

  if (loadingAssets) {
    return (
      <p className="text-center mt-10 text-gray-400">Loading assets...</p>
    );
  }

  return (
    <div className="p-8 space-y-6 bg-gradient-to-b from-amber-50 to-white">
      <h1 className="text-3xl font-bold">Assets</h1>

      <Tabs defaultValue="logo">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="logo">Logo</TabsTrigger>
          <TabsTrigger value="banner">Banners</TabsTrigger>
          <TabsTrigger value="hero">Hero Images</TabsTrigger>
          <TabsTrigger value="imagesCarousel">Images Carousel</TabsTrigger>
        </TabsList>

        {/* ================= LOGO ================= */}
        <TabsContent value="logo">
          <div className="flex justify-center mt-10">
            {logo && (
              <div className="relative">
                <img
                  src={logo.image}
                  alt="Logo"
                  className="h-20 w-auto object-contain drop-shadow-md"
                />

                <EditButton onClick={() => openEdit(logo)} />
              </div>
            )}
          </div>
        </TabsContent>

        {/* ================= BANNERS ================= */}
        <TabsContent value="banner">
          <AdminBannerSlider
            banners={banners
              .slice()
              .sort((a, b) => a.position - b.position)}
            onEdit={openEdit}
          />
        </TabsContent>

        {/* ================= HERO ================= */}
        <TabsContent value="hero">
          <div className="space-y-12 mt-8">
            {heroes
              .slice()
              .sort((a, b) => a.position - b.position)
              .map(hero => (
                <div key={hero.id} className="relative">
                  <HeroImage src={hero.image} />

                  {/* Position badge */}
                  <span className="absolute top-3 left-3 bg-black/70 text-white text-xs px-2 py-1 rounded">
                    Position {hero.position}
                    {hero.position === 3 && " (Product Page Hero Image)"}
                  </span>

                  {/* Always-visible edit */}
                  <EditButton onClick={() => openEdit(hero)} />
                </div>
              ))}
          </div>
        </TabsContent>

        {/* ================= IMAGES CAROUSEL ================= */}
        <TabsContent value="imagesCarousel">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mt-8">
            {carouselImages
              .slice()
              .sort((a, b) => a.position - b.position)
              .map(item => (
                <div key={item.id} className="relative w-full max-w-[220px]">
                  <div className="aspect-[4/5] w-full overflow-hidden rounded-xl border bg-muted">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={`Images carousel photo ${item.position}`}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
                        No image uploaded
                      </div>
                    )}
                  </div>

                  <span className="absolute top-3 left-3 bg-black/70 text-white text-xs px-2 py-1 rounded">
                    Position {item.position}
                  </span>

                  <EditButton onClick={() => openEdit(item)} />
                </div>
              ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* ================= EDIT DIALOG ================= */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Replace Image</DialogTitle>
          </DialogHeader>

          {selected && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Preview</Label>

                <div className="w-full aspect-[16/9] border rounded bg-muted flex items-center justify-center">
                  <img
                    src={preview || selected.image}
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


              <Label>New Image</Label>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  setImage(file);

                  if (file) {
                    const url = URL.createObjectURL(file);
                    setPreview(url);
                  } else {
                    setPreview(null);
                  }
                }}
              />
              <p className="text-xs text-muted-foreground">
                Allowed formats: PNG, JPEG, WEBP. Max file size: 5 MB.
              </p>
            </div>
          )}

          <DialogFooter>
            <Button onClick={handleUpdate}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function EditButton({ onClick }: { onClick: () => void }) {
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
