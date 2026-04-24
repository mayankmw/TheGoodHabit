import { useEffect } from "react";
import { useCommonStore } from "@/store/useCommonStore";

const OurStory = () => {
  const { story, fetchStory, loadingStory } = useCommonStore();

  useEffect(() => {
    fetchStory();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white text-foreground">
      {/* Main Section */}
      <main className="container mx-auto">
        {/* Hero Section */}
        <section className="text-center mb-16 my-8">
          <h1 className="text-4xl md:text-5xl font-extrabold text-primary mb-4">
            NoshBOB
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Every good habit begins with a purpose — and ours began with a
            passion for balance, flavor, and better living.
          </p>
        </section>

        {/* Story Image */}
        <section className="w-full flex justify-center my-16">
          {loadingStory ? (
            <div className="w-[70%] aspect-[16/9] rounded-2xl bg-muted animate-pulse" />
          ) : story?.image ? (
            <img
              src={story.image}
              alt="Our Story"
              className="w-[70%] h-auto object-contain rounded-2xl shadow-xl"
            />
          ) : (
            <div className="text-gray-400 text-center">
              Story image not available
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default OurStory;
