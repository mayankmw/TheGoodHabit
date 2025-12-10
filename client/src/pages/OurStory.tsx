const OurStory = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">

      {/* Main Section */}
      <main className="container mx-auto px-6 py-12">
        {/* Hero Section */}
        <section className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-extrabold text-primary mb-4">The Good Habit – Our Story</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Every good habit begins with a purpose — and ours began with a passion for balance, flavor, and better living.
          </p>
        </section>

        {/* Story Section */}
        <section className="max-w-4xl mx-auto space-y-6 text-lg leading-relaxed text-muted-foreground">
          <p>
            Life in the corporate world taught me many things — discipline, deadlines, and determination — but it also left me drained. 
            Long workdays often ended with late-night hunger, and that’s when the real struggle began.
          </p>

          <p>
            I wanted something quick, tasty, and healthy… but the options were limited. 
            Either it was the same old boring protein bars that tasted like cardboard, or fancy snacks that cost way too much to enjoy every day.
          </p>

          <p>
            I’ve always loved dates — nature’s sweetest and most wholesome snack — but even they started to feel plain after a while. 
            I craved something that had the goodness of dates, the power of protein, and the excitement of flavor.
          </p>

          <p>
            And that’s where the idea for <strong>The Good Habit</strong> was born — right in my tiny kitchen, 
            in between office deadlines and hunger pangs.
          </p>

          <div className="my-10">
            <img
              src="/images/story/story-1.png"
              alt="The Good Habit Journey"
              className="w-full h-[400px] object-cover rounded-2xl shadow-lg"
            />
          </div>

          <p>
            Then life took another beautiful turn — I got married.
            And soon after, I found myself at a crossroads: should I go back to my corporate life, 
            or should I take a leap of faith and create something meaningful — something that could change the way people snack?
          </p>

          <p>
            I chose the second path.  
            I chose to turn my little kitchen experiments into a brand that stood for balance — taste, health, and affordability all in one.
          </p>

          <p>
            That’s how <strong>The Good Habit</strong> came to life — a brand built on the belief that good habits don’t need to be bland, boring, or expensive.
          </p>

          <p>
            Our <strong>Protein-Stuffed Dates</strong> are a sweet reminder that health can still taste heavenly.  
            From the creamy comfort of <strong>Peanut Butter Protein Dates</strong> to the rich indulgence of <strong>Kunafa Protein Dates</strong> 
            for those who crave a little luxury — every bite carries a story of balance, care, and passion.
          </p>

          <p>
            At <strong>The Good Habit</strong>, we believe that health should never feel like a compromise — it should feel like a treat.  
            And that building good habits doesn’t need big changes — just one delicious choice at a time.
          </p>

          <p className="text-center font-semibold text-xl mt-10">
            So here’s to new beginnings, small steps, and <span className="text-primary">The Good Habit</span> —  
            made with heart, hustle, and a handful of love. 🌱
          </p>
        </section>
      </main>
    </div>
  );
};

export default OurStory;
