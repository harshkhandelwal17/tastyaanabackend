// export const VendorList = ({ vendors, loading, onVendorClick }) => {
//   if (loading) {
//     return (
//       <div className="flex items-center justify-center h-64">
//         <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
//       </div>
//     );
//   }

//   if (!vendors || vendors.length === 0) {
//     return (
//       <div className="text-center py-12">
//         <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
//         <h3 className="text-xl font-semibold text-gray-700 mb-2">No vendors found</h3>
//         <p className="text-gray-500">Try adjusting your filters</p>
//       </div>
//     );
//   }

//   return (
//     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//       {vendors.map(vendor => (
//         <VendorCard 
//           key={vendor._id} 
//           vendor={vendor} 
//           onClick={onVendorClick}
//         />
//       ))}
//     </div>
//   );
// };
import React from 'react';
import { Loader2, Package } from 'lucide-react';
import VendorCard from './VendorCard';

export const VendorList = ({ vendors, loading, onVendorClick }) => {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-white rounded-2xl shadow-lg">
        <Loader2 className="w-12 h-12 animate-spin text-emerald-600 mb-4" />
        <p className="text-gray-600 font-medium">Loading vendors...</p>
      </div>
    );
  }

  if (!vendors || vendors.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-2xl shadow-lg">
        <Package className="w-20 h-20 text-gray-300 mx-auto mb-4" />
        <h3 className="text-2xl font-semibold text-gray-700 mb-2">No vendors found</h3>
        <p className="text-gray-500">Try adjusting your filters or search terms</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {vendors.map(vendor => (
        <VendorCard 
          key={vendor._id} 
          vendor={vendor} 
          onClick={onVendorClick}
        />
      ))}
    </div>
  );
};
