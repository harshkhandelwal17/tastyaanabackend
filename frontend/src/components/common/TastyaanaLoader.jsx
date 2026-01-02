import React from 'react';
import { Loader2 } from 'lucide-react';

const TastyaanaLoader = ({ size = 'md', text = 'Loading...', className = '' }) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
  };

  const textSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className="relative">
        <Loader2 
          className={`${sizeClasses[size] || sizeClasses['md']} animate-spin text-orange-500`} 
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-orange-500 font-bold text-xs">T</span>
        </div>
      </div>
      {text && (
        <p className={`mt-2 text-gray-600 ${textSizes[size] || textSizes['md']}`}>
          {text}
        </p>
      )}
    </div>
  );
};

export default TastyaanaLoader;
