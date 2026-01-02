// import React, { useState, useEffect } from 'react';
// import { motion, AnimatePresence } from 'framer-motion';

// // Sample data for the sweets
// const sweetsData = [
//   {
//     id: 1,
//     name: 'Gujiya',
//     image: '/assets/gujiya1.png',
//     description: 'A delicious sweet dumpling filled with khoya, nuts, and cardamom, traditionally made during festivals.',
//     color: 'from-amber-600'
//   },
//   {
//     id: 2,
//     name: 'Shakkarpare',
//     image: '/assets/shakkarpare1.png',
//     description: 'Crispy, diamond-shaped sweet treats coated with sugar syrup, perfect with your evening chai.',
//     color: 'from-orange-500'
//   },
//   {
//     id: 3,
//     name: 'Laddoo',
//     image: '/assets/laddoo1.png',
//     description: 'Perfectly round sweet balls made with besan, ghee, and sugar, a traditional delight for all occasions.',
//     color: 'from-yellow-500'
//   }
// ];

// export default function SweetsHeroSection() {
//   const [currentIndex, setCurrentIndex] = useState(0);
//   const [isAutoPlaying, setIsAutoPlaying] = useState(true);

//   useEffect(() => {
//     let interval;
//     if (isAutoPlaying) {
//       interval = setInterval(() => {
//         setCurrentIndex((prevIndex) => (prevIndex + 1) % sweetsData.length);
//       }, 5000);
//     }

//     return () => clearInterval(interval);
//   }, [isAutoPlaying]);

//   const handleDotClick = (index) => {
//     setCurrentIndex(index);
//     setIsAutoPlaying(false);
//     // Resume auto-play after 10 seconds of inactivity
//     setTimeout(() => setIsAutoPlaying(true), 10000);
//   };

//   const handlePrevClick = () => {
//     setCurrentIndex((prevIndex) => (prevIndex - 1 + sweetsData.length) % sweetsData.length);
//     setIsAutoPlaying(false);
//     setTimeout(() => setIsAutoPlaying(true), 10000);
//   };

//   const handleNextClick = () => {
//     setCurrentIndex((prevIndex) => (prevIndex + 1) % sweetsData.length);
//     setIsAutoPlaying(false);
//     setTimeout(() => setIsAutoPlaying(true), 10000);
//   };

//   return (
//     <div className="relative top-0 left-0 w-full min-h-screen overflow-hidden bg-black z-0 py-12 md:py-20">
//       {/* Background Image with Gradient Overlay */}
//       <AnimatePresence mode="wait">
//         <motion.div
//           key={currentIndex}
//           className="absolute inset-0 w-full h-full"
//           initial={{ opacity: 0 }}
//           animate={{ opacity: 1 }}
//           exit={{ opacity: 0 }}
//           transition={{ duration: 0.7 }}
//         >
//           <div className={`absolute inset-0 bg-gradient-to-r ${sweetsData[currentIndex].color} to-transparent opacity-90`}></div>
//           <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black opacity-70"></div>
//           <motion.img
//             src={sweetsData[currentIndex].image}
//             alt={sweetsData[currentIndex].name}
//             className="w-full h-full object-cover opacity-30"
//             initial={{ scale: 1.1 }}
//             animate={{ scale: 1 }}
//             transition={{ duration: 8, ease: "easeOut" }}
//           />
//         </motion.div>
//       </AnimatePresence>

