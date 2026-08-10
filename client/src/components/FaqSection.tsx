import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";

interface Faq {
  question: string;
  answer: string;
  bg: string;
  arrowBg: string;
  angle: number;
}

const FAQS: Faq[] = [
  {
    question: "What makes NoshBOB snacks different from other snacks?",
    answer:
      "Every NoshBOB snack is made with real, whole ingredients and no shortcuts — just balance, flavor, and better living in every bite.",
    bg: "bg-pink-100",
    arrowBg: "bg-pink-300 text-pink-950",
    angle: -3,
  },
  {
    question: "Are NoshBOB products suitable for vegans and vegetarians?",
    answer:
      "Most of our range is vegetarian and vegan-friendly. Each product page lists the exact dietary tags so you can check before you buy.",
    bg: "bg-lime-200",
    arrowBg: "bg-lime-400 text-lime-950",
    angle: 2.5,
  },
  {
    question: "What ingredients are used in NoshBOB products?",
    answer:
      "We use whole fruits, nuts, and grains with no artificial preservatives or flavors. Full ingredient lists are on every product page.",
    bg: "bg-purple-200",
    arrowBg: "bg-purple-400 text-purple-950",
    angle: 2.5,
  },
  {
    question: "What does \"no added sugar\" mean?",
    answer:
      "It means we never add refined or extra sugar during production — any sweetness comes naturally from the fruits and ingredients themselves.",
    bg: "bg-pink-100",
    arrowBg: "bg-pink-300 text-pink-950",
    angle: -3,
  },
  {
    question: "Are NoshBOB products gluten-free?",
    answer:
      "Yes, all our products are gluten-free and made to bring you real, guilt-free snacking pleasure.",
    bg: "bg-lime-200",
    arrowBg: "bg-lime-400 text-lime-950",
    angle: -2.5,
  },
  {
    question: "How long does delivery take?",
    answer:
      "Orders are typically dispatched within 24-48 hours and delivered within 3-7 business days depending on your location.",
    bg: "bg-purple-200",
    arrowBg: "bg-purple-400 text-purple-950",
    angle: 2,
  },
];

const FaqCard = ({ faq }: { faq: Faq }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className={`relative h-[130px] ${open ? "z-20" : "z-0"}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{ transform: `rotate(${open ? 0 : faq.angle}deg)` }}
        className={`absolute inset-x-0 top-0 flex min-h-[130px] w-full flex-col justify-center rounded-2xl px-5 py-6 text-left transition-transform duration-300 ease-out ${faq.bg} ${open ? "shadow-xl" : "shadow-md hover:shadow-lg"}`}
      >
        <div className="flex items-start justify-between gap-4">
          <p className="text-sm font-bold leading-snug text-zinc-900 md:text-base">
            {faq.question}
          </p>
          <span
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-transform duration-300 ${faq.arrowBg} ${open ? "rotate-180" : ""}`}
          >
            <ChevronDown className="h-4 w-4" />
          </span>
        </div>

        <div
          className={`grid transition-all duration-300 ease-in-out ${open ? "mt-3 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
        >
          <div className="overflow-hidden">
            <p className="text-sm leading-relaxed text-zinc-800">{faq.answer}</p>
          </div>
        </div>
      </button>
    </div>
  );
};

export const FaqSection = () => {
  const leftColumn = FAQS.filter((_, i) => i % 2 === 0);
  const rightColumn = FAQS.filter((_, i) => i % 2 === 1);

  return (
    <section className="bg-background py-16">
      <div className="container mx-auto px-4">
        <div className="grid gap-10 md:grid-cols-[320px_1fr] md:gap-14 lg:grid-cols-[380px_1fr]">
          <div>
            <span className="inline-block -rotate-6 rounded-full border-2 border-dashed border-primary/60 bg-primary/10 px-4 py-1 text-xs font-bold tracking-wide text-primary">
              FAQ
            </span>
            <h2 className="mt-3 bg-gradient-to-r from-yellow-400 via-orange-500 to-pink-500 bg-clip-text text-3xl font-black uppercase leading-tight tracking-wide text-transparent md:text-4xl">
              Got Questions?
              <br />
              We've Got Answers!
            </h2>

            <motion.img
              src="/images/faq/faq.jpeg"
              alt="Dates"
              className="mt-6 h-48 w-48 md:h-64 md:w-64 lg:h-80 lg:w-80"
              animate={{ y: [0, -8, 0], rotate: [0, 4, 0, -4, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>

          <div className="grid w-full grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6">
            <div className="flex flex-col gap-9 sm:gap-8">
              {leftColumn.map((faq) => (
                <FaqCard key={faq.question} faq={faq} />
              ))}
            </div>
            <div className="flex flex-col gap-7 sm:mt-10 sm:gap-8">
              {rightColumn.map((faq) => (
                <FaqCard key={faq.question} faq={faq} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FaqSection;
