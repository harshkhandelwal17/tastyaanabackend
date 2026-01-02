import React from 'react';

const Shimmer = ({ count = 1, className = '', height = '20px', width = '100%', rounded = 'md' }) => {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div 
          key={i}
          className="animate-pulse bg-gray-200 dark:bg-gray-700"
          style={{
            height,
            width,
            borderRadius: rounded === 'full' ? '9999px' : '0.375rem',
          }}
        />
      ))}
    </div>
  );
};

export const ShimmerCard = ({ className = '', lines = 3 }) => (
  <div className={`bg-white dark:bg-gray-800 rounded-lg p-4 shadow ${className}`}>
    <Shimmer count={1} height="120px" width="100%" className="mb-3" />
    <Shimmer count={lines} height="16px" width="100%" className="mb-1" />
  </div>
);

export default Shimmer;
