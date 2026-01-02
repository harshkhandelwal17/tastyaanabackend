import React, { useState, useEffect } from "react";
import {
  motion,
  AnimatePresence,
  useScroll,
  useTransform,
} from "framer-motion";
import { useDispatch, useSelector } from "react-redux";
import {
  Users,
  Target,
  Award,
  Globe,
  Heart,
  Utensils,
  Shield,
  Leaf,
  Clock,
  Star,
  ChevronRight,
  Play,
} from "lucide-react";

const AboutPage = () => {
  const [activeValue, setActiveValue] = useState(0);
  const [playingVideo, setPlayingVideo] = useState(false);
  const [visibleMilestone, setVisibleMilestone] = useState(null);

  // Updated color palette from the Indian sweets image
  const colors = {
    terracotta: "#bb5d43", // Clay plate color
    beige: "#f4e6d1", // Light background color
    cream: "#f3e1b6", // Light gujiya color
    golden: "#e5a639", // Golden/amber color from sweets
    deepBrown: "#4b2c17", // Deep brown text color
    lightBrown: "#8d5c37", // Medium brown from ladoos
    white: "#ffffff", // White for contrast
    primary: "#c17840", // Warm terracotta/amber
    primaryLight: "#f8efdc", // Light cream color
    secondary: "#d98c31", // Golden shade
    accent: "#e5b163", // Light golden accent
    deepAccent: "#7d4320", // Deep rich brown
    text: "#432818", // Rich brown text
    textLight: "#6b503a", // Lighter brown text
  };

  // Scroll-based animations
  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0, 0.1], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.1], [1, 0.95]);

  const dispatch = useDispatch();

  useEffect(() => {
    // dispatch(fetchCart());
    // dispatch(fetchWishlist());
    // dispatch(fetchOrders());
  }, [dispatch]);

  // Use Redux state for user/cart/wishlist/orders if needed

  const stats = [
    { number: "50K+", label: "Happy Customers", icon: Users },
    { number: "100+", label: "Products", icon: Globe },
    { number: "15+", label: "Countries", icon: Award },
    { number: "99.9%", label: "Uptime", icon: Shield },
  ];

  const values = [
    {
      title: "Farm to Table",
      description:
        "We source the freshest ingredients directly from local farms and producers.",
      icon: Leaf,
      color: colors.secondary,
    },
    {
      title: "Customer Focus",
      description:
        "Every dish we create is centered around providing the best dining experience for our customers.",
      icon: Heart,
      color: colors.terracotta,
    },
    {
      title: "Culinary Excellence",
      description:
        "We maintain the highest standards in food quality and chef expertise.",
      icon: Award,
      color: colors.deepAccent,
    },
    {
      title: "Traditional Recipes",
      description:
        "Our dishes honor time-tested family recipes passed down through generations.",
      icon: Clock,
      color: colors.lightBrown,
    },
  ];

  const team = [
    {
      name: "Sarah Johnson",
      role: "Executive Chef & Founder",
      image:
        "https://images.unsplash.com/photo-1494790108755-2616b612b83c?w=300",
      bio: "Culinary master with 15+ years in fine dining",
    },
    {
      name: "Michael Chen",
      role: "Head of Culinary Innovation",
      image:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300",
      bio: "Food expert passionate about fusion cuisine",
    },
    {
      name: "Emily Rodriguez",
      role: "Pastry Chef",
      image:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300",
      bio: "Award-winning pastry artist with global influence",
    },
    {
      name: "David Thompson",
      role: "Restaurant Manager",
      image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=300",
      bio: "Hospitality expert ensuring exceptional dining experiences",
    },
  ];

  const milestones = [
    {
      year: "2000",
      title: "First Restaurant",
      description:
        "Started with a small family restaurant in the heart of the city",
      icon: "🍽️",
    },
    {
      year: "2005",
      title: "Award Recognition",
      description: "Received our first culinary excellence award",
      icon: "🏆",
    },
    {
      year: "2010",
      title: "Regional Expansion",
      description: "Opened locations in 5 neighboring cities",
      icon: "🏙️",
    },
    {
      year: "2015",
      title: "Signature Dishes",
      description: "Launched our critically acclaimed tasting menu",
      icon: "✨",
    },
    {
      year: "2020",
      title: "Community Growth",
      description: "Built a loyal community of 50K+ regular diners",
      icon: "👥",
    },
    {
      year: "2025",
      title: "Future Vision",
      description: "Expanding our sustainable farming practices",
      icon: "🌱",
    },
  ];

  // Handle intersection observer for timeline items
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleMilestone(parseInt(entry.target.dataset.index));
          }
        });
      },
      { threshold: 0.7 }
    );

    document.querySelectorAll(".milestone-item").forEach((item) => {
      observer.observe(item);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#f9f3e6" }}>
      {/* Hero Section */}
      <motion.div
        className="relative p-10 pt-15"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        {/* Beautiful food-themed background */}
        <div className="absolute inset-0 overflow-hidden">
          <div
            className="absolute inset-0 bg-gradient-to-b"
            style={{
              backgroundImage: `linear-gradient(to bottom, "#f9f3e6", "#f9f3e6")`,
            }}
          ></div>

          {/* Background pattern - subtle food elements */}
          <motion.div
            className="absolute inset-0"
            style={{
              backgroundImage: `
                radial-gradient(circle at 20% 30%, ${colors.terracotta}40 0%, transparent 8%),
                radial-gradient(circle at 80% 40%, ${colors.golden}60 0%, transparent 10%),
                radial-gradient(circle at 40% 80%, ${colors.lightBrown}20 0%, transparent 15%),
                radial-gradient(circle at 85% 15%, ${colors.golden}30 0%, transparent 12%)
              `,
              backgroundSize: "100% 100%",
            }}
            animate={{
              backgroundPosition: ["0% 0%", "2% 2%", "0% 0%"],
            }}
            transition={{ repeat: Infinity, duration: 15, ease: "easeInOut" }}
          />

          {/* Decorative food illustrations */}
          <motion.div
            className="absolute top-20 left-[5%] opacity-10 w-20 h-20"
            style={{
              backgroundImage:
                'url(\'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%23c17840" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>\')',
              backgroundSize: "contain",
              backgroundRepeat: "no-repeat",
            }}
            animate={{ y: [0, -10, 0], rotate: [0, 5, 0] }}
            transition={{ repeat: Infinity, duration: 8, ease: "easeInOut" }}
          />

          <motion.div
            className="absolute top-[15%] right-[8%] opacity-10 w-32 h-32"
            style={{
              backgroundImage:
                'url(\'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%237d4320" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>\')',
              backgroundSize: "contain",
              backgroundRepeat: "no-repeat",
            }}
            animate={{ y: [0, 15, 0], rotate: [0, -5, 0] }}
            transition={{ repeat: Infinity, duration: 10, ease: "easeInOut" }}
          />

          <motion.div
            className="absolute bottom-[20%] left-[15%] opacity-10 w-24 h-24"
            style={{
              backgroundImage:
                'url(\'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%23d98c31" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a10 10 0 1 0 10 10H2A10 10 0 0 0 12 2z"/><path d="M7 10.5L5.5 12l1.5 1.5"/><path d="M12 7.5L10.5 9l1.5 1.5"/><path d="M17 10.5L18.5 12l-1.5 1.5"/><path d="M12 16.5l1.5-1.5-1.5-1.5"/></svg>\')',
              backgroundSize: "contain",
              backgroundRepeat: "no-repeat",
            }}
            animate={{ x: [0, 15, 0], rotate: [0, 10, 0] }}
            transition={{ repeat: Infinity, duration: 12, ease: "easeInOut" }}
          />

          <motion.div
            className="absolute bottom-[10%] right-[20%] opacity-10 w-28 h-28"
            style={{
              backgroundImage:
                'url(\'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%23c17840" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M8.21 13.89L7 23l9-9-8.48 2.58"/><path d="M15 2.2a2 2 0 0 1 2.3-.14l2.82 1.7a2 2 0 0 1 .72 2.7L11 23 2 19l9.84-17.12a2 2 0 0 1 3.16.32z"/></svg>\')',
              backgroundSize: "contain",
              backgroundRepeat: "no-repeat",
            }}
            animate={{ x: [0, -10, 0], rotate: [0, -8, 0] }}
            transition={{ repeat: Infinity, duration: 14, ease: "easeInOut" }}
          />
        </div>

        <motion.div
          className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24"
          style={{ scale, opacity }}
        >
          <motion.div
            className="text-center"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <h1
              className="text-5xl md:text-6xl font-bold mb-6"
              style={{ color: colors.deepBrown }}
            >
              About Savoria
            </h1>
            <p
              className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto"
              style={{ color: colors.text }}
            >
              We're passionate about bringing you the finest culinary
              experiences with fresh ingredients, traditional recipes, and
              exceptional service.
            </p>
            <motion.div
              className="flex justify-center"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <button
                onClick={() => setPlayingVideo(true)}
                className="flex items-center space-x-2 px-8 py-3 rounded-full font-semibold shadow-lg hover:shadow-xl transition-all text-white"
                style={{ backgroundColor: colors.primary }}
              >
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                >
                  <Play className="w-5 h-5" />
                </motion.div>
                <span>Watch Our Story</span>
              </button>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Decorative elements */}
        <motion.div
          className="absolute top-10 left-10 w-20 h-20 rounded-full opacity-30"
          style={{ backgroundColor: colors.golden }}
          animate={{
            x: [0, 10, 0],
            y: [0, -10, 0],
          }}
          transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-10 right-10 w-32 h-32 rounded-full opacity-20"
          style={{ backgroundColor: colors.cream }}
          animate={{
            x: [0, -15, 0],
            y: [0, 15, 0],
          }}
          transition={{ repeat: Infinity, duration: 7, ease: "easeInOut" }}
        />
      </motion.div>

      {/* Stats Section */}
      <div className="py-16" style={{ backgroundColor: colors.white }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={index}
                  className="text-center"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <motion.div
                    className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                    style={{ backgroundColor: colors.golden }}
                    whileHover={{ scale: 1.1, rotate: 5 }}
                  >
                    <Icon className="w-8 h-8 text-white" />
                  </motion.div>
                  <motion.div
                    className="text-3xl font-bold mb-2"
                    style={{ color: colors.deepBrown }}
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                  >
                    {stat.number}
                  </motion.div>
                  <div style={{ color: colors.textLight }}>{stat.label}</div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Story Section */}
      <div className="py-16 relative overflow-hidden">
        {/* Background with subtle texture and pattern */}
        <div className="absolute inset-0">
          <div
            className="absolute inset-0"
            style={{ backgroundColor: colors.cream + "60" }}
          ></div>

          {/* Wooden texture background */}
          <div
            className="absolute inset-0 opacity-10"
            style={{
              // backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%23${colors.lightBrown.replace('#', '')}' fill-opacity='1' fill-rule='evenodd'/%3E%3C/svg%3E")`,
              backgroundSize: "150px 150px",
            }}
          ></div>

          {/* Decorative elements */}
          <motion.div
            className="absolute top-1/4 right-[5%] w-32 h-32 rounded-full opacity-20"
            style={{ backgroundColor: colors.terracotta }}
            animate={{
              x: [0, -15, 0],
              y: [0, 15, 0],
            }}
            transition={{ repeat: Infinity, duration: 10, ease: "easeInOut" }}
          />

          <motion.div
            className="absolute bottom-1/4 left-[5%] w-40 h-40 rounded-full opacity-15"
            style={{ backgroundColor: colors.golden }}
            animate={{
              x: [0, 20, 0],
              y: [0, -20, 0],
            }}
            transition={{ repeat: Infinity, duration: 12, ease: "easeInOut" }}
          />

          {/* Herbs and spices illustrations */}
          <motion.div
            className="absolute top-[15%] left-[15%] w-16 h-16 opacity-20"
            style={{
              backgroundImage:
                'url(\'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%23d98c31" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v8"/><path d="M5 6.5l14 4"/><path d="M5 13.5l14-4"/><path d="M12 22v-8"/></svg>\')',
              backgroundSize: "contain",
              backgroundRepeat: "no-repeat",
            }}
            animate={{ rotate: [0, 15, 0] }}
            transition={{ repeat: Infinity, duration: 8, ease: "easeInOut" }}
          />

          <motion.div
            className="absolute bottom-[20%] right-[15%] w-24 h-24 opacity-20"
            style={{
              backgroundImage:
                'url(\'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%23c17840" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M2 2l10 10-10 10V2zM12 12l10 10V2L12 12z"/></svg>\')',
              backgroundSize: "contain",
              backgroundRepeat: "no-repeat",
            }}
            animate={{ rotate: [0, -10, 0] }}
            transition={{ repeat: Infinity, duration: 10, ease: "easeInOut" }}
          />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              <h2
                className="text-4xl font-bold mb-6"
                style={{ color: colors.deepBrown }}
              >
                Our Story
              </h2>
              <div className="space-y-4 text-lg" style={{ color: colors.text }}>
                <p>
                  Founded in 2025, Savoria began as a simple idea: to share our
                  family's cherished recipes with the community. What started as
                  a small neighborhood restaurant has grown into a beloved
                  dining destination with locations across the region.
                </p>
                <p>
                  Our journey has been driven by an unwavering commitment to
                  quality, tradition, and customer satisfaction. We believe that
                  food should bring people together and create lasting memories.
                </p>
                <p>
                  Today, we're proud to be trusted by over 50,000 loyal
                  customers across 15 locations, offering everything from casual
                  dining to elegant catering services for special occasions.
                </p>
              </div>
              <motion.div
                className="mt-8"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <button
                  className="px-8 py-3 rounded-lg text-white shadow-lg hover:shadow-xl transition-all"
                  style={{ backgroundColor: colors.primary }}
                >
                  Learn More About Us
                </button>
              </motion.div>
            </motion.div>
            <motion.div
              className="relative"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.2 }}
            >
              <motion.div
                whileHover={{ scale: 1.03, rotate: 1 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <img
                  src="https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=600"
                  alt="Our office"
                  className="rounded-lg shadow-xl"
                />
                <div
                  className="absolute inset-0 rounded-lg"
                  style={{ backgroundColor: `${colors.golden}30` }}
                ></div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Values Section */}
      <div className="py-16" style={{ backgroundColor: colors.white }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2
              className="text-4xl font-bold mb-4"
              style={{ color: colors.deepBrown }}
            >
              Our Values
            </h2>
            <p
              className="text-xl max-w-3xl mx-auto"
              style={{ color: colors.textLight }}
            >
              These core principles guide every dish we create and shape the way
              we serve our guests.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => {
              const Icon = value.icon;
              return (
                <motion.div
                  key={index}
                  className={`bg-white p-6 rounded-lg shadow-lg cursor-pointer transition-all ${
                    activeValue === index ? "ring-2" : ""
                  }`}
                  style={{
                    ringColor: colors.primary,
                    boxShadow:
                      activeValue === index
                        ? "0 10px 25px -5px rgba(0, 0, 0, 0.1)"
                        : "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                  }}
                  onMouseEnter={() => setActiveValue(index)}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{
                    y: -5,
                    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
                  }}
                >
                  <motion.div
                    className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4`}
                    style={{ backgroundColor: value.color }}
                    whileHover={{ rotate: 10 }}
                  >
                    <Icon className="w-6 h-6 text-white" />
                  </motion.div>
                  <h3
                    className="text-xl font-semibold mb-2"
                    style={{ color: colors.deepBrown }}
                  >
                    {value.title}
                  </h3>
                  <p style={{ color: colors.text }}>{value.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Timeline Section - Enhanced with animations */}
      <div className="py-16" style={{ backgroundColor: colors.beige }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2
              className="text-4xl font-bold mb-4"
              style={{ color: colors.deepBrown }}
            >
              Our Journey
            </h2>
            <p className="text-xl" style={{ color: colors.text }}>
              Key milestones in our growth story
            </p>
          </motion.div>

          <div className="relative">
            {/* Timeline line */}
            <motion.div
              className="absolute left-1/2 transform -translate-x-1/2 w-1"
              style={{
                height: "100%",
                background: `linear-gradient(to bottom, transparent, ${colors.primary}40, transparent)`,
              }}
              initial={{ height: 0 }}
              whileInView={{ height: "100%" }}
              viewport={{ once: true }}
              transition={{ duration: 1 }}
            ></motion.div>

            <div className="space-y-16">
              {milestones.map((milestone, index) => (
                <motion.div
                  key={index}
                  className={`flex items-center milestone-item ${
                    index % 2 === 0 ? "flex-row" : "flex-row-reverse"
                  }`}
                  data-index={index}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <motion.div
                    className={`w-1/2 ${
                      index % 2 === 0 ? "pr-8 text-right" : "pl-8 text-left"
                    }`}
                    initial={{ x: index % 2 === 0 ? -50 : 50, opacity: 0 }}
                    whileInView={{ x: 0, opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{
                      type: "spring",
                      stiffness: 100,
                      delay: 0.2,
                      duration: 0.8,
                    }}
                  >
                    <motion.div
                      className="bg-white p-6 rounded-lg shadow-lg"
                      whileHover={{ scale: 1.03 }}
                      style={{
                        boxShadow:
                          visibleMilestone === index
                            ? "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
                            : "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                      }}
                    >
                      <motion.div
                        animate={{
                          scale: visibleMilestone === index ? [1, 1.1, 1] : 1,
                        }}
                        transition={{ duration: 0.5, times: [0, 0.5, 1] }}
                      >
                        <span className="text-3xl mb-2 inline-block">
                          {milestone.icon}
                        </span>
                      </motion.div>
                      <div
                        className="text-lg font-bold mb-1"
                        style={{ color: colors.primary }}
                      >
                        {milestone.year}
                      </div>
                      <h3
                        className="text-xl font-semibold mb-2"
                        style={{ color: colors.deepBrown }}
                      >
                        {milestone.title}
                      </h3>
                      <p style={{ color: colors.text }}>
                        {milestone.description}
                      </p>
                    </motion.div>
                  </motion.div>

                  <motion.div
                    className="relative z-10"
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ type: "spring", stiffness: 300, delay: 0.3 }}
                  >
                    <motion.div
                      className={`w-6 h-6 rounded-full border-4 border-white shadow-lg`}
                      style={{ backgroundColor: colors.golden }}
                      animate={{
                        scale: visibleMilestone === index ? [1, 1.2, 1] : 1,
                        boxShadow:
                          visibleMilestone === index
                            ? "0 0 0 8px rgba(229, 166, 57, 0.2)"
                            : "none",
                      }}
                      transition={{
                        duration: 1,
                        repeat: visibleMilestone === index ? Infinity : 0,
                        repeatDelay: 1,
                      }}
                    ></motion.div>
                  </motion.div>

                  <div className="w-1/2"></div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Team Section */}
      <div className="py-16" style={{ backgroundColor: colors.white }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2
              className="text-4xl font-bold mb-4"
              style={{ color: colors.deepBrown }}
            >
              Meet Our Team
            </h2>
            <p className="text-xl" style={{ color: colors.textLight }}>
              The passionate culinary artists behind Savoria
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {team.map((member, index) => (
              <motion.div
                key={index}
                className="bg-white rounded-lg shadow-lg overflow-hidden"
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{
                  y: -10,
                  boxShadow:
                    "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                }}
              >
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <img
                    src={member.image}
                    alt={member.name}
                    className="w-full h-64 object-cover"
                  />
                </motion.div>
                <div className="p-6">
                  <h3
                    className="text-xl font-semibold mb-1"
                    style={{ color: colors.deepBrown }}
                  >
                    {member.name}
                  </h3>
                  <p
                    className="font-medium mb-2"
                    style={{ color: colors.primary }}
                  >
                    {member.role}
                  </p>
                  <p style={{ color: colors.text }}>{member.bio}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Mission Section */}
      <div className="py-16 relative overflow-hidden">
        {/* Rich background with food imagery */}
        <div className="absolute inset-0">
          {/* Base gradient */}
          <div
            className="absolute inset-0"
            style={{ backgroundColor: colors.terracotta }}
          ></div>

          {/* Wooden texture overlay */}
          <div
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='42' height='44' viewBox='0 0 42 44' xmlns='http://www.w3.org/2000/svg'%3E%3Cg id='Page-1' fill='none' fill-rule='evenodd'%3E%3Cg id='brick-wall' fill='%23${colors.deepAccent.replace(
                "#",
                ""
              )}' fill-opacity='0.4'%3E%3Cpath d='M0 0h42v44H0V0zm1 1h40v20H1V1zM0 23h20v20H0V23zm22 0h20v20H22V23z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          ></div>

          {/* Subtle food pattern */}
          <div className="absolute inset-0 opacity-10">
            <svg className="absolute h-full w-full" width="100%" height="100%">
              <defs>
                <pattern
                  id="food-pattern"
                  patternUnits="userSpaceOnUse"
                  width="100"
                  height="100"
                >
                  <path
                    d="M20 20c5.523 0 10-4.477 10-10S25.523 0 20 0 10 4.477 10 10s4.477 10 10 10z"
                    fill={colors.cream}
                    fillOpacity="0.6"
                  />
                  <path
                    d="M80 20c5.523 0 10-4.477 10-10S85.523 0 80 0 70 4.477 70 10s4.477 10 10 10z"
                    fill={colors.primary}
                    fillOpacity="0.4"
                  />
                  <path
                    d="M20 80c5.523 0 10-4.477 10-10s-4.477-10-10-10-10 4.477-10 10 4.477 10 10 10z"
                    fill={colors.secondary}
                    fillOpacity="0.5"
                  />
                  <path
                    d="M80 80c5.523 0 10-4.477 10-10s-4.477-10-10-10-10 4.477-10 10 4.477 10 10 10z"
                    fill={colors.cream}
                    fillOpacity="0.3"
                  />
                  <path
                    d="M50 50c5.523 0 10-4.477 10-10s-4.477-10-10-10-10 4.477-10 10 4.477 10 10 10z"
                    fill={colors.deepAccent}
                    fillOpacity="0.5"
                  />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#food-pattern)" />
            </svg>
          </div>

          {/* Moving decorative elements */}
          <motion.div
            className="absolute top-1/3 left-10 w-16 h-16 rounded-full opacity-20"
            style={{ backgroundColor: colors.cream }}
            animate={{ y: [0, -20, 0] }}
            transition={{ repeat: Infinity, duration: 8, ease: "easeInOut" }}
          />

          <motion.div
            className="absolute bottom-1/4 right-10 w-20 h-20 rounded-full opacity-15"
            style={{ backgroundColor: colors.golden }}
            animate={{ y: [0, 15, 0] }}
            transition={{ repeat: Infinity, duration: 7, ease: "easeInOut" }}
          />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <motion.div
              animate={{
                rotateZ: [0, 10, -10, 0],
              }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              className="inline-block"
            >
              <Target className="w-16 h-16 mx-auto mb-6 text-white" />
            </motion.div>
            <h2 className="text-4xl font-bold mb-6 text-white">Our Mission</h2>
            <p className="text-xl max-w-4xl mx-auto mb-8 text-white">
              To democratize access to cutting-edge technology by providing
              high-quality products, exceptional customer service, and
              innovative solutions that enhance everyday life for people around
              the world.
            </p>
            <motion.button
              className="text-gray-800 px-8 py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all"
              style={{ backgroundColor: colors.cream }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Join Our Journey
            </motion.button>
          </motion.div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-16" style={{ backgroundColor: colors.white }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2
              className="text-3xl font-bold mb-4"
              style={{ color: colors.deepBrown }}
            >
              Ready to Experience Our Cuisine?
            </h2>
            <p className="text-xl mb-8" style={{ color: colors.textLight }}>
              Join thousands of satisfied guests who trust Savoria for their
              dining experiences and special occasions.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.button
                className="text-white px-8 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all"
                style={{ backgroundColor: colors.primary }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Reserve a Table
              </motion.button>
              <motion.button
                className="border px-8 py-3 rounded-lg shadow-md hover:shadow-lg transition-all"
                style={{ borderColor: colors.primary, color: colors.primary }}
                whileHover={{
                  scale: 1.05,
                  backgroundColor: `${colors.primary}10`,
                }}
                whileTap={{ scale: 0.95 }}
              >
                View Our Menu
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Floating accent elements */}
      <motion.div
        className="fixed top-1/4 right-0 w-32 h-32 rounded-l-full opacity-10 pointer-events-none"
        style={{ backgroundColor: colors.golden }}
        animate={{ x: [10, -10, 10], y: [0, 10, 0] }}
        transition={{ repeat: Infinity, duration: 15, ease: "easeInOut" }}
      />
      <motion.div
        className="fixed bottom-1/4 left-0 w-24 h-24 rounded-r-full opacity-10 pointer-events-none"
        style={{ backgroundColor: colors.terracotta }}
        animate={{ x: [-10, 10, -10], y: [10, -10, 10] }}
        transition={{ repeat: Infinity, duration: 12, ease: "easeInOut" }}
      />

      {/* Video Modal */}
      <AnimatePresence>
        {playingVideo && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-lg p-4 max-w-4xl w-full"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25 }}
            >
              <div className="text-center">
                <h3
                  className="text-xl font-semibold"
                  style={{ color: colors.deepBrown }}
                >
                  Our Story Video
                </h3>
                <button
                  onClick={() => setPlayingVideo(false)}
                  className="p-2 hover:text-gray-700"
                  style={{ color: colors.textLight }}
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                >
                  ✕
                </button>
              </div>
              <motion.div
                className="aspect-video rounded-lg flex items-center justify-center"
                style={{ backgroundColor: colors.beige }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <div
                  style={{ color: colors.deepBrown }}
                  className="text-center"
                >
                  <motion.div
                    animate={{
                      scale: [1, 1.1, 1],
                      opacity: [0.8, 1, 0.8],
                    }}
                    transition={{ repeat: Infinity, duration: 2 }}
                  >
                    <Play className="w-16 h-16 mx-auto mb-4" />
                  </motion.div>
                  <p>Savoria's Culinary Journey</p>
                  <p className="text-sm opacity-75">
                    In a real implementation, this would be a video player
                  </p>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AboutPage;
