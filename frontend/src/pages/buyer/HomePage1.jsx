// src/pages/HomePage.js
import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRightIcon,
  StarIcon,
  ClockIcon,
  ShieldCheckIcon,
  CurrencyRupeeIcon,
  HeartIcon,
  TruckIcon,
} from "@heroicons/react/24/outline";
import { useGetMealPlansQuery, useGetTodaysMealQuery } from "../store/api";
import Button from "../components/Common/Button";
import MealPlanCard from "../components/MealPlans/MealPlanCard";
import LoadingSpinner from "../components/Common/LoadingSpinner";
import HeroSection from "../../components/HeroSection";
import GaneshChaturthiComponent from "../../components/buyer/Festival";

import NavratriBanner from "../../components/home/NavratriBanner";

const HomePage = () => {
  const { data: mealPlansData, isLoading: plansLoading } = useGetMealPlansQuery(
    {
      limit: 3,
      status: "active",
      sortBy: "isPopular",
    }
  );

  const { data: todaysMeal, isLoading: mealLoading } = useGetTodaysMealQuery();

  // Scroll to featured section
  const scrollToFeatured = () => {
    const featuredSection = document.getElementById("featured-section");
    if (featuredSection) {
      featuredSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  const features = [
    {
      icon: HeartIcon,
      title: "Made with Love",
      description:
        "Every meal is prepared with care and authentic ingredients, just like home.",
    },
    {
      icon: ClockIcon,
      title: "Fresh Daily",
      description: "Cooked fresh every day and delivered hot to your doorstep.",
    },
    {
      icon: CurrencyRupeeIcon,
      title: "Affordable Pricing",
      description:
        "Get homestyle meals at prices that won't break your budget.",
    },
    {
      icon: TruckIcon,
      title: "Fast Delivery",
      description: "Quick and reliable delivery service across Indore.",
    },
    {
      icon: ShieldCheckIcon,
      title: "Quality Assured",
      description:
        "Highest hygiene standards and quality checks for every meal.",
    },
    {
      icon: StarIcon,
      title: "Highly Rated",
      description: "Loved by thousands of customers with 4.8+ star ratings.",
    },
  ];

  // Stats can be moved to HeroSection component if needed

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <HeroSection />
      {/* <GaneshChaturthiComponent /> */}
      {/* Navratri Specials */}
      {/* <NavratriBanner /> */}

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose Ghar Ka Khana?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We bring the warmth and taste of home-cooked meals with modern
              convenience and reliability.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="text-center p-6 rounded-xl bg-gray-50 hover:bg-white hover:shadow-lg transition-all duration-300"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 text-orange-600 rounded-full mb-4">
                  <feature.icon className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Meal Plans */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Popular Meal Plans
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Choose from our carefully crafted meal plans designed to satisfy
              your taste buds and budget.
            </p>
          </motion.div>

          {plansLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-xl h-96 animate-pulse">
                  <div className="h-48 bg-gray-200 rounded-t-xl"></div>
                  <div className="p-6 space-y-4">
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-8 bg-gray-200 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {mealPlansData?.data?.mealPlans?.map((plan) => (
                <MealPlanCard
                  key={plan._id}
                  mealPlan={plan}
                  onQuickOrder={(plan) => {
                    // Handle quick order logic
                    console.log("Quick order for:", plan.title);
                  }}
                />
              ))}
            </div>
          )}

          <div className="text-center mt-12">
            <Link to="/meal-plans">
              <Button size="large">
                View All Meal Plans
                <ArrowRightIcon className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Getting your favorite homestyle meals is just a few clicks away.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: "1",
                title: "Choose Your Plan",
                description:
                  "Select from our Low Cost, Basic, or Premium meal plans based on your preference and budget.",
                icon: "📋",
              },
              {
                step: "2",
                title: "Customize & Order",
                description:
                  "Add your preferences, select delivery slots, and place your order with flexible payment options.",
                icon: "⚙️",
              },
              {
                step: "3",
                title: "Enjoy Fresh Meals",
                description:
                  "Receive fresh, hot meals delivered to your doorstep at your preferred time daily.",
                icon: "🍽️",
              },
            ].map((item, index) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                className="text-center relative"
              >
                <div className="inline-flex items-center justify-center w-20 h-20 bg-orange-500 text-white rounded-full text-3xl mb-6 relative z-10">
                  {item.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {item.title}
                </h3>
                <p className="text-gray-600 max-w-sm mx-auto">
                  {item.description}
                </p>

                {/* Connector Line */}
                {index < 2 && (
                  <div className="hidden md:block absolute top-10 left-1/2 w-full h-0.5 bg-gray-200 z-0"></div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-gradient-to-r from-orange-50 to-red-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              What Our Customers Say
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Join thousands of satisfied customers who trust us for their daily
              meals.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                name: "Priya Sharma",
                location: "Vijay Nagar, Indore",
                rating: 5,
                comment:
                  "The food tastes exactly like my mother's cooking! Fresh ingredients and authentic flavors. Highly recommended.",
                avatar: "👩",
              },
              {
                name: "Rajesh Kumar",
                location: "Palasia, Indore",
                rating: 5,
                comment:
                  "Great value for money. The 30-day plan has saved me so much time and the food is consistently good.",
                avatar: "👨",
              },
              {
                name: "Anita Patel",
                location: "Bhopal",
                rating: 4,
                comment:
                  "Love the variety in the weekly menu. The Sunday specials are amazing! Customer service is also very responsive.",
                avatar: "👩‍🦱",
              },
            ].map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-white p-6 rounded-xl shadow-lg"
              >
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center text-2xl">
                    {testimonial.avatar}
                  </div>
                  <div className="ml-4">
                    <h4 className="font-semibold text-gray-900">
                      {testimonial.name}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {testimonial.location}
                    </p>
                  </div>
                </div>

                <div className="flex mb-3">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <StarIcon key={i} className="h-5 w-5 text-yellow-500" />
                  ))}
                </div>

                <p className="text-gray-700 italic">"{testimonial.comment}"</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-orange-600 to-red-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to Experience Ghar Ka Khana?
            </h2>
            <p className="text-xl text-orange-100 mb-8 max-w-2xl mx-auto">
              Join thousands of satisfied customers and start enjoying homestyle
              meals delivered fresh to your doorstep.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/meal-plans">
                <Button
                  size="large"
                  className="bg-white text-orange-600 hover:bg-gray-100 w-full sm:w-auto"
                >
                  Start Your Food Journey
                  <ArrowRightIcon className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/custom-request">
                <Button
                  variant="outline"
                  size="large"
                  className="border-white text-white hover:bg-white hover:text-orange-600 w-full sm:w-auto"
                >
                  Try Custom Order
                </Button>
              </Link>
            </div>

            {/* Special Offer */}
            <div className="mt-8 p-4 bg-white bg-opacity-10 rounded-lg backdrop-blur-sm">
              <p className="text-white font-semibold">
                🎉 Special Offer: Get ₹50 off on your first order! Use code:{" "}
                <span className="bg-white text-orange-600 px-2 py-1 rounded">
                  WELCOME50
                </span>
              </p>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
