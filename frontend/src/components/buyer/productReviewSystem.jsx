import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  Star,
  User,
  ThumbsUp,
  Camera,
  Send,
  Filter,
  CheckCircle,
  AlertCircle,
  Clock,
  Image as ImageIcon,
  X,
  Plus,
  ChevronLeft,
  ChevronRight,
  Package,
} from "lucide-react";
import axios from "axios";
import { toast } from "react-hot-toast";

// API configuration
const API_BASE_URL =
  import.meta.env.VITE_BACKEND_URL || "http://localhost:5000/api";

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  };
};

// Rating Stars Component
const RatingStars = ({
  rating,
  size = "w-4 h-4",
  interactive = false,
  onRatingChange = null,
}) => {
  const [hoverRating, setHoverRating] = useState(0);

  return (
    <div className="flex space-x-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${size} cursor-pointer transition-colors ${
            star <= (hoverRating || rating)
              ? "text-yellow-400 fill-current"
              : "text-gray-300"
          }`}
          onMouseEnter={() => interactive && setHoverRating(star)}
          onMouseLeave={() => interactive && setHoverRating(0)}
          onClick={() => interactive && onRatingChange && onRatingChange(star)}
        />
      ))}
    </div>
  );
};

// Rating Distribution Component
const RatingDistribution = ({ ratingDistribution = [], totalReviews = 0 }) => {
  const distribution = [5, 4, 3, 2, 1].map((rating) => {
    const found = ratingDistribution.find((r) => r._id === rating);
    return {
      rating,
      count: found ? found.count : 0,
      percentage:
        totalReviews > 0 ? ((found ? found.count : 0) / totalReviews) * 100 : 0,
    };
  });

  return (
    <div className="space-y-2">
      <h4 className="font-semibold text-gray-800 mb-3 text-sm md:text-base">
        Rating Breakdown
      </h4>
      {distribution.map(({ rating, count, percentage }) => (
        <div key={rating} className="flex items-center space-x-2 md:space-x-3">
          <div className="flex items-center space-x-1 min-w-[40px]">
            <span className="text-xs md:text-sm font-medium">{rating}</span>
            <Star className="w-3 h-3 text-yellow-400 fill-current" />
          </div>
          <div className="flex-1 bg-gray-200 rounded-full h-2">
            <div
              className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
              style={{ width: `${percentage}%` }}
            />
          </div>
          <span className="text-xs md:text-sm text-gray-600 w-6 md:w-8 text-right">
            {count}
          </span>
        </div>
      ))}
    </div>
  );
};

// Single Review Component
const ReviewItem = ({ review, onMarkHelpful, currentUserId }) => {
  const [showFullComment, setShowFullComment] = useState(false);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState("");

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handleImageClick = (imageUrl) => {
    setSelectedImage(imageUrl);
    setImageModalOpen(true);
  };

  return (
    <div className="border-b border-gray-200 pb-6 mb-6 last:border-b-0">
      <div className="flex flex-col sm:flex-row sm:items-start space-y-3 sm:space-y-0 sm:space-x-4">
        {/* User Avatar */}
        <div className="flex-shrink-0">
          {review.user?.avatar ? (
            <img
              src={review.user.avatar}
              alt={review.user.name}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
              <User className="w-5 h-5 text-orange-600" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          {/* Review Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 space-y-2 sm:space-y-0">
            <div className="min-w-0">
              <h4 className="font-semibold text-gray-800 text-sm md:text-base truncate">
                {review.user?.name || "Anonymous User"}
              </h4>
              <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-2 mt-1">
                <RatingStars rating={review.rating} />
                {review.isVerified && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800 w-fit">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Verified Purchase
                  </span>
                )}
              </div>
            </div>
            <span className="text-xs md:text-sm text-gray-500">
              {formatDate(review.createdAt)}
            </span>
          </div>

          {/* Review Title */}
          {review.title && (
            <h5 className="font-medium text-gray-800 mb-2 text-sm md:text-base">
              {review.title}
            </h5>
          )}

          {/* Review Comment */}
          <div className="text-gray-700 mb-3 text-sm md:text-base">
            {review.comment.length > 150 && !showFullComment ? (
              <>
                {review.comment.substring(0, 150)}...
                <button
                  onClick={() => setShowFullComment(true)}
                  className="text-orange-600 hover:text-orange-700 ml-1 font-medium"
                >
                  Read more
                </button>
              </>
            ) : (
              <>
                {review.comment}
                {review.comment.length > 150 && showFullComment && (
                  <button
                    onClick={() => setShowFullComment(false)}
                    className="text-orange-600 hover:text-orange-700 ml-1 font-medium"
                  >
                    Show less
                  </button>
                )}
              </>
            )}
          </div>

          {/* Review Images */}
          {review.images && review.images.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {review.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => handleImageClick(image)}
                  className="relative w-16 h-16 md:w-20 md:h-20 rounded-lg overflow-hidden border border-gray-200 hover:border-orange-300 transition-colors"
                >
                  <img
                    src={image}
                    alt={`Review image ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}

          {/* Review Actions */}
          <div className="flex items-center space-x-4">
            <button
              onClick={() => onMarkHelpful(review._id)}
              disabled={review.user._id === currentUserId}
              className="flex items-center space-x-1 text-gray-600 hover:text-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              <ThumbsUp className="w-4 h-4" />
              <span>Helpful ({review.helpfulVotes || 0})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Image Modal */}
      {imageModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-4xl max-h-full">
            <button
              onClick={() => setImageModalOpen(false)}
              className="absolute -top-10 right-0 text-white hover:text-gray-300"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={selectedImage}
              alt="Review image"
              className="max-w-full max-h-full object-contain rounded-lg"
            />
          </div>
        </div>
      )}
    </div>
  );
};