//       {/* Content */}
//       <div className="relative z-10 h-full flex items-center min-h-screen">
//         <div className="container mx-auto px-4 sm:px-6 lg:px-16 flex flex-col lg:flex-row items-center justify-between">
//           {/* Text Content */}
//           <motion.div
//             className="w-full lg:w-1/2 text-white pt-16 lg:pt-0 text-center lg:text-left"
//             initial={{ opacity: 0, x: -50 }}
//             animate={{ opacity: 1, x: 0 }}
//             transition={{ duration: 0.8, delay: 0.2 }}
//           >
//             <AnimatePresence mode="wait">
//               <motion.div
//                 key={currentIndex}
//                 initial={{ opacity: 0, y: 20 }}
//                 animate={{ opacity: 1, y: 0 }}
//                 exit={{ opacity: 0, y: -20 }}
//                 transition={{ duration: 0.5 }}
//                 className="space-y-4 md:space-y-6"
//               >
//                 <motion.h1
//                   className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold tracking-tight"
//                   initial={{ opacity: 0 }}
//                   animate={{ opacity: 1 }}
//                   transition={{ duration: 0.5, delay: 0.3 }}
//                 >
//                   {sweetsData[currentIndex].name}
//                 </motion.h1>
//                 <motion.p
//                   className="text-sm sm:text-base md:text-lg lg:text-xl max-w-md mx-auto lg:mx-0 leading-relaxed"
//                   initial={{ opacity: 0 }}
//                   animate={{ opacity: 1 }}
//                   transition={{ duration: 0.5, delay: 0.5 }}
//                 >
//                   {sweetsData[currentIndex].description}
//                 </motion.p>
//                 <motion.div
//                   className="pt-4 md:pt-6 flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start"
//                   initial={{ opacity: 0 }}
//                   animate={{ opacity: 1 }}
//                   transition={{ duration: 0.5, delay: 0.7 }}
//                 >
//                   <button className="bg-white text-black font-semibold px-4 py-2 sm:px-6 sm:py-3 rounded-md hover:bg-opacity-90 transition duration-300 text-sm sm:text-base">
//                     Order Now
//                   </button>
//                   <button className="border border-white text-white font-semibold px-4 py-2 sm:px-6 sm:py-3 rounded-md hover:bg-white hover:bg-opacity-20 transition duration-300 text-sm sm:text-base">
//                     Learn More
//                   </button>
//                 </motion.div>
//               </motion.div>
//             </AnimatePresence>
//           </motion.div>

//           {/* Image */}
//           <motion.div
//             className="w-full lg:w-1/2 mt-8 md:mt-16 lg:mt-0 flex justify-center"
//             initial={{ opacity: 0, scale: 0.9 }}
//             animate={{ opacity: 1, scale: 1 }}
//             transition={{ duration: 0.8 }}
//           >
//             <AnimatePresence mode="wait">
//               <motion.div
//                 key={currentIndex}
//                 initial={{ opacity: 0, y: 30, rotate: -5 }}
//                 animate={{ opacity: 1, y: 0, rotate: 0 }}
//                 exit={{ opacity: 0, y: -30, rotate: 5 }}
//                 transition={{ duration: 0.7 }}
//                 className="relative"
//               >
//                 <motion.img
//                   src={sweetsData[currentIndex].image}
//                   alt={sweetsData[currentIndex].name}
//                   className="max-h-[250px] sm:max-h-[350px] md:max-h-[400px] lg:max-h-[500px] object-contain drop-shadow-2xl"
//                   animate={{ y: [0, -10, 0] }}
//                   transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
//                 />
//               </motion.div>
//             </AnimatePresence>
//           </motion.div>
//         </div>
//       </div>

//       {/* Navigation */}
//       <div className="absolute bottom-6 md:bottom-10 left-0 right-0 z-20 flex flex-col items-center">
//         {/* Dots */}
//         <div className="flex space-x-2 mb-4 md:mb-6">
//           {sweetsData.map((_, index) => (
//             <button
//               key={index}
//               onClick={() => handleDotClick(index)}
//               className={`w-2.5 h-2.5 md:w-3 md:h-3 rounded-full transition-all duration-300 ${
//                 currentIndex === index ? 'bg-white scale-125' : 'bg-gray-400 bg-opacity-50'
//               }`}
//               aria-label={`Go to slide ${index + 1}`}
//             />
//           ))}
//         </div>

