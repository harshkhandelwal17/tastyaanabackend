// Responsive utility functions and breakpoint helpers

export const breakpoints = {
  xs: '480px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px'
};

// Mobile-first responsive classes
export const responsiveClasses = {
  // Container classes
  container: {
    base: 'w-full mx-auto px-4',
    sm: 'sm:px-6',
    lg: 'lg:px-8',
    xl: 'xl:max-w-7xl'
  },
  
  // Grid responsive classes
  grid: {
    // Product grids
    products: {
      mobile: 'grid grid-cols-2 gap-3',
      tablet: 'sm:grid-cols-3 sm:gap-4',
      desktop: 'md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6'
    },
    
    // Category grids
    categories: {
      mobile: 'grid grid-cols-2 gap-3',
      tablet: 'sm:grid-cols-3',
      desktop: 'md:grid-cols-4 lg:grid-cols-6'
    },
    
    // Feature grids
    features: {
      mobile: 'grid grid-cols-1 gap-4',
      tablet: 'sm:grid-cols-2',
      desktop: 'md:grid-cols-3 lg:grid-cols-4'
    }
  },
  
  // Typography responsive classes
  typography: {
    title: {
      mobile: 'text-2xl',
      tablet: 'sm:text-3xl',
      desktop: 'md:text-4xl lg:text-5xl'
    },
    subtitle: {
      mobile: 'text-lg',
      tablet: 'sm:text-xl',
      desktop: 'md:text-2xl'
    },
    body: {
      mobile: 'text-sm',
      tablet: 'sm:text-base',
      desktop: 'md:text-lg'
    }
  },
  
  // Spacing responsive classes
  spacing: {
    section: {
      mobile: 'py-8',
      tablet: 'sm:py-12',
      desktop: 'md:py-16'
    },
    gap: {
      small: 'gap-2 sm:gap-3 md:gap-4',
      medium: 'gap-3 sm:gap-4 md:gap-6',
      large: 'gap-4 sm:gap-6 md:gap-8'
    }
  },
  
  // Component responsive classes
  card: {
    padding: 'p-3 sm:p-4 md:p-6',
    rounded: 'rounded-xl sm:rounded-2xl'
  },
  
  button: {
    size: {
      small: 'px-3 py-2 text-sm sm:px-4 sm:py-2',
      medium: 'px-4 py-2.5 text-sm sm:px-6 sm:py-3 sm:text-base',
      large: 'px-6 py-3 sm:px-8 sm:py-4 text-base sm:text-lg'
    }
  }
};

// Device detection utilities
export const deviceUtils = {
  isMobile: () => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < 768;
  },
  
  isTablet: () => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth >= 768 && window.innerWidth < 1024;
  },
  
  isDesktop: () => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth >= 1024;
  },
  
  getDeviceType: () => {
    if (typeof window === 'undefined') return 'desktop';
    const width = window.innerWidth;
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
  }
};

// Responsive hook for React components
// Note: Import React in your component before using this hook
export const useResponsive = () => {
  // This will be used with React.useState in the component that imports it
  // const [deviceType, setDeviceType] = React.useState('desktop');
  // Implementation moved to components that use it to avoid import issues
  if (typeof window === 'undefined') {
    return {
      deviceType: 'desktop',
      windowSize: { width: 1200, height: 800 },
      isMobile: false,
      isTablet: false,
      isDesktop: true,
      width: 1200,
      height: 800
    };
  }
  
  return {
    deviceType: deviceUtils.getDeviceType(),
    windowSize: { width: window.innerWidth, height: window.innerHeight },
    isMobile: deviceUtils.isMobile(),
    isTablet: deviceUtils.isTablet(),
    isDesktop: deviceUtils.isDesktop(),
    width: window.innerWidth,
    height: window.innerHeight
  };
};

// Responsive class builder
export const buildResponsiveClass = (baseClasses, responsiveOptions = {}) => {
  let classes = baseClasses;
  
  Object.keys(responsiveOptions).forEach(breakpoint => {
    const value = responsiveOptions[breakpoint];
    if (value) {
      const prefix = breakpoint === 'base' ? '' : `${breakpoint}:`;
      classes += ` ${prefix}${value}`;
    }
  });
  
  return classes;
};

// Common responsive patterns
export const responsivePatterns = {
  // Hide on mobile, show on desktop
  hideOnMobile: 'hidden md:block',
  
  // Show on mobile, hide on desktop
  showOnMobile: 'block md:hidden',
  
  // Full width on mobile, constrained on desktop
  mobileFullWidth: 'w-full md:w-auto',
  
  // Stack on mobile, row on desktop
  mobileStack: 'flex flex-col md:flex-row',
  
  // Center on mobile, left align on desktop
  mobileCentered: 'text-center md:text-left',
  
  // Responsive padding
  responsivePadding: 'px-4 sm:px-6 lg:px-8',
  
  // Responsive margins
  responsiveMargin: 'mx-4 sm:mx-6 lg:mx-8',
  
  // Responsive font sizes
  responsiveText: {
    xs: 'text-xs sm:text-sm',
    sm: 'text-sm sm:text-base',
    base: 'text-base sm:text-lg',
    lg: 'text-lg sm:text-xl',
    xl: 'text-xl sm:text-2xl',
    '2xl': 'text-2xl sm:text-3xl',
    '3xl': 'text-3xl sm:text-4xl md:text-5xl',
    '4xl': 'text-4xl sm:text-5xl md:text-6xl'
  }
};

// Touch-friendly sizes for mobile
export const touchSizes = {
  // Minimum touch target size (44px recommended)
  minTouch: 'min-h-[44px] min-w-[44px]',
  
  // Button sizes for touch
  touchButton: 'py-3 px-4 min-h-[44px]',
  
  // Input sizes for touch
  touchInput: 'py-3 px-4 min-h-[44px]',
  
  // Icon sizes for touch
  touchIcon: 'w-6 h-6 sm:w-5 sm:h-5'
};

export default {
  breakpoints,
  responsiveClasses,
  deviceUtils,
  buildResponsiveClass,
  responsivePatterns,
  touchSizes
};