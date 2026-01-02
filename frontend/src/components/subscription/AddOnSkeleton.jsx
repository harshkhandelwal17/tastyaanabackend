import React from 'react';

/**
 * Skeleton loading component for add-on cards
 */
const AddOnSkeleton = () => {
  return (
    <div className="border border-gray-200 rounded-lg p-4 animate-pulse">
      <div className="flex justify-between items-start mb-3">
        <div className="w-3/4 h-6 bg-gray-200 rounded"></div>
        <div className="w-16 h-6 bg-gray-200 rounded"></div>
      </div>
      
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 rounded w-full"></div>
        <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        <div className="h-4 bg-gray-200 rounded w-2/3"></div>
      </div>
      
      <div className="mt-4 flex justify-between items-center">
        <div className="h-8 w-24 bg-gray-200 rounded-md"></div>
        <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
      </div>
    </div>
  );
};

export default AddOnSkeleton;
