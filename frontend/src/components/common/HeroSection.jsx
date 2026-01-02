import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Truck, CheckCircle, ChevronDown } from 'lucide-react';
import {useRef} from 'react';
const HeroSection = ({ heroSlides = [], onScrollToFeatured }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const navigate = useNavigate();
  const slideInterval = useRef();

  // Auto-advance slides
  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % (heroSlides.length || 1));
  }, [heroSlides.length]);

  // Set up auto-advance interval
  useEffect(() => {
    if (heroSlides.length > 1) {
      slideInterval.current = setInterval(nextSlide, 8000);
      return () => clearInterval(slideInterval.current);
    }
  }, [heroSlides.length, nextSlide]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') {
        setCurrentSlide(prev => (prev - 1 + heroSlides.length) % heroSlides.length);
      } else if (e.key === 'ArrowRight') {
        nextSlide();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [heroSlides.length, nextSlide]);

  // Handle scroll to featured section
  const handleScrollToFeatured = (e) => {
    e.preventDefault();
    if (onScrollToFeatured) {
      onScrollToFeatured();
    }
  };

  return (
    <div className="relative w-full h-[50vh] sm:h-[60vh] md:h-[70vh] lg:h-[80vh] xl:h-[85vh] overflow-hidden bg-black z-0">
      {/* Background Slides */}
      <AnimatePresence mode="wait">
        {heroSlides.length > 0 ? (
          <motion.div
            key={currentSlide}
            className="absolute inset-0 w-full h-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7 }}
          >
            {/* Gradient Overlays */}
            <div className="absolute inset-0 bg-black/40 z-10"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent z-10"></div>
            
            {/* Background Image */}
            <motion.img
              src={heroSlides[currentSlide]?.imagebg || 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?q=80&w=2071&auto=format&fit=crop'}
              alt={heroSlides[currentSlide]?.title || 'Hero'}
              className="w-full h-full object-cover"
              initial={{ scale: 1.1 }}
              animate={{ scale: 1 }}
              transition={{ duration: 8, ease: "easeOut" }}
            />
          </motion.div>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-blue-600"></div>
        )}
      </AnimatePresence>

      {/* Content Container */}
      <div className="relative z-20 h-full flex items-center">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center h-full">
            {/* Text Content */}
            <div className="text-center md:text-left md:w-1/2 lg:w-2/5 text-white px-4 py-12 md:py-0">
              <motion.h1 
                className="text-3xl xs:text-4xl sm:text-5xl md:text-4xl lg:text-5xl xl:text-6xl font-bold leading-tight mb-3 sm:mb-4"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                {heroSlides[currentSlide]?.title || 'Delicious Food Delivered To Your Doorstep'}
              </motion.h1>
              
              <motion.p 
                className="text-base sm:text-lg md:text-base lg:text-lg xl:text-xl text-gray-200 mb-6 sm:mb-8 max-w-lg mx-auto md:mx-0"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                {heroSlides[currentSlide]?.subtitle || 'Order your favorite meals from the best restaurants in town. Fast delivery, fresh food, and great prices!'}
              </motion.p>
              
              <motion.div
                className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <button
                  onClick={() => navigate(heroSlides[currentSlide]?.ctaLink || '/products')}
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold py-3 px-6 sm:px-8 rounded-full text-sm sm:text-base transition-all duration-300 transform hover:scale-105 shadow-lg"
                >
                  {heroSlides[currentSlide]?.cta || 'Order Now'}
                </button>
                <button 
                  onClick={handleScrollToFeatured}
                  className="bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white font-medium py-3 px-6 sm:px-8 rounded-full text-sm sm:text-base border border-white/20 transition-all duration-300 transform hover:scale-105"
                >
                  Explore Menu
                </button>
              </motion.div>
              
              {/* Stats */}
              <motion.div 
                className="hidden sm:flex flex-wrap gap-4 mt-8 md:mt-12 justify-center md:justify-start"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <div className="flex items-center text-sm">
                  <div className="bg-white/20 p-1.5 rounded-full mr-2">
                    <Truck className="h-4 w-4 text-white" />
                  </div>
                  <span>Fast Delivery</span>
                </div>
                <div className="flex items-center text-sm">
                  <div className="bg-white/20 p-1.5 rounded-full mr-2">
                    <CheckCircle className="h-4 w-4 text-white" />
                  </div>
                  <span>100% Quality</span>
                </div>
              </motion.div>
            </div>
            
            {/* Image Content - Only visible on larger screens */}
            <motion.div 
              className="hidden md:block md:absolute right-0 bottom-0 w-1/2 lg:w-2/5 h-3/4 bg-contain bg-no-repeat bg-center"
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              style={{
                backgroundImage: `url(${heroSlides[currentSlide]?.image || 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=500&h=500&fit=crop'})`,
                backgroundSize: 'contain',
                backgroundPosition: 'bottom right',
                backgroundRepeat: 'no-repeat',
              }}
            />
          </div>
        </div>
      </div>
      
      {/* Slide Indicators */}
      {heroSlides.length > 1 && (
        <div className="absolute bottom-4 left-0 right-0 z-20 flex justify-center space-x-2">
          {heroSlides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full transition-all ${currentSlide === index ? 'bg-white w-6 sm:w-8' : 'bg-white/50'}`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
      
      {/* Scroll Down Indicator */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20 hidden md:block">
        <button 
          onClick={handleScrollToFeatured}
          className="text-white/80 hover:text-white transition-colors flex flex-col items-center"
          aria-label="Scroll down"
        >
          <span className="text-sm mb-1">Scroll Down</span>
          <ChevronDown className="h-5 w-5 animate-bounce" />
        </button>
      </div>
    </div>
  );
};

export default HeroSection;
