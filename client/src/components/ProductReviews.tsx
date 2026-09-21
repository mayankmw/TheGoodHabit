import { useEffect } from "react";
import { ShieldCheck, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StarRating } from "@/components/StarRating";
import { useReviewStore } from "@/store/useReviewStore";

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

export const ProductReviews = ({ productId }: { productId: string | number }) => {
  // one selector per value — zustand v5 loops forever on object selectors
  const reviews = useReviewStore((s) => s.reviews);
  const summary = useReviewStore((s) => s.summary);
  const loading = useReviewStore((s) => s.loading);
  const loadingMore = useReviewStore((s) => s.loadingMore);
  const hasMore = useReviewStore((s) => s.hasMore);
  const fetchReviews = useReviewStore((s) => s.fetchReviews);
  const loadMore = useReviewStore((s) => s.loadMore);

  useEffect(() => {
    if (productId) fetchReviews(productId);
  }, [productId, fetchReviews]);

  return (
    <section className="bg-white py-12">
      <div className="container mx-auto px-4">
        <h2 className="mb-8 text-center text-2xl font-bold">Customer Reviews</h2>

        {loading ? (
          <div className="text-center text-muted-foreground">Loading reviews...</div>
        ) : summary.total === 0 ? (
          <div className="mx-auto max-w-3xl rounded-2xl border border-dashed bg-white/70 p-10 text-center">
            <Star className="mx-auto mb-3 h-8 w-8 text-amber-200" />
            <p className="text-muted-foreground">
              No reviews yet — be the first to review this product
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Reviews can be left from your orders once a purchase is delivered.
            </p>
          </div>
        ) : (
          <>
            {/* Summary: average, then the per-star histogram */}
            <div className="mx-auto mb-8 grid max-w-6xl gap-6 rounded-2xl border border-amber-100 bg-amber-50/40 p-6 sm:grid-cols-[auto_1fr]">
              <div className="flex flex-col items-center justify-center gap-1 sm:border-r sm:border-amber-100 sm:pr-8">
                <p className="text-4xl font-bold">{summary.average.toFixed(1)}</p>
                <StarRating value={Math.round(summary.average)} size="h-4 w-4" />
                <p className="text-xs text-muted-foreground">
                  {summary.total} {summary.total === 1 ? "review" : "reviews"}
                </p>
              </div>

              <div className="space-y-1.5">
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = summary.breakdown?.[String(star)] ?? 0;
                  const percent = summary.total ? (count / summary.total) * 100 : 0;

                  return (
                    <div key={star} className="flex items-center gap-2 text-xs">
                      <span className="w-3 text-muted-foreground">{star}</span>
                      <Star className="h-3 w-3 shrink-0 fill-yellow-400 text-yellow-400" />
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-amber-100">
                        <div
                          className="h-full rounded-full bg-yellow-400 transition-all"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      <span className="w-6 text-right text-muted-foreground">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mx-auto grid max-w-6xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {reviews.map((review) => (
                <div
                  key={review.id}
                  className="flex h-full flex-col rounded-2xl border border-amber-100/70 bg-white p-5 shadow-sm transition hover:shadow-md"
                >
                  {/* name and badge get their own line — in a 3-up column there
                      isn't room to sit them beside the date */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-foreground/90">
                      {review.reviewer}
                    </span>

                    {review.verified && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-700">
                        <ShieldCheck className="h-3 w-3" />
                        Verified Purchase
                      </span>
                    )}
                  </div>

                  <div className="mt-2 flex items-center justify-between gap-2">
                    <StarRating value={review.rating} size="h-4 w-4" />
                    <span className="text-xs text-muted-foreground">
                      {formatDate(review.createdAt)}
                    </span>
                  </div>

                  {/* a rating with no comment is normal — render stars only */}
                  {review.comment && (
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                      {review.comment}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {hasMore && (
              <div className="mt-6 flex justify-center">
                <Button
                  variant="outline"
                  className="rounded-full px-8"
                  disabled={loadingMore}
                  onClick={loadMore}
                >
                  {loadingMore ? "Loading..." : "Load more reviews"}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
};
