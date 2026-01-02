import { motion } from "framer-motion";
import { ChefHat, Zap, Heart } from "lucide-react";
import { variants } from "./animationUtils";
import { Cookie, Sparkles, CheckCircle } from "lucide-react";
import React from "react";
const FeaturesSection = () => {
  const features = [
    {
      icon: ChefHat,
      title: "Master Craftsmen Heritage",
      description:
        "Our skilled halwais carry forward 35+ years of traditional recipes...",
      features: [
        "Hand-picked ingredients",
        "Traditional techniques",
        "Quality control",
        "Authentic recipes",
      ],
      color: "orange",
      gradient: "from-orange-400 to-red-500",
      bgGradient: "from-orange-50 to-red-50",
      emoji: "👨‍🍳",
    },
    // Other features...
  ];

  return (
    <section className="py-16 lg:py-24 bg-gradient-to-br from-white-50 via-yellow-50 to-pink-50 relative overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <motion.div
          className="text-center mb-12 lg:mb-20"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
        >
          <motion.div
            className="inline-flex items-center gap-3 bg-orange-100 text-orange-600 rounded-full px-4 lg:px-6 py-2 lg:py-3 text-xs lg:text-sm font-semibold mb-6"
            variants={variants.badge}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Cookie className="w-4 h-4 lg:w-5 lg:h-5" />
            <span>Why We're Special</span>
            <Sparkles className="w-4 h-4 lg:w-5 lg:h-5" />
          </motion.div>

          <motion.h2
            className="text-3xl lg:text-6xl font-extrabold text-gray-800 mb-6 lg:mb-8"
            variants={variants.title}
          >
            Sweet Perfection in Every Bite
          </motion.h2>
        </motion.div>

        {/* Features grid */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-12"
          variants={variants.container}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={index}
                className="group relative bg-white rounded-3xl lg:rounded-[2rem] p-6 lg:p-8 shadow-lg hover:shadow-xl transition-all duration-700 border border-gray-100 hover:border-transparent overflow-hidden"
                variants={variants.card}
                whileHover={{ scale: 1.02, y: -5 }}
                whileTap={{ scale: 0.98 }}
              >
                {/* Feature content */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${feature.bgGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl lg:rounded-[2rem]`}
                ></div>

                <motion.div
                  className={`relative w-12 h-12 lg:w-16 lg:h-16 bg-gradient-to-r ${feature.gradient} rounded-2xl lg:rounded-3xl flex items-center justify-center mb-4 lg:mb-6 shadow-lg`}
                  variants={variants.icon}
                  whileHover={{ scale: 1.1, rotate: 10 }}
                >
                  <Icon className="w-6 h-6 lg:w-8 lg:h-8 text-white" />
                </motion.div>

                <h3 className="text-lg lg:text-xl font-semibold mb-3 lg:mb-4 text-gray-800">
                  {feature.title}
                </h3>
                <p className="text-gray-600 text-sm lg:text-base leading-relaxed mb-4 lg:mb-6">
                  {feature.description}
                </p>

                {/* Feature list */}
                <div className="grid grid-cols-2 gap-2 lg:gap-3">
                  {feature.features.map((item, idx) => (
                    <motion.div
                      key={idx}
                      className="flex items-center gap-2 text-xs lg:text-sm"
                      variants={variants.feature}
                      whileHover={{ x: 5 }}
                    >
                      <CheckCircle
                        className={`w-3 h-3 lg:w-4 lg:h-4 text-${feature.color}-500`}
                      />
                      <span className="text-gray-700 font-medium">{item}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
};

export default React.memo(FeaturesSection);
