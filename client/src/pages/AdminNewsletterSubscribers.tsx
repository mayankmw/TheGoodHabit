import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Mail, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAdminStore } from "@/store/useAdminStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type SubscriberStatus = "all" | "active" | "unsubscribed";

const statusBadge = (status: SubscriberStatus | string) => {
  if (status === "active") return "bg-green-100 text-green-700";
  if (status === "unsubscribed") return "bg-red-100 text-red-700";
  return "bg-gray-100 text-gray-700";
};

export default function AdminNewsletterSubscribers() {
  const navigate = useNavigate();
  const {
    loadingSubscribers,
    subscribers,
    subscriberStats,
    subscriberPagination,
    fetchNewsletterSubscribers,
  } = useAdminStore();

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<SubscriberStatus>("all");
  const [page, setPage] = useState(1);
  const limit = 20;

  useEffect(() => {
    fetchNewsletterSubscribers({
      search: search.trim() || undefined,
      status,
      page,
      limit,
    });
  }, [fetchNewsletterSubscribers, search, status, page]);

  useEffect(() => {
    setPage(1);
  }, [search, status]);

  const showingFrom = useMemo(() => {
    if (!subscribers.length) return 0;
    return (subscriberPagination.page - 1) * subscriberPagination.limit + 1;
  }, [subscribers.length, subscriberPagination.limit, subscriberPagination.page]);

  const showingTo = useMemo(() => {
    if (!subscribers.length) return 0;
    return showingFrom + subscribers.length - 1;
  }, [showingFrom, subscribers.length]);

  return (
    <div className="p-8 space-y-6 bg-gradient-to-b from-amber-50 to-white">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Newsletter Subscribers</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage and monitor your newsletter audience.
          </p>
        </div>

        <Button variant="outline" className="bg-white" onClick={() => navigate("/admin/newsletters")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back To Newsletters
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border bg-white p-4">
          <p className="text-xs text-muted-foreground uppercase">Total</p>
          <p className="text-2xl font-semibold mt-1">{subscriberStats.total}</p>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <p className="text-xs text-muted-foreground uppercase">Active</p>
          <p className="text-2xl font-semibold text-green-700 mt-1">{subscriberStats.active}</p>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <p className="text-xs text-muted-foreground uppercase">Unsubscribed</p>
          <p className="text-2xl font-semibold text-red-700 mt-1">{subscriberStats.unsubscribed}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by email..."
          className="max-w-md bg-white"
        />

        <Select
          value={status}
          onValueChange={(value) => setStatus(value as SubscriberStatus)}
        >
          <SelectTrigger className="w-44 bg-white">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent className="bg-white border shadow-lg z-50">
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="unsubscribed">Unsubscribed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="px-4 py-3 text-left">Email</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Subscribed At</th>
              <th className="px-4 py-3 text-left">Unsubscribed At</th>
            </tr>
          </thead>

          <tbody>
            {loadingSubscribers ? (
              <tr>
                <td colSpan={4} className="px-6 py-16 text-center text-gray-500">
                  Loading subscribers...
                </td>
              </tr>
            ) : subscribers.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-16 text-center">
                  <div className="space-y-2">
                    <Users className="w-8 h-8 mx-auto text-gray-400" />
                    <p className="text-gray-600 font-medium">No subscribers found</p>
                    <p className="text-xs text-gray-500">
                      Try changing search or filters.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              subscribers.map((sub) => (
                <tr key={sub.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span className="font-medium">{sub.email}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 capitalize">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusBadge(sub.status)}`}>
                      {sub.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {new Date(sub.subscribedAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {sub.unsubscribedAt
                      ? new Date(sub.unsubscribedAt).toLocaleString()
                      : "-"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Showing {showingFrom}-{showingTo} of {subscriberPagination.total}
        </p>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            disabled={subscriberPagination.page <= 1 || loadingSubscribers}
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
          >
            Previous
          </Button>
          <p className="text-sm text-muted-foreground">
            Page {subscriberPagination.page} / {subscriberPagination.totalPages}
          </p>
          <Button
            variant="outline"
            disabled={
              subscriberPagination.page >= subscriberPagination.totalPages ||
              loadingSubscribers
            }
            onClick={() => setPage((prev) => prev + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
