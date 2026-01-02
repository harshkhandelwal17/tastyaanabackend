import React, { useState, useEffect } from "react";
import {
  Home,
  Search,
  ArrowLeft,
  ShoppingBag,
  Phone,
  Mail,
  RefreshCw,
  Lightbulb,
  Star,
  Heart,
} from "lucide-react";

const ErrorPage404 = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [showFloatingElements, setShowFloatingElements] = useState(true);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const popularPages = [
    { name: "Home", path: "/", icon: Home, description: "Back to homepage" },
    {
      name: "Shop",
      path: "/products",
      icon: ShoppingBag,
      description: "Browse our products",
    },
    {
      name: "Contact",
      path: "/contact",
      icon: Phone,
      description: "Get in touch with us",
    },
    {
      name: "Support",
      path: "/contact",
      icon: Mail,
      description: "Need help?",
    },
  ];

  const suggestions = [
    "Check the URL for typos",
    "Go back to the previous page",
    "Visit our homepage",
    "Try searching for what you need",
    "Contact our support team",
  ];

  const floatingElements = [
    { icon: "🔍", delay: 0 },
    { icon: "🏠", delay: 1 },
    { icon: "💡", delay: 2 },
    { icon: "⭐", delay: 3 },
    { icon: "🛒", delay: 4 },
  ];

  const handleSearch = (e) => {
    e.preventDefault();
    // console.log("Searching for:", searchQuery);
    // In a real implementation, this would redirect to search results
  };

  const ParallaxEye = ({ x, y }) => {
    const eyeX = (mousePosition.x - x) * 0.05;
    const eyeY = (mousePosition.y - y) * 0.05;

    return (
      <div className="relative w-16 h-16 bg-white rounded-full border-4 border-gray-300 flex items-center justify-center">
        <div
          className="w-6 h-6 bg-gray-800 rounded-full transition-transform duration-100"
          style={{ transform: `translate(${eyeX}px, ${eyeY}px)` }}
        >
          <div className="w-2 h-2 bg-white rounded-full mt-1 ml-1"></div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 relative overflow-hidden">
      {/* Floating Background Elements */}
      {showFloatingElements && (
        <div className="absolute inset-0 pointer-events-none">
          {floatingElements.map((element, index) => (
            <div
              key={index}
              className="absolute text-6xl opacity-10 animate-bounce"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${element.delay}s`,
                animationDuration: `${3 + Math.random() * 2}s`,
              }}
            >
              {element.icon}
            </div>
          ))}
        </div>
      )}

      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          {/* Main 404 Visual */}
          <div className="mb-8">
            <div className="relative inline-block">
              {/* Large 404 Text */}
              <div className="text-9xl md:text-[12rem] font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 leading-none">
                4
                <span className="relative inline-block mx-4">
                  <span className="text-gray-300">0</span>
                  {/* Animated Eyes in the 0 */}
                  <div className="absolute inset-0 flex items-center justify-center space-x-2">
                    <ParallaxEye x={100} y={100} />
                    <ParallaxEye x={200} y={100} />
                  </div>
                </span>
                4
              </div>

              {/* Floating Elements around 404 */}
              <div className="absolute -top-8 -left-8 animate-pulse">
                <Star className="w-8 h-8 text-yellow-400 fill-yellow-400" />
              </div>
              <div
                className="absolute -top-4 -right-12 animate-bounce"
                style={{ animationDelay: "0.5s" }}
              >
                <Heart className="w-6 h-6 text-red-400 fill-red-400" />
              </div>
              <div
                className="absolute -bottom-8 left-1/4 animate-pulse"
                style={{ animationDelay: "1s" }}
              >
                <Lightbulb className="w-10 h-10 text-blue-400" />
              </div>
            </div>
          </div>

          {/* Error Message */}
          <div className="mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Oops! Page Not Found
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-6">
              The page you're looking for seems to have vanished into thin air!
            </p>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              Don't worry though, even the best explorers sometimes take a wrong
              turn. Let's get you back on track with some helpful options below.
            </p>
          </div>

          {/* Search Bar */}
          <div className="mb-8">
            <div className="bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Try searching instead
              </h3>
              <div onSubmit={handleSearch} className="space-y-4">
                <div className="relative">
                  <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="What are you looking for?"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <button
                  onClick={handleSearch}
                  className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <Search className="w-4 h-4" />
                  <span>Search</span>
                </button>
              </div>
            </div>
          </div>

          {/* Quick Navigation */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">
              Quick Navigation
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
              {popularPages.map((page, index) => {
                const Icon = page.icon;
                return (
                  <a
                    key={index}
                    href={page.path}
                    className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 group"
                  >
                    <div className="text-center">
                      <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-blue-200 transition-colors">
                        <Icon className="w-6 h-6 text-blue-600" />
                      </div>
                      <h4 className="font-semibold text-gray-900 mb-1">
                        {page.name}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {page.description}
                      </p>
                    </div>
                  </a>
                );
              })}
            </div>
          </div>

          {/* Helpful Suggestions */}
          <div className="mb-8">
            <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl mx-auto">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Here's what you can try:
              </h3>
              <ul className="space-y-2 text-left">
                {suggestions.map((suggestion, index) => (
                  <li key={index} className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                    <span className="text-gray-700">{suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={() => window.history.back()}
              className="flex items-center space-x-2 bg-gray-600 text-white px-8 py-3 rounded-lg hover:bg-gray-700 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Go Back</span>
            </button>

            <a
              href="/"
              className="flex items-center space-x-2 bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Home className="w-5 h-5" />
              <span>Home Page</span>
            </a>

            <button
              onClick={() => window.location.reload()}
              className="flex items-center space-x-2 bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 transition-colors"
            >
              <RefreshCw className="w-5 h-5" />
              <span>Refresh</span>
            </button>
          </div>

          {/* Footer Message */}
          <div className="mt-12 text-center">
            <p className="text-gray-500">
              Still having trouble?
              <a
                href="/contact"
                className="text-blue-600 hover:text-blue-700 font-medium ml-1"
              >
                Contact our support team
              </a>
            </p>
          </div>
        </div>
      </div>

      {/* Decorative Bottom Wave */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
          className="w-full h-20 fill-white opacity-50"
        >
          <path d="M0,120 C300,80 600,80 900,120 C1050,140 1150,100 1200,120 L1200,120 L0,120 Z"></path>
        </svg>
      </div>

      {/* Toggle Floating Elements */}
      <button
        onClick={() => setShowFloatingElements(!showFloatingElements)}
        className="fixed bottom-4 right-4 bg-white p-3 rounded-full shadow-lg hover:shadow-xl transition-shadow z-20"
        title="Toggle animations"
      >
        <Star
          className={`w-5 h-5 ${
            showFloatingElements ? "text-yellow-500" : "text-gray-400"
          }`}
        />
      </button>
    </div>
  );
};

export default ErrorPage404;
