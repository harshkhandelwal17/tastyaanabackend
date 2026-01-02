import React, { useState } from 'react';
import { CouponManagement, CouponUsage } from '../../features/coupons';
import { Tab } from '@headlessui/react';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

const CouponManagementPage = () => {
  const [selectedTab, setSelectedTab] = useState(0);
  const [selectedCoupon, setSelectedCoupon] = useState(null);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Coupon & Discount Management</h1>
      
      <Tab.Group selectedIndex={selectedTab} onChange={setSelectedTab}>
        <Tab.List className="flex space-x-1 rounded-xl bg-blue-900/20 p-1">
          <Tab
            key="coupons"
            className={({ selected }) =>
              classNames(
                'w-full rounded-lg py-2.5 text-sm font-medium leading-5 text-blue-700',
                'ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2',
                selected
                  ? 'bg-white shadow'
                  : 'text-blue-100 hover:bg-white/[0.12] hover:text-white'
              )
            }
          >
            Manage Coupons
          </Tab>
          <Tab
            key="usage"
            disabled={!selectedCoupon}
            className={({ selected }) =>
              classNames(
                'w-full rounded-lg py-2.5 text-sm font-medium leading-5',
                'ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2',
                selectedCoupon
                  ? selected
                    ? 'bg-white shadow text-blue-700'
                    : 'text-blue-100 hover:bg-white/[0.12] hover:text-white'
                  : 'text-gray-400 cursor-not-allowed'
              )
            }
          >
            View Usage
          </Tab>
        </Tab.List>
        <Tab.Panels className="mt-4">
          <Tab.Panel>
            <CouponManagement onSelectCoupon={setSelectedCoupon} />
          </Tab.Panel>
          <Tab.Panel>
            {selectedCoupon ? (
              <div className="mt-4">
                <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                  <h3 className="text-lg font-medium">Selected Coupon: {selectedCoupon.code}</h3>
                  <p className="text-sm text-gray-600">{selectedCoupon.description || 'No description'}</p>
                </div>
                <CouponUsage couponId={selectedCoupon._id} />
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500">Select a coupon to view its usage history</p>
              </div>
            )}
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>
    </div>
  );
};

export default CouponManagementPage;
