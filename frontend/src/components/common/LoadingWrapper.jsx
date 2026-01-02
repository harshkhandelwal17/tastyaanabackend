import React from 'react';
import { Shimmer } from './Shimmer';

export const LoadingWrapper = ({
  isLoading,
  loadingComponent = <Shimmer count={3} />,
  error = null,
  errorComponent = null,
  children,
  className = '',
  empty = false,
  emptyComponent = <div>No data available</div>,
}) => {
  if (error) {
    return errorComponent || (
      <div className={`p-4 text-red-600 bg-red-50 rounded ${className}`}>
        {error.message || 'An error occurred while loading data.'}
      </div>
    );
  }

  if (isLoading) {
    return loadingComponent;
  }

  if (empty) {
    return emptyComponent;
  }

  return children;
};

export const withLoading = (Component, options = {}) => {
  return function WithLoadingWrapper({ isLoading, error, ...props }) {
    return (
      <LoadingWrapper isLoading={isLoading} error={error} {...options}>
        <Component {...props} />
      </LoadingWrapper>
    );
  };
};
