// import React, { useState, useEffect, useRef } from "react";
// import { useNavigate } from "react-router-dom";
// import { useDispatch, useSelector } from "react-redux";
// import { toast } from "react-toastify";
// import {
//   ShoppingCart,
//   Star,
//   CheckCircle,
//   Heart,
//   Share2,
//   ArrowRight,
//   Clock,
//   MapPin,
//   Shield,
//   Truck,
//   Sparkles,
//   Award,
//   Zap,
//   Plus,
//   Minus,
// } from "lucide-react";
// import { addToCartAPI } from "../../redux/cartSlice";
// import {
//   addToWishlistAPI,
//   removeFromWishlistAPI,
// } from "../../redux/wishlistSlice";

// const SweetCard = ({ product, index }) => {
//   const [selectedWeight, setSelectedWeight] = useState(
//     product.weightOptions?.length > 0
//       ? product.weightOptions[0]
//       : {
//           weight: "250g",
//           price: product.price,
//           originalPrice: product.price * 1.25,
//         }
//   );
//   const [isWeightDropdownOpen, setIsWeightDropdownOpen] = useState(false);
//   const [isHovered, setIsHovered] = useState(false);
//   const [quantity, setQuantity] = useState(1);
//   const navigate = useNavigate();
//   const dispatch = useDispatch();
//   const authUser = useSelector((state) => state.auth?.user);
//   const wishlistItems = useSelector((state) => state.wishlist?.items || []);
//   const isInWishlist = wishlistItems?.items?.some(
//     (item) => item._id === product._id
//   );
//   const dropdownRef = useRef(null);

//   useEffect(() => {
//     const handleClickOutside = (event) => {
//       if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
//         setIsWeightDropdownOpen(false);
//       }
//     };

//     document.addEventListener("mousedown", handleClickOutside);
//     return () => {
//       document.removeEventListener("mousedown", handleClickOutside);
//     };
//   }, []);

//   const toggleWeightDropdown = (e) => {
//     e.stopPropagation();
//     setIsWeightDropdownOpen(!isWeightDropdownOpen);
//   };

//   const handleWeightSelect = (option, e) => {
//     e.stopPropagation();
//     setSelectedWeight(option);
//     setIsWeightDropdownOpen(false);
//   };

//   const handleAddToCart = (e) => {
//     e.stopPropagation();
//     if (!authUser) {
//       toast.info("Please login to add items to cart");
//       navigate("/login");
//       return;
//     }

//     const payload = {
//       productId: product._id,
//       payload: {
//         weight: selectedWeight?.weight || "1kg",
//         price: selectedWeight?.price || product.price,
//       },
//       quantity: quantity,
//     };

//     try {
//       dispatch(addToCartAPI(payload));
//       toast.success("Added to cart!");
//     } catch (error) {
//       console.error("Failed to add to cart", error);
//       toast.error("Failed to add to cart");
//     }
//   };

//   const toggleWishlist = (e) => {
//     e.stopPropagation();
//     if (!authUser) {
//       toast.info("Please login to manage your wishlist");
//       navigate("/login");
//       return;
//     }

//     if (isInWishlist) {
//       dispatch(removeFromWishlistAPI({ _id: product._id }));
//       toast.success("Removed from wishlist!");
//     } else {
//       dispatch(addToWishlistAPI({ _id: product._id }));
//       toast.success("Added to wishlist!");
//     }
//   };

//   const handleQuantityChange = (increment) => {
//     setQuantity((prev) => Math.max(1, prev + increment));
//   };

//   const handleProductClick = () => {
//     navigate(`/products/${product._id}`);
//   };

//   const getBadgeColor = (badge) => {
//     if (!badge) return "bg-gradient-to-r from-amber-500 to-orange-600";

//     switch (badge.toLowerCase()) {
//       case "premium":
//         return "bg-gradient-to-r from-purple-200 to-pink-100 ";
//       case "special":
//         return "bg-gradient-to-r from-amber-500 to-orange-600";
//       case "gift":
//         return "bg-gradient-to-r from-pink-500 to-rose-600";
//       case "master crafted":
//         return "bg-gradient-to-r from-amber-200 to-yellow-200";
//       case "premium royal":
//         return "bg-gradient-to-r from-purple-200 to-indigo-200";
//       case "regional special":
//         return "bg-gradient-to-r from-green-200 to-emerald-200";
//       default:
//         return "bg-gradient-to-r from-amber-500 to-orange-600";
//     }
//   };

//   const getBadgeTextColor = (badge) => {
//     if (!badge) return "text-white";

