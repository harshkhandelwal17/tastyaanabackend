// src/components/MealPlan/MealPlanList.jsx
import React, { useEffect, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  useGetMealPlansQuery,
  useGetPopularMealPlansQuery,
} from "../../storee/api";
import {
  selectMealPlanQuery,
  selectViewMode,
  setCurrentPage,
  setSelectedMealPlan,
  addToCompare,
  toggleFavorite,
} from "../../storee/Slices/mealPlanSlice";
import { addToCart } from "../../storee/Slices/cartSlice";
import { addToast } from "../../storee/Slices/uiSlice";
import MealPlanCard from "./MealPlanCard";
import MealPlanFilters from "./MealPlanFilters";
import Pagination from "../common/Pagination";
import LoadingSpinner from "../common/LoadingSpinner";

const MealPlanList = () => {
  const dispatch = useDispatch();

  // Redux state
  const query = useSelector(selectMealPlanQuery);
  const viewMode = useSelector(selectViewMode);
  const { currentPage, itemsPerPage } = useSelector((state) => state.mealPlan);

  // RTK Query hooks
  const {
    data: mealPlansData,
    isLoading,
    isError,
    error,
  } = useGetMealPlansQuery(query);

  const { data: popularMealPlans, isLoading: popularLoading } =
    useGetPopularMealPlansQuery(6);

  // Handlers
  const handlePageChange = (page) => {
    dispatch(setCurrentPage(page));
  };

  const handleSelectMealPlan = (mealPlan) => {
    dispatch(setSelectedMealPlan(mealPlan._id));
  };

  const handleAddToCompare = (mealPlanId) => {
    dispatch(addToCompare(mealPlanId));
    dispatch(
      addToast({
        type: "success",
        message: "Added to comparison",
        duration: 3000,
      })
    );
  };

  const handleToggleFavorite = (mealPlanId) => {
    dispatch(toggleFavorite(mealPlanId));
    dispatch(
      addToast({
        type: "success",
        message: "Updated favorites",
        duration: 3000,
      })
    );
  };

  const handleAddToCart = (mealPlan, plan, addOns = []) => {
    dispatch(
      addToCart({
        mealPlan,
        plan,
        addOns,
        quantity: 1,
      })
    );
    dispatch(
      addToast({
        type: "success",
        message: "Added to cart",
        duration: 3000,
      })
    );
  };

  if (isLoading) return <LoadingSpinner />;
  if (isError)
    return <div className="text-red-600">Error: {error?.message}</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Popular Meal Plans Section */}
      {!popularLoading && popularMealPlans?.length > 0 && (
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-amber-800 mb-6">
            Popular Meal Plans
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {popularMealPlans.map((mealPlan) => (
              <MealPlanCard
                key={mealPlan._id}
                mealPlan={mealPlan}
                onSelect={() => handleSelectMealPlan(mealPlan)}
                onAddToCompare={() => handleAddToCompare(mealPlan._id)}
                onToggleFavorite={() => handleToggleFavorite(mealPlan._id)}
                onAddToCart={handleAddToCart}
                isPopular
              />
            ))}
          </div>
        </section>
      )}

      {/* Filters */}
      <MealPlanFilters />

      {/* Meal Plans Grid */}
      <section>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-amber-800">
            All Meal Plans ({mealPlansData?.total || 0})
          </h2>

          {/* View Mode Toggle */}
          <div className="flex space-x-2">
            <button
              onClick={() => dispatch(setViewMode("grid"))}
              className={`p-2 rounded ${
                viewMode === "grid" ? "bg-amber-500 text-white" : "bg-gray-200"
              }`}
            >
              Grid
            </button>
            <button
              onClick={() => dispatch(setViewMode("list"))}
              className={`p-2 rounded ${
                viewMode === "list" ? "bg-amber-500 text-white" : "bg-gray-200"
              }`}
            >
              List
            </button>
          </div>
        </div>

        {mealPlansData?.data?.length > 0 ? (
          <>
            <div
              className={`grid gap-6 ${
                viewMode === "grid"
                  ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
                  : "grid-cols-1"
              }`}
            >
              {mealPlansData.data.map((mealPlan) => (
                <MealPlanCard
                  key={mealPlan._id}
                  mealPlan={mealPlan}
                  viewMode={viewMode}
                  onSelect={() => handleSelectMealPlan(mealPlan)}
                  onAddToCompare={() => handleAddToCompare(mealPlan._id)}
                  onToggleFavorite={() => handleToggleFavorite(mealPlan._id)}
                  onAddToCart={handleAddToCart}
                />
              ))}
            </div>

            {/* Pagination */}
            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil((mealPlansData?.total || 0) / itemsPerPage)}
              onPageChange={handlePageChange}
              className="mt-8"
            />
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No meal plans found</p>
          </div>
        )}
      </section>
    </div>
  );
};

export default MealPlanList;
