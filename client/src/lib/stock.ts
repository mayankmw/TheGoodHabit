/**
 * stock === null means the product is not tracked and sells without limit.
 * That distinction is why nothing here uses the `|| 0` idiom: coercing null
 * to 0 would mark the entire untracked catalogue as sold out.
 */
export const LOW_STOCK_AT = 5;

export const isUntracked = (stock?: number | null) =>
  stock === null || stock === undefined;

export const isOutOfStock = (stock?: number | null) =>
  !isUntracked(stock) && Number(stock) <= 0;

export const isLowStock = (stock?: number | null) =>
  !isUntracked(stock) && Number(stock) > 0 && Number(stock) <= LOW_STOCK_AT;
