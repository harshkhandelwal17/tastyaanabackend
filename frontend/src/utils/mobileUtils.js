// Mobile utility functions and responsive helpers

export const isMobile = () => {
  return window.innerWidth < 768;
};

export const isTablet = () => {
  return window.innerWidth >= 768 && window.innerWidth < 1024;
};

export const isDesktop = () => {
  return window.innerWidth >= 1024;
};

// Responsive classes for different screen sizes
export const responsiveClasses = {
  // Grid layouts
  grid: {
    single: 'grid-cols-1',
    double: 'grid-cols-1 sm:grid-cols-2',
    triple: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    quad: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
    auto: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
  },
  
  // Padding and margins
  spacing: {
    container: 'px-4 sm:px-6 lg:px-8',
    section: 'py-4 sm:py-6 lg:py-8',
    card: 'p-4 sm:p-6'
  },
  
  // Typography
  text: {
    heading: 'text-xl sm:text-2xl lg:text-3xl',
    subheading: 'text-lg sm:text-xl',
    body: 'text-sm sm:text-base',
    small: 'text-xs sm:text-sm'
  },
  
  // Buttons
  button: {
    primary: 'px-3 py-2 sm:px-4 sm:py-2 text-sm sm:text-base',
    secondary: 'px-2 py-1 sm:px-3 sm:py-2 text-xs sm:text-sm',
    icon: 'p-2 sm:p-3'
  },
  
  // Tables
  table: {
    container: 'overflow-x-auto -mx-4 sm:mx-0',
    cell: 'px-2 py-3 sm:px-6 sm:py-4',
    text: 'text-xs sm:text-sm'
  },
  
  // Cards
  card: {
    base: 'rounded-lg shadow-sm border',
    padding: 'p-4 sm:p-6',
    spacing: 'space-y-3 sm:space-y-4'
  },
  
  // Forms
  form: {
    input: 'px-3 py-2 text-sm sm:text-base',
    select: 'px-3 py-2 text-sm sm:text-base',
    label: 'text-sm sm:text-base font-medium'
  }
};

// Mobile-specific component configurations
export const mobileConfig = {
  // Table configurations for mobile
  tableBreakpoints: {
    hideColumns: ['sm:table-cell', 'md:table-cell', 'lg:table-cell'],
    showOnMobile: 'table-cell',
    hideOnMobile: 'hidden sm:table-cell'
  },
  
  // Modal configurations
  modal: {
    mobile: 'fixed inset-0 z-50',
    desktop: 'fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4'
  },
  
  // Navigation
  navigation: {
    mobile: 'fixed bottom-0 left-0 right-0 bg-white border-t',
    desktop: 'hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0'
  }
};

// Touch event handlers for mobile
export const touchHandlers = {
  // Swipe detection
  handleTouchStart: (e, callback) => {
    const touch = e.touches[0];
    callback({
      startX: touch.clientX,
      startY: touch.clientY,
      startTime: Date.now()
    });
  },
  
  handleTouchEnd: (e, startData, onSwipe) => {
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - startData.startX;
    const deltaY = touch.clientY - startData.startY;
    const deltaTime = Date.now() - startData.startTime;
    
    // Minimum swipe distance and maximum time
    const minSwipeDistance = 50;
    const maxSwipeTime = 500;
    
    if (deltaTime < maxSwipeTime) {
      if (Math.abs(deltaX) > minSwipeDistance && Math.abs(deltaX) > Math.abs(deltaY)) {
        // Horizontal swipe
        onSwipe(deltaX > 0 ? 'right' : 'left');
      } else if (Math.abs(deltaY) > minSwipeDistance && Math.abs(deltaY) > Math.abs(deltaX)) {
        // Vertical swipe
        onSwipe(deltaY > 0 ? 'down' : 'up');
      }
    }
  }
};

// Viewport utilities
export const viewport = {
  // Get current viewport dimensions
  getViewport: () => ({
    width: window.innerWidth,
    height: window.innerHeight
  }),
  
  // Check if element is visible in viewport
  isElementVisible: (element) => {
    const rect = element.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  },
  
  // Scroll to element with mobile-friendly offset
  scrollToElement: (element, offset = 0) => {
    const elementTop = element.offsetTop;
    const mobileOffset = isMobile() ? 60 : 0; // Account for mobile header
    
    window.scrollTo({
      top: elementTop - offset - mobileOffset,
      behavior: 'smooth'
    });
  }
};

// Performance utilities for mobile
export const mobilePerformance = {
  // Debounce function for touch events
  debounce: (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },
  
  // Throttle function for scroll events
  throttle: (func, limit) => {
    let inThrottle;
    return function() {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },
  
  // Lazy load images for mobile
  lazyLoadImage: (img, src) => {
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            img.src = src;
            img.classList.remove('lazy');
            observer.unobserve(img);
          }
        });
      });
      observer.observe(img);
    } else {
      // Fallback for browsers without IntersectionObserver
      img.src = src;
    }
  }
};

export default {
  isMobile,
  isTablet,
  isDesktop,
  responsiveClasses,
  mobileConfig,
  touchHandlers,
  viewport,
  mobilePerformance
};