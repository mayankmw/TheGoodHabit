import { useEffect, useState } from "react";
import { useAdminStore } from "@/store/useAdminStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Instagram, Linkedin, MessageCircle } from "lucide-react";

/* ================= ICON MAP ================= */
const ICONS: any = {
  instagram: <Instagram className="text-pink-500" size={20} />,
  linkedin: <Linkedin className="text-blue-600" size={20} />,
  whatsapp: <MessageCircle className="text-green-500" size={20} />,
};

/* ================= PAGE ================= */
export default function AdminSocials() {
  const {
    socials,
    loadingSocials,
    fetchSocials,
    updateSocial,
    toggleSocial,
  } = useAdminStore();

  const [localUrls, setLocalUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchSocials();
  }, []);

  useEffect(() => {
    const map: any = {};
    socials.forEach((s) => {
      map[s.platform] = s.url || "";
    });
    setLocalUrls(map);
  }, [socials]);

  /* ================= HANDLERS ================= */

  const handleSave = async (platform: string) => {
    const url = localUrls[platform];

    if (!url) {
      toast.error("URL cannot be empty");
      return;
    }

    const res = await updateSocial(platform, url);
    res?.success
      ? toast.success(res.message)
      : toast.error(res?.message || "Failed to update");
  };

  const handleToggle = async (platform: string, next: boolean) => {
    const res = await toggleSocial(platform, next ? 1 : 0);
    res?.success
      ? toast.success(res.message)
      : toast.error(res?.message || "Failed");
  };

  /* ================= UI ================= */

  if (loadingSocials) {
    return (
      <p className="text-center mt-10 text-gray-400">
        Loading socials...
      </p>
    );
  }

  return (
    <div className="p-8 space-y-6 bg-gradient-to-b from-amber-50 to-white">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Social Links</h1>
      </div>

      {/* INFO */}
      <p className="text-xs text-muted-foreground">
        Disabled socials will not be visible on the website.
      </p>
      
      {/* TABLE */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="px-4 py-3 text-left">Platform</th>
              <th className="px-4 py-3 text-left">URL</th>
              <th className="px-4 py-3 text-left">Active</th>
              <th className="px-4 py-3 text-left">Actions</th>
            </tr>
          </thead>

          <tbody>
            {socials.map((s) => (
              <tr key={s.platform} className="border-t hover:bg-gray-50">
                {/* PLATFORM */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2 capitalize font-medium">
                    {ICONS[s.platform]}
                    {s.platform}
                  </div>
                </td>

                {/* URL */}
                <td className="px-4 py-3">
                  <Input
                    value={localUrls[s.platform] || ""}
                    onChange={(e) =>
                      setLocalUrls({
                        ...localUrls,
                        [s.platform]: e.target.value,
                      })
                    }
                    placeholder={`Enter ${s.platform} URL`}
                  />
                </td>

                {/* STATUS */}
                <td className="px-4 py-3">
                  <Switch
                    checked={Boolean(s.active)}
                    onCheckedChange={(v) =>
                      handleToggle(s.platform, v)
                    }
                  />
                </td>

                {/* ACTION */}
                <td className="px-4 py-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSave(s.platform)}
                  >
                    Save
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}
