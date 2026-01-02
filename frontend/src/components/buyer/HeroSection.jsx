import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { heroSlides } from "./sweetData";
import {
  ChevronLeft,
  ChevronRight,
  ShoppingCart,
  Play,
  Sparkles,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const HeroSection = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const slideVariants = {
    enter: (direction) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0,
      scale: 0.8,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      scale: 1,
    },
    exit: (direction) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0,
      scale: 0.8,
    }),
  };

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-[#fcf8f3]">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center min-h-[80vh]">
          {/* Content */}
          <div className="space-y-6">
            <div className="inline-flex items-center gap-3 bg-gradient-to-r from-amber-500/10 to-orange-500/10 backdrop-blur-sm border border-amber-500/20 rounded-full px-5 py-2 text-amber-800">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span className="font-medium">Tastyaana Heritage</span>
            </div>

            <div className="space-y-2">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-800 leading-tight">
                <span className="block">
                  {heroSlides[currentSlide].title
                    .split(" ")
                    .slice(0, 2)
                    .join(" ")}
                </span>
                <span
                  className={`block bg-gradient-to-r ${heroSlides[currentSlide].accent} bg-clip-text text-transparent`}
                >
                  {heroSlides[currentSlide].title.split(" ").slice(2).join(" ")}
                </span>
              </h1>
            </div>

            <p className="text-lg text-gray-600 leading-relaxed max-w-2xl">
              {heroSlides[currentSlide].subtitle}
            </p>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => navigate("/products")}
                className={`group bg-gradient-to-r ${heroSlides[currentSlide].accent} text-white px-6 py-3 rounded-xl font-medium text-base hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2`}
              >
                <span>{heroSlides[currentSlide].cta}</span>
                <ShoppingCart className="w-4 h-4" />
              </button>

              <button className="group bg-white border border-gray-300 text-gray-700 px-6 py-3 rounded-xl font-medium text-base hover:bg-gray-50 transition-all duration-300 flex items-center justify-center gap-2">
                <Play className="w-4 h-4" />
                <span>Our Story</span>
              </button>
            </div>
          </div>

          {/* Image */}
          <div className="relative">
            <div className="relative group">
              <div className="relative overflow-hidden rounded-2xl border border-gray-200 shadow-lg">
                <AnimatePresence mode="wait">
                  <motion.img
                    key={currentSlide}
                    src={heroSlides[currentSlide].image}
                    alt="Sweet Delights"
                    className="w-full h-80 lg:h-96 object-cover"
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{
                      x: { type: "spring", stiffness: 300, damping: 30 },
                      opacity: { duration: 0.5 },
                    }}
                  />
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation controls */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex items-center gap-3">
          <button
            onClick={() =>
              setCurrentSlide(
                (prev) => (prev - 1 + heroSlides.length) % heroSlides.length
              )
            }
            className="bg-white p-2 rounded-full text-gray-700 hover:bg-gray-50 transition-all duration-300 border border-gray-200 shadow-sm"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex gap-2">
            {heroSlides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index === currentSlide
                    ? "bg-amber-500"
                    : "bg-gray-300 hover:bg-gray-400"
                }`}
              />
            ))}
          </div>

          <button
            onClick={() =>
              setCurrentSlide((prev) => (prev + 1) % heroSlides.length)
            }
            className="bg-white p-2 rounded-full text-gray-700 hover:bg-gray-50 transition-all duration-300 border border-gray-200 shadow-sm"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
