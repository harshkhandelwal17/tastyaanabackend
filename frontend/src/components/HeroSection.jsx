import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Sample data for the hero section
const heroData = [
  {
    id: 1,
    name: "Authentic Home-Style Meals",
    image: "/assets/thali.png",
    description:
      "Indulge in traditional recipes made with love and the finest ingredients, bringing the warmth of home-cooked meals to your doorstep.",
    color: "from-amber-600",
  },
  {
    id: 2,
    name: "Sweet Delights & Traditional Treats",
    image: "/assets/sweets1.png",
    description:
      "From festival specials to everyday indulgences, our sweets are crafted using time-honored techniques and premium ingredients.",
    color: "from-orange-500",
  },
  {
    id: 3,
    name: "Fresh Groceries at Your Doorstep",
    image: "/assets/groceries.png",
    description:
      "Shop from our carefully curated selection of fresh vegetables, fruits, spices, and pantry essentials sourced directly from trusted farmers.",
    color: "from-yellow-500",
  },
];

const HeroSection = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  
  useEffect(() => {
    let interval;
    if (isAutoPlaying) {
      interval = setInterval(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % heroData.length);
      }, 5000);
    }

    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const handleDotClick = (index) => {
    setCurrentIndex(index);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const handlePrevClick = () => {
    setCurrentIndex(
      (prevIndex) => (prevIndex - 1 + heroData.length) % heroData.length
    );
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const handleNextClick = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % heroData.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const handleOrderNow = () => {
    window.location.href = "/products";
  };

  return (
    <div className="relative w-full h-[50vh] sm:h-[60vh] lg:h-[70vh] overflow-hidden bg-black z-0">
      {/* Background Image with Gradient Overlay */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          className="absolute inset-0 w-full h-full"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7 }}
        >
          <div className="absolute inset-0 bg-black/40"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>
          <motion.img
            src={heroData[currentIndex].image}
            alt={heroData[currentIndex].name}
            className="w-full h-full object-cover"
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            transition={{ duration: 8, ease: "easeOut" }}
          />
        </motion.div>
      </AnimatePresence>

      {/* Content */}
      <div className="relative z-10 h-full flex items-center">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center h-full">
            {/* Text Content - Left Side */}
            <motion.div 
              className="w-full md:w-1/2 text-center md:text-left"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentIndex}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5 }}
                  className="space-y-3 sm:space-y-4 md:space-y-6"
                >
                  <motion.h1
                    className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold leading-tight text-white"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                  >
                    {heroData[currentIndex].name}
                  </motion.h1>
                  <motion.p
                    className="text-sm sm:text-base md:text-lg text-gray-200 max-w-md mx-auto md:mx-0"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.5 }}
                  >
                    {heroData[currentIndex].description}
                  </motion.p>
                  <motion.div
                    className="pt-1 sm:pt-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.7 }}
                  >
                    <button
                      onClick={handleOrderNow}
                      className="bg-white text-gray-900 font-semibold px-4 py-2 sm:px-5 sm:py-2.5 text-sm sm:text-base rounded-md hover:bg-gray-100 transition duration-300"
                    >
                      Order Now
                    </button>
                  </motion.div>
                </motion.div>
              </AnimatePresence>
            </motion.div>

            {/* Image - Right Side */}
            <motion.div
              className="w-full md:w-1/2 flex justify-center items-center mt-6 md:mt-0"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentIndex}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.7 }}
                  className="relative w-full max-w-md"
                >
                  <motion.img
                    src={heroData[currentIndex].image}
                    alt={heroData[currentIndex].name}
                    className="w-full h-auto max-h-[200px] sm:max-h-[250px] md:max-h-[300px] lg:max-h-[350px] object-contain"
                    animate={{ y: [0, -5, 0] }}
                    transition={{
                      repeat: Infinity,
                      duration: 3,
                      ease: "easeInOut",
                    }}
                  />
                </motion.div>
              </AnimatePresence>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Navigation Dots */}
      <div className="absolute bottom-2 left-0 right-0 z-20">
        <div className="container mx-auto px-4">
          <div className="flex justify-center">
            <div className="flex space-x-1">
              {heroData.map((_, index) => (
                <button
                  key={index}
                  onClick={() => handleDotClick(index)}
                  className={`w-1.5 h-1.5 rounded-full transition-all duration-200 ${
                    currentIndex === index
                      ? "bg-white scale-150"
                      : "bg-white bg-opacity-30"
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
