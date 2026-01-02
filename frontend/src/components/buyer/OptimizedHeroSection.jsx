import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Play, Pause } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useOptimizedState, useOptimizedScroll } from '../../hook/useOptimizedState';

// Memoized slide component to prevent unnecessary re-renders
const HeroSlide = React.memo(({ slide, isActive, index, onSlideClick }) => {
  const navigate = useNavigate();
  
  const handleClick = useCallback(() => {
    if (slide.actionUrl) {
      navigate(slide.actionUrl);
    }
    onSlideClick?.(slide, index);
  }, [slide, index, navigate, onSlideClick]);

  return (
    <motion.div
      key={slide.id || index}
      initial={{ opacity: 0, scale: 1.1 }}
      animate={{ 
        opacity: isActive ? 1 : 0, 
        scale: isActive ? 1 : 1.1 
      }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
      className={`absolute inset-0 w-full h-full ${
        isActive ? 'z-10' : 'z-0'
      }`}
    >
      <div 
        className="relative w-full h-full bg-cover bg-center bg-no-repeat cursor-pointer"
        style={{ backgroundImage: `url(${slide.imageUrl})` }}
        onClick={handleClick}
      >
        {/* Overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-40" />
        
        {/* Content */}
        <div className="relative z-10 flex items-center justify-center h-full">
          <div className="text-center text-white px-4 max-w-4xl mx-auto">
            <motion.h1
              initial={{ y: 50, opacity: 0 }}
              animate={isActive ? { y: 0, opacity: 1 } : { y: 50, opacity: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="text-4xl md:text-6xl lg:text-7xl font-bold mb-4"
            >
              {slide.title}
            </motion.h1>
            
            <motion.p
              initial={{ y: 30, opacity: 0 }}
              animate={isActive ? { y: 0, opacity: 1 } : { y: 30, opacity: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="text-lg md:text-xl lg:text-2xl mb-6 text-gray-200"
            >
              {slide.subtitle}
            </motion.p>
            
            {slide.actionText && (
              <motion.button
                initial={{ y: 20, opacity: 0 }}
                animate={isActive ? { y: 0, opacity: 1 } : { y: 20, opacity: 0 }}
                transition={{ delay: 0.6, duration: 0.6 }}
                className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-full text-lg font-semibold transition-colors duration-300 transform hover:scale-105"
                onClick={handleClick}
              >
                {slide.actionText}
              </motion.button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
});

HeroSlide.displayName = 'HeroSlide';

// Memoized navigation dots
const NavigationDots = React.memo(({ slides, currentSlide, onDotClick }) => {
  return (
    <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-20 flex space-x-2">
      {slides.map((_, index) => (
        <button
          key={index}
          onClick={() => onDotClick(index)}
          className={`w-3 h-3 rounded-full transition-all duration-300 ${
            index === currentSlide
              ? 'bg-white scale-125'
              : 'bg-white bg-opacity-50 hover:bg-opacity-75'
          }`}
        />
      ))}
    </div>
  );
});

NavigationDots.displayName = 'NavigationDots';

// Main optimized hero section component
const OptimizedHeroSection = ({ 
  slides = [], 
  autoPlay = true, 
  interval = 5000,
  onSlideChange,
  className = ""
}) => {
  const [currentSlide, setCurrentSlide] = useOptimizedState(0);
  const [isPaused, setIsPaused] = useState(false);
  const autoPlayRef = useRef(null);
  const containerRef = useRef(null);
  const navigate = useNavigate();

  // Memoized slide data to prevent unnecessary re-renders
  const memoizedSlides = useMemo(() => {
    return slides.map((slide, index) => ({
      ...slide,
      id: slide.id || `slide-${index}`,
      index
    }));
  }, [slides]);

  // Optimized slide change handler
  const handleSlideChange = useCallback((newSlide) => {
    if (newSlide !== currentSlide && newSlide >= 0 && newSlide < memoizedSlides.length) {
      setCurrentSlide(newSlide);
      onSlideChange?.(memoizedSlides[newSlide], newSlide);
    }
  }, [currentSlide, memoizedSlides, setCurrentSlide, onSlideChange]);

  // Next slide handler
  const nextSlide = useCallback(() => {
    handleSlideChange((currentSlide + 1) % memoizedSlides.length);
  }, [currentSlide, memoizedSlides.length, handleSlideChange]);

  // Previous slide handler
  const prevSlide = useCallback(() => {
    handleSlideChange((currentSlide - 1 + memoizedSlides.length) % memoizedSlides.length);
  }, [currentSlide, memoizedSlides.length, handleSlideChange]);

  // Auto-play functionality
  useEffect(() => {
    if (autoPlay && !isPaused && memoizedSlides.length > 1) {
      autoPlayRef.current = setInterval(nextSlide, interval);
      
      return () => {
        if (autoPlayRef.current) {
          clearInterval(autoPlayRef.current);
        }
      };
    }
  }, [autoPlay, isPaused, interval, nextSlide, memoizedSlides.length]);

  // Pause auto-play on hover
  const handleMouseEnter = useCallback(() => {
    if (autoPlay) {
      setIsPaused(true);
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
      }
    }
  }, [autoPlay]);

  const handleMouseLeave = useCallback(() => {
    if (autoPlay) {
      setIsPaused(false);
    }
  }, [autoPlay]);

  // Optimized scroll handling for parallax effect
  useOptimizedScroll((scrollY) => {
    if (containerRef.current) {
      const scrolled = scrollY * 0.5;
      containerRef.current.style.transform = `translateY(${scrolled}px)`;
    }
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'ArrowLeft') {
        prevSlide();
      } else if (e.key === 'ArrowRight') {
        nextSlide();
      } else if (e.key === ' ') {
        e.preventDefault();
        setIsPaused(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [prevSlide, nextSlide]);

  // Don't render if no slides
  if (!memoizedSlides.length) {
    return null;
  }

  return (
    <section 
      ref={containerRef}
      className={`relative h-screen overflow-hidden ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Slides */}
      <div className="relative w-full h-full">
        <AnimatePresence mode="wait">
          {memoizedSlides.map((slide, index) => (
            <HeroSlide
              key={slide.id}
              slide={slide}
              index={index}
              isActive={index === currentSlide}
              onSlideClick={(slide, index) => {
                if (slide.actionUrl) {
                  navigate(slide.actionUrl);
                }
              }}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Navigation Arrows */}
      {memoizedSlides.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 z-20 bg-black bg-opacity-50 hover:bg-opacity-75 text-white p-3 rounded-full transition-all duration-300 hover:scale-110"
            aria-label="Previous slide"
          >
            <ChevronLeft size={24} />
          </button>
          
          <button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 z-20 bg-black bg-opacity-50 hover:bg-opacity-75 text-white p-3 rounded-full transition-all duration-300 hover:scale-110"
            aria-label="Next slide"
          >
            <ChevronRight size={24} />
          </button>
        </>
      )}

      {/* Play/Pause Button */}
      {autoPlay && memoizedSlides.length > 1 && (
        <button
          onClick={() => setIsPaused(prev => !prev)}
          className="absolute top-4 right-4 z-20 bg-black bg-opacity-50 hover:bg-opacity-75 text-white p-2 rounded-full transition-all duration-300"
          aria-label={isPaused ? "Play slideshow" : "Pause slideshow"}
        >
          {isPaused ? <Play size={20} /> : <Pause size={20} />}
        </button>
      )}

      {/* Navigation Dots */}
      {memoizedSlides.length > 1 && (
        <NavigationDots
          slides={memoizedSlides}
          currentSlide={currentSlide}
          onDotClick={handleSlideChange}
        />
      )}

      {/* Slide Counter */}
      {memoizedSlides.length > 1 && (
        <div className="absolute top-4 left-4 z-20 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
          {currentSlide + 1} / {memoizedSlides.length}
        </div>
      )}
    </section>
  );
};

export default React.memo(OptimizedHeroSection); 