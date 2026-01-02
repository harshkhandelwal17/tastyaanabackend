import React, { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

// Loading component for lazy-loaded components
const LoadingSpinner = ({ message = "Loading..." }) => (
  <div className="flex items-center justify-center min-h-[200px]">
    <div className="text-center">
      <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-orange-500" />
      <p className="text-gray-600">{message}</p>
    </div>
  </div>
);

// Error boundary for lazy-loaded components
class LazyErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Lazy component error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="text-center">
            <p className="text-red-600 mb-2">Failed to load component</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
            >
              Retry
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Lazy loader wrapper component
const LazyLoader = ({ 
  component: LazyComponent, 
  fallback = <LoadingSpinner />,
  errorFallback = null 
}) => {
  return (
    <LazyErrorBoundary>
      <Suspense fallback={fallback}>
        <LazyComponent />
      </Suspense>
    </LazyErrorBoundary>
  );
};

// Preload utility for better UX
export const preloadComponent = (importFunc) => {
  return () => {
    const Component = React.lazy(importFunc);
    return <Component />;
  };
};

// Common lazy components
export const LazyHomePage = preloadComponent(() => import('../../pages/buyer/OptimizedHomePage'));
export const LazyProductPage = preloadComponent(() => import('../../pages/buyer/Productpage'));
export const LazyProductDetail = preloadComponent(() => import('../../pages/buyer/ProductDetailpage'));
export const LazyCartPage = preloadComponent(() => import('../../pages/buyer/CartPage'));
export const LazyCheckoutPage = preloadComponent(() => import('../../pages/buyer/Checkoutpage'));
export const LazyProfilePage = preloadComponent(() => import('../../pages/buyer/ProfilePage'));
export const LazyAdminDashboard = preloadComponent(() => import('../../pages/admin/adminDashboard'));

export default LazyLoader; 