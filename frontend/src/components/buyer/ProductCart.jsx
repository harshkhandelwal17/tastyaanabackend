// // Product Card Component
// import React, { useState } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import { ShoppingCart, Star, Heart, Eye, Plus, Minus } from "lucide-react";
// import { addItem as addCartItem, addToCartAPI } from "../../redux/cartSlice";
// import {
//   addItem as addWishlistItem,
//   addToWishlistAPI,
//   removeItem as removeWishlistItem,
//   removeFromWishlistAPI,
// } from "../../redux/wishlistSlice";
// import { useNavigate } from "react-router-dom";
// import { toast } from "react-toastify";

// const ProductCard = ({ product, setCurrentPage }) => {
//   const dispatch = useDispatch();
//   const wishlist = useSelector((state) => state.wishlist.items || []);
//   console.log("my wishlist is ", wishlist);
//   if (!product)
//     return <div className="text-center py-4 md:py-8">Loading product...</div>;
//   if (!product?.weightOptions || product?.weightOptions?.length === 0)
//     return (
//       <div className="text-center py-4 md:py-8">
//         No weight options available.
//       </div>
//     );

//   const [selectedWeight, setSelectedWeight] = useState(
//     product.weightOptions[0]
//   );
//   const navigate = useNavigate();
//   const isInWishlist = wishlist?.items?.some(
//     (item) => item.productId === product._id || item._id === product._id
//   );
//   const authUser = useSelector((state) => state?.auth?.user);

//   const handleAddToCart = () => {
//     if (!authUser) {
//       toast.info("Please login to add items to cart");
//       navigate("/login");
//       return;
//     }
//     const payload = {
//       productId: product?._id,
//       payload: { weight: selectedWeight?.weight },
//       quantity: 1,
//     };
//     dispatch(addToCartAPI(payload));
//     toast.success("Added To Cart!");
//   };

//   const handleWishlistClick = () => {
//     if (!authUser) {
//       toast.info("Please login to add items to cart");
//       navigate("/login");
//       return;
//     }
//     if (isInWishlist) {
//       dispatch(removeFromWishlistAPI({ _id: product._id }));
//       toast.success("Removed To Wishlist!");
//     } else {
//       dispatch(addToWishlistAPI({ _id: product._id }));
//       toast.success("Added To Wishlist!");
//     }
//   };

//   return (
//     <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
//       <div className="relative">
//         {/* {console.log("product in product cart component ", product.images[0])} */}
//         <img
//           src={product.images[0].url}
//           alt={product.name}
//           className="w-full h-36 sm:h-40 md:h-48 object-cover"
//         />

//         <button
//           onClick={handleWishlistClick}
//           className="absolute top-2 right-2 p-1 sm:p-1.5 bg-white rounded-full shadow-sm hover:shadow transition-all duration-200 grid place-items-center w-1 h-1 sm:w-7 sm:h-7"
//         >
//           <Heart
//             className={`w-5 h-5 sm:w-3.5 sm:h-3.5 ${
//               isInWishlist
//                 ? "fill-red-500 text-red-500"
//                 : "text-gray-400 hover:text-gray-600"
//             } transition-colors`}
//           />
//         </button>

//         {product.featured && (
//           <span className="absolute top-2 left-2 bg-orange-600 text-white px-2 py-1 rounded text-xs font-semibold">
//             Featured
//           </span>
//         )}
//       </div>

//       <div className="p-3 md:p-4">
//         <div onClick={() => navigate(`/products/${product?._id}`)}>
//           <h3 className="text-base md:text-lg font-semibold text-gray-800 mb-1 md:mb-2 line-clamp-1">
//             {product.name}
//           </h3>
//           <p className="text-gray-600 text-xs md:text-sm mb-2 md:mb-3 line-clamp-2">
//             {product.description}
//           </p>
//         </div>

//         <div className="flex items-center mb-2 md:mb-3">
//           <div className="flex items-center space-x-1">
//             {[...Array(5)].map((_, i) => (
//               <Star
//                 key={i}
//                 className={`w-3 h-3 md:w-4 md:h-4 ${
//                   i < Math.floor(product.ratings.average)
//                     ? "text-yellow-400 fill-current"
//                     : "text-gray-300"
//                 }`}
//               />
//             ))}
//           </div>
//           <span className="text-xs md:text-sm text-gray-600 ml-1 md:ml-2 truncate">
//             {product.ratings.average} ({product.ratings.reviewCount})
//           </span>
//         </div>

