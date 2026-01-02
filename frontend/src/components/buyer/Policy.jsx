import React from "react";
import { AlertCircle, Clock, DollarSign, Package } from "lucide-react";

const TiffinPolicySection = () => {
  const policies = [
    {
      icon: <Package className="w-6 h-6 text-orange-600" />,
      title: "Empty Tiffin Return",
      description:
        "Tiffin containers must be completely empty when returned. Any leftover food will result in penalty charges.",
    },
    {
      icon: <Clock className="w-6 h-6 text-blue-600" />,
      title: "Daily Collection Time",
      description:
        "Please keep empty tiffins outside daily at the scheduled pickup time. Late placement may cause collection delays.",
    },
    {
      icon: <DollarSign className="w-6 h-6 text-red-600" />,
      title: "Penalty Charges",
      description:
        "₹10 penalty will be charged for dirty/non-empty tiffins. ₹200 for lost or damaged containers.",
    },
    {
      icon: <AlertCircle className="w-6 h-6 text-yellow-600" />,
      title: "Hygiene Standards",
      description:
        "Rinse containers with water before returning. Maintain basic cleanliness to avoid health issues.",
    },
  ];

  return (
    <section className="max-w-5xl mx-auto px-1 sm:px-3 py-3 bg-white">
      {/* Heading */}
      <div className="mb-8 text-center">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
          Meal Plans Policy
        </h2>
        <p className="text-gray-600 text-sm sm:text-base max-w-2xl mx-auto">
          Please follow these guidelines to ensure smooth service delivery and
          maintain hygiene standards.
        </p>
      </div>

      {/* Policies Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {policies.map((policy, index) => (
          <div
            key={index}
            className="bg-gray-50 rounded-xl p-1 border border-gray-200 hover:shadow-md transition-shadow duration-300"
          >
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-10 p-3 bg-white rounded-full border border-gray-200">
                {policy.icon}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-1">
                  {policy.title}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {policy.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Important Note */}
      <div className="mt-8 p-5 bg-blue-50 border border-blue-200 rounded-xl">
        <div className="flex items-start space-x-3">
          <AlertCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-blue-800 mb-1 text-base sm:text-lg">
              Important Note
            </h4>
            <p className="text-blue-700 text-sm sm:text-base">
              Following these policies helps us maintain quality service for all
              subscribers. For any queries, contact our customer support team.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TiffinPolicySection;
