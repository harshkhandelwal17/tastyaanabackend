// import React, { useState } from 'react';
// import { ChevronLeft, ChevronRight } from 'lucide-react';

// export default function FestiveCalendar() {
//   const [currentIndex, setCurrentIndex] = useState(0);

//   const festivals = [
//   {
//     date: 2,
//     name: 'Gandhi Jayanti',
//     image: '🕊️',
//     displayDate: '02 OCT'
//   },
//   {
//     date: 2,
//     name: 'Dussehra',
//     image: '🏹',
//     displayDate: '02 OCT'
//   },
//   {
//     date: 10,
//     name: 'Karwa Chauth',
//     image: '🌙',
//     displayDate: '10 OCT'
//   },
//   {
//     date: 18,
//     name: 'Dhanteras',
//     image: '🪙',
//     displayDate: '18 OCT'
//   },
//   {
//     date: 19,
//     name: 'Choti Diwali',
//     image: '🪔',
//     displayDate: '19 OCT'
//   },
//   {
//     date: 20,
//     name: 'Diwali',
//     image: '✨',
//     displayDate: '20 OCT'
//   },
//   {
//     date: 22,
//     name: 'Govardhan Puja',
//     image: '🎋',
//     displayDate: '22 OCT'
//   },
//   {
//     date: 23,
//     name: 'Bhai Dooj',
//     image: '👫',
//     displayDate: '23 OCT'
//   }
// ];

//   const getVisibleCards = () => {
//     if (typeof window === 'undefined') return 4;
//     if (window.innerWidth < 640) return 2;
//     if (window.innerWidth < 1024) return 3;
//     return 4;
//   };

//   const [visibleCards, setVisibleCards] = useState(getVisibleCards());

//   React.useEffect(() => {
//     const handleResize = () => {
//       setVisibleCards(getVisibleCards());
//     };
//     window.addEventListener('resize', handleResize);
//     return () => window.removeEventListener('resize', handleResize);
//   }, []);

//   const nextSlide = () => {
//     if (currentIndex < festivals.length - visibleCards) {
//       setCurrentIndex(currentIndex + 1);
//     }
//   };

//   const prevSlide = () => {
//     if (currentIndex > 0) {
//       setCurrentIndex(currentIndex - 1);
//     }
//   };

//   return (
//     <div className="relative bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-900 p-3 md:p-6 overflow-hidden">
//       {/* Animated background pattern */}
//       <div className="absolute inset-0 opacity-10">
//         <div className="absolute top-10 left-10 w-40 h-40 bg-yellow-400 rounded-full blur-3xl animate-pulse"></div>
//         <div className="absolute bottom-20 right-20 w-60 h-60 bg-amber-400 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
//         <div className="absolute top-1/2 left-1/3 w-32 h-32 bg-green-400 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
//       </div>

//       {/* Floating decorative elements */}
//       <div className="absolute top-10 left-6 text-2xl md:text-6xl opacity-30 animate-float">🌿</div>
//       <div className="absolute top-16 right-10 text-xl md:text-5xl opacity-40 animate-float" style={{animationDelay: '1s'}}>✨</div>
//       <div className="absolute bottom-16 left-12 text-xl md:text-5xl opacity-30 animate-float" style={{animationDelay: '2s'}}>🪔</div>
//       <div className="absolute bottom-10 right-16 text-2xl md:text-6xl opacity-40 animate-float" style={{animationDelay: '1.5s'}}>🌺</div>

//       <div className="w-full max-w-6xl mx-auto relative z-10">
//         {/* Decorative Header */}
//         <div className="relative mb-4 md:mb-8">
//           {/* Artistic light strings */}
//           <div className="absolute top-0 left-0 right-0 flex justify-between -mt-4 px-4">
//             {[...Array(12)].map((_, i) => (
//               <div key={i} className="flex flex-col items-center">
//                 <div className="w-px h-4 md:h-10 bg-gradient-to-b from-yellow-400 to-transparent"></div>
//                 <div
//                   className={`w-2 h-2 md:w-4 md:h-4 rounded-full shadow-lg ${
//                     i % 3 === 0 ? 'bg-yellow-400' : i % 3 === 1 ? 'bg-amber-400' : 'bg-orange-400'
//                   }`}
//                   style={{
//                     animation: `twinkle ${1.5 + Math.random()}s ease-in-out infinite`,
//                     animationDelay: `${Math.random() * 2}s`,
//                     boxShadow: '0 0 20px currentColor'
//                   }}
//                 ></div>
//               </div>
//             ))}
//           </div>