//         <div className="mb-3">
//           <label className="text-xs md:text-sm font-medium text-gray-700 block mb-1">
//             Weight:
//           </label>
//           <select
//             value={selectedWeight.weight}
//             onChange={(e) => {
//               const weight = product.weightOptions.find(
//                 (w) => w.weight === e.target.value
//               );
//               setSelectedWeight(weight);
//             }}
//             className="w-full p-1.5 md:p-2 border border-gray-300 rounded-md text-xs md:text-sm"
//           >
//             {product.weightOptions.map((option) => (
//               <option key={option.weight} value={option.weight}>
//                 {option.weight} - ₹{option.price}
//               </option>
//             ))}
//           </select>
//         </div>

//         <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
//           <span className="text-lg md:text-2xl font-bold text-orange-600">
//             ₹{selectedWeight.price}
//           </span>
//           <div className="flex space-x-2">
//             <button
//               onClick={() => navigate(`/products/${product._id}`)}
//               className="p-1.5 md:p-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors place-items-center"
//             >
//               <Eye className="w-3 h-3 md:w-4 md:h-4" />
//             </button>
//             <button
//               onClick={handleAddToCart}
//               disabled={
//                 selectedWeight?.stock !== undefined
//                   ? selectedWeight.stock <= 0
//                   : false
//               }
//               className={`bg-orange-600 text-white px-3 py-1.5 md:px-4 md:py-2 rounded-md hover:bg-orange-700 transition-colors flex items-center space-x-1 ${
//                 selectedWeight?.stock !== undefined && selectedWeight.stock <= 0
//                   ? "opacity-50 cursor-not-allowed bg-gray-300 text-gray-500"
//                   : ""
//               }`}
//             >
//               <ShoppingCart className="w-3 h-3 md:w-4 md:h-4" />
//               <span>
//                 {selectedWeight?.stock !== undefined &&
//                 selectedWeight.stock <= 0
//                   ? "Out of Stock"
//                   : "Add"}
//               </span>
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default ProductCard;

// Product Card Component - Fixed Heights
import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { ShoppingCart, Star, Heart, Eye, Plus, Minus } from "lucide-react";
import { addItem as addCartItem, addToCartAPI } from "../../redux/cartSlice";
import {
  addItem as addWishlistItem,
  addToWishlistAPI,
  removeItem as removeWishlistItem,
  removeFromWishlistAPI,
} from "../../redux/wishlistSlice";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";

