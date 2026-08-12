import { Star, StarHalf } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useCartStore } from "@/store/useCartStore";
import { Link } from "react-router-dom";
import { useUIStore } from "@/store/useUIStore";

interface ProductCardProps {
  id: string;
  image: string;
  name: string;
  originalPrice: number;
  discountedPrice: number;
  rating: number;
  reviews: number;
}

export const ProductCard = ({
  id,
  image,
  name,
  originalPrice,
  discountedPrice,
  rating,
  reviews,
}: ProductCardProps) => {
  const discountPercent = Math.round(
    ((originalPrice - discountedPrice) / originalPrice) * 100
  );

  const renderStars = () => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={i} className="w-4 h-4 fill-secondary text-secondary" />);
    }
    if (hasHalfStar) {
      stars.push(<StarHalf key="half" className="w-4 h-4 fill-secondary text-secondary" />);
    }
    return stars;
  };

  const addToCart = useCartStore((s) => s.addToCart);
const setOpenCart = useUIStore((s) => s.setOpenCart);
const setOpenSearch = useUIStore((s) => s.setOpenSearch);

  
  return (
    <Card className="group overflow-hidden rounded-2xl border-2 border-border transition-all duration-300 hover:-translate-y-1 hover:border-primary hover:shadow-lift">
      <CardContent className="p-0">
        {/* Image */}
        <Link to={`/products/${id}`}>
          <div className="relative aspect-square overflow-hidden bg-muted/40">
            <img
              src={image}
              alt={name}
              className="w-[80%] h-full object-cover group-hover:scale-105 transition-transform duration-300 mx-auto"
            />

            {/* Discount Badge */}
            <div className="absolute top-4 right-4 bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-bold shadow-soft">
              -{discountPercent}% OFF
            </div>
          </div>
        </Link>

        {/* Content */}
        <div className="p-4 space-y-3">

          {/* Rating */}
          <div className="flex items-center gap-2">
            <div className="flex gap-1">{renderStars()}</div>
            <span className="text-sm text-muted-foreground">| {reviews} Reviews</span>
          </div>

          {/* Name */}
          <Link to={`/products/${id}`}>
            <h3 className="font-bold text-lg leading-tight min-h-[3rem] hover:text-primary transition">
              {name}
            </h3>
          </Link>

          {/* Price */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground line-through">
              ₹{originalPrice}
            </span>
            <span className="text-2xl font-black">₹{discountedPrice}</span>
          </div>

          {/* Add to Cart */}
          <Button className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground font-bold text-base py-6 rounded-full"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              addToCart(id, { name, image, originalPrice, discountedPrice });
              setOpenSearch(false);
              setOpenCart(true);
            }}>
            ADD TO CART
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
