import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Sparkles } from 'lucide-react';
import { PlanCard } from '../../../components/laundry/PlanCard';
import laundryService from '../../../services/laundryService';

export const PlansPage = ({ vendors }) => {
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [billingCycle, setBillingCycle] = useState('monthly');

  useEffect(() => {
    loadPlans();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vendors]);

  const loadPlans = async () => {
    try {
      setLoading(true);
      // Load plans from vendors
      const allPlans = [];
      
      if (!vendors || vendors.length === 0) {
        console.log('No vendors available to load plans from');
        setPlans([]);
        return;
      }
      
      for (const vendor of vendors) {
        try {
          const response = await laundryService.getVendorPlans(vendor._id);
          // Backend returns: { success: true, data: { vendorName, plans: [...] } }
          // Service interceptor returns response.data, so we get: { success: true, data: { vendorName, plans: [...] } }
          const plansData = response?.data || response;
          const vendorPlans = plansData?.plans || [];
          
          if (vendorPlans.length > 0) {
            allPlans.push(...vendorPlans.map(plan => ({ 
              ...plan, 
              vendor: {
                _id: vendor._id,
                name: vendor.name || plansData?.vendorName,
                logo: vendor.logo,
                rating: vendor.rating
              }
            })));
          }
        } catch (error) {
          console.error(`Error loading plans for vendor ${vendor._id}:`, error);
          // Continue with other vendors even if one fails
        }
      }
      
      console.log('Loaded plans:', allPlans.length);
      setPlans(allPlans);
    } catch (error) {
      console.error('Error loading plans:', error);
      setPlans([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = (plan) => {
    // Navigate to customization page with plan and vendor data
    navigate('/laundry/subscriptions/customize', {
      state: {
        plan: plan,
        vendor: plan.vendor
      }
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 bg-gradient-to-r from-yellow-400 to-orange-400 text-white px-6 py-3 rounded-full font-bold mb-6">
            <Sparkles className="w-6 h-6" />
            Save More with Plans
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-4">Subscription Plans</h1>
          <p className="text-gray-600 text-xl">Choose a plan that fits your laundry needs</p>
        </div>

        {/* Billing Cycle Toggle */}
        <div className="flex justify-center mb-12">
          <div className="bg-white rounded-2xl p-2 shadow-lg">
            {['monthly', 'quarterly', 'yearly'].map(cycle => (
              <button
                key={cycle}
                onClick={() => setBillingCycle(cycle)}
                className={`px-8 py-3 rounded-xl font-bold transition-all capitalize ${
                  billingCycle === cycle
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {cycle}
              </button>
            ))}
          </div>
        </div>

        {/* Plans Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 bg-white rounded-3xl shadow-xl">
            <Loader2 className="w-12 h-12 animate-spin text-emerald-600 mb-4" />
            <p className="text-gray-600 font-medium">Loading plans...</p>
          </div>
        ) : plans.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl shadow-xl">
            <Sparkles className="w-20 h-20 text-gray-300 mx-auto mb-4" />
            <h3 className="text-2xl font-semibold text-gray-700 mb-2">No plans available</h3>
            <p className="text-gray-500">Check back later for subscription plans</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {plans.map(plan => (
              <PlanCard 
                key={plan.id || plan._id} 
                plan={plan} 
                vendor={plan.vendor}
                onSubscribe={handleSubscribe}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