//     const lightBackgrounds = [
//       "premium",
//       "master crafted",
//       "premium royal",
//       "regional special",
//     ];

//     if (lightBackgrounds.includes(badge.toLowerCase())) {
//       return "text-gray-800";
//     }

//     return "text-white";
//   };

//   const originalPrice = selectedWeight?.originalPrice || product.price * 1.25;
//   const currentPrice = selectedWeight?.price || product.price;
//   const discountPercent = Math.round(
//     ((originalPrice - currentPrice) / originalPrice) * 100
//   );
//   const productImage =
//     product.image || product.images?.[0]?.url || "/api/placeholder/400/300";

//   return (
//     <div
//       className="bg-white rounded-xl shadow-md overflow-hidden flex flex-col h-full border border-gray-100 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
//       style={{ animationDelay: `${0.1 + index * 0.1}s` }}
//       onMouseEnter={() => setIsHovered(true)}
//       onMouseLeave={() => setIsHovered(false)}
//     >
//       {/* Image section - Responsive sizing */}
//       <div className="relative aspect-square w-full overflow-hidden">
//         <img
//           src={productImage}
//           alt={product.name}
//           className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
//           loading="lazy"
//         />

//         {/* Top badges */}
//         <div className="absolute top-2 left-2 space-y-1">
//           {product.badge && (
//             <span
//               className={`${getBadgeColor(product.badge)} ${getBadgeTextColor(
//                 product.badge
//               )} px-2 py-1 rounded-full text-xs font-bold`}
//             >
//               {product.badge}
//             </span>
//           )}
//           {discountPercent > 0 && (
//             <span className="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold">
//               {discountPercent}% OFF
//             </span>
//           )}
//         </div>

//         {/* Wishlist button - Responsive sizing */}
//         <button
//           onClick={toggleWishlist}
//           className="absolute top-2 right-2 p-1.5 bg-white rounded-full shadow-sm hover:shadow transition-all duration-200 grid place-items-center"
//         >
//           <Heart
//             className={`w-4 h-4 ${
//               isInWishlist
//                 ? "fill-red-500 text-red-500"
//                 : "text-gray-400 hover:text-gray-600"
//             } transition-colors`}
//           />
//         </button>
//       </div>

//       {/* Product details */}
//       <div className="p-3 sm:p-4 flex flex-col flex-grow">
//         <div className="flex justify-between items-center mb-2">
//           <span className="text-xs font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
//             {product?.category?.name || product?.category}
//           </span>
//           <div className="flex items-center text-xs sm:text-sm text-amber-800">
//             <Star className="w-3 h-3 fill-current mr-1" />
//             {product.ratings?.average || product.rating || 4.7}
//           </div>
//         </div>

//         <h3 className="font-bold text-gray-800 text-sm sm:text-base mb-2 line-clamp-1">
//           {product.name}
//         </h3>

//         {/* <p className="text-xs sm:text-sm text-gray-600 mb-3 line-clamp-2">
//           {product.shortDescription || product.description}
//         </p> */}

//         {product.weightOptions?.length > 0 && (
//           <div className="mb-2 relative text-xs" ref={dropdownRef}>
//             <button
//               type="button"
//               onClick={toggleWeightDropdown}
//               className="w-full flex items-center justify-between px-2.5 py-1.5 border border-gray-300 rounded-md bg-white text-gray-800 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-amber-500"
//             >
//               <div className="flex flex-col items-start leading-tight">
//                 <span className="font-semibold text-[12px]">
//                   {selectedWeight.weight}
//                 </span>
//                 <div className="text-[10px] text-gray-500 flex items-center gap-1">
//                   <span>₹{selectedWeight.price}</span>
//                   {selectedWeight.originalPrice > selectedWeight.price && (
//                     <span className="line-through text-gray-400">
//                       ₹{selectedWeight.originalPrice}
//                     </span>
//                   )}
//                 </div>
//               </div>
//               <svg
//                 className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${
//                   isWeightDropdownOpen ? "rotate-180" : ""
//                 }`}
//                 xmlns="http://www.w3.org/2000/svg"
//                 viewBox="0 0 20 20"
//                 fill="currentColor"
//               >
//                 <path
//                   fillRule="evenodd"
//                   d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
//                   clipRule="evenodd"
//                 />
//               </svg>
//             </button>

//             {isWeightDropdownOpen && (
//               <div className="absolute z-10 mt-1 w-full rounded-md bg-white shadow-md border border-gray-200">
//                 <ul className="max-h-48 overflow-auto py-1 text-[11px]">
//                   {product.weightOptions.map((option, idx) => {
//                     const isSelected = selectedWeight.weight === option.weight;
//                     const discount = option.originalPrice - option.price;
//                     const discountPercent = Math.round(
//                       (discount / option.originalPrice) * 100
//                     );