//           {/* Ornate corner decorations */}
//           <div className="absolute -left-2 md:left-0 top-8 text-3xl md:text-7xl opacity-60 transform -rotate-12">
//             🌸
//           </div>
//           <div className="absolute -right-2 md:right-0 top-8 text-3xl md:text-7xl opacity-60 transform rotate-12">
//             🌸
//           </div>

//           {/* Artistic Header with layered effect */}
//           <div className="text-center py-3 md:py-6 relative">
//             <div className="relative inline-block">
//               {/* Shadow layers for depth */}
//               <div className="absolute inset-0 bg-gradient-to-r from-yellow-600/30 via-amber-600/30 to-yellow-600/30 blur-xl transform scale-110"></div>

//               <div className="relative bg-gradient-to-r from-emerald-800/80 via-teal-700/80 to-emerald-800/80 px-6 md:px-16 py-3 md:py-6 rounded-3xl backdrop-blur-sm border-4 border-yellow-500/60 shadow-2xl">
//                 {/* Decorative corner elements */}
//                 <div className="absolute -top-3 -left-3 w-6 h-6 border-t-4 border-l-4 border-yellow-400 rounded-tl-lg"></div>
//                 <div className="absolute -top-3 -right-3 w-6 h-6 border-t-4 border-r-4 border-yellow-400 rounded-tr-lg"></div>
//                 <div className="absolute -bottom-3 -left-3 w-6 h-6 border-b-4 border-l-4 border-yellow-400 rounded-bl-lg"></div>
//                 <div className="absolute -bottom-3 -right-3 w-6 h-6 border-b-4 border-r-4 border-yellow-400 rounded-br-lg"></div>

//                 <div className="relative">
//                   <h1 className="text-yellow-100 text-xs md:text-xl tracking-widest mb-1 font-light" style={{textShadow: '2px 2px 4px rgba(0,0,0,0.3)'}}>
//                     LET THE
//                   </h1>
//                   <h2 className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-200 to-yellow-300 text-2xl md:text-6xl font-serif italic font-bold" style={{textShadow: '0 0 30px rgba(251,191,36,0.5)'}}>
//                     Festivities Begin
//                   </h2>
//                 </div>
//               </div>
//             </div>

//             {/* Artistic hanging decorations */}
//             <div className="absolute -bottom-2 left-1/4 flex items-center gap-1">
//               <div className="w-px h-4 md:h-12 bg-gradient-to-b from-yellow-600 to-transparent"></div>
//               <div className="text-xl md:text-5xl transform rotate-12 animate-swing">🌺</div>
//             </div>
//             <div className="absolute -bottom-2 right-1/4 flex items-center gap-1">
//               <div className="text-xl md:text-5xl transform -rotate-12 animate-swing" style={{animationDelay: '0.5s'}}>🌺</div>
//               <div className="w-px h-4 md:h-12 bg-gradient-to-b from-yellow-600 to-transparent"></div>
//             </div>
//           </div>
//         </div>

//         {/* Festival Slider */}
//         <div className="relative px-6 md:px-16 mb-4">
//           {/* Artistic Previous Button */}
//           <button
//             onClick={prevSlide}
//             disabled={currentIndex === 0}
//             className={`absolute -left-2 md:left-0 top-1/2 -translate-y-1/2 z-10 bg-gradient-to-br from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 rounded-full p-2 md:p-3 shadow-2xl transition-all border-2 border-yellow-300 ${
//               currentIndex === 0 ? 'opacity-30 cursor-not-allowed' : 'hover:scale-110 hover:rotate-12'
//             }`}
//             style={{boxShadow: '0 0 25px rgba(251,191,36,0.6)'}}
//           >
//             <ChevronLeft className="w-4 h-4 md:w-6 md:h-6 text-emerald-900" />
//           </button>

