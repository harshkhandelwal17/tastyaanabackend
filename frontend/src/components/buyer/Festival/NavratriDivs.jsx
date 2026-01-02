import React from "react";
import navratri from "./navratri.mp4";

const FastingSpecials = () => {
  const specials = [
    {
      time: "20 min",
      title: "Vrat Meals",
      gradient: "from-orange-400 to-red-600",
      image: "🥘",
    },
    {
      time: "25 min",
      title: "Stay Energized for Garba",
      gradient: "from-red-600 to-red-800",
      image: "🥜",
    },
    {
      time: "20 mins",
      title: "Puja Samagri at Your Doorstep",
      gradient: "from-red-700 to-orange-600",
      image: "🪔",
    },
    {
      time: "25 min",
      title: "Sweeten Your Navratri",
      gradient: "from-orange-500 to-yellow-600",
      image: "🍯",
    },
  ];

  return (
    <div className="bg-gradient-to-b from-yellow-100 to-orange-100 py-8 px-4">
      {/* Video Section with proper responsive sizing */}
      <div className="max-w-4xl mx-auto mb-8">
        <div className="relative w-full" style={{ paddingBottom: "42.5%" }}>
          <video
            className="absolute top-0 left-0 w-full h-full rounded-2xl object-cover shadow-lg"
            autoPlay
            loop
            muted
            playsInline
          >
            <source src={navratri} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>
      </div>

      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {specials.map((special, index) => (
            <div
              key={index}
              className={`relative aspect-square rounded-2xl bg-gradient-to-br ${special.gradient} p-3 sm:p-4 lg:p-6 shadow-lg overflow-hidden`}
            >
              {/* Decorative pattern overlay */}
              <div className="absolute inset-0 opacity-10">
                <div
                  className="w-full h-full bg-repeat"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.3'%3E%3Cpath d='M30 30c0-11.046-8.954-20-20-20s-20 8.954-20 20 8.954 20 20 20 20-8.954 20-20zm0 0c0 11.046 8.954 20 20 20s20-8.954 20-20-8.954-20-20-20-20 8.954-20 20z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                  }}
                ></div>
              </div>

              {/* Time badge - More responsive sizing */}
              <div className="relative z-10 inline-block bg-black bg-opacity-30 text-white px-2 py-1 rounded-full text-xs sm:text-xs md:text-sm font-medium mb-1 sm:mb-2 md:mb-3">
                {special.time}
              </div>

              {/* Title - Better responsive text sizing and spacing */}
              <h3 className="relative z-10 text-white text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl font-bold leading-tight mb-2 sm:mb-3 md:mb-4 lg:mb-6">
                {special.title}
              </h3>

              {/* Food illustration area - More responsive emoji sizing */}
              <div className="relative z-10 flex-1 flex items-center justify-center mb-2 sm:mb-3 md:mb-4">
                <div className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl">
                  {special.image}
                </div>
              </div>

              {/* Bottom decorative elements - Responsive sizing and positioning */}
              <div className="absolute bottom-1 sm:bottom-2 md:bottom-3 lg:bottom-4 left-2 sm:left-3 md:left-4 lg:left-6 right-2 sm:right-3 md:right-4 lg:right-6 flex justify-between items-center">
                <div className="w-2 h-2 sm:w-3 sm:h-3 md:w-4 md:h-4 lg:w-6 lg:h-6 xl:w-8 xl:h-8 bg-yellow-400 rounded-full opacity-60 animate-pulse"></div>
                <div className="text-base sm:text-lg md:text-xl lg:text-2xl">
                  🪔
                </div>
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 md:w-3 md:h-3 lg:w-5 lg:h-5 xl:w-6 xl:h-6 bg-orange-300 rounded-full opacity-40"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FastingSpecials;