//         {/* Prev/Next Buttons */}
//         <div className="flex items-center space-x-3 md:space-x-4">
//           <button
//             onClick={handlePrevClick}
//             className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-black bg-opacity-40 flex items-center justify-center hover:bg-opacity-60 transition duration-300"
//             aria-label="Previous slide"
//           >
//             <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-6 md:w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
//             </svg>
//           </button>
//           <button
//             onClick={handleNextClick}
//             className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-black bg-opacity-40 flex items-center justify-center hover:bg-opacity-60 transition duration-300"
//             aria-label="Next slide"
//           >
//             <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-6 md:w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
//             </svg>
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Sample data for the sweets
const sweetsData = [
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

export default function SweetsHeroSection() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  useEffect(() => {
    let interval;
    if (isAutoPlaying) {
      interval = setInterval(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % sweetsData.length);
      }, 5000);
    }

    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const handleDotClick = (index) => {
    setCurrentIndex(index);
    setIsAutoPlaying(false);
    // Resume auto-play after 10 seconds of inactivity
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const handlePrevClick = () => {
    setCurrentIndex(
      (prevIndex) => (prevIndex - 1 + sweetsData.length) % sweetsData.length
    );
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const handleNextClick = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % sweetsData.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const handleOrderNow = () => {
    // Instead of navigate, use window.location or just console.log
    console.log("Order Now clicked - would navigate to /products");
    // Alternatively: window.location.href = "/products";
  };

  return (
    <div className="relative w-full sm:h-[70vh] lg:h-[70vh] overflow-hidden bg-black z-0 py-4 sm:py-6 md:py-8">
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
            className={`absolute inset-0 bg-gradient-to-r ${sweetsData[currentIndex].color} to-transparent opacity-90`}
          ></div>
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black opacity-70"></div>
          <motion.img
            src={sweetsData[currentIndex].image}
            alt={sweetsData[currentIndex].name}
            className="w-full h-full object-cover opacity-30"
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            transition={{ duration: 8, ease: "easeOut" }}
          />
        </motion.div>
      </AnimatePresence>

      {/* Content */}
      <div className="relative z-10 h-full flex items-center">
        <div className="container mx-auto px-3 sm:px-4 lg:px-8 flex flex-row items-center justify-between">
          {/* Text Content */}
          <motion.div
            className="w-3/5 text-white text-left"
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
                className="space-y-1.5 sm:space-y-2 md:space-y-3"
              >
                <motion.h1
                  className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold tracking-tight leading-tight"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                >
                  {sweetsData[currentIndex].name}
                </motion.h1>
                <motion.p
                  className="text-xs sm:text-sm md:text-base max-w-xs sm:max-w-sm md:max-w-md leading-relaxed line-clamp-3 sm:line-clamp-none"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                >
                  {sweetsData[currentIndex].description}
                </motion.p>
                <motion.div
                  className="pt-2 sm:pt-3 md:pt-4 flex flex-row gap-2 justify-start"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.7 }}
                >
                  <button
                    onClick={handleOrderNow}
                    className="bg-white text-black font-semibold px-3 py-1.5 sm:px-4 sm:py-2 rounded-md hover:bg-opacity-90 transition duration-300 text-xs sm:text-sm"
                  >
                    Order Now
                  </button>
                </motion.div>
              </motion.div>
            </AnimatePresence>
          </motion.div>

          {/* Image - Always on right side */}
          <motion.div
            className="w-2/5 flex justify-end"
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
                  src={sweetsData[currentIndex].image}
                  alt={sweetsData[currentIndex].name}
                  className="max-h-[100px] sm:max-h-[150px] md:max-h-[200px] lg:max-h-[250px] xl:max-h-[300px] object-contain drop-shadow-2xl"
                  animate={{ y: [0, -3, 0] }}
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
      <div className="absolute bottom-3 sm:bottom-5 md:bottom-8 left-0 right-0 z-20 flex flex-col items-center">
        {/* Dots */}
        <div className="flex space-x-1.5 sm:space-x-2 mb-1.5 sm:mb-2">
          {sweetsData.map((_, index) => (
            <button
              key={index}
              onClick={() => handleDotClick(index)}
              className={`w-1.5 h-1.5 sm:w-2 sm:h-2 md:w-2.5 md:h-2.5 rounded-full transition-all duration-300 ${
                currentIndex === index
                  ? "bg-white scale-125"
                  : "bg-gray-400 bg-opacity-50"
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>

        {/* Prev/Next Buttons */}
        <div className="flex items-center space-x-2 md:space-x-3">
          <button
            onClick={handlePrevClick}
            className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 rounded-full bg-black bg-opacity-40 flex items-center justify-center hover:bg-opacity-60 transition duration-300"
            aria-label="Previous slide"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-4 md:w-4 text-white"
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
            className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 rounded-full bg-black bg-opacity-40 flex items-center justify-center hover:bg-opacity-60 transition duration-300"
            aria-label="Next slide"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-4 md:w-4 text-white"
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
        </div>
      </div>
    </div>
  );
}
