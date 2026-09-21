import { useEffect, useMemo, useState } from "react";
import { Eye, EyeOff, Star } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAdminStore } from "@/store/useAdminStore";

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

export default function AdminReviews() {
  const {
    reviews,
    reviewProducts,
    reviewStats,
    reviewPagination,
    loadingReviews,
    togglingReview,
    fetchReviews,
    toggleReview,
  } = useAdminStore();

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [productId, setProductId] = useState("all");
  const [rating, setRating] = useState("all");
  const [page, setPage] = useState(1);

  // debounced so a filtered search doesn't fire one request per keystroke —
  // a deliberate deviation from the other admin pages, which don't debounce
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(timer);
  }, [search]);

  // any filter change resets to page 1 here rather than in a second effect,
  // which would briefly request the old page of the new result set
  const applyFilter = (apply: () => void) => {
    setPage(1);
    apply();
  };

  useEffect(() => {
    fetchReviews({ page, limit: 20, search: debouncedSearch, status, productId, rating });
  }, [page, debouncedSearch, status, productId, rating, fetchReviews]);

  const handleToggle = async (id: number, next: "visible" | "hidden") => {
    const res = await toggleReview(id, next);

    if (res?.success) {
      toast.success(res?.message);
      // refetch rather than patch: the aggregate moved server-side too
      fetchReviews({ page, limit: 20, search: debouncedSearch, status, productId, rating });
    } else {
      toast.error(res?.message || "Failed to update review");
    }
  };

  const tiles = useMemo(
    () => [
      { label: "Total reviews", value: reviewStats.total },
      { label: "Visible", value: reviewStats.visible },
      { label: "Hidden", value: reviewStats.hidden },
    ],
    [reviewStats]
  );

  return (
    <div className="p-8 space-y-6 bg-gradient-to-b from-amber-50 to-white">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Reviews</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Hiding a review removes it from the product page and recalculates that
            product's star rating. Nothing is deleted.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {tiles.map((tile) => (
          <div key={tile.label} className="rounded-xl border bg-white p-4">
            <p className="text-xs text-muted-foreground uppercase">{tile.label}</p>
            <p className="text-2xl font-semibold mt-1">{tile.value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <Input
          className="max-w-md bg-white"
          placeholder="Search comment, customer, product or order code"
          value={search}
          onChange={(e) => applyFilter(() => setSearch(e.target.value))}
        />

        <Select value={status} onValueChange={(v) => applyFilter(() => setStatus(v))}>
          <SelectTrigger className="w-44 bg-white">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="bg-white border shadow-lg z-50">
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="visible">Visible</SelectItem>
            <SelectItem value="hidden">Hidden</SelectItem>
          </SelectContent>
        </Select>

        <Select value={rating} onValueChange={(v) => applyFilter(() => setRating(v))}>
          <SelectTrigger className="w-44 bg-white">
            <SelectValue placeholder="Rating" />
          </SelectTrigger>
          <SelectContent className="bg-white border shadow-lg z-50">
            <SelectItem value="all">All ratings</SelectItem>
            {[5, 4, 3, 2, 1].map((star) => (
              <SelectItem key={star} value={String(star)}>
                {star} star{star > 1 ? "s" : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={productId} onValueChange={(v) => applyFilter(() => setProductId(v))}>
          <SelectTrigger className="w-60 bg-white">
            <SelectValue placeholder="Product" />
          </SelectTrigger>
          <SelectContent className="bg-white border shadow-lg z-50">
            <SelectItem value="all">All products</SelectItem>
            {reviewProducts.map((product) => (
              <SelectItem key={product.id} value={String(product.id)}>
                {product.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* the table body branches internally — an early return here would take
          the filter bar with it and strand an admin on an empty result */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="px-4 py-3 text-left">Product</th>
              <th className="px-4 py-3 text-left">Customer</th>
              <th className="px-4 py-3 text-left">Rating</th>
              <th className="px-4 py-3 text-left">Comment</th>
              <th className="px-4 py-3 text-left">Date</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Action</th>
            </tr>
          </thead>

          <tbody>
            {loadingReviews ? (
              <tr>
                <td className="px-4 py-10 text-center text-muted-foreground" colSpan={7}>
                  Loading reviews...
                </td>
              </tr>
            ) : !reviews.length ? (
              <tr>
                <td className="px-4 py-10 text-center text-muted-foreground" colSpan={7}>
                  No reviews match these filters
                </td>
              </tr>
            ) : (
              reviews.map((review) => (
                <tr
                  key={review.id}
                  className={`border-t hover:bg-gray-50 ${
                    review.status === "hidden" ? "bg-red-50/40" : ""
                  }`}
                >
                  <td className="px-4 py-3">
                    <div className="font-medium">{review.productName}</div>
                    {review.orderCode && (
                      <div className="text-xs text-gray-500">{review.orderCode}</div>
                    )}
                  </td>

                  <td className="px-4 py-3">
                    <div className="font-medium">{review.customerName}</div>
                    <div className="text-xs text-gray-500">{review.customerEmail}</div>
                  </td>

                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 font-medium">
                      {review.rating}
                      <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                    </span>
                  </td>

                  <td className="px-4 py-3 truncate max-w-xs">
                    {review.comment || (
                      <span className="text-gray-400">Rating only</span>
                    )}
                  </td>

                  <td className="px-4 py-3 whitespace-nowrap">
                    {formatDate(review.createdAt)}
                  </td>

                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        review.status === "hidden"
                          ? "bg-red-100 text-red-700"
                          : "bg-green-100 text-green-700"
                      }`}
                    >
                      {review.status}
                    </span>
                  </td>

                  <td className="px-4 py-3">
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5"
                      disabled={togglingReview}
                      onClick={() =>
                        handleToggle(
                          review.id,
                          review.status === "hidden" ? "visible" : "hidden"
                        )
                      }
                    >
                      {review.status === "hidden" ? (
                        <>
                          <Eye className="h-3.5 w-3.5" />
                          Restore
                        </>
                      ) : (
                        <>
                          <EyeOff className="h-3.5 w-3.5" />
                          Hide
                        </>
                      )}
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {reviewPagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {reviewPagination.page} of {reviewPagination.totalPages} ·{" "}
            {reviewPagination.total} reviews
          </p>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1 || loadingReviews}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= reviewPagination.totalPages || loadingReviews}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
