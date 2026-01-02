import React, { useState, useEffect } from "react";
import {
  Menu,
  X,
  ChevronRight,
  Star,
  Check,
  Phone,
  Mail,
  MapPin,
  Clock,
  Users,
  Award,
  Heart,
  Shield,
  Truck,
  Play,
  ChefHat,
  Leaf,
  Zap,
  ArrowRight,
  Quote,
} from "lucide-react";
import { NavLink } from "react-router-dom";

const LandingPage = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [isVisible, setIsVisible] = useState({});

  // Intersection Observer for animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setIsVisible((prev) => ({
            ...prev,
            [entry.target.id]: entry.isIntersecting,
          }));
        });
      },
      { threshold: 0.1 }
    );

    document.querySelectorAll("[id]").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  // Auto-rotate testimonials
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Enhanced meal plans with more visual data
  const mealPlans = [
    {
      id: 1,
      name: "Budget Saver",
      subtitle: "Perfect for Students",
      price: 94,
      originalPrice: 100,
      monthlyPrice: 2800,
      savings: "Save ₹600/month",
      description:
        "Healthy, filling meals that won't break your budget. Perfect for students and young professionals.",
      gradient: "from-green-400 to-emerald-600",
      textColor: "text-green-600",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
      features: [
        { text: "3 Rotis + Dal + Rice + Sabzi", icon: "🍽️" },
        { text: "Fresh ingredients daily", icon: "🌱" },
        { text: "~500 calories per meal", icon: "⚡" },
        { text: "Basic meal variety", icon: "📋" },
      ],
      badge: "Most Popular",
      popular: true,
      image: "🥗",
      rating: 4.6,
      orders: "2.5k+ orders",
    },
    {
      id: 2,
      name: "Family Favorite",
      subtitle: "Best Value for Money",
      price: 130,
      originalPrice: 150,
      monthlyPrice: 3900,
      savings: "Save ₹900/month",
      description:
        "Perfect balance of taste, nutrition, and variety. Our most recommended plan for families.",
      gradient: "from-blue-400 to-indigo-600",
      textColor: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      features: [
        { text: "5 Rotis + Dal + Rice + 2 Sabzi", icon: "🍛" },
        { text: "Weekly menu variety", icon: "📅" },
        { text: "~650 calories per meal", icon: "💪" },
        { text: "Includes pickles & papad", icon: "🥒" },
      ],
      badge: "Recommended",
      featured: true,
      image: "🍛",
      rating: 4.8,
      orders: "5k+ orders",
    },
    {
      id: 3,
      name: "Premium Feast",
      subtitle: "Gourmet Experience",
      price: 150,
      originalPrice: 200,
      monthlyPrice: 4500,
      savings: "Save ₹1200/month",
      description:
        "Indulge in premium ingredients and chef-special preparations. A true gourmet experience at home.",
      gradient: "from-purple-400 to-pink-600",
      textColor: "text-purple-600",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-200",
      features: [
        { text: "5 Rotis + Dal + Rice + 3 Sabzi + sweets", icon: "🍱" },
        { text: "Premium organic ingredients", icon: "🌟" },
        { text: "~800 calories per meal", icon: "🔥" },
        { text: "Special weekend treats", icon: "🎉" },
      ],
      badge: "Premium",
      premium: true,
      image: "🍱",
      rating: 4.9,
      orders: "1.2k+ orders",
    },
  ];

  // Enhanced features with animations
  const features = [
    {
      icon: Heart,
      title: "Made with Love",
      description: "Every dish crafted with care by experienced home cooks",
      color: "from-red-400 to-pink-500",
      delay: "delay-100",
    },
    {
      icon: Clock,
      title: "Always Fresh",
      description: "Cooked fresh every morning, delivered hot within 2 hours",
      color: "from-blue-400 to-cyan-500",
      delay: "delay-200",
    },
    {
      icon: Shield,
      title: "100% Hygienic",
      description: "FSSAI certified kitchen with strict quality controls",
      color: "from-green-400 to-emerald-500",
      delay: "delay-300",
    },
    {
      icon: Truck,
      title: "Lightning Fast",
      description: "30-minute delivery guarantee across Indore",
      color: "from-yellow-400 to-orange-500",
      delay: "delay-400",
    },
    {
      icon: ChefHat,
      title: "Expert Chefs",
      description: "Trained chefs with 10+ years of experience",
      color: "from-indigo-400 to-purple-500",
      delay: "delay-500",
    },
    {
      icon: Leaf,
      title: "100% Organic",
      description: "Farm-fresh vegetables and premium quality ingredients",
      color: "from-teal-400 to-green-500",
      delay: "delay-600",
    },
  ];

  // Enhanced testimonials
  const testimonials = [
    {
      id: 1,
      name: "Priya Sharma",
      role: "Software Engineer",
      location: "Vijay Nagar, Indore",
      rating: 5,
      comment:
        "Absolutely incredible! The food tastes exactly like my mother's cooking. I've been using the Premium plan for 3 months and it's been life-changing for my busy schedule.",
      //   image:
      // "https://images.unsplash.com/photo-1494790108755-2616b612b789?w=150&h=150&fit=crop&crop=face",
      plan: "Premium Plan",
      verified: true,
      date: "2 days ago",
    },
    {
      id: 2,
      name: "Rajesh Kumar",
      role: "Business Owner",
      location: "vijaynager, Indore",
      rating: 5,
      comment:
        "Outstanding value for money! The Family Favorite plan feeds my entire family perfectly. The variety keeps everyone happy and the quality is consistently excellent.",
      //   image:
      //     "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
      plan: "Family Favorite",
      verified: true,
      date: "1 week ago",
    },
    {
      id: 3,
      name: "Anita Patel",
      role: "Homemaker",
      location: "Bhopal",
      rating: 4,
      comment:
        "Love the Sunday specials! The food quality is consistently good and my kids absolutely love the variety. The delivery timing is always perfect.",
      //   image:
      //     "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
      plan: "Family Favorite",
      verified: true,
      date: "2 weeks ago",
    },
  ];

  const scrollToSection = (sectionId) => {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth" });
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-white font-['Inter'] overflow-x-hidden">
      {/* Enhanced Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl shadow-sm border-b border-gray-100">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Enhanced Logo */}
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="w-14 h-14 bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-2xl">🏠</span>
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full animate-pulse"></div>
              </div>
              <div>
                <div className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                  Ghar Ka Khana
                </div>
                <div className="text-sm text-gray-500 font-medium">
                  घर का स्वाद, आपके दरवाज़े तक
                </div>
              </div>
            </div>

            {/* Enhanced Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-8">
              {["Menu", "How It Works", "Reviews", "Contact"].map(
                (item, index) => (
                  <button
                    key={item}
                    onClick={() =>
                      scrollToSection(item.toLowerCase().replace(" ", "-"))
                    }
                    className="relative text-gray-700 hover:text-orange-600 font-semibold transition-all duration-300 group"
                  >
                    {item}
                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-orange-500 to-red-500 group-hover:w-full transition-all duration-300"></span>
                  </button>
                )
              )}
              <button className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-8 py-3 rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all duration-300">
                Order Now
              </button>
            </div>

            {/* Enhanced Mobile Menu Button */}
            <button
              className="lg:hidden p-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </nav>

        {/* Enhanced Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white border-t border-gray-100 shadow-xl">
            <div className="px-4 py-6 space-y-4">
              {["Menu", "How It Works", "Reviews", "Contact"].map((item) => (
                <button
                  key={item}
                  onClick={() =>
                    scrollToSection(item.toLowerCase().replace(" ", "-"))
                  }
                  className="block w-full text-left text-gray-700 hover:text-orange-600 font-semibold py-2 transition-colors"
                >
                  {item}
                </button>
              ))}
              <button className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 rounded-xl font-semibold">
                Order Now
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Revolutionary Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-orange-50 via-red-50 to-pink-50">
          <div className="absolute top-0 left-0 w-full h-full">
            <div className="absolute top-20 left-20 w-64 h-64 bg-orange-200 rounded-full mix-blend-multiply filter blur-2xl opacity-70 animate-pulse"></div>
            <div
              className="absolute top-40 right-20 w-64 h-64 bg-red-200 rounded-full mix-blend-multiply filter blur-2xl opacity-70 animate-pulse"
              style={{ animationDelay: "2s" }}
            ></div>
            <div
              className="absolute bottom-20 left-40 w-64 h-64 bg-pink-200 rounded-full mix-blend-multiply filter blur-2xl opacity-70 animate-pulse"
              style={{ animationDelay: "4s" }}
            ></div>
          </div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Hero Content */}
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center bg-white/80 backdrop-blur-sm rounded-full px-6 py-6 mb-8 shadow-lg">
                <span className="w-3 h-3 bg-green-400 rounded-full mr-3 animate-pulse"></span>
                <span className="text-sm font-semibold text-gray-700">
                  🔥 1,000+ Meals Delivered Successfully
                </span>
              </div>

              <h1 className="text-5xl lg:text-7xl font-bold mb-8 leading-tight">
                <span className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent">
                  Authentic
                </span>
                <br />
                <span className="bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 bg-clip-text text-transparent animate-gradient">
                  Ghar Ka Khana
                </span>
                <br />
                <span className="bg-gradient-to-r from-gray-700 to-gray-900 bg-clip-text text-transparent">
                  Delivered Daily
                </span>
              </h1>

              <p className="text-xl text-gray-600 mb-12 max-w-2xl leading-relaxed">
                Experience the warmth of home-cooked meals crafted with love by
                expert chefs. Fresh ingredients, authentic flavors, delivered
                hot to your doorstep across Indore.
              </p>

              {/* Enhanced CTAs */}
              <div className="flex flex-col sm:flex-row gap-6 mb-12">
                <button
                  onClick={() => scrollToSection("menu")}
                  className="group bg-gradient-to-r from-orange-500 to-red-500 text-white px-10 py-5 rounded-2xl font-bold text-lg hover:shadow-2xl hover:scale-105 transition-all duration-300"
                >
                  <span className="flex items-center justify-center">
                    <NavLink to="dummy">Explore Menu</NavLink>
                    <ArrowRight className="ml-3 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </button>
                <button
                  onClick={() => scrollToSection("how-it-works")}
                  className="group bg-white text-gray-700 px-10 py-5 rounded-2xl font-bold text-lg border-2 border-gray-200 hover:border-orange-300 hover:shadow-lg transition-all duration-300"
                >
                  <span className="flex items-center justify-center">
                    <Play className="mr-3 w-5 h-5" />
                    How It Works
                  </span>
                </button>
              </div>

              {/* Social Proof */}
              <div className="grid grid-cols-3 gap-6 pt-8 border-t border-gray-200">
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900">1,000+</div>
                  <div className="text-sm text-gray-600">Happy Customers</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900">4.8⭐</div>
                  <div className="text-sm text-gray-600">Average Rating</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900">99%</div>
                  <div className="text-sm text-gray-600">On-Time Delivery</div>
                </div>
              </div>
            </div>

            {/* Hero Visual */}
            <div className="relative">
              <div className="relative bg-white rounded-3xl shadow-2xl p-8 transform rotate-3 hover:rotate-0 transition-transform duration-500">
                <div className="absolute -top-4 -right-4 bg-green-400 text-white px-4 py-2 rounded-xl font-bold text-sm shadow-lg">
                  Fresh Today! 🔥
                </div>

                <div className="text-center mb-6">
                  <div className="text-6xl mb-4">🍛</div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    Today's Special
                  </h3>
                  <p className="text-gray-600">
                    Dal Makhani + Jeera Rice + Fresh Roti
                  </p>
                </div>

                <div className="bg-gray-50 rounded-2xl p-6 mb-6">
                  <div className="flex justify-between items-center mb-4">
                    <span className="font-semibold">Delivery Time</span>
                    <span className="text-green-600 font-bold">30 mins</span>
                  </div>
                  <div className="flex justify-between items-center mb-4">
                    <span className="font-semibold">Calories</span>
                    <span className="text-orange-600 font-bold">650 cal</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Price</span>
                    <span className="text-2xl font-bold text-gray-900">
                      ₹130
                    </span>
                  </div>
                </div>

                <button className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-4 rounded-xl font-bold hover:shadow-lg transition-all">
                  Order Now
                </button>
              </div>

              {/* Floating elements */}
              <div className="absolute -top-8 -left-8 bg-yellow-400 text-yellow-900 px-4 py-2 rounded-xl font-bold text-sm shadow-lg animate-bounce">
                ₹50 OFF 🎉
              </div>
              <div
                className="absolute -bottom-8 -right-8 bg-purple-400 text-white px-4 py-2 rounded-xl font-bold text-sm shadow-lg animate-bounce"
                style={{ animationDelay: "1s" }}
              >
                Free Delivery 🚚
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Meal Plans Section */}
      <section
        id="menu"
        className="py-24 bg-gradient-to-br from-gray-50 to-white"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <div className="inline-flex items-center bg-orange-100 text-orange-800 px-6 py-3 rounded-full font-semibold mb-6">
              🍽️ Choose Your Perfect Plan
            </div>
            <h2 className="text-5xl font-bold text-gray-900 mb-6">
              Plans That Fit Your
              <span className="bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
                {" "}
                Lifestyle
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              From budget-friendly to premium gourmet, we have the perfect meal
              plan for everyone. All plans include fresh, home-cooked meals
              delivered daily.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {mealPlans.map((plan, index) => (
              <div
                key={plan.id}
                className={`relative bg-white rounded-3xl shadow-xl overflow-hidden transition-all duration-500 hover:scale-105 hover:shadow-2xl ${
                  plan.featured
                    ? "ring-4 ring-blue-200 transform scale-105"
                    : ""
                } ${plan.popular ? "ring-2 ring-green-200" : ""}`}
              >
                {/* Background Gradient */}
                <div
                  className={`absolute top-0 left-0 right-0 h-2 bg-gradient-to-r ${plan.gradient}`}
                ></div>

                {/* Badge */}
                {plan.badge && (
                  <div
                    className={`absolute top-6 right-6 ${plan.bgColor} ${plan.textColor} px-4 py-2 rounded-full text-sm font-bold shadow-lg`}
                  >
                    {plan.badge}
                  </div>
                )}

                <div className="p-8">
                  {/* Plan Header */}
                  <div className="text-center mb-8">
                    <div className="text-6xl mb-4">{plan.image}</div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      {plan.name}
                    </h3>
                    <p className="text-lg font-semibold text-gray-600 mb-4">
                      {plan.subtitle}
                    </p>

                    {/* Rating and Orders */}
                    <div className="flex items-center justify-center gap-4 mb-6">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                        <span className="font-semibold">{plan.rating}</span>
                      </div>
                      <div className="text-sm text-gray-500">{plan.orders}</div>
                    </div>
                  </div>

                  {/* Pricing */}
                  <div className="text-center mb-8">
                    <div className="flex items-center justify-center gap-3 mb-2">
                      <span className="text-5xl font-bold text-gray-900">
                        ₹{plan.price}
                      </span>
                      <div>
                        <div className="text-lg text-gray-500 line-through">
                          ₹{plan.originalPrice}
                        </div>
                        <div className="text-sm font-semibold text-gray-600">
                          /day
                        </div>
                      </div>
                    </div>
                    <p className="text-green-600 font-semibold mb-2">
                      {plan.savings}
                    </p>
                    <p className="text-sm text-gray-500">
                      Monthly: ₹{plan.monthlyPrice}
                    </p>
                  </div>

                  {/* Description */}
                  <p className="text-gray-600 text-center mb-8">
                    {plan.description}
                  </p>

                  {/* Features */}
                  <div className="space-y-4 mb-8">
                    {plan.features.map((feature, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl"
                      >
                        <span className="text-2xl">{feature.icon}</span>
                        <span className="font-medium text-gray-700">
                          {feature.text}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* CTA Button */}
                  <button
                    className={`w-full bg-gradient-to-r ${plan.gradient} text-white py-4 rounded-xl font-bold text-lg hover:shadow-lg transition-all duration-300 transform hover:scale-105`}
                  >
                    Choose {plan.name}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Money Back Guarantee */}
          <div className="text-center mt-16">
            <div className="inline-flex items-center bg-green-100 text-green-800 px-8 py-4 rounded-2xl font-semibold text-lg">
              🛡️ 30-Day Money Back Guarantee - Not satisfied? Full refund, no
              questions asked!
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced How It Works */}
      <section id="how-it-works" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-5xl font-bold text-gray-900 mb-6">
              How It{" "}
              <span className="bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
                Works
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Getting your favorite homestyle meals is incredibly simple. Just 3
              steps to deliciousness!
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            {[
              {
                step: "1",
                title: "Choose Your Plan",
                description:
                  "Select from our carefully crafted meal plans based on your budget and taste preferences. All plans include fresh, nutritious meals.",
                icon: "🍽️",
                color: "from-blue-400 to-blue-600",
              },
              {
                step: "2",
                title: "Customize & Schedule",
                description:
                  "Personalize your meals with dietary preferences (Jain, No Onion, Less Spicy) and choose convenient delivery time slots.",
                icon: "⚙️",
                color: "from-green-400 to-green-600",
              },
              {
                step: "3",
                title: "Enjoy Fresh Delivery",
                description:
                  "Sit back and relax! Fresh, hot meals delivered to your doorstep daily in eco-friendly packaging within 30 minutes.",
                icon: "🚚",
                color: "from-orange-400 to-orange-600",
              },
            ].map((step, index) => (
              <div key={step.step} className="relative text-center group">
                <div
                  className={`w-24 h-24 bg-gradient-to-r ${step.color} rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-lg group-hover:scale-110 transition-transform duration-300`}
                >
                  <span className="text-4xl">{step.icon}</span>
                </div>

                <div
                  className={`absolute -top-2 -left-2 w-8 h-8 bg-gradient-to-r ${step.color} rounded-full flex items-center justify-center text-white font-bold shadow-lg`}
                >
                  {step.step}
                </div>

                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  {step.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {step.description}
                </p>

                {/* Connector line for desktop */}
                {index < 2 && (
                  <div className="hidden md:block absolute top-12 left-full w-full h-0.5 bg-gradient-to-r from-gray-200 to-transparent"></div>
                )}
              </div>
            ))}
          </div>

          <div className="text-center mt-16">
            <button
              onClick={() => scrollToSection("menu")}
              className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-12 py-5 rounded-2xl font-bold text-xl hover:shadow-2xl hover:scale-105 transition-all duration-300"
            >
              Start Your Food Journey Today!
            </button>
          </div>
        </div>
      </section>

      {/* Enhanced Features Section */}
      <section className="py-24 bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-5xl font-bold text-gray-900 mb-6">
              Why Choose{" "}
              <span className="bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
                Ghar Ka Khana?
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We don't just deliver food, we deliver happiness, health, and the
              warmth of home-cooked meals
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className={`group bg-white p-8 rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 hover:scale-105 ${feature.delay}`}
              >
                <div
                  className={`w-16 h-16 bg-gradient-to-r ${feature.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300`}
                >
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>

                {/* Hover effect overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-red-500/10 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Enhanced Testimonials Section */}
      <section
        id="reviews"
        className="py-24 bg-gradient-to-br from-orange-50 to-red-50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-5xl font-bold text-gray-900 mb-6">
              What Our{" "}
              <span className="bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
                Customers
              </span>{" "}
              Say
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Don't just take our word for it. Here's what 10,000+ happy
              customers have to say about their experience
            </p>
          </div>

          {/* Featured Testimonial */}
          <div className="max-w-4xl mx-auto mb-16">
            <div className="bg-white rounded-3xl shadow-2xl p-12 relative overflow-hidden">
              {/* Quote Icon */}
              <Quote className="absolute top-8 left-8 w-12 h-12 text-orange-200" />

              <div className="relative z-10">
                <div className="flex items-center justify-center gap-8 mb-8">
                  <img
                    src={testimonials[currentTestimonial].image}
                    alt={testimonials[currentTestimonial].name}
                    className="w-20 h-20 rounded-full border-4 border-orange-200 shadow-lg"
                  />
                  <div className="text-center">
                    <h3 className="text-2xl font-bold text-gray-900">
                      {testimonials[currentTestimonial].name}
                    </h3>
                    <p className="text-lg text-gray-600">
                      {testimonials[currentTestimonial].role}
                    </p>
                    <p className="text-orange-600 font-semibold">
                      {testimonials[currentTestimonial].location}
                    </p>
                  </div>
                </div>

                <div className="flex justify-center mb-6">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-6 h-6 text-yellow-400 fill-current"
                    />
                  ))}
                </div>

                <blockquote className="text-2xl text-gray-700 text-center leading-relaxed italic">
                  "{testimonials[currentTestimonial].comment}"
                </blockquote>

                <div className="flex items-center justify-center gap-4 mt-8">
                  <span className="bg-orange-100 text-orange-600 px-4 py-2 rounded-full text-sm font-semibold">
                    {testimonials[currentTestimonial].plan}
                  </span>
                  <span className="text-green-600 flex items-center gap-1 font-semibold">
                    <Check className="w-4 h-4" />
                    Verified Customer
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Testimonial Navigation */}
          <div className="flex justify-center gap-3 mb-16">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentTestimonial(index)}
                className={`w-4 h-4 rounded-full transition-all duration-300 ${
                  index === currentTestimonial
                    ? "bg-gradient-to-r from-orange-500 to-red-500 scale-125"
                    : "bg-gray-300 hover:bg-gray-400"
                }`}
              />
            ))}
          </div>

          {/* Stats */}
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { number: "10,000+", label: "Happy Customers", icon: "👥" },
              { number: "50,000+", label: "Meals Delivered", icon: "🍽️" },
              { number: "4.8★", label: "Average Rating", icon: "⭐" },
              { number: "99%", label: "Customer Satisfaction", icon: "❤️" },
            ].map((stat, index) => (
              <div
                key={index}
                className="text-center bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <div className="text-4xl mb-4">{stat.icon}</div>
                <div className="text-3xl font-bold text-gray-900 mb-2">
                  {stat.number}
                </div>
                <div className="text-gray-600 font-semibold">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Enhanced Special Offer Section */}
      <section className="py-24 bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 relative overflow-hidden">
        {/* Background Animation */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-full bg-black/20"></div>
          <div className="absolute top-10 left-10 w-32 h-32 bg-white/10 rounded-full animate-pulse"></div>
          <div
            className="absolute bottom-10 right-10 w-48 h-48 bg-white/10 rounded-full animate-pulse"
            style={{ animationDelay: "2s" }}
          ></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center text-white">
            <div className="inline-flex items-center bg-white/20 backdrop-blur-sm rounded-full px-8 py-4 mb-8">
              <span className="text-3xl mr-4">🎉</span>
              <span className="font-bold text-xl">Limited Time Offer!</span>
            </div>

            <h2 className="text-5xl lg:text-6xl font-bold mb-8">
              First 100 Users Get
              <br />
              <span className="bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
                FREE LADDUS!
              </span>
            </h2>

            <p className="text-2xl mb-12 max-w-3xl mx-auto opacity-90">
              Sign up today and get delicious homemade laddus with your first
              order. Plus enjoy additional benefits worth ₹500!
            </p>

            {/* Offer Cards */}
            <div className="grid md:grid-cols-3 gap-8 mb-12">
              {[
                {
                  icon: "🍯",
                  title: "Free Laddus",
                  subtitle: "Worth ₹150",
                  description: "Homemade with love",
                },
                {
                  icon: "💰",
                  title: "₹50 OFF",
                  subtitle: "First Order",
                  description: "Use code WELCOME50",
                },
                {
                  icon: "🚚",
                  title: "Free Delivery",
                  subtitle: "For 30 Days",
                  description: "On all orders",
                },
              ].map((offer, index) => (
                <div
                  key={index}
                  className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 text-gray-900 hover:scale-105 transition-transform duration-300"
                >
                  <div className="text-5xl mb-4">{offer.icon}</div>
                  <h3 className="text-2xl font-bold mb-2">{offer.title}</h3>
                  <p className="text-lg font-semibold text-orange-600 mb-2">
                    {offer.subtitle}
                  </p>
                  <p className="text-gray-600">{offer.description}</p>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <button className="bg-white text-purple-600 px-12 py-5 rounded-2xl font-bold text-xl hover:shadow-2xl hover:scale-105 transition-all duration-300">
                Claim Your FREE Laddus Now!
              </button>
              <div className="text-yellow-300 font-semibold text-lg">
                ⏰ Hurry! Only 23 spots left
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Contact Section */}
      <section
        id="contact"
        className="py-24 bg-gray-900 text-white relative overflow-hidden"
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-orange-500 to-red-500"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold mb-6">
              Let's{" "}
              <span className="bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
                Connect
              </span>
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Have questions? Need custom meal plans? Our food experts are here
              to help you 24/7
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-16">
            {/* Contact Info */}
            <div>
              <h3 className="text-3xl font-bold mb-8">Get in Touch</h3>
              <p className="text-gray-300 mb-12 text-lg">
                Ready to start your delicious journey? We're just a call or
                message away!
              </p>

              <div className="space-y-8">
                {[
                  {
                    icon: Phone,
                    title: "Call Us Now",
                    value: "+91 9203338229",
                    subtitle: "Available 7 AM - 11 PM",
                    color: "from-green-400 to-emerald-500",
                  },
                  {
                    icon: Mail,
                    title: "Email Us",
                    value: "contact@tastyaana.com",
                    subtitle: "Response within 2 hours",
                    color: "from-blue-400 to-cyan-500",
                  },
                  {
                    icon: MapPin,
                    title: "Service Areas",
                    value: "Indore & Bhopal",
                    subtitle: "Expanding to 5 more cities soon",
                    color: "from-purple-400 to-pink-500",
                  },
                ].map((contact, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-6 p-6 bg-gray-800 rounded-2xl hover:bg-gray-700 transition-colors"
                  >
                    <div
                      className={`w-16 h-16 bg-gradient-to-r ${contact.color} rounded-2xl flex items-center justify-center`}
                    >
                      <contact.icon className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h4 className="text-xl font-bold mb-1">
                        {contact.title}
                      </h4>
                      <p className="text-lg text-orange-400 font-semibold">
                        {contact.value}
                      </p>
                      <p className="text-gray-400 text-sm">
                        {contact.subtitle}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Contact Form */}
            <div className="bg-gray-800 rounded-3xl p-8 shadow-2xl">
              <h3 className="text-2xl font-bold mb-8">Send us a Message</h3>
              <ContactForm />
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Footer */}
    </div>
  );
};

// Enhanced Contact Form Component
const ContactForm = () => {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    message: "",
    planInterest: "basic",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000));

    alert(
      "🎉 Thank you! Our team will contact you within 24 hours with a special welcome offer!"
    );
    setFormData({
      name: "",
      phone: "",
      email: "",
      message: "",
      planInterest: "basic",
    });
    setIsSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-semibold mb-3 text-gray-300">
            Full Name
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full px-4 py-4 bg-gray-700 border border-gray-600 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-white placeholder-gray-400"
            placeholder="Enter your name"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-3 text-gray-300">
            Phone Number
          </label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            required
            className="w-full px-4 py-4 bg-gray-700 border border-gray-600 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-white placeholder-gray-400"
            placeholder="+91 98765 43210"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold mb-3 text-gray-300">
          Email Address
        </label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
          className="w-full px-4 py-4 bg-gray-700 border border-gray-600 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-white placeholder-gray-400"
          placeholder="your.email@gmail.com"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold mb-3 text-gray-300">
          Interested Plan
        </label>
        <select
          name="planInterest"
          value={formData.planInterest}
          onChange={handleChange}
          className="w-full px-4 py-4 bg-gray-700 border border-gray-600 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-white"
        >
          <option value="budget">Budget Saver - ₹80/day</option>
          <option value="basic">Family Favorite - ₹120/day</option>
          <option value="premium">Premium Feast - ₹180/day</option>
          <option value="custom">Custom Plan</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-semibold mb-3 text-gray-300">
          Message
        </label>
        <textarea
          rows="4"
          name="message"
          value={formData.message}
          onChange={handleChange}
          required
          className="w-full px-4 py-4 bg-gray-700 border border-gray-600 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-white placeholder-gray-400"
          placeholder="Tell us about your dietary preferences, delivery location, or any questions..."
        ></textarea>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-4 rounded-xl font-bold text-lg hover:shadow-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? (
          <span className="flex items-center justify-center">
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
            Sending Message...
          </span>
        ) : (
          "Send Message & Get Free Consultation"
        )}
      </button>
    </form>
  );
};

export default LandingPage;
