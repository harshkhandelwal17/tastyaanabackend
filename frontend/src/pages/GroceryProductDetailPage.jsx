import React, { useEffect, useState } from "react";
import {addToCart} from ".././redux/Slices/cartslice"

import { useParams, useNavigate } from "react-router-dom";
import {
  FaHeart, 
  FaStar,
  FaRegStar,
  FaLeaf,
  FaClipboard,
  FaCheckCircle,
  FaTimesCircle, 
  FaShoppingCart,
  FaRegHeart,
  FaTag,
  FaClock,
  FaWeightHanging,
  FaFacebook,
  FaTwitter,
  FaPinterest,
  FaWhatsapp,
  FaStarHalfAlt,
  FaCommentSlash,
  FaChevronRight,
} from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import {
  addToWishlistAPI,
  removeFromWishlistAPI,
} from "../redux/wishlistSlice";
import toast from "react-hot-toast";

const GroceryProductDetailPage = () => {
  // Router and Redux hooks
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Redux state
  const { user } = useSelector((state) => state.auth);
  const { items: wishlistItems } = useSelector((state) => state.wishlist);
  const { selectedProduct, loading, error, getProductById } = useSelector(
    (state) => state.grocery
  );

  // Local state
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [selectedImage, setSelectedImage] = useState("");
  const [activeTab, setActiveTab] = useState("description");
  const [copied, setCopied] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState([]);

  // Generate product URL
  const productUrl = `${window.location.origin}/grocery/${id}`;

  useEffect(() => {
    if (id && getProductById) {
      getProductById(id);
    }
  }, [id, getProductById]);

  useEffect(() => {
    if (
      wishlistItems &&
      wishlistItems.find((item) => item.id === selectedProduct?._id)
    ) {
      setIsWishlisted(true);
    } else {
      setIsWishlisted(false);
    }
  }, [wishlistItems, selectedProduct]);

  // Handle quantity changes
  const handleQuantityChange = (e) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value > 0 && value <= 10) {
      setQuantity(value);
    }
  };

  // Quantity increment/decrement functions
  const incrementQuantity = () => {
    if (quantity < (selectedProduct?.stock || 0)) {
      setQuantity(quantity + 1);
    }
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  // Toggle wishlist
  const toggleWishlist = () => {
    if (!user) {
      toast("Please login to add items to your wishlist", { duration: 2000 });
      navigate("/login", { state: { from: `/grocery/${id}` } });
      return;
    }

    if (isWishlisted) {
      dispatch(removeFromWishlistAPI(selectedProduct._id));
      toast.success("Removed from wishlist", { duration: 2000 });
    } else {
      dispatch(addToWishlistAPI(selectedProduct));
      toast.success("Added to wishlist", { duration: 2000 });
    }
    setIsWishlisted(!isWishlisted);
  };

  // Add to cart handler
  const addToCart = () => {
    if (!user) {
      toast("Please login to add items to your cart", { duration: 2000 });
      navigate("/login", { state: { from: `/grocery/${id}` } });
      return;
    }

    if (!selectedProduct) return;

    dispatch(
      addToCart({
        ...selectedProduct,
        quantity,
        price: selectedProduct.discount
          ? (
              selectedProduct.price -
              (selectedProduct.price * selectedProduct.discount) / 100
            ).toFixed(2)
          : selectedProduct.price,
      })
    );
    toast.success(`${quantity} ${selectedProduct.name} added to cart`, { duration: 2000 });
  };

  const handleAddToWishlist = () => {
    if (!selectedProduct) return;

    dispatch(
      addToWishlistAPI({
        id: selectedProduct._id,
        name: selectedProduct.title,
        price: selectedProduct.price,
        image: selectedProduct.images?.[0]?.url || "",
        inStock: selectedProduct.stock > 0,
      })
    );
  };

  // Share functionality
  const handleShare = (platform) => {
    const shareData = {
      title: selectedProduct?.name || "Check out this product",
      text: selectedProduct?.description || "Amazing product!",
      url: productUrl,
    };

    switch (platform) {
      case "facebook":
        window.open(
          `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
            productUrl
          )}`,
          "_blank"
        );
        break;
      case "twitter":
        window.open(
          `https://twitter.com/intent/tweet?url=${encodeURIComponent(
            productUrl
          )}&text=${encodeURIComponent(shareData.text)}`,
          "_blank"
        );
        break;
      case "pinterest":
        window.open(
          `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(
            productUrl
          )}&description=${encodeURIComponent(shareData.text)}`,
          "_blank"
        );
        break;
      case "whatsapp":
        window.open(
          `https://wa.me/?text=${encodeURIComponent(
            shareData.text + " " + productUrl
          )}`,
          "_blank"
        );
        break;
      default:
        break;
    }
  };

  // Copy to clipboard
  const copyToClipboard = () => {
    navigator.clipboard.writeText(productUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("Link copied to clipboard!", { duration: 2000 });
    });
  };

  // Render loading state
  if (loading) {
    return (
      <div className="container mx-auto px-4 my-20">
        <div className="text-center py-20">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <h4 className="text-xl font-semibold mb-2">
            Loading product details...
          </h4>
          <p className="text-gray-600">
            Please wait while we fetch the product information
          </p>
        </div>
      </div>
    );
  }

  // Calculate discounted price
  const discountedPrice =
    selectedProduct?.discount > 0
      ? (
          selectedProduct.price -
          (selectedProduct.price * selectedProduct.discount) / 100
        ).toFixed(2)
      : null;

  // Set first image as selected if none selected
  useEffect(() => {
    if (selectedProduct?.images?.length > 0 && !selectedImage) {
      setSelectedImage(selectedProduct.images[0]?.url || "");
    }
  }, [selectedProduct, selectedImage]);

  // Render error state
  if (error) {
    return (
      <div className="container mx-auto px-4 my-20">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h3 className="text-lg font-semibold text-red-800 mb-2">
            Error loading product
          </h3>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
            onClick={() => window.location.reload()}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Render product not found
  if (!selectedProduct) {
    return (
      <div className="container mx-auto px-4 my-20">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">
            Product Not Found
          </h3>
          <p className="text-blue-600 mb-4">
            The product you're looking for doesn't exist or has been removed.
          </p>
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            onClick={() => navigate("/grocery")}
          >
            Browse Groceries
          </button>
        </div>
      </div>
    );
  }

  const renderRatingStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    for (let i = 0; i < fullStars; i++) {
      stars.push(<FaStar key={`full-${i}`} className="text-yellow-400" />);
    }

    if (hasHalfStar) {
      stars.push(<FaStarHalfAlt key="half" className="text-yellow-400" />);
    }

    for (let i = 0; i < emptyStars; i++) {
      stars.push(<FaRegStar key={`empty-${i}`} className="text-yellow-400" />);
    }

    return stars;
  };

  const renderStars = (rating) => renderRatingStars(rating);

  // Set default product data and destructure in one step
  const {
    _id: productId,
    name = "Product Name",
    description = "No description available",
    price = 0,
    originalPrice = 0,
    discount = 0,
    images = [],
    category = "Uncategorized",
    brand = "",
    unit = "unit",
    stock = 0,
    isOrganic = false,
    isPerishable = false,
    specifications = {},
    nutrition = {},
    ingredients = [],
    ratings = { average: 0, count: 0 },
    reviews = [],
  } = selectedProduct || {};

  // Calculate derived values
  const displayPrice = Number(price || 0).toFixed(2);
  const displayOriginalPrice = Number(originalPrice || price || 0).toFixed(2);
  const hasDiscount = Number(discount || 0) > 0;
  const mainImage = images?.[0]?.url || "/images/placeholder-product.png";
  const thumbnailImages = images?.length > 1 ? images.slice(1) : [];
  const isInWishlist = isWishlisted;

  // Breadcrumb navigation
  const BreadcrumbNav = () => (
    <nav className="flex mb-6" aria-label="Breadcrumb">
      <ol className="inline-flex items-center space-x-1 md:space-x-3">
        <li className="inline-flex items-center">
          <a
            href="/"
            className="text-gray-700 hover:text-blue-600 inline-flex items-center"
          >
            Home
          </a>
        </li>
        <li>
          <div className="flex items-center">
            <FaChevronRight className="w-4 h-4 text-gray-400" />
            <a
              href="/grocery"
              className="ml-1 text-gray-700 hover:text-blue-600 md:ml-2"
            >
              Groceries
            </a>
          </div>
        </li>
        {category && (
          <li>
            <div className="flex items-center">
              <FaChevronRight className="w-4 h-4 text-gray-400" />
              <a
                href={`/grocery/category/${category}`}
                className="ml-1 text-gray-700 hover:text-blue-600 md:ml-2"
              >
                {category}
              </a>
            </div>
          </li>
        )}
        <li aria-current="page">
          <div className="flex items-center">
            <FaChevronRight className="w-4 h-4 text-gray-400" />
            <span className="ml-1 text-gray-500 md:ml-2 font-medium">
              {name}
            </span>
          </div>
        </li>
      </ol>
    </nav>
  );

  // Share buttons component
  const ShareButtons = () => (
    <div className="mt-6 flex items-center">
      <span className="mr-3 text-gray-700">Share:</span>
      <div className="flex space-x-2">
        <button
          className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors"
          onClick={() => handleShare("facebook")}
          title="Share on Facebook"
        >
          <FaFacebook className="w-4 h-4" />
        </button>
        <button
          className="w-8 h-8 bg-blue-400 text-white rounded-full flex items-center justify-center hover:bg-blue-500 transition-colors"
          onClick={() => handleShare("twitter")}
          title="Share on Twitter"
        >
          <FaTwitter className="w-4 h-4" />
        </button>
        <button
          className="w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center hover:bg-red-700 transition-colors"
          onClick={() => handleShare("pinterest")}
          title="Share on Pinterest"
        >
          <FaPinterest className="w-4 h-4" />
        </button>
        <button
          className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center hover:bg-green-700 transition-colors"
          onClick={() => handleShare("whatsapp")}
          title="Share on WhatsApp"
        >
          <FaWhatsapp className="w-4 h-4" />
        </button>
        <button
          className="w-8 h-8 bg-gray-600 text-white rounded-full flex items-center justify-center hover:bg-gray-700 transition-colors"
          onClick={copyToClipboard}
          title={copied ? "Link copied!" : "Copy link"}
        >
          <FaClipboard className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  // Render product gallery
  const renderProductGallery = () => (
    <div className="lg:w-1/2">
      <div className="sticky top-5">
        <div className="bg-gray-100 rounded-lg mb-4 overflow-hidden min-h-96">
          <img
            src={selectedImage || mainImage}
            alt={name}
            className="w-full h-full object-contain"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = "/images/placeholder-product.png";
            }}
          />
        </div>

        {thumbnailImages.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {thumbnailImages.map((img, index) => (
              <button
                key={index}
                className={`w-16 h-16 border-2 rounded-md overflow-hidden transition-all duration-300 ${
                  selectedImage === img.url
                    ? "border-blue-500 opacity-100"
                    : "border-gray-300 opacity-70 hover:opacity-100"
                }`}
                onClick={() => setSelectedImage(img.url)}
              >
                <img
                  src={img.url}
                  alt={`${name} ${index + 1}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "/images/placeholder-product.png";
                  }}
                />
              </button>
            ))}
          </div>
        )}

        <ShareButtons />
      </div>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <BreadcrumbNav />

      <div className="flex flex-col lg:flex-row gap-8">
        {renderProductGallery()}

        {/* Product Details */}
        <div className="lg:w-1/2">
          <div className="product-details">
            <h1 className="text-3xl font-bold mb-3">{name}</h1>

            {/* Brand */}
            {brand && (
              <div className="text-gray-600 mb-4">
                Brand:{" "}
                <span className="text-gray-900 font-medium">{brand}</span>
              </div>
            )}

            {/* Rating and SKU */}
            <div className="flex items-center mb-4">
              <div className="flex items-center mr-4">
                <div className="flex mr-2">{renderStars(ratings.average)}</div>
                <a
                  href="#reviews"
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  ({ratings.count} {ratings.count === 1 ? "review" : "reviews"})
                </a>
              </div>
              <div className="w-px h-4 bg-gray-300 mr-4"></div>
              <div className="text-gray-500 text-sm">
                SKU: {productId?.substring(0, 8).toUpperCase()}
              </div>
            </div>

            {/* Price */}
            <div className="mb-6">
              {hasDiscount ? (
                <div className="flex items-baseline">
                  <span className="text-4xl font-bold text-red-600 mr-4">
                    ${discountedPrice}
                  </span>
                  <span className="text-gray-500 line-through mr-2">
                    ${displayPrice}
                  </span>
                  <span className="bg-red-500 text-white px-2 py-1 rounded text-sm font-medium">
                    Save {discount}%
                  </span>
                </div>
              ) : (
                <span className="text-4xl font-bold">${displayPrice}</span>
              )}
              <div className="text-gray-500 text-sm mt-1">
                {unit && (
                  <>
                    <FaWeightHanging className="inline mr-1" /> {unit}
                  </>
                )}
              </div>
            </div>

            {/* Availability */}
            <div
              className={`p-4 rounded-lg mb-6 ${
                stock > 0
                  ? "bg-green-50 border border-green-200"
                  : "bg-red-50 border border-red-200"
              }`}
            >
              <div>
                <strong
                  className={stock > 0 ? "text-green-800" : "text-red-800"}
                >
                  {stock > 0 ? "In Stock" : "Out of Stock"}
                </strong>
                <div
                  className={`text-sm mt-1 ${
                    stock > 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {stock > 0 ? (
                    <>
                      Order now, only {stock} {unit} left
                    </>
                  ) : (
                    <>Check back soon for restock</>
                  )}
                </div>
              </div>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-2 mb-6">
              {isOrganic && (
                <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm flex items-center">
                  <FaLeaf className="mr-1" /> Organic
                </span>
              )}
              {isPerishable && (
                <span className="bg-yellow-500 text-black px-3 py-1 rounded-full text-sm flex items-center">
                  <FaClock className="mr-1" /> Perishable
                </span>
              )}
              {hasDiscount && (
                <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm flex items-center">
                  <FaTag className="mr-1" /> On Sale
                </span>
              )}
            </div>

            {/* Quantity and Add to Cart */}
            <div className="mb-6">
              <div className="flex items-center mb-4">
                <label className="text-gray-700 font-medium mr-4">
                  Quantity:
                </label>
                <div className="flex items-center border border-gray-300 rounded-md overflow-hidden">
                  <button
                    className="px-3 py-2 bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={decrementQuantity}
                    disabled={quantity <= 1}
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="1"
                    max={stock}
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                    className="w-16 px-3 py-2 text-center border-0 focus:outline-none focus:ring-0"
                  />
                  <button
                    className="px-3 py-2 bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={incrementQuantity}
                    disabled={quantity >= stock}
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
                  onClick={addToCart}
                  disabled={stock <= 0}
                >
                  <FaShoppingCart className="mr-2" />
                  {stock > 0 ? "Add to Cart" : "Out of Stock"}
                </button>

                <button
                  className={`p-3 border rounded-md transition-colors ${
                    isInWishlist
                      ? "border-red-500 text-red-500 hover:bg-red-50"
                      : "border-gray-300 text-gray-600 hover:bg-gray-50"
                  }`}
                  onClick={toggleWishlist}
                >
                  {isInWishlist ? <FaHeart /> : <FaRegHeart />}
                </button>
              </div>
            </div>

            {/* Product Description */}
            <div className="mb-6">
              <h5 className="text-lg font-semibold mb-3">
                Product Description
              </h5>
              <div className="text-gray-600">
                {description || "No description available."}
              </div>
            </div>

            {/* Product Specifications */}
            <div className="mb-6">
              <h5 className="text-lg font-semibold mb-3">Specifications</h5>
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full">
                  <tbody>
                    {Object.entries(specifications).map(([key, value]) => (
                      <tr
                        key={key}
                        className="border-b border-gray-200 last:border-b-0"
                      >
                        <th className="bg-gray-50 px-4 py-3 text-left text-gray-600 font-medium w-2/5">
                          {key}
                        </th>
                        <td className="px-4 py-3">{value}</td>
                      </tr>
                    ))}
                    {Object.keys(specifications).length === 0 && (
                      <tr>
                        <td
                          colSpan="2"
                          className="px-4 py-8 text-center text-gray-500"
                        >
                          No specifications available.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Tabs for additional information */}
            <div className="mb-6">
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                  {["description", "nutrition", "ingredients", "reviews"].map(
                    (tab) => (
                      <button
                        key={tab}
                        className={`py-2 px-1 border-b-2 font-medium text-sm ${
                          activeTab === tab
                            ? "border-blue-500 text-blue-600"
                            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                        }`}
                        onClick={() => setActiveTab(tab)}
                      >
                        {tab === "reviews"
                          ? `Reviews (${reviews.length})`
                          : tab.charAt(0).toUpperCase() + tab.slice(1)}
                      </button>
                    )
                  )}
                </nav>
              </div>

              <div className="pt-6">
                {activeTab === "description" && (
                  <div>{description || "No description available."}</div>
                )}

                {activeTab === "nutrition" && (
                  <div>
                    {Object.keys(nutrition).length > 0 ? (
                      <div className="border border-gray-200 rounded-lg overflow-hidden">
                        <table className="w-full">
                          <tbody>
                            {Object.entries(nutrition).map(([key, value]) => (
                              <tr
                                key={key}
                                className="border-b border-gray-200 last:border-b-0"
                              >
                                <th className="bg-gray-50 px-4 py-3 text-left text-gray-600 font-medium w-2/5">
                                  {key}
                                </th>
                                <td className="px-4 py-3">{value}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-gray-500">
                        No nutrition information available.
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "ingredients" && (
                  <div>
                    {ingredients.length > 0 ? (
                      <ul className="space-y-2">
                        {ingredients.map((ingredient, index) => (
                          <li key={index} className="flex items-center">
                            <FaCheckCircle className="text-green-500 mr-2 flex-shrink-0" />
                            {ingredient}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="text-gray-500">
                        No ingredients information available.
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "reviews" && (
                  <div id="reviews">
                    {reviews.length > 0 ? (
                      <div className="space-y-6">
                        {reviews.map((review, index) => (
                          <div
                            key={index}
                            className="pb-6 border-b border-gray-200 last:border-b-0"
                          >
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <strong className="text-gray-900">
                                  {review.user?.name || "Anonymous"}
                                </strong>
                                <div className="flex text-yellow-400 mt-1">
                                  {renderStars(review.rating)}
                                </div>
                              </div>
                              <span className="text-sm text-gray-500">
                                {new Date(review.date).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-gray-700">{review.comment}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <FaCommentSlash className="text-6xl text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500 mb-4">
                          No reviews yet. Be the first to review this product!
                        </p>
                        <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
                          Write a Review
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Related Products */}
      <section className="mt-12">
        <h3 className="text-2xl font-bold mb-6">You May Also Like</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {relatedProducts.map((product) => (
            <div key={product._id}>
              {/* GroceryProductCard component would go here */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <p className="text-gray-500">Related product: {product.name}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default GroceryProductDetailPage;
