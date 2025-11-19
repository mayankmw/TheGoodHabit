import { Star, StarHalf } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface ProductCardProps {
  image: string;
  name: string;
  originalPrice: number;
  discountedPrice: number;
  rating: number;
  reviews: number;
}

export const ProductCard = ({
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

  return (
    <Card className="group overflow-hidden border-2 border-border hover:border-primary transition-all duration-300 hover:shadow-xl">
      <CardContent className="p-0">
        {/* Image */}
        <div className="relative aspect-square overflow-hidden bg-card">
          <img
            src={image}
            alt={name}
            className="w-[80%] h-full object-cover group-hover:scale-105 transition-transform duration-300 mx-auto"
          />

          {/* Discount Badge */}
          <div className="absolute top-4 right-4 bg-green-600 text-white px-3 py-1 rounded-full text-xs font-bold">
            -{discountPercent}% OFF
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">

          {/* Rating */}
          <div className="flex items-center gap-2">
            <div className="flex gap-1">{renderStars()}</div>
            <span className="text-sm text-muted-foreground">| {reviews} Reviews</span>
          </div>

          {/* Name */}
          <h3 className="font-black text-lg uppercase leading-tight min-h-[3rem]">
            {name}
          </h3>

          {/* Price */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground line-through">
              ₹{originalPrice}
            </span>
            <span className="text-2xl font-black">₹{discountedPrice}</span>
          </div>

          {/* Shipping Offer */}
          <div className="bg-primary text-primary-foreground text-center py-2 rounded-full text-xs font-bold">
            FREE SHIPPING + 3% PREPAID BONUS
          </div>

          {/* Add to Cart */}
          <Button className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground font-black text-base py-6 rounded-lg">
            ADD TO CART
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