//                     return (
//                       <li
//                         key={idx}
//                         onClick={(e) => handleWeightSelect(option, e)}
//                         className={`cursor-pointer px-2 py-1 hover:bg-gray-50 ${
//                           isSelected ? "bg-amber-50" : ""
//                         }`}
//                       >
//                         <div className="flex justify-between items-center">
//                           <span
//                             className={`font-medium ${
//                               isSelected ? "text-amber-800" : "text-gray-900"
//                             }`}
//                           >
//                             {option.weight}
//                           </span>
//                           <div className="text-right text-[10px] leading-tight">
//                             <div className="text-gray-700 font-semibold">
//                               ₹{option.price}
//                             </div>
//                             {option.originalPrice > option.price && (
//                               <div className="line-through text-gray-400">
//                                 ₹{option.originalPrice}
//                               </div>
//                             )}
//                             {discount > 0 && (
//                               <div className="text-green-600 font-medium">
//                                 Save {discountPercent}%
//                               </div>
//                             )}
//                           </div>
//                         </div>
//                       </li>
//                     );
//                   })}
//                 </ul>
//               </div>
//             )}
//           </div>
//         )}

//         {/* Price section */}
//         <div className="mt-auto">
//           <div className="flex items-center justify-between mb-3">
//             <div>
//               <div className="flex items-baseline gap-1">
//                 <span className="text-lg sm:text-xl font-bold">
//                   ₹{currentPrice}
//                 </span>
//                 {originalPrice > currentPrice && (
//                   <span className="text-xs text-gray-400 line-through">
//                     ₹{originalPrice}
//                   </span>
//                 )}
//               </div>
//               <p className="text-xs text-gray-500">
//                 per {selectedWeight.weight}
//               </p>
//             </div>
//           </div>

//           {/* Action buttons - Responsive layout */}
//           <div className="flex gap-2">
//             <button
//               onClick={handleAddToCart}
//               className={`flex-1 flex items-center justify-center gap-1 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 bg-amber-500 text-white hover:bg-amber-600 hover:shadow-md`}
//             >
//               <ShoppingCart className="w-3 h-3 sm:w-4 sm:h-4" />
//               <span className="hidden sm:inline">Add to Cart</span>
//               <span className="sm:hidden">Add</span>
//             </button>

//             <button
//               onClick={handleProductClick}
//               className="p-2 sm:p-2.5 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200"
//             >
//               <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default React.memo(SweetCard);

// SweetCard.js
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-hot-toast";
import { ShoppingCart, Star, Heart, ArrowRight } from "lucide-react";
import { addToCartAPI } from "../../redux/cartSlice";
import {
  addToWishlistAPI,
  removeFromWishlistAPI,
} from "../../redux/wishlistSlice";