//           {/* Slider Container with artistic cards */}
//           <div className="overflow-hidden px-2 py-6 md:p-8">
//             <div
//               className="flex transition-transform duration-700 ease-out gap-3 md:gap-6"
//               style={{ transform: `translateX(-${currentIndex * (100 / visibleCards * 1.1)}%)` }}
//             >
//               {festivals.map((festival, index) => (
//                 <div
//                   key={index}
//                   className="flex-shrink-0"
//                   style={{ width: `calc(${100 / visibleCards}% - ${(visibleCards - 1) * (window.innerWidth >= 768 ? 24 : 12) / visibleCards}px)` }}
//                 >
//                   <div className="relative group">
//                     {/* Glow effect */}
//                     <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/20 to-amber-600/20 blur-xl group-hover:blur-2xl transition-all rounded-3xl transform group-hover:scale-110"></div>

//                     {/* Main card */}
//                     <div className="relative bg-gradient-to-br from-teal-700 via-emerald-700 to-green-700 rounded-2xl md:rounded-3xl p-3 md:p-5 border-2 border-yellow-500/70 shadow-2xl transform transition-all duration-500 hover:scale-105 hover:-rotate-2 aspect-square flex flex-col backdrop-blur-sm">
//                       {/* Artistic date badge */}
//                       <div className="absolute -top-3 -right-3 bg-gradient-to-br from-emerald-600 to-teal-700 text-white rounded-2xl px-2 md:px-3 py-1 md:py-2 shadow-xl border-2 border-yellow-400 transform rotate-12 group-hover:rotate-0 transition-transform">
//                         <div className="text-xs md:text-2xl font-bold leading-none">{festival.date}</div>
//                         <div className="text-[7px] md:text-xs font-semibold tracking-wider">OCT</div>
//                       </div>

//                       {/* Decorative pattern overlay */}
//                       <div className="absolute inset-0 opacity-10 rounded-2xl md:rounded-3xl" style={{
//                         backgroundImage: 'radial-gradient(circle, rgba(251,191,36,0.3) 1px, transparent 1px)',
//                         backgroundSize: '20px 20px'
//                       }}></div>

//                       {/* Festival Image with artistic frame */}
//                       <div className="relative bg-gradient-to-br from-yellow-400/30 to-amber-500/30 rounded-2xl md:rounded-3xl p-3 md:p-6 mb-2 md:mb-4 flex items-center justify-center border-2 border-yellow-300/60 flex-1 backdrop-blur-sm group-hover:border-yellow-300 transition-colors">
//                         <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-yellow-400/10 to-transparent rounded-2xl md:rounded-3xl"></div>
//                         <div className="relative text-2xl md:text-5xl filter drop-shadow-2xl transform group-hover:scale-110 transition-transform">
//                           {festival.image}
//                         </div>
//                       </div>

//                       {/* Festival Name with artistic typography */}
//                       <div className="relative bg-gradient-to-r from-transparent via-teal-900/50 to-transparent px-2 py-1 rounded-lg">
//                         <h3 className="text-yellow-100 text-center font-bold text-[10px] md:text-base leading-tight tracking-wide" style={{textShadow: '1px 1px 3px rgba(0,0,0,0.5)'}}>
//                           {festival.name}
//                         </h3>
//                       </div>

//                       {/* Corner ornaments */}
//                       <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-yellow-400/40 rounded-tl-lg"></div>
//                       <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-yellow-400/40 rounded-br-lg"></div>
//                     </div>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           </div>

//           {/* Artistic Next Button */}
//           <button
//             onClick={nextSlide}
//             disabled={currentIndex >= festivals.length - visibleCards}
//             className={`absolute -right-2 md:right-0 top-1/2 -translate-y-1/2 z-10 bg-gradient-to-br from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 rounded-full p-2 md:p-3 shadow-2xl transition-all border-2 border-yellow-300 ${
//               currentIndex >= festivals.length - visibleCards ? 'opacity-30 cursor-not-allowed' : 'hover:scale-110 hover:-rotate-12'
//             }`}
//             style={{boxShadow: '0 0 25px rgba(251,191,36,0.6)'}}
//           >
//             <ChevronRight className="w-4 h-4 md:w-6 md:h-6 text-emerald-900" />
//           </button>
//         </div>

