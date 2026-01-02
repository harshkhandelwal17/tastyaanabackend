import React, { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  FaShoppingBasket,
  FaLeaf,
  FaFish,
  FaBreadSlice,
  FaWineBottle,
  FaIceCream,
} from "react-icons/fa";
import { useGetCategoriesQuery } from "../../redux/storee/api";

const getCategoryIcon = (categoryName = '') => {
  const name = categoryName.toLowerCase();
  if (name.includes('fruit') || name.includes('vegetable')) {
    return <FaLeaf className="mr-2" />;
  } else if (name.includes('meat') || name.includes('seafood')) {
    return <FaFish className="mr-2" />;
  } else if (name.includes('bakery') || name.includes('bread')) {
    return <FaBreadSlice className="mr-2" />;
  } else if (name.includes('beverage') || name.includes('drink')) {
    return <FaWineBottle className="mr-2" />;
  } else if (name.includes('dairy') || name.includes('milk') || name.includes('cheese')) {
    return <FaIceCream className="mr-2" />;
  }
  return <FaShoppingBasket className="mr-2" />;
};

const GroceryNav = () => {
  const location = useLocation();
  const { data: response, isLoading, isError } = useGetCategoriesQuery();
  
  // Add 'All' category at the beginning and map the categories to the expected format
  const navCategories = [
    {
      _id: "all",
      name: "All Categories",
      slug: "all"
    },
    ...(response?.categories?.map(cat => ({
      _id: cat._id,
      name: cat.name,
      slug: cat.slug
    })) || [])
  ];

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
        <h5 className="text-lg font-semibold mb-3">Shop by Category</h5>
        <div className="animate-pulse space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-10 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
      <h5 className="text-lg font-semibold mb-3">Shop by Category</h5>
      <nav className="flex flex-col space-y-2">
        {navCategories.map((category) => {
          const isActive =
            location.pathname === `/grocery/category/${category._id}` ||
            (location.pathname === "/grocery" && category._id === "all");

          return (
            <Link
              key={category._id}
              to={
                category._id === "all"
                  ? "/grocery"
                  : `/grocery/category/${category._id}`
              }
              className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                isActive
                  ? "bg-blue-100 text-blue-700 font-medium"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              {React.cloneElement(getCategoryIcon(category.name), {
                className: `mr-2 ${
                  isActive ? "text-blue-600" : "text-gray-500"
                }`,
              })}
              {category.name}
            </Link>
          );
        })}
      </nav>

      <div className="mt-4 pt-4 border-t border-gray-200">
        <h6 className="text-md font-semibold mb-3">Special Offers</h6>
        <div className="bg-gray-50 p-3 rounded-lg mb-2">
          <span className="block text-gray-500 text-xs mb-1">Today's Deal</span>
          <strong className="block text-gray-800">
            20% OFF on Organic Products
          </strong>
          <span className="text-blue-600 text-sm">Use code: ORGANIC20</span>
        </div>
        <div className="bg-gray-50 p-3 rounded-lg">
          <span className="block text-gray-500 text-xs mb-1">
            Weekend Special
          </span>
          <strong className="block text-gray-800">Buy 1 Get 1 Free</strong>
          <span className="text-blue-600 text-sm">On selected items</span>
        </div>
      </div>
    </div>
  );
};

export default GroceryNav;
