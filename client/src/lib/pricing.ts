/**
 * Percentage off, or 0 when there is no real discount.
 *
 * Some catalogue rows have discountedPrice above originalPrice (product 17 is
 * live like this), which the raw formula turns into a negative "-28% OFF"
 * badge. Guards the divide-by-zero on a 0 originalPrice too.
 */
export const calcDiscountPercent = (
  originalPrice: number | string,
  discountedPrice: number | string
) => {
  const original = Number(originalPrice) || 0;
  const discounted = Number(discountedPrice) || 0;

  if (original <= 0 || discounted <= 0 || discounted >= original) return 0;

  return Math.round(((original - discounted) / original) * 100);
};