//         {/* Artistic Slider Indicators */}
//         <div className="flex justify-center gap-2 md:gap-3 mb-4">
//           {Array.from({ length: Math.ceil(festivals.length - visibleCards + 1) }).map((_, index) => (
//             <button
//               key={index}
//               onClick={() => setCurrentIndex(index)}
//               className={`h-1.5 md:h-3 rounded-full transition-all duration-500 ${
//                 currentIndex === index
//                   ? 'bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-400 w-8 md:w-12 shadow-lg'
//                   : 'bg-yellow-700/50 w-1.5 md:w-3 hover:bg-yellow-600'
//               }`}
//               style={currentIndex === index ? {boxShadow: '0 0 15px rgba(251,191,36,0.8)'} : {}}
//             />
//           ))}
//         </div>

//         {/* Artistic Bottom Decoration */}
//         <div className="relative flex items-center justify-center gap-3 md:gap-8 mt-4 md:mt-6">
//           <div className="h-1 bg-gradient-to-r from-transparent via-yellow-500 to-yellow-600 flex-1 rounded-full shadow-lg" style={{boxShadow: '0 0 10px rgba(251,191,36,0.5)'}}></div>
//           <div className="relative">
//             <div className="absolute inset-0 bg-yellow-400 blur-xl animate-pulse"></div>
//             <div className="relative text-2xl md:text-5xl animate-float">🪷</div>
//           </div>
//           <div className="h-1 bg-gradient-to-r from-yellow-600 via-yellow-500 to-transparent flex-1 rounded-full shadow-lg" style={{boxShadow: '0 0 10px rgba(251,191,36,0.5)'}}></div>
//         </div>

//         {/* Artistic decorative flourishes */}
//         <div className="absolute bottom-2 md:bottom-4 left-2 md:left-8 text-2xl md:text-6xl opacity-40 transform -rotate-45 animate-float">
//           ➳
//         </div>
//         <div className="absolute bottom-2 md:bottom-4 right-2 md:right-8 text-2xl md:text-6xl opacity-40 transform rotate-45 scale-x-[-1] animate-float" style={{animationDelay: '1s'}}>
//           ➳
//         </div>
//       </div>

//       <style jsx>{`
//         @keyframes twinkle {
//           0%, 100% { opacity: 1; transform: scale(1); }
//           50% { opacity: 0.4; transform: scale(0.7); }
//         }

//         @keyframes float {
//           0%, 100% { transform: translateY(0px) rotate(0deg); }
//           50% { transform: translateY(-20px) rotate(5deg); }
//         }

//         @keyframes swing {
//           0%, 100% { transform: rotate(12deg); }
//           50% { transform: rotate(-12deg); }
//         }

//         .animate-float {
//           animation: float 4s ease-in-out infinite;
//         }

//         .animate-swing {
//           animation: swing 3s ease-in-out infinite;
//           transform-origin: top center;
//         }
//       `}</style>
//     </div>
//   );
// }

import React, { useCallback } from "react";
import { motion } from "framer-motion";
import { loadFull } from "tsparticles";
import { Particles } from "react-tsparticles";
import Lottie from "lottie-react";

// IMPORTANT: Adjust the import path if you place the JSON elsewhere
import diyaAnimation from "./diya.json";

const particlesOptions = {
  fpsLimit: 60,
  interactivity: {
    events: {
      onHover: { enable: true, mode: "repulse" },
      onClick: { enable: true, mode: "push" },
    },
    modes: {
      repulse: { distance: 120, duration: 0.8 },
      push: { quantity: 4 },
    },
  },
  particles: {
    number: { value: 22, density: { enable: true, area: 800 } },
    color: { value: ["#FFD166", "#FFB703", "#FF6B6B", "#FF9E6D"] },
    shape: { type: "circle" },
    opacity: {
      value: 0.9,
      random: { enable: true, minimumValue: 0.4 },
      anim: { enable: true, speed: 1.2, minimumValue: 0.3, sync: false },
    },
    size: { value: { min: 3, max: 8 }, random: true },
    move: {
      enable: true,
      speed: 1.2,
      direction: "none",
      outModes: { default: "bounce" },
    },
    twinkle: { particles: { enable: true, frequency: 0.12, opacity: 1 } },
  },
  detectRetina: true,
};

