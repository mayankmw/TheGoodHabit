import { useMemo, useState } from "react";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  useOrderStore,
  type OrderReview,
  type ReviewDraft,
} from "@/store/useOrderStore";

interface ReviewableItem {
  productId: number;
  name: string;
}

interface OrderReviewSectionProps {
  order: {
    id: number;
    status: string;
    items?: ReviewableItem[];
    reviews?: OrderReview[];
    reviewPromptDismissed?: boolean;
  };
}

const RATING_LABELS = ["", "Poor", "Fair", "Good", "Very good", "Loved it"];

function StarRating({
  value,
  onChange,
  size = "h-6 w-6",
}: {
  value: number;
  onChange?: (rating: number) => void;
  size?: string;
}) {
  const [hovered, setHovered] = useState(0);
  const active = hovered || value;

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={!onChange}
          aria-label={`${star} star${star > 1 ? "s" : ""}`}
          className={onChange ? "transition hover:scale-110" : "cursor-default"}
          onClick={() => onChange?.(star)}
          onMouseEnter={() => onChange && setHovered(star)}
          onMouseLeave={() => onChange && setHovered(0)}
        >
          <Star
            className={`${size} ${
              star <= active
                ? "text-yellow-400 fill-yellow-400"
                : "text-zinc-300"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

export function OrderReviewSection({ order }: OrderReviewSectionProps) {
  const submitReview = useOrderStore((s) => s.submitReview);
  const dismissReviewPrompt = useOrderStore((s) => s.dismissReviewPrompt);

  const [drafts, setDrafts] = useState<
    Record<number, { rating: number; comment: string }>
  >({});
  const [reopened, setReopened] = useState(false);
  const [saving, setSaving] = useState(false);

  const reviews = order.reviews ?? [];

  const reviewByProduct = useMemo(
    () => new Map(reviews.map((review) => [review.productId, review])),
    [reviews]
  );

  // an order can list the same product on more than one line — it still gets
  // a single review
  const items = useMemo(() => {
    const unique = new Map<number, ReviewableItem>();
    (order.items ?? []).forEach((item) => {
      if (!unique.has(item.productId)) unique.set(item.productId, item);
    });
    return [...unique.values()];
  }, [order.items]);

  const pending = items.filter((item) => !reviewByProduct.has(item.productId));

  if (order.status !== "delivered" || !items.length) return null;

  const setDraft = (productId: number, patch: Partial<{ rating: number; comment: string }>) =>
    setDrafts((prev) => ({
      ...prev,
      [productId]: {
        rating: prev[productId]?.rating ?? 0,
        comment: prev[productId]?.comment ?? "",
        ...patch,
      },
    }));

  const handleSubmit = async () => {
    const payload: ReviewDraft[] = pending
      .map((item) => ({
        productId: item.productId,
        rating: drafts[item.productId]?.rating ?? 0,
        comment: (drafts[item.productId]?.comment ?? "").trim(),
      }))
      .filter((draft) => draft.rating > 0);

    if (!payload.length) {
      toast.error("Please pick a star rating first");
      return;
    }

    setSaving(true);
    const error = await submitReview(order.id, payload);
    setSaving(false);

    if (error) {
      toast.error(error);
      return;
    }

    toast.success("Thanks for reviewing your purchase");
    setDrafts({});
    setReopened(false);
  };

  const handleNotNow = async () => {
    setReopened(false);
    await dismissReviewPrompt(order.id);
  };

  // "Not now" keeps the form closed until they ask for it again
  const showForm = pending.length > 0 && (!order.reviewPromptDismissed || reopened);
  const showReopenButton = pending.length > 0 && !showForm;

  return (
    <div className="mt-4 space-y-3">
      {reviews.length > 0 && (
        <div className="rounded-xl border border-amber-100 bg-amber-50/40 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Your review
          </p>

          <div className="mt-3 space-y-3">
            {items
              .filter((item) => reviewByProduct.has(item.productId))
              .map((item) => {
                const review = reviewByProduct.get(item.productId);

                return (
                  <div key={item.productId} className="space-y-1">
                    {items.length > 1 && (
                      <p className="text-sm font-medium text-foreground/90">
                        {item.name}
                      </p>
                    )}

                    <div className="flex items-center gap-2">
                      <StarRating value={review.rating} size="h-4 w-4" />
                      <span className="text-xs text-muted-foreground">
                        {RATING_LABELS[review.rating]}
                      </span>
                    </div>

                    {review.comment && (
                      <p className="text-sm text-muted-foreground">
                        “{review.comment}”
                      </p>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {showReopenButton && (
        <Button
          variant="outline"
          className="w-full rounded-xl gap-2 border-amber-200 text-primary sm:w-auto"
          onClick={() => setReopened(true)}
        >
          <Star className="h-4 w-4" />
          Review the purchase
        </Button>
      )}

      {showForm && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4">
          <p className="font-semibold text-primary">How was your order?</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Your rating helps other customers pick with confidence.
          </p>

          <div className="mt-4 space-y-4">
            {pending.map((item) => {
              const draft = drafts[item.productId];

              return (
                <div key={item.productId} className="space-y-2">
                  {items.length > 1 && (
                    <p className="text-sm font-medium text-foreground/90">
                      {item.name}
                    </p>
                  )}

                  <div className="flex items-center gap-3">
                    <StarRating
                      value={draft?.rating ?? 0}
                      onChange={(rating) => setDraft(item.productId, { rating })}
                    />
                    {draft?.rating > 0 && (
                      <span className="text-xs font-medium text-amber-700">
                        {RATING_LABELS[draft.rating]}
                      </span>
                    )}
                  </div>

                  <Textarea
                    rows={3}
                    maxLength={1000}
                    placeholder="Tell us what you liked (optional)"
                    className="resize-none rounded-xl border-amber-200 bg-white"
                    value={draft?.comment ?? ""}
                    onChange={(e) =>
                      setDraft(item.productId, { comment: e.target.value })
                    }
                  />
                </div>
              );
            })}
          </div>

          <div className="mt-4 flex flex-wrap justify-end gap-2">
            <Button
              variant="ghost"
              className="rounded-full text-muted-foreground"
              disabled={saving}
              onClick={handleNotNow}
            >
              Not now
            </Button>

            <Button
              className="rounded-full px-6"
              disabled={saving}
              onClick={handleSubmit}
            >
              {saving ? "Submitting..." : "Submit review"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