// Write Review Form Component
const WriteReviewForm = ({
  productId,
  mealPlanId,
  orderId,
  onReviewSubmitted,
  onCancel,
  existingReview = null,
}) => {
  const [formData, setFormData] = useState({
    rating: existingReview?.rating || 0,
    title: existingReview?.title || "",
    comment: existingReview?.comment || "",
  });
  const [images, setImages] = useState([]);
  const [imageFiles, setImageFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);

    if (images.length + files.length > 3) {
      toast.error("You can upload maximum 3 images");
      return;
    }

    files.forEach((file) => {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Each image must be less than 5MB");
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        setImages((prev) => [...prev, reader.result]);
        setImageFiles((prev) => [...prev, file]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    const newErrors = {};

    if (formData.rating === 0) {
      newErrors.rating = "Please select a rating";
    }

    if (!formData.comment.trim()) {
      newErrors.comment = "Please write a review comment";
    } else if (formData.comment.length < 10) {
      newErrors.comment = "Review must be at least 10 characters long";
    } else if (formData.comment.length > 1000) {
      newErrors.comment = "Review must be less than 1000 characters";
    }

    if (formData.title && formData.title.length > 100) {
      newErrors.title = "Title must be less than 100 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    try {
      const submitData = new FormData();
      if (productId) submitData.append("productId", productId);
      if (mealPlanId) submitData.append("mealPlanId", mealPlanId);
      submitData.append("orderId", orderId);
      submitData.append("type", productId ? "product" : "meal-plan");
      submitData.append("rating", formData.rating);
      submitData.append("title", formData.title);
      submitData.append("comment", formData.comment);

      imageFiles.forEach((file) => {
        submitData.append("images", file);
      });

      const url = existingReview
        ? `${API_BASE_URL}/reviews/${existingReview._id}`
        : `${API_BASE_URL}/reviews`;

      const method = existingReview ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: submitData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to submit review");
      }

      toast.success(
        existingReview
          ? "Review updated successfully!"
          : "Review submitted successfully!"
      );
      onReviewSubmitted();
    } catch (error) {
      console.error("Review submission error:", error);
      toast.error(error.message || "Failed to submit review");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-50 rounded-lg p-4 md:p-6">
      <h3 className="text-lg md:text-xl font-semibold text-gray-800 mb-4 md:mb-6">
        {existingReview ? "Update Your Review" : "Write a Review"}
      </h3>

      <form onSubmit={handleSubmit}>
        {/* Rating */}
        <div className="mb-4 md:mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Overall Rating *
          </label>
          <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
            <RatingStars
              rating={formData.rating}
              size="w-6 h-6 md:w-8 md:h-8"
              interactive={true}
              onRatingChange={(rating) => handleInputChange("rating", rating)}
            />
            <span className="text-sm text-gray-600">
              {formData.rating === 0
                ? "Select rating"
                : `${formData.rating} star${formData.rating > 1 ? "s" : ""}`}
            </span>
          </div>
          {errors.rating && (
            <p className="text-red-500 text-sm mt-1">{errors.rating}</p>
          )}
        </div>

        {/* Title */}
        <div className="mb-4 md:mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Review Title (Optional)
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => handleInputChange("title", e.target.value)}
            placeholder="Summarize your experience..."
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm md:text-base"
            maxLength={100}
          />
          <div className="flex justify-between mt-1">
            {errors.title && (
              <p className="text-red-500 text-sm">{errors.title}</p>
            )}
            <p className="text-gray-500 text-sm ml-auto">
              {formData.title.length}/100
            </p>
          </div>
        </div>

        {/* Comment */}
        <div className="mb-4 md:mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Your Review *
          </label>
          <textarea
            value={formData.comment}
            onChange={(e) => handleInputChange("comment", e.target.value)}
            placeholder="Share your experience with this product..."
            rows={4}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm md:text-base"
            maxLength={1000}
          />
          <div className="flex justify-between mt-1">
            {errors.comment && (
              <p className="text-red-500 text-sm">{errors.comment}</p>
            )}
            <p className="text-gray-500 text-sm ml-auto">
              {formData.comment.length}/1000
            </p>
          </div>
        </div>

        {/* Image Upload */}
        <div className="mb-4 md:mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Add Photos (Optional)
          </label>
          <div className="space-y-3">
            {images.length < 3 && (
              <label className="cursor-pointer">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-orange-400 transition-colors">
                  <Camera className="w-6 h-6 md:w-8 md:h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-xs md:text-sm text-gray-600">
                    Click to upload images (Max 3, 5MB each)
                  </p>
                </div>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            )}

            {/* Image Preview */}
            {images.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {images.map((image, index) => (
                  <div key={index} className="relative">
                    <img
                      src={image}
                      alt={`Preview ${index + 1}`}
                      className="w-16 h-16 md:w-20 md:h-20 object-cover rounded-lg border"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-orange-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 text-sm md:text-base"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Submitting...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>
                  {existingReview ? "Update Review" : "Submit Review"}
                </span>
              </>
            )}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors text-sm md:text-base"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

// Main Reviews System Component
const ProductReviewsSystem = ({
  productId,
  mealPlanId,
  productName,
  onReviewSubmitted,
}) => {
  console.log("ProductReviewsSystem rendered with:", {
    productId,
    mealPlanId,
    productName,
  });

  const [reviews, setReviews] = useState([]);
  const [ratingDistribution, setRatingDistribution] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pages: 1,
    total: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters and UI state
  const [filters, setFilters] = useState({
    rating: "",
    sortBy: "createdAt",
    page: 1,
  });
  const [showWriteReview, setShowWriteReview] = useState(false);
  const [showOrderReviewForm, setShowOrderReviewForm] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [userOrders, setUserOrders] = useState([]);
  const [canWriteReview, setCanWriteReview] = useState(false);
  const [userReview, setUserReview] = useState(null);

  // Redux state
  const user = useSelector((state) => state.auth?.user);

  // Fetch reviews
  const fetchReviews = async () => {
    try {
      setLoading(true);
      let url = "";
      if (productId) {
        const queryParams = new URLSearchParams({
          page: filters.page,
          limit: 10,
          sortBy: filters.sortBy,
          ...(filters.rating && { rating: filters.rating }),
        });
        url = `${API_BASE_URL}/reviews/product/${productId}?${queryParams}`;
      } else if (mealPlanId) {
        url = `${API_BASE_URL}/reviews/plan/${mealPlanId}`;
      }

      const response = await fetch(url, getAuthHeaders());
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch reviews");
      }

      if (productId) {
        setReviews(data.data.reviews);
        setRatingDistribution(data.data.ratingDistribution);
        setPagination(data.data.pagination);
      } else if (mealPlanId) {
        setReviews(data.data);
        setRatingDistribution([]); // Optionally implement for meal plans
        setPagination({ current: 1, pages: 1, total: data.data.length });
      }
    } catch (err) {
      setError(err.message);
      console.error("Error fetching reviews:", err);
    } finally {
      setLoading(false);
    }
  };

  // Check if user can write review
  const checkReviewEligibility = async () => {
    if (!user) return;

    try {
      console.log("Checking review eligibility for product:", productId);

      // Fetch user's orders to check if they bought this product
      const ordersResponse = await fetch(
        `${API_BASE_URL}/orders/my-orders`,
        getAuthHeaders()
      );
      const ordersData = await ordersResponse.json();

      if (ordersResponse.ok) {
        console.log("User orders:", ordersData.orders);

        const eligibleOrders =
          ordersData.orders?.filter(
            (order) =>
              [
                "confirmed",
                "preparing",
                "ready",
                "out-for-delivery",
                "delivered",
                "shipped",
              ].includes(order.status) &&
              order.items.some(
                (item) =>
                  item.product === productId || item.product._id === productId
              )
          ) || [];

        console.log("Eligible orders:", eligibleOrders);
        setUserOrders(eligibleOrders);
        setCanWriteReview(eligibleOrders.length > 0);
      }

      // Check if user already has a review
      const userReviewsResponse = await fetch(
        `${API_BASE_URL}/reviews/my-reviews`,
        getAuthHeaders()
      );
      const userReviewsData = await userReviewsResponse.json();

      if (userReviewsResponse.ok) {
        const existingReview = userReviewsData.data?.find(
          (review) =>
            review.product === productId || review.product._id === productId
        );
        setUserReview(existingReview);
      }
    } catch (err) {
      console.error("Error checking review eligibility:", err);
    }
  };

  // Mark review as helpful
  const markReviewHelpful = async (reviewId) => {
    if (!user) {
      toast.error("Please login to mark reviews as helpful");
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/reviews/${reviewId}/helpful`,
        {
          method: "PUT",
          ...getAuthHeaders(),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to mark review as helpful");
      }

      // Update the review in the list
      setReviews((prev) =>
        prev.map((review) =>
          review._id === reviewId
            ? { ...review, helpfulVotes: data.data.helpfulVotes }
            : review
        )
      );

      toast.success("Thank you for your feedback!");
    } catch (err) {
      toast.error(err.message);
    }
  };

  // Handle filter changes
  const handleFilterChange = (filterType, value) => {
    setFilters((prev) => ({
      ...prev,
      [filterType]: value,
      page: 1, // Reset to first page when filter changes
    }));
  };

  // Handle pagination
  const handlePageChange = (page) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  // Calculate average rating
  const averageRating =
    ratingDistribution.length > 0
      ? ratingDistribution.reduce(
          (sum, item) => sum + item._id * item.count,
          0
        ) / ratingDistribution.reduce((sum, item) => sum + item.count, 0)
      : 0;

  const totalReviews = ratingDistribution.reduce(
    (sum, item) => sum + item.count,
    0
  );

  // Effects
  useEffect(() => {
    fetchReviews();
  }, [filters, productId, mealPlanId]);

  useEffect(() => {
    checkReviewEligibility();
  }, [user, productId, mealPlanId]);

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 md:p-6 text-center">
        <AlertCircle className="w-8 h-8 md:w-12 md:h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-base md:text-lg font-semibold text-red-800 mb-2">
          Error Loading Reviews
        </h3>
        <p className="text-red-600 text-sm md:text-base">{error}</p>
        <button
          onClick={fetchReviews}
          className="mt-4 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm md:text-base"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Reviews Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {/* Overall Rating */}
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
              {averageRating.toFixed(1)}
            </div>
            <RatingStars
              rating={Math.round(averageRating)}
              size="w-5 h-5 md:w-6 md:h-6"
            />
            <p className="text-gray-600 mt-2 text-sm md:text-base">
              Based on {totalReviews} review{totalReviews !== 1 ? "s" : ""}
            </p>
          </div>

          {/* Rating Distribution */}
          <div className="md:col-span-2">
            <RatingDistribution
              ratingDistribution={ratingDistribution}
              totalReviews={totalReviews}
            />
          </div>
        </div>

        {/* Write Review Button */}
        {user && canWriteReview && !userReview && (
          <div className="mt-4 md:mt-6 pt-4 md:pt-6 border-t border-gray-200">
            <button
              onClick={() => setShowWriteReview(true)}
              className="w-full sm:w-auto bg-orange-600 text-white px-4 md:px-6 py-2 md:py-3 rounded-lg font-medium hover:bg-orange-700 transition-colors flex items-center justify-center space-x-2 text-sm md:text-base"
            >
              <Plus className="w-4 h-4 md:w-5 md:h-5" />
              <span>Write a Review</span>
            </button>
          </div>
        )}

        {userReview && (
          <div className="mt-4 md:mt-6 pt-4 md:pt-6 border-t border-gray-200">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 md:p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                <div>
                  <h4 className="font-medium text-blue-800 text-sm md:text-base">
                    You've already reviewed this product
                  </h4>
                  <p className="text-blue-600 text-xs md:text-sm">
                    Click edit to update your review
                  </p>
                </div>
                <button
                  onClick={() => setShowWriteReview(true)}
                  className="bg-blue-600 text-white px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm hover:bg-blue-700 transition-colors w-full sm:w-auto"
                >
                  Edit Review
                </button>
              </div>
            </div>
          </div>
        )}

        {user && !canWriteReview && !userReview && (
          <div className="mt-4 md:mt-6 pt-4 md:pt-6 border-t border-gray-200">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 md:p-4">
              <div className="flex items-center space-x-3">
                <Package className="w-4 h-4 md:w-5 md:h-5 text-gray-500 flex-shrink-0" />
                <div>
                  <p className="text-gray-600 text-sm md:text-base">
                    You can write a review after purchasing and receiving this
                    product.
                  </p>
                  <p className="text-gray-500 text-xs md:text-sm mt-1">
                    Orders must be confirmed, shipped, or delivered to be
                    eligible for review.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Write Review Form */}
      {showWriteReview && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Write a Review
          </h3>

          {userOrders.length === 0 ? (
            <div className="text-center py-8">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">
                You need to purchase this product to write a review.
              </p>
              <button
                onClick={() => setShowWriteReview(false)}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Close
              </button>
            </div>
          ) : userOrders.length === 1 ? (
            <WriteReviewForm
              productId={productId}
              mealPlanId={mealPlanId}
              orderId={userOrders[0]._id}
              existingReview={userReview}
              onReviewSubmitted={() => {
                setShowWriteReview(false);
                fetchReviews();
                checkReviewEligibility();
                if (onReviewSubmitted) {
                  onReviewSubmitted();
                }
              }}
              onCancel={() => setShowWriteReview(false)}
            />
          ) : (
            <div>
              <p className="text-gray-600 mb-4">
                You have multiple orders for this product. Please select which
                order you'd like to review:
              </p>
              <div className="space-y-3 mb-6">
                {userOrders.map((order) => (
                  <div
                    key={order._id}
                    className="border border-gray-200 rounded-lg p-4 hover:border-orange-300 transition-colors cursor-pointer"
                    onClick={() => {
                      console.log("Order selected for review:", order);
                      setShowWriteReview(false);
                      // Show review form for selected order
                      setSelectedOrder(order);
                      setShowOrderReviewForm(true);
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-800">
                          Order #{order.orderNumber}
                        </p>
                        <p className="text-sm text-gray-600">
                          {new Date(order.createdAt).toLocaleDateString()} -{" "}
                          {order.status}
                        </p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setShowWriteReview(false)}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      )}

      {/* Order-specific Review Form */}
      {showOrderReviewForm && selectedOrder && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">
              Review for Order #{selectedOrder.orderNumber}
            </h3>
            <button
              onClick={() => {
                setShowOrderReviewForm(false);
                setSelectedOrder(null);
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <WriteReviewForm
            productId={productId}
            mealPlanId={mealPlanId}
            orderId={selectedOrder._id}
            existingReview={userReview}
            onReviewSubmitted={() => {
              setShowOrderReviewForm(false);
              setSelectedOrder(null);
              fetchReviews();
              checkReviewEligibility();
              if (onReviewSubmitted) {
                onReviewSubmitted();
              }
            }}
            onCancel={() => {
              setShowOrderReviewForm(false);
              setSelectedOrder(null);
            }}
          />
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 md:p-4">
        <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">
              Filter by:
            </span>
          </div>

          <select
            value={filters.rating}
            onChange={(e) => handleFilterChange("rating", e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          >
            <option value="">All Ratings</option>
            <option value="5">5 Stars</option>
            <option value="4">4 Stars</option>
            <option value="3">3 Stars</option>
            <option value="2">2 Stars</option>
            <option value="1">1 Star</option>
          </select>

          <select
            value={filters.sortBy}
            onChange={(e) => handleFilterChange("sortBy", e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          >
            <option value="createdAt">Most Recent</option>
            <option value="rating">Highest Rating</option>
            <option value="helpful">Most Helpful</option>
          </select>
        </div>
      </div>

      {/* Reviews List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4 md:p-6">
          <h3 className="text-lg md:text-xl font-semibold text-gray-800 mb-4 md:mb-6">
            Customer Reviews ({totalReviews})
          </h3>

          {loading ? (
            <div className="space-y-4 md:space-y-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="flex space-x-4">
                    <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/6 mb-3"></div>
                      <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-8 md:py-12">
              <div className="w-16 h-16 md:w-24 md:h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="w-8 h-8 md:w-10 md:h-10 text-gray-400" />
              </div>
              <h4 className="text-base md:text-lg font-semibold text-gray-800 mb-2">
                No Reviews Yet
              </h4>
              <p className="text-gray-600 mb-4 md:mb-6 text-sm md:text-base">
                Be the first to review this product!
              </p>
              {user && canWriteReview && !userReview && (
                <button
                  onClick={() => setShowWriteReview(true)}
                  className="bg-orange-600 text-white px-4 md:px-6 py-2 md:py-3 rounded-lg font-medium hover:bg-orange-700 transition-colors text-sm md:text-base"
                >
                  Write First Review
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4 md:space-y-6">
              {reviews.map((review) => (
                <ReviewItem
                  key={review._id}
                  review={review}
                  onMarkHelpful={markReviewHelpful}
                  currentUserId={user?._id}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex justify-center mt-6 md:mt-8 pt-4 md:pt-6 border-t border-gray-200">
              <div className="flex items-center space-x-1 md:space-x-2">
                <button
                  onClick={() => handlePageChange(filters.page - 1)}
                  disabled={filters.page === 1}
                  className="px-3 py-2 md:px-4 md:py-2 border border-gray-300 rounded-lg text-xs md:text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">Previous</span>
                </button>

                {[...Array(pagination.pages)].map((_, index) => {
                  const page = index + 1;
                  // Show only current page, first page, last page, and pages around current
                  if (
                    page === 1 ||
                    page === pagination.pages ||
                    (page >= filters.page - 1 && page <= filters.page + 1)
                  ) {
                    return (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`px-3 py-2 md:px-4 md:py-2 rounded-lg text-xs md:text-sm font-medium transition-colors ${
                          page === filters.page
                            ? "bg-orange-600 text-white"
                            : "text-gray-700 hover:bg-gray-50 border border-gray-300"
                        }`}
                      >
                        {page}
                      </button>
                    );
                  } else if (
                    page === filters.page - 2 ||
                    page === filters.page + 2
                  ) {
                    return (
                      <span key={page} className="px-2 text-gray-500">
                        ...
                      </span>
                    );
                  }
                  return null;
                })}

                <button
                  onClick={() => handlePageChange(filters.page + 1)}
                  disabled={filters.page === pagination.pages}
                  className="px-3 py-2 md:px-4 md:py-2 border border-gray-300 rounded-lg text-xs md:text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                >
                  <span className="hidden sm:inline">Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductReviewsSystem;
