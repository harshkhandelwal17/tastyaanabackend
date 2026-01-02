import React from "react";
import { CheckCircle, Star, Crown, Package, Users } from "lucide-react";

const PricingTable = ({
  plans = [],
  billingCycle = "monthly",
  selectedPlan = "",
  onSelectPlan = () => {},
  className = "",
}) => {
  const getPlanIcon = (planId) => {
    switch (planId) {
      case "basic":
        return Package;
      case "premium":
        return Crown;
      case "family":
        return Users;
      default:
        return Package;
    }
  };

  const getDiscountPercentage = (monthlyPrice, yearlyPrice) => {
    if (!monthlyPrice || !yearlyPrice) return 0;
    const monthlyCost = monthlyPrice * 12;
    return Math.round(((monthlyCost - yearlyPrice) / monthlyCost) * 100);
  };

  if (!plans || plans.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        No pricing plans available
      </div>
    );
  }

  return (
    <div className={`grid lg:grid-cols-3 gap-8 ${className}`}>
      {plans.map((plan) => {
        const IconComponent = getPlanIcon(plan.id);
        const price =
          billingCycle === "yearly" ? plan.yearlyPrice : plan.monthlyPrice;
        const monthlyEquivalent =
          billingCycle === "yearly"
            ? Math.round(plan.yearlyPrice / 12)
            : plan.monthlyPrice;
        const discount = getDiscountPercentage(
          plan.monthlyPrice,
          plan.yearlyPrice
        );
        const isSelected = selectedPlan === plan.id;

        return (
          <div
            key={plan.id}
            className={`relative bg-white rounded-2xl shadow-lg border-2 transition-all duration-300 hover:shadow-xl ${
              plan.popular
                ? "border-emerald-500 scale-105"
                : isSelected
                ? "border-emerald-500"
                : "border-gray-200 hover:border-emerald-300"
            }`}
          >
            {/* Popular Badge */}
            {plan.popular && (
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-6 py-2 rounded-full text-sm font-semibold flex items-center gap-2">
                  <Star className="w-4 h-4" />
                  Most Popular
                </div>
              </div>
            )}

            {/* Plan Header */}
            <div
              className={`bg-gradient-to-br ${
                plan.gradient || "from-gray-500 to-gray-600"
              } text-white rounded-t-2xl p-6`}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <IconComponent className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold">{plan.name}</h3>
                  <p className="text-white/80 text-sm">{plan.tagline}</p>
                </div>
              </div>

              {/* Price */}
              <div className="mb-4">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold">
                    ₹{monthlyEquivalent}
                  </span>
                  <span className="text-white/80">/month</span>
                </div>

                {billingCycle === "yearly" && discount > 0 && (
                  <div className="text-white/80 text-sm mt-1">
                    <span className="line-through">
                      ₹{plan.monthlyPrice * 12}
                    </span>
                    <span className="ml-2 font-semibold">
                      ₹{plan.yearlyPrice} billed yearly
                    </span>
                    <div className="text-emerald-200 font-semibold">
                      Save {discount}% annually
                    </div>
                  </div>
                )}
              </div>

              {/* Key Metrics */}
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{plan.weight}</div>
                  <div className="text-white/80 text-sm">Per Month</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{plan.orders}</div>
                  <div className="text-white/80 text-sm">Per Month</div>
                </div>
              </div>
            </div>

            {/* Plan Features */}
            <div className="p-6">
              <div className="space-y-4 mb-8">
                <h4 className="font-semibold text-gray-900 text-lg">
                  What's Included:
                </h4>

                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700 text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* Not Included */}
                {plan.notIncluded && plan.notIncluded.length > 0 && (
                  <>
                    <h4 className="font-semibold text-gray-900 text-sm mt-6 mb-3">
                      Not Included:
                    </h4>
                    <ul className="space-y-2">
                      {plan.notIncluded.map((feature, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <div className="w-5 h-5 border-2 border-gray-300 rounded-full flex-shrink-0 mt-0.5" />
                          <span className="text-gray-500 text-sm">
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>

              {/* Select Button */}
              <button
                onClick={() => onSelectPlan(plan.id)}
                className={`w-full py-4 px-6 rounded-xl font-semibold transition-all duration-200 ${
                  isSelected
                    ? "bg-emerald-600 text-white hover:bg-emerald-700 ring-2 ring-emerald-500 ring-offset-2"
                    : plan.popular
                    ? "bg-emerald-600 text-white hover:bg-emerald-700"
                    : "bg-gray-900 text-white hover:bg-gray-800"
                }`}
                disabled={isSelected}
              >
                {isSelected ? "Selected Plan" : "Choose This Plan"}
              </button>

              {/* Additional Info */}
              <div className="mt-4 text-center">
                <p className="text-xs text-gray-500">
                  {billingCycle === "yearly"
                    ? "Billed annually"
                    : "Billed monthly"}{" "}
                  • Cancel anytime
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default PricingTable;
