import React, { useEffect, useState } from "react";
import axios from "axios";

const getToday = () => new Date().toISOString().slice(0, 10);

const ProfileDailyPlan = ({ user }) => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [todayPlan, setTodayPlan] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { data } = await axios.get("/api/subscriptions?status=active");
      setSubscriptions(data.data.subscriptions);
      const today = getToday();
      let plan = null;
      for (const sub of data.data.subscriptions) {
        const replacement = sub.replacements?.find(
          (r) => r.date.slice(0, 10) === today
        );
        if (replacement) {
          plan = {
            ...replacement,
            type: "replacement",
            planTitle: sub.planId?.title,
            timing:
              sub.timingOverrides?.find((t) => t.date.slice(0, 10) === today)?.timing ||
              (sub.deliverySlots.lunch ? "Lunch" : "Dinner"),
          };
          break;
        }
        if (
          new Date(sub.startDate) <= new Date(today) &&
          new Date(today) <= new Date(sub.endDate)
        ) {
          plan = {
            ...sub,
            type: "main",
            planTitle: sub.planId?.title,
            timing:
              sub.timingOverrides?.find((t) => t.date.slice(0, 10) === today)?.timing ||
              (sub.deliverySlots.lunch ? "Lunch" : "Dinner"),
          };
          break;
        }
      }
      setTodayPlan(plan);
      setLoading(false);
    };
    fetchData();
  }, []);

  if (loading) return <div className="p-6">Loading...</div>;
  if (!todayPlan)
    return (
      <div className="p-6 text-center text-gray-500">
        No active meal plan for today. <br />
        <a href="/plans" className="text-orange-600 underline">
          Subscribe now
        </a>
      </div>
    );

  return (
    <div className="bg-[#fcf8f8] rounded-2xl shadow-lg p-6 max-w-xl mx-auto my-8">
      <div className="flex items-center gap-4 mb-4">
        <img
          src={user?.avatar || "/default-avatar.png"}
          alt={user?.name}
          className="w-12 h-12 rounded-full object-cover"
        />
        <div>
          <h2 className="text-lg font-bold text-[#1b0e0e]">{user?.name}</h2>
          <p className="text-[#994d51] text-sm">View Profile</p>
        </div>
      </div>
      <h3 className="text-xl font-bold text-[#1b0e0e] mb-2">Today's Meal</h3>
      <div className="flex items-center gap-4 bg-[#f3e7e8] rounded-lg p-4 mb-4">
        <img
          src={todayPlan?.planId?.imageUrls?.[0] || "/api/placeholder/100/100"}
          alt={todayPlan?.planTitle}
          className="w-16 h-16 rounded-lg object-cover"
        />
        <div>
          <div className="font-semibold text-[#1b0e0e]">{todayPlan?.planTitle || "Custom Meal"}</div>
          <div className="text-sm text-[#994d51]">
            Timing: {todayPlan?.timing}
          </div>
          {todayPlan?.addOns?.length > 0 && (
            <div className="text-xs text-[#994d51] mt-1">
              Add-ons: {todayPlan.addOns.map((a) => `${a.name} x${a.quantity}`).join(", ")}
            </div>
          )}
        </div>
      </div>
      <div className="flex gap-2">
        {subscriptions.some(sub => sub.planId?.category === 'mealplan' && sub.status === 'active') ? (
          <button
            className="bg-orange-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-orange-700 transition"
            onClick={() => {
              // Open modal to customize/replace today's meal
            }}
          >
            Customize/Replace
          </button>
        ) : null}
        <button
          className="bg-[#f3e7e8] text-[#1b0e0e] px-4 py-2 rounded-lg font-semibold hover:bg-[#f3e7e8]/80 transition"
          onClick={() => {
            // Open modal to add add-ons
          }}
        >
          Add Add-ons
        </button>
      </div>
    </div>
  );
};

// In your main profile page render:
// <ProfileDailyPlan user={user} /> 