export default function FestivalBanner({
  title = "Festivities Begin",
  subtitle = "LET THE CELEBRATIONS",
  heroText = "Happy Diwali from Vishwakarma Coaching Institute",
  festivals = [
    {
      date: "10 OCT",
      name: "Karwa Chauth",
      emoji: "🪔",
      img: "https://res.cloudinary.com/dcha7gy9o/image/upload/v1759682633/karwa-chauth_r5kvdu.avif",
    },
    {
      date: "18 OCT",
      name: "Dhanteras",
      emoji: "💰",
      img: "https://res.cloudinary.com/dcha7gy9o/image/upload/v1759682633/dhanteras_iavx6i.avif",
    },
    {
      date: "20 OCT",
      name: "Diwali",
      emoji: "✨",
      img: "https://res.cloudinary.com/dcha7gy9o/image/upload/v1759682632/diwali_vrz61z.webp",
    },
    {
      date: "22 OCT",
      name: "Govardhan Puja",
      emoji: "⛰️",
      img: "https://res.cloudinary.com/dcha7gy9o/image/upload/v1759682633/govardhan-puja_pew0pj.jpg",
    },
  ],
}) {
  const particlesInit = useCallback(async (engine) => {
    await loadFull(engine);
  }, []);

  const cardVariants = {
    hidden: { opacity: 0, y: 40, scale: 0.95 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        delay: i * 0.1,
        duration: 0.6,
        ease: [0.25, 0.46, 0.45, 0.94],
      },
    }),
    hover: {
      scale: 1.06,
      y: -8,
      rotate: -1.5,
      transition: { duration: 0.3, ease: "easeOut" },
    },
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        duration: 0.8,
      },
    },
  };

  return (
    <section className="relative overflow-hidden">
      {/* Enhanced Particle layer */}
      <Particles
        id="festive-particles"
        init={particlesInit}
        options={particlesOptions}
        className="absolute inset-0 pointer-events-none"
      />

      {/* Additional gradient overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-br from-festiveMaroon/20 via-festiveRed/15 to-[#42040a]/30 z-0"></div>

      {/* Main content */}
      <div
        className="relative z-10 bg-gradient-to-br bg-gradient-to-r from-[#9d1124] via-[#9d1124] to-[#9d1124]
 text-white rounded-3xl p-6 md:p-10 lg:p-14 shadow-2xl border border-festiveGold/20"
      >
        <div className="mx-auto max-w-7xl">
          {/* Header Section */}
          <motion.div
            className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 md:gap-8"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
          >
            {/* Text Content */}
            <motion.div
              className="flex-1 space-y-4"
              variants={{
                hidden: { opacity: 0, x: -30 },
                visible: {
                  opacity: 1,
                  x: 0,
                  transition: { duration: 0.7, ease: "easeOut" },
                },
              }}
            >
              <div className="space-y-2">
                <p className="text-sm md:text-base text-festiveGold/90 tracking-widest font-medium uppercase">
                  {subtitle}
                </p>
                <h1 className="text-3xl md:text-6xl lg:text-7xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#ffdf91] via-[#ffc861] to-[#ffdf91] drop-shadow-[0_8px_40px_rgba(0,0,0,0.6)] leading-tight">
                  {title}
                </h1>
                <p className="text-lg md:text-xl text-white/90 font-light max-w-2xl leading-relaxed">
                  {heroText}
                </p>
              </div>

              {/* Decorative Elements */}
              <div className="flex items-center gap-4 pt-4">
                <div className="h-1 w-12 bg-gradient-to-r from-festiveGold to-transparent rounded-full"></div>
                <div className="flex gap-2">
                  {["🌸", "✨", "🎆", "🪷"].map((emoji, i) => (
                    <motion.div
                      key={i}
                      className="text-2xl opacity-40"
                      animate={{
                        y: [0, -8, 0],
                        rotate: [0, 5, 0],
                      }}
                      transition={{
                        duration: 3,
                        delay: i * 0.5,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    >
                      {emoji}
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Lottie Animation */}
            {/* <motion.div
              className="flex-shrink-0"
              variants={{
                hidden: { opacity: 0, scale: 0.8, rotate: -10 },
                visible: {
                  opacity: 1,
                  scale: 1,
                  rotate: 0,
                  transition: {
                    duration: 0.8,
                    ease: "easeOut",
                    delay: 0.3,
                  },
                },
              }}
            >
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-tr from-festiveGold/30 to-festiveGold/10 rounded-full blur-2xl animate-pulse"></div>
                <div className="relative w-28 h-28 md:w-36 md:h-36 rounded-full bg-gradient-to-tr from-[#ffecb3] to-[#ffd7a5] p-3 flex items-center justify-center shadow-2xl border border-festiveGold/30">
                  {diyaAnimation ? (
                    <Lottie
                      animationData={diyaAnimation}
                      loop
                      autoplay
                      className="drop-shadow-lg"
                    />
                  ) : (
                    <div className="text-4xl md:text-6xl drop-shadow-lg">
                      🪔
                    </div>
                  )}
                </div>
              </div>
            </motion.div> */}
          </motion.div>

          {/* Festival Cards Section */}
          <motion.div
            className="mt-10 md:mt-14"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={containerVariants}
          >
            <div className="flex gap-3 md:gap-5 overflow-x-auto scrollbar-hide pb-3 px-2 -mx-2">
              {festivals.map((festival, idx) => (
                <motion.div
                  key={festival.name}
                  className="min-w-[140px] md:min-w-[200px] flex-shrink-0"
                  variants={cardVariants}
                  custom={idx}
                  whileHover="hover"
                >
                  <div className="group relative rounded-xl p-3 md:p-5 bg-gradient-to-br from-white/10 via-white/5 to-white/0 border border-festiveGold/25 shadow-xl backdrop-blur-sm overflow-hidden">
                    {/* Background Glow Effect */}
                    <div className="absolute inset-0 bg-gradient-to-br from-festiveGold/5 via-transparent to-festiveGold/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                    {/* Date Badge */}
                    <div className="absolute top-1 right-1 bg-gradient-to-r from-red-500 to-red-600 text-white text-[10px] font-bold px-2 py-1 rounded-md shadow-md z-10">
                      {festival.date}
                    </div>

                    {/* Image Box - Fixed Frame */}
                    <div className="relative flex items-center justify-center h-20 md:h-24 mb-3 rounded-lg bg-gradient-to-br from-white/5 to-transparent border border-festiveGold/15 group-hover:border-festiveGold/30 transition-colors duration-300 overflow-hidden">
                      <motion.img
                        src={festival?.img}
                        alt={festival?.name || "festival"}
                        className="absolute inset-0 w-full h-full object-cover rounded-lg transition-transform duration-300 group-hover:scale-105"
                        whileHover={{ scale: 1.1, rotate: 2 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      />
                    </div>

                    {/* Festival Name */}
                    <div className="text-center relative z-10">
                      <div className="text-sm md:text-base font-semibold text-festiveGold drop-shadow-md truncate">
                        {festival.name}
                      </div>
                    </div>

                    {/* Corner Decorations */}
                    <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-festiveGold/50 rounded-tl-md"></div>
                    <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-festiveGold/50 rounded-br-md"></div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Bottom Decorative Element */}
          <motion.div
            className="mt-10 md:mt-12 flex items-center justify-center"
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <div className="flex items-center gap-6">
              <div className="h-1.5 w-20 bg-gradient-to-r from-transparent via-festiveGold to-transparent rounded-full shadow-lg"></div>
              <div className="relative">
                <div className="absolute inset-0 bg-festiveGold blur-xl opacity-40 rounded-full animate-pulse"></div>
                <motion.div
                  className="relative text-3xl md:text-5xl"
                  animate={{ rotate: [0, 10, 0] }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  🪷
                </motion.div>
              </div>
              <div className="h-1.5 w-20 bg-gradient-to-r from-transparent via-festiveGold to-transparent rounded-full shadow-lg"></div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
