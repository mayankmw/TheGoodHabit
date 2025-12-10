import { Star, StarHalf } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useCartStore } from "@/store/useCartStore";
import { Link } from "react-router-dom";
import { useUIStore } from "@/store/useUIStore";

interface ProductCardMiniProps {
  id: string;
  image: string;
  name: string;
  originalPrice: number;
  discountedPrice: number;
  rating: number;
  reviews: number;
}

export const ProductCardMini = ({
  id,
  image,
  name,
  originalPrice,
  discountedPrice,
  rating,
  reviews,
}: ProductCardMiniProps) => {

  const discountPercent = Math.round(
    ((originalPrice - discountedPrice) / originalPrice) * 100
  );

  const renderStars = () => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Star key={i} className="w-2.5 h-2.5 fill-secondary text-secondary" />
      );
    }
    if (hasHalfStar) {
      stars.push(
        <StarHalf key="half" className="w-2.5 h-2.5 fill-secondary text-secondary" />
      );
    }
    return stars;
  };

  const addToCart = useCartStore((s) => s.addToCart);
const setOpenCart = useUIStore((s) => s.setOpenCart);
const setOpenSearch = useUIStore((s) => s.setOpenSearch);

  return (
    <Card className="group overflow-hidden border border-border hover:border-primary transition-all duration-300 hover:shadow-sm">
      <CardContent className="p-0">

        {/* Image Section */}
        <Link to={`/products/${id}`}>
          <div className="relative aspect-square overflow-hidden bg-card">
            <img
              src={image}
              alt={name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />

            {/* Discount Badge */}
            {discountPercent > 0 && (
              <div className="absolute top-1.5 right-1.5 bg-green-600 text-white px-1.5 py-0.5 rounded-full text-[9px] font-semibold">
                -{discountPercent}%
              </div>
            )}
          </div>
        </Link>

        {/* Content */}
        <div className="p-2.5 space-y-1.5">
          
          {/* Rating */}
          <div className="flex items-center gap-1">
            <div className="flex gap-[1px]">{renderStars()}</div>
            <span className="text-[10px] text-muted-foreground">{reviews}</span>
          </div>

          {/* Product Name */}
          <Link to={`/products/${id}`}>
            <h3 className="font-semibold text-[11px] uppercase leading-tight line-clamp-2 hover:text-primary transition">
              {name}
            </h3>
          </Link>

          {/* Price */}
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground line-through text-[10px]">
              ₹{originalPrice}
            </span>
            <span className="text-sm font-bold">₹{discountedPrice}</span>
          </div>

          {/* Add Button */}
          <Button className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground text-[10px] font-bold py-1.5 rounded-md"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              addToCart(id);
              setOpenSearch(false);
              setOpenCart(true); 
            }}>
            ADD
          </Button>

        </div>

      </CardContent>
    </Card>
  );
};
