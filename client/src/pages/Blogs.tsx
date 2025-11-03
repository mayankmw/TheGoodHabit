import { useState } from "react";
import { Clock, ArrowRight, Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const blogPosts = [
  {
    id: 1,
    title: "5 Morning Habits for a Healthier Start",
    image: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1000&q=80",
    category: "Lifestyle",
    readTime: "4 min read",
    description:
      "Start your day with mindful rituals — a glass of warm water, a protein-rich breakfast, and a few minutes of gratitude to energize your morning.",
  },
  {
    id: 2,
    title: "Why Dates Are the Perfect Natural Sweetener",
    image: "https://images.unsplash.com/photo-1601004890684-d8cbf643f5f2?auto=format&fit=crop&w=1000&q=80",
    category: "Nutrition",
    readTime: "3 min read",
    description:
      "Dates not only satisfy your sweet cravings but also provide essential vitamins, minerals, and fiber to keep your gut happy and your energy steady.",
  },
  {
    id: 3,
    title: "Balancing Protein Intake the Smart Way",
    image: "https://images.unsplash.com/photo-1572449043416-55f4685c9bb7?auto=format&fit=crop&w=1000&q=80",
    category: "Health Tips",
    readTime: "5 min read",
    description:
      "Whether you’re into fitness or mindful eating, protein plays a vital role. Discover how to include plant-based protein in every meal without overdoing it.",
  },
  {
    id: 4,
    title: "Healthy Snacking on Busy Days",
    image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1000&q=80",
    category: "Wellness",
    readTime: "2 min read",
    description:
      "Skip the chips and switch to smarter snacks. Here’s how you can keep your energy up during work or travel — without compromising on taste or health.",
  },
];



export const Blogs = () => {
  const [selectedCategory, setSelectedCategory] = useState("All");

  const categories = ["All", "Lifestyle", "Nutrition", "Health Tips", "Wellness"];

  const filteredBlogs =
    selectedCategory === "All"
      ? blogPosts
      : blogPosts.filter((post) => post.category === selectedCategory);

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white py-16 px-4">
      <div className="max-w-6xl mx-auto text-center mb-10">
        <h1 className="text-3xl md:text-4xl font-extrabold text-primary mb-2">
          The Good Habit Journal
        </h1>
        <p className="text-muted-foreground">
          Stories, tips, and inspiration to build better habits — one bite at a time.
        </p>
      </div>

      {/* 🌿 Category Filter */}
      <div className="flex flex-wrap justify-center gap-3 mb-10">
        {categories.map((cat) => (
          <Badge
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`cursor-pointer px-4 py-1 text-sm font-medium border rounded-full transition ${
              selectedCategory === cat
                ? "bg-primary text-white border-primary"
                : "bg-white hover:bg-amber-100 border-border text-foreground"
            }`}
          >
            {cat}
          </Badge>
        ))}
      </div>

      {/* 📰 Blog Grid */}
      <div className="max-w-6xl mx-auto grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {filteredBlogs.map((post) => (
          <div
            key={post.id}
            className="bg-white border border-border rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 group"
          >
            <div className="relative">
              <img
                src={post.image}
                alt={post.title}
                className="w-full h-56 object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute top-3 left-3 bg-primary text-white text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1">
                <Leaf className="h-3 w-3" /> {post.category}
              </div>
            </div>

            <div className="p-6 flex flex-col justify-between h-full">
              <div>
                <h3 className="text-lg font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                  {post.title}
                </h3>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                  {post.description}
                </p>
              </div>

              <div className="flex justify-between items-center text-sm text-muted-foreground mt-auto">
                <span className="flex items-center gap-1">
                  <Clock size={14} /> {post.readTime}
                </span>
                <Button
                  variant="ghost"
                  className="text-primary hover:text-primary/80 p-0 font-semibold flex items-center gap-1"
                >
                  Read More <ArrowRight size={14} />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 🍃 Decorative Footer Section */}
      <div className="mt-20 text-center">
        <p className="text-muted-foreground text-sm mb-4">
          Want more goodness in your inbox?
        </p>
        <div className="flex justify-center gap-2">
          <input
            type="email"
            placeholder="Enter your email"
            className="border border-border rounded-full px-4 py-2 w-64 text-sm focus:ring-2 focus:ring-primary outline-none"
          />
          <Button className="rounded-full bg-primary text-white hover:bg-primary/90">
            Subscribe
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Blogs;
