import { useState, useEffect } from 'react';

/**
 * Custom hook for animated dynamic placeholders
 * Cycles through an array of placeholder texts with typing animation
 */
const useDynamicPlaceholder = (placeholders, options = {}) => {
  const {
    typingSpeed = 100,      // Speed of typing animation (ms per character)
    pauseDuration = 2000,   // Pause between complete words (ms)
    deletingSpeed = 50,     // Speed of deleting animation (ms per character)
    startDelay = 1000,      // Initial delay before starting animation
  } = options;

  const [currentPlaceholder, setCurrentPlaceholder] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(true);
  const [charIndex, setCharIndex] = useState(0);

  useEffect(() => {
    if (placeholders.length === 0) return;

    const currentText = placeholders[currentIndex];
    let timeoutId;

    if (isTyping) {
      // Typing animation
      if (charIndex < currentText.length) {
        timeoutId = setTimeout(() => {
          setCurrentPlaceholder(currentText.slice(0, charIndex + 1));
          setCharIndex(charIndex + 1);
        }, typingSpeed);
      } else {
        // Finished typing, pause then start deleting
        timeoutId = setTimeout(() => {
          setIsTyping(false);
        }, pauseDuration);
      }
    } else {
      // Deleting animation
      if (charIndex > 0) {
        timeoutId = setTimeout(() => {
          setCurrentPlaceholder(currentText.slice(0, charIndex - 1));
          setCharIndex(charIndex - 1);
        }, deletingSpeed);
      } else {
        // Finished deleting, move to next placeholder
        setIsTyping(true);
        setCurrentIndex((prevIndex) => (prevIndex + 1) % placeholders.length);
      }
    }

    return () => clearTimeout(timeoutId);
  }, [currentIndex, charIndex, isTyping, placeholders, typingSpeed, pauseDuration, deletingSpeed]);

  // Add cursor effect
  const placeholderWithCursor = currentPlaceholder + (isTyping ? '|' : '');

  return {
    placeholder: placeholderWithCursor,
    isTyping,
    currentIndex,
    reset: () => {
      setCurrentIndex(0);
      setCharIndex(0);
      setIsTyping(true);
      setCurrentPlaceholder('');
    }
  };
};

export default useDynamicPlaceholder;