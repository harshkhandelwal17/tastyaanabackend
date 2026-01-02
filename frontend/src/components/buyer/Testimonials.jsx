import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { testimonials } from "./sweetData";
import { ChevronLeft, ChevronRight, CheckCircle } from "lucide-react";
import { Heart, Star } from "lucide-react";
import React from "react";

const TestimonialsSection = () => {
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="py-8 sm:py-12 md:py-16 lg:py-24 bg-gradient-to-tr from-white via-yellow-50 to-pink-50 relative overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-8 sm:mb-10 md:mb-12 lg:mb-20">
          <div className="inline-flex items-center gap-2 md:gap-3 bg-yellow-100 text-yellow-600 rounded-full px-3 sm:px-4 lg:px-6 py-2 lg:py-3 text-xs sm:text-sm lg:text-base font-bold mb-4 sm:mb-6">
            <Heart className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 text-red-500" />
            <span>Customer Love Stories</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-black text-gray-800 mb-4 sm:mb-6 lg:mb-8 leading-tight">
            What Our Tastyaana Family Says
          </h2>
        </div>

        {/* Testimonials */}
        <div className="max-w-6xl mx-auto">
          <div className="relative bg-white rounded-2xl sm:rounded-3xl lg:rounded-[3rem] shadow-xl lg:shadow-2xl p-4 sm:p-6 md:p-8 lg:p-16 overflow-hidden border border-gray-100">
            {/* Background quote mark */}
            <div className="absolute top-0 right-0 text-6xl sm:text-7xl md:text-8xl lg:text-[12rem] text-orange-100 opacity-20 font-black leading-none pointer-events-none">
              "
            </div>

            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className={`transition-all duration-700 ${
                  index === currentTestimonial
                    ? "opacity-100 transform translate-x-0"
                    : "opacity-0 transform translate-x-full absolute inset-0 p-4 sm:p-6 md:p-8 lg:p-16"
                }`}
              >
                {/* Testimonial content */}
                <div className="flex flex-col sm:flex-row items-center sm:items-start lg:items-center gap-4 sm:gap-6 lg:gap-8 mb-6 sm:mb-8 lg:mb-12">
                  <div className="relative flex-shrink-0">
                    <img
                      src={testimonial.avatar}
                      alt={testimonial.name}
                      className="w-16 h-16 sm:w-18 sm:h-18 md:w-20 md:h-20 lg:w-24 lg:h-24 rounded-full shadow-lg lg:shadow-xl border-2 sm:border-3 lg:border-4 border-orange-200"
                    />
                    <div className="absolute -bottom-1 -right-1 sm:-bottom-2 sm:-right-2 bg-green-500 text-white p-1 sm:p-1.5 lg:p-2 rounded-full">
                      <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5" />
                    </div>
                  </div>
                  <div className="flex-1 text-center sm:text-left">
                    <h4 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-black text-gray-800 mb-1">
                      {testimonial.name}
                    </h4>
                    <p className="text-orange-600 font-bold text-sm sm:text-base lg:text-lg mb-1">
                      {testimonial.relation}
                    </p>
                  </div>
                </div>

                {/* Rating */}
                <div className="flex items-center justify-center sm:justify-start gap-1 sm:gap-2 md:gap-3 lg:gap-4 mb-6 sm:mb-8 lg:mb-12">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 lg:w-8 lg:h-8 ${
                        i < testimonial.rating
                          ? "text-yellow-500 fill-current"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>

                {/* Review text */}
                <blockquote className="text-base sm:text-lg md:text-xl lg:text-3xl text-gray-700 italic leading-relaxed lg:leading-relaxed font-medium text-center sm:text-left">
                  "{testimonial.review}"
                </blockquote>
              </div>
            ))}

            {/* Navigation controls */}
            <div className="flex items-center justify-center gap-4 sm:gap-6 mt-8 sm:mt-10 md:mt-12 lg:mt-16">
              <button
                onClick={() =>
                  setCurrentTestimonial(
                    (prev) =>
                      (prev - 1 + testimonials.length) % testimonials.length
                  )
                }
                className="p-2 sm:p-3 lg:p-4 bg-orange-100 text-orange-600 rounded-full hover:bg-orange-200 transition-all duration-300 hover:scale-110 active:scale-95"
                aria-label="Previous testimonial"
              >
                <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
              </button>

              <div className="flex gap-1.5 sm:gap-2 lg:gap-3">
                {testimonials.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentTestimonial(idx)}
                    className={`w-2.5 h-2.5 sm:w-3 sm:h-3 lg:w-4 lg:h-4 rounded-full transition-all duration-300 ${
                      idx === currentTestimonial
                        ? "bg-orange-500 scale-125"
                        : "bg-gray-300 hover:bg-gray-400"
                    }`}
                    aria-label={`Go to testimonial ${idx + 1}`}
                  />
                ))}
              </div>

              <button
                onClick={() =>
                  setCurrentTestimonial(
                    (prev) => (prev + 1) % testimonials.length
                  )
                }
                className="p-2 sm:p-3 lg:p-4 bg-orange-100 text-orange-600 rounded-full hover:bg-orange-200 transition-all duration-300 hover:scale-110 active:scale-95"
                aria-label="Next testimonial"
              >
                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default React.memo(TestimonialsSection);