const ProductCard = ({ product, setCurrentPage }) => {
  const dispatch = useDispatch();
  const wishlist = useSelector((state) => state.wishlist.items || []);
  console.log("my wishlist is ", wishlist);
  if (!product)
    return <div className="text-center py-4 md:py-8">Loading product...</div>;
  if (!product?.weightOptions || product?.weightOptions?.length === 0)
    return (
      <div className="text-center py-4 md:py-8">
        No weight options available.
      </div>
    );

  const [selectedWeight, setSelectedWeight] = useState(
    product.weightOptions[0]
  );
  const [showCollegeModal, setShowCollegeModal] = useState(false);
  const [collegeName, setCollegeName] = useState("");
  const navigate = useNavigate();
  const isInWishlist = wishlist?.items?.some(
    (item) => item.productId === product._id || item._id === product._id
  );
  const authUser = useSelector((state) => state?.auth?.user);

  const handleAddToCart = async () => {
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
      const payload = {
        productId: product?._id,
        payload: { weight: selectedWeight?.weight },
        quantity: 1,
      };
      await dispatch(addToCartAPI(payload)).unwrap();
      toast.success("Added To Cart!");
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
      const payload = {
        productId: product?._id,
        payload: {
          weight: selectedWeight?.weight,
          collegeName: collegeName.trim(),
        },
        quantity: 1,
      };
      await dispatch(addToCartAPI(payload)).unwrap();
      toast.success("Added To Cart!");
      setShowCollegeModal(false);
      setCollegeName("");
    } catch (error) {
      console.error("Failed to add to cart:", error);
      toast.error("Failed to add to cart. Please try again.");
    }
  };

  const handleWishlistClick = () => {
    if (!authUser) {
      toast.info("Please login to add items to cart");
      navigate("/login");
      return;
    }
    if (isInWishlist) {
      dispatch(removeFromWishlistAPI({ _id: product._id }));
      toast.success("Removed To Wishlist!");
    } else {
      dispatch(addToWishlistAPI({ _id: product._id }));
      toast.success("Added To Wishlist!");
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow h-full flex flex-col w-full max-w-xs sm:max-w-sm">
      <div className="relative flex-shrink-0 w-full h-48 sm:h-56 md:h-64 bg-gray-100">
        <img
          src={product.images[0].url}
          alt={product.name}
          className="w-full h-full object-cover object-center"
        />

        <button
          onClick={handleWishlistClick}
          className="absolute top-2 right-2 p-1 sm:p-1.5 bg-white rounded-full shadow-sm hover:shadow transition-all duration-200 grid place-items-center w-6 h-6 sm:w-7 sm:h-7"
        >
          <Heart
            className={`w-3 h-3 sm:w-4 sm:h-4 ${
              isInWishlist
                ? "fill-red-500 text-red-500"
                : "text-gray-400 hover:text-gray-600"
            } transition-colors`}
          />
        </button>

        {product.featured && (
          <span className="absolute top-2 left-2 bg-orange-600 text-white px-1.5 py-0.5 sm:px-2 sm:py-1 rounded text-xs font-semibold">
            Featured
          </span>
        )}
      </div>

      <div className="p-3 sm:p-4 flex flex-col flex-grow">
        <div
          onClick={() => navigate(`/products/${product?._id}`)}
          className="cursor-pointer"
        >
          <h3 className="text-sm sm:text-base font-semibold text-gray-800 mb-1 sm:mb-2 h-8 sm:h-10 overflow-hidden leading-tight">
            <span className="line-clamp-2">{product.name}</span>
          </h3>
          <p className="text-gray-600 text-xs sm:text-sm mb-2 sm:mb-3 h-8 sm:h-10 overflow-hidden leading-tight">
            <span className="line-clamp-2">
              {product.description || "No description available"}
            </span>
          </p>
        </div>

        <div className="flex items-center mb-2 sm:mb-3 h-4 sm:h-5">
          <div className="flex items-center space-x-0.5 sm:space-x-1">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-3 h-3 sm:w-4 sm:h-4 ${
                  i < Math.floor(product.ratings.average)
                    ? "text-yellow-400 fill-current"
                    : "text-gray-300"
                }`}
              />
            ))}
          </div>
          <span className="text-xs sm:text-sm text-gray-600 ml-1 sm:ml-2 truncate">
            {product.ratings.average} ({product.ratings.reviewCount})
          </span>
        </div>

        <div className="mb-2 sm:mb-3 flex-shrink-0">
          <label className="text-xs sm:text-sm font-medium text-gray-700 block mb-1">
            Weight:
          </label>
          <select
            value={selectedWeight.weight}
            onChange={(e) => {
              const weight = product.weightOptions.find(
                (w) => w.weight === e.target.value
              );
              setSelectedWeight(weight);
            }}
            className="w-full p-1.5 sm:p-2 border border-gray-300 rounded text-xs sm:text-sm"
          >
            {product.weightOptions.map((option) => (
              <option key={option.weight} value={option.weight}>
                {option.weight} - ₹{option.price}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center justify-between mt-auto">
          <span className="text-lg sm:text-xl font-bold text-orange-600">
            ₹{selectedWeight.price}
          </span>
          <div className="flex space-x-1 sm:space-x-2">
            <button
              onClick={() => navigate(`/products/${product._id}`)}
              className="p-1.5 sm:p-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
            >
              <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
            <button
              onClick={handleAddToCart}
              disabled={
                selectedWeight?.stock !== undefined
                  ? selectedWeight.stock <= 0
                  : false
              }
              className={`bg-orange-600 text-white px-2 sm:px-3 py-1.5 sm:py-2 rounded hover:bg-orange-700 transition-colors flex items-center space-x-1 text-xs sm:text-sm ${
                selectedWeight?.stock !== undefined && selectedWeight.stock <= 0
                  ? "opacity-50 cursor-not-allowed bg-gray-300 text-gray-500"
                  : ""
              }`}
            >
              <ShoppingCart className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>
                {selectedWeight?.stock !== undefined &&
                selectedWeight.stock <= 0
                  ? "Out"
                  : "Add"}
              </span>
            </button>
          </div>
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
              className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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

export default ProductCard;
