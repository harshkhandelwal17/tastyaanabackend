import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGetHomepageHeroSlidesQuery } from "../../redux/storee/api";

// Default slides in case API fails
const defaultSlides = [
  {
    id: 1,
    name: "Authentic Home-Style Meals",
    image: "/assets/thali.png",
    description:
      "Indulge in traditional recipes made with love and the finest ingredients, bringing the warmth of home-cooked meals to your doorstep.",
    color: "from-amber-600",
    cta: "Order Now",
  },
  {
    id: 2,
    name: "Sweet Delights & Traditional Treats",
    image: "/assets/sweets1.png",
    description:
      "From festival specials to everyday indulgences, our sweets are crafted using time-honored techniques and premium ingredients.",
    color: "from-orange-500",
    cta: "Explore Sweets",
  },
  {
    id: 3,
    name: "Fresh Groceries at Your Doorstep",
    image: "/assets/groceries.png",
    description:
      "Shop from our carefully curated selection of fresh vegetables, fruits, spices, and pantry essentials sourced directly from trusted farmers.",
    color: "from-yellow-500",
    cta: "Shop Now",
  },
];

const HeroSection = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  // Fetch hero slides from the backend
  const {
    data: heroData,
    isLoading,
    isError,
  } = useGetHomepageHeroSlidesQuery();

  // Use data from API or fallback to default slides
  const slides = heroData?.data?.slides || defaultSlides;

  useEffect(() => {
    let interval;
    if (isAutoPlaying) {
      interval = setInterval(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % slides.length);
      }, 5000);
    }

    return () => clearInterval(interval);
  }, [isAutoPlaying, slides.length]);

  const handleDotClick = (index) => {
    setCurrentIndex(index);
    setIsAutoPlaying(false);
    // Resume auto-play after 10 seconds of inactivity
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const handlePrevClick = () => {
    setCurrentIndex(
      (prevIndex) => (prevIndex - 1 + slides.length) % slides.length
    );
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const handleNextClick = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % slides.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const handleOrderNow = () => {
    // Handle order now action
    console.log("Order Now clicked - would navigate to /products");
  };

  // Show loading state if needed
  if (isLoading) {
    return (
      <div className="w-full h-[70vh] min-h-[400px] bg-gray-100 flex items-center justify-center">
        <div className="animate-pulse text-gray-400">
          Loading hero section...
        </div>
      </div>
    );
  }

  // Show error state if API fails
  if (isError || !slides || slides.length === 0) {
    return (
      <div className="w-full h-[70vh] min-h-[400px] bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
        <div className="text-center text-white p-6">
          <h2 className="text-2xl font-bold mb-2">Welcome to Our Store</h2>
          <p className="mb-4">Discover amazing products at great prices</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-white text-blue-600 px-6 py-2 rounded-lg font-medium hover:bg-blue-50 transition-colors"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[70vh] min-h-[400px] overflow-hidden bg-black z-0">
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
          <div
            className={`absolute inset-0 bg-gradient-to-r ${slides[currentIndex].color} to-transparent opacity-90`}
          ></div>
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black opacity-70"></div>
          <motion.img
            src={slides[currentIndex].image}
            alt={slides[currentIndex].name}
            className="w-full h-full object-cover opacity-30"
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            transition={{ duration: 8, ease: "easeOut" }}
            onError={(e) => {
              // Fallback to a default image if the image fails to load
              e.target.src = "/assets/placeholder-hero.jpg";
            }}
          />
        </motion.div>
      </AnimatePresence>

      {/* Content */}
      <div className="relative z-10 h-full flex items-center">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between h-full py-8">
          {/* Text Content */}
          <motion.div
            className="w-full md:w-1/2 text-white text-center md:text-left mb-8 md:mb-0"
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
                className="space-y-3 sm:space-y-4"
              >
                <motion.h1
                  className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold leading-tight"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                >
                  {slides[currentIndex].name}
                </motion.h1>
                <motion.p
                  className="text-sm sm:text-base md:text-lg max-w-md mx-auto md:mx-0 opacity-90 leading-relaxed"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                >
                  {slides[currentIndex].description}
                </motion.p>
                <motion.div
                  className="pt-2 sm:pt-4 flex justify-center md:justify-start"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.7 }}
                >
                  <button
                    onClick={handleOrderNow}
                    className="bg-white text-gray-900 font-semibold px-6 py-2 sm:px-8 sm:py-3 rounded-lg hover:bg-opacity-90 transition duration-300 text-sm sm:text-base shadow-lg"
                  >
                    {slides[currentIndex].cta || "Shop Now"}
                  </button>
                </motion.div>
              </motion.div>
            </AnimatePresence>
          </motion.div>

          {/* Image */}
          <motion.div
            className="w-full md:w-2/5 flex justify-center md:justify-end"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, y: 20, rotate: -5 }}
                animate={{ opacity: 1, y: 0, rotate: 0 }}
                exit={{ opacity: 0, y: -20, rotate: 5 }}
                transition={{ duration: 0.7 }}
                className="relative"
              >
                <motion.img
                  src={slides[currentIndex].image}
                  alt={slides[currentIndex].name}
                  onError={(e) => {
                    // Fallback to a default image if the image fails to load
                    e.target.src = "/assets/placeholder-product.png";
                  }}
                  className="max-h-[200px] sm:max-h-[250px] md:max-h-[300px] lg:max-h-[350px] object-contain drop-shadow-2xl"
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

      {/* Navigation */}
      <div className="absolute bottom-4 sm:bottom-6 md:bottom-8 left-0 right-0 z-20 flex flex-col items-center">
        {/* Dots */}
        <div className="flex space-x-2 sm:space-x-3 mb-2 sm:mb-3">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => handleDotClick(index)}
              className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full transition-all duration-300 ${
                currentIndex === index
                  ? "bg-white scale-20"
                  : "bg-gray-400 scale-20 bg-opacity-50"
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>

        {/* Prev/Next Buttons */}
        {/* <div className="flex items-center space-x-3 sm:space-x-4">
          <button
            onClick={handlePrevClick}
            className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-black bg-opacity-40 flex items-center justify-center hover:bg-opacity-60 transition duration-300"
            aria-label="Previous slide"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-3 w-3 sm:h-4 sm:w-4 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <button
            onClick={handleNextClick}
            className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-black bg-opacity-40 flex items-center justify-center hover:bg-opacity-60 transition duration-300"
            aria-label="Next slide"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-3 w-3 sm:h-4 sm:w-4 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div> */}
      </div>
    </div>
  );
};

export default HeroSection;
