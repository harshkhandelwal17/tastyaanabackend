import React, { useState, useEffect } from "react";
import {
  X,
  Sparkles,
  Gift,
  TrendingUp,
  Rocket,
  PartyPopper,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import "./NewYearCelebration.css";

const NewYearCelebration = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Show modal after 1 second on page load
    const timer = setTimeout(() => {
      setIsOpen(true);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    // Store in localStorage to not show again for this session
    sessionStorage.setItem("newYearModalShown", "true");
  };

  const handleExplore = () => {
    setIsOpen(false);
    // Navigate to deals/offers section
    window.location.hash = "#deals";
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="celebration-overlay"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 50 }}
            transition={{ type: "spring", duration: 0.6, bounce: 0.4 }}
            className="celebration-modal"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <motion.button
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              className="close-button"
              onClick={handleClose}
            >
              <X size={24} />
            </motion.button>

            {/* Animated Background Elements */}
            <div className="floating-elements">
              {[...Array(20)].map((_, i) => (
                <motion.div
                  key={i}
                  className="particle"
                  initial={{
                    x: Math.random() * 400 - 200,
                    y: Math.random() * 600 - 300,
                    scale: Math.random() * 0.5 + 0.5,
                    opacity: 0,
                  }}
                  animate={{
                    y: [null, -1000],
                    opacity: [0, 1, 0],
                    rotate: [0, 360],
                  }}
                  transition={{
                    duration: Math.random() * 3 + 2,
                    repeat: Infinity,
                    delay: Math.random() * 2,
                  }}
                />
              ))}
            </div>

            {/* Main Content Card */}
            <motion.div
              className="celebration-card"
              initial={{ rotateY: -180, opacity: 0 }}
              animate={{ rotateY: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.8 }}
            >
              {/* Fireworks Background */}
              <div className="fireworks-bg">
                <div className="firework"></div>
                <div className="firework"></div>
                <div className="firework"></div>
              </div>

              {/* Celebration Badge */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
                className="celebration-badge"
              >
                <Sparkles className="icon-left" />
                <span>CELEBRATION MODE ON</span>
                <PartyPopper className="icon-right" />
              </motion.div>

              {/* Title */}
              <motion.div
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.7, duration: 0.6 }}
                className="title-container"
              >
                <h2 className="title-new-year">NEW YEAR</h2>
                <motion.h1
                  className="title-bash"
                  animate={{
                    textShadow: [
                      "0 0 20px rgba(255,255,255,0.5)",
                      "0 0 40px rgba(255,255,255,0.8)",
                      "0 0 20px rgba(255,255,255,0.5)",
                    ],
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  BASH
                </motion.h1>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.9, type: "spring" }}
                  className="year-badge"
                >
                  2026
                </motion.div>
              </motion.div>

              {/* Subtitle */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.1 }}
                className="subtitle"
              >
                Tasty deliveries & swift rides to
                <br />
                kickstart your year!
              </motion.p>
            </motion.div>

            {/* Party Offers Section */}
            {/*
             <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 1.3, duration: 0.6 }}
              className="offers-section"
            >
              <div className="offers-header">
                <Gift className="star-icon" />
                <h3>Party Offers</h3>
              </div>

              <div className="offers-grid">
                
                <motion.div
                  whileHover={{ scale: 1.05, y: -5 }}
                  whileTap={{ scale: 0.95 }}
                  className="offer-card offer-card-pink"
                >
                  <div className="rupee-icon">₹</div>
                  <div className="offer-content">
                    <p className="offer-label">GET</p>
                    <p className="offer-amount">₹300</p>
                    <p className="offer-type">OFF</p>
                  </div>
                  <div className="card-shine"></div>
                </motion.div>

               
                <motion.div
                  whileHover={{ scale: 1.05, y: -5 }}
                  whileTap={{ scale: 0.95 }}
                  className="offer-card offer-card-orange"
                >
                  <div className="food-icon">🍔</div>
                  <div className="offer-content">
                    <p className="offer-label-main">Party</p>
                    <p className="offer-label-main">Specials</p>
                    <p className="offer-badge">HOT DEALS</p>
                  </div>
                  <div className="card-shine"></div>
                </motion.div>
              </div>

              
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="limited-offer"
              >
                <div className="limited-content">
                  <p className="limited-label">LIMITED TIME</p>
                  <p className="limited-title">FLAT 50% OFF</p>
                  <p className="limited-desc">On all party orders above ₹500</p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1, x: 5 }}
                  whileTap={{ scale: 0.9 }}
                  className="arrow-button"
                >
                  <TrendingUp size={28} />
                </motion.button>
              </motion.div>*/}

            {/* CTA Buttons */}
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 1.5, duration: 0.6 }}
              className="cta-buttons"
            >
              <motion.button
                whileHover={{
                  scale: 1.05,
                  boxShadow: "0 10px 40px rgba(138, 43, 226, 0.5)",
                }}
                whileTap={{ scale: 0.95 }}
                className="explore-button"
                onClick={handleExplore}
              >
                <Rocket className="button-icon" />
                Explore New Year Deals
              </motion.button>

              {/* <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="later-button"
                onClick={handleClose}
              >
                Maybe Later
              </motion.button> */}
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default NewYearCelebration;
