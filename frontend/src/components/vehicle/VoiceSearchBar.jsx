import React from "react";
import { Search, Mic, MicOff, SlidersHorizontal } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import useVoiceSearch from "../../hooks/useVoiceSearch";
import useDynamicPlaceholder from "../../hooks/useDynamicPlaceholder";

const VoiceSearchBar = ({
  searchQuery,
  onSearchChange,
  onVoiceSearch,
  onFilterClick,
  className = "",
}) => {
  const {
    isListening,
    transcript,
    interimTranscript,
    isSupported,
    error,
    startListening,
    stopListening,
    resetTranscript,
    getFiltersFromTranscript,
  } = useVoiceSearch();

  // Dynamic placeholder texts
  const placeholderTexts = [
    "Search bikes...",
    "Search electric vehicles...",
    "Search cars...",
    "Search scooters...",
    "Search by location...",
    "Search by fuel type...",
    "Search 4 seaters...",
    "Search luxury vehicles...",
    "Search budget rides...",
    "Search nearby vehicles...",

    // "launching soon...",
    // "New Categories...",
    // "More Options...",
    // "Better Experience...",
    // "Stay Tuned...",
  ];

  // Dynamic placeholder hook
  const { placeholder: dynamicPlaceholder } = useDynamicPlaceholder(
    placeholderTexts,
    {
      typingSpeed: 80,
      pauseDuration: 2500,
      deletingSpeed: 40,
      startDelay: 1000,
    }
  );

  // Handle voice search toggle
  const handleVoiceToggle = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  // When transcript is finalized, process it
  React.useEffect(() => {
    if (transcript && !isListening) {
      const filters = getFiltersFromTranscript(transcript);
      onVoiceSearch(transcript, filters);
      // Reset after a delay
      setTimeout(() => resetTranscript(), 2000);
    }
  }, [
    transcript,
    isListening,
    getFiltersFromTranscript,
    onVoiceSearch,
    resetTranscript,
  ]);

  const displayText = interimTranscript || transcript || searchQuery;

  return (
    <div className={`relative ${className}`}>
      {/* Search Bar Container */}
      <div className="relative flex items-center gap-1.5 sm:gap-2 bg-white rounded-xl sm:rounded-2xl shadow-md px-3 sm:px-4 py-2 sm:py-3 transition-all duration-300 hover:shadow-lg">
        {/* Search Icon */}
        <Search className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0 " />

        {/* Input Field */}
        <input
          type="text"
          value={displayText}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={
            isListening ? "Listening..." : displayText ? "" : dynamicPlaceholder
          }
          className="flex-1 outline-none text-sm sm:text-base text-gray-700 placeholder-gray-400 bg-transparent dynamic-placeholder"
          disabled={isListening}
        />

        {/* Voice Search Button */}
        {isSupported && (
          <motion.button
            onClick={handleVoiceToggle}
            className={`p-1.5 sm:p-2 rounded-full transition-all duration-300 flex items-center justify-center ${
              isListening
                ? "bg-red-500 text-white"
                : "bg-green-500 text-white hover:bg-green-600"
            }`}
            whileTap={{ scale: 0.95 }}
            aria-label={isListening ? "Stop listening" : "Start voice search"}
          >
            <AnimatePresence mode="wait">
              {isListening ? (
                <motion.div
                  key="mic-off"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="flex items-center justify-center"
                >
                  <MicOff className="w-4 h-4 sm:w-5 sm:h-5" />
                </motion.div>
              ) : (
                <motion.div
                  key="mic-on"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="flex items-center justify-center"
                >
                  <Mic className="w-4 h-4 sm:w-5 sm:h-5" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        )}

        {/* Filter Button */}
        <motion.button
          onClick={onFilterClick}
          className="p-1.5 sm:p-2 rounded-full bg-green-500 text-white hover:bg-green-600 transition-colors flex items-center justify-center"
          whileTap={{ scale: 0.95 }}
          aria-label="Open filters"
        >
          <SlidersHorizontal className="w-4 h-4 sm:w-5 sm:h-5" />
        </motion.button>
      </div>

      {/* Listening Animation */}
      <AnimatePresence>
        {isListening && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 bg-green-50 border border-green-200 rounded-lg p-3 shadow-md"
          >
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-1 bg-green-500 rounded-full"
                    animate={{
                      height: ["8px", "16px", "8px"],
                    }}
                    transition={{
                      duration: 0.8,
                      repeat: Infinity,
                      delay: i * 0.2,
                    }}
                  />
                ))}
              </div>
              <span className="text-sm text-green-700 font-medium">
                {interimTranscript || "Listening..."}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Message */}
      <AnimatePresence>
        {error && !isListening && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 bg-red-50 border border-red-200 rounded-lg p-3 shadow-md"
          >
            <p className="text-sm text-red-700">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Message */}
      <AnimatePresence>
        {transcript && !isListening && !error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 bg-green-50 border border-green-200 rounded-lg p-3 shadow-md"
          >
            <p className="text-sm text-green-700">
              <span className="font-medium">Heard:</span> "{transcript}"
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VoiceSearchBar;
