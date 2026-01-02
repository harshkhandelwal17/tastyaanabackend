import React from 'react';
import { Clock, Star } from 'lucide-react';

export const PlanDetailsCard = ({ plan }) => {
  if (!plan) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Plan Details</h2>
          <p className="text-gray-600 mb-4">{plan.description}</p>
          <div className="flex items-center text-sm text-gray-500">
            <Clock className="w-4 h-4 mr-1" />
            <span>Duration: {plan.duration} days</span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-amber-600">
            {formatCurrency(plan.price)}
            <span className="text-sm font-normal text-gray-500 ml-1">/thali</span>
          </p>
          {plan.originalPrice > plan.price && (
            <p className="text-sm text-gray-400 line-through">
              {formatCurrency(plan.originalPrice)}
            </p>
          )}
        </div>
      </div>
      
      {plan.features?.length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-medium text-gray-900 mb-2">What's included:</h3>
          <ul className="space-y-2">
            {plan.features.map((feature, index) => (
              <li key={index} className="flex items-start">
                <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                <span className="text-gray-600">{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default PlanDetailsCard;
