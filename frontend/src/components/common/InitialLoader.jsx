import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

const InitialLoader = () => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Show loader on every page load/refresh
    document.body.style.overflow = 'hidden';
    
    // Set timeout to hide loader
    const timer = setTimeout(() => {
      setIsLoading(false);
      document.body.style.overflow = 'auto';
    }, 2500);
    
    return () => {
      clearTimeout(timer);
      document.body.style.overflow = 'auto';
    };
  }, []);

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div 
          className="fixed inset-0 bg-white z-[9999] flex flex-col items-center justify-center"
          initial={{ opacity: 1 }}
          exit={{ 
            opacity: 0,
            transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] }
          }}
        >
            
          <motion.div 
            className="relative"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ 
              scale: 1, 
              opacity: 1,
              transition: { 
                duration: 0.6,
                ease: [0.4, 0, 0.2, 1]
              }
            }}
          >
            {/* Logo/Text */}
            <motion.div 
              className="text-4xl md:text-5xl font-bold text-orange-500 relative"
              initial={{ y: 0 }}
              animate={{
                y: [0, -10, 0],
                transition: {
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }
              }}
            >
              Tastyaana
              <motion.span 
                className="absolute -bottom-2 left-0 w-full h-1 bg-orange-400 rounded-full"
                initial={{ scaleX: 0 }}
                animate={{
                  scaleX: 1,
                  transition: {
                    duration: 0.8,
                    ease: [0.4, 0, 0.2, 1]
                  }
                }}
              />
            </motion.div>

            {/* Loading Dots */}
            <motion.div className="flex justify-center mt-8 space-x-2">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-3 h-3 bg-orange-500 rounded-full"
                  initial={{ y: 0 }}
                  animate={{
                    y: [0, -10, 0],
                    transition: {
                      duration: 1.2,
                      repeat: Infinity,
                      delay: i * 0.15,
                      ease: "easeInOut"
                    }
                  }}
                />
              ))}
            </motion.div>
          </motion.div>

          {/* Tea Leaf Decoration */}
          <motion.div 
            className="absolute bottom-10 text-gray-400 text-sm"
            initial={{ opacity: 0 }}
            animate={{ 
              opacity: 1,
              transition: { delay: 0.5 }
            }}
          >
            Brewing your experience...
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default InitialLoader;
