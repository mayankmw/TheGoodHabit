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
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export default function AdminNewsletter() {
  const {
    newsletters,
    loadingNewsletters,
    sendingNewsletter,
    fetchNewsletters,
    sendNewsletter,
  } = useAdminStore();

  const [openSend, setOpenSend] = useState(false);
  const [form, setForm] = useState({
    subject: "",
    content: "",
  });

  const [openView, setOpenView] = useState(false);
  const [selected, setSelected] = useState<any>(null);

  useEffect(() => {
    fetchNewsletters();
  }, []);

  /* ================= ACTIONS ================= */

  const handleSend = async () => {
    if (!form.subject.trim() || !form.content.trim()) {
      toast.error("Subject and content are required");
      return;
    }

    const res = await sendNewsletter(form);

    if (res?.success) {
      toast.success("Newsletter sent successfully");
      setForm({ subject: "", content: "" });
      setOpenSend(false);
    } else {
      toast.error(res?.message || "Failed to send newsletter");
    }
  };

  /* ================= UI ================= */

  if (loadingNewsletters) {
    return (
      <p className="text-center mt-10 text-gray-400">
        Loading newsletters...
      </p>
    );
  }

  return (
    <div className="p-8 space-y-6 bg-gradient-to-b from-amber-50 to-white">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Newsletters</h1>

        <Button
          className="bg-primary text-white"
          onClick={() => setOpenSend(true)}
        >
          Send Newsletter
        </Button>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-sm">
        <thead className="bg-gray-50 text-gray-600">
        <tr>
            <th className="px-4 py-3 text-left">Subject</th>
            <th className="px-4 py-3 text-left">Sent To</th>
            <th className="px-4 py-3 text-left">Date</th>
            <th className="px-4 py-3 text-left">Actions</th>
        </tr>
        </thead>


          <tbody>
            {newsletters.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-6 py-16 text-center">
                  <div className="space-y-2">
                    <h2 className="text-lg font-semibold text-gray-700">
                      No newsletters sent yet
                    </h2>
                    <p className="text-sm text-gray-500">
                      Click “Send Newsletter” to send your first update.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              newsletters.map((n) => (
                <tr key={n.id} className="border-t hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{n.subject}</td>

                <td className="px-4 py-3 text-gray-600">
                    {n.sentCount} subscribers
                </td>

                <td className="px-4 py-3 text-gray-500">
                    {new Date(n.createdAt).toLocaleDateString()}
                </td>

                <td className="px-4 py-3">
                    <Button
                    variant="link"
                    onClick={() => {
                        setSelected(n);
                        setOpenView(true);
                    }}
                    >
                    View
                    </Button>
                </td>
                </tr>

              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ================= SEND NEWSLETTER ================= */}
      <Dialog open={openSend} onOpenChange={setOpenSend}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Send Newsletter</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1">
              <Label>Subject</Label>
              <Input
                placeholder="Enter newsletter subject"
                value={form.subject}
                onChange={(e) =>
                  setForm({ ...form, subject: e.target.value })
                }
              />
            </div>

            <div className="space-y-1">
              <Label>Content</Label>
              <Textarea
                rows={8}
                placeholder="Write your newsletter content..."
                value={form.content}
                onChange={(e) =>
                  setForm({ ...form, content: e.target.value })
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpenSend(false)}
            >
              Cancel
            </Button>

            <Button
              onClick={handleSend}
              disabled={sendingNewsletter}
              className="bg-primary text-white"
            >
              {sendingNewsletter ? "Sending..." : "Send Newsletter"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ================= VIEW NEWSLETTER ================= */}
<Dialog open={openView} onOpenChange={setOpenView}>
  <DialogContent className="max-w-2xl">
    <DialogHeader>
      <DialogTitle>Newsletter Details</DialogTitle>
    </DialogHeader>

    {selected && (
      <div className="space-y-4 text-sm">
        <div>
          <p className="text-gray-500 mb-1">Subject</p>
          <p className="font-semibold text-base">{selected.subject}</p>
        </div>

        <div>
          <p className="text-gray-500 mb-1">Content</p>
          <div className="bg-gray-50 border rounded-lg p-4 max-h-[300px] overflow-y-auto whitespace-pre-line">
            {selected.content}
          </div>
        </div>

        <div className="flex justify-between text-gray-500 text-xs pt-2">
          <span>
            Sent on{" "}
            {new Date(selected.createdAt).toLocaleString()}
          </span>
          <span>{selected.sentCount} subscribers</span>
        </div>
      </div>
    )}

    <DialogFooter>
      <Button variant="outline" onClick={() => setOpenView(false)}>
        Close
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>

    </div>
  );
}
