import React from "react";
import { Link } from "react-router-dom";
const navratri = `https://res.cloudinary.com/dcha7gy9o/video/upload/vc_h264:baseline/v1759019501/navratri_acpykt.mp4
`;
const NavratriBanner = () => {
  const specials = [
    {
      title: "Falhar",
      time: "25 min",
      icon: "🥘",
      link: "/category1/vratmeal",
      gradient:
        "bg-[linear-gradient(20deg,#e3bbaf_0%,#c75757_46%,#edd153_100%)]",
    },
    {
      title: "Free Prasad",
      time: "",
      icon: "🪔",
      link: "/bhandara",
      gradient: "from-yellow-400 via-amber-500 to-orange-400",
    },
    {
      title: "Garba Passes",
      time: "Coming soon",
      icon: "🥜",
      link: "/navratri?category=passes",
      gradient: "from-pink-400 via-rose-400 to-fuchsia-300",
    },
    {
      title: "Sweeten Your Navratri",
      time: "25 min",
      icon: "🍯",
      link: "/category1/sweets",
      gradient:
        "bg-[linear-gradient(150deg,#c93434_0%,#c75762_46%,#ed5384_100%)]",
    },
  ];

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-orange-50 via-pink-50 to-yellow-50 py-4 lg:py-8">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        {/* Floating Diyas */}
        <div className="absolute top-10 left-10 animate-bounce delay-1000">
          <span className="text-2xl">🪔</span>
        </div>
        <div className="absolute top-20 right-16 animate-pulse delay-2000">
          <span className="text-xl text-orange-400">✨</span>
        </div>
        <div className="absolute bottom-20 left-20 animate-bounce delay-500">
          <span className="text-lg">🌸</span>
        </div>
        <div className="absolute bottom-32 right-12 animate-pulse delay-1500">
          <span className="text-2xl text-pink-400">🕉️</span>
        </div>

        {/* Rangoli Pattern */}
        <div className="absolute top-1/2 left-4 w-8 h-8 border-2 border-orange-300/30 rounded-full animate-spin-slow"></div>
        <div className="absolute top-1/3 right-8 w-6 h-6 border-2 border-pink-300/30 rounded-full animate-spin-reverse"></div>

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,165,0,0.15),transparent_70%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(255,192,203,0.1),transparent_50%)]"></div>
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 lg:px-8">
        {/* Header with Animation */}
        <div className="text-center mb-4 lg:mb-8 animate-fade-in">
          <h2 className="text-2xl lg:text-5xl font-extrabold bg-clip-text bg-gradient-to-r from-orange-600 via-pink-600 to-red-600 animate-shimmer">
            🌺 Navratri Specials 🌺
          </h2>
          <div className="flex justify-center items-center mt-2 gap-2 animate-bounce-gentle">
            <span className="text-orange-500">🪔</span>
            <p className="text-gray-700 text-sm lg:text-lg font-medium">
              Divine flavors & festive essentials delivered fast!
            </p>
            <span className="text-pink-500">🪔</span>
          </div>
        </div>

        {/* Video with Enhanced Styling */}
        <div className="rounded-3xl overflow-hidden shadow-2xl border-gradient-to-r from-orange-200 to-pink-200 mb-6 lg:mb-10 animate-slide-up">
          <div className="relative w-full pb-[40%] lg:pb-[35%]">
            <video
              className="absolute top-0 left-0 w-full h-full object-cover fix-video"
              autoPlay
              loop
              muted
              playsInline
              poster="https://res.cloudinary.com/dcha7gy9o/image/upload/v1759019501/navratri-poster.jpg"
            >
              <source src={navratri} type="video/mp4" />
              {/* <source
                src="https://res.cloudinary.com/dcha7gy9o/video/upload/vc_h264/v1759019501/navratri_acpykt.mp4"
                type="video/webm"
              /> */}
              Your browser does not support the video tag.
            </video>
          </div>
        </div>

        {/* Responsive Columns with Staggered Animation */}
        <div className="columns-2 lg:columns-4 gap-3 lg:gap-6 place-items-center">
          {specials.map((item, i) => (
            <Link
              key={i}
              to={item.link}
              className={`group relative overflow-hidden rounded-3xl bg-gradient-to-br ${item.gradient} text-white shadow-lg hover:shadow-2xl transform hover:-translate-y-2 hover:scale-105 transition-all duration-500 p-4 lg:p-6 animate-card-entrance block mb-3 lg:mb-6 break-inside-avoid`}
              style={{
                animationDelay: `${i * 200}ms`,
              }}
            >
              {/* Decorative Border */}
              <div className="absolute inset-0 rounded-3xl border-2 border-white/20 group-hover:border-white/40 transition-all duration-300"></div>

              {/* Sparkle Effect */}
              <div className="absolute top-2 right-2 w-2 h-2 bg-white/60 rounded-full animate-sparkle"></div>
              <div className="absolute top-4 right-6 w-1 h-1 bg-yellow-200 rounded-full animate-sparkle delay-500"></div>

              {/* Card Content */}
              <div className="relative z-10 h-40">
                <div>
                  {/* Time Badge with Indian Style */}
                  <div className="inline-block bg-black/30 backdrop-blur-sm rounded-xl px-3 py-1.5 text-xs lg:text-sm font-bold mb-3 border border-white/20 animate-pulse-gentle">
                    ⚡ {item.time}
                  </div>

                  {/* Title */}
                  <div
                    className="text-sm lg:text-lg font-bold leading-tight mb-2 
                group-hover:text-yellow-100 transition-colors duration-300 text-center"
                  >
                    {item.title}
                  </div>

                  {/* Order Button */}
                  <div className="mt-4 mb-12">
                    <span className="inline-flex items-center bg-white/20 backdrop-blur-sm px-3 lg:px-4 py-2 rounded-full text-xs lg:text-sm font-semibold border border-white/30 group-hover:bg-white/30 group-hover:scale-110 transition-all duration-300">
                      <span className="text-2xl animate-bounce delay-200">
                        🪔
                      </span>
                      Order Now
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="ml-2 w-3 h-3 lg:w-4 lg:h-4 group-hover:translate-x-1 transition-transform duration-300"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M14 5l7 7m0 0l-7 7m7-7H3"
                        />
                      </svg>
                    </span>
                  </div>
                </div>
                <div className="flex justify-center mt-8 space-x-4 animate-fade-in delay-1000">
                  <span className="text-2xl animate-bounce delay-200">🌺</span>
                </div>
                <div className="flex justify-center mt-8 space-x-4 animate-fade-in delay-1000">
                  <span className="text-2xl animate-bounce delay-200">🌺</span>
                </div>
                {/* Icon with Animation */}
                {/* <div className="absolute bottom-3 lg:bottom-4 right-3 lg:right-4 bg-white/25 backdrop-blur-sm rounded-full p-2 lg:p-3 group-hover:rotate-12 group-hover:scale-110 transition-all duration-300 border border-white/20">
                  <span className="text-lg lg:text-2xl animate-bounce-slow">
                    {item.icon}
                  </span>
                </div> */}
              </div>

              {/* Hover Glow Effect */}
              <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 bg-gradient-to-br from-white/10 to-transparent transition-opacity duration-500 pointer-events-none"></div>
            </Link>
          ))}
        </div>

        {/* Bottom Decoration */}
        <div className="flex justify-center mt-8 space-x-4 animate-fade-in delay-1000">
          <span className="text-2xl animate-bounce delay-200">🌺</span>
          <span className="text-xl animate-pulse delay-400">✨</span>
          <span className="text-2xl animate-bounce delay-600">🪔</span>
          <span className="text-xl animate-pulse delay-800">✨</span>
          <span className="text-2xl animate-bounce delay-1000">🌺</span>
        </div>
      </div>

      <style jsx>{`
        @layer utilities {
          .fix-video {
            transform: none !important;
            will-change: auto !important;
            backface-visibility: hidden;
            -webkit-transform: translateZ(0);
          }
        }

        @keyframes shimmer {
          0%,
          100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
        @keyframes sparkle {
          0%,
          100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.3;
            transform: scale(1.5);
          }
        }
        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        @keyframes spin-reverse {
          from {
            transform: rotate(360deg);
          }
          to {
            transform: rotate(0deg);
          }
        }
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(40px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes card-entrance {
          from {
            opacity: 0;
            transform: translateY(30px) scale(0.9);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @keyframes bounce-gentle {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-5px);
          }
        }
        @keyframes bounce-slow {
          0%,
          100% {
            transform: translateY(0) rotate(0deg);
          }
          50% {
            transform: translateY(-3px) rotate(5deg);
          }
        }
        @keyframes pulse-gentle {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.8;
          }
        }

        .animate-shimmer {
          animation: shimmer 3s ease-in-out infinite;
        }
        .animate-sparkle {
          animation: sparkle 2s ease-in-out infinite;
        }
        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }
        .animate-spin-reverse {
          animation: spin-reverse 6s linear infinite;
        }
        .animate-fade-in {
          animation: fade-in 0.8s ease-out;
        }
        .animate-slide-up {
          animation: slide-up 0.8s ease-out 0.2s both;
        }
        .animate-card-entrance {
          animation: card-entrance 0.6s ease-out both;
        }
        .animate-bounce-gentle {
          animation: bounce-gentle 3s ease-in-out infinite;
        }
        .animate-bounce-slow {
          animation: bounce-slow 4s ease-in-out infinite;
        }
        .animate-pulse-gentle {
          animation: pulse-gentle 2s ease-in-out infinite;
        }
      `}</style>
    </section>
  );
};

export default NavratriBanner;
