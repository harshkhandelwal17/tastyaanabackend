import { motion } from "framer-motion";
import { Gift, ShoppingCart, Cookie, Phone, ChefHat } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Sparkles, Heart } from "lucide-react";
import React from "react";
const CTASection = ({ onNavigate }) => {
  const navigate = useNavigate();
 
  return (
    <section className="py-16 lg:py-24 bg-gradient-to-r from-orange-600 via-red-600 to-pink-600 text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-black/30"></div>

      {/* Background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-10 left-10 w-40 h-40 bg-yellow-400/10 rounded-full animate-float blur-2xl"></div>
        <div className="absolute bottom-10 right-10 w-32 h-32 bg-pink-400/10 rounded-full animate-float-reverse blur-2xl"></div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        <div className="max-w-5xl mx-auto">
          {/* Offer badge */}
          <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-full px-4 lg:px-6 py-2 lg:py-3 text-sm lg:text-base font-bold mb-8 lg:mb-12 border border-white/30">
            <Gift className="w-4 h-4 lg:w-5 lg:h-5 text-yellow-300" />
            <span>Limited Time Festival Offer</span>
            <Sparkles className="w-4 h-4 lg:w-5 lg:h-5 text-yellow-300" />
          </div>

          {/* Main heading */}
          <h2 className="text-4xl sm:text-5xl lg:text-7xl font-black mb-6 lg:mb-8">
            Ready for Some Sweet Magic? 🍯
          </h2>

          {/* Description */}
          <p className="text-lg sm:text-xl lg:text-2xl xl:text-3xl mb-8 lg:mb-12 text-white/90 leading-relaxed max-w-4xl mx-auto">
            Join our Tastyaana family of 50,000+ happy customers and experience
            the authentic taste of India's finest traditional sweets!
          </p>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 lg:gap-8 mb-8 lg:mb-12">
            <button
              onClick={() => navigate("/products")}
              className="group bg-white text-orange-600 px-8 lg:px-12 py-4 lg:py-6 rounded-2xl lg:rounded-3xl font-black text-lg lg:text-xl hover:bg-yellow-50 transform hover:scale-110 hover:shadow-2xl transition-all duration-300 flex items-center gap-4"
            >
              <span>Start Sweet Shopping</span>
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-6 h-6 lg:w-7 lg:h-7" />
                <Cookie className="w-6 h-6 lg:w-7 lg:h-7" />
              </div>
            </button>

            <button
              onClick={() => navigate("/contact")}
              className="group bg-white/10 backdrop-blur-sm border-2 border-white/40 text-white px-8 lg:px-12 py-4 lg:py-6 rounded-2xl lg:rounded-3xl font-bold text-lg lg:text-xl hover:bg-white/20 transform hover:scale-105 transition-all duration-300 flex items-center gap-3"
            >
              <Phone className="w-5 h-5 lg:w-6 lg:h-6" />
              <span>Custom Orders</span>
              <ChefHat className="w-5 h-5 lg:w-6 lg:h-6" />
            </button>
          </div>

          {/* Offer banner */}
          <div className="inline-flex items-center gap-4 lg:gap-6 bg-gradient-to-r from-yellow-400 to-orange-400 text-orange-800 px-6 lg:px-10 py-3 lg:py-4 rounded-full font-black text-base lg:text-lg shadow-2xl">
            <Gift className="w-6 h-6 lg:w-8 lg:h-8" />
            <span>
              Free delivery above ₹500 • Fresh guarantee • 24/7 support
            </span>
            <Heart className="w-6 h-6 lg:w-8 lg:h-8 text-red-600" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default React.memo(CTASection);
