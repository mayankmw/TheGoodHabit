interface ProductDescriptionProps {
  productName: string;
}

// Placeholder copy for now — this will be filled per product from admin later.
export const ProductDescription = ({ productName }: ProductDescriptionProps) => (
  <section className="py-12">
    <div className="container mx-auto px-4">
      <h2 className="mb-8 text-2xl font-bold text-center">Product Description</h2>

      <div className="mx-auto max-w-3xl space-y-4 text-center text-sm md:text-base leading-relaxed text-muted-foreground">
        <p>
          {productName} is made for the moments in between: a quick bite before a
          workout, a sweet fix after lunch, or something to share on the go.
        </p>
        <p>
          We keep it simple, with a handful of ingredients you can read and
          recognise, so every bite tastes good and keeps you going through the day.
        </p>
      </div>
    </div>
  </section>
);

export default ProductDescription;
