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
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const CONTACT_STATUSES = [
    { label: "New", value: "new" },
    { label: "Read", value: "read" },
    { label: "Replied", value: "replied" },
];

export default function AdminContacts() {
    const {
        contacts,
        loadingContacts,
        fetchContacts,
        markContactRead,
        replyToContact,
    } = useAdminStore();

    type ContactStatus = "new" | "read" | "replied" | undefined;

    const [filters, setFilters] = useState<{
        search: string;
        status?: ContactStatus;
    }>({
        search: "",
        status: undefined,
    });

    const [openView, setOpenView] = useState(false);
    const [openReply, setOpenReply] = useState(false);
    const [selected, setSelected] = useState(null);
    const [reply, setReply] = useState("");

    useEffect(() => {
        fetchContacts({
            search: filters.search || undefined,
            status: filters.status,
        });
    }, [filters]);


    /* ================= ACTIONS ================= */

    const handleMarkRead = async (id) => {
        const res = await markContactRead(id);
        if (res?.success) toast.success(res.message);
    };

    const handleReply = async () => {
        if (!reply.trim()) {
            toast.error("Reply message is required");
            return;
        }

        const res = await replyToContact(selected.id, reply);
        if (res?.success) {
            toast.success(res.message);
            setReply("");
            setOpenReply(false);
        } else {
            toast.error(res?.message || "Failed to send reply");
        }
    };

    /* ================= UI STATES ================= */

    if (loadingContacts) {
        return (
            <p className="text-center mt-10 text-gray-400">
                Loading contact messages...
            </p>
        );
    }

    return (
        <div className="p-8 space-y-6 bg-gradient-to-b from-amber-50 to-white">
            {/* HEADER */}
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Contact Messages</h1>
            </div>

            {/* FILTERS */}
            <div className="flex gap-4">
                <Input
                    placeholder="Search name, email or message..."
                    value={filters.search}
                    onChange={(e) =>
                        setFilters({ ...filters, search: e.target.value })
                    }
                />

                <Select
                    value={filters.status}
                    onValueChange={(v) =>
                        setFilters({
                            ...filters,
                            status: v as ContactStatus,
                        })
                    }
                >
                    <SelectTrigger className="w-48 bg-white border border-input">
                        <SelectValue placeholder="All statuses" />
                    </SelectTrigger>

                    <SelectContent className="bg-white border shadow-lg z-50">
                        {CONTACT_STATUSES.map((s) => (
                            <SelectItem key={s.value} value={s.value}>
                                {s.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

            </div>

            {/* TABLE */}
            <div className="bg-white rounded-xl shadow overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-gray-600">
                        <tr>
                            <th className="px-4 py-3 text-left">Name</th>
                            <th className="px-4 py-3 text-left">Email</th>
                            <th className="px-4 py-3 text-left">Message</th>
                            <th className="px-4 py-3 text-left">Status</th>
                            <th className="px-4 py-3 text-left">Date</th>
                            <th className="px-4 py-3 text-left">Actions</th>
                        </tr>
                    </thead>

                <tbody>
                {contacts.length === 0 ? (
                    <tr>
                    <td colSpan={6} className="px-6 py-16 text-center">
                        <div className="space-y-3">
                        <h2 className="text-lg font-semibold text-gray-700">
                            No contact messages found
                        </h2>

                        <p className="text-sm text-gray-500">
                            {filters.search || filters.status
                            ? "Try adjusting your search or filters."
                            : "No one has contacted you yet."}
                        </p>

                        {(filters.search || filters.status) && (
                            <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                                setFilters({
                                search: "",
                                status: undefined,
                                })
                            }
                            >
                            Clear Filters
                            </Button>
                        )}
                        </div>
                    </td>
                    </tr>
                ) : (
                    contacts.map((c) => (
                    <tr key={c.id} className="border-t hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium">{c.name}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{c.email}</td>
                        <td className="px-4 py-3 truncate max-w-xs">{c.message}</td>

                        <td className="px-4 py-3 capitalize">
                        <span
                            className={`px-2 py-1 rounded-full text-xs font-medium
                            ${
                                c.status === "replied"
                                ? "bg-green-100 text-green-700"
                                : c.status === "read"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-amber-100 text-amber-700"
                            }
                            `}
                        >
                            {c.status}
                        </span>
                        </td>

                        <td className="px-4 py-3 text-gray-500">
                        {new Date(c.createdAt).toLocaleDateString()}
                        </td>

                        <td className="px-4 py-3 space-x-2">
                        <Button
                            variant="link"
                            onClick={() => {
                            setSelected(c);
                            setOpenView(true);
                            if (c.status === "new") handleMarkRead(c.id);
                            }}
                        >
                            View
                        </Button>

                        <Button
                            variant="link"
                            onClick={() => {
                            setSelected(c);
                            setReply("");
                            setOpenReply(true);
                            }}
                        >
                            Reply
                        </Button>
                        </td>
                    </tr>
                    ))
                )}
                </tbody>

                </table>
            </div>

            {/* ================= VIEW MESSAGE ================= */}
            <Dialog open={openView} onOpenChange={setOpenView}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Contact Message</DialogTitle>
                    </DialogHeader>

                    {selected && (
                        <div className="space-y-3 text-sm">
                            <Detail label="Name" value={selected.name} />
                            <Detail label="Email" value={selected.email} />
                            <Detail label="Message" value={selected.message} />
                            <Detail label="Status" value={selected.status} />
                            <Detail
                                label="Date"
                                value={new Date(selected.createdAt).toLocaleString()}
                            />
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setOpenView(false)}>
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ================= REPLY ================= */}
            <Dialog open={openReply} onOpenChange={setOpenReply}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reply to Contact</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-3">
                        <Label>Message</Label>
                        <Textarea
                            rows={6}
                            placeholder="Type your reply..."
                            value={reply}
                            onChange={(e) => setReply(e.target.value)}
                        />
                    </div>

                    <DialogFooter>
                        <Button
                            onClick={handleReply}
                            className="bg-primary text-white"
                        >
                            Send Reply
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

/* ================= UTIL ================= */

function Detail({ label, value }) {
    return (
        <div className="flex justify-between border-b pb-1">
            <span className="text-gray-500">{label}</span>
            <span className="font-medium text-right max-w-xs">
                {value}
            </span>
        </div>
    );
}
