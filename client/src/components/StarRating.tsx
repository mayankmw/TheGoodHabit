import { useState } from "react";
import { Star } from "lucide-react";

export const RATING_LABELS = ["", "Poor", "Fair", "Good", "Very good", "Loved it"];

/**
 * Shared by the write-a-review form on the orders page and the read-only list
 * on the product page. Passing no `onChange` makes it display-only.
 */
export function StarRating({
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
              star <= active ? "text-yellow-400 fill-yellow-400" : "text-zinc-300"
            }`}
          />
        </button>
      ))}
    </div>
  );
}
