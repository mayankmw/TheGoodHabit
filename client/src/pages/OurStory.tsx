const OurStory = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Main Section */}
      <main className="container mx-auto">
        {/* Hero Section */}
        {/* <section className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-extrabold text-primary mb-4">The Good Habit – Our Story</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Every good habit begins with a purpose — and ours began with a passion for balance, flavor, and better living.
          </p>
        </section> */}

        <section className="w-full">
          <img
            src="/images/story/our-story.png"
            alt="Our Story"
            className="w-full h-full object-cover rounded-2xl shadow-xl"
          />
        </section>
      </main>
    </div>
  );
};

export default OurStory;