const SweetCard = ({ product, index }) => {
  const [selectedWeight, setSelectedWeight] = useState(
    product.weightOptions?.[0] || {
      weight: "250g",
      price: product.price,
      originalPrice: product.price * 1.25,
    }
  );
  const [isWeightDropdownOpen, setIsWeightDropdownOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [showCollegeModal, setShowCollegeModal] = useState(false);
  const [collegeName, setCollegeName] = useState("");
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const authUser = useSelector((state) => state.auth?.user);
  const wishlistItems = useSelector((state) => state.wishlist?.items || []);
  const isInWishlist = wishlistItems?.items?.some(
    (item) => item._id === product._id
  );
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsWeightDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleWeightDropdown = (e) => {
    e.stopPropagation();
    setIsWeightDropdownOpen(!isWeightDropdownOpen);
  };

  const handleWeightSelect = (option, e) => {
    e.stopPropagation();
    setSelectedWeight(option);
    setIsWeightDropdownOpen(false);
  };

  const handleAddToCart = async (e) => {
    e.stopPropagation();
    if (!authUser) {
      toast.info("Please login to add items to cart");
      navigate("/login");
      return;
    }

    // Check if this is a college-branded product
    const isCollegeBranded =
      product?.title?.toLowerCase().includes("college") ||
      product?.name?.toLowerCase().includes("college") ||
      product?.tags?.some((tag) => tag.toLowerCase().includes("college"));

    if (isCollegeBranded) {
      setShowCollegeModal(true);
      return;
    }

    try {
      await dispatch(
        addToCartAPI({
          productId: product._id,
          payload: {
            weight: selectedWeight.weight,
            price: selectedWeight.price,
          },
          quantity,
        })
      ).unwrap();
      toast.success("Added to cart!");
    } catch (error) {
      console.error("Failed to add to cart:", error);
      toast.error("Failed to add to cart. Please try again.");
    }
  };

  const handleCollegeSubmit = async () => {
    if (!collegeName.trim()) {
      toast.error("Please enter your college name");
      return;
    }

    try {
      await dispatch(
        addToCartAPI({
          productId: product._id,
          payload: {
            weight: selectedWeight.weight,
            price: selectedWeight.price,
            collegeName: collegeName.trim(),
          },
          quantity,
        })
      ).unwrap();
      toast.success("Added to cart!");
      setShowCollegeModal(false);
      setCollegeName("");
    } catch (error) {
      console.error("Failed to add college item to cart:", error);
      toast.error("Failed to add to cart. Please try again.");
    }
  };

  const toggleWishlist = (e) => {
    e.stopPropagation();
    if (!authUser) {
      toast.info("Please login to manage wishlist");
      navigate("/login");
      return;
    }
    if (isInWishlist) {
      dispatch(removeFromWishlistAPI({ _id: product._id }));
      toast.success("Removed from wishlist!");
    } else {
      dispatch(addToWishlistAPI({ _id: product._id }));
      toast.success("Added to wishlist!");
    }
  };

  const productImage =
    product.image || product.images?.[0]?.url || "/api/placeholder/400/300";
  const originalPrice = selectedWeight.originalPrice || product.price * 1.25;
  const currentPrice = selectedWeight.price || product.price;
  const discountPercent = Math.round(
    ((originalPrice - currentPrice) / originalPrice) * 100
  );

  return (
    <div
      className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all w-full max-w-[240px] mx-auto"
      onClick={() => navigate(`/products/${product._id}`)}
    >
      <div className="relative w-full aspect-square overflow-hidden rounded-t-xl">
        <img
          src={productImage}
          alt={product.name}
          className="w-full h-full object-cover hover:scale-105 transition-transform"
        />
        {discountPercent > 0 && (
          <span className="absolute top-2 left-2 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded">
            {discountPercent}% OFF
          </span>
        )}
        <button
          onClick={toggleWishlist}
          className="absolute top-2 right-2 bg-white p-1 rounded-full shadow place-items-center"
        >
          <Heart
            className={`w-4 h-4 ${
              isInWishlist ? "fill-red-500 text-red-500" : "text-gray-400"
            }`}
          />
        </button>
      </div>

      <div className="p-2">
        <h3 className="text-xs font-bold text-gray-800 line-clamp-1 mb-1">
          {product.name}
        </h3>
        <p className="text-[10px] text-gray-500 mb-1">
          {product?.category?.name || product?.category}
        </p>

        {/* Weight selector */}
        {product.weightOptions?.length > 0 && (
          <div className="relative text-[10px] mb-2" ref={dropdownRef}>
            <button
              type="button"
              onClick={toggleWeightDropdown}
              className="w-full px-2 py-1 border border-gray-300 rounded text-left"
            >
              {selectedWeight.weight} • ₹{selectedWeight.price}
            </button>
            {isWeightDropdownOpen && (
              <ul className="absolute z-10 w-full mt-1 bg-white border rounded shadow text-[10px]">
                {product.weightOptions.map((option, i) => (
                  <li
                    key={i}
                    onClick={(e) => handleWeightSelect(option, e)}
                    className="px-2 py-1 hover:bg-gray-50 cursor-pointer"
                  >
                    {option.weight} • ₹{option.price}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Price and button */}
        <div className="flex justify-between items-center mt-2">
          <div>
            <span className="text-sm font-bold">₹{currentPrice}</span>
            {originalPrice > currentPrice && (
              <span className="line-through text-[10px] text-gray-400 ml-1">
                ₹{originalPrice}
              </span>
            )}
          </div>
          <button
            onClick={handleAddToCart}
            className="bg-amber-500 hover:bg-amber-600 text-white text-[10px] px-2 py-1 rounded"
          >
            <ShoppingCart className="w-3 h-3 inline mr-1" /> Add
          </button>
        </div>
      </div>

      {/* College Name Modal */}
      {showCollegeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">
              College Information Required
            </h3>
            <p className="text-gray-600 mb-4">
              This is a college-branded item. Please enter your college name to
              proceed:
            </p>
            <input
              type="text"
              placeholder="Enter your college name"
              value={collegeName}
              onChange={(e) => setCollegeName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-amber-500"
              autoFocus
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowCollegeModal(false);
                  setCollegeName("");
                }}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCollegeSubmit}
                className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
              >
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(SweetCard);
