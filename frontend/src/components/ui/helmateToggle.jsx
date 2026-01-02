import { motion } from "framer-motion";
import { useState } from "react";

export default function ExtraHelmetToggle() {
  const [extraHelmet, setExtraHelmet] = useState(false);
  const [helmetCount, setHelmetCount] = useState(1);

  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200 shadow-sm">
      {/* Left */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-xl shadow">
          🪖
        </div>
        <div>
          <p className="font-semibold text-sm text-gray-800">Extra Helmet</p>
          <p className="text-xs text-gray-500">₹50 per helmet</p>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-3">
        {/* Count Box (Only when ON) */}
        {extraHelmet && (
          <div className="flex items-center gap-1 bg-white rounded-lg px-2 py-1 border border-gray-200 shadow-sm">
            <button
              onClick={() => setHelmetCount(Math.max(1, helmetCount - 1))}
              className="w-5 h-5 flex items-center justify-center text-gray-600 hover:bg-gray-100 rounded text-sm"
            >
              -
            </button>
            <span className="w-6 text-center text-sm font-semibold text-gray-800">
              {helmetCount}
            </span>
            <button
              onClick={() => setHelmetCount(Math.min(4, helmetCount + 1))}
              className="w-5 h-5 flex items-center justify-center text-gray-600 hover:bg-gray-100 rounded text-sm"
            >
              +
            </button>
          </div>
        )}

        {/* Dynamic Price */}
        <span className="text-green-600 font-semibold text-sm">
          +₹{extraHelmet ? helmetCount * 50 : 50}
        </span>

        {/* Toggle Button */}
        <button
          onClick={() => {
            setExtraHelmet(!extraHelmet);
            if (!extraHelmet) setHelmetCount(1); // Reset when turning ON
          }}
          className={`relative w-14 h-7 rounded-full transition-colors duration-300 ${
            extraHelmet ? "bg-green-500" : "bg-gray-400"
          }`}
        >
          <motion.div
            layout
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow"
            animate={{ x: extraHelmet ? 30 : 0 }}
          />
        </button>
      </div>
    </div>
  );
}
