import React from "react";
import {
  ShoppingBag,
  Star,
  Users,
  TrendingUp,
  Heart,
  Shield,
  Zap,
  Globe,
  Package,
  Home,
  Smartphone,
  Utensils,
  Car,
  BookOpen,
  Briefcase,
  Award,
  Target,
  Eye,
} from "lucide-react";

export default function AboutUsPage() {
  const services = [
    {
      icon: <Utensils className="w-6 h-6 sm:w-8 sm:h-8 text-green-500" />,
      title: "Food & Groceries",
      description:
        "Fresh meals, groceries, and specialty foods delivered to your doorstep",
    },
    {
      icon: <Smartphone className="w-6 h-6 sm:w-8 sm:h-8 text-green-500" />,
      title: "Smartphones",
      description: "Buy & Sell Your favorite smartphones",
    },
    {
      icon: <Home className="w-6 h-6 sm:w-8 sm:h-8 text-green-500" />,
      title: "Real Estate",
      description: "Buy, sell, and rent properties with trusted agents",
    },
    {
      icon: <Package className="w-6 h-6 sm:w-8 sm:h-8 text-green-500" />,
      title: "Everything Else",
      description:
        "Fashion, books, automotive, health & beauty - we've got it all",
    },
  ];

  const values = [
    {
      icon: <Heart className="w-6 h-6 sm:w-8 sm:h-8 text-green-500" />,
      title: "Customer First",
      description:
        "Every decision we make puts our customers' needs and satisfaction at the center",
    },
    {
      icon: <Shield className="w-6 h-6 sm:w-8 sm:h-8 text-green-500" />,
      title: "Trust & Safety",
      description:
        "Secure transactions, verified sellers, and reliable service you can count on",
    },
    {
      icon: <Zap className="w-6 h-6 sm:w-8 sm:h-8 text-green-500" />,
      title: "Innovation",
      description:
        "Constantly evolving technology to make marketplace experiences better",
    },
    {
      icon: <Globe className="w-6 h-6 sm:w-8 sm:h-8 text-green-500" />,
      title: "Community",
      description:
        "Supporting local businesses and connecting communities through commerce",
    },
  ];

  const stats = [
    {
      icon: <Users className="w-6 h-6 sm:w-8 sm:h-8 text-white" />,
      number: "100+",
      label: "Active Users",
      description: "Growing community of buyers and sellers",
    },
    {
      icon: <ShoppingBag className="w-6 h-6 sm:w-8 sm:h-8 text-white" />,
      number: "2K+",
      label: "Products Listed",
      description: "Across all categories daily",
    },
    {
      icon: <Star className="w-6 h-6 sm:w-8 sm:h-8 text-white" />,
      number: "4.8",
      label: "Average Rating",
      description: "Customer satisfaction score",
    },
    {
      icon: <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-white" />,
      number: "98%",
      label: "Success Rate",
      description: "Successful transactions completed",
    },
  ];

  const team = [
    {
      name: "Rajat Chaturvedi",
      role: "Founder",
      description:
        "Visionary leader with 5+ years in e-commerce and marketplace development",
    },
    {
      name: "Abhishek Yadav",
      role: "CEO",
      description:
        "Tech innovator specializing in scalable marketplace platforms",
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-green-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                <ShoppingBag className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                Tastyaana
              </h1>
            </div>
            <nav className="hidden md:flex space-x-6 lg:space-x-8">
              <a
                href="#"
                className="text-gray-600 hover:text-green-500 transition-colors text-sm lg:text-base"
              >
                Home
              </a>
              <a
                href="#"
                className="text-green-500 font-medium text-sm lg:text-base"
              >
                About
              </a>
              <a
                href="#"
                className="text-gray-600 hover:text-green-500 transition-colors text-sm lg:text-base"
              >
                Categories
              </a>
              <a
                href="#"
                className="text-gray-600 hover:text-green-500 transition-colors text-sm lg:text-base"
              >
                Become a Seller
              </a>
              <a
                href="#"
                className="text-gray-600 hover:text-green-500 transition-colors text-sm lg:text-base"
              >
                Contact
              </a>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-green-50 to-emerald-50 py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
              About{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-500 to-emerald-500">
                Tastyaana
              </span>
            </h1>
            <p className="text-xl sm:text-2xl text-gray-600 max-w-4xl mx-auto leading-relaxed mb-8">
              India's most comprehensive marketplace where you can buy and sell
              anything - from fresh food to electronics, real estate to
              services.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center">
              <button className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-semibold hover:from-green-600 hover:to-emerald-600 transition-all duration-200 transform hover:scale-105 shadow-lg">
                Start Shopping
              </button>
              <button className="border-2 border-green-500 text-green-500 px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-semibold hover:bg-green-500 hover:text-white transition-all duration-200">
                Become a Seller
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
                Our Story
              </h2>
              <p className="text-gray-600 text-lg leading-relaxed mb-6">
                Founded in 2025, Tastyaana began as a simple food delivery
                platform but quickly evolved into something much bigger. We
                realized that people needed a single, trusted marketplace where
                they could find everything they need - from their daily
                groceries to their dream home.
              </p>
              <p className="text-gray-600 text-lg leading-relaxed mb-8">
                Today, we're proud to be India's fastest-growing comprehensive
                marketplace, connecting millions of buyers with thousands of
                sellers across multiple categories. Our platform has facilitated
                countless successful transactions and helped thousands of
                businesses grow.
              </p>
            </div>
            <div className="relative">
              <div className="bg-gradient-to-br from-green-100 to-emerald-100 rounded-2xl p-8 sm:p-12">
                <div className="grid grid-cols-2 gap-6">
                  {stats.map((stat, index) => (
                    <div key={index} className="text-center">
                      <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                        {stat.icon}
                      </div>
                      <div className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
                        {stat.number}
                      </div>
                      <div className="font-semibold text-gray-700 mb-1">
                        {stat.label}
                      </div>
                      <div className="text-xs sm:text-sm text-gray-600">
                        {stat.description}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What We Offer */}
      <section className="py-16 sm:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              What We Offer
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              From everyday essentials to life-changing purchases, Tastyaana is
              your one-stop destination for everything
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {services.map((service, index) => (
              <div
                key={index}
                className="bg-white rounded-xl p-6 sm:p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <div className="mb-4 sm:mb-6">{service.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {service.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {service.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12">
            <div className="bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl p-4 sm:p-8 md:p-12 text-white">
              <Target className="w-8 h-8 sm:w-12 sm:h-12 md:w-16 md:h-16 text-white mb-3 sm:mb-6" />
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3 sm:mb-6">
                Our Mission
              </h2>
              <p className="text-sm sm:text-base md:text-lg leading-relaxed mb-3 sm:mb-6">
                To democratize commerce by creating a platform where anyone can
                buy or sell anything, anywhere in India. We believe in
                empowering individuals and businesses of all sizes to
                participate in the digital economy.
              </p>
              <p className="text-sm sm:text-base md:text-lg leading-relaxed">
                Our mission is to make commerce accessible, affordable, and
                trustworthy for everyone - from the street vendor to the
                established business owner.
              </p>
            </div>
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-4 sm:p-8 md:p-12 text-white">
              <Eye className="w-8 h-8 sm:w-12 sm:h-12 md:w-16 md:h-16 text-white mb-3 sm:mb-6" />
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3 sm:mb-6">
                Our Vision
              </h2>
              <p className="text-sm sm:text-base md:text-lg leading-relaxed mb-3 sm:mb-6">
                To become India's most trusted and comprehensive marketplace,
                where millions of people discover products and services that
                enhance their lives while supporting local businesses and
                communities.
              </p>
              <p className="text-sm sm:text-base md:text-lg leading-relaxed">
                We envision a future where geographical boundaries don't limit
                what you can buy or sell, and where every transaction creates
                value for both buyers and sellers.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Our Values */}
      <section className="py-16 sm:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Our Values
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              The principles that guide everything we do and every decision we
              make
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {values.map((value, index) => (
              <div
                key={index}
                className="bg-white rounded-xl p-6 sm:p-8 text-center shadow-lg hover:shadow-xl transition-shadow"
              >
                <div className="mb-4 sm:mb-6 flex justify-center">
                  {value.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {value.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Meet Our Team
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              The passionate individuals behind Tastyaana's success
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-2 gap-6 sm:gap-8">
            {team.map((member, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 sm:w-24 sm:h-24 md:w-32 md:h-32 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-4 md:mb-6">
                  <Users className="w-8 h-8 sm:w-12 sm:h-12 md:w-16 md:h-16 text-white" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-1 sm:mb-2">
                  {member.name}
                </h3>
                <p className="text-green-500 font-medium mb-2 sm:mb-3 text-sm sm:text-base">
                  {member.role}
                </p>
                <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">
                  {member.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-20 bg-gradient-to-br from-green-500 to-emerald-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            Ready to Join the Tastyaana Family?
          </h2>
          <p className="text-xl text-green-100 max-w-3xl mx-auto mb-8">
            Whether you're looking to buy your next favorite product or grow
            your business by selling, we're here to help you succeed.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center">
            <button className="bg-white text-green-500 px-8 py-4 rounded-lg font-semibold hover:bg-gray-50 transition-colors shadow-lg">
              Start Shopping Now
            </button>
            <button className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white hover:text-green-500 transition-colors">
              Become a Seller Today
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            <div className="col-span-2 sm:col-span-1">
              <div className="flex items-center space-x-2 sm:space-x-3 mb-3 sm:mb-4">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                  <ShoppingBag className="w-3 h-3 sm:w-5 sm:h-5 text-white" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-gray-900">
                  Tastyaana
                </h3>
              </div>
              <p className="text-gray-600 text-xs sm:text-sm pr-4">
                Your one-stop marketplace for everything - food, electronics,
                real estate, and more.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2 sm:mb-3 text-sm sm:text-base">
                Company
              </h4>
              <ul className="space-y-1 sm:space-y-2 text-xs sm:text-sm text-gray-600">
                <li>
                  <a href="#" className="hover:text-green-500">
                    About Us
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-green-500">
                    Careers
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-green-500">
                    Press
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2 sm:mb-3 text-sm sm:text-base">
                Categories
              </h4>
              <ul className="space-y-1 sm:space-y-2 text-xs sm:text-sm text-gray-600">
                <li>
                  <a href="#" className="hover:text-green-500">
                    Food & Groceries
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-green-500">
                    Electronics
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-green-500">
                    Real Estate
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2 sm:mb-3 text-sm sm:text-base">
                Support
              </h4>
              <ul className="space-y-1 sm:space-y-2 text-xs sm:text-sm text-gray-600">
                <li>
                  <a href="#" className="hover:text-green-500">
                    Help Center
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-green-500">
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-green-500">
                    Privacy Policy
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-200 pt-6 sm:pt-8 mt-6 sm:mt-8 text-center">
            <p className="text-gray-500 text-xs sm:text-sm">
              &copy; 2024 Tastyaana. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
