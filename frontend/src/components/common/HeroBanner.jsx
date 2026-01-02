import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';

const HeroBanner = ({ 
  banners = [], 
  autoPlay = true, 
  autoPlayInterval = 5000,
  showDots = true,
  showArrows = false,
  className = ""
}) => {
  const [currentBanner, setCurrentBanner] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const navigate = useNavigate();

  // Auto-rotate banners
  useEffect(() => {
    if (!isPlaying || !autoPlay || banners.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % banners.length);
    }, autoPlayInterval);

    return () => clearInterval(timer);
  }, [banners.length, isPlaying, autoPlay, autoPlayInterval]);

  const goToSlide = (index) => {
    setCurrentBanner(index);
  };

  const nextSlide = () => {
    setCurrentBanner((prev) => (prev + 1) % banners.length);
  };

  const prevSlide = () => {
    setCurrentBanner((prev) => (prev - 1 + banners.length) % banners.length);
  };

  const handleCTAClick = (banner) => {
    if (banner.ctaLink) {
      navigate(banner.ctaLink);
    } else if (banner.route) {
      navigate(banner.route);
    }
  };

  if (!banners.length) return null;

  return (
    <section className={`px-4 mb-8 ${className}`}>
      <div 
        className="relative overflow-hidden rounded-3xl shadow-2xl"
        onMouseEnter={() => setIsPlaying(false)}
        onMouseLeave={() => setIsPlaying(autoPlay)}
      >
        <div 
          className="flex transition-transform duration-700 ease-in-out" 
          style={{ transform: `translateX(-${currentBanner * 100}%)` }}
        >
          {banners.map((banner, index) => (
            <div key={banner.id || index} className="w-full flex-shrink-0 relative">
              <div 
                className={`relative overflow-hidden ${
                  banner.bgImageUrl 
                    ? 'bg-cover bg-center bg-no-repeat min-h-[200px] sm:min-h-[250px] md:min-h-[300px]' 
                    : `bg-gradient-to-r ${banner.color || 'from-purple-600 to-indigo-600'}`
                } p-6 sm:p-8 md:p-12 text-white`}
                style={banner.bgImageUrl ? { 
                  backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url(${banner.bgImageUrl})` 
                } : {}}
              >
                {/* Background Pattern (only if no background image) */}
                {!banner.bgImageUrl && (
                  <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-0 left-0 w-96 h-96 bg-white/20 rounded-full -translate-x-48 -translate-y-48"></div>
                    <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/10 rounded-full translate-x-48 translate-y-48"></div>
                  </div>
                )}
                
                <div className="relative z-10 flex items-center justify-between h-full">
                  {/* Content */}
                  <div className="flex-1 max-w-2xl">
                    <div className="flex items-center gap-2 mb-4">
                      {banner.offer && (
                        <span className="inline-block bg-white/20 backdrop-blur px-4 py-2 rounded-full text-sm font-semibold">
                          {banner.offer}
                        </span>
                      )}
                      {banner.highlight && (
                        <span className="bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-xs font-bold">
                          {banner.highlight}
                        </span>
                      )}
                      {index === 0 && !banner.highlight && (
                        <span className="bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-xs font-bold">
                          TRENDING
                        </span>
                      )}
                    </div>
                    
                    <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 leading-tight">
                      {banner.title}
                    </h2>
                    
                    <p className="text-sm sm:text-base lg:text-lg text-white/90 mb-6 leading-relaxed max-w-lg">
                      {banner.subtitle || banner.description}
                    </p>
                    
                    {banner.cta && (
                      <button 
                        onClick={() => handleCTAClick(banner)}
                        className="bg-white text-gray-800 px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-bold hover:shadow-xl hover:scale-105 transition-all duration-300 flex items-center gap-2 text-sm sm:text-base"
                      >
                        {banner.cta}
                        <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                      </button>
                    )}
                  </div>
                  
                  {/* Image/Emoji */}
                  <div className="hidden sm:block absolute right-4 sm:right-8 top-1/2 -translate-y-1/2">
                    {banner.imageUrl ? (
                      <img
                        src={banner.imageUrl}
                        alt={banner.title}
                        className="w-32 h-32 sm:w-40 sm:h-40 md:w-56 md:h-56 lg:w-72 lg:h-72 object-contain opacity-90"
                        loading="lazy"
                      />
                    ) : banner.image ? (
                      <div className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl animate-pulse opacity-30">
                        {banner.image}
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Navigation Arrows */}
        {showArrows && banners.length > 1 && (
          <>
            <button
              onClick={prevSlide}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 backdrop-blur hover:bg-white/30 text-white p-3 rounded-full transition-all duration-200"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={nextSlide}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 backdrop-blur hover:bg-white/30 text-white p-3 rounded-full transition-all duration-200"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}
        
        {/* Dot Indicators */}
        {showDots && banners.length > 1 && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3">
            {banners.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`transition-all duration-300 rounded-full ${
                  index === currentBanner 
                    ? 'bg-white w-8 h-2' 
                    : 'bg-white/50 w-2 h-2 hover:bg-white/70'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default HeroBanner;