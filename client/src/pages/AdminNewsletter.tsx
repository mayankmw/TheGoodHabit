import { useEffect, useMemo, useState } from "react";
import { Paperclip, Users, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
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
import { toast } from "sonner";
import NewsletterEditor from "@/components/NewsletterEditor";

const MAX_ATTACHMENTS = 5;
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
  "text/plain",
  "text/csv",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/zip",
  "application/x-zip-compressed",
]);
const ALLOWED_EXTENSIONS = new Set([
  ".pdf",
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
  ".txt",
  ".csv",
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
  ".zip",
]);

const formatBytes = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const isAllowedAttachment = (file: File) => {
  if (ALLOWED_MIME_TYPES.has(file.type)) return true;
  const ext = `.${file.name.split(".").pop()?.toLowerCase() || ""}`;
  return ALLOWED_EXTENSIONS.has(ext);
};

type NewsletterItem = {
  id: number;
  subject: string;
  content: string;
  sentCount: number;
  createdAt: string;
};

export default function AdminNewsletter() {
  const navigate = useNavigate();

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
    attachments: [] as File[],
  });

  const [openView, setOpenView] = useState(false);
  const [selected, setSelected] = useState<NewsletterItem | null>(null);

  const isInsideCkEditorUi = (target: EventTarget | null) => {
    if (!(target instanceof Element)) return false;
    if (target.closest(".ck, .ck-body-wrapper")) return true;
    const ckBody = document.querySelector(".ck-body-wrapper");
    return !!(ckBody && ckBody.contains(target));
  };

  useEffect(() => {
    fetchNewsletters();
  }, [fetchNewsletters]);

  const totalAttachmentBytes = useMemo(
    () => form.attachments.reduce((sum, file) => sum + file.size, 0),
    [form.attachments]
  );

  const handleAddAttachments = (files: FileList | null) => {
    if (!files) return;

    const incoming = Array.from(files);
    const current = [...form.attachments];

    for (const file of incoming) {
      const duplicate = current.some(
        (f) =>
          f.name === file.name &&
          f.size === file.size &&
          f.lastModified === file.lastModified
      );

      if (duplicate) {
        toast.error(`${file.name} is already selected`);
        continue;
      }

      if (!isAllowedAttachment(file)) {
        toast.error(`${file.name}: file type not supported`);
        continue;
      }

      if (file.size > MAX_FILE_SIZE) {
        toast.error(`${file.name}: exceeds 5MB limit`);
        continue;
      }

      if (current.length >= MAX_ATTACHMENTS) {
        toast.error(`Maximum ${MAX_ATTACHMENTS} attachments allowed`);
        break;
      }

      current.push(file);
    }

    setForm((prev) => ({ ...prev, attachments: current }));
  };

  const removeAttachment = (index: number) => {
    setForm((prev) => ({
      ...prev,
      attachments: prev.attachments.filter((_, idx) => idx !== index),
    }));
  };

  const handleSend = async () => {
    const contentText = form.content.replace(/<[^>]+>/g, "").trim();

    if (!form.subject.trim() || !contentText) {
      toast.error("Subject and content are required");
      return;
    }

    const fd = new FormData();
    fd.append("subject", form.subject.trim());
    fd.append("content", form.content);

    form.attachments.forEach((file) => {
      fd.append("attachments", file);
    });

    const res = await sendNewsletter(fd);

    if (res?.success) {
      toast.success(res.message || "Newsletter sent successfully");
      setOpenSend(false);
      setForm({ subject: "", content: "", attachments: [] });
      return;
    }

    toast.error(res?.message || "Failed to send newsletter");
  };

  if (loadingNewsletters) {
    return (
      <p className="text-center mt-10 text-gray-400">
        Loading newsletters...
      </p>
    );
  }

  return (
    <div className="p-8 space-y-6 bg-gradient-to-b from-amber-50 to-white">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Newsletters</h1>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="bg-white"
            onClick={() => navigate("/admin/newsletters/subscribers")}
          >
            <Users className="w-4 h-4 mr-2" />
            Subscribers
          </Button>

          <Button
            className="bg-primary text-white"
            onClick={() => setOpenSend(true)}
          >
            Send Newsletter
          </Button>
        </div>
      </div>

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
                <td colSpan={4} className="px-6 py-16 text-center">
                  <div className="space-y-2">
                    <h2 className="text-lg font-semibold text-gray-700">
                      No newsletters sent yet
                    </h2>
                    <p className="text-sm text-gray-500">
                      Click "Send Newsletter" to send your first update.
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

      <Dialog open={openSend} onOpenChange={setOpenSend} modal={false}>
        <DialogContent
          className="max-w-4xl"
          onPointerDownOutside={(e) => {
            if (isInsideCkEditorUi(e.target)) {
              e.preventDefault();
            }
          }}
          onFocusOutside={(e) => {
            if (isInsideCkEditorUi(e.target)) {
              e.preventDefault();
            }
          }}
          onInteractOutside={(e) => {
            if (isInsideCkEditorUi(e.target)) {
              e.preventDefault();
            }
          }}
        >
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
              <NewsletterEditor
                value={form.content}
                onChange={(html) => setForm({ ...form, content: html })}
              />
            </div>

            <div className="space-y-2">
              <Label>Attachments</Label>
              <div className="rounded-lg border bg-slate-50 p-3">
                <div className="flex flex-wrap gap-3 items-center">
                  <label className="inline-flex items-center gap-2 rounded-md border bg-white px-3 py-2 text-sm cursor-pointer hover:bg-slate-50">
                    <Paperclip className="w-4 h-4" />
                    Add files
                    <input
                      type="file"
                      multiple
                      hidden
                      onChange={(e) => {
                        handleAddAttachments(e.target.files);
                        e.currentTarget.value = "";
                      }}
                    />
                  </label>

                  <span className="text-xs text-muted-foreground">
                    Up to {MAX_ATTACHMENTS} files, max 5MB each
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Total: {formatBytes(totalAttachmentBytes)}
                  </span>
                </div>

                {form.attachments.length > 0 ? (
                  <div className="mt-3 space-y-2">
                    {form.attachments.map((file, idx) => (
                      <div
                        key={`${file.name}-${file.size}-${idx}`}
                        className="flex items-center justify-between rounded-md border bg-white px-3 py-2"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{file.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatBytes(file.size)}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeAttachment(idx)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 text-xs text-muted-foreground">No files selected</p>
                )}
              </div>
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

      <Dialog open={openView} onOpenChange={setOpenView}>
        <DialogContent className="max-w-3xl">
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
                <div className="newsletter-mail-content prose prose-sm max-w-none bg-gray-50 border rounded-lg p-4 max-h-[320px] overflow-y-auto">
                  <div dangerouslySetInnerHTML={{ __html: selected.content || "" }} />
                </div>
              </div>

              <div className="flex justify-between text-gray-500 text-xs pt-2">
                <span>
                  Sent on {new Date(selected.createdAt).toLocaleString()}
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